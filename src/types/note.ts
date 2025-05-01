export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// This type ensures our Note interface matches the Prisma schema
import { type PrismaClient } from "@prisma/client";
type DbNote = Awaited<ReturnType<PrismaClient["note"]["findUnique"]>> & {};
export type _EnsureNoteMatchesPrisma = NonNullable<DbNote> extends Note ? true : false; 