import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { generateNoteName } from "~/server/openai";
import type { Note } from "~/types/note";

const noteSelect = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
} as const;

const noteOutput = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
}) satisfies z.ZodType<Note>;

export const noteRouter = createTRPCRouter({
  getAll: protectedProcedure
    .output(z.array(noteOutput))
    .query(async ({ ctx }) => {
      const notes = await ctx.db.note.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: noteSelect,
      });
      return notes;
    }),

  create: protectedProcedure
    .output(noteOutput)
    .mutation(async ({ ctx }) => {
      const note = await ctx.db.note.create({
        data: {
          content: "",
          title: "New Note",
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
        select: noteSelect,
      });
      return note;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      content: z.string(),
    }))
    .output(noteOutput)
    .mutation(async ({ ctx, input }) => {
      // Generate a new title if content has changed
      const title = await generateNoteName(input.content);

      const note = await ctx.db.note.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          content: input.content,
          title,
        },
        select: noteSelect,
      });
      return note;
    }),

  getLatest: protectedProcedure
    .output(noteOutput)
    .query(async ({ ctx }) => {
      // First, try to find the most recent empty note
      const latestEmptyNote = await ctx.db.note.findFirst({
        where: {
          userId: ctx.session.user.id,
          content: "",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: noteSelect,
      });

      // If we found an empty note, return it
      if (latestEmptyNote) {
        return latestEmptyNote;
      }

      // If no empty note exists, create a new one
      const note = await ctx.db.note.create({
        data: {
          content: "",
          title: "New Note",
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
        select: noteSelect,
      });
      return note;
    }),
}); 