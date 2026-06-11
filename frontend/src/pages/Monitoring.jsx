import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPlots, createPlot, updatePlot, deactivatePlot } from "../api/plots";
import { getLatestSensor } from "../api/sensors";

const POLL_INTERVAL = 10000;

// --- MINI COMPONENTS ---
function ConnectionBadge({ lastSeen }) {
  const isOnline = lastSeen && (new Date() - new Date(lastSeen)) < 60000;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider shrink-0 ${isOnline
      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400"
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
      {isOnline ? "Online" : "Offline"}
    </div>
  );
}

function StatusRow({ label, value, unit, colorClass = "text-slate-900 dark:text-zinc-50" }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{label}</span>
      <span className={`text-sm font-semibold ${colorClass}`}>{value}{unit}</span>
    </div>
  );
}

export default function Monitoring() {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [sensorMap, setSensorMap] = useState({});
  const [selectedPlotID, setSelectedPlotID] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modal State untuk Create & Update
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [formData, setFormData] = useState({ id: null, plot_name: "", plant_name: "", is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const res = await getPlots();
      const plotList = res?.data || [];
      setPlots(plotList);

      const activePlots = plotList.filter(p => p.is_active || p.IsActive);

      const sensorResults = await Promise.allSettled(
        activePlots.map(p => getLatestSensor(p.ID || p.id))
      );

      const newMap = {};
      sensorResults.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value?.data) {
          newMap[activePlots[idx].ID || activePlots[idx].id] = r.value.data;
        }
      });
      setSensorMap(newMap);
      setLoading(false);
    } catch (err) {
      console.error("Monitoring Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMonitoringData]);

  // --- CRUD HANDLERS ---
  const handleOpenModal = (mode, plot = null) => {
    setModalMode(mode);
    if (mode === "edit" && plot) {
      setFormData({
        id: plot.ID || plot.id,
        plot_name: plot.PlotName || plot.plot_name,
        plant_name: plot.PlantName || plot.plant_name,
        is_active: plot.IsActive !== undefined ? plot.IsActive : plot.is_active
      });
    } else {
      setFormData({ id: null, plot_name: "", plant_name: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSavePlot = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        plot_name: formData.plot_name,
        plant_name: formData.plant_name,
        is_active: formData.is_active
      };

      if (modalMode === "create") {
        await createPlot(payload);
      } else {
        await updatePlot(formData.id, payload);
      }

      setIsModalOpen(false);
      fetchMonitoringData(); // Refresh data setelah simpan
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlot = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus lahan "${name}"? Data yang dihapus tidak bisa dikembalikan.`)) return;
    try {
      await deactivatePlot(id);
      fetchMonitoringData(); // Refresh data setelah hapus
    } catch (error) {
      console.error("Gagal menghapus data:", error);
      alert("Gagal menghapus lahan. Pastikan tidak ada data sensor yang terikat.");
    }
  };

  // --- FILTER LOGIC (Hanya untuk Card Grid atas) ---
  const displayPlots = selectedPlotID === "all"
    ? plots
    : plots.filter(p => (p.ID || p.id) === Number(selectedPlotID));

  return (
    <div className="w-full space-y-6 pb-10 relative">

      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Monitoring & Kelola Lahan</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 text-left">Pantau performa teknis dan kelola data lahan IoT</p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedPlotID}
            onChange={(e) => setSelectedPlotID(e.target.value)}
            className="w-full sm:w-48 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all cursor-pointer"
          >
            <option value="all">Semua Plot Lahan</option>
            {plots.map(p => (
              <option key={p.ID || p.id} value={p.ID || p.id}>
                {p.PlotName || p.plot_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleOpenModal("create")}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Lahan
          </button>
        </div>
      </div>

      {/* --- MONITORING GRID (Filtered) --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayPlots.map((p) => {
            const id = p.ID || p.id;
            const isActive = p.IsActive !== undefined ? p.IsActive : p.is_active;
            const sensor = sensorMap[id];
            const moisture = sensor?.SoilMoisturePct || sensor?.soil_moisture_pct || 0;

            return (
              <div key={id} className={`bg-white dark:bg-zinc-900 border ${isActive ? 'border-slate-200 dark:border-zinc-800' : 'border-red-200 dark:border-red-900/50 opacity-75'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative group`}>

                {/* Opsi Edit & Hapus (Hover) */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-zinc-800 z-10">
                  <button onClick={() => handleOpenModal("edit", p)} className="p-1.5 text-slate-400 hover:text-sky-500 rounded-md hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors" title="Edit Lahan">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDeletePlot(id, p.PlotName || p.plot_name)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Hapus Lahan">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                {/* Card Top */}
                <div className="flex justify-between items-start mb-5 pr-16">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-zinc-50 truncate flex items-center gap-2">
                      {p.PlotName || p.plot_name}
                      {!isActive && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold uppercase">Nonaktif</span>}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium uppercase tracking-wider mt-0.5">{p.PlantName || p.plant_name}</p>
                  </div>
                </div>

                {/* Card Center: Visual Indicator */}
                {isActive ? (
                  <div className="flex items-end gap-4 mb-6">
                    <div className="relative w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-end">
                      <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">{moisture}%</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Kelembapan Tanah</p>
                      </div>
                      <ConnectionBadge lastSeen={sensor?.RecordedAt || sensor?.recorded_at} />
                    </div>
                  </div>
                ) : (
                  <div className="h-16 mb-6 flex items-center justify-center bg-slate-50 dark:bg-zinc-950/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-400">
                    Lahan ini sedang dinonaktifkan
                  </div>
                )}

                {/* Card Bottom: Technical Specs */}
                <div className="space-y-1">
                  <StatusRow label="Status Tanah" value={sensor?.Status || "—"} colorClass={sensor?.Status === 'Kering' || sensor?.Status === 'kering' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400 uppercase text-[11px] font-bold'} />
                  <StatusRow label="Device ID" value={`ESP32-NODE-${id}`} />
                </div>

                {/* Action */}
                <button
                  disabled={!isActive}
                  onClick={() => navigate(`/plots/${id}`)}
                  className="w-full mt-5 py-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold rounded-xl transition-all border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lihat Detail Historis
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* --- RECENT TELEMETRY LOGS (Global & Unfiltered) --- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/50">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-zinc-50">Log Data Sensor Masuk</h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5 text-left">5 pembacaan terbaru dari seluruh lahan</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Stream</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/30 dark:bg-zinc-950/30">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase">Waktu Masuk</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase">Nama Lahan</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase">Data Sensor</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {plots
                .map((p) => {
                  const id = p.ID || p.id;
                  const sensor = sensorMap[id];
                  return {
                    plotName: p.PlotName || p.plot_name,
                    time: sensor?.RecordedAt || sensor?.recorded_at,
                    moisture: sensor?.SoilMoisturePct || sensor?.soil_moisture_pct || 0,
                    status: sensor?.Status || "—",
                    timestamp: new Date(sensor?.RecordedAt || sensor?.recorded_at || 0).getTime()
                  };
                })
                .filter(log => log.time) // Hanya plot yang punya data waktu yang sah
                .sort((a, b) => b.timestamp - a.timestamp) // Urutkan terbaru di atas
                .slice(0, 5) // Ambil 5 teratas
                .map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-zinc-500 tabular-nums">
                      {formatTime(log.time)}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {log.plotName}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-zinc-400">
                      Kelembapan: <span className="font-bold text-slate-800 dark:text-zinc-200">{log.moisture}%</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${log.status.toLowerCase() === 'kering'
                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}

              {/* Fallback jika kosong */}
              {plots.length === 0 || Object.keys(sensorMap).length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-xs text-slate-500 dark:text-zinc-500">
                    Belum ada data sensor yang masuk ke sistem.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL FORM (Create/Edit) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200">

            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                {modalMode === "create" ? "Tambah Lahan Baru" : "Edit Data Lahan"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSavePlot} className="p-5 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Nama Lahan</label>
                <input
                  required
                  type="text"
                  value={formData.plot_name}
                  onChange={(e) => setFormData({ ...formData, plot_name: e.target.value })}
                  placeholder="Contoh: Lahan Tomat A"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/40 outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Jenis Tanaman</label>
                <input
                  required
                  type="text"
                  value={formData.plant_name}
                  onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
                  placeholder="Contoh: Solanum lycopersicum"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/40 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Lahan Aktif (Monitor dihidupkan)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// Fungsi Bantuan (Helper)
function formatTime(iso) {
  if (!iso) return "—:—";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
