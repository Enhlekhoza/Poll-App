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
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, Vote, FileText, ListChecks } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { createPoll } from "@/lib/actions/poll-actions"

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
    const formData = new FormData()
    formData.append("title", data.title)
    if (data.description) {
      formData.append("description", data.description)
    }
    data.options.forEach(option => formData.append("options", option.value))

    const result = await createPoll(formData)

    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success("Poll created successfully!")
      form.reset() // Reset the form to default values
      if (result.poll) {
        router.push(`/dashboard/polls/${result.poll.id}`) // Redirect to the newly created poll
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Vote className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Poll</h1>
            <p className="text-lg text-gray-600">Engage your audience with interactive polls</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Poll Details
              </CardTitle>
              <CardDescription className="text-base">
                Fill in the information below to create your poll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Title Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">Poll Title</h3>
                    </div>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="What's your favorite programming language?"
                              className="text-lg py-3 px-4 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">Description (Optional)</h3>
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Add a brief description to help people understand your poll better..."
                              className="min-h-[100px] resize-none border-2 border-gray-200 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Options Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">Poll Options</h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ value: "" })}
                        className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <FormField
                          key={field.id}
                          control={form.control}
                          name={`options.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                                </div>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={`Enter option ${index + 1}`}
                                    className="flex-1 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                                  />
                                </FormControl>
                                {fields.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
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

                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <strong>Tip:</strong> You need at least 2 options. The more options you provide, the more engaging your poll will be!
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="w-full py-3 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {form.formState.isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Poll...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Vote className="w-5 h-5" />
                          Create Poll
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}