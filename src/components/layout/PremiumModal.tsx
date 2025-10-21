"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { joinPremiumWaitlist } from "@/lib/actions/user-actions"
import { toast } from "sonner"

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  featureDescription: string
}

export function PremiumModal({
  isOpen,
  onClose,
  featureName,
  featureDescription,
}: PremiumModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNotifyMe = async () => {
    setIsSubmitting(true)
    try {
      const result = await joinPremiumWaitlist(featureName)
      if (result.success) {
        toast.success(
          result.message ||
            "You've been added to the waitlist for this feature!"
        )
        onClose()
      } else {
        toast.error(result.error || "An unexpected error occurred.")
      }
    } catch (error) {
      toast.error("Failed to join the waitlist. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Unlock Premium Feature: {featureName}
          </DialogTitle>
          <DialogDescription>{featureDescription}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            This feature is part of our Premium plan. Get notified when we
            launch our premium features!
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleNotifyMe} disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : "Notify Me"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
