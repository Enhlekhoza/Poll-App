"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createTemplate } from "@/lib/actions/template-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateTemplatePage() {
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("A poll template must have at least 2 options");
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if all options have values
    if (options.some(opt => !opt.trim())) {
      toast.error("All options must have a value");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.delete("options"); // Remove default options field

    // Add each option individually
    options.forEach(option => {
      formData.append("options", option);
    });

    // Add isPublic value
    formData.set("isPublic", isPublic.toString());

    const result = await createTemplate(formData);
    
    if (result.success) {
      toast.success("Template created successfully");
      router.push("/dashboard/templates");
    } else {
      toast.error(result.error || "Failed to create template");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Poll Template</h1>
        <p className="text-muted-foreground">Create a reusable template for your polls</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Fill in the details for your poll template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="E.g., Customer Satisfaction Survey" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe what this template is for..." 
                rows={3} 
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Poll Options</Label>
                <Button 
                  type="button" 
                  onClick={addOption} 
                  variant="outline" 
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Option
                </Button>
              </div>
              
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="isPublic" 
                checked={isPublic} 
                onCheckedChange={setIsPublic} 
              />
              <Label htmlFor="isPublic">Make this template public</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}