"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Poll, PollOption } from "@/types"
import { useRouter } from "next/navigation"

interface EditPollFormProps {
  poll: Poll
}

export function EditPollForm({ poll }: EditPollFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(poll.title)
  const [description, setDescription] = useState(poll.description || "")
  const [options, setOptions] = useState<PollOption[]>(poll.options)
  const [loading, setLoading] = useState(false)

  const addOption = () => setOptions([...options, { id: `new-${Date.now()}`, text: "", votes: 0, poll_id: poll.id }])
  
  const removeOption = (index: number) => {
    // Don't allow removing if only 2 options remain
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }
  
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], text: value }
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error("Poll title is required")
    if (options.length < 2) return toast.error("Add at least 2 options")
    if (options.some(opt => !opt.text.trim())) return toast.error("All options must have text")

    setLoading(true)
    try {
      // Update poll
      const { error: pollError } = await supabase
        .from("polls")
        .update({ title, description: description || null })
        .eq("id", poll.id)

      if (pollError) throw pollError

      // Handle existing options (update)
      const existingOptions = options.filter(opt => !opt.id.startsWith('new-'))
      for (const option of existingOptions) {
        const { error } = await supabase
          .from("poll_options")
          .update({ text: option.text })
          .eq("id", option.id)
        
        if (error) throw error
      }

      // Handle new options (insert)
      const newOptions = options.filter(opt => opt.id.startsWith('new-'))
      if (newOptions.length > 0) {
        const newOptionsPayload = newOptions.map(opt => ({
          poll_id: poll.id,
          text: opt.text,
          votes: 0
        }))

        const { error } = await supabase
          .from("poll_options")
          .insert(newOptionsPayload)

        if (error) throw error
      }

      toast.success("Poll updated successfully!")
      router.refresh() // Refresh the page to show updated data

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update poll")
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
        <Input
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
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption} disabled={loading}>
          Add Option
        </Button>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Updating poll..." : "Update Poll"}
      </Button>
    </form>
  )
}