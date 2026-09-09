"use client";
// ============================================================
// GroupsContext — data & CRUD grup belajar, anggota, tugas
// kelompok, dan (REVISI Batch 2 / poin 13) daftar email undangan
// + detail tugas (tenggat, link pengumpulan, link referensi, draf
// pribadi).
// ============================================================
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { GroupData, GroupTask } from "@/data/types";
import { seedGroups, seedNextGroupId, seedNextGroupTaskId } from "@/data/seed";

interface GroupsContextValue {
  groups: GroupData[];
  addGroup: (name: string, subject: string) => void;
  renameGroup: (id: number, name: string) => void;
  deleteGroup: (id: number) => void;
  addMember: (groupId: number, name: string) => void;
  removeMembers: (groupId: number, names: Set<string>) => void;
  addGroupTask: (groupId: number, title: string) => void;
  updateGroupTask: (groupId: number, taskId: number, patch: Partial<GroupTask>) => void;
  toggleGroupTask: (groupId: number, taskId: number) => void;
  deleteGroupTask: (groupId: number, taskId: number) => void;
  addGroupEmail: (groupId: number, email: string) => void;
  removeGroupEmail: (groupId: number, email: string) => void;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<GroupData[]>(seedGroups);
  const nextGroupIdRef = useRef(seedNextGroupId);
  const nextTaskIdRef = useRef(seedNextGroupTaskId);

  const addGroup = (name: string, subject: string) => {
    setGroups((prev) => [
      ...prev,
      // REVISI Batch 1/2: grup baru mulai KOSONG (dulu diam-diam selalu
      // menambahkan anggota bernama "Alvan" — sisa data contoh lama).
      { id: nextGroupIdRef.current++, name, subject, members: [], tasks: [], invitedEmails: [] },
    ]);
  };

  const renameGroup = (id: number, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  };

  const deleteGroup = (id: number) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const addMember = (groupId: number, name: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, members: [...g.members, name] } : g))
    );
  };

  const removeMembers = (groupId: number, names: Set<string>) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, members: g.members.filter((m) => !names.has(m)) } : g
      )
    );
  };

  const addGroupTask = (groupId: number, title: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tasks: [...g.tasks, { id: nextTaskIdRef.current++, title, done: false }] }
          : g
      )
    );
  };

  // REVISI Batch 2 (poin 13): ubah detail satu tugas kelompok (tenggat,
  // link pengumpulan, link referensi, draf pribadi).
  const updateGroupTask = (groupId: number, taskId: number, patch: Partial<GroupTask>) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tasks: g.tasks.map((tk) => (tk.id === taskId ? { ...tk, ...patch } : tk)) }
          : g
      )
    );
  };

  const toggleGroupTask = (groupId: number, taskId: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tasks: g.tasks.map((tk) => (tk.id === taskId ? { ...tk, done: !tk.done } : tk)) }
          : g
      )
    );
  };

  const deleteGroupTask = (groupId: number, taskId: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, tasks: g.tasks.filter((tk) => tk.id !== taskId) } : g
      )
    );
  };

  // REVISI Batch 2 (poin 13): daftar email undangan (lihat catatan
  // batasan fitur ini di dokumen revisi Batch 2).
  const addGroupEmail = (groupId: number, email: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.invitedEmails.includes(email)
          ? { ...g, invitedEmails: [...g.invitedEmails, email] }
          : g
      )
    );
  };

  const removeGroupEmail = (groupId: number, email: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, invitedEmails: g.invitedEmails.filter((e) => e !== email) } : g
      )
    );
  };

  return (
    <GroupsContext.Provider
      value={{
        groups, addGroup, renameGroup, deleteGroup,
        addMember, removeMembers,
        addGroupTask, updateGroupTask, toggleGroupTask, deleteGroupTask,
        addGroupEmail, removeGroupEmail,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error("useGroups harus dipakai di dalam <GroupsProvider>");
  return ctx;
}