"use client";

import { useEffect, useState } from "react";
import { getTemplates, useTemplate } from "@/lib/actions/template-actions";

interface Template {
  id: string;
  name: string;
  description: string | null;
  options: string[];
  isPublic: boolean;
  createdAt: Date;
  authorId: string;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTemplates();
      if (result.success) {
        setTemplates(result.templates);
      } else {
        setError(result.error || "Failed to load templates");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const result = await useTemplate(templateId);
      if (result.success) {
        return {
          title: result.template.name,
          description: result.template.description || "",
          options: result.template.options
        };
      } else {
        throw new Error(result.error || "Failed to load template");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load template";
      throw new Error(message);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    loadTemplate
  };
}