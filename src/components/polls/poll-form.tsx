"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function PollForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [loading, setLoading] = useState(false)

  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index))
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error("Poll title is required")
    if (options.length < 2) return toast.error("Add at least 2 options")
    if (options.some(opt => !opt.trim())) return toast.error("All options must have text")

    setLoading(true)
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to create a poll")

      // Insert poll
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .insert({ title, description: description || null, user_id: user.id })
        .select()
        .single()

      if (pollError || !pollData) throw pollError || new Error("Failed to create poll")

      // Insert options
      const optionsPayload = options.map(opt => ({
        poll_id: pollData.id,
        text: opt,
        votes: 0
      }))

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsPayload)

      if (optionsError) throw optionsError

      toast.success("Poll created successfully!")

      // Reset form
      setTitle("")
      setDescription("")
      setOptions(["", ""])

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create poll")
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
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={opt}
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
        {loading ? "Creating poll..." : "Create Poll"}
      </Button>
    </form>
  )
}