"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"
import { Poll } from "@/types/index"
import { updatePoll } from "@/lib/actions/poll-actions"

interface EditPollFormProps {
  poll: Poll
}

export function EditPollForm({ poll }: EditPollFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(poll.title)
  const [description, setDescription] = useState(poll.description || "")
  const [options, setOptions] = useState<Poll['options']>(poll.options)
  const [loading, setLoading] = useState(false)

  // Add a new option
  const addOption = () => {
    setOptions([
      ...options,
      { id: `new-${Date.now()}`, text: "", _count: { votes: 0 } },
    ])
  }

  // Remove an option, keeping at least 2
  const removeOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  // Update an option text
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], text: value }
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.trim()) return toast.error("Poll title is required")
    if (options.length < 2) return toast.error("Add at least 2 options")
    if (options.some(opt => !opt.text.trim())) return toast.error("All options must have text")

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      options.forEach(opt => formData.append("options", opt.text))
      options.forEach(opt => formData.append("optionIds", opt.id))

      const { success, error } = await updatePoll(poll.id, formData)

      if (error) {
        // Safely convert error to string
        const errorMessage = typeof error === "string" ? error : JSON.stringify(error)
        throw new Error(errorMessage)
      }

      toast.success("Poll updated successfully!")
      router.refresh() // Refresh page to show updated data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
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
          <div key={opt.id} className="flex items-center space-x-2">
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

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Updating poll..." : "Update Poll"}
      </Button>
    </form>
  )
}