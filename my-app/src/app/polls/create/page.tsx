"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function CreatePollForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [loading, setLoading] = useState(false)

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) =>
    setOptions(options.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Call your API or Supabase logic here
      console.log({ title, description, options })
      toast.success("Poll created!")
      setTitle("")
      setDescription("")
      setOptions(["", ""])
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "An error occurred while creating the poll")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Poll Title</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter poll title"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Enter poll description"
        />
      </div>
      <div>
        <Label>Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <Input
              value={option}
              onChange={e => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeOption(index)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption}>
          Add Option
        </Button>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Poll"}
      </Button>
    </form>
  )
}