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
      // First get the current note to check its title
      const currentNote = await ctx.db.note.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        select: noteSelect,
      });

      if (!currentNote) {
        throw new Error("Note not found");
      }

      // Only generate a new title if:
      // 1. The note has default title ("New Note" or "Untitled Note")
      // 2. The content is substantial enough (at least 20 chars)
      // 3. The content has changed
      const hasDefaultTitle = currentNote.title === "New Note" || currentNote.title === "Untitled Note";
      const hasSubstantialContent = input.content.trim().length >= 20;
      const contentChanged = currentNote.content !== input.content;

      let title = currentNote.title;
      if (hasDefaultTitle && hasSubstantialContent && contentChanged) {
        // Get all existing titles for this user
        const existingTitles = new Set((await ctx.db.note.findMany({
          where: {
            userId: ctx.session.user.id,
            NOT: {
              id: input.id // Exclude current note
            }
          },
          select: { title: true }
        })).map((note: { title: string }) => note.title));

        // Try to generate a unique title, with a maximum of 3 attempts
        let attempts = 0;
        let newTitle: string;
        do {
          newTitle = await generateNoteName(input.content, attempts);
          attempts++;
        } while (existingTitles.has(newTitle) && attempts < 3);

        // If we found a unique title, use it
        if (!existingTitles.has(newTitle)) {
          title = newTitle;
        }
        // If all attempts resulted in duplicates, append a number to make it unique
        else {
          let counter = 1;
          const baseTitle = newTitle;
          while (existingTitles.has(newTitle)) {
            newTitle = `${baseTitle} ${counter}`;
            counter++;
          }
          title = newTitle;
        }
      }

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

  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.note.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
      return { success: true };
    }),
}); 