"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, ListChecks, Settings, BarChart2, Users, ShieldCheck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function DashboardHomePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-4">
        Welcome, {user?.name || user?.email || "User"}!
        {isAdmin && <Badge className="ml-2 bg-blue-600">Admin</Badge>}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {isAdmin 
          ? "Manage users, view analytics, and oversee all polls." 
          : "Vote on polls, leave comments, and track your participation."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Admin-specific cards */}
        {isAdmin && (
          <>
            <Card className="hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <CardHeader>
                <ShieldCheck className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Access administrative controls and user management.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/admin">
                  <Button className="w-full" variant="default">Admin Panel</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage user accounts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/admin/users">
                  <Button className="w-full" variant="default">Manage Users</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}

        {/* Cards for all users */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <ListChecks className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Polls</CardTitle>
            <CardDescription>
              {isAdmin ? "View and manage all polls" : "Vote and participate in polls"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/polls">
              <Button className="w-full">View Polls</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Poll creation for admin users */}
        {isAdmin && (
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
        )}

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <BarChart2 className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>Analytics</CardTitle>
            <CardDescription>See detailed insights for polls.</CardDescription>
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
