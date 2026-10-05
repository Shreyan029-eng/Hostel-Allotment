import React, { useState, useEffect } from 'react';
import {
  Student,
  Hostel,
  Room,
  GroupDetails,
  RoundConfig,
  AllotmentResultDetails,
  GroupInvite,
  RoomOccupancyReport,
} from '@/lib/db/types';
import {
  Users,
  Building,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Award,
  Calendar,
  Sparkles,
  BedDouble,
  UserPlus,
  Check,
  X,
  Search,
  LogOut,
  Mail,
  User,
  Layers,
  Timer,
  Clock,
  RotateCcw,
  DoorOpen,
  DoorClosed,
  Filter,
} from 'lucide-react';

interface StudentPortalProps {
  student: Student;
  pathway?: {
    currentHostel: string;
    nextHostels: Hostel[];
  };
  allowedHostels: Hostel[];
  availableRooms: (Room & { hostel: Hostel })[];
  remainingRooms?: (Room & { hostel: Hostel })[];
  assignedRound?: number;
  canFillFinalChoices?: boolean;
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
  remainingRooms = [],
  assignedRound = 1,
  canFillFinalChoices = false,
  groupDetails,
  incomingInvites = [],
  roundConfig,
  allotment,
  onRefresh,
}) => {
  // Live countdown timer for multi-round releases
  const [studentCountdown, setStudentCountdown] = useState<string>('');

  useEffect(() => {
    if (!roundConfig.is_published || !roundConfig.next_release_time || roundConfig.round_number >= 5) {
      setStudentCountdown('');
      return;
    }

    const updateTimer = () => {
      const target = new Date(roundConfig.next_release_time!).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setStudentCountdown('Updating results...');
        onRefresh();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setStudentCountdown(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [roundConfig.next_release_time, roundConfig.is_published, roundConfig.round_number]);

  // Live countdown timer for 30-minute choice filling modification window
  const [choiceLockCountdown, setChoiceLockCountdown] = useState<string>('');
  const [isChoiceWindowActive, setIsChoiceWindowActive] = useState<boolean>(false);

  useEffect(() => {
    if (!roundConfig.is_published || !roundConfig.choice_filling_end_time) {
      setChoiceLockCountdown('');
      setIsChoiceWindowActive(false);
      return;
    }

    const updateChoiceTimer = () => {
      const target = new Date(roundConfig.choice_filling_end_time!).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setChoiceLockCountdown('Window Closed');
        setIsChoiceWindowActive(false);
      } else {
        setIsChoiceWindowActive(true);
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setChoiceLockCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateChoiceTimer();
    const interval = setInterval(updateChoiceTimer, 1000);
    return () => clearInterval(interval);
  }, [roundConfig.choice_filling_end_time, roundConfig.is_published]);

  // Room Occupancy Report State (Available vs Occupied Rooms)
  const [occupancyReport, setOccupancyReport] = useState<RoomOccupancyReport | null>(null);
  const [isLoadingOccupancy, setIsLoadingOccupancy] = useState<boolean>(false);
  const [occupancyHostelFilter, setOccupancyHostelFilter] = useState<string>('all');
  const [occupancyTab, setOccupancyTab] = useState<'available' | 'occupied'>('available');

  const loadOccupancyReport = async () => {
    if (!roundConfig.is_published) return;
    setIsLoadingOccupancy(true);
    try {
      const res = await fetch('/api/public/room-occupancy');
      const data = await res.json();
      if (data.success) {
        setOccupancyReport(data);
      }
    } catch (err) {
      console.error('Failed to load room occupancy report', err);
    } finally {
      setIsLoadingOccupancy(false);
    }
  };

  useEffect(() => {
    loadOccupancyReport();
  }, [roundConfig.is_published, roundConfig.round_number]);

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

  const isFinalSpotActive = Boolean(
    (roundConfig.final_round_active || roundConfig.round_number >= 5) && !allotment
  );

  // Active pool of rooms: if final spot round is active and unallotted, use remainingRooms (free vacant rooms)
  const activeRoomsPool =
    isFinalSpotActive && remainingRooms.length > 0 ? remainingRooms : availableRooms;

  // Compute available floors for the selected hostel
  const roomsForSelectedHostel = activeRoomsPool.filter((r) => r.hostel_id === selectedHostelId);
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
      (r.sharing_type ? r.sharing_type === activeSharingType : r.capacity === requiredCapacity) &&
      (!isFinalSpotActive || r.status === 'free')
  );

  // Create Lobby (Custom Room)
  const handleCreateLobby = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leader_roll_no: student.roll_no,
          required_capacity: sharingTypeChoice === 'Fourlets' ? 4 : 3,
          sharing_type: sharingTypeChoice,
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

  // Load eligible peers of same year and gender
  const loadEligiblePeers = async () => {
    setIsLoadingPeers(true);
    try {
      const res = await fetch(`/api/group/peers?roll_no=${encodeURIComponent(student.roll_no)}`);
      const data = await res.json();
      if (data.peers) {
        setEligiblePeers(data.peers);
      }
    } catch (err) {
      console.error('Failed to load eligible peers', err);
    } finally {
      setIsLoadingPeers(false);
    }
  };

  // Send Direct Invite
  const handleSendInvite = async (toRollNo: string) => {
    if (!groupDetails) return;
    setIsSubmitting(true);
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
        // Update local peer state to mark as invited
        setEligiblePeers((prev) =>
          prev.map((p) => (p.roll_no === toRollNo ? { ...p, is_invited: true } : p))
        );
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error sending invite' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Respond to Incoming Invite
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
        setStatusMessage({ type: 'success', text: data.message });
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: `Network error responding to invite` });
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

  const handleUnlockPreferences = async () => {
    if (!groupDetails) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/group/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupDetails.group_id,
          leader_roll_no: student.roll_no,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to unlock preferences' });
      } else {
        setStatusMessage({ type: 'success', text: data.message });
        onRefresh();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error unlocking preferences' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRoomDirectly = (roomId: string) => {
    if (rankedChoices.includes(roomId)) {
      setStatusMessage({ type: 'error', text: `Room ${roomId} is already in your preference list` });
      return;
    }
    const updated = [...rankedChoices, roomId];
    setRankedChoices(updated);
    setStatusMessage({
      type: 'success',
      text: `Room ${roomId} added to your preferences list! Remember to freeze choices before the timer ends.`,
    });
    const element = document.getElementById('choice-filling-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. STUDENT INFORMATION CARD                                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-100/70 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-blue-900 rounded-xs"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Student Profile &amp; Academic Status
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            Roll No: {student.roll_no}
          </span>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Student Name</span>
            <span className="font-bold text-slate-900 text-sm">{student.name}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Father&apos;s Name</span>
            <span className="font-semibold text-slate-800 text-xs">{student.father_name || 'N/A'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Academic Cohort</span>
            <span className="font-semibold text-slate-800 text-xs">Year {student.year} (B.Tech / B.Arch)</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Gender</span>
            <span className="font-semibold text-slate-800 text-xs">{student.gender}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Registered Email</span>
            <span className="font-mono text-slate-800 text-xs truncate block">{student.email}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Contact Phone</span>
            <span className="font-mono text-slate-800 text-xs">{student.phone}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Merit Score (CGPA)</span>
            <span className="font-mono font-bold text-blue-900 text-sm">{student.cgpa.toFixed(2)}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Current Hostel</span>
            <span className="font-semibold text-slate-800 text-xs">
              {student.current_hostel || pathway?.currentHostel || 'Junior Block'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-slate-500 text-[11px]">
              Eligible Target Hostels: <strong className="text-slate-900">{allowedHostels.map((h) => h.name).join(' • ')}</strong>
            </span>
            <span className="text-[11px] text-blue-900 font-semibold">
              Allocation Stage: Round 1 Online Choice Submission
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MULTI-ROUND ALLOCATION RESULT & STATUS                                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-900" />
            <h2 className="text-base font-bold text-slate-900">
              Hostel Allocation Result{' '}
              {roundConfig.is_published && (
                <span className="text-blue-900 font-semibold font-mono text-sm">
                  ({roundConfig.round_number === 6 ? 'Final Spot Round' : `Round ${roundConfig.round_number} of 5`})
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {groupDetails && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-900 border border-blue-200">
                Merit Batch #{assignedRound} (Round {assignedRound})
              </span>
            )}
            <span
              className={`px-3 py-1 text-xs font-semibold rounded ${
                roundConfig.is_published
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {roundConfig.is_published ? 'Declared &amp; Published' : 'Confidential (Pending Declaration)'}
            </span>
          </div>
        </div>

        {!roundConfig.is_published ? (
          <div className="p-6 bg-slate-50 rounded border border-slate-200 text-center space-y-2">
            <Calendar className="w-6 h-6 text-slate-500 mx-auto" />
            <h3 className="text-slate-900 font-bold text-sm">Results Not Yet Published</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Hostel allocations are currently undergoing administrative verification. The 5-stage merit release cycle will commence shortly in 2-hour intervals.
            </p>
          </div>
        ) : allotment ? (
          <div className="bg-white rounded border border-emerald-300 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Confirmed Room Allocation • Allotted in Round {allotment.allotment.round_number === 6 ? 'Final Spot Round' : allotment.allotment.round_number}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {allotment.hostel.name}
                </h3>
                <p className="text-xs text-slate-700 mt-1">
                  Room <strong className="text-slate-900 font-mono text-sm">{allotment.room.room_number}</strong>{' '}
                  ({allotment.room.floor_label || `Floor ${allotment.room.floor}`}) • Capacity:{' '}
                  {allotment.room.capacity} Bed ({allotment.room.capacity === 4 ? 'Fourlet' : 'Triplet'})
                </p>
              </div>
              <div className="text-left sm:text-right text-xs">
                <span className="text-slate-500 block font-medium text-[11px]">Assigned Warden</span>
                <span className="font-bold text-slate-900">{allotment.hostel.warden_name}</span>
              </div>
            </div>

            {/* Roommates List */}
            <div className="pt-4 border-t border-emerald-200/60">
              <span className="text-xs text-slate-700 font-semibold uppercase tracking-wider block mb-2.5">
                Allotted Roommates ({allotment.roommates.length}/{allotment.room.capacity}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {allotment.roommates.map((rm) => (
                  <div
                    key={rm.roll_no}
                    className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center space-x-3 shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono">
                      {rm.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        {rm.name}
                        {rm.roll_no === student.roll_no && (
                          <span className="text-[10px] text-emerald-700 font-bold">(You)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{rm.roll_no} • CG {rm.cgpa.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : assignedRound > roundConfig.round_number && roundConfig.round_number < 5 ? (
          <div className="p-6 bg-blue-50/70 rounded-lg border border-blue-200 text-center space-y-2">
            <Clock className="w-8 h-8 text-blue-900 mx-auto" />
            <h3 className="text-slate-900 font-bold text-base">
              Your Group is Scheduled for Round {assignedRound}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Based on your team&apos;s merit score, your group will be evaluated and published in <strong>Round {assignedRound}</strong>. The portal is currently publishing Round {roundConfig.round_number} of 5.
            </p>
            {studentCountdown && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-300 rounded font-mono text-xs font-bold text-blue-950 mt-2">
                <Timer className="w-3.5 h-3.5 text-blue-700 animate-pulse" />
                <span>Next Round releases in: {studentCountdown}</span>
              </div>
            )}
          </div>
        ) : roundConfig.final_round_active || (roundConfig.round_number >= 5 && !roundConfig.final_round_completed) ? (
          <div className="p-6 bg-amber-50 rounded-lg border-2 border-amber-400 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-amber-600 mx-auto animate-bounce" />
            <div>
              <h3 className="text-amber-950 font-bold text-base">
                Rounds 1–5 Concluded — Final Spot Round Now Active!
              </h3>
              <p className="text-xs text-amber-800 max-w-lg mx-auto leading-relaxed mt-1">
                Your group was not allotted a room in the regular 5 rounds. All remaining unoccupied/vacant rooms across hostels are now open for choice filling below. Please select and lock your choices from the vacant rooms to participate in the Final Round.
              </p>
            </div>
            <a
              href="#choice-filling-section"
              className="inline-block px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded transition-colors shadow-xs"
            >
              Fill Choices for Final Spot Round &darr;
            </a>
          </div>
        ) : roundConfig.final_round_completed ? (
          <div className="p-6 bg-slate-50 rounded-lg border border-slate-300 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-slate-900 font-bold text-base">Allotment Cycle Concluded</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              All 5 regular rounds and the Final Spot Round have concluded. All rooms matching your group capacity have been allotted. Please contact the Chief Warden office for administrative allocation assistance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {isChoiceWindowActive ? (
              <div className="p-6 bg-amber-50/90 rounded-lg border-2 border-amber-400 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-950 font-bold text-base">
                  <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                  <span>No Room Allotted in Round {roundConfig.round_number} — 30-Minute Choice Window Active</span>
                </div>
                <p className="text-xs text-amber-900 max-w-xl mx-auto leading-relaxed">
                  None of your group&apos;s preferences were available at your merit cut-off in Round {roundConfig.round_number} (or your group had not submitted preferences previously).
                  You have a <strong>30-minute window</strong> following round declaration to modify, add, or reorder your room choices for <strong>Round {roundConfig.round_number + 1}</strong>.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-amber-300 rounded font-mono text-xs font-bold text-amber-950 shadow-xs">
                    <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Choices Lock In: {choiceLockCountdown || '30:00'}</span>
                  </div>
                  {isLeader && groupDetails?.is_locked && (
                    <button
                      onClick={handleUnlockPreferences}
                      disabled={isSubmitting}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <Unlock className="w-3.5 h-3.5" /> Unlock Choices to Edit
                    </button>
                  )}
                  <a
                    href="#choice-filling-section"
                    className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    Go to Choice Filling &darr;
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-300 text-center space-y-2">
                <Lock className="w-6 h-6 text-slate-500 mx-auto" />
                <h3 className="text-slate-900 font-bold text-base">
                  No Room Allotted in Round {roundConfig.round_number} — Choices Locked
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  The 30-minute post-round choice window has concluded. Preferences are locked for Round {roundConfig.round_number + 1} merit processing.
                </p>
                {studentCountdown && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-slate-800 mt-2">
                    <Timer className="w-3.5 h-3.5 text-blue-900 animate-pulse" />
                    <span>Round {roundConfig.round_number + 1} releases in: {studentCountdown}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2.5 AVAILABLE ROOMS LEFT & OCCUPIED ROOMS (Whenever a round is published) */}
      {/* ========================================================================= */}
      {roundConfig.is_published && occupancyReport && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">
                <DoorOpen className="w-4 h-4" />
                <span>Round {roundConfig.round_number} Live Allocation Status</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Available Rooms Left &amp; Occupied Rooms
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Inspect vacant rooms remaining across hostels after Round {roundConfig.round_number} allocation vs rooms already occupied.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                <strong>{occupancyReport.summary.available_rooms}</strong> Vacant Rooms Left
              </span>
              <span className="px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 rounded font-semibold">
                <strong>{occupancyReport.summary.occupied_rooms}</strong> Occupied ({occupancyReport.summary.occupancy_rate}%)
              </span>
            </div>
          </div>

          {/* Filter Bar: Tabs & Hostel Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setOccupancyTab('available')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  occupancyTab === 'available'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                Available Rooms Left ({occupancyReport.available_rooms.filter(r => occupancyHostelFilter === 'all' || r.hostel_id === occupancyHostelFilter).length})
              </button>
              <button
                type="button"
                onClick={() => setOccupancyTab('occupied')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  occupancyTab === 'occupied'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DoorClosed className="w-3.5 h-3.5 text-blue-800" />
                Occupied Rooms ({occupancyReport.occupied_rooms.filter(r => occupancyHostelFilter === 'all' || r.hostel_id === occupancyHostelFilter).length})
              </button>
            </div>

            {/* Hostel Selector Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-semibold">Hostel:</span>
              <select
                value={occupancyHostelFilter}
                onChange={(e) => setOccupancyHostelFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 shadow-xs"
              >
                <option value="all">All Hostels ({occupancyReport.summary.total_rooms} rooms)</option>
                {occupancyReport.summary.by_hostel.map((bh) => (
                  <option key={bh.hostel_id} value={bh.hostel_id}>
                    {bh.hostel_name.split(' ')[0]} ({bh.available} free / {bh.total} total)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TAB CONTENT: Available Rooms */}
          {occupancyTab === 'available' && (
            <div className="space-y-3">
              {occupancyReport.available_rooms.filter(r => occupancyHostelFilter === 'all' || r.hostel_id === occupancyHostelFilter).length === 0 ? (
                <div className="p-8 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-500">
                  No vacant rooms remain in this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[360px] overflow-y-auto p-1 pr-1.5">
                  {occupancyReport.available_rooms
                    .filter(r => occupancyHostelFilter === 'all' || r.hostel_id === occupancyHostelFilter)
                    .map((room) => {
                      const isAlreadyInChoices = rankedChoices.includes(room.room_id);
                      const matchesGroupCapacity = !groupDetails || room.capacity === groupDetails.required_capacity;

                      return (
                        <div
                          key={room.room_id}
                          className="p-3 bg-white hover:bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs space-y-1.5 shadow-xs transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {room.room_number}
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              Vacant
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate" title={room.hostel_name}>
                            {room.hostel_name.split(' ')[0]} ({room.hostel_id})
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center justify-between">
                            <span>Floor {room.floor}</span>
                            <span>{room.capacity === 4 ? 'Fourlet' : 'Triplet'}</span>
                          </div>

                          {/* Quick Add Button for Unallotted Leader during Choice Window */}
                          {isChoiceWindowActive && !allotment && isLeader && matchesGroupCapacity && (
                            <button
                              type="button"
                              onClick={() => handleAddRoomDirectly(room.room_id)}
                              disabled={isAlreadyInChoices}
                              className={`w-full mt-1 py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                                isAlreadyInChoices
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                              }`}
                            >
                              {isAlreadyInChoices ? 'In Choices' : '+ Add to Choices'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Occupied Rooms */}
          {occupancyTab === 'occupied' && (
            <div className="space-y-3">
              {occupancyReport.occupied_rooms.filter(r => occupancyHostelFilter === 'all' || r.hostel_id === occupancyHostelFilter).length === 0 ? (
                <div className="p-8 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-500">
                  No rooms occupied in this hostel yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 pr-1.5">
                  {occupancyReport.occupied_rooms
                    .filter(r => occupancyHostelFilter === 'all' || r.hostel_id === occupancyHostelFilter)
                    .map((room) => (
                      <div
                        key={room.room_id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              Room {room.room_number}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1.5">
                              ({room.hostel_name.split(' ')[0]} • Floor {room.floor})
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded">
                            {room.occupants.length}/{room.capacity} Allotted
                          </span>
                        </div>

                        {/* Occupants list */}
                        <div className="space-y-1 pt-1 border-t border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Allotted Students:
                          </span>
                          <div className="space-y-1">
                            {room.occupants.map((occ) => (
                              <div
                                key={occ.roll_no}
                                className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-slate-200 font-mono"
                              >
                                <span className="font-bold text-slate-800">{occ.name}</span>
                                <span className="text-slate-500">{occ.roll_no} • CG {occ.cgpa.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ROOMMATE TEAM FORMATION (LOBBY)                                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Roommate Group Registration</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Roommate Group Formation
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Form your room team by inviting eligible batchmates. Allocation priority uses the team&apos;s highest CGPA score.
            </p>
          </div>

          {groupDetails && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleLeaveOrDisband}
                disabled={isSubmitting || isGroupLocked}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:text-white bg-white hover:bg-red-700 border border-red-300 rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isLeader ? 'Disband Group' : 'Leave Group'}
              </button>
            </div>
          )}
        </div>

        {/* INCOMING INVITES NOTIFICATION BANNER */}
        {!groupDetails && incomingInvites && incomingInvites.length > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-300 rounded space-y-3">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4 text-blue-900" />
              <span>Pending Roommate Invitations ({incomingInvites.length})</span>
            </div>
            <div className="space-y-2">
              {incomingInvites.map((inv) => (
                <div
                  key={inv.invite_id}
                  className="p-3 bg-white border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Invitation from <span className="text-blue-900 font-semibold">{inv.leader_name}</span> ({inv.from_roll_no})
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Accommodation Type:{' '}
                      <span className="font-semibold text-slate-800">
                        {inv.sharing_type} ({inv.current_members_count}/{inv.required_capacity} Members Joined)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondInvite(inv.invite_id, 'accept')}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleRespondInvite(inv.invite_id, 'decline')}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupDetails ? (
          /* =================================================================== */
          /* CASE A: STUDENT IS INSIDE A ROOM GROUP                              */
          /* =================================================================== */
          <div className="space-y-6">
            {/* Group Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded">
                <span className="text-[11px] text-slate-500 font-medium block">Room Type</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  {groupDetails.sharing_type || (groupDetails.required_capacity === 4 ? 'Fourlets' : 'Triplets')} ({groupDetails.required_capacity} Beds)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Code: {groupDetails.group_code}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded">
                <span className="text-[11px] text-slate-500 font-medium block">Merit Score (Highest CGPA)</span>
                <span className="text-base font-bold text-blue-900 mt-0.5 flex items-center gap-1.5 font-mono">
                  {groupDetails.max_cgpa.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500">Used for Round 1 Allotment Rank</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded">
                <span className="text-[11px] text-slate-500 font-medium block">Group Status</span>
                <span
                  className={`text-xs font-bold mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded ${
                    groupDetails.is_locked
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : isGroupFull
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {groupDetails.is_locked ? (
                    <>
                      <Lock className="w-3 h-3" /> Choices Frozen &amp; Locked
                    </>
                  ) : isGroupFull ? (
                    'Ready for Choice Filling'
                  ) : (
                    `Awaiting Roommates (${groupDetails.members.length}/${groupDetails.required_capacity})`
                  )}
                </span>
              </div>
            </div>

            {/* Room Slots */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Room Slots ({groupDetails.members.length} of {groupDetails.required_capacity} Occupied)
                </h3>
                {isLeader && !isGroupFull && !isGroupLocked && (
                  <button
                    onClick={() => {
                      loadEligiblePeers();
                      setShowInviteModal(true);
                    }}
                    className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Invite Batchmate
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Render Occupied Slots */}
                {groupDetails.members.map((member, idx) => (
                  <div
                    key={member.roll_no}
                    className="p-3.5 bg-white border border-slate-200 rounded relative shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Slot {idx + 1}
                        </span>
                        {member.roll_no === groupDetails.leader_roll_no ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold rounded">
                            Team Leader
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                            Member
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-2">
                        {member.student.name}
                      </div>
                      <div className="text-xs font-mono text-blue-900 font-semibold">{member.roll_no}</div>

                      {member.student.father_name && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          S/D of: {member.student.father_name}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">CGPA:</span>
                      <strong className="text-blue-900 font-bold font-mono">{member.student.cgpa.toFixed(2)}</strong>
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
                        className="p-3.5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded flex flex-col items-center justify-center text-center min-h-[130px] space-y-1.5 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">
                            Slot {slotNum}: Vacant
                          </span>
                          <span className="text-[10px] text-slate-400">Awaiting Invitation</span>
                        </div>
                        {isLeader && !isGroupLocked && (
                          <button
                            onClick={() => {
                              loadEligiblePeers();
                              setShowInviteModal(true);
                            }}
                            className="mt-1 px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-semibold rounded transition-colors shadow-xs"
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
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2">
                <span className="text-xs text-slate-700 font-bold uppercase tracking-wider block">
                  Outgoing Invitations Awaiting Confirmation:
                </span>
                <div className="flex flex-wrap gap-2">
                  {groupDetails.outgoing_invites.map((inv) => (
                    <div
                      key={inv.invite_id}
                      className="px-3 py-1 bg-white border border-slate-200 rounded text-xs flex items-center gap-2 shadow-xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                      <span className="font-semibold text-slate-900">{inv.to_name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">({inv.to_roll_no})</span>
                      <span className="text-slate-600 text-[10px]">Awaiting reply</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =================================================================== */
          /* CASE B: STUDENT IS NOT IN ANY GROUP                                 */
          /* =================================================================== */
          <div className="max-w-xl mx-auto p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-5 text-center shadow-xs">
            <div className="w-12 h-12 rounded bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-900 shadow-xs">
              <BedDouble className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Initiate Roommate Group</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Hostel accommodations are allocated in shared rooms. Create a group and invite your eligible batchmates of the same year and gender.
              </p>
            </div>

            {/* Sharing Choice Selection */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-700 block text-center">
                Select Room Sharing Capacity:
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setSharingTypeChoice('Fourlets')}
                  className={`p-3.5 rounded border text-left transition-all ${
                    sharingTypeChoice === 'Fourlets'
                      ? 'bg-blue-50 border-blue-900 text-blue-950 font-semibold'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Fourlets</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded">
                      4 Beds
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Room shared by 4 roommates.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingTypeChoice('Triplets')}
                  className={`p-3.5 rounded border text-left transition-all ${
                    sharingTypeChoice === 'Triplets'
                      ? 'bg-blue-50 border-blue-900 text-blue-950 font-semibold'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Triplets</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded">
                      3 Beds
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Room shared by 3 roommates.
                  </p>
                </button>
              </div>
            </div>

            <button
              onClick={handleCreateLobby}
              disabled={isSubmitting}
              className="w-full max-w-md py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              {isSubmitting ? (
                'Creating Group...'
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Create {sharingTypeChoice} Group
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: INVITE SAME-YEAR & SAME-GENDER PEERS                           */}
      {/* ========================================================================= */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invite Classmates to Group</h3>
                <p className="text-[11px] text-blue-900 font-semibold">
                  Eligibility: Cohort Year {student.year} ({student.gender})
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name or roll number (e.g. 25BEE, Harshit)..."
                value={peerSearchQuery}
                onChange={(e) => setPeerSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 shadow-xs"
              />
            </div>

            {/* Peer List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {isLoadingPeers ? (
                <div className="text-center py-10 text-xs text-slate-500 space-y-2">
                  <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>Loading eligible classmates...</div>
                </div>
              ) : filteredPeers.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No eligible classmates found matching &ldquo;{peerSearchQuery}&rdquo;.
                </div>
              ) : (
                filteredPeers.map((peer) => (
                  <div
                    key={peer.roll_no}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {peer.name}
                        {peer.father_name && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            (S/D of {peer.father_name})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-blue-900 font-semibold">
                        {peer.roll_no} • CGPA {peer.cgpa.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      {peer.in_group ? (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-semibold text-[10px] rounded">
                          In Another Group
                        </span>
                      ) : peer.is_invited ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[10px] rounded">
                          Invite Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendInvite(peer.roll_no)}
                          disabled={isSubmitting}
                          className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1 shadow-xs"
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
      {/* 4. STEP-BY-STEP CHOICE FILLING (Hostel -> Floor -> Room)                 */}
      {/* ========================================================================= */}
      {groupDetails && (
        <div id="choice-filling-section" className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          {isFinalSpotActive && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Final Spot Round Choice Filling Active</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                All 5 regular rounds have concluded. All remaining vacant rooms are displayed below.
                As group leader, you can select and re-order any available vacant rooms matching your group ({activeSharingType}) and freeze your choices for the Final Round allocation.
              </p>
            </div>
          )}

          <div>
            <div className="inline-flex items-center gap-1.5 text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>{isFinalSpotActive ? 'Final Spot Round Preference Submission' : 'Preference Submission'}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {isFinalSpotActive ? 'Remaining Vacant Rooms Choice Filling' : 'Hostel & Room Choice Filling'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isFinalSpotActive
                ? `Select from all currently unoccupied rooms matching your group capacity (${activeSharingType}).`
                : `Select hostel, floor, and room according to your group's sharing capacity (${activeSharingType}).`}
            </p>
          </div>

          <div className="space-y-5">
            {/* STEP 1: HOSTEL SELECTION BUTTONS */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="w-4 h-4 rounded bg-blue-900 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Select Hostel:</span>
              </div>
              <div className="flex flex-wrap gap-2">
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
                      className={`px-3.5 py-2 rounded text-xs font-semibold border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{h.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: FLOOR / LEVEL SELECTION BUTTONS */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="w-4 h-4 rounded bg-blue-900 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Select Floor:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
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
                      className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {getFloorButtonLabel(fl)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: ROOM SELECTION BUTTONS (Filtered by Fourlets / Triplets) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="w-4 h-4 rounded bg-blue-900 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Select Room ({activeSharingType}):</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {roomsForSelectedFloorAndType.length} rooms available
                </span>
              </div>

              {roomsForSelectedFloorAndType.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-500">
                  No {activeSharingType} rooms exist on this level. Please select another floor.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[260px] overflow-y-auto p-1 pr-1.5">
                  {roomsForSelectedFloorAndType.map((room) => {
                    const isSelected = selectedRoomId === room.room_id;
                    const isAlreadyPicked = rankedChoices.includes(room.room_id);

                    return (
                      <button
                        key={room.room_id}
                        type="button"
                        onClick={() => setSelectedRoomId(room.room_id)}
                        disabled={isAlreadyPicked}
                        className={`p-2 rounded text-xs font-mono font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isAlreadyPicked
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-blue-900 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">{room.room_number}</span>
                        <span className="text-[9px] uppercase font-sans font-medium opacity-80">
                          {isAlreadyPicked
                            ? 'Added'
                            : isSelected
                            ? 'Selected'
                            : isFinalSpotActive
                            ? 'Vacant'
                            : room.sharing_type || `${room.capacity} Bed`}
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
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center gap-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Room {selectedRoomId} to Preferences
                  </button>
                  <span className="text-xs text-slate-600">
                    Selected: <strong className="text-slate-900 font-mono">{selectedRoomId}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* STEP 4: ORDERED PREFERENCE LIST (Choices 1, 2, 3...) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              {/* 30-Minute Choice Window / Lock Status Banner */}
              {roundConfig.is_published && !allotment && (
                isChoiceWindowActive ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                      <span>Round {roundConfig.round_number} Choice Window Open: You have 30 minutes to adjust your ranked room choices.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-950 bg-white px-2.5 py-1 rounded border border-amber-300 text-[11px] flex items-center gap-1 shadow-xs">
                        <Timer className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        Locks in: {choiceLockCountdown}
                      </span>
                      {isLeader && isGroupLocked && (
                        <button
                          type="button"
                          onClick={handleUnlockPreferences}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] rounded transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                        >
                          <Unlock className="w-3 h-3" /> Unlock Choices
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>The 30-minute choice window has closed. Preferences are locked for Round {roundConfig.round_number + 1} allocation.</span>
                    </div>
                    {studentCountdown && (
                      <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300 text-[11px]">
                        Next Round in: {studentCountdown}
                      </span>
                    )}
                  </div>
                )
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <BedDouble className="w-3.5 h-3.5 text-blue-900" />
                    <span>Submitted Room Choices ({rankedChoices.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ordered from Choice #1 downwards. The allocation engine evaluates preferences sequentially.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isLeader && isGroupLocked && isChoiceWindowActive && !allotment && (
                    <button
                      onClick={handleUnlockPreferences}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Unlock to Edit Choices
                    </button>
                  )}

                  {isLeader && (!isGroupLocked || isFinalSpotActive) && isGroupFull && (!roundConfig.is_published || isChoiceWindowActive || isFinalSpotActive) && (
                    <button
                      onClick={handleLockPreferences}
                      disabled={isSubmitting || rankedChoices.length === 0}
                      className={`px-4 py-2 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 ${
                        isFinalSpotActive ? 'bg-amber-700 hover:bg-amber-800' : 'bg-blue-900 hover:bg-blue-800'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {isFinalSpotActive ? 'Freeze & Lock Final Round Choices' : 'Freeze & Lock Preferences'}
                    </button>
                  )}
                </div>
              </div>

              {isGroupLocked && !isFinalSpotActive && !isChoiceWindowActive && (
                <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Your preferences are locked for round allocation. Processing will proceed according to your ranked list.
                  </span>
                </div>
              )}

              {!isGroupFull && !isGroupLocked && (
                <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Your group needs {groupDetails.required_capacity - groupDetails.members.length} more roommate(s) to reach full capacity before you can finalize and lock choices.
                  </span>
                </div>
              )}

              {rankedChoices.length === 0 ? (
                <div className="p-5 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-500">
                  No room choices added yet. Use the selection steps above or the vacant rooms list to add room preferences.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {rankedChoices.map((roomId, idx) => {
                    const roomInfo = activeRoomsPool.find((r) => r.room_id === roomId) || availableRooms.find((r) => r.room_id === roomId);
                    const canEditItem = (!isGroupLocked || isFinalSpotActive) && isLeader && (!roundConfig.is_published || isChoiceWindowActive || isFinalSpotActive);

                    return (
                      <div
                        key={roomId}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded bg-white border border-slate-200 text-blue-900 font-bold flex items-center justify-center text-xs font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">
                              {roomInfo ? roomInfo.hostel.name : roomId}
                            </span>
                            <span className="text-slate-500 ml-2">
                              Room <strong className="text-slate-800 font-mono">{roomInfo ? roomInfo.room_number : roomId}</strong>{' '}
                              ({roomInfo?.floor_label || `Floor ${roomInfo?.floor || 0}`})
                            </span>
                          </div>
                        </div>

                        {canEditItem && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMovePreference(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePreference(idx, 'down')}
                              disabled={idx === rankedChoices.length - 1}
                              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePreference(idx)}
                              className="p-1 rounded bg-white hover:bg-red-50 border border-red-200 text-red-700 ml-1"
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
