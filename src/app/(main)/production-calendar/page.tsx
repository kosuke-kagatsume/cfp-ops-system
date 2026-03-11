"use client";

import { Header } from "@/components/header";
import { Modal, FormField, FormInput, FormSelect } from "@/components/modal";
import { useToast } from "@/components/toast";
import { calendarEvents, calendarEventColors, type CalendarEventType } from "@/lib/dummy-data-phase1";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

const plants = ["高松工場", "美の浜工場", "四日市工場"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

export default function ProductionCalendarPage() {
  const [selectedPlant, setSelectedPlant] = useState("高松工場");
  const [currentYear] = useState(2026);
  const [currentMonth] = useState(2); // March = 2 (0-indexed)
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { showToast } = useToast();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const plantEvents = calendarEvents.filter((e) => e.plant === selectedPlant);

  const getEventsForDay = (day: number) => {
    const dateStr = `2026-03-${String(day).padStart(2, "0")}`;
    return plantEvents.filter((e) => e.date === dateStr);
  };

  return (
    <>
      <Header title="生産カレンダー" />
      <div className="p-6 space-y-4">
        {/* 工場切替 + 月切替 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-surface-tertiary rounded-lg p-1">
            {plants.map((plant) => (
              <button key={plant} onClick={() => setSelectedPlant(plant)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${selectedPlant === plant ? "bg-surface font-medium text-text shadow-sm" : "text-text-secondary hover:text-text"}`}>
                {plant}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => showToast("前月表示（開発中）", "info")} className="p-2 hover:bg-surface-tertiary rounded-lg"><ChevronLeft className="w-5 h-5 text-text-secondary" /></button>
            <h2 className="text-lg font-bold text-text">2026年 3月</h2>
            <button onClick={() => showToast("翌月表示（開発中）", "info")} className="p-2 hover:bg-surface-tertiary rounded-lg"><ChevronRight className="w-5 h-5 text-text-secondary" /></button>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors ml-2">
              <Plus className="w-4 h-4" />予定追加
            </button>
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4">
          {(Object.entries(calendarEventColors) as [CalendarEventType, string][]).map(([type, cls]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded border ${cls}`} />
              <span className="text-xs text-text-secondary">{type}</span>
            </div>
          ))}
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
              const events = getEventsForDay(day);
              const isToday = day === 11;
              const dateStr = `2026-03-${String(day).padStart(2, "0")}`;

              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[100px] border-b border-r border-border p-1.5 text-left hover:bg-primary-50/30 transition-colors ${isToday ? "bg-primary-50/50" : ""}`}>
                  <span className={`inline-flex w-6 h-6 items-center justify-center text-xs rounded-full ${
                    isToday ? "bg-primary-600 text-white font-bold" :
                    dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-text-secondary"
                  }`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {events.map((event) => (
                      <div key={event.id} className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${calendarEventColors[event.type]}`}>
                        {event.details.length > 15 ? event.details.slice(0, 15) + "..." : event.details}
                      </div>
                    ))}
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
          <button onClick={() => { setShowNewModal(false); showToast("予定を追加しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">追加する</button>
        </>}>
        <div className="space-y-4">
          <FormField label="工場" required><FormSelect placeholder="選択" options={plants.map((p) => ({ value: p, label: p }))} /></FormField>
          <FormField label="日付" required><FormInput type="date" defaultValue="2026-03-12" /></FormField>
          <FormField label="種別" required><FormSelect placeholder="選択" options={[
            { value: "生産", label: "生産" }, { value: "工事", label: "工事" }, { value: "休み", label: "休み" }, { value: "その他", label: "その他" },
          ]} /></FormField>
          <FormField label="内容" required><FormInput placeholder="例: PP ルーダー稼働（PP-CRS-W-B1 → PP-PEL-W-A1）" /></FormField>
        </div>
      </Modal>

      {/* 日付詳細モーダル */}
      <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? `${selectedDate} - ${selectedPlant}` : ""}
        footer={<>
          <button onClick={() => { showToast("この日に予定を追加（開発中）", "info"); }} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">予定追加</button>
          <button onClick={() => setSelectedDate(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        </>}>
        {selectedDate && (() => {
          const dayEvents = plantEvents.filter((e) => e.date === selectedDate);
          return dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div key={event.id} className={`p-3 rounded-lg border ${calendarEventColors[event.type]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{event.type}</span>
                  </div>
                  <p className="text-sm">{event.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary text-center py-8">この日の予定はありません</p>
          );
        })()}
      </Modal>
    </>
  );
}
