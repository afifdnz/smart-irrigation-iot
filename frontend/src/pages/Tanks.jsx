import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { getTanks, createTank, updateTank, deleteTank } from "../api/tanks";
import { getLatestWaterLevel, getWaterLevels } from "../api/waterLevels";

const POLL_INTERVAL = 15000;

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function getField(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return null;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

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

// ── Custom Tooltip Chart ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold text-sky-600 dark:text-sky-400">{payload[0].value} cm</p>
      {payload[1] && <p className="font-semibold text-emerald-600 dark:text-emerald-400">{payload[1].value} L</p>}
    </div>
  );
}

// ── Tank Card ─────────────────────────────────────────────────────────────────

function TankCard({ tank, level, onClick, onEdit, onDelete }) {
  const id = getField(tank, "id", "ID");
  const name = getField(tank, "tank_name", "TankName");
  const capacity = getField(tank, "capacity_liters", "CapacityLiters");
  const heightCm = getField(tank, "height_cm", "HeightCm");
  const minLevelCm = getField(tank, "min_level_cm", "MinLevelCm");

  const currentLevel = getField(level, "water_level_cm", "WaterLevelCm") || 0;
  const currentVol = getField(level, "water_volume_l", "WaterVolumeL") || 0;
  const recordedAt = getField(level, "recorded_at", "RecordedAt");

  const pct = level ? Math.min((currentLevel / heightCm) * 100, 100) : 0;
  const isLow = level && currentLevel <= minLevelCm;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-md group ${isLow
        ? "border-red-200 dark:border-red-700/50 hover:shadow-red-500/10"
        : "border-slate-200 dark:border-zinc-800 hover:border-sky-300 dark:hover:border-sky-700/50 hover:shadow-sky-500/10"
        }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-base text-slate-900 dark:text-zinc-50 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {name}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Kapasitas {capacity} L · Tinggi {heightCm} cm
          </p>
        </div>
        {level ? (
          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium shrink-0 ${isLow
            ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
            : "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400"
            }`}>
            {isLow ? "Air Rendah" : "Normal"}
          </span>
        ) : (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500">
            Tidak ada data
          </span>
        )}
      </div>

      {/* Level info */}
      {level ? (
        <>
          <p className={`text-3xl font-bold tracking-tight ${isLow ? "text-red-500 dark:text-red-400" : "text-sky-600 dark:text-sky-400"}`}>
            {currentVol.toFixed(0)} L
          </p>
          <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-3">
            <span>{currentLevel.toFixed(1)} cm</span>
            <span>{pct.toFixed(0)}% penuh</span>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isLow ? "bg-red-500" : "bg-sky-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Min level indicator */}
          <div className="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500">
            <span>Min: {minLevelCm} cm</span>
            <span>Update: {formatDateTime(recordedAt)}</span>
          </div>
        </>
      ) : (
        <div className="flex items-center h-20">
          <p className="text-sm text-slate-400 dark:text-zinc-500 italic">Belum ada data level air</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(tank); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(tank); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus
        </button>
      </div>
    </div>
  );
}

// ── Tank Detail Modal ─────────────────────────────────────────────────────────

function TankDetailModal({ tank, level, chartData, onClose }) {
  const name = getField(tank, "tank_name", "TankName");
  const capacity = getField(tank, "capacity_liters", "CapacityLiters");
  const heightCm = getField(tank, "height_cm", "HeightCm");
  const minLevelCm = getField(tank, "min_level_cm", "MinLevelCm");

  const currentLevel = getField(level, "water_level_cm", "WaterLevelCm") || 0;
  const currentVol = getField(level, "water_volume_l", "WaterVolumeL") || 0;
  const pct = level ? Math.min((currentLevel / heightCm) * 100, 100) : 0;
  const isLow = level && currentLevel <= minLevelCm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-zinc-50">{name}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Detail & Riwayat Level Air</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Volume Saat Ini", value: level ? `${currentVol.toFixed(0)} L` : "—", color: isLow ? "text-red-500 dark:text-red-400" : "text-sky-600 dark:text-sky-400" },
              { label: "Level Air", value: level ? `${currentLevel.toFixed(1)} cm` : "—", color: "text-slate-900 dark:text-zinc-50" },
              { label: "Persentase", value: level ? `${pct.toFixed(0)}%` : "—", color: isLow ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 mb-2">
              <span>0 L</span>
              <span className={isLow ? "text-red-500" : ""}>{isLow ? "⚠ Air di bawah minimum!" : "Level normal"}</span>
              <span>{capacity} L</span>
            </div>
            <div className="h-4 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
              {/* Min level marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-amber-400 dark:bg-amber-500 z-10"
                style={{ left: `${(minLevelCm / heightCm) * 100}%` }}
              />
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isLow ? "bg-red-500" : "bg-sky-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5">
              <span>Min: {minLevelCm} cm</span>
              <span>Maks: {heightCm} cm</span>
            </div>
          </div>

          {/* Spesifikasi */}
          <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-3 uppercase tracking-wide">Spesifikasi Tandon</p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                { label: "Kapasitas", value: `${capacity} L` },
                { label: "Tinggi", value: `${heightCm} cm` },
                { label: "Batas Minimum", value: `${minLevelCm} cm` },
                { label: "Min Volume", value: `${((minLevelCm / heightCm) * capacity).toFixed(0)} L` },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs">{r.label}</p>
                  <p className="font-medium text-slate-900 dark:text-zinc-50">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart riwayat */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-3 uppercase tracking-wide">
              Riwayat Level Air (20 terakhir)
            </p>
            {chartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="levelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} unit=" cm" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="level" name="Level" stroke="#0ea5e9" strokeWidth={2} fill="url(#levelGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                Belum ada riwayat data level air
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tank Form Modal ───────────────────────────────────────────────────────────

function TankFormModal({ initial, onSave, onCancel, loading }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    tank_name: getField(initial, "tank_name", "TankName") || "",
    capacity_liters: getField(initial, "capacity_liters", "CapacityLiters") || "",
    height_cm: getField(initial, "height_cm", "HeightCm") || "",
    min_level_cm: getField(initial, "min_level_cm", "MinLevelCm") || "",
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.tank_name.trim()) e.tank_name = "Nama tandon wajib diisi";
    if (!form.capacity_liters || isNaN(form.capacity_liters)) e.capacity_liters = "Kapasitas harus angka";
    if (!form.height_cm || isNaN(form.height_cm)) e.height_cm = "Tinggi harus angka";
    if (!form.min_level_cm || isNaN(form.min_level_cm)) e.min_level_cm = "Batas minimum harus angka";
    if (parseFloat(form.min_level_cm) >= parseFloat(form.height_cm)) {
      e.min_level_cm = "Batas minimum harus lebih kecil dari tinggi tandon";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      tank_name: form.tank_name.trim(),
      capacity_liters: parseFloat(form.capacity_liters),
      height_cm: parseFloat(form.height_cm),
      min_level_cm: parseFloat(form.min_level_cm),
    });
  };

  const fields = [
    { key: "tank_name", label: "Nama Tandon", placeholder: "cth: Tandon Utama", type: "text", unit: null },
    { key: "capacity_liters", label: "Kapasitas", placeholder: "cth: 500", type: "number", unit: "Liter" },
    { key: "height_cm", label: "Tinggi Tandon", placeholder: "cth: 100", type: "number", unit: "cm" },
    { key: "min_level_cm", label: "Batas Minimum Air", placeholder: "cth: 10", type: "number", unit: "cm" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-50">{isEdit ? "Edit Tandon" : "Tambah Tandon"}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                {f.label}
              </label>
              <div className="relative">
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`w-full text-sm bg-slate-50 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all text-slate-900 dark:text-zinc-50 placeholder:text-slate-400 dark:placeholder:text-zinc-500 ${errors[f.key]
                    ? "border-red-300 dark:border-red-700"
                    : "border-slate-200 dark:border-zinc-700"
                    } ${f.unit ? "pr-14" : ""}`}
                />
                {f.unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                    {f.unit}
                  </span>
                )}
              </div>
              {errors[f.key] && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors[f.key]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl">
          <p className="text-xs text-sky-700 dark:text-sky-400">
            Batas minimum digunakan untuk mendeteksi kondisi air rendah dan memblokir aktuasi valve otomatis.
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-all">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
            {loading ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ tank, onConfirm, onCancel, loading }) {
  const name = getField(tank, "tank_name", "TankName");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-center font-semibold text-slate-900 dark:text-zinc-50 mb-1">Hapus Tandon?</h3>
        <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-5">
          <strong className="text-slate-700 dark:text-zinc-300">{name}</strong> akan dihapus permanen beserta seluruh riwayat data level airnya.
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

// ── Main Tanks Page ───────────────────────────────────────────────────────────

export default function Tanks() {
  const [tanks, setTanks] = useState([]);
  const [levelMap, setLevelMap] = useState({});
  const [chartMap, setChartMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const tanksRes = await getTanks();
      const tankList = tanksRes?.data || [];
      setTanks(tankList);

      // Level terbaru per tandon
      const levelResults = await Promise.allSettled(
        tankList.map((t) =>
          getLatestWaterLevel(getField(t, "id", "ID"))
            .then((r) => ({ id: getField(t, "id", "ID"), data: r?.data }))
        )
      );
      const newLevelMap = {};
      levelResults.forEach((r) => {
        if (r.status === "fulfilled" && r.value?.data) {
          newLevelMap[r.value.id] = r.value.data;
        }
      });
      setLevelMap(newLevelMap);
    } catch (e) {
      console.error("Tanks fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch chart data saat detail dibuka
  const fetchChart = async (tankID) => {
    try {
      const res = await getWaterLevels(tankID, 20, 0);
      const sorted = [...(res?.data || [])].reverse();
      const data = sorted.map((l) => ({
        time: formatTime(getField(l, "recorded_at", "RecordedAt")),
        level: getField(l, "water_level_cm", "WaterLevelCm"),
        volume: getField(l, "water_volume_l", "WaterVolumeL"),
      }));
      setChartMap((prev) => ({ ...prev, [tankID]: data }));
    } catch { /* silent */ }
  };

  const handleOpenDetail = (tank) => {
    const id = getField(tank, "id", "ID");
    setDetailModal(tank);
    fetchChart(id);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (formModal?.mode === "edit") {
        const id = getField(formModal.data, "id", "ID");
        await updateTank(id, formData);
        showToast("Tandon berhasil diperbarui");
      } else {
        await createTank(formData);
        showToast("Tandon berhasil ditambahkan");
      }
      setFormModal(null);
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal menyimpan tandon", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const id = getField(deleteModal, "id", "ID");
      await deleteTank(id);
      showToast("Tandon berhasil dihapus");
      setDeleteModal(null);
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal menghapus tandon", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Summary
  const lowTanks = tanks.filter((t) => {
    const id = getField(t, "id", "ID");
    const level = levelMap[id];
    const minLevelCm = getField(t, "min_level_cm", "MinLevelCm");
    const currentLevel = getField(level, "water_level_cm", "WaterLevelCm");
    return level && currentLevel <= minLevelCm;
  });

  const totalVolume = Object.values(levelMap).reduce(
    (s, l) => s + (getField(l, "water_volume_l", "WaterVolumeL") || 0), 0
  );

  return (
    <div className="w-full space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Tandon Air
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Monitoring dan manajemen tandon irigasi
          </p>
        </div>
        <button
          onClick={() => setFormModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl shadow-sm shadow-sky-600/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Tandon
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mb-3">
            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Tandon</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">{tanks.length}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M12 3c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Volume</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
            {totalVolume > 0 ? `${totalVolume.toFixed(0)} L` : "— L"}
          </p>
        </div>

        <div className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 transition-colors col-span-2 lg:col-span-1 ${lowTanks.length > 0
          ? "border-red-200 dark:border-red-700/50"
          : "border-slate-200 dark:border-zinc-800"
          }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${lowTanks.length > 0
            ? "bg-red-50 dark:bg-red-500/10"
            : "bg-slate-100 dark:bg-zinc-800"
            }`}>
            <svg className={`w-4 h-4 ${lowTanks.length > 0 ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Air Rendah</p>
          <p className={`text-2xl font-bold mt-0.5 ${lowTanks.length > 0 ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-zinc-50"}`}>
            {lowTanks.length} tandon
          </p>
        </div>
      </div>

      {/* ── Warning jika ada tandon air rendah ── */}
      {lowTanks.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-400">
            <strong>{lowTanks.map((t) => getField(t, "tank_name", "TankName")).join(", ")}</strong> memiliki level air di bawah batas minimum. Segera isi ulang untuk mencegah kegagalan irigasi.
          </p>
        </div>
      )}

      {/* ── Tank Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : tanks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Belum ada tandon</p>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Tambah tandon pertama untuk mulai monitoring</p>
          </div>
          <button
            onClick={() => setFormModal({ mode: "create" })}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Tandon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tanks.map((t) => {
            const id = getField(t, "id", "ID");
            return (
              <TankCard
                key={id}
                tank={t}
                level={levelMap[id]}
                onClick={() => handleOpenDetail(t)}
                onEdit={(tank) => setFormModal({ mode: "edit", data: tank })}
                onDelete={setDeleteModal}
              />
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {detailModal && (
        <TankDetailModal
          tank={detailModal}
          level={levelMap[getField(detailModal, "id", "ID")]}
          chartData={chartMap[getField(detailModal, "id", "ID")] || []}
          onClose={() => setDetailModal(null)}
        />
      )}

      {formModal && (
        <TankFormModal
          initial={formModal.mode === "edit" ? formModal.data : null}
          onSave={handleSave}
          onCancel={() => setFormModal(null)}
          loading={saving}
        />
      )}

      {deleteModal && (
        <DeleteModal
          tank={deleteModal}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

