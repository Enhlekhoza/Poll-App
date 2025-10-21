"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Trash2 } from "lucide-react"
import { AdminRoute } from "@/components/AdminRoute"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  id: string
  email: string
  role: string
  createdAt: string
}

interface Poll {
  id: string
  title: string
  author: {
    email: string
  }
  _count: {
    votes: number
    comments: number
  }
  createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [usersRes, pollsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/polls"),
      ])

      if (!usersRes.ok || !pollsRes.ok) {
        throw new Error("Failed to fetch admin data")
      }

      const usersData = await usersRes.json()
      const pollsData = await pollsRes.json()
      setUsers(usersData)
      setPolls(pollsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeletePoll = async (pollId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this poll? This action cannot be undone."
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/polls/${pollId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete poll")
      }

      // If successful, remove the poll from the local state
      setPolls(polls.filter((p) => p.id !== pollId))
    } catch (err) {
      console.error("Error deleting poll:", err)
      // Optionally, show an error message to the user
      alert("Failed to delete the poll. Please try again.")
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      // Update the user's role in the local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      console.error("Error updating role:", err)
      alert("Failed to update the user role. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <AdminRoute>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
        </div>
      </AdminRoute>
    )
  }

  if (error) {
    return (
      <AdminRoute>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <div>
          <h2 className="text-xl font-bold mb-4">Polls Management</h2>
          {/* Polls Table remains the same */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polls.map((poll) => (
                <TableRow key={poll.id}>
                  <TableCell>{poll.title}</TableCell>
                  <TableCell>{poll.author.email}</TableCell>
                  <TableCell>{poll._count.votes}</TableCell>
                  <TableCell>{poll._count.comments}</TableCell>
                  <TableCell>
                    {new Date(poll.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePoll(poll.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">User Management</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(newRole) =>
                        handleRoleChange(user.id, newRole)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="CREATOR">Creator</SelectItem>
                        <SelectItem value="PREMIUM_CREATOR">
                          Premium Creator
                        </SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminRoute>
  )
}
