import { z } from "zod";
import { ArticleStatus } from "@prisma/client";

export const articleStatusSchema = z.nativeEnum(ArticleStatus);

export const articleInputSchema = z.object({
  title: z.string().min(8, "Title must be at least 8 characters").max(180),
  slug: z
    .string()
    .min(3)
    .max(96)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().min(20, "Excerpt must be at least 20 characters").max(400),
  content: z.string().min(50, "Article body is too short"),
  coverImage: z.string().url().optional().or(z.literal("")),
  coverAlt: z.string().max(200).optional(),
  categoryId: z.string().cuid(),
  tagIds: z.array(z.string().cuid()).max(10).default([]),
  isFeatured: z.boolean().default(false),
  isBreaking: z.boolean().default(false),
  isTrending: z.boolean().default(false),
});

export const articleCreateSchema = articleInputSchema;

export const articleUpdateSchema = articleInputSchema.partial().extend({
  id: z.string().cuid(),
  revisionNote: z.string().max(300).optional(),
});

export const articleScheduleSchema = z.object({
  id: z.string().cuid(),
  publishedAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Schedule time must be in the future",
  }),
});

export const articleListFilterSchema = z.object({
  status: articleStatusSchema.optional(),
  categoryId: z.string().cuid().optional(),
  authorId: z.string().cuid().optional(),
  query: z.string().max(120).optional(),
  cursor: z.string().nullish(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const publicSearchSchema = z.object({
  query: z.string().max(120).optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  authorId: z.string().cuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(48).default(12),
});

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;
export type PublicSearchInput = z.infer<typeof publicSearchSchema>;
