"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from "@/lib/actions/user-actions"

// Safe User type without image
interface SafeUser {
  name?: string | null
  email: string
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { update } = useSession()

  const safeUser: SafeUser = {
    name: user?.name || "",
    email: user?.email || "",
  }

  const [name, setName] = useState(safeUser.name || "")
  const [saving, setSaving] = useState(false)

  const handleLogout = async () => {
    await signOut()
    toast.success("Logged out successfully!")
    router.push("/auth/login")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData()
    if (name) formData.append("name", name)
    const { success, error } = await updateProfile(formData)
    setSaving(false)
    if (!success) {
      toast.error(error || "Failed to update profile")
    } else {
      toast.success("Profile updated")
      try {
        // Refresh NextAuth session so updated name reflects immediately and after reload
        await update({ name })
      } catch {}
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="h-10 flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                  {safeUser.email}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Perform account-related actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}