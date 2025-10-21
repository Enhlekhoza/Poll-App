"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)

  const handleEmailNotificationChange = (checked: boolean) => {
    setEmailNotifications(checked)
    toast.success(`Email notifications ${checked ? "enabled" : "disabled"}`)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notifications</h3>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="email-notifications" className="text-base">
            Email Notifications
          </Label>
          <p className="text-sm text-muted-foreground">
            Receive email notifications for new poll comments and results.
          </p>
        </div>
        <Switch
          id="email-notifications"
          checked={emailNotifications}
          onCheckedChange={handleEmailNotificationChange}
        />
      </div>
    </div>
  )
}