"use client";
// ============================================================
// AppProviders — membungkus SEMUA context jadi satu komponen.
// REVISI Batch 3: tambah <ThemeProvider> (poin 9 & 16). Diletakkan
// paling luar karena tidak butuh context lain apa pun.
//
// REVISI Batch 7 — PERBAIKAN AKAR PENYEBAB crash
// "useGroups harus dipakai di dalam <GroupsProvider>":
// <ModalProvider> merender ISI modal (`state.body`) di dalam
// return-nya SENDIRI (lihat `<div>{state?.body}</div>` di
// ModalContext.tsx). Kalau <ModalProvider> diletakkan DI LUAR
// provider data (Schedule/Notes/Tasks/Exams/Groups) seperti versi
// lama, maka komponen apa pun yang dipakai sebagai ISI modal (mis.
// <GroupDetailForm/> yang memanggil useGroups()) akan dirender DI
// LUAR jangkauan provider data itu — persis itulah yang membuat
// GrupView crash begitu kamu klik salah satu grup untuk menambah/
// menghapus anggota, karena isi modalnya (`GroupDetailForm`)
// butuh <GroupsProvider> tapi diletakkan di luarnya.
// Perbaikannya: <ModalProvider> dipindah jadi PALING DALAM (tepat
// sebelum `{children}`), setelah semua provider data. Dengan
// begini, isi modal apa pun (Jadwal, Catatan, Ujian, Grup) akan
// selalu berada DI DALAM semua provider data, jadi tidak akan
// pernah crash lagi walau modal itu memanggil hook context apa pun.
// ============================================================
import { ReactNode } from "react";
import { ThemeProvider } from "./ThemeContext";
import { LangProvider } from "./LangContext";
import { ToastProvider } from "./ToastContext";
import { ModalProvider } from "./ModalContext";
import { PageActionProvider } from "./PageActionContext";
import { ScheduleProvider } from "./ScheduleContext";
import { NotesProvider } from "./NotesContext";
import { TasksProvider } from "./TasksContext";
import { ExamsProvider } from "./ExamsContext";
import { GroupsProvider } from "./GroupsContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <ToastProvider>
          <PageActionProvider>
            <ScheduleProvider>
              <NotesProvider>
                <TasksProvider>
                  <ExamsProvider>
                    <GroupsProvider>
                      {/* ModalProvider PALING DALAM — lihat catatan Batch 7 di atas */}
                      <ModalProvider>
                        {children}
                      </ModalProvider>
                    </GroupsProvider>
                  </ExamsProvider>
                </TasksProvider>
              </NotesProvider>
            </ScheduleProvider>
          </PageActionProvider>
        </ToastProvider>
      </LangProvider>
    </ThemeProvider>
  );
}