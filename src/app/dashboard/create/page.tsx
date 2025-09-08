"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase/supabase"
import ProtectedRoute from "@/components/ProtectedRoute"

// Define the schema for the form, ensuring at least two options are provided.
const pollFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string().min(1, "Option cannot be empty."),
      })
    )
    .min(2, "You must have at least two options."),
})

type PollFormValues = z.infer<typeof pollFormSchema>

export default function CreatePollPage() {
  const router = useRouter()
  const { user } = useAuth()

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ value: "" }, { value: "" }],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  })

  const onSubmit = async (data: PollFormValues) => {
    if (!user) {
      toast.error("You must be logged in to create a poll.")
      return
    }

    try {
      // Step 1: Insert the poll into the 'polls' table and get its ID
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .insert({
          title: data.title,
          description: data.description,
          user_id: user.id,
        })
        .select("id")
        .single()

      if (pollError) throw pollError
      if (!pollData) throw new Error("Failed to create poll and retrieve its ID.")

      // Step 2: Prepare and insert the poll options
      const optionsToInsert = data.options.map((option) => ({
        text: option.value,
        poll_id: pollData.id,
      }))

      const { error: optionsError } = await supabase.from("poll_options").insert(optionsToInsert)

      if (optionsError) {
        // If options fail to insert, delete the poll to avoid orphaned data.
        await supabase.from("polls").delete().match({ id: pollData.id })
        throw optionsError
      }

      toast.success("Poll created successfully!")
      form.reset() // Reset the form to default values
      router.push("/polls") // Redirect to the polls list page
    } catch (error) {
      console.error("Error creating poll:", error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An error occurred while creating the poll")
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create a New Poll</CardTitle>
            <CardDescription>Fill out the details below to create your poll.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Title</FormLabel>
                      <FormControl>
                        <Input placeholder="What's your favorite color?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="A brief description of your poll" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Options</FormLabel>
                  <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input {...field} placeholder={`Option ${index + 1}`} />
                              </FormControl>
                              {fields.length > 2 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
                    Add Option
                  </Button>
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create Poll"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}