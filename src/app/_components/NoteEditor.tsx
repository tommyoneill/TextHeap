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
    <div className="flex h-full w-full flex-col rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex flex-1 items-center">
          <h2 className="text-base font-semibold text-gray-900">{note.title}</h2>
          <div className="ml-3 flex items-center space-x-2 text-sm text-gray-500">
            <span className="select-none text-gray-300">•</span>
            {updateNote.isPending ? (
              <span className="flex items-center space-x-1">
                <svg className="h-3 w-3 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              <span>Saved</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <textarea
          className="block h-full w-full resize-none border-0 bg-transparent px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing..."
          autoFocus
          style={{ minHeight: "calc(100vh - 16rem)" }}
        />
      </div>
    </div>
  );
} 