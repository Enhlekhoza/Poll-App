"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, ListChecks, Settings, BarChart2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function DashboardHomePage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-4">Welcome, {user?.email || "User"}!</h1>
      <p className="text-lg text-gray-600 mb-8">
        Manage your polls, create new ones, and view analytics.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <PlusCircle className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Create New Poll</CardTitle>
            <CardDescription>Start a new poll to gather opinions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/create">
              <Button className="w-full">Create Poll</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <ListChecks className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>My Polls</CardTitle>
            <CardDescription>View and manage all your created polls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/polls">
              <Button className="w-full">View My Polls</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <BarChart2 className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>Analytics</CardTitle>
            <CardDescription>See detailed insights for your polls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/analytics">
              <Button className="w-full" variant="outline">Go to Analytics</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <Settings className="h-8 w-8 text-gray-600 mb-2" />
            <CardTitle>Settings</CardTitle>
            <CardDescription>Adjust your account and application settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button className="w-full" variant="outline">Go to Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
