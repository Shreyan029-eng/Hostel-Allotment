'use client';

import React, { useState, useEffect } from 'react';
import {
  Student,
  Hostel,
  Room,
  GroupDetails,
  RoundConfig,
  AllotmentResultDetails,
  GroupInvite,
} from '@/lib/db/types';
import {
  Users,
  Building,
  CheckCircle2,
  Lock,
  ArrowUp,
  ArrowDown,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Award,
  Calendar,
  Sparkles,
  BedDouble,
  QrCode,
  UserPlus,
  Check,
  X,
  Search,
  LogOut,
  Mail,
  User,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface StudentPortalProps {
  student: Student;
  pathway?: {
    currentHostel: string;
    nextHostels: Hostel[];
  };
  allowedHostels: Hostel[];
  availableRooms: (Room & { hostel: Hostel })[];
  groupDetails: (GroupDetails & { outgoing_invites?: GroupInvite[] }) | null;
  incomingInvites?: (GroupInvite & {
    leader_name: string;
    current_members_count: number;
    required_capacity: number;
    group_code: string;
  })[];
  roundConfig: RoundConfig;
  allotment: AllotmentResultDetails | null;
  onRefresh: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  pathway,
  allowedHostels,
  availableRooms,
  groupDetails,
  incomingInvites = [],
  roundConfig,
  allotment,
  onRefresh,
}) => {
  // Local form states
  const [sharingTypeChoice, setSharingTypeChoice] = useState<'Fourlets' | 'Triplets'>('Fourlets');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite peers modal state
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [peerSearchQuery, setPeerSearchQuery] = useState<string>('');
  const [eligiblePeers, setEligiblePeers] = useState<
    {
      roll_no: string;
      name: string;
      father_name: string;
      email: string;
      gender: string;
      year: number;
      cgpa: number;
      in_group: boolean;
      is_invited: boolean;
    }[]
  >([]);
  const [isLoadingPeers, setIsLoadingPeers] = useState<boolean>(false);

  // Step-by-step room selection drill-down state
  // Step 1: Selected Hostel
  const [selectedHostelId, setSelectedHostelId] = useState<string>(
    allowedHostels[0]?.hostel_id || 'HBH'
  );
  // Step 2: Selected Floor/Level
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  // Step 3: Selected Room
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Preference List
  const [rankedChoices, setRankedChoices] = useState<string[]>(
    groupDetails?.preferences.map((p) => p.room_id) || []
  );

  // Sync rankedChoices when groupDetails changes
  useEffect(() => {
    if (groupDetails?.preferences) {
      setRankedChoices(groupDetails.preferences.map((p) => p.room_id));
    }
  }, [groupDetails]);

  // Set default hostel if not set
  useEffect(() => {
    if (allowedHostels.length > 0 && !allowedHostels.some((h) => h.hostel_id === selectedHostelId)) {
      setSelectedHostelId(allowedHostels[0].hostel_id);
    }
  }, [allowedHostels, selectedHostelId]);

  const isLeader = groupDetails?.leader_roll_no === student.roll_no;
  const isGroupFull =
    groupDetails &&
    groupDetails.members.filter((m) => m.status === 'accepted').length === groupDetails.required_capacity;
  const isGroupLocked = groupDetails?.is_locked || false;

  // Determine active sharing type (from group if in one, else local selection)
  const activeSharingType: 'Fourlets' | 'Triplets' =
    groupDetails?.sharing_type || (groupDetails?.required_capacity === 3 ? 'Triplets' : sharingTypeChoice);
  const requiredCapacity = activeSharingType === 'Fourlets' ? 4 : 3;

  // Compute available floors for the selected hostel
  const roomsForSelectedHostel = availableRooms.filter((r) => r.hostel_id === selectedHostelId);
  const uniqueFloors = Array.from(new Set(roomsForSelectedHostel.map((r) => r.floor))).sort((a, b) => a - b);

  // Ensure selected floor is valid for selected hostel
  useEffect(() => {
    if (uniqueFloors.length > 0 && !uniqueFloors.includes(selectedFloor)) {
      setSelectedFloor(uniqueFloors[0]);
    }
  }, [selectedHostelId, uniqueFloors, selectedFloor]);

  // Compute rooms matching selected hostel, floor, and group sharing type
  const roomsForSelectedFloorAndType = roomsForSelectedHostel.filter(
    (r) =>
      r.floor === selectedFloor &&
      (r.sharing_type ? r.sharing_type === activeSharingType : r.capacity === requiredCapacity)
  );

  // Load strictly filtered peers (same year & same gender)
  const loadEligiblePeers = async () => {
    setIsLoadingPeers(true);
    try {
      const res = await fetch(`/api/group/peers?roll_no=${encodeURIComponent(student.roll_no)}`);
      const data = await res.json();
      if (data.success && data.peers) {
        setEligiblePeers(data.peers);
      }
    } catch {
      console.error('Failed to load eligible peers');
    } finally {
      setIsLoadingPeers(false);
    }
  };

  // Handlers for Lobby & Invites
  const handleCreateLobby = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leader_roll_no: student.roll_no,
          sharing_type: sharingTypeChoice,
          required_capacity: sharingTypeChoice === 'Fourlets' ? 4 : 3,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create room lobby' });
      } else {
        setStatusMessage({ type: 'success', text: data.message });
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error creating lobby' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = async (toRollNo: string) => {
    if (!groupDetails) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/group/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: groupDetails.group_id,
          fromRollNo: student.roll_no,
          toRollNo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to send invite' });
      } else {
        setStatusMessage({ type: 'success', text: `Invite sent to ${toRollNo}!` });
        loadEligiblePeers();
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error sending invite' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondInvite = async (inviteId: string, action: 'accept' | 'decline') => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/group/invite/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId,
          studentRoll: student.roll_no,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || `Failed to ${action} invite` });
      } else {
        setStatusMessage({
          type: 'success',
          text: action === 'accept' ? 'Lobby joined successfully!' : 'Invite declined.',
        });
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error updating invite' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveOrDisband = async () => {
    const confirmText = isLeader
      ? 'Are you sure you want to disband this lobby? All invites will be cancelled.'
      : 'Are you sure you want to leave this room lobby?';
    if (!confirm(confirmText)) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/group/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: student.roll_no }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to leave lobby' });
      } else {
        setStatusMessage({ type: 'success', text: isLeader ? 'Lobby disbanded.' : 'Left the lobby.' });
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error leaving lobby' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preference Handlers
  const handleAddPreference = () => {
    if (!selectedRoomId) return;
    if (rankedChoices.includes(selectedRoomId)) {
      setStatusMessage({ type: 'error', text: 'Room is already in your preference list' });
      return;
    }
    setRankedChoices([...rankedChoices, selectedRoomId]);
    setSelectedRoomId('');
  };

  const handleRemovePreference = (index: number) => {
    const updated = [...rankedChoices];
    updated.splice(index, 1);
    setRankedChoices(updated);
  };

  const handleMovePreference = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rankedChoices.length) return;
    const updated = [...rankedChoices];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setRankedChoices(updated);
  };

  const handleLockPreferences = async () => {
    if (!groupDetails) return;
    if (rankedChoices.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please add at least one room preference before locking' });
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/group/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupDetails.group_id,
          leader_roll_no: student.roll_no,
          room_ids: rankedChoices,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to lock preferences' });
      } else {
        setStatusMessage({ type: 'success', text: data.message });
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error saving preferences' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format floor label nicely
  const getFloorButtonLabel = (fl: number) => {
    if (selectedHostelId === 'HBH') {
      return fl === 0 ? 'Level G1' : `Level ${fl}`;
    }
    return `Floor ${fl}`;
  };

  // Filter peers by query
  const filteredPeers = eligiblePeers.filter(
    (p) =>
      p.name.toLowerCase().includes(peerSearchQuery.toLowerCase()) ||
      p.roll_no.toLowerCase().includes(peerSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200'
              : 'bg-rose-950/60 border-rose-600/50 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. STUDENT PROFILE CARD (Requirement 6)                                  */}
      {/* Name, Father's Name, Current CG, Year, Current Hostel, Next Hostel       */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950/50 rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-full">
                Year {student.year} Student
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-200 text-xs font-semibold rounded-full border border-slate-700">
                {student.gender}
              </span>
              <span className="px-3 py-1 bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 text-xs font-semibold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Roll No: {student.roll_no}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {student.name}
              </h1>
              {student.father_name && (
                <div className="text-sm text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Father&apos;s Name:</span>
                  <strong className="text-white font-medium">{student.father_name}</strong>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-slate-300">{student.email}</span>
              </span>
              <span>📞 {student.phone}</span>
            </div>
          </div>

          {/* Core Metrics: Current CG, Current Hostel, Next Hostel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Metric 1: Current CG */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-center shadow-inner flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current CGPA
              </span>
              <span className="text-3xl font-black text-amber-400 mt-1">
                {student.cgpa.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Individual Merit</span>
            </div>

            {/* Metric 2: Current Hostel */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-inner flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Hostel
              </span>
              <span className="text-sm font-bold text-slate-200 mt-1 line-clamp-2">
                {student.current_hostel || pathway?.currentHostel || 'Junior Block'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Existing Residence</span>
            </div>

            {/* Metric 3: Next Hostel Available */}
            <div className="bg-indigo-950/70 border border-indigo-700/50 rounded-2xl p-4 shadow-inner flex flex-col justify-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                Next Hostel Available
              </span>
              <span className="text-sm font-black text-indigo-100 mt-1 line-clamp-2">
                {allowedHostels.map((h) => h.name.split(' (')[0]).join(' / ')}
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                Target Allocation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROUND 1 ALLOCATION RESULT (Confidential until Published)               */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Round 1 Allotment Result</h2>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              roundConfig.is_published
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                : 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
            }`}
          >
            {roundConfig.is_published ? 'Declared & Published' : 'Confidential (Pending Declaration)'}
          </span>
        </div>

        {!roundConfig.is_published ? (
          <div className="p-6 bg-slate-850/60 rounded-2xl border border-slate-750 text-center space-y-2">
            <Calendar className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
            <h3 className="text-white font-bold text-base">Results Not Yet Published</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Hostel allocations are managed offline via the administrative JOSAA engine. Results remain
              hidden until the Chief Warden officially publishes the list.
            </p>
          </div>
        ) : allotment ? (
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 rounded-2xl p-6 border border-emerald-600/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-black">
                  🎉 Congratulations! Room Allocated
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {allotment.hostel.name}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  Room <strong className="text-white text-base font-mono">{allotment.room.room_number}</strong>{' '}
                  ({allotment.room.floor_label || `Floor ${allotment.room.floor}`}) • Capacity:{' '}
                  {allotment.room.capacity} Bed ({allotment.room.capacity === 4 ? 'Fourlet' : 'Triplet'})
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block font-medium">Assigned Warden</span>
                <span className="text-sm font-bold text-slate-200">{allotment.hostel.warden_name}</span>
                <span className="text-xs text-slate-400 block font-mono">{allotment.hostel.warden_phone}</span>
              </div>
            </div>

            {/* Roommates List */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2.5">
                Allotted Roommates ({allotment.roommates.length}/{allotment.room.capacity}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {allotment.roommates.map((rm) => (
                  <div
                    key={rm.roll_no}
                    className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {rm.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        {rm.name}
                        {rm.roll_no === student.roll_no && (
                          <span className="text-[10px] text-emerald-400 font-bold">(You)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{rm.roll_no} • CG {rm.cgpa.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-850/60 rounded-2xl border border-slate-750 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-white font-bold text-base">No Room Allotted in Round 1</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your group could not be allocated any of your preferences due to merit cutoffs. You are eligible for Round 2 spot round.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. GAME-STYLE ROOMMATE LOBBY (Invite & Accept System, Not Code Based)     */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Custom Roommate Lobby • Invite & Accept System</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Roommate Team Formation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Similar to game custom rooms: Invite eligible classmates directly. Priority is determined by the group&apos;s highest individual CGPA!
            </p>
          </div>

          {groupDetails && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleLeaveOrDisband}
                disabled={isSubmitting || isGroupLocked}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isLeader ? 'Disband Lobby' : 'Leave Lobby'}
              </button>
            </div>
          )}
        </div>

        {/* INCOMING INVITES NOTIFICATION BANNER (Requirement 8) */}
        {!groupDetails && incomingInvites && incomingInvites.length > 0 && (
          <div className="p-5 bg-gradient-to-r from-indigo-950/80 via-slate-850 to-violet-950/80 border-2 border-indigo-500/50 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Incoming Roommate Invites ({incomingInvites.length})</span>
            </div>
            <div className="space-y-2">
              {incomingInvites.map((inv) => (
                <div
                  key={inv.invite_id}
                  className="p-3.5 bg-slate-900/90 border border-indigo-700/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      Invite from <span className="text-indigo-300">{inv.leader_name}</span> ({inv.from_roll_no})
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Lobby Type:{' '}
                      <span className="font-semibold text-slate-200">
                        {inv.sharing_type} ({inv.current_members_count}/{inv.required_capacity} Members Joined)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondInvite(inv.invite_id, 'accept')}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Accept Invite
                    </button>
                    <button
                      onClick={() => handleRespondInvite(inv.invite_id, 'decline')}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupDetails ? (
          /* =================================================================== */
          /* CASE A: STUDENT IS INSIDE A CUSTOM ROOM LOBBY                      */
          /* =================================================================== */
          <div className="space-y-6">
            {/* Lobby Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 border border-slate-750 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block">Sharing Room Type</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {groupDetails.sharing_type || (groupDetails.required_capacity === 4 ? 'Fourlets' : 'Triplets')} ({groupDetails.required_capacity} Beds)
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">Lobby Tag: {groupDetails.group_code}</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-750 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block">Priority Merit (Max CGPA)</span>
                <span className="text-xl font-black text-amber-400 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {groupDetails.max_cgpa.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">Determines JOSAA round allocation</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-750 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold block">Lobby Status</span>
                <span
                  className={`text-xs font-bold mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                    groupDetails.is_locked
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : isGroupFull
                      ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60'
                      : 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                  }`}
                >
                  {groupDetails.is_locked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Choices Frozen & Locked
                    </>
                  ) : isGroupFull ? (
                    'Ready for Choice Filling'
                  ) : (
                    `Awaiting Roommates (${groupDetails.members.length}/${groupDetails.required_capacity})`
                  )}
                </span>
              </div>
            </div>

            {/* Custom Room Lobby Slot Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Room Slots ({groupDetails.members.length} of {groupDetails.required_capacity} Occupied)
                </h3>
                {isLeader && !isGroupFull && !isGroupLocked && (
                  <button
                    onClick={() => {
                      loadEligiblePeers();
                      setShowInviteModal(true);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Invite Classmate
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Render Occupied Slots */}
                {groupDetails.members.map((member, idx) => (
                  <div
                    key={member.roll_no}
                    className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl relative shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Slot {idx + 1}
                        </span>
                        {member.roll_no === groupDetails.leader_roll_no ? (
                          <span className="px-2 py-0.5 bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 text-[10px] font-bold rounded-full">
                            Leader
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-medium rounded-full">
                            Member
                          </span>
                        )}
                      </div>

                      <div className="text-base font-bold text-white mt-2">
                        {member.student.name}
                      </div>
                      <div className="text-xs font-mono text-indigo-300">{member.roll_no}</div>

                      {member.student.father_name && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          S/D of: {member.student.father_name}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">CGPA:</span>
                      <strong className="text-amber-400 font-bold">{member.student.cgpa.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}

                {/* Render Empty Slots */}
                {Array.from({ length: groupDetails.required_capacity - groupDetails.members.length }).map(
                  (_, emptyIdx) => {
                    const slotNum = groupDetails.members.length + emptyIdx + 1;
                    return (
                      <div
                        key={`empty-slot-${slotNum}`}
                        className="p-4 bg-slate-850/40 border-2 border-dashed border-slate-750 hover:border-indigo-500/50 rounded-2xl flex flex-col items-center justify-center text-center min-h-[140px] space-y-2 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-300 block">
                            Slot {slotNum}: Empty Slot
                          </span>
                          <span className="text-[11px] text-slate-500">Awaiting Roommate</span>
                        </div>
                        {isLeader && !isGroupLocked && (
                          <button
                            onClick={() => {
                              loadEligiblePeers();
                              setShowInviteModal(true);
                            }}
                            className="mt-1 px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            + Invite Peer
                          </button>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Outgoing Pending Invites List */}
            {groupDetails.outgoing_invites && groupDetails.outgoing_invites.length > 0 && (
              <div className="p-4 bg-slate-850/60 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Outgoing Invites Pending Acceptance:
                </span>
                <div className="flex flex-wrap gap-2">
                  {groupDetails.outgoing_invites.map((inv) => (
                    <div
                      key={inv.invite_id}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      <span className="font-semibold text-white">{inv.to_name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({inv.to_roll_no})</span>
                      <span className="text-amber-300 text-[10px] font-bold">Awaiting response</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =================================================================== */
          /* CASE B: STUDENT IS NOT IN ANY LOBBY                                 */
          /* =================================================================== */
          <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-slate-850/70 border border-slate-750 rounded-3xl space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <BedDouble className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Create a Custom Room Lobby</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Hostel rooms are offered as shared accommodations (Fourlets or Triplets). Create your lobby
                and directly invite your classmates of the same year and gender.
              </p>
            </div>

            {/* Sharing Choice Selection (Fourlets vs Triplets) */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-300 block text-center">
                Select Room Sharing Capacity:
              </label>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setSharingTypeChoice('Fourlets')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    sharingTypeChoice === 'Fourlets'
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-900/30'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">Fourlets</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded">
                      4 Beds
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Room shared by 4 roommates. Available on all levels.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingTypeChoice('Triplets')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    sharingTypeChoice === 'Triplets'
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-900/30'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">Triplets</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded">
                      3 Beds
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Room shared by 3 roommates. Available on selected blocks.
                  </p>
                </button>
              </div>
            </div>

            <button
              onClick={handleCreateLobby}
              disabled={isSubmitting}
              className="w-full max-w-md py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              {isSubmitting ? (
                'Creating Lobby...'
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Create {sharingTypeChoice} Room Lobby
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: INVITE SAME-YEAR & SAME-GENDER PEERS (Requirement 20)           */}
      {/* ========================================================================= */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Invite Classmates</h3>
                <p className="text-xs text-indigo-300 font-semibold">
                  Strict Rule: Only showing Year {student.year} ({student.gender}) students
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name or roll number (e.g. 25BEE, Harshit)..."
                value={peerSearchQuery}
                onChange={(e) => setPeerSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Peer List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {isLoadingPeers ? (
                <div className="text-center py-10 text-xs text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>Loading eligible classmates...</div>
                </div>
              ) : filteredPeers.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No eligible classmates found matching &ldquo;{peerSearchQuery}&rdquo;.
                </div>
              ) : (
                filteredPeers.map((peer) => (
                  <div
                    key={peer.roll_no}
                    className="p-3 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {peer.name}
                        {peer.father_name && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (S/D of {peer.father_name})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-indigo-300">
                        {peer.roll_no} • CGPA {peer.cgpa.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      {peer.in_group ? (
                        <span className="px-2.5 py-1 bg-slate-700 text-slate-400 font-semibold text-[10px] rounded-lg">
                          In Another Group
                        </span>
                      ) : peer.is_invited ? (
                        <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold text-[10px] rounded-lg">
                          Invite Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendInvite(peer.roll_no)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Invite
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STEP-BY-STEP DRILL-DOWN SELECTION BUTTONS (Requirement 49 & 51)        */}
      {/* Hostel -> Floor (Level) -> Room (Filtered by Fourlets or Triplets)       */}
      {/* ========================================================================= */}
      {groupDetails && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Step-by-Step Choice Filling Buttons</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Room Choice Filling (Hostel &rarr; Floor &rarr; Room)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtered strictly by your lobby&apos;s sharing choice ({activeSharingType}). Himadri layout supports Level G1 through Level 5.
            </p>
          </div>

          <div className="space-y-6">
            {/* STEP 1: HOSTEL SELECTION BUTTONS */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Select Hostel:</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {allowedHostels.map((h) => {
                  const isSelected = selectedHostelId === h.hostel_id;
                  return (
                    <button
                      key={h.hostel_id}
                      type="button"
                      onClick={() => {
                        setSelectedHostelId(h.hostel_id);
                        setSelectedRoomId('');
                      }}
                      className={`px-4 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      <span>{h.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: FLOOR / LEVEL SELECTION BUTTONS */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Select Floor (Level):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueFloors.map((fl) => {
                  const isSelected = selectedFloor === fl;
                  return (
                    <button
                      key={`floor-${fl}`}
                      type="button"
                      onClick={() => {
                        setSelectedFloor(fl);
                        setSelectedRoomId('');
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-violet-600 border-violet-400 text-white shadow-md shadow-violet-600/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {getFloorButtonLabel(fl)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: ROOM SELECTION BUTTONS (Filtered by Fourlets / Triplets) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Select Room ({activeSharingType} Only):</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {roomsForSelectedFloorAndType.length} rooms available for this floor
                </span>
              </div>

              {roomsForSelectedFloorAndType.length === 0 ? (
                <div className="p-6 bg-slate-850/60 rounded-2xl border border-slate-750 text-center text-xs text-slate-400">
                  No {activeSharingType} rooms exist on this level. Please choose another level.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[280px] overflow-y-auto p-1 pr-2">
                  {roomsForSelectedFloorAndType.map((room) => {
                    const isSelected = selectedRoomId === room.room_id;
                    const isAlreadyPicked = rankedChoices.includes(room.room_id);

                    return (
                      <button
                        key={room.room_id}
                        type="button"
                        onClick={() => setSelectedRoomId(room.room_id)}
                        disabled={isAlreadyPicked}
                        className={`p-2.5 rounded-xl text-xs font-mono font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                          isAlreadyPicked
                            ? 'bg-slate-850 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/40 scale-105'
                            : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-indigo-500/60 hover:bg-slate-750'
                        }`}
                      >
                        <span className="text-sm">{room.room_number}</span>
                        <span className="text-[9px] uppercase font-sans font-semibold tracking-tighter opacity-80">
                          {isAlreadyPicked ? 'Added' : isSelected ? 'Selected' : room.sharing_type || `${room.capacity} Bed`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Add Room Button */}
              {selectedRoomId && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddPreference}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Room {selectedRoomId} to Preferences
                  </button>
                  <span className="text-xs text-slate-400">
                    Selected: <strong>{selectedRoomId}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* STEP 4: ORDERED PREFERENCE LIST (Choices 1, 2, 3...) */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-indigo-400" />
                    <span>Your Submitted Room Choices ({rankedChoices.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ordered from highest priority (Choice #1) downwards. JOSAA checks sequentially.
                  </p>
                </div>

                {isLeader && !isGroupLocked && isGroupFull && (
                  <button
                    onClick={handleLockPreferences}
                    disabled={isSubmitting || rankedChoices.length === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" /> Freeze & Lock Preferences
                  </button>
                )}
              </div>

              {!isGroupFull && !isGroupLocked && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Your lobby needs {groupDetails.required_capacity - groupDetails.members.length} more roommate(s) to reach full capacity before you can finalize and lock choices.
                  </span>
                </div>
              )}

              {rankedChoices.length === 0 ? (
                <div className="p-6 bg-slate-850/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                  No room choices added yet. Use the drill-down buttons above to select and add rooms.
                </div>
              ) : (
                <div className="space-y-2">
                  {rankedChoices.map((roomId, idx) => {
                    const roomInfo = availableRooms.find((r) => r.room_id === roomId);

                    return (
                      <div
                        key={roomId}
                        className="p-3 bg-slate-800/90 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-bold flex items-center justify-center text-xs font-mono">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white text-sm">
                              {roomInfo ? roomInfo.hostel.name : roomId}
                            </span>
                            <span className="text-slate-400 text-xs ml-2">
                              Room <strong className="text-indigo-300 font-mono">{roomInfo ? roomInfo.room_number : roomId}</strong>{' '}
                              ({roomInfo?.floor_label || `Floor ${roomInfo?.floor || 0}`})
                            </span>
                          </div>
                        </div>

                        {!isGroupLocked && isLeader && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMovePreference(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePreference(idx, 'down')}
                              disabled={idx === rankedChoices.length - 1}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePreference(idx)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 ml-1"
                              title="Remove Choice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
