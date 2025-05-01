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

  const utils = api.useUtils();

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

  const navigation = notes.map((note) => ({
    id: note.id,
    name: note.title ?? "Untitled Note",
    preview: note.content.slice(0, 50) + (note.content.length > 50 ? "..." : ""),
    icon: DocumentTextIcon,
    current: note.id === currentNoteId,
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
                    <div className="flex flex-col items-start">
                      <span className="truncate">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.preview}</span>
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
              {currentNoteId && (
                <h2 className="text-lg font-semibold text-gray-900">
                  {notes.find((note) => note.id === currentNoteId)?.title ?? "Untitled Note"}
                </h2>
              )}
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
              <div className="mx-auto max-w-3xl">
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
