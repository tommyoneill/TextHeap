import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const noteRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.note.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  create: protectedProcedure
    .mutation(async ({ ctx }) => {
      const note = await ctx.db.note.create({
        data: {
          content: "",
          userId: ctx.session.user.id,
        },
      });
      return note;
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    // First, try to find the most recent empty note
    const latestEmptyNote = await ctx.db.note.findFirst({
      where: {
        userId: ctx.session.user.id,
        content: "",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If we found an empty note, return it
    if (latestEmptyNote) {
      return latestEmptyNote;
    }

    // If no empty note exists, create a new one
    return ctx.db.note.create({
      data: {
        content: "",
        userId: ctx.session.user.id,
      },
    });
  }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.note.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          content: input.content,
          updatedAt: new Date(),
        },
      });
      return note;
    }),
}); 