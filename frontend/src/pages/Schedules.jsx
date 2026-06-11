import { useState, useEffect, useCallback } from "react";
import { getPlots } from "../api/plots";
import {
  getSchedulesByPlot,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../api/schedules";

// ── Utils ─────────────────────────────────────────────────────────────────────

const DAY_LABELS = {
  1: "Sen", 2: "Sel", 3: "Rab", 4: "Kam",
  5: "Jum", 6: "Sab", 7: "Min",
};

const DAY_FULL = {
  1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis",
  5: "Jumat", 6: "Sabtu", 7: "Minggu",
};

function parseDays(str) {
  if (!str) return [];
  return str.split(",").map((d) => parseInt(d.trim())).filter(Boolean);
}

function formatDays(arr) {
  return arr.sort((a, b) => a - b).join(",");
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds} detik`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} mnt ${s} dtk` : `${m} menit`;
}

function formatTime(timeStr) {
  if (!timeStr) return "—";

  // Deteksi jika format menggunakan ISO string (mengandung huruf 'T')
  if (timeStr.includes("T")) {
    // Memisahkan berdasarkan 'T', ambil bagian kedua ("06:00:00Z"), lalu potong 5 karakter ("06:00")
    return timeStr.split("T")[1].substring(0, 5);
  }

  // Fallback jika format yang masuk sudah berupa string "06:00:00"
  return timeStr.substring(0, 5);
}// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all ${toast.type === "error"
      ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
      : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50"
      }`}>
      {toast.type === "error" ? (
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {toast.message}
    </div>
  );
}

// ── Schedule Card ─────────────────────────────────────────────────────────────

function ScheduleCard({ schedule, onEdit, onDelete, onToggle, toggling }) {
  const id = schedule.id || schedule.ID;
  const startTime = schedule.start_time || schedule.StartTime;
  const duration = schedule.duration_seconds || schedule.DurationSeconds;
  const daysOfWeek = schedule.days_of_week || schedule.DaysOfWeek;
  const isActive = schedule.is_active ?? schedule.IsActive;

  const days = parseDays(daysOfWeek);

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 transition-all duration-300 ${isActive
      ? "border-emerald-200 dark:border-emerald-700/50"
      : "border-slate-200 dark:border-zinc-800 opacity-70"
      }`}>
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Jam besar */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive
            ? "bg-emerald-50 dark:bg-emerald-500/10"
            : "bg-slate-100 dark:bg-zinc-800"
            }`}>
            <svg className={`w-5 h-5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
              {formatTime(startTime)}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{formatDuration(duration)}</p>
          </div>
        </div>

        {/* Toggle aktif */}
        <button
          onClick={() => onToggle(schedule)}
          disabled={toggling === id}
          className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 focus:outline-none disabled:opacity-50 ${isActive ? "bg-emerald-500" : "bg-slate-200 dark:bg-zinc-700"
            }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${isActive ? "translate-x-5" : "translate-x-0"
            }`} />
        </button>
      </div>

      {/* Hari aktif */}
      <div className="flex gap-1 flex-wrap mb-4">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <span key={d} className={`text-[11px] w-8 h-7 flex items-center justify-center rounded-lg font-medium transition-colors ${days.includes(d)
            ? "bg-emerald-500 text-white"
            : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
            }`}>
            {DAY_LABELS[d]}
          </span>
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${isActive
          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
          : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400"
          }`}>
          {isActive ? "Aktif" : "Nonaktif"}
        </span>

        {/* Action buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onEdit(schedule)}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(schedule)}
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form Modal (Create / Edit) ────────────────────────────────────────────────

const DURATION_PRESETS = [
  { label: "1 menit", value: 60 },
  { label: "2 menit", value: 120 },
  { label: "5 menit", value: 300 },
  { label: "10 menit", value: 600 },
  { label: "15 menit", value: 900 },
  { label: "30 menit", value: 1800 },
];

function ScheduleFormModal({ initial, plots, selectedPlotID, onSave, onCancel, loading }) {
  const isEdit = !!initial;

  const [plotID, setPlotID] = useState(
    initial ? (initial.plot_id || initial.PlotID) : (selectedPlotID || "")
  );
  const [startTime, setStartTime] = useState(
    initial ? formatTime(initial.start_time || initial.StartTime) : "06:00"
  );
  const [duration, setDuration] = useState(
    initial ? (initial.duration_seconds || initial.DurationSeconds || 60) : 60
  );
  const [customDuration, setCustomDuration] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [days, setDays] = useState(
    initial ? parseDays(initial.days_of_week || initial.DaysOfWeek) : [1, 3, 5]
  );

  const toggleDay = (d) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const finalDuration = customDuration ? parseInt(customVal) || 0 : duration;

  const handleSubmit = () => {
    if (!plotID || !startTime || days.length === 0 || finalDuration <= 0) return;

    // 1. Ambil tanggal hari ini dalam format YYYY-MM-DD (menggunakan UTC)
    const today = new Date().toISOString().split('T')[0];

    // 2. Gabungkan tanggal, jam dari input, dan akhiran Z (Penanda UTC)
    const formattedStartTime = `${today}T${startTime}:00Z`;

    onSave({
      plot_id: parseInt(plotID),
      start_time: formattedStartTime, // Data yang dikirim sekarang menjadi "2026-05-25T06:00:00Z"
      duration_seconds: finalDuration,
      days_of_week: formatDays(days),
      is_active: initial ? (initial.is_active ?? initial.IsActive ?? true) : true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-50 text-base">
            {isEdit ? "Edit Jadwal" : "Jadwal Baru"}
          </h3>
          <button onClick={onCancel} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">

          {/* Pilih Plot */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                Lahan / Plot
              </label>
              <select
                value={plotID}
                onChange={(e) => setPlotID(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              >
                <option value="">-- Pilih Plot --</option>
                {plots.map((p) => (
                  <option key={p.id || p.ID} value={p.id || p.ID}>
                    {p.plot_name || p.PlotName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Jam mulai */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Jam Mulai
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
            />
          </div>

          {/* Durasi */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Durasi Penyiraman
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => { setCustomDuration(false); setDuration(d.value); }}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${duration === d.value && !customDuration
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-400"
                    }`}
                >
                  {d.label}
                </button>
              ))}
              <button
                onClick={() => setCustomDuration(true)}
                className={`py-2 rounded-xl text-xs font-medium border transition-all ${customDuration
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-400"
                  }`}
              >
                Custom
              </button>
            </div>
            {customDuration && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  placeholder="Masukkan detik..."
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0">detik</span>
              </div>
            )}
          </div>

          {/* Hari aktif */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Hari Aktif
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`flex-1 min-w-[2.5rem] py-2 rounded-xl text-xs font-medium border transition-all ${days.includes(d)
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-400"
                    }`}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
            {/* Shortcut */}
            <div className="flex gap-2 mt-2">
              {[
                { label: "Weekday", days: [1, 2, 3, 4, 5] },
                { label: "Weekend", days: [6, 7] },
                { label: "Setiap hari", days: [1, 2, 3, 4, 5, 6, 7] },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setDays(s.days)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-zinc-700 transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Preview */}
        {days.length > 0 && finalDuration > 0 && startTime && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700">
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Preview Jadwal</p>
            <p className="text-sm text-slate-700 dark:text-zinc-300">
              Setiap <strong>{days.map((d) => DAY_FULL[d]).join(", ")}</strong> pukul <strong>{startTime}</strong> selama <strong>{formatDuration(finalDuration)}</strong>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !plotID || days.length === 0 || finalDuration <= 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Jadwal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ schedule, onConfirm, onCancel, loading }) {
  const startTime = schedule?.start_time || schedule?.StartTime;
  const daysOfWeek = schedule?.days_of_week || schedule?.DaysOfWeek;
  const days = parseDays(daysOfWeek);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-center font-semibold text-slate-900 dark:text-zinc-50 mb-1">Hapus Jadwal?</h3>
        <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-5">
          Jadwal pukul <strong className="text-slate-700 dark:text-zinc-300">{formatTime(startTime)}</strong> setiap <strong className="text-slate-700 dark:text-zinc-300">{days.map((d) => DAY_LABELS[d]).join(", ")}</strong> akan dihapus permanen.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-all">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Schedules Page ───────────────────────────────────────────────────────

export default function Schedules() {
  const [plots, setPlots] = useState([]);
  const [schedulesByPlot, setSchedulesByPlot] = useState({});
  const [selectedPlotID, setSelectedPlotID] = useState(null);
  const [formModal, setFormModal] = useState(null); // null | { mode: "create"|"edit", data?: schedule }
  const [deleteModal, setDeleteModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const plotsRes = await getPlots();
      const plotList = plotsRes?.data || [];
      setPlots(plotList);

      // Auto pilih plot pertama
      const firstID = plotList[0]?.id || plotList[0]?.ID;
      setSelectedPlotID((prev) => prev ?? firstID ?? null);

      // Fetch jadwal semua plot aktif
      const results = await Promise.allSettled(
        plotList
          .filter((p) => p.is_active || p.IsActive)
          .map((p) =>
            getSchedulesByPlot(p.id || p.ID).then((r) => ({
              plotID: p.id || p.ID,
              schedules: r?.data || [],
            }))
          )
      );

      const newMap = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          newMap[r.value.plotID] = r.value.schedules;
        }
      });
      setSchedulesByPlot(newMap);
    } catch (e) {
      console.error("Schedules fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── CRUD Handlers ──

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (formModal?.mode === "edit") {
        const id = formModal.data.id || formModal.data.ID;
        await updateSchedule(id, formData);
        showToast("Jadwal berhasil diperbarui");
      } else {
        await createSchedule(formData.plot_id, formData);
        showToast("Jadwal berhasil dibuat");
      }
      setFormModal(null);
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal menyimpan jadwal", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const id = deleteModal.id || deleteModal.ID;
      await deleteSchedule(id);
      showToast("Jadwal berhasil dihapus");
      setDeleteModal(null);
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal menghapus jadwal", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (schedule) => {
    const id = schedule.id || schedule.ID;
    const isActive = schedule.is_active ?? schedule.IsActive;
    setToggling(id);
    try {
      await updateSchedule(id, {
        start_time: schedule.start_time || schedule.StartTime,
        duration_seconds: schedule.duration_seconds || schedule.DurationSeconds,
        days_of_week: schedule.days_of_week || schedule.DaysOfWeek,
        is_active: !isActive,
      });
      showToast(`Jadwal ${!isActive ? "diaktifkan" : "dinonaktifkan"}`);
      await fetchData();
    } catch (err) {
      showToast("Gagal mengubah status jadwal", "error");
    } finally {
      setToggling(null);
    }
  };

  // ── Derived ──

  const activePlots = plots.filter((p) => p.is_active || p.IsActive);
  const currentSchedules = selectedPlotID ? (schedulesByPlot[selectedPlotID] || []) : [];
  const selectedPlot = plots.find((p) => (p.id || p.ID) === selectedPlotID);
  const totalSchedules = Object.values(schedulesByPlot).reduce((s, arr) => s + arr.length, 0);
  const activeSchedules = Object.values(schedulesByPlot)
    .flat()
    .filter((s) => s.is_active || s.IsActive).length;

  return (
    <div className="w-full space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Jadwal Irigasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola jadwal penyiraman otomatis per lahan
          </p>
        </div>
        <button
          onClick={() => setFormModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-sm shadow-emerald-600/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Jadwal Baru
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Jadwal</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">{totalSchedules}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mb-3">
            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Jadwal Aktif</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">{activeSchedules}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 transition-colors col-span-2 lg:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-3">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Plot Terjadwal</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
            {Object.keys(schedulesByPlot).filter((k) => schedulesByPlot[k].length > 0).length}
          </p>
        </div>
      </div>

      {/* ── Plot Tabs ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-colors">

        {/* Tab bar */}
        <div className="flex gap-1 p-3 border-b border-slate-100 dark:border-zinc-800 overflow-x-auto">
          {activePlots.map((p) => {
            const pid = p.id || p.ID;
            const count = schedulesByPlot[pid]?.length || 0;
            const isSelected = selectedPlotID === pid;
            return (
              <button
                key={pid}
                onClick={() => setSelectedPlotID(pid)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${isSelected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
              >
                {p.plot_name || p.PlotName}
                {count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : currentSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-500 dark:text-zinc-400 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Belum ada jadwal</p>
                <p className="text-sm">untuk {selectedPlot?.plot_name || selectedPlot?.PlotName}</p>
              </div>
              <button
                onClick={() => setFormModal({ mode: "create" })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Tambah Jadwal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSchedules.map((s) => (
                <ScheduleCard
                  key={s.id || s.ID}
                  schedule={s}
                  onEdit={(sc) => setFormModal({ mode: "edit", data: sc })}
                  onDelete={setDeleteModal}
                  onToggle={handleToggle}
                  toggling={toggling}
                />
              ))}
              {/* Add card */}
              <button
                onClick={() => setFormModal({ mode: "create" })}
                className="bg-slate-50 dark:bg-zinc-800/50 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all min-h-[180px]"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Tambah Jadwal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {formModal && (
        <ScheduleFormModal
          initial={formModal.mode === "edit" ? formModal.data : null}
          plots={activePlots}
          selectedPlotID={selectedPlotID}
          onSave={handleSave}
          onCancel={() => setFormModal(null)}
          loading={saving}
        />
      )}

      {deleteModal && (
        <DeleteModal
          schedule={deleteModal}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
