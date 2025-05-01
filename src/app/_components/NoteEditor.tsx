"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import type { Note } from "~/types/note";

interface NoteEditorProps {
  note: Note;
  onUpdate?: (note: Note) => void;
}

export function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [content, setContent] = useState(note.content);
  const utils = api.useUtils();
  
  const updateNote = api.note.update.useMutation({
    onSuccess: (updatedNote) => {
      onUpdate?.(updatedNote);
      void utils.note.getAll.invalidate();
    },
  });

  // Update content when note changes
  useEffect(() => {
    setContent(note.content);
  }, [note.id, note.content]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== note.content) {
        updateNote.mutate({
          id: note.id,
          content,
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, note.content, note.id, updateNote]);

  return (
    <div className="flex h-full w-full flex-col">
      <textarea
        className="h-full w-full flex-1 resize-none border-0 bg-transparent p-4 text-lg focus:outline-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
        autoFocus
      />
    </div>
  );
} 