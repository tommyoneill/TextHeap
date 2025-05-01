"use client";

import { format } from "date-fns";
import { useState } from "react";
import type { Note } from "~/types/note";
import { api } from "~/trpc/react";

interface NoteNavigationProps {
  notes: Note[];
  currentNoteId: string;
  onNoteSelect: (note: Note) => void;
}

type GroupedNotes = Record<string, Note[]>;

export function NoteNavigation({ notes, currentNoteId, onNoteSelect }: NoteNavigationProps) {
  const [isOpen, setIsOpen] = useState(true);
  const utils = api.useUtils();

  const createNote = api.note.create.useMutation({
    onSuccess: (newNote) => {
      void utils.note.getAll.invalidate();
      onNoteSelect(newNote);
    },
  });

  const groupedNotes = notes.reduce<GroupedNotes>((groups, note) => {
    const date = format(note.createdAt, "MMMM d, yyyy");
    groups[date] ??= [];
    groups[date].push(note);
    return groups;
  }, {});

  const getPreview = (note: Note) => {
    const content = note.content.trim();
    if (content === "") return "Empty note";
    const firstLine = content.split("\n")[0] ?? "";
    return firstLine.slice(0, 30) + (firstLine.length > 30 ? "..." : "");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 rounded-full bg-gray-200 p-2 hover:bg-gray-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="h-full w-72 border-r bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notes</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded p-1 hover:bg-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="mt-4 space-y-4 flex flex-col h-[calc(100%-6rem)]">
        <div className="flex-1 overflow-auto">
          {Object.entries(groupedNotes).map(([date, dateNotes]) => (
            <div key={date} className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-500">{date}</h3>
              <div className="space-y-2">
                {dateNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note)}
                    className={`w-full rounded-lg p-3 text-left hover:bg-gray-200 ${
                      note.id === currentNoteId ? "bg-gray-200" : ""
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {note.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {getPreview(note)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {format(note.createdAt, "h:mm a")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => createNote.mutate()}
          disabled={createNote.isPending}
          className="w-full mt-4 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {createNote.isPending ? "Creating..." : "New Note"}
        </button>
      </div>
    </div>
  );
} 