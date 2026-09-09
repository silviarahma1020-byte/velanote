"use client";
// ============================================================
// GrupView — Halaman Grup Belajar.
//
// REVISI Batch 10 (poin 2): file ini ditulis ULANG PENUH (bukan
// tempelan sebagian) untuk memastikan field "Link Drive/lainnya"
// dan "Unggah file" masing-masing HANYA MUNCUL SEKALI di detail
// tugas kelompok — sebelumnya dobel karena instruksi edit-sebagian
// di revisi lalu tumpang tindih dengan kode yang sudah ada.
// Field "Draf hasil tugasku" (textarea tempel teks) TETAP TIDAK ADA
// (sesuai permintaan sebelumnya), digantikan oleh link & unggah
// file saja.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";
import { useRegisterPageAction } from "@/context/PageActionContext";
import { useGroups } from "@/context/GroupsContext";
import { avatarClass } from "@/data/seed";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NewGroupForm({ registerSubmit }: { registerSubmit: (get: () => { name: string; subject: string }) => void }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  useEffect(() => registerSubmit(() => ({ name, subject })), [name, subject, registerSubmit]);
  return (
    <>
      <div className="form-field">
        <label>{t("namaGrup")}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("misalGrup")} />
      </div>
      <div className="form-field">
        <label>{t("mataPelajaran")}</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("misalMapel")} />
      </div>
    </>
  );
}

