"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeFile } from "fs/promises"
import { join } from "path"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
})

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated" }
  }

  const name = formData.get("name") as string | null
  const avatar = formData.get("avatar") as File | null

  const parsed = updateProfileSchema.safeParse({
    name: name || undefined,
  })

  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const fieldErrors = Object.entries(flat.fieldErrors).flatMap(
      ([field, messages]) => (messages || []).map((msg) => `${field}: ${msg}`),
    )
    const formErrors = flat.formErrors || []
    return {
      success: false,
      error: [...fieldErrors, ...formErrors].join(", ") || "Invalid input",
    }
  }

  let imagePath: string | undefined

  if (avatar) {
    try {
      const bytes = await avatar.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `${Date.now()}-${avatar.name}`
      const path = join(process.cwd(), "public", "avatars", filename)
      await writeFile(path, buffer)
      imagePath = `/avatars/${filename}`
    } catch (error) {
      console.error("Failed to upload avatar:", error)
      return { success: false, error: "Failed to upload avatar" }
    }
  }

  const { name: parsedName } = parsed.data

  const updatedUser = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsedName !== undefined ? { name: parsedName } : {}),
      ...(imagePath !== undefined ? { image: imagePath } : {}),
    },
  })

  // Revalidate settings/dashboard
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")

  return { success: true, user: updatedUser }
}

const joinPremiumWaitlistSchema = z.object({
  feature: z.string().min(1, "Feature name is required"),
})

export async function joinPremiumWaitlist(feature: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated" }
  }

  const parsed = joinPremiumWaitlistSchema.safeParse({ feature })

  if (!parsed.success) {
    return { success: false, error: "Invalid feature name" }
  }

  try {
    await db.premiumWaitlist.create({
      data: {
        userId: session.user.id,
        feature: parsed.data.feature,
      },
    })
    return { success: true }
  } catch (error) {
    // Handle potential unique constraint violation gracefully
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return { success: true, message: "You are already on the waitlist for this feature." }
    }
    console.error("Failed to join premium waitlist:", error)
    return { success: false, error: "Could not join the waitlist. Please try again." }
  }
}





