"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Vote, FileText, ListChecks, Calendar, Tag as TagIcon, Upload, Wand2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createPoll } from "@/lib/actions/poll-actions";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PremiumModal } from "@/components/layout/PremiumModal";
import { db } from "@/lib/prisma";

// Define the schema for the form, ensuring at least two options are provided.
const pollFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(), // comma-separated for now
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  options: z
    .array(
      z.object({
        value: z.string().min(1, "Option cannot be empty."),
      })
    )
    .min(2, "You must have at least two options."),
});

type PollFormValues = z.infer<typeof pollFormSchema>;

export default function CreatePollPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [privatePollCount, setPrivatePollCount] = useState(0);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  useEffect(() => {
    async function fetchPrivatePollCount() {
      if (session?.user?.id) {
        const response = await fetch(`/api/user/private-poll-count`);
        const data = await response.json();
        if (response.ok) {
          setPrivatePollCount(data.count);
        }
      }
    }
    fetchPrivatePollCount();
  }, [session]);

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      tags: "",
      visibility: "PUBLIC",
      options: [{ value: "" }, { value: "" }],
    },
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const handleGenerate = async () => {
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data?.error || "AI generation failed";
        throw new Error(errorMessage);
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data?.title) form.setValue("title", data.title);
      if (data?.description) form.setValue("description", data.description);
      if (Array.isArray(data?.options) && data.options.length > 1) {
        replace(data.options.map((v: string) => ({ value: v })));
      }
      toast.success("AI suggestions applied!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: PollFormValues) => {
    if (
      session?.user?.plan === "FREE" &&
      data.visibility === "PRIVATE" &&
      privatePollCount >= 3
    ) {
      setIsPremiumModalOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.dueDate) {
      try {
        const iso = new Date(data.dueDate).toISOString();
        formData.append("due_date", iso);
      } catch {
        /* ignore invalid date */
      }
    }
    if (data.tags) formData.append("tags", data.tags);
    formData.append("visibility", data.visibility);
    data.options.forEach((option) => formData.append("options", option.value.trim()));

    const result = await createPoll(formData);

    if (!result.success) {
      toast.error(result.error ?? "Failed to create poll");
    } else {
      toast.success("Poll created successfully!");
      form.reset();
      router.push(`/dashboard/polls`);
    }
  };

  // file import handler: removed unused fileInputRef; safe parsing without `any`
  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();

      let title: string | undefined;
      let description: string | undefined;
      let options: string[] | undefined;
      let dueDate: string | undefined;
      let tags: string[] | undefined;

      const safeToStr = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text) as unknown;
        if (typeof parsed === "object" && parsed !== null) {
          const p = parsed as Record<string, unknown>;
          title = safeToStr(p.title ?? p.question);
          description = safeToStr(p.description ?? p.desc) || undefined;
          if (Array.isArray(p.options)) {
            options = p.options
              .map((o) => (typeof o === "object" && o !== null ? safeToStr((o as any).value ?? (o as any).text) : safeToStr(o)))
              .filter(Boolean);
          }
          if (p.dueDate || p.due_date) dueDate = safeToStr(p.dueDate ?? p.due_date);
          if (Array.isArray(p.tags)) tags = p.tags.map((t) => safeToStr(t)).filter(Boolean);
        }
      } else if (file.name.endsWith(".csv")) {
        const rows = text.split(/\r?\n/).map((r) => r.trim()).filter((r) => r.length > 0);
        if (rows.length > 0) title = rows[0];
        if (rows.length > 2) {
          description = rows[1];
          const rest = rows.slice(2);
          if (rest[0]?.toLowerCase().startsWith("#")) {
            const meta = rest.shift() as string;
            const dueMatch = meta.match(/due:(\S+)/i);
            if (dueMatch) dueDate = dueMatch[1];
            const tagsMatch = meta.match(/tags:([^#]+)/i);
            if (tagsMatch) tags = tagsMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
          }
          options = rest;
        } else if (rows.length > 1) {
          options = rows.slice(1);
        }
      } else {
        // txt
        const lines = text.split(/\r?\n/);
        const cleaned = lines.map((l) => l.trim());
        const nonEmptyIdx = cleaned.findIndex((l) => l.length > 0);
        if (nonEmptyIdx >= 0) {
          title = cleaned[nonEmptyIdx];
          const rest = cleaned.slice(nonEmptyIdx + 1);
          if (rest[0]?.startsWith("#")) {
            const meta = rest.shift() as string;
            const dueMatch = meta.match(/due:(\S+)/i);
            if (dueMatch) dueDate = dueMatch[1];
            const tagsMatch = meta.match(/tags:([^#]+)/i);
            if (tagsMatch) tags = tagsMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
          }
          const blankIdx = rest.findIndex((l) => l.length === 0);
          if (blankIdx >= 0) {
            const maybeDesc = rest.slice(0, blankIdx).join(" ").trim();
            description = maybeDesc.length > 0 ? maybeDesc : undefined;
            options = rest.slice(blankIdx + 1).filter((l) => l.length > 0);
          } else {
            options = rest.filter((l) => l.length > 0);
          }
        }
      }

      if (title) form.setValue("title", String(title));
      if (description) form.setValue("description", String(description));
      if (dueDate) {
        try {
          const d = new Date(dueDate);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          form.setValue("dueDate", local);
        } catch {
          /* ignore */
        }
      }
      if (tags && tags.length > 0) form.setValue("tags", tags.join(", "));
      if (options && options.length > 0) {
        const normalized = options.map((v) => ({ value: String(v) }));
        replace(normalized.length >= 2 ? normalized : [...normalized, { value: "" }]);
      }
      toast.success("Imported content applied");
    } catch (err) {
      console.error("handleImportFile error:", err);
      toast.error("Failed to import file");
    }
  };

  const handleDownloadTemplate = (type: "json" | "csv" | "txt") => {
    const filename = `poll-template.${type}`;
    let content = "";
    if (type === "json") {
      content = JSON.stringify(
        {
          title: "What&apos;s your favorite programming language?",
          description: "Pick the one you use most often.",
          options: ["JavaScript", "Python", "Java", "Go"],
        },
        null,
        2
      );
    } else if (type === "csv") {
      content = ["What's your favorite programming language?", "Pick the one you use most often.", "JavaScript", "Python", "Java", "Go"].join("\n");
    } else {
      content = ["What's your favorite programming language?", "", "Pick the one you use most often.", "", "JavaScript", "Python", "Java", "Go"].join("\n");
    }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        featureName="Private Polls"
        featureDescription="Create unlimited private polls with our Premium plan."
      />
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
              <CardDescription className="text-base">Fill in the information below to create your poll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">


                  {/* AI Assist & Import Section - Only show for premium users */}
                  {session?.user?.plan === "PREMIUM" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-600" />
                        AI Assist & Import (Premium)
                      </h3>
                      <div className="flex flex-col md:flex-row gap-3">
                        <Input
                          className="flex-1"
                          placeholder="Describe your poll (e.g., Feedback on new feature launch)"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleGenerate();
                            }
                          }}
                          disabled={isGenerating}
                        />
                        <Button
                          type="button"
                          className="md:w-auto"
                          onClick={handleGenerate}
                          disabled={isGenerating || !aiPrompt.trim()}
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        <input
                          type="file"
                          accept=".txt,.csv,.json"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImportFile(f);
                          }}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" /> Choose file
                        </Button>
                      </div>
                    </div>
                  )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="file"
                        accept=".txt,.csv,.json"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImportFile(f);
                        }}
                        className="block w-full md:w-auto text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Choose file
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadTemplate("json")}>
                        Download JSON template
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadTemplate("csv")}>
                        Download CSV template
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadTemplate("txt")}>
                        Download TXT template
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500 space-y-2 bg-gray-50 p-3 rounded-md">
  <p>
    <strong>JSON</strong>: {"{\"title\",\"description\",\"options\":[]}"}
  </p>
  <p>
    <strong>CSV</strong>: first row = title, second = description (optional), others = options; optional meta row starting with # e.g.{" "}
    {"# due:2025-10-07T10:00,tags:alpha,beta"}
  </p>
  <p>
    <strong>TXT</strong>:{" "}
    first line = title; optional meta line starting with #; blank line; optional description; blank line; options
  </p>
</div>
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
                            <Textarea
                              placeholder={"What\u0027s your favorite programming language?"}
                              className="min-h-[80px] text-lg py-3 px-4 border-2 border-gray-200 focus:border-blue-500 transition-colors"
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

                  {/* Due Date, Tags, and Visibility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">Due date (Optional)</h3>
                      </div>
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="datetime-local" className="border-2 border-gray-200 focus:border-blue-500" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">Tags (Optional)</h3>
                      </div>
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="e.g. marketing, survey, 2025" className="border-2 border-gray-200 focus:border-blue-500" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900">Visibility</h3>
                      </div>
                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PUBLIC">Public</SelectItem>
                                <SelectItem value="PRIVATE">Private</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                                  <Input {...field} placeholder={`Enter option ${index + 1}`} className="flex-1 border-2 border-gray-200 focus:border-blue-500 transition-colors" />
                                </FormControl>
                                {fields.length > 2 && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50">
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
                    <Button type="submit" disabled={form.formState.isSubmitting} className="w-full py-3 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                      {form.formState.isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
  );
}