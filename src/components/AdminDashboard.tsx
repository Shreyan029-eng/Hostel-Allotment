'use client';

import React, { useState } from 'react';
import {
  Student,
  Hostel,
  Room,
  Group,
  Allotment,
  RoundConfig,
  GateLog,
} from '@/lib/db/types';
import {
  Play,
  Eye,
  EyeOff,
  Download,
  RotateCcw,
  Search,
  CheckCircle2,
  Users,
  Building,
  BedDouble,
  Shield,
  Clock,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AllotmentRunResult } from '@/lib/engine/allotment-engine';

interface AdminDashboardProps {
  stats: {
    totalStudents: number;
    totalHostels: number;
    totalRooms: number;
    occupiedRooms: number;
    freeRooms: number;
    totalGroups: number;
    lockedGroups: number;
    totalAllotments: number;
  };
  students: Student[];
  hostels: Hostel[];
  rooms: Room[];
  groups: any[];
  allotments: (Allotment & { student: Student; room: Room & { hostel: Hostel } })[];
  roundConfig: RoundConfig;
  gateLogs: GateLog[];
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  students,
  hostels,
  rooms,
  groups,
  allotments,
  roundConfig,
  gateLogs,
  onRefresh,
}) => {
  const [isRunningAllotment, setIsRunningAllotment] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'allotted' | 'unallotted'>('all');
  const [lastRunResult, setLastRunResult] = useState<AllotmentRunResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'allotments' | 'rooms' | 'logs'>('overview');

  // Trigger batch JOSAA allotment
  const handleRunAllotment = async () => {
    if (!confirm('Run offline batch JOSAA allotment for Round 1? This will atomically lock free rooms based on priority max_cgpa and timestamp tie-breakers.')) {
      return;
    }

    setIsRunningAllotment(true);
    try {
      const res = await fetch('/api/admin/run-allotment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_number: 1, academic_year: '2026-2027' }),
      });
      const data = await res.json();
      if (data.success) {
        setLastRunResult(data.result);
        onRefresh();
      } else {
        alert('Allotment error: ' + data.error);
      }
    } catch {
      alert('Network error executing allotment');
    } finally {
      setIsRunningAllotment(false);
    }
  };

  // Toggle publishing round results
  const handleTogglePublish = async () => {
    const nextState = !roundConfig.is_published;
    setIsTogglingPublish(true);
    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_number: 1, is_published: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert('Publish error: ' + data.error);
      }
    } catch {
      alert('Network error updating publish state');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  // Reset database state
  const handleResetDb = async () => {
    if (!confirm('Reset portal database to initial seed data?')) return;
    try {
      await fetch('/api/admin/data', { method: 'DELETE' });
      setLastRunResult(null);
      onRefresh();
    } catch {
      alert('Failed to reset database');
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.barcode_id.toLowerCase().includes(searchQuery.toLowerCase());

    const isAllotted = allotments.some((a) => a.roll_no === s.roll_no);
    if (filterType === 'allotted') return matchesSearch && isAllotted;
    if (filterType === 'unallotted') return matchesSearch && !isAllotted;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/60 rounded-full">
              Warden & Admin Control Center
            </span>
            <span className="text-xs text-slate-500 font-mono">Academic Year 2026-2027</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Hostel Allotment Governance</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage high-concurrency roommate groups, batch-process JOSAA rounds, and oversee gate security logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Batch Run Button */}
          <button
            onClick={handleRunAllotment}
            disabled={isRunningAllotment}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningAllotment ? 'animate-spin' : ''}`} />
            {isRunningAllotment ? 'Executing Batch...' : 'Run JOSAA Engine'}
          </button>

          {/* Publish / Unpublish Toggle */}
          <button
            onClick={handleTogglePublish}
            disabled={isTogglingPublish}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 ${
              roundConfig.is_published
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {roundConfig.is_published ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Unpublish Results
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Publish Round 1 Results
              </>
            )}
          </button>

          {/* CSV Export */}
          <a
            href={`/api/admin/export?filter=${filterType}`}
            download
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </a>

          {/* Reset Demo */}
          <button
            onClick={handleResetDb}
            title="Reset database to seed"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Students</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{stats.totalStudents}</div>
          <span className="text-[11px] text-slate-500">5,000+ concurrency scaled</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Room Occupancy</span>
            <BedDouble className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {stats.occupiedRooms} / {stats.totalRooms}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {stats.freeRooms} rooms free
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Locked Groups</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {stats.lockedGroups} / {stats.totalGroups}
          </div>
          <span className="text-[11px] text-slate-500">Ready for batch allotment</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Visibility Status</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1 truncate">
            {roundConfig.is_published ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Published
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Unpublished
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            {roundConfig.is_published ? 'Visible to students' : 'Hidden from students'}
          </span>
        </div>
      </div>

      {/* LATEST BATCH RUN AUDIT TRAIL MODAL / CARD */}
      {lastRunResult && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Round {lastRunResult.roundNumber} Execution Audit Trail
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Placed {lastRunResult.totalStudentsPlaced} students across {lastRunResult.totalAllottedGroups} groups
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Merit Rank</th>
                  <th className="py-2.5 px-3">Group Code</th>
                  <th className="py-2.5 px-3">Priority Max CGPA</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Allotted Hostel & Room</th>
                  <th className="py-2.5 px-3">Tie-Breaker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lastRunResult.auditTrail.map((log) => (
                  <tr key={log.groupId} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">#{log.rank}</td>
                    <td className="py-2 px-3 font-mono text-indigo-300">{log.groupCode}</td>
                    <td className="py-2 px-3 font-bold text-amber-400">{log.maxCgpa.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'ALLOTTED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {log.allocatedHostelName ? (
                        <span>
                          {log.allocatedHostelName} • <strong>Room {log.allocatedRoomNumber}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No available choices</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-400">
                      {log.tieBreakerApplied ? 'Earliest Timestamp' : 'Direct CGPA'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Students & Allotments Directory
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'rooms'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Hostels & Rooms Matrix
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Gate Curfew Logs ({gateLogs.length})
        </button>
      </div>

      {/* TAB 1: STUDENTS & ALLOTMENTS DIRECTORY */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, roll, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full sm:w-auto">
              {(['all', 'allotted', 'unallotted'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    filterType === type
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Year / Gender</th>
                  <th className="py-2.5 px-3">CGPA</th>
                  <th className="py-2.5 px-3">Barcode ID</th>
                  <th className="py-2.5 px-3">Current Allotment</th>
                  <th className="py-2.5 px-3">Roommates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.map((s) => {
                  const alloc = allotments.find((a) => a.roll_no === s.roll_no);
                  const roommates = alloc
                    ? allotments
                        .filter((a) => a.room_id === alloc.room_id && a.roll_no !== s.roll_no)
                        .map((a) => a.student?.name)
                    : [];

                  return (
                    <tr key={s.roll_no} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono font-bold text-white">{s.roll_no}</td>
                      <td className="py-2 px-3 font-medium text-slate-200">{s.name}</td>
                      <td className="py-2 px-3">
                        Year {s.year} • {s.gender}
                      </td>
                      <td className="py-2 px-3 font-bold text-amber-400">{s.cgpa.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{s.barcode_id}</td>
                      <td className="py-2 px-3">
                        {alloc ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-medium">
                            {alloc.room.hostel.name} • Room {alloc.room.room_number}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not Allotted</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {roommates.length > 0 ? roommates.join(', ') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROOMS & HOSTELS MATRIX */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {hostels.map((hostel) => {
            const hostelRooms = rooms.filter((r) => r.hostel_id === hostel.hostel_id);
            return (
              <div
                key={hostel.hostel_id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{hostel.name}</h3>
                    <p className="text-xs text-slate-400">
                      Allowed: {hostel.gender_allowed} • Years: {JSON.stringify(hostel.allowed_years)} •
                      Warden: {hostel.warden_name} ({hostel.warden_phone})
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-mono">Curfew: {hostel.curfew_time}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                  {hostelRooms.map((room) => {
                    const isLocked = room.status === 'locked';
                    const occupants = allotments
                      .filter((a) => a.room_id === room.room_id)
                      .map((a) => a.student?.name)
                      .filter(Boolean);

                    return (
                      <div
                        key={room.room_id}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          isLocked
                            ? 'bg-rose-950/30 border-rose-700/60 text-rose-300'
                            : 'bg-emerald-950/30 border-emerald-700/60 text-emerald-300'
                        }`}
                        title={isLocked ? `Occupants: ${occupants.join(', ')}` : 'Free for allotment'}
                      >
                        <div className="text-xs font-bold">Room {room.room_number}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {room.capacity} Bed • {room.status.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: GATE LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Gate Scanner Events</h3>
            <span className="text-xs text-slate-400">Total Scans: {gateLogs.length}</span>
          </div>

          {gateLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No gate scans recorded yet. Use the Gate Scanner tab to test student barcode scanning.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Warden Notification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {gateLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-white">{log.roll_no}</td>
                      <td className="py-2 px-3 text-slate-200">{log.student?.name || 'N/A'}</td>
                      <td className="py-2 px-3 font-semibold">{log.direction}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.is_late
                              ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                          }`}
                        >
                          {log.is_late ? 'LATE ARRIVAL' : 'ON TIME'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-400">
                        {log.warden_alerted ? (
                          <span className="text-amber-400 font-medium">
                            🚨 Alert dispatched to {log.warden_alert_details?.warden_name}
                          </span>
                        ) : (
                          'No alert needed'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
