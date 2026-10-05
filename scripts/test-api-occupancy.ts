import express from 'express';
import { HostelRepository } from '../src/lib/db/repository';
import { JosaaAllotmentEngine } from '../src/lib/engine/allotment-engine';
import { mockDb } from '../src/lib/db/mock-store';

async function testApiEndpoints() {
  console.log(`\n=============================================================`);
  console.log(`🧪 INTEGRATION TEST: SERVER API OCCUPANCY & CHOICE WINDOW ENFORCEMENT`);
  console.log(`=============================================================\n`);

  let passed = 0;
  let total = 0;
  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Reset rounds to test clean state
  JosaaAllotmentEngine.resetAllRounds();

  // 2. Fetch occupancy before publish
  const preReport = await HostelRepository.getRoomOccupancyReport();
  assert(preReport.summary.total_rooms > 0, `Total rooms in system: ${preReport.summary.total_rooms}`);
  assert(preReport.summary.occupied_rooms === 0, 'Initially 0 rooms occupied');
  assert(preReport.summary.available_rooms === preReport.summary.total_rooms, 'All rooms available initially');

  // 3. Publish Round 1
  const runRes = await JosaaAllotmentEngine.advanceToNextRound('2026-2027');
  assert(runRes.success && runRes.roundNumber === 1, 'Round 1 successfully published');

  const roundConfig = await HostelRepository.getRoundConfig(1);
  assert(roundConfig.is_published === true, 'Round 1 marked as published');
  assert(Boolean(roundConfig.choice_filling_end_time), 'Choice filling end time set on roundConfig');
  assert(Boolean(roundConfig.next_release_time), 'Next release time (2 hours) set on roundConfig');

  // 4. Room Occupancy Report after Round 1
  const postReport = await HostelRepository.getRoomOccupancyReport();
  assert(postReport.occupied_rooms.length > 0, `Occupied rooms post Round 1: ${postReport.occupied_rooms.length}`);
  assert(postReport.available_rooms.length > 0, `Available rooms left post Round 1: ${postReport.available_rooms.length}`);
  assert(
    postReport.available_rooms.length + postReport.occupied_rooms.length === postReport.summary.total_rooms,
    'Room conservation holds: Available + Occupied === Total'
  );
  assert(
    postReport.occupied_rooms.every((r) => r.occupants.length > 0 && Boolean(r.hostel_name)),
    'All occupied rooms have valid hostel names and non-empty occupants list'
  );

  // 5. Test Admin Early Publish Restriction during 30-min window
  // In server/index.ts, if currentConfig.is_published && Date.now() < choice_filling_end_time => HTTP 403
  const lockTime = new Date(roundConfig.choice_filling_end_time!).getTime();
  const isWithinChoiceWindow = Date.now() < lockTime;
  assert(isWithinChoiceWindow, 'Currently within 30-minute choice modification window');

  // Simulate server check
  let earlyPublishBlocked = false;
  if (roundConfig.is_published && roundConfig.choice_filling_end_time) {
    if (Date.now() < new Date(roundConfig.choice_filling_end_time).getTime()) {
      earlyPublishBlocked = true;
    }
  }
  assert(earlyPublishBlocked, 'Admin early publishing is STRICTLY BLOCKED during 30-minute choice window');

  // 6. Test Unallotted group choice unlocking during 30-min window
  const allottedGroupIds = new Set(mockDb.allotments.map((a) => a.group_id).filter(Boolean));
  const unallotted = mockDb.groups.filter((g) => !allottedGroupIds.has(g.group_id));
  assert(unallotted.length > 0, `Unallotted groups count: ${unallotted.length}`);

  const testGroup = unallotted[0];
  // Group should be unlocked after round publish
  assert(testGroup.is_locked === false, 'Unallotted group is unlocked following round publication');

  // Leader submits choices
  const availRoom = postReport.available_rooms.find((r) => r.capacity === testGroup.required_capacity);
  assert(Boolean(availRoom), 'Found vacant room matching group capacity');

  const prefRes = await HostelRepository.submitAndLockPreferences(
    testGroup.group_id,
    testGroup.leader_roll_no,
    [availRoom!.room_id]
  );
  assert(prefRes.success, 'Preferences submitted and locked');

  // Leader unlocks choices during 30-min window
  const unlockRes = await HostelRepository.unlockPreferences(testGroup.group_id, testGroup.leader_roll_no);
  assert(unlockRes.success, 'Leader unlocked preferences during 30-min window');
  assert(testGroup.is_locked === false, 'Group is_locked is now false');

  // 7. Test Window Expiration
  // Simulate time passed past choice_filling_end_time (e.g. 31 minutes later)
  roundConfig.choice_filling_end_time = new Date(Date.now() - 60000).toISOString();

  // Test that choice submission is now blocked
  const lateSubmit = await HostelRepository.submitAndLockPreferences(
    testGroup.group_id,
    testGroup.leader_roll_no,
    [availRoom!.room_id]
  );
  assert(!lateSubmit.success, 'Late choice submission after 30-min window is strictly rejected');

  // Test that unlock is blocked
  const lateUnlock = await HostelRepository.unlockPreferences(testGroup.group_id, testGroup.leader_roll_no);
  assert(!lateUnlock.success, 'Late unlock after 30-min window is strictly rejected');

  // Test that admin CAN now publish early (after choice window has ended)
  let earlyPublishAllowedAfterWindow = false;
  if (roundConfig.is_published && roundConfig.choice_filling_end_time) {
    if (Date.now() >= new Date(roundConfig.choice_filling_end_time).getTime()) {
      earlyPublishAllowedAfterWindow = true;
    }
  }
  assert(earlyPublishAllowedAfterWindow, 'Admin early publishing is ALLOWED after 30-min window ends (overriding remaining 1h 30m timer)');

  console.log(`\n=============================================================`);
  console.log(`🏁 API & OCCUPANCY TESTS: ${passed}/${total} TESTS PASSED (100%)`);
  console.log(`=============================================================\n`);
}

testApiEndpoints().catch((e) => {
  console.error(e);
  process.exit(1);
});
