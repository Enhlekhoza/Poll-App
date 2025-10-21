"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { updateProfile } from "@/lib/actions/user-actions"

export default function ProfileAvatarUpload() {
  const { user } = useAuth()
  const { update } = useSession()
  const [avatar, setAvatar] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0])
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatar) return

    setUploading(true)
    const formData = new FormData()
    formData.append("avatar", avatar)

    const { success, error, user: updatedUser } = await updateProfile(formData)
    setUploading(false)

    if (!success) {
      toast.error(error || "Failed to upload avatar")
    } else {
      toast.success("Avatar updated successfully")
      if (updatedUser?.image) {
        await update({ image: updatedUser.image })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
          <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Label htmlFor="avatar">Upload a new avatar</Label>
          <Input id="avatar" type="file" onChange={handleAvatarChange} accept="image/*" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleAvatarUpload} disabled={!avatar || uploading}>
          {uploading ? "Uploading..." : "Upload Avatar"}
        </Button>
      </div>
    </div>
  )
}