import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { getPlots } from "../api/plots";
import { getTanks } from "../api/tanks";
import { getLatestSensor, getSensorReadings } from "../api/sensors";
import { getLatestWaterLevel } from "../api/waterLevels";
import { getLatestActuator } from "../api/actuators";

const POLL_INTERVAL = 10000;

// --- UTILS ---
function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function statusStyle(s) {
  const status = s?.toLowerCase();
  if (status === "kering") {
    return { text: "Kering", color: "text-red-500 dark:text-red-400", badge: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400" };
  }
  if (status === "basah") {
    return { text: "Basah", color: "text-sky-500 dark:text-sky-400", badge: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400" };
  }
  return { text: "Optimal", color: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" };
}

// --- COMPONENTS ---
function StatCard({ icon, label, value, sub, accent }) {
  const isLoaded = value !== null && value !== undefined;

  const iconBg = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400",
    slate: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  }[accent] || "bg-slate-100 dark:bg-zinc-800";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 transition-colors duration-300">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          {icon}
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-zinc-50 mt-1 tracking-tight">
          {isLoaded ? value : <span className="inline-block w-16 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 animate-pulse align-middle" />}
        </p>
        {sub && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function PlotCard({ plot, sensor, onClick }) {
  const s = sensor ? statusStyle(sensor.Status || sensor.status) : null;
  const plotName = plot.PlotName || plot.plot_name;
  const plantName = plot.PlantName || plot.plant_name;

  return (
    <div onClick={onClick} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group flex flex-col justify-between h-full">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-base text-slate-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">{plotName}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{plantName}</p>
        </div>
        {s && <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium shrink-0 ${s.badge}`}>{s.text}</span>}
      </div>

      {sensor ? (
        <div>
          <p className={`text-3xl font-bold tracking-tight ${s?.color}`}>{sensor.SoilMoisturePct || sensor.soil_moisture_pct}%</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">Pukul {formatTime(sensor.RecordedAt || sensor.recorded_at)}</p>
        </div>
      ) : (
        <div className="flex items-center h-12">
          <p className="text-sm text-slate-500 dark:text-zinc-400 italic">Belum ada data sensor</p>
        </div>
      )}
    </div>
  );
}

function TankCard({ tank, level }) {
  const tankName = tank.tank_name || tank.TankName;
  const capacity = tank.capacity_liters || tank.CapacityLiters;
  const heightCm = tank.height_cm || tank.HeightCm;
  const minLevelCm = tank.min_level_cm || tank.MinLevelCm;

  const currentLevel = level?.water_level_cm || level?.WaterLevelCm || 0;
  const currentVol = level?.water_volume_l || level?.WaterVolumeL || 0;

  const pct = level ? Math.min((currentLevel / heightCm) * 100, 100) : 0;
  const isLow = level && currentLevel <= minLevelCm;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 transition-colors duration-300">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-base text-slate-900 dark:text-zinc-50 truncate">{tankName}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Kapasitas {capacity} L</p>
        </div>
        {level && (
          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium shrink-0 ${isLow ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400" : "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400"}`}>
            {isLow ? "Air Rendah" : "Normal"}
          </span>
        )}
      </div>

      {level ? (
        <div>
          <p className={`text-3xl font-bold tracking-tight ${isLow ? "text-red-500 dark:text-red-400" : "text-sky-600 dark:text-sky-400"}`}>{currentVol.toFixed(0)} L</p>
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 mt-1.5 mb-2.5">
            <span>{currentLevel.toFixed(1)} cm</span>
            <span>{pct.toFixed(0)}% penuh</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isLow ? "bg-red-500" : "bg-sky-500"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <div className="flex items-center h-16">
          <p className="text-sm text-slate-500 dark:text-zinc-400 italic">Belum ada data level air</p>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2 shadow-lg rounded-xl transition-colors duration-300">
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">{label}</p>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          {payload[0].value}% <span className="text-[10px] font-normal text-slate-400">Kelembapan</span>
        </p>
      </div>
    );
  }
  return null;
}

// --- MAIN DASHBOARD ---
export default function Dashboard() {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [sensorMap, setSensorMap] = useState({});
  const [levelMap, setLevelMap] = useState({});
  const [lastActuator, setLastActuator] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [selectedPlotID, setSelectedPlotID] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(false);

  const fetchChart = useCallback(async (plotID) => {
    if (!plotID) return;
    try {
      const res = await getSensorReadings(plotID, 12, 0);
      const rawData = res?.data || [];
      const sorted = [...rawData].reverse();

      setChartData(sorted.map((r) => ({
        time: formatTime(r.RecordedAt || r.recorded_at),
        moisture: r.SoilMoisturePct || r.soil_moisture_pct
      })));
    } catch (err) {
      console.error("Fetch Chart Error:", err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [plotsRes, tanksRes] = await Promise.all([getPlots(), getTanks()]);

      const plotList = plotsRes?.data || [];
      const tankList = tanksRes?.data || [];

      setPlots(plotList);
      setTanks(tankList);

      const activePlots = plotList.filter(p => (p.is_active || p.IsActive) && (p.id || p.ID));
      const validTanks = tankList.filter(t => (t.id || t.ID));

      const [sensorResults, levelResults, actuatorResults] = await Promise.all([
        Promise.allSettled(activePlots.map(p => getLatestSensor(p.id || p.ID))),
        Promise.allSettled(validTanks.map(t => getLatestWaterLevel(t.id || t.ID))),
        Promise.allSettled(activePlots.map(p => getLatestActuator(p.id || p.ID).then(r => ({
          plotName: p.PlotName || p.plot_name,
          data: r?.data
        }))))
      ]);

      const newSensorMap = {};
      sensorResults.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value?.data) {
          newSensorMap[activePlots[idx].ID || activePlots[idx].id] = r.value.data;
        }
      });
      setSensorMap(newSensorMap);

      const newLevelMap = {};
      levelResults.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value?.data) {
          newLevelMap[validTanks[idx].ID || validTanks[idx].id] = r.value.data;
        }
      });
      setLevelMap(newLevelMap);

      const validActuators = actuatorResults
        .filter((r) => r.status === "fulfilled" && r.value?.data)
        .map((r) => r.value)
        .sort((a, b) => new Date(b.data.TriggeredAt || b.data.triggered_at) - new Date(a.data.TriggeredAt || a.data.triggered_at));

      if (validActuators.length > 0) setLastActuator(validActuators[0]);

      setLastUpdate(new Date());
      setError(false);
    } catch (e) {
      console.error("Fetch All Error:", e);
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    if (selectedPlotID) fetchChart(selectedPlotID);
  }, [selectedPlotID, fetchChart]);

  // Derived States
  const activePlots = Array.isArray(plots) ? plots.filter((p) => p.is_active || p.IsActive) : [];
  const moistures = Object.values(sensorMap).map((s) => s.SoilMoisturePct || s.soil_moisture_pct);
  const avgMoisture = moistures.length ? (moistures.reduce((a, b) => a + b, 0) / moistures.length).toFixed(1) : null;
  const totalVolume = Object.values(levelMap).reduce((s, l) => s + (l.water_volume_l || l.WaterVolumeL || 0), 0);

  return (
    <div className="w-full space-y-5 pb-10">

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Dashboard Utama</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
            {lastUpdate ? `Update: ${lastUpdate.toLocaleTimeString("id-ID")}` : "Memuat data..."}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">A</div>
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-50 hidden sm:block">Admin Sistem</span>
        </div>
      </div>

      {/* --- ERROR ALERT --- */}
      {error && (
        <div className="flex items-center gap-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" /></svg>
          <p>Koneksi ke server terputus. Pastikan Backend & API aktif.</p>
        </div>
      )}

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          accent="emerald"
          label="Rata-rata Kelembapan"
          value={avgMoisture ? `${avgMoisture}%` : null}
          sub={`${moistures.length} sensor terkoneksi`}
          icon={<path d="M12 3c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />}
        />
        <StatCard
          accent="sky"
          label="Total Volume Air"
          value={totalVolume > 0 ? `${totalVolume.toFixed(0)} L` : (levelMap && Object.keys(levelMap).length > 0 ? "0 L" : null)}
          sub={`${tanks.length} tandon terdaftar`}
          icon={<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>}
        />
        <StatCard
          accent="slate"
          label="Lahan Aktif"
          value={Array.isArray(plots) && plots.length > 0 ? activePlots.length : null}
          sub={`dari ${plots.length} total lahan`}
          icon={<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>}
        />
        <StatCard
          accent="amber"
          label="Aktuasi Pompa Terakhir"
          value={lastActuator ? lastActuator.data.Action || lastActuator.data.action : null}
          sub={lastActuator ? `${lastActuator.plotName} · ${formatDateTime(lastActuator.data.TriggeredAt || lastActuator.data.triggered_at)}` : "Standby"}
          icon={<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />}
        />
      </div>

      {/* --- CHART SECTION --- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 lg:p-6 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-base text-slate-900 dark:text-zinc-50">Tren Kelembapan Tanah</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 text-left">Siklus 12 pembacaan terakhir</p>
          </div>
          <select
            value={selectedPlotID ?? ""}
            onChange={(e) => setSelectedPlotID(Number(e.target.value))}
            className="w-full sm:w-auto text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-50 rounded-xl px-4 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
          >
            <option value="">-- Pilih Area Lahan --</option>
            {activePlots.map((p) => (
              <option key={p.ID || p.id} value={p.ID || p.id}>
                {p.PlotName || p.plot_name}
              </option>
            ))}
          </select>
        </div>

        {chartData.length > 0 ? (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#moistureGrad)" animationDuration={1000} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0, fill: "#059669" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-sm text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-950/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 gap-3">
            {selectedPlotID ? (
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-zinc-800 border-t-emerald-500 animate-spin" />
            ) : (
              <svg className="w-8 h-8 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            )}
            <p>{selectedPlotID ? "Menyinkronkan data..." : "Silakan pilih lahan untuk melihat grafik"}</p>
          </div>
        )}
      </div>

      {/* --- GRID PLOTS & TANKS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Plot Section */}
        <div className="lg:col-span-2 flex flex-col">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-zinc-50 mb-4 tracking-tight">Status Kondisi Lahan</h2>
          {activePlots.length === 0 ? (
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center p-8 text-sm text-slate-500 dark:text-zinc-400">
              Tidak ada lahan yang aktif saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activePlots.map((p) => (
                <PlotCard
                  key={p.ID || p.id}
                  plot={p}
                  sensor={sensorMap[p.ID || p.id]}
                  onClick={() => navigate(`/plots/${p.ID || p.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tank Section */}
        <div className="flex flex-col">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-zinc-50 mb-4 tracking-tight">Ketersediaan Tandon Air</h2>
          {tanks.length === 0 ? (
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center p-8 text-sm text-slate-500 dark:text-zinc-400">
              Belum ada tandon yang dikonfigurasi.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {tanks.map((t) => (
                <TankCard
                  key={t.ID || t.id}
                  tank={t}
                  level={levelMap[t.ID || t.id]}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
