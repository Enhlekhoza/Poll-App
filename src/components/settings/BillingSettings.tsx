"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BillingSettings() {
  // For now, we'll just display a static plan.
  const currentPlan = "Free"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your billing and subscription details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium">Current Plan</p>
            <p className="text-2xl font-bold">{currentPlan}</p>
          </div>
          <Button>Upgrade to Premium</Button>
        </div>
      </CardContent>
    </Card>
  )
}