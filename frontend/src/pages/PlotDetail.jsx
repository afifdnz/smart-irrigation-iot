import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { getPlots } from "../api/plots";
import { getSensorReadings } from "../api/sensors";
import { getLatestActuator } from "../api/actuators";

export default function PlotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plot, setPlot] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [actuatorLog, setActuatorLog] = useState(null);
  const [historyTable, setHistoryTable] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetailData = useCallback(async () => {
    try {
      // 1. Ambil info plot
      const resPlots = await getPlots();
      const currentPlot = resPlots?.data?.find(p => (p.ID || p.id) === Number(id));
      setPlot(currentPlot);

      // 2. Ambil Data Sensor
      const resSensors = await getSensorReadings(id, 50, 0);
      const rawSensors = resSensors?.data || [];

      // Data untuk Tabel
      setHistoryTable(rawSensors);

      // Data untuk Chart (Waktu berjalan kiri ke kanan)
      const formattedChart = [...rawSensors].reverse().map(r => ({
        time: new Date(r.RecordedAt || r.recorded_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        moisture: r.SoilMoisturePct || r.soil_moisture_pct,
        aiPred: r.AiPredMins != null ? r.AiPredMins : (r.ai_pred_mins != null ? r.ai_pred_mins : null),
        fullTime: new Date(r.RecordedAt || r.recorded_at).toLocaleString("id-ID")
      }));
      setChartData(formattedChart);

      // 3. Ambil Log Aktuator terakhir
      const resActuator = await getLatestActuator(id);
      setActuatorLog(resActuator?.data);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching plot detail:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchDetailData();
    const interval = setInterval(fetchDetailData, 30000);
    return () => clearInterval(interval);
  }, [fetchDetailData]);

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500">Memuat detail lahan...</div>;
  if (!plot) return <div className="p-10 text-center text-red-500">Lahan tidak ditemukan.</div>;

  // Data Prediksi AI Terakhir untuk Grid Card
  const latestAiPred = chartData[chartData.length - 1]?.aiPred;

  return (
    <div className="w-full space-y-6 pb-10">

      {/* --- BREADCRUMB & HEADER --- */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mb-2"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          KEMBALI KE MONITORING
        </button>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{plot.PlotName || plot.plot_name}</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Ditanami: {plot.PlantName || plot.plant_name}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${(plot.IsActive || plot.is_active)
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : "bg-slate-100 border-slate-200 text-slate-400"
              }`}>
              {(plot.IsActive || plot.is_active) ? "Status: Aktif" : "Status: Nonaktif"}
            </span>
          </div>
        </div>
      </div>

      {/* --- GRID TOP: QUICK STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Kelembapan Saat Ini</p>
          <p className="text-3xl font-bold text-emerald-600">{chartData[chartData.length - 1]?.moisture || 0}%</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Prediksi AI (Kering)</p>
          <p className="text-3xl font-bold text-indigo-500">
            {latestAiPred != null ? `${Number(latestAiPred).toFixed(1)}m` : "-"}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Estimasi sisa waktu</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Status Pompa Terakhir</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{actuatorLog?.Action || "STANDBY"}</p>
          <p className="text-[10px] text-slate-400 mt-1">{actuatorLog ? new Date(actuatorLog.TriggeredAt).toLocaleString() : "-"}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Device Node ID</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">ESP32-NODE-{id}</p>
          <p className="text-[10px] text-slate-400 mt-1">Protocol: HTTP/MQTT Gateway</p>
        </div>
      </div>

      {/* --- CHARTS CONTAINER --- */}
      <div className="space-y-6">

        {/* CHART 1: KELEMBAPAN */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-zinc-50 mb-6">Grafik Historis Kelembapan</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} syncId="plotCharts">
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip type="moisture" />} />
                <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: PREDIKSI AI */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-zinc-50 mb-6">Grafik Prediksi AI (Estimasi Sisa Waktu)</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} syncId="plotCharts">
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis unit="m" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip type="ai" />} />
                <Area type="monotone" dataKey="aiPred" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAi)" connectNulls={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex justify-between items-center">
          <h2 className="font-bold text-sm text-slate-900 dark:text-zinc-50">Log Data Mentah (Sensor Readings)</h2>
          <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">Ekspor CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-950/50 text-slate-400 font-bold uppercase">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Kelembapan (%)</th>
                <th className="px-5 py-3">Prediksi AI</th>
                <th className="px-5 py-3">Status Tanah</th>
                <th className="px-5 py-3">Node ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-400">
              {historyTable.map((row, idx) => {
                const aiVal = row.AiPredMins != null ? row.AiPredMins : row.ai_pred_mins;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-3 tabular-nums">{new Date(row.RecordedAt || row.recorded_at).toLocaleString("id-ID")}</td>
                    <td className="px-5 py-3 font-bold">{row.SoilMoisturePct || row.soil_moisture_pct}%</td>
                    <td className="px-5 py-3 font-medium text-indigo-500">
                      {aiVal != null ? `${Number(aiVal).toFixed(1)} Menit` : "-"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${row.Status === 'Kering' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {row.Status || row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">ESP32-NODE-{id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- FUNGSI TOOLTIP ---
function CustomTooltip({ active, payload, type }) {
  if (active && payload && payload.length) {
    const data = payload[0];

    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 p-3 shadow-xl rounded-xl min-w-[150px]">
        <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase">{data.payload.fullTime}</p>

        {type === "moisture" && (
          <p className="text-sm font-bold text-emerald-600">
            {data.payload.moisture}% Kelembapan
          </p>
        )}

        {type === "ai" && (
          <p className="text-sm font-bold text-indigo-500">
            {data.payload.aiPred != null ? `${Number(data.payload.aiPred).toFixed(1)} Menit` : "Tidak ada prediksi"}
          </p>
        )}
      </div>
    );
  }
  return null;
}