function GroupDetailForm({
  groupId,
  registerSubmit,
}: {
  groupId: number;
  registerSubmit: (get: () => { name: string }) => void;
}) {
  const { t } = useLang();
  const { show: toast } = useToast();
  const {
    groups, addMember, removeMembers,
    addGroupTask, updateGroupTask, toggleGroupTask, deleteGroupTask,
    addGroupEmail, removeGroupEmail,
  } = useGroups();

  const group = groups.find((g) => g.id === groupId);

  const [name, setName] = useState(group?.name ?? "");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newMember, setNewMember] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  useEffect(() => registerSubmit(() => ({ name })), [name, registerSubmit]);

  if (!group) return null;

  function toggleSelected(m: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  function submitAddMember() {
    const v = newMember.trim();
    if (!v) return;
    addMember(group!.id, v);
    setNewMember("");
    toast(t("anggotaDitambahkan"));
  }

  function submitDeleteSelected() {
    if (!selected.size) { toast(t("pilihAnggotaDulu")); return; }
    removeMembers(group!.id, selected);
    setSelectMode(false);
    setSelected(new Set());
    toast(t("anggotaDihapus"));
  }

  function submitAddGroupTask() {
    const v = newTask.trim();
    if (!v) return;
    addGroupTask(group!.id, v);
    setNewTask("");
    toast(t("tugasKelompokDitambahkan"));
  }

  function submitAddEmail() {
    const v = newEmail.trim();
    if (!v) return;
    if (!EMAIL_RE.test(v)) { toast(t("emailTidakValid")); return; }
    addGroupEmail(group!.id, v);
    setNewEmail("");
    toast(t("emailDitambahkan"));
  }

  return (
    <>
      <div className="form-field">
        <label>{t("namaGrup")}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="hint-text" style={{ marginBottom: 4 }}>{group.subject}</div>

      {/* ---- Anggota ---- */}
      <div className="group-section-label-row">
        <div className="group-section-label">{t("anggotaKelompok")}</div>
        {!selectMode && (
          <button type="button" className="link-action" onClick={() => setSelectMode(true)}>
            {t("pilihAnggota")}
          </button>
        )}
      </div>
      <div className="member-list">
        {!group.members.length && (
          <div className="hint-text" style={{ padding: "6px 2px" }}>{t("belumAdaAnggota")}</div>
        )}
        {group.members.map((m, i) =>
          selectMode ? (
            <div className="member-row" key={m}>
              <input type="checkbox" className="member-check" checked={selected.has(m)} onChange={() => toggleSelected(m)} />
              <div className="member-name">{m}</div>
            </div>
          ) : (
            <div className="member-row" key={m}>
              <div className={"avatar lg " + avatarClass(i)} style={{ marginLeft: 0 }}>{m[0]}</div>
              <div className="member-name">{m}</div>
            </div>
          )
        )}
      </div>
      {selectMode && (
        <div className="member-select-bar" style={{ display: "flex" }}>
          <button type="button" className="btn-danger-sm" onClick={submitDeleteSelected}>
            {t("hapusAnggotaTerpilih")}
          </button>
          <button type="button" className="link-action" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>
            {t("batalPilih")}
          </button>
        </div>
      )}
      <div className="member-add-row">
        <input
          type="text"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAddMember(); } }}
          placeholder={t("namaTeman")}
        />
        <button type="button" onClick={submitAddMember}>{t("tambahAnggota")}</button>
      </div>

      {/* ---- Akses via akun Gmail ---- */}
      <div className="group-section-label-row">
        <div className="group-section-label">{t("aksesGmailGrup")}</div>
      </div>
      <div className="hint-text" style={{ marginBottom: 6 }}>{t("aksesGmailHint")}</div>
      <div className="member-list">
        {!group.invitedEmails.length && (
          <div className="hint-text" style={{ padding: "6px 2px" }}>{t("belumAdaEmail")}</div>
        )}
        {group.invitedEmails.map((em) => (
          <div className="member-row" key={em}>
            <div className="member-name">{em}</div>
            <button type="button" className="gt-del" onClick={() => { removeGroupEmail(group!.id, em); toast(t("emailDihapus")); }}>✕</button>
          </div>
        ))}
      </div>
      <div className="member-add-row">
        <input
          type="text"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAddEmail(); } }}
          placeholder={t("emailPh")}
        />
        <button type="button" onClick={submitAddEmail}>{t("tambahEmail")}</button>
      </div>

      {/* ---- Tugas kelompok ---- */}
      <div className="group-section-label">{t("tugasKelompok")}</div>
      <div className="group-task-list">
        {!group.tasks.length ? (
          <div className="hint-text" style={{ padding: "6px 2px" }}>{t("belumAdaTugasKelompok")}</div>
        ) : (
          group.tasks.map((gt) => (
            <div className="group-task-row-wrap" key={gt.id}>
              <div className="group-task-row">
                <div
                  className={"gt-check" + (gt.done ? " done" : "")}
                  onClick={() => toggleGroupTask(group!.id, gt.id)}
                />
                <div className="gt-body">
                  <div className={"gt-title" + (gt.done ? " done" : "")}>{gt.title}</div>
                  {gt.deadline && <div className="gt-deadline">{t("deadlineTugas")}: {gt.deadline}</div>}
                </div>
                <button
                  type="button"
                  className="link-action"
                  onClick={() => setExpandedTaskId(expandedTaskId === gt.id ? null : gt.id)}
                >
                  {expandedTaskId === gt.id ? t("tutupDetail") : t("detailTugas")}
                </button>
                <button className="gt-del" type="button" onClick={() => deleteGroupTask(group!.id, gt.id)}>✕</button>
              </div>
              {expandedTaskId === gt.id && (
                <div className="group-task-detail">
                  <div className="form-field">
                    <label>{t("deadlineTugas")}</label>
                    <input
                      type="date"
                      value={gt.deadline || ""}
                      onChange={(e) => updateGroupTask(group!.id, gt.id, { deadline: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>{t("linkPengumpulan")}</label>
                    <input
                      type="text"
                      value={gt.submissionLink || ""}
                      onChange={(e) => updateGroupTask(group!.id, gt.id, { submissionLink: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-field">
                    <label>{t("linkReferensi")}</label>
                    <input
                      type="text"
                      value={gt.referenceLink || ""}
                      onChange={(e) => updateGroupTask(group!.id, gt.id, { referenceLink: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Draf tugasku: HANYA link + unggah file (textarea "myDraft" sengaja tidak ada) */}
                  <div className="form-field">
                    <label>{t("linkDraftLabel")}</label>
                    <input
                      type="text"
                      value={gt.myDraftLink || ""}
                      onChange={(e) => updateGroupTask(group!.id, gt.id, { myDraftLink: e.target.value })}
                      placeholder={t("linkDraftPh")}
                    />
                  </div>
                  <div className="form-field">
                    <label>{t("unggahFileDraft")}</label>
                    <div className="hint-text" style={{ marginBottom: 6 }}>{t("lampirkanFileDraftHint")}</div>
                    {gt.myDraftFile ? (
                      <div className="member-row">
                        <div className="member-name">📎 {gt.myDraftFile.name}</div>
                        <button
                          type="button"
                          className="gt-del"
                          title={t("hapusFileDraft")}
                          onClick={() => updateGroupTask(group!.id, gt.id, { myDraftFile: null })}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,application/pdf,image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            updateGroupTask(group!.id, gt.id, {
                              myDraftFile: {
                                name: file.name,
                                dataUrl: reader.result as string,
                                type: file.type,
                              },
                            });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="group-task-add">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitAddGroupTask(); }}
          placeholder={t("tugasBaru")}
        />
        <button type="button" onClick={submitAddGroupTask}>{t("tambah")}</button>
      </div>
    </>
  );
}

export default function GrupView() {
  const { t } = useLang();
  const { show: toast } = useToast();
  const { open, close } = useModal();
  const { groups, addGroup, renameGroup, deleteGroup } = useGroups();
  const newGroupSubmitRef = useRef<(() => { name: string; subject: string }) | null>(null);
  const detailSubmitRef = useRef<(() => { name: string }) | null>(null);

  function openGroupModal() {
    open({
      title: t("buatGrupBaru"),
      body: <NewGroupForm registerSubmit={(fn) => { newGroupSubmitRef.current = fn; }} />,
      onSave: () => {
        const v = newGroupSubmitRef.current?.();
        if (!v) return;
        const name = v.name.trim();
        if (!name) { toast(t("namaGrupWajib")); return; }
        addGroup(name, v.subject.trim() || t("umum"));
        close();
        toast(t("grupDibuat"));
      },
    });
  }

  function openGroupDetail(groupId: number, groupName: string) {
    open({
      title: groupName,
      body: <GroupDetailForm groupId={groupId} registerSubmit={(fn) => { detailSubmitRef.current = fn; }} />,
      onSave: () => {
        const v = detailSubmitRef.current?.();
        if (!v) return;
        const name = v.name.trim();
        if (!name) { toast(t("namaGrupWajib")); return; }
        renameGroup(groupId, name);
        close();
        toast(t("grupDiperbarui"));
      },
      onDelete: () => {
        deleteGroup(groupId);
        toast(t("grupDihapus"));
      },
    });
  }

  useRegisterPageAction(t("buatGrupBaru"), openGroupModal);

  return (
    <div className="page-view">
      {!groups.length ? (
        <div className="empty-state">{t("belumAdaGrup")}</div>
      ) : (
        <div className="group-grid">
          {groups.map((g) => {
            const doneCount = g.tasks.filter((tk) => tk.done).length;
            const totalCount = g.tasks.length;
            return (
              <div className="group-card" key={g.id} onClick={() => openGroupDetail(g.id, g.name)}>
                <div className="group-name">{g.name}</div>
                <div className="group-sub">
                  {g.subject} · {g.members.length} {t("anggota")}
                  {totalCount ? ` · ${doneCount}/${totalCount} ${t("tugasSelesai")}` : ""}
                </div>
                <div className="group-members">
                  {g.members.slice(0, 5).map((m, i) => (
                    <div className={"avatar " + avatarClass(i)} title={m} key={m}>{m[0]}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}