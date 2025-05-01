"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { NoteEditor } from "~/app/_components/NoteEditor";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  
  const { data: notes = [] } = api.note.getAll.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: latestNote } = api.note.getLatest.useQuery(undefined, {
    enabled: !!session,
  });

  // Set the latest note as current when app loads
  useEffect(() => {
    if (latestNote && !currentNoteId) {
      setCurrentNoteId(latestNote.id);
    }
  }, [latestNote, currentNoteId]);

  const updateNote = api.note.update.useMutation({
    onSuccess: () => {
      void utils.note.getAll.invalidate();
    },
  });

  const createNote = api.note.create.useMutation({
    onSuccess: (newNote) => {
      void utils.note.getAll.invalidate();
      setCurrentNoteId(newNote.id);
    },
  });

  const deleteNote = api.note.delete.useMutation({
    onSuccess: () => {
      void utils.note.getAll.invalidate();
      if (currentNoteId === deleteNoteId) {
        setCurrentNoteId(null);
      }
      setDeleteNoteId(null);
    },
  });

  const utils = api.useUtils();

  // Filter notes based on search query
  const filteredNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Text<span className="text-[hsl(280,100%,70%)]">Heap</span>
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              Your personal note-taking sanctuary
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-lg text-white">
                Sign in to start taking notes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navigation = filteredNotes.map((note) => ({
    id: note.id,
    name: note.title ?? "Untitled Note",
    preview: note.content.slice(0, 50) + (note.content.length > 50 ? "..." : ""),
    icon: DocumentTextIcon,
    current: note.id === currentNoteId,
    createdAt: note.createdAt,
  }));

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <span className="text-xl font-bold text-white">TextHeap</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-400">Your Notes</div>
              <button
                onClick={() => createNote.mutate()}
                className="rounded-md bg-gray-800 p-1 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentNoteId(item.id)}
                    className={classNames(
                      item.current
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white",
                      "group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <div className="flex flex-col items-start w-full">
                      <div className="flex items-center gap-2 w-full">
                        <span className="truncate max-w-[75%] break-all">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteNoteId(item.id);
                          }}
                          className="ml-auto p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                          title="Delete note"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 text-left break-all line-clamp-2">{item.preview}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteNoteId !== null} 
        onClose={() => setDeleteNoteId(null)}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Delete Note
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this note? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  onClick={() => {
                    if (deleteNoteId) {
                      deleteNote.mutate({ id: deleteNoteId });
                    }
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setDeleteNoteId(null)}
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog as="div" open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop className="fixed inset-0 bg-gray-900/80" />

        <div className="fixed inset-0 flex">
          <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
            <TransitionChild>
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
            </TransitionChild>
            <SidebarContent />
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="w-full max-w-lg lg:max-w-xs">
                <label htmlFor="search" className="sr-only">Search notes</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Search notes..."
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt="User profile"
                  width={32}
                  height={32}
                  className="rounded-full bg-gray-50"
                />
              )}
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                  {session.user?.name}
                </span>
              </span>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {currentNoteId ? (
              <div className="mx-auto max-w-[90%]">
                {(() => {
                  const currentNote = notes.find((note) => note.id === currentNoteId);
                  if (!currentNote) {
                    return (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        Note not found
                      </div>
                    );
                  }
                  return (
                    <NoteEditor 
                      note={currentNote}
                      onUpdate={(updatedNote) => {
                        void utils.note.getAll.invalidate();
                      }}
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Select a note or create a new one to start writing
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
