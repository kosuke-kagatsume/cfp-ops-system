"use client";

import { Header } from "@/components/header";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";

type CalendarEvent = {
  id: string;
  date: string;
  category: "arrival" | "shipment" | "production";
  title: string;
  status: string;
  sourceType: string;
  sourceId: string;
};

type Plant = {
  id: string;
  code: string;
  name: string;
};

const categoryConfig = {
  arrival: { label: "入荷", color: "bg-blue-100 text-blue-800 border-blue-300", dot: "bg-blue-500" },
  shipment: { label: "出荷", color: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
  production: { label: "生産", color: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-500" },
};

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getSourceLink(sourceType: string, sourceId: string): string {
  switch (sourceType) {
    case "Purchase": return `/purchases`;
    case "Shipment": return `/shipments`;
    case "ProcessingOrder": return `/processing`;
    default: return "#";
  }
}

export default function OperationsCalendarPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(2); // 0-indexed
  const [plantId, setPlantId] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(["arrival", "shipment", "production"]));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const apiMonth = currentMonth + 1;

  // 工場リスト取得
  const { data: plants } = useSWR<Plant[]>("/api/masters/plants", fetcher);

  // イベント取得
  const categoryParam = Array.from(activeCategories).join(",");
  const { data: eventData, isLoading } = useSWR<{ events: CalendarEvent[] }>(
    `/api/calendar/operations?year=${currentYear}&month=${apiMonth}${plantId ? `&plantId=${plantId}` : ""}${categoryParam ? `&category=${categoryParam}` : ""}`,
    fetcher
  );

  const events = eventData?.events ?? [];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const dateStr = `${currentYear}-${String(apiMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
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

  const selectedEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];

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
          <div className="flex items-center gap-3">
            {(Object.entries(categoryConfig) as [string, typeof categoryConfig.arrival][]).map(([key, cfg]) => (
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
                const dayEvents = getEventsForDay(day);
                const today = new Date();
                const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
                const dateStr = `${currentYear}-${String(apiMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[60px] md:min-h-[100px] border-b border-r border-border p-1.5 text-left hover:bg-primary-50/30 transition-colors ${isToday ? "bg-primary-50/50" : ""}`}
                  >
                    <span className={`inline-flex w-6 h-6 items-center justify-center text-xs rounded-full ${
                      isToday ? "bg-primary-600 text-white font-bold" :
                      dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-text-secondary"
                    }`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const cfg = categoryConfig[evt.category];
                        return (
                          <div key={evt.id} className={`text-[10px] px-1 py-0.5 rounded border truncate ${cfg.color}`}>
                            {evt.title.length > 20 ? evt.title.slice(0, 20) + "..." : evt.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-text-tertiary text-center">+{dayEvents.length - 3}件</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 日クリックモーダル */}
      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? `${selectedDate} のイベント` : ""}
        footer={
          <button onClick={() => setSelectedDate(null)} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">閉じる</button>
        }
      >
        {selectedEvents.length > 0 ? (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedEvents.map((evt) => {
              const cfg = categoryConfig[evt.category];
              const link = getSourceLink(evt.sourceType, evt.sourceId);
              return (
                <div key={evt.id} className={`p-3 rounded-lg border ${cfg.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{cfg.label}</span>
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
          <p className="text-sm text-text-tertiary text-center py-8">この日のイベントはありません</p>
        )}
      </Modal>
    </>
  );
}
