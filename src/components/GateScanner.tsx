import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRightCircle,
  ArrowLeftCircle,
  Shield,
  User,
  Building,
  BellRing,
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
        setErrorMsg(data.message || data.error || 'Barcode identity not recognized in student registry');
      } else {
        setScanResult(data);
        if (onScanComplete) onScanComplete();
      }
    } catch {
      setErrorMsg('Failed to reach gate terminal verification service');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Scanner Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Security Terminal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Curfew Verification Active</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Campus Main Gate Access Scanner</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time student identity verification, hostel confirmation, and campus movement logging.
          </p>
        </div>

        {/* Direction Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => setDirection('ENTRY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              direction === 'ENTRY'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightCircle className="w-3.5 h-3.5" />
            Check-In (Entry)
          </button>
          <button
            type="button"
            onClick={() => setDirection('EXIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              direction === 'EXIT'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftCircle className="w-3.5 h-3.5" />
            Check-Out (Exit)
          </button>
        </div>
      </div>

      {/* Barcode Input Terminal Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Scan or enter student Barcode / Roll Number (e.g. BARCODE-24BCE1001)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 text-xs font-mono text-slate-900 rounded focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 uppercase tracking-wider shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !barcodeInput.trim()}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5" />
            {isScanning ? 'Verifying...' : 'Scan / Check'}
          </button>
        </form>

        {/* Quick-Scan Student Chips for Demonstration */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Sample Student Barcodes (Click to simulate scan):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {students.slice(0, 8).map((s) => (
              <button
                key={s.barcode_id}
                type="button"
                onClick={() => {
                  setBarcodeInput(s.barcode_id);
                  handleScan(s.barcode_id);
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 border border-slate-200 text-[11px] rounded text-slate-700 font-mono transition-colors flex items-center gap-1"
              >
                <span className="font-semibold text-slate-900">{s.name.split(' ')[0]}</span>
                <span className="text-slate-500">({s.barcode_id.replace('BARCODE-', '')})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SCAN ERROR FEEDBACK */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-red-800 text-xs shadow-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <strong className="block font-bold">Record Not Found / Gate Access Alert</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* SCAN SUCCESS RESULT DISPLAY */}
      {scanResult && (
        <div
          className={`rounded-lg border p-5 shadow-xs transition-all bg-white ${
            scanResult.flags.is_late
              ? 'border-red-300'
              : 'border-emerald-300'
          }`}
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              {scanResult.flags.is_late ? (
                <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    scanResult.flags.is_late ? 'text-red-700' : 'text-emerald-800'
                  }`}
                >
                  {scanResult.flags.is_late
                    ? 'Curfew Violation — Late Arrival'
                    : 'Authorized Movement — On Time Entry'}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {scanResult.student.name}
                </h2>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-600">
              Scanned at {new Date(scanResult.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Student & Allotment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
            {/* Student Info */}
            <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-900" />
                Student Details
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-900">{scanResult.student.roll_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Academic Cohort:</span>
                  <span className="font-medium text-slate-800">
                    Year {scanResult.student.year} • {scanResult.student.gender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Contact:</span>
                  <span className="text-slate-700">{scanResult.student.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Guardian Contact:</span>
                  <span className="text-slate-800 font-mono">{scanResult.student.guardian_contact}</span>
                </div>
              </div>
            </div>

            {/* Current Active Allotment */}
            <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-900" />
                Assigned Hostel Record
              </h3>
              {scanResult.current_allotment ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Hostel:</span>
                    <span className="font-bold text-slate-900">
                      {scanResult.current_allotment.hostel_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Room Number:</span>
                    <span className="font-bold text-blue-900 font-mono">
                      Room {scanResult.current_allotment.room_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Hostel Warden:</span>
                    <span className="text-slate-800 font-medium">
                      {scanResult.current_allotment.warden_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Curfew Deadline:</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {scanResult.current_allotment.curfew_time}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  No active room allotment found for academic year 2025-26.
                </div>
              )}
            </div>
          </div>

          {/* WARDEN ALERT DISPATCH BOX (Only in case of late arrival) */}
          {scanResult.flags.warden_alerted && scanResult.flags.alert_details && (
            <div className="mt-4 p-3.5 rounded bg-red-50 border border-red-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs uppercase tracking-wider">
                <BellRing className="w-3.5 h-3.5 text-red-700 shrink-0" />
                Automated Warden Alert Dispatched
              </div>
              <p className="text-xs text-red-900 font-mono">
                {scanResult.flags.alert_details.message}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1.5 border-t border-red-100">
                <span>
                  Warden: <strong className="text-slate-900">{scanResult.flags.alert_details.warden_name}</strong>
                </span>
                <span>
                  Phone: <strong className="text-slate-900">{scanResult.flags.alert_details.warden_phone}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
