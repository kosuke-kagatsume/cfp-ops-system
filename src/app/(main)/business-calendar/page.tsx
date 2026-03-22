"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { DivisionBadge } from "@/components/division-badge";
import { useToast } from "@/components/toast";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

type CalendarDay = {
  date: string;
  isHoliday: boolean;
  holidayName: string | null;
  note: string | null;
  calendarId: string | null;
};

type CalendarEvent = {
  id: string;
  date: string;
  category: "arrival" | "shipment" | "production";
  title: string;
  status: string;
  division: "MR" | "CR";
  sourceType: string;
  sourceId: string;
};

type Plant = { id: string; code: string; name: string };

const categoryConfig = {
  arrival: { label: "入荷", color: "bg-blue-100 text-blue-800 border-blue-300", dot: "bg-blue-500" },
  shipment: { label: "出荷", color: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
  production: { label: "生産", color: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-500" },
  holiday: { label: "休日", color: "bg-red-100 text-red-800 border-red-300", dot: "bg-red-500" },
};

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getSourceLink(sourceType: string): string {
  switch (sourceType) {
    case "Purchase": return "/purchases";
    case "Shipment": return "/shipments";
    case "ProcessingOrder": return "/processing";
    default: return "#";
  }
}

export default function BusinessCalendarPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed
  const [plantId, setPlantId] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(["arrival", "shipment", "production", "holiday"])
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingHoliday, setEditingHoliday] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ isHoliday: false, holidayName: "", note: "" });
  const { showToast } = useToast();

  const apiMonth = currentMonth + 1;

  const { data: plants } = useSWR<Plant[]>("/api/masters/plants", fetcher);
  const categoryParam = Array.from(activeCategories).filter((c) => c !== "holiday").join(",");
  const { data, isLoading, mutate } = useSWR<{ calendarDays: CalendarDay[]; events: CalendarEvent[] }>(
    `/api/calendar/business?year=${currentYear}&month=${apiMonth}${plantId ? `&plantId=${plantId}` : ""}${categoryParam ? `&category=${categoryParam}` : ""}`,
    fetcher
  );

  const calendarDays = data?.calendarDays ?? [];
  const events = data?.events ?? [];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const getDayData = (day: number) => {
    const dateStr = `${currentYear}-${String(apiMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const calDay = calendarDays.find((d) => d.date === dateStr);
    const dayEvents = events.filter((e) => e.date === dateStr);
    return { dateStr, calDay, dayEvents };
  };

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11); }
    else setCurrentMonth(currentMonth - 1);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0); }
    else setCurrentMonth(currentMonth + 1);
  };

  const openDayDetail = (dateStr: string) => {
    const calDay = calendarDays.find((d) => d.date === dateStr);
    setHolidayForm({
      isHoliday: calDay?.isHoliday ?? false,
      holidayName: calDay?.holidayName ?? "",
      note: calDay?.note ?? "",
    });
    setSelectedDate(dateStr);
    setEditingHoliday(false);
  };

  const handleSaveHoliday = async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch("/api/calendar/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          isHoliday: holidayForm.isHoliday,
          holidayName: holidayForm.holidayName || null,
          note: holidayForm.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
      setEditingHoliday(false);
      showToast("カレンダーを更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const selectedEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];
  const selectedCalDay = selectedDate ? calendarDays.find((d) => d.date === selectedDate) : null;

  return (
    <>
      <Header title="業務カレンダー" />
      <div className="p-4 md:p-6 space-y-4">
        {/* フィルタ */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <select
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface"
            >
              <option value="">全工場</option>
              {(plants ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.entries(categoryConfig) as [string, { label: string; color: string; dot: string }][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  activeCategories.has(key) ? cfg.color : "bg-surface-secondary text-text-tertiary border-border"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCategories.has(key) ? cfg.dot : "bg-gray-300"}`} />
                {cfg.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goToPrevMonth} className="p-2 hover:bg-surface-tertiary rounded-lg">
              <ChevronLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <h2 className="text-lg font-bold text-text">{currentYear}年 {apiMonth}月</h2>
            <button onClick={goToNextMonth} className="p-2 hover:bg-surface-tertiary rounded-lg">
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* カレンダー */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-x-auto">
            <div className="grid grid-cols-7 border-b border-border">
              {weekDays.map((day, i) => (
                <div key={day} className={`px-2 py-2 text-center text-xs font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-text-secondary"} bg-surface-secondary`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[60px] md:min-h-[100px] border-b border-r border-border bg-surface-secondary/30" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayOfWeek = (firstDay + i) % 7;
                const { dateStr, calDay, dayEvents } = getDayData(day);
                const today = new Date();
                const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
                const isHoliday = calDay?.isHoliday && activeCategories.has("holiday");

                return (
                  <button
                    key={day}
                    onClick={() => openDayDetail(dateStr)}
                    className={`min-h-[60px] md:min-h-[100px] border-b border-r border-border p-1.5 text-left hover:bg-primary-50/30 transition-colors ${
                      isHoliday ? "bg-red-50/50" : isToday ? "bg-primary-50/50" : ""
                    }`}
                  >
                    <span className={`inline-flex w-6 h-6 items-center justify-center text-xs rounded-full ${
                      isToday ? "bg-primary-600 text-white font-bold" :
                      dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-text-secondary"
                    }`}>{day}</span>
                    {isHoliday && calDay?.holidayName && (
                      <div className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700 truncate mt-0.5">
                        {calDay.holidayName}
                      </div>
                    )}
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const cfg = categoryConfig[evt.category];
                        return (
                          <div key={evt.id} className={`text-[10px] px-1 py-0.5 rounded border truncate ${cfg.color}`}>
                            {evt.title.length > 15 ? evt.title.slice(0, 15) + "..." : evt.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-text-tertiary text-center">+{dayEvents.length - 2}件</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 凡例 */}
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" />入荷</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" />出荷</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" />生産</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" />休日</span>
        </div>
      </div>

      {/* 日クリックモーダル */}
      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? `${selectedDate}` : ""}
        footer={
          <>
            {editingHoliday ? (
              <>
                <button onClick={() => setEditingHoliday(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">キャンセル</button>
                <button onClick={handleSaveHoliday} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">保存</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingHoliday(true)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">稼働日/休日を編集</button>
                <button onClick={() => setSelectedDate(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {/* 稼働/休日ステータス */}
          <div className={`p-3 rounded-lg ${selectedCalDay?.isHoliday ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}>
            <p className={`text-sm font-medium ${selectedCalDay?.isHoliday ? "text-red-700" : "text-emerald-700"}`}>
              {selectedCalDay?.isHoliday ? `休日${selectedCalDay.holidayName ? `: ${selectedCalDay.holidayName}` : ""}` : "稼働日"}
            </p>
            {selectedCalDay?.note && <p className="text-xs text-text-secondary mt-1">{selectedCalDay.note}</p>}
          </div>

          {/* 休日編集フォーム */}
          {editingHoliday && (
            <div className="space-y-3 p-3 bg-surface-secondary rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={holidayForm.isHoliday}
                  onChange={(e) => setHolidayForm({ ...holidayForm, isHoliday: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-text">休日にする</span>
              </label>
              {holidayForm.isHoliday && (
                <input
                  type="text"
                  placeholder="休日名（任意）"
                  value={holidayForm.holidayName}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface"
                />
              )}
              <input
                type="text"
                placeholder="メモ（任意）"
                value={holidayForm.note}
                onChange={(e) => setHolidayForm({ ...holidayForm, note: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface"
              />
            </div>
          )}

          {/* イベント一覧 */}
          {selectedEvents.length > 0 ? (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              <p className="text-xs font-medium text-text-secondary">イベント ({selectedEvents.length}件)</p>
              {selectedEvents.map((evt) => {
                const cfg = categoryConfig[evt.category];
                const link = getSourceLink(evt.sourceType);
                return (
                  <div key={evt.id} className={`p-3 rounded-lg border ${cfg.color}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{cfg.label}</span>
                        <DivisionBadge division={evt.division} />
                      </div>
                      <span className="text-xs">{evt.status}</span>
                    </div>
                    <p className="text-sm mt-1">{evt.title}</p>
                    {link !== "#" && (
                      <Link href={link} className="inline-flex items-center gap-1 text-xs mt-1 text-primary-600 hover:underline">
                        <ExternalLink className="w-3 h-3" />伝票を開く
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary text-center py-4">この日のイベントはありません</p>
          )}
        </div>
      </Modal>
    </>
  );
}
