"use client";

import { useState, useEffect } from "react";
import { useTemplates } from "@/hooks/useTemplates";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface TemplateSelectorProps {
  onSelect: (template: { title: string; description?: string; options: string[] }) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const { templates, loading, error } = useTemplates();
  const [selectedId, setSelectedId] = useState<string>("");
  const [localTemplateData, setLocalTemplateData] = useState<any>(null);

  // Check for template data in localStorage (from template page)
  useEffect(() => {
    const savedTemplate = localStorage.getItem("pollTemplate");
    if (savedTemplate) {
      try {
        const templateData = JSON.parse(savedTemplate);
        setLocalTemplateData(templateData);
        // Apply the template data
        onSelect({
          title: templateData.title,
          description: templateData.description,
          options: templateData.options
        });
        // Remove from localStorage to prevent reapplying on refresh
        localStorage.removeItem("pollTemplate");
        toast.success("Template applied successfully");
      } catch (err) {
        console.error("Error parsing template data:", err);
      }
    }
  }, [onSelect]);

  const handleSelectTemplate = async (id: string) => {
    if (!id) return;
    
    setSelectedId(id);
    try {
      const template = templates.find(t => t.id === id);
      if (template) {
        onSelect({
          title: template.name,
          description: template.description || undefined,
          options: template.options
        });
        toast.success(`Template "${template.name}" applied`);
      }
    } catch (err) {
      toast.error("Failed to apply template");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
        <span>Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-2">
        Error loading templates: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {templates.length > 0 ? (
          <>
            <Select value={selectedId} onValueChange={handleSelectTemplate}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center">
                      <span>{template.name}</span>
                      {!template.isPublic && (
                        <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/templates">
                <FileText className="mr-2 h-4 w-4" />
                Manage Templates
              </Link>
            </Button>
          </>
        ) : (
          <div className="w-full">
            <p className="text-sm text-muted-foreground mb-2">
              No templates available. Create your first template to save time when creating similar polls.
            </p>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/templates/create">
                <FileText className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}