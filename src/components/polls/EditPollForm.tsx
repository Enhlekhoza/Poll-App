"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { updatePoll } from "@/lib/actions/poll-actions"
import { useRouter } from "next/navigation"
import { Poll } from "@/types/index"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus } from "lucide-react"
import { useSession } from "next-auth/react"

interface EditPollFormProps {
  poll: Poll
}

export function EditPollForm({ poll }: EditPollFormProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState(poll.title)
  const [description, setDescription] = useState(poll.description || "")
  const [options, setOptions] = useState<Array<{ id?: string; text: string }>>(
    poll.options.map(opt => ({ id: opt.id, text: opt.text }))
  )
  const [dueDate, setDueDate] = useState<string>(() => {
    if (!poll.dueDate) return ""
    const date = new Date(poll.dueDate)
    // Adjust for timezone offset
    const timezoneOffset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - timezoneOffset)
    return localDate.toISOString().slice(0, 16)
  })
  const [visibility, setVisibility] = useState(poll.visibility || "PUBLIC")
  const [tags, setTags] = useState(
    poll.tags?.map(t => t.tag.name).join(", ") || ""
  )
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const addOption = () => setOptions([...options, { text: "" }])
  const removeOption = (index: number) => {
    // Don't allow removing if only 2 options remain
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index].text = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error("Poll title is required")
    if (options.length < 2) return toast.error("Add at least 2 options")
    if (options.some(opt => !opt.text.trim())) return toast.error("All options must have text")

    setLoading(true)
    const formData = new FormData()
    formData.append("title", title)
    if (description) {
      formData.append("description", description)
    }
    options.forEach(option => {
      formData.append("options", option.text)
      if (option.id) {
        formData.append("optionIds", option.id)
      }
    })
    if (dueDate) {
      formData.append("due_date", new Date(dueDate).toISOString())
    }
    formData.append("visibility", visibility)
    formData.append("tags", tags)

    const result = await updatePoll(poll.id, formData)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error instanceof Error ? result.error.message : String(result.error))
    } else {
      toast.success("Poll updated successfully!")
      router.push(`/dashboard/polls/${poll.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Poll Title</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter poll question"
          disabled={loading}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        {options.map((opt, index) => (
          <div key={opt.id || index} className="flex items-center space-x-2">
            <Input
              value={opt.text}
              onChange={e => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              disabled={loading}
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeOption(index)}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="e.g. technology, programming, lifestyle"
          disabled={loading}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="visibility">Visibility</Label>
        <Select value={visibility} onValueChange={setVisibility} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public</SelectItem>
            {session?.user?.role &&
              ["PREMIUM_CREATOR", "ADMIN"].includes(session.user.role) && (
                <SelectItem value="UNLISTED">Unlisted</SelectItem>
              )}
          </SelectContent>
        </Select>
        {session?.user?.role &&
          !["PREMIUM_CREATOR", "ADMIN"].includes(session.user.role) &&
          poll.visibility !== "UNLISTED" && (
            <p className="text-xs text-gray-500">
              Upgrade to a Premium account to make polls unlisted.
            </p>
          )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="dueDate">Due Date (Optional)</Label>
        <Input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Updating poll..." : "Update Poll"}
      </Button>
    </form>
  )
}
        