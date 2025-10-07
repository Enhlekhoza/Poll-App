"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createPoll } from "@/lib/actions/poll-actions"
import { useRouter } from "next/navigation"

export function PollForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) => {
    // Don't allow removing if only 2 options remain
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }
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
    const formData = new FormData()
    formData.append("title", title)
    if (description) {
      formData.append("description", description)
    }
    options.forEach(option => formData.append("options", option))
    if (dueDate) {
      formData.append("due_date", new Date(dueDate).toISOString())
    }

    const result = await createPoll(formData)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Poll created successfully!")
      // Reset form
      setTitle("")
      setDescription("")
      setOptions(["", ""])
      setDueDate("")
      router.push(`/dashboard/polls`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Poll Title</Label>
        <Textarea
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter poll question"
          disabled={loading}
          className="min-h-[80px] text-base"
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
          className="min-h-[100px]"
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
        {loading ? "Creating poll..." : "Create Poll"}
      </Button>
    </form>
  )
}
