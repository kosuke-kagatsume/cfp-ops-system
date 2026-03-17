"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type ProductionCalendarEntry = {
  id: string;
  date: string;
  isWorkday: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  note: string | null;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

const eventColors = {
  workday: "bg-emerald-100 text-emerald-800 border-emerald-300",
  holiday: "bg-red-100 text-red-800 border-red-300",
  note: "bg-blue-100 text-blue-800 border-blue-300",
};

export default function ProductionCalendarPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(2); // March = 2 (0-indexed)
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { showToast } = useToast();

  const apiMonth = currentMonth + 1; // API uses 1-indexed
  const { items: entries, total, page, limit, isLoading, mutate, onPageChange } = usePaginated<ProductionCalendarEntry>(
    `/api/production-calendar?year=${currentYear}&month=${apiMonth}`
  );

  const calendarEntries = entries ?? [];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const getEntryForDay = (day: number): ProductionCalendarEntry | undefined => {
    const dateStr = `${currentYear}-${String(apiMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarEntries.find((e) => e.date.startsWith(dateStr));
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const [newForm, setNewForm] = useState({ date: new Date().toISOString().split("T")[0], type: "workday", holidayName: "", note: "" });

  const handleCreate = async () => {
    try {
      const isHoliday = newForm.type === "holiday";
      const res = await fetch("/api/production-calendar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newForm.date, isWorkday: !isHoliday, isHoliday, holidayName: newForm.holidayName || undefined, note: newForm.note || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewModal(false);
      setNewForm({ date: new Date().toISOString().split("T")[0], type: "workday", holidayName: "", note: "" });
      mutate();
      showToast("予定を追加しました", "success");
    } catch { showToast("追加に失敗しました", "error"); }
  };

  const handleAddForDate = async (dateStr: string, type: string, holidayName?: string, note?: string) => {
    try {
      const isHoliday = type === "holiday";
      const res = await fetch("/api/production-calendar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, isWorkday: !isHoliday, isHoliday, holidayName, note }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
      showToast("予定を追加しました", "success");
    } catch { showToast("追加に失敗しました", "error"); }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("この予定を削除しますか？")) return;
    try {
      const res = await fetch(`/api/production-calendar/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSelectedDate(null);
      mutate();
      showToast("予定を削除しました", "success");
    } catch { showToast("削除に失敗しました", "error"); }
  };

  if (isLoading) {
    return (
      <>
        <Header title="生産カレンダー" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="生産カレンダー" />
      <div className="p-6 space-y-4">
        {/* 月切替 */}
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <button onClick={goToPrevMonth} className="p-2 hover:bg-surface-tertiary rounded-lg"><ChevronLeft className="w-5 h-5 text-text-secondary" /></button>
            <h2 className="text-lg font-bold text-text">{currentYear}年 {apiMonth}月</h2>
            <button onClick={goToNextMonth} className="p-2 hover:bg-surface-tertiary rounded-lg"><ChevronRight className="w-5 h-5 text-text-secondary" /></button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors ml-2">
              <Plus className="w-4 h-4" />予定追加
            </button>
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${eventColors.workday}`} />
            <span className="text-xs text-text-secondary">稼働日</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${eventColors.holiday}`} />
            <span className="text-xs text-text-secondary">休日</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${eventColors.note}`} />
            <span className="text-xs text-text-secondary">備考あり</span>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day, i) => (
              <div key={day} className={`px-2 py-2 text-center text-xs font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-text-secondary"} bg-surface-secondary`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {/* 空セル */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-border bg-surface-secondary/30" />
            ))}
            {/* 日付セル */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayOfWeek = (firstDay + i) % 7;
              const entry = getEntryForDay(day);
              const today = new Date();
              const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
              const dateStr = `${currentYear}-${String(apiMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[100px] border-b border-r border-border p-1.5 text-left hover:bg-primary-50/30 transition-colors ${isToday ? "bg-primary-50/50" : ""}`}>
                  <span className={`inline-flex w-6 h-6 items-center justify-center text-xs rounded-full ${
                    isToday ? "bg-primary-600 text-white font-bold" :
                    dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-text-secondary"
                  }`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {entry && entry.isHoliday && (
                      <div className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${eventColors.holiday}`}>
                        {entry.holidayName ?? "休日"}
                      </div>
                    )}
                    {entry && !entry.isHoliday && entry.isWorkday && entry.note && (
                      <div className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${eventColors.note}`}>
                        {entry.note.length > 15 ? entry.note.slice(0, 15) + "..." : entry.note}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 予定追加モーダル */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="予定追加"
        footer={<>
          <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">追加する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="日付" required><FormInput type="date" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} /></FormField>
          <FormField label="種別" required><FormSelect value={newForm.type} onChange={(e) => setNewForm({ ...newForm, type: e.target.value })} options={[
            { value: "workday", label: "稼働日" }, { value: "holiday", label: "休日" },
          ]} /></FormField>
          <FormField label="休日名"><FormInput placeholder="例: 定休日" value={newForm.holidayName} onChange={(e) => setNewForm({ ...newForm, holidayName: e.target.value })} /></FormField>
          <FormField label="備考"><FormInput placeholder="例: PP ルーダー稼働" value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} /></FormField>
        </div>
      </Modal>

      {/* 日付詳細モーダル */}
      <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ?? ""}
        footer={<>
          <button onClick={() => { if (selectedDate) handleAddForDate(selectedDate, "holiday", "休日"); }} className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">休日にする</button>
          <button onClick={() => setSelectedDate(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selectedDate && (() => {
          const entry = calendarEntries.find((e) => e.date.startsWith(selectedDate));
          return entry ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${entry.isHoliday ? eventColors.holiday : entry.isWorkday ? eventColors.workday : eventColors.note}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{entry.isHoliday ? "休日" : "稼働日"}</span>
                  <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
                {entry.holidayName && <p className="text-sm font-medium">{entry.holidayName}</p>}
                {entry.note && <p className="text-sm">{entry.note}</p>}
                {!entry.holidayName && !entry.note && <p className="text-sm text-text-tertiary">詳細なし</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary text-center py-8">この日の予定はありません</p>
          );
        })()}
      </Modal>
    </>
  );
}
