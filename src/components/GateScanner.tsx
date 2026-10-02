'use client';

import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRightCircle,
  ArrowLeftCircle,
  Clock,
  Shield,
  Phone,
  User,
  Building,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { Student } from '@/lib/db/types';

interface GateScannerProps {
  students: Student[];
  onScanComplete?: () => void;
}

export const GateScanner: React.FC<GateScannerProps> = ({ students, onScanComplete }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [direction, setDirection] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScan = async (codeToScan?: string) => {
    const code = (codeToScan || barcodeInput).trim();
    if (!code) return;

    setIsScanning(true);
    setErrorMsg(null);
    setScanResult(null);

    try {
      const res = await fetch(`/api/student/${encodeURIComponent(code)}?direction=${direction}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'Barcode not recognized');
      } else {
        setScanResult(data);
        if (onScanComplete) onScanComplete();
      }
    } catch {
      setErrorMsg('Failed to reach gate scanner API');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Scanner Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Scanner Terminal
            </span>
            <span className="text-xs text-slate-500 font-mono">Curfew Engine Active</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Campus Main Gate Barcode Scanner</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interfacing with <code className="text-indigo-400 font-mono">GET /api/student/[barcode_id]</code> for real-time hostel verification & warden curfew alerts.
          </p>
        </div>

        {/* Direction Toggle */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 w-fit">
          <button
            type="button"
            onClick={() => setDirection('ENTRY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              direction === 'ENTRY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightCircle className="w-3.5 h-3.5" />
            Check-In (ENTRY)
          </button>
          <button
            type="button"
            onClick={() => setDirection('EXIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              direction === 'EXIT'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftCircle className="w-3.5 h-3.5" />
            Check-Out (EXIT)
          </button>
        </div>
      </div>

      {/* Barcode Input Terminal Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 text-indigo-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Scan or enter Barcode ID (e.g. BARCODE-24BCE1001)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-sm font-mono text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !barcodeInput.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            {isScanning ? 'Verifying...' : 'Scan Barcode'}
          </button>
        </form>

        {/* Quick-Scan Student Chips for Demonstration */}
        <div className="pt-3 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Quick-Scan Demo Barcodes (Click to simulate scan):
          </span>
          <div className="flex flex-wrap gap-2">
            {students.slice(0, 8).map((s) => (
              <button
                key={s.barcode_id}
                type="button"
                onClick={() => {
                  setBarcodeInput(s.barcode_id);
                  handleScan(s.barcode_id);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] rounded-lg text-slate-300 font-mono transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>{s.name.split(' ')[0]}</span>
                <span className="text-slate-500">({s.barcode_id.replace('BARCODE-', '')})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SCAN ERROR FEEDBACK */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-700/60 rounded-2xl flex items-center gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="block text-sm font-bold">Gate Access Denied / Record Not Found</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* SCAN SUCCESS RESULT DISPLAY */}
      {scanResult && (
        <div
          className={`rounded-2xl border p-6 shadow-2xl transition-all ${
            scanResult.flags.is_late
              ? 'bg-rose-950/40 border-rose-600/70 shadow-rose-950/50'
              : 'bg-emerald-950/40 border-emerald-600/70 shadow-emerald-950/50'
          }`}
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              {scanResult.flags.is_late ? (
                <div className="p-2.5 rounded-xl bg-rose-900/60 border border-rose-600 text-rose-300 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-600 text-emerald-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    scanResult.flags.is_late ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {scanResult.flags.is_late
                    ? '⚠️ CURFEW VIOLATION — LATE ARRIVAL'
                    : '✅ AUTHORIZED — ON TIME ENTRY'}
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  {scanResult.student.name}
                </h2>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Scanned at {new Date(scanResult.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Student & Allotment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Student Info */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Student Identification
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Roll Number:</span>
                  <span className="font-mono font-bold text-white">{scanResult.student.roll_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Year & Gender:</span>
                  <span className="font-medium text-slate-200">
                    Year {scanResult.student.year} • {scanResult.student.gender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phone:</span>
                  <span className="text-slate-300">{scanResult.student.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Guardian Contact:</span>
                  <span className="text-amber-300 font-semibold">{scanResult.student.guardian_contact}</span>
                </div>
              </div>
            </div>

            {/* Current Active Allotment */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                Current Active Hostel Record
              </h3>
              {scanResult.current_allotment ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Assigned Hostel:</span>
                    <span className="font-bold text-white">
                      {scanResult.current_allotment.hostel_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Room Number:</span>
                    <span className="font-bold text-emerald-400">
                      Room {scanResult.current_allotment.room_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hostel Warden:</span>
                    <span className="text-slate-200 font-medium">
                      {scanResult.current_allotment.warden_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hostel Curfew:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {scanResult.current_allotment.curfew_time}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  No active room allotment found for academic year 2026-2027.
                </div>
              )}
            </div>
          </div>

          {/* WARDEN ALERT DISPATCH BOX (Only in case of late arrival) */}
          {scanResult.flags.warden_alerted && scanResult.flags.alert_details && (
            <div className="mt-6 p-4 rounded-xl bg-rose-950/70 border border-rose-600 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                <BellRing className="w-4 h-4 animate-bounce text-rose-400" />
                Automated Warden Alert Dispatched
              </div>
              <p className="text-xs text-rose-200 font-mono">
                {scanResult.flags.alert_details.message}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-300 pt-2 border-t border-rose-900/60">
                <span>
                  Recipient: <strong>{scanResult.flags.alert_details.warden_name}</strong>
                </span>
                <span>
                  Phone: <strong>{scanResult.flags.alert_details.warden_phone}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
