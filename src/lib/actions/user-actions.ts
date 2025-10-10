'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as z from 'zod';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  image: z.string().url('Image must be a valid URL').optional(),
});

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'User not authenticated' };
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get('name') || undefined,
    image: formData.get('image') || undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldErrors = Object.entries(flat.fieldErrors)
      .flatMap(([field, messages]) => (messages || []).map(msg => `${field}: ${msg}`));
    const formErrors = flat.formErrors || [];
    return { success: false, error: [...fieldErrors, ...formErrors].join(', ') || 'Invalid input' };
  }

  const { name, image } = parsed.data;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(image !== undefined ? { image } : {}),
    },
  });

  // Revalidate settings/dashboard
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');

  return { success: true };
}





