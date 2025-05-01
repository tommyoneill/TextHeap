"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import type { Note } from "~/types/note";
import { NoteEditor } from "./NoteEditor";
import { NoteNavigation } from "./NoteNavigation";

interface NotesContainerProps {
  initialNotes: Note[];
  initialCurrentNote: Note;
}

export function NotesContainer({
  initialNotes,
  initialCurrentNote,
}: NotesContainerProps) {
  const [currentNote, setCurrentNote] = useState(initialCurrentNote);
  const { data: notes = initialNotes } = api.note.getAll.useQuery(undefined, {
    initialData: initialNotes,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Update current note if it's been updated in the notes list
  useEffect(() => {
    const updatedCurrentNote = notes.find((note) => note.id === currentNote.id);
    if (updatedCurrentNote && updatedCurrentNote.updatedAt !== currentNote.updatedAt) {
      setCurrentNote(updatedCurrentNote);
    }
  }, [notes, currentNote.id, currentNote.updatedAt]);

  const handleNoteSelect = (note: Note) => {
    setCurrentNote(note);
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setCurrentNote(updatedNote);
  };

  return (
    <main className="flex h-screen">
      <NoteNavigation
        notes={notes}
        currentNoteId={currentNote.id}
        onNoteSelect={handleNoteSelect}
      />
      <div className="flex-1">
        <NoteEditor note={currentNote} onUpdate={handleNoteUpdate} />
      </div>
    </main>
  );
} 