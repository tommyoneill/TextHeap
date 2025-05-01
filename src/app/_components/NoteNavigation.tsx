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
        className="fixed left-4 top-4 z-20 rounded-lg bg-white p-2 shadow-lg hover:bg-gray-50"
        aria-label="Open navigation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6 text-gray-600"
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
    <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => createNote.mutate()}
            disabled={createNote.isPending}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="-ml-0.5 mr-1.5 h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            {createNote.isPending ? "Creating..." : "New"}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500"
            aria-label="Close navigation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {Object.entries(groupedNotes).map(([date, dateNotes]) => (
            <div key={date} className="mb-6">
              <h3 className="mb-2 px-2 text-sm font-medium text-gray-500">{date}</h3>
              <div className="space-y-1">
                {dateNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note)}
                    className={`group relative w-full rounded-md px-3 py-2 text-left transition-colors ${
                      note.id === currentNoteId
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium ${
                          note.id === currentNoteId
                            ? "text-indigo-600"
                            : "text-gray-900"
                        }`}>
                          {note.title}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 truncate">
                          {getPreview(note)}
                        </div>
                      </div>
                      <div className="ml-3 shrink-0 text-xs text-gray-400">
                        {format(note.createdAt, "h:mm a")}
                      </div>
                    </div>
                    {note.id === currentNoteId && (
                      <span
                        className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
} 