'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ==================== SCHEMAS ====================
const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  options: z.array(z.string().min(1)).min(2),
  isPublic: z.boolean().default(false),
});

// ==================== HELPER FUNCTIONS ====================
async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  return session.user.id;
}

// ==================== CREATE TEMPLATE ====================
export async function createTemplate(formData: FormData) {
  try {
    const userId = await getUserId();
    const descRaw = formData.get('description');
    const isPublicRaw = formData.get('isPublic');

    const validated = createTemplateSchema.safeParse({
      name: formData.get('name'),
      description: typeof descRaw === 'string' ? descRaw : undefined,
      options: formData.getAll('options'),
      isPublic: isPublicRaw === 'true',
    });

    if (!validated.success) {
      const errors = validated.error.flatten();
      const allErrors = [
        ...Object.entries(errors.fieldErrors).flatMap(([f, m]) => (m || []).map(msg => `${f}: ${msg}`)),
        ...(errors.formErrors || []),
      ];
      return { success: false, error: allErrors.join(', ') };
    }

    const { name, description, options, isPublic } = validated.data;

    const template = await db.pollTemplate.create({
      data: {
        name,
        description: description ?? null,
        authorId: userId,
        isPublic,
        options: JSON.stringify(options),
      },
    });

    revalidatePath('/dashboard/templates');
    return { success: true, template };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create template' };
  }
}

// ==================== GET TEMPLATES ====================
export async function getTemplates() {
  try {
    const userId = await getUserId();
    
    const templates = await db.pollTemplate.findMany({
      where: {
        OR: [
          { authorId: userId },
          { isPublic: true }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { 
      success: true, 
      templates: templates.map(template => ({
        ...template,
        options: JSON.parse(template.options)
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch templates' };
  }
}

// ==================== USE TEMPLATE ====================
export async function useTemplate(templateId: string) {
  try {
    const userId = await getUserId();
    
    const template = await db.pollTemplate.findUnique({
      where: {
        id: templateId,
        OR: [
          { authorId: userId },
          { isPublic: true }
        ]
      },
    });
    
    if (!template) {
      return { success: false, error: 'Template not found or you do not have access to it' };
    }
    
    return { 
      success: true, 
      template: {
        ...template,
        options: JSON.parse(template.options)
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to use template' };
  }
}

// ==================== DELETE TEMPLATE ====================
export async function deleteTemplate(templateId: string) {
  try {
    const userId = await getUserId();
    
    const template = await db.pollTemplate.findUnique({
      where: {
        id: templateId,
      },
    });
    
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    
    if (template.authorId !== userId) {
      return { success: false, error: 'You do not have permission to delete this template' };
    }
    
    await db.pollTemplate.delete({
      where: {
        id: templateId,
      },
    });
    
    revalidatePath('/dashboard/templates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete template' };
  }
}