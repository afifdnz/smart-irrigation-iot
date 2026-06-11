import { useState, useEffect, useCallback } from "react";
import { getPlots } from "../api/plots";
import { getActuatorLogs, getLatestActuator, manualOverride } from "../api/actuators";

const POLL_INTERVAL = 10000;

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds} detik`;
  return `${Math.floor(seconds / 60)} menit ${seconds % 60 > 0 ? `${seconds % 60} detik` : ""}`.trim();
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function ActionBadge({ action }) {
  const a = action?.toUpperCase();
  if (a === "ON") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-semibold bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        ON
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-semibold bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      OFF
    </span>
  );
}

function TriggerBadge({ triggeredBy }) {
  const t = triggeredBy?.toLowerCase();
  if (t === "manual") {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 font-medium">
        Manual
      </span>
    );
  }
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-400 font-medium">
      Auto
    </span>
  );
}

// ── Status Card Per Plot ──────────────────────────────────────────────────────

function PlotStatusCard({ plot, latestLog, onOverride }) {
  const plotName = plot.plot_name || plot.PlotName;
  const plantName = plot.plant_name || plot.PlantName;
  const plotID = plot.id || plot.ID;

  const action = latestLog?.action || latestLog?.Action;
  const triggeredBy = latestLog?.triggered_by || latestLog?.TriggeredBy;
  const triggeredAt = latestLog?.triggered_at || latestLog?.TriggeredAt;
  const duration = latestLog?.duration_seconds || latestLog?.DurationSeconds;

  const isOn = action?.toUpperCase() === "ON";

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 transition-all duration-300 ${isOn ? "border-emerald-300 dark:border-emerald-600/50 shadow-md shadow-emerald-500/10" : "border-slate-200 dark:border-zinc-800"}`}>
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-base text-slate-900 dark:text-zinc-50 truncate">{plotName}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{plantName}</p>
        </div>
        {latestLog ? <ActionBadge action={action} /> : (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500">
            Tidak ada data
          </span>
        )}
      </div>

      {/* Info aktuasi terakhir */}
      {latestLog ? (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400">Dipicu oleh</span>
            <TriggerBadge triggeredBy={triggeredBy} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400">Durasi</span>
            <span className="text-slate-700 dark:text-zinc-300 font-medium">{formatDuration(duration)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400">Waktu</span>
            <span className="text-slate-700 dark:text-zinc-300 font-medium">{formatDateTime(triggeredAt)}</span>
          </div>
        </div>
      ) : (
        <div className="h-16 flex items-center mb-4">
          <p className="text-sm text-slate-400 dark:text-zinc-500 italic">Belum ada riwayat aktuasi</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onOverride(plotID, plotName, "ON")}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm shadow-emerald-600/20 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          ON
        </button>
        <button
          onClick={() => onOverride(plotID, plotName, "OFF")}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95 text-slate-700 dark:text-zinc-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          OFF
        </button>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ data, onConfirm, onCancel, loading }) {
  const [duration, setDuration] = useState(60);
  const isOn = data?.action === "ON";

  const durations = [
    { label: "30 detik", value: 30 },
    { label: "1 menit", value: 60 },
    { label: "2 menit", value: 120 },
    { label: "5 menit", value: 300 },
    { label: "10 menit", value: 600 },
    { label: "Custom", value: 0 },
  ];

  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState("");

  const finalDuration = custom ? parseInt(customVal) || 0 : duration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isOn ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-slate-100 dark:bg-zinc-800"}`}>
          <svg className={`w-6 h-6 ${isOn ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isOn
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            }
          </svg>
        </div>

        <h3 className="text-center font-semibold text-slate-900 dark:text-zinc-50 text-base mb-1">
          Konfirmasi Override Manual
        </h3>
        <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-5">
          Valve <strong className={isOn ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-zinc-300"}>{data?.action}</strong> untuk plot <strong className="text-slate-700 dark:text-zinc-300">{data?.plotName}</strong>
        </p>

        {/* Durasi — hanya tampil saat ON */}
        {isOn && (
          <div className="mb-5">
            <p className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-2">Durasi Penyiraman</p>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    if (d.value === 0) {
                      setCustom(true);
                      setDuration(0);
                    } else {
                      setCustom(false);
                      setDuration(d.value);
                    }
                  }}
                  className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${(d.value === 0 ? custom : duration === d.value && !custom)
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-400"
                    }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {custom && (
              <div className="mt-2 flex items-center gap-2">
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
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(finalDuration)}
            disabled={loading || (isOn && finalDuration <= 0)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isOn
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                : "bg-slate-800 dark:bg-zinc-700 hover:bg-slate-900 dark:hover:bg-zinc-600 text-white"
              }`}
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : null}
            {loading ? "Memproses..." : `Aktifkan ${data?.action}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Log Table ─────────────────────────────────────────────────────────────────

function LogTable({ logs, plotMap }) {
  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-500 dark:text-zinc-400 gap-3">
        <svg className="w-10 h-10 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Belum ada riwayat aktuasi</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-zinc-800">
            <th className="text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 py-3 pr-4">Plot</th>
            <th className="text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 py-3 pr-4">Aksi</th>
            <th className="text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 py-3 pr-4">Dipicu</th>
            <th className="text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 py-3 pr-4">Durasi</th>
            <th className="text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 py-3">Waktu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/50">
          {logs.map((log, idx) => {
            const plotID = log.plot_id || log.PlotID;
            const action = log.action || log.Action;
            const triggeredBy = log.triggered_by || log.TriggeredBy;
            const duration = log.duration_seconds || log.DurationSeconds;
            const triggeredAt = log.triggered_at || log.TriggeredAt;

            return (
              <tr key={log.id || log.ID || idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="py-3 pr-4">
                  <span className="font-medium text-slate-900 dark:text-zinc-50">
                    {plotMap[plotID] || `Plot #${plotID}`}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <ActionBadge action={action} />
                </td>
                <td className="py-3 pr-4">
                  <TriggerBadge triggeredBy={triggeredBy} />
                </td>
                <td className="py-3 pr-4 text-slate-600 dark:text-zinc-400">
                  {formatDuration(duration)}
                </td>
                <td className="py-3 text-slate-500 dark:text-zinc-400">
                  {formatDateTime(triggeredAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Control Page ─────────────────────────────────────────────────────────

export default function Control() {
  const [plots, setPlots] = useState([]);
  const [latestMap, setLatestMap] = useState({});
  const [allLogs, setAllLogs] = useState([]);
  const [plotMap, setPlotMap] = useState({});
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [logLoading, setLogLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const plotsRes = await getPlots();
      const plotList = (plotsRes?.data || []).filter((p) => p.is_active || p.IsActive);
      setPlots(plotList);

      // Map plotID → plotName untuk tabel log
      const pMap = {};
      plotList.forEach((p) => {
        pMap[p.id || p.ID] = p.plot_name || p.PlotName;
      });
      setPlotMap(pMap);

      // Fetch latest actuator per plot
      const latestResults = await Promise.allSettled(
        plotList.map((p) =>
          getLatestActuator(p.id || p.ID).then((r) => ({
            id: p.id || p.ID,
            data: r?.data,
          }))
        )
      );
      const newLatestMap = {};
      latestResults.forEach((r) => {
        if (r.status === "fulfilled" && r.value?.data) {
          newLatestMap[r.value.id] = r.value.data;
        }
      });
      setLatestMap(newLatestMap);

      // Fetch log semua plot (limit 10 per plot, gabungkan & sort)
      setLogLoading(true);
      const logResults = await Promise.allSettled(
        plotList.map((p) =>
          getActuatorLogs(p.id || p.ID, 10, 0).then((r) => r?.data || [])
        )
      );
      const merged = logResults
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => {
          const aTime = new Date(a.triggered_at || a.TriggeredAt);
          const bTime = new Date(b.triggered_at || b.TriggeredAt);
          return bTime - aTime;
        })
        .slice(0, 30); // tampilkan 30 terbaru

      setAllLogs(merged);
    } catch (e) {
      console.error("Control fetch error:", e);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleOverride = (plotID, plotName, action) => {
    setModal({ plotID, plotName, action });
  };

  const handleConfirm = async (duration) => {
    if (!modal) return;
    setLoading(true);
    try {
      await manualOverride(modal.plotID, {
        plot_id: modal.plotID,
        action: modal.action,
        duration_seconds: modal.action === "ON" ? duration : 0,
      });
      showToast(`Valve ${modal.action} berhasil diaktifkan untuk ${modal.plotName}`);
      setModal(null);
      await fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Gagal melakukan override";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Kontrol Irigasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Override manual valve per lahan
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-4 py-3">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Override manual akan menggantikan kontrol otomatis ESP32 sementara. Pastikan level air tandon mencukupi sebelum mengaktifkan valve.
        </p>
      </div>

      {/* ── Plot Status Cards ── */}
      <div>
        <h2 className="font-semibold text-base text-slate-900 dark:text-zinc-50 mb-4">
          Status Valve Per Lahan
        </h2>
        {plots.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center p-10 text-sm text-slate-500 dark:text-zinc-400">
            Tidak ada lahan aktif yang ditemukan
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plots.map((p) => {
              const plotID = p.id || p.ID;
              return (
                <PlotStatusCard
                  key={plotID}
                  plot={p}
                  latestLog={latestMap[plotID]}
                  onOverride={handleOverride}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Riwayat Log Aktuasi ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 lg:p-6 shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-semibold text-base text-slate-900 dark:text-zinc-50">
              Riwayat Aktuasi
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              30 aktuasi terbaru dari semua lahan
            </p>
          </div>
          {logLoading && (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-zinc-700 border-t-emerald-500 animate-spin" />
          )}
        </div>
        <LogTable logs={allLogs} plotMap={plotMap} />
      </div>

      {/* ── Confirm Modal ── */}
      {modal && (
        <ConfirmModal
          data={modal}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
          loading={loading}
        />
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "error"
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
      )}
    </div>
  );
}
