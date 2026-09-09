"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GroupData, GroupTask } from "@/data/types";
import { uid } from "@/data/utils";
import { createClient } from "@/lib/supabase/client";

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
  const [groups, setGroups] = useState<GroupData[]>([]);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("groups").select("*").order("id");
      if (error) { console.error(error); return; }
      setGroups(
        (data ?? []).map((r) => ({
          id: r.id, name: r.name, subject: r.subject,
          members: r.members ?? [], tasks: r.tasks ?? [], invitedEmails: r.invited_emails ?? [],
        }))
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(groupId: number, patch: Record<string, unknown>) {
    supabase.from("groups").update(patch).eq("id", groupId).then();
  }

  const addGroup = async (name: string, subject: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const id = uid();
    setGroups((prev) => [...prev, { id, name, subject, members: [], tasks: [], invitedEmails: [] }]);
    const { error } = await supabase
      .from("groups")
      .insert({ id, user_id: user.id, name, subject, members: [], tasks: [], invited_emails: [] });
    if (error) console.error(error);
  };

  const renameGroup = (id: number, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
    persist(id, { name });
  };

  const deleteGroup = (id: number) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    supabase.from("groups").delete().eq("id", id).then();
  };

  const addMember = (groupId: number, name: string) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const members = [...g.members, name];
      persist(groupId, { members });
      return { ...g, members };
    }));
  };

  const removeMembers = (groupId: number, names: Set<string>) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const members = g.members.filter((m) => !names.has(m));
      persist(groupId, { members });
      return { ...g, members };
    }));
  };

  const addGroupTask = (groupId: number, title: string) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const tasks = [...g.tasks, { id: uid(), title, done: false }];
      persist(groupId, { tasks });
      return { ...g, tasks };
    }));
  };

  const updateGroupTask = (groupId: number, taskId: number, patch: Partial<GroupTask>) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const tasks = g.tasks.map((tk) => (tk.id === taskId ? { ...tk, ...patch } : tk));
      persist(groupId, { tasks });
      return { ...g, tasks };
    }));
  };

  const toggleGroupTask = (groupId: number, taskId: number) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const tasks = g.tasks.map((tk) => (tk.id === taskId ? { ...tk, done: !tk.done } : tk));
      persist(groupId, { tasks });
      return { ...g, tasks };
    }));
  };

  const deleteGroupTask = (groupId: number, taskId: number) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const tasks = g.tasks.filter((tk) => tk.id !== taskId);
      persist(groupId, { tasks });
      return { ...g, tasks };
    }));
  };

  const addGroupEmail = (groupId: number, email: string) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId || g.invitedEmails.includes(email)) return g;
      const invitedEmails = [...g.invitedEmails, email];
      persist(groupId, { invited_emails: invitedEmails });
      return { ...g, invitedEmails };
    }));
  };

  const removeGroupEmail = (groupId: number, email: string) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const invitedEmails = g.invitedEmails.filter((e) => e !== email);
      persist(groupId, { invited_emails: invitedEmails });
      return { ...g, invitedEmails };
    }));
  };

  return (
    <GroupsContext.Provider
      value={{
        groups, addGroup, renameGroup, deleteGroup, addMember, removeMembers,
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