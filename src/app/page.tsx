import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { NotesContainer } from "./_components/NotesContainer";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to TextHeap</h1>
        <p className="mb-8 text-gray-600">Please sign in to start taking notes.</p>
        <Link
          href="/api/auth/signin"
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const notes = await api.note.getAll();
  const latestNote = await api.note.getLatest();

  return <NotesContainer initialNotes={notes} initialCurrentNote={latestNote} />;
}
