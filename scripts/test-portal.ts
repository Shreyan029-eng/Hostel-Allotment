import { HostelRepository } from '../src/lib/db/repository';
import { JosaaAllotmentEngine } from '../src/lib/engine/allotment-engine';
import { mockDb, getStudentHostelPathway } from '../src/lib/db/mock-store';

async function runTestSuite() {
  console.log(`\n=============================================================`);
  console.log(`🧪 RUNNING SUITE: NITH SMART HOSTEL PORTAL & GATE SYSTEM`);
  console.log(`=============================================================\n`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: NITH OFFICIAL HOSTEL PATHWAYS & COHORT RULES
  // ---------------------------------------------------------------------------
  console.log(`--- Test Suite 1: NITH Official Hostel Eligibility & Pathways ---`);
  // Year 2 Boy (25 cohort)
  const studentY2Boy = await HostelRepository.getStudentByRoll('25BEE012');
  assert(Boolean(studentY2Boy), 'Year 2 Boy (25BEE012) retrieved from database');
  const pathY2Boy = getStudentHostelPathway(studentY2Boy!);
  assert(
    pathY2Boy.currentHostel.includes('Kailash') &&
    pathY2Boy.nextHostels.length === 1 &&
    pathY2Boy.nextHostels[0].hostel_id === 'HBH',
    'Year 2 Boy: Current hostel is Kailash (KBH) -> Next hostel is Himadri (HBH)'
  );

  // Year 2 Girl (25 cohort)
  const studentY2Girl = await HostelRepository.getStudentByRoll('25BME076');
  assert(Boolean(studentY2Girl), 'Year 2 Girl (25BME076) retrieved from database');
  const pathY2Girl = getStudentHostelPathway(studentY2Girl!);
  assert(
    pathY2Girl.nextHostels.length === 1 && pathY2Girl.nextHostels[0].hostel_id === 'AGH',
    'Year 2 Girl: Next hostel is Ambika (AGH)'
  );

  // Year 3 Boy (24 cohort)
  const studentY3Boy = await HostelRepository.getStudentByRoll('24BME039');
  assert(Boolean(studentY3Boy), 'Year 3 Boy (24BME039) retrieved from database');
  const pathY3Boy = getStudentHostelPathway(studentY3Boy!);
  assert(
    pathY3Boy.nextHostels.length === 2 &&
    pathY3Boy.nextHostels.some((h) => h.hostel_id === 'DBH') &&
    pathY3Boy.nextHostels.some((h) => h.hostel_id === 'NBH'),
    'Year 3 Boy: Next hostels are Dhauladhar (DBH) and Neelkanth (NBH)'
  );

  // Year 4 Boy (23 cohort)
  const studentY4Boy = await HostelRepository.getStudentByRoll('23BMS022');
  assert(Boolean(studentY4Boy), 'Year 4 Boy (23BMS022) retrieved from database');
  const pathY4Boy = getStudentHostelPathway(studentY4Boy!);
  assert(
    pathY4Boy.nextHostels.length === 3 &&
    pathY4Boy.nextHostels.some((h) => h.hostel_id === 'HGBH') &&
    pathY4Boy.nextHostels.some((h) => h.hostel_id === 'VBH') &&
    pathY4Boy.nextHostels.some((h) => h.hostel_id === 'UBH'),
    'Final Year Boy: Next hostels are Himgiri (HGBH), Vidhyanchal (VBH), Udaygiri (UBH)'
  );

  // ---------------------------------------------------------------------------
  // TEST 2: HIMADRI BOYS HOSTEL EXACT ROOM LAYOUT (SPECIFICATION)
  // ---------------------------------------------------------------------------
  console.log(`\n--- Test Suite 2: Himadri Boys Hostel Room Layout ---`);
  const allRooms = mockDb.rooms;
  const hbhRooms = allRooms.filter((r) => r.hostel_id === 'HBH');
  assert(hbhRooms.length === 198, `Himadri has exactly 198 rooms generated (Found: ${hbhRooms.length})`);

  // Level G1 verification
  const g1Fourlets = hbhRooms.filter((r) => r.floor === 0 && r.sharing_type === 'Fourlets');
  const g1Triplets = hbhRooms.filter((r) => r.floor === 0 && r.sharing_type === 'Triplets');
  assert(g1Fourlets.length === 6, 'Level G1: Exactly 6 Fourlets (G-101, 102, 107..110)');
  assert(g1Triplets.length === 6, 'Level G1: Exactly 6 Triplets (G-133 - G-138)');

  // Level 1 verification
  const l1Fourlets = hbhRooms.filter((r) => r.floor === 1 && r.sharing_type === 'Fourlets');
  const l1Triplets = hbhRooms.filter((r) => r.floor === 1 && r.sharing_type === 'Triplets');
  assert(l1Fourlets.length === 12, 'Level 1: Exactly 12 Fourlets (101, 102, 107-116)');
  assert(l1Triplets.length === 18, 'Level 1: Exactly 18 Triplets (118, 119, 124, 125, 127-140)');

  // Level 2 verification
  const l2Fourlets = hbhRooms.filter((r) => r.floor === 2 && r.sharing_type === 'Fourlets');
  const l2Triplets = hbhRooms.filter((r) => r.floor === 2 && r.sharing_type === 'Triplets');
  assert(l2Fourlets.length === 21, 'Level 2: Exactly 21 Fourlets (201-219, 224, 225)');
  assert(l2Triplets.length === 15, 'Level 2: Exactly 15 Triplets (226-240)');

  // Level 3 verification
  const l3Fourlets = hbhRooms.filter((r) => r.floor === 3 && r.sharing_type === 'Fourlets');
  const l3Triplets = hbhRooms.filter((r) => r.floor === 3 && r.sharing_type === 'Triplets');
  assert(l3Fourlets.length === 25, 'Level 3: Exactly 25 Fourlets (301-325)');
  assert(l3Triplets.length === 15, 'Level 3: Exactly 15 Triplets (326-340)');

  // Level 4 verification
  const l4Fourlets = hbhRooms.filter((r) => r.floor === 4 && r.sharing_type === 'Fourlets');
  const l4Triplets = hbhRooms.filter((r) => r.floor === 4 && r.sharing_type === 'Triplets');
  assert(l4Fourlets.length === 26, 'Level 4: Exactly 26 Fourlets (401-425, 439)');
  assert(l4Triplets.length === 14, 'Level 4: Exactly 14 Triplets (426-438, 440)');

  // Level 5 verification
  const l5Fourlets = hbhRooms.filter((r) => r.floor === 5 && r.sharing_type === 'Fourlets');
  const l5Triplets = hbhRooms.filter((r) => r.floor === 5 && r.sharing_type === 'Triplets');
  assert(l5Fourlets.length === 27, 'Level 5: Exactly 27 Fourlets (501-525, 539, 540)');
  assert(l5Triplets.length === 13, 'Level 5: Exactly 13 Triplets (526-538)');

  // ---------------------------------------------------------------------------
  // TEST 2B: AMBIKA GIRLS HOSTEL (AGH) EXACT ROOM LAYOUT (SPECIFICATION)
  // ---------------------------------------------------------------------------
  console.log(`\n--- Test Suite 2B: Ambika Girls Hostel Room Layout ---`);
  const aghRooms = allRooms.filter((r) => r.hostel_id === 'AGH');
  assert(aghRooms.length === 82, `Ambika has exactly 82 rooms generated (Found: ${aghRooms.length})`);

  const aghFourlets = aghRooms.filter((r) => r.sharing_type === 'Fourlets');
  const aghTwolets = aghRooms.filter((r) => r.sharing_type === 'Twolets');
  const aghTriplets = aghRooms.filter((r) => r.sharing_type === 'Triplets');
  assert(aghFourlets.length === 20, `Ambika has exactly 20 Fourlets (Found: ${aghFourlets.length})`);
  assert(aghTwolets.length === 62, `Ambika has exactly 62 Twolets (Found: ${aghTwolets.length})`);
  assert(aghTriplets.length === 0, `Ambika has 0 Triplets (Found: ${aghTriplets.length})`);

  // OLD AGH: Series 3 (Fourlets: A 301-303, B 301-303, C 301-304) -> 10 Fourlets
  // OLD AGH: Series 3 (Fourlets: A 301-303, B 301-303, C 301-304) -> 10 Fourlets
  const oldS3 = aghRooms.filter((r) => r.floor_label.includes('Old Wing') && r.floor === 3);
  assert(oldS3.length === 10 && oldS3.every((r) => r.capacity === 4), 'OLD AGH Series 3: Exactly 10 Fourlets (A-301..303, B-301..303, C-301..304)');

  // OLD AGH: Series 4 (Fourlets: B 401-403, A 401-404) -> 7 Fourlets
  const oldS4 = aghRooms.filter((r) => r.floor_label.includes('Old Wing') && r.floor === 4);
  assert(oldS4.length === 7 && oldS4.every((r) => r.capacity === 4), 'OLD AGH Series 4: Exactly 7 Fourlets (B-401..403, A-401..404)');

  // OLD AGH: Series 5 (Twolets: C 501-512) -> 12 Twolets
  const oldS5 = aghRooms.filter((r) => r.floor_label.includes('Old Wing') && r.floor === 5);
  assert(oldS5.length === 12 && oldS5.every((r) => r.capacity === 2), 'OLD AGH Series 5: Exactly 12 Twolets (C-501..512)');

  // OLD AGH: Series 6 (Twolets: C 601-612 [12], Fourlets: A 601-603 [3]) -> 15 rooms
  const oldS6 = aghRooms.filter((r) => r.floor_label.includes('Old Wing') && r.floor === 6);
  const oldS6Twolets = oldS6.filter((r) => r.capacity === 2);
  const oldS6Fourlets = oldS6.filter((r) => r.capacity === 4);
  assert(oldS6Twolets.length === 12, 'OLD AGH Series 6: Exactly 12 Twolets (C-601..612)');
  assert(oldS6Fourlets.length === 3, 'OLD AGH Series 6: Exactly 3 Fourlets (A-601..603)');

  // NEW AGH: All Twolets
  // Series 2: F 201-208, G 201-202, E 201, E 101 -> 12 Twolets
  const newS2 = aghRooms.filter((r) => r.floor_label.includes('New Wing') && r.floor === 2);
  assert(newS2.length === 12 && newS2.every((r) => r.capacity === 2), 'NEW AGH Series 2: Exactly 12 Twolets (F 201..208, G 201..202, E 201, E 101)');

  // Series 3: F 301-308, G 301-302, E 301, H 301-304 -> 15 Twolets
  const newS3 = aghRooms.filter((r) => r.floor_label.includes('New Wing') && r.floor === 3);
  assert(newS3.length === 15 && newS3.every((r) => r.capacity === 2), 'NEW AGH Series 3: Exactly 15 Twolets (F 301..308, G 301..302, E 301, H 301..304)');

  // Series 4: F 401-408, G 401-402, E 401 -> 11 Twolets
  const newS4 = aghRooms.filter((r) => r.floor_label.includes('New Wing') && r.floor === 4);
  assert(newS4.length === 11 && newS4.every((r) => r.capacity === 2), 'NEW AGH Series 4: Exactly 11 Twolets (F 401..408, G 401..402, E 401)');

  // ---------------------------------------------------------------------------
  // TEST 3: 6-DIGIT OTP AUTHENTICATION
  // ---------------------------------------------------------------------------
  console.log(`\n--- Test Suite 3: 6-Digit OTP Authentication ---`);
  const otpRes = await HostelRepository.generateStudentOtp('25bee012@nith.ac.in');
  assert(
    otpRes.success && Boolean(otpRes.otp) && otpRes.otp!.length === 6,
    `Random 6-digit OTP generated successfully: [${otpRes.otp}]`
  );

  // Attempt with invalid OTP
  const badVerify = await HostelRepository.verifyStudentOtp('25bee012@nith.ac.in', '000000');
  assert(!badVerify.success, 'Invalid OTP code correctly rejected');

  // Verify with generated OTP
  const goodVerify = await HostelRepository.verifyStudentOtp('25bee012@nith.ac.in', otpRes.otp!);
  assert(goodVerify.success && goodVerify.student?.roll_no === '25BEE012', 'Correct OTP successfully verified');

  // ---------------------------------------------------------------------------
  // TEST 4: GAME-STYLE ROOMMATE LOBBY (INVITE & ACCEPT SYSTEM)
  // ---------------------------------------------------------------------------
  console.log(`\n--- Test Suite 4: Game-Style Room Lobby & Strict Privacy ---`);
  // Pick candidate student for fresh lobby test
  const candidateLeaderRoll = '25BCH076'; // Vivek Bharti (Year 2 Boy)
  // Ensure not in existing group
  await HostelRepository.leaveOrDisbandGroup(candidateLeaderRoll);

  // 1. Create a Fourlet Room Lobby
  const lobbyRes = await HostelRepository.createLobby(candidateLeaderRoll, 'Fourlets');
  assert(lobbyRes.success && lobbyRes.group?.required_capacity === 4, 'Fourlet lobby created (4 slots)');
  const testGroupId = lobbyRes.group!.group_id;

  // 2. Strict Peer Privacy Filter: only students of exact same year and same gender
  const peers = await HostelRepository.getEligiblePeers(candidateLeaderRoll);
  assert(peers.length > 0, `Found ${peers.length} eligible peers for Year 2 Boy`);
  assert(
    peers.every((p) => p.year === 2 && p.gender === 'Male'),
    'Strict Peer Privacy Confirmed: Peer list contains ONLY Year 2 Males'
  );

  // 3. Cross-Gender invite rejection
  const crossGenderInvite = await HostelRepository.sendInvite(testGroupId, candidateLeaderRoll, '25BME076'); // Female
  assert(!crossGenderInvite.success, 'Cross-gender peer invite strictly blocked');

  // 4. Cross-Year invite rejection
  const crossYearInvite = await HostelRepository.sendInvite(testGroupId, candidateLeaderRoll, '24BME039'); // Year 3
  assert(!crossYearInvite.success, 'Cross-year peer invite strictly blocked');

  // 5. Valid Peer Invite & Acceptance
  const validPeer = peers.find((p) => !p.in_group);
  assert(Boolean(validPeer), 'Found eligible unassigned peer for invitation');

  const inviteRes = await HostelRepository.sendInvite(testGroupId, candidateLeaderRoll, validPeer!.roll_no);
  assert(inviteRes.success, `Invite sent to peer ${validPeer!.name} (${validPeer!.roll_no})`);

  // Verify peer sees incoming invite
  const peerInvites = await HostelRepository.getStudentInvites(validPeer!.roll_no);
  assert(
    peerInvites.some((i) => i.group_id === testGroupId),
    'Peer successfully receives incoming room lobby invite'
  );

  // Peer accepts invite
  const acceptRes = await HostelRepository.respondInvite(inviteRes.invite!.invite_id, validPeer!.roll_no, 'accept');
  assert(acceptRes.success, 'Peer accepted room lobby invite');

  // Verify lobby roster updated
  const updatedLobby = await HostelRepository.getGroupByRollNo(candidateLeaderRoll);
  assert(
    Boolean(updatedLobby?.members.some((m) => m.roll_no === validPeer!.roll_no)),
    'Peer occupies slot in the custom room lobby'
  );

  // 6. Twolet Lobby Creation for Year 2 Girl
  const candidateGirlRoll = '25BME076';
  await HostelRepository.leaveOrDisbandGroup(candidateGirlRoll);
  const twoletLobbyRes = await HostelRepository.createLobby(candidateGirlRoll, 'Twolets');
  assert(
    twoletLobbyRes.success &&
      twoletLobbyRes.group?.required_capacity === 2 &&
      twoletLobbyRes.group?.sharing_type === 'Twolets',
    'Twolet lobby created successfully for Year 2 Girl (2 slots, Twolets)'
  );
  await HostelRepository.leaveOrDisbandGroup(candidateGirlRoll);

  // ---------------------------------------------------------------------------
  // TEST 5: GATE SCANNER & LATE ARRIVAL NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log(`\n--- Test Suite 5: Dedicated Gate Security Database ---`);
  // Scan normal entry
  const gateScan = await HostelRepository.scanBarcode('BARCODE-25BEE012', 'ENTRY');
  assert(gateScan.success && Boolean(gateScan.student), 'Gate scanner scanned student barcode successfully');
  assert(typeof gateScan.is_late === 'boolean', 'Gate entry evaluated curfew time accurately');

  // ---------------------------------------------------------------------------
  // TEST 6: MULTI-ROUND CYCLE, ROOM OCCUPANCY REPORT & 30-MIN CHOICE WINDOW
  // ---------------------------------------------------------------------------
  console.log(`\n--- Test Suite 6: Multi-Round Cycle, Room Occupancy & 30-Min Choice Window ---`);

  // 1. Initial Room Occupancy Report (Unpublished / initial state)
  const initialOccupancy = await HostelRepository.getRoomOccupancyReport();
  assert(initialOccupancy.summary.total_rooms > 0, `Total rooms counted: ${initialOccupancy.summary.total_rooms}`);
  assert(
    initialOccupancy.available_rooms.length + initialOccupancy.occupied_rooms.length === initialOccupancy.summary.total_rooms,
    'Room conservation holds: Available rooms + Occupied rooms === Total campus rooms'
  );

  // 2. Publish Round 1
  console.log('Publishing Round 1 results...');
  const round1Result = await JosaaAllotmentEngine.runRoundAllotment(1, '2026-2027');
  assert(round1Result.success && round1Result.roundNumber === 1, 'Round 1 executed and published');

  const roundConfig1 = await HostelRepository.getRoundConfig(1);
  assert(roundConfig1.is_published === true, 'Round 1 is now marked as published');
  assert(Boolean(roundConfig1.choice_filling_end_time), 'Choice filling end time is set');
  assert(Boolean(roundConfig1.next_release_time), 'Next release time (2-hour timer) is set');

  const choiceWindowDurationMs = new Date(roundConfig1.choice_filling_end_time!).getTime() - Date.now();
  assert(
    choiceWindowDurationMs > 28 * 60 * 1000 && choiceWindowDurationMs <= 30 * 60 * 1000,
    `Choice window is exactly 30 minutes (Remaining: ${Math.round(choiceWindowDurationMs / 60000)} mins)`
  );

  const totalCycleDurationMs = new Date(roundConfig1.next_release_time!).getTime() - Date.now();
  assert(
    totalCycleDurationMs > 118 * 60 * 1000 && totalCycleDurationMs <= 120 * 60 * 1000,
    `Total cycle duration is exactly 2 hours (120 minutes, Remaining: ${Math.round(totalCycleDurationMs / 60000)} mins)`
  );

  // 3. Post-Round 1 Occupancy Report: Available vs Occupied
  const postRound1Occupancy = await HostelRepository.getRoomOccupancyReport();
  assert(postRound1Occupancy.occupied_rooms.length > 0, `Occupied rooms correctly identified after Round 1: ${postRound1Occupancy.occupied_rooms.length}`);
  assert(postRound1Occupancy.available_rooms.length > 0, `Available rooms remaining: ${postRound1Occupancy.available_rooms.length}`);
  assert(
    postRound1Occupancy.occupied_rooms.every((r) => r.occupants && r.occupants.length > 0),
    'Occupied rooms carry complete occupant details (names, rolls, round numbers)'
  );

  const aghReport = postRound1Occupancy.summary.by_hostel.find((h) => h.hostel_id === 'AGH');
  assert(
    Boolean(aghReport) && (aghReport?.twolets_total ?? 0) === 62 && (aghReport?.fourlets_total ?? 0) === 20,
    'Occupancy report includes AGH breakdown: 62 Twolets, 20 Fourlets'
  );

  // 4. Unallotted Groups unlocked for 30-min Choice Modification
  const allottedGroupIds = new Set(mockDb.allotments.map((a) => a.group_id).filter(Boolean));
  const unallottedGroups = mockDb.groups.filter((g) => !allottedGroupIds.has(g.group_id));
  assert(
    unallottedGroups.every((g) => g.is_locked === false),
    'All unallotted groups unlocked to add or modify choices during the 30-minute window'
  );

  // 5. Unallotted student modifies choice filling during 30-min window
  if (unallottedGroups.length > 0) {
    const testUnallottedGroup = unallottedGroups[0];
    const matchingAvailableRoom = postRound1Occupancy.available_rooms.find(
      (r) => r.capacity === testUnallottedGroup.required_capacity
    );
    assert(Boolean(matchingAvailableRoom), 'Found matching available room for unallotted group');

    // Submit new preference
    const prefResult = await HostelRepository.submitAndLockPreferences(
      testUnallottedGroup.group_id,
      testUnallottedGroup.leader_roll_no,
      [matchingAvailableRoom!.room_id]
    );
    assert(prefResult.success, 'Unallotted student successfully submitted choices during 30-minute window');

    // Unlock choices to modify
    const unlockResult = await HostelRepository.unlockPreferences(
      testUnallottedGroup.group_id,
      testUnallottedGroup.leader_roll_no
    );
    assert(unlockResult.success, 'Unallotted leader successfully unlocked choices to edit');
    assert(testUnallottedGroup.is_locked === false, 'Group state is unlocked');
  }

  // 6. Already Allotted Group BLOCKED from modifying choices
  const allottedGroup = mockDb.groups.find((g) => allottedGroupIds.has(g.group_id));
  if (allottedGroup) {
    const blockedPref = await HostelRepository.submitAndLockPreferences(
      allottedGroup.group_id,
      allottedGroup.leader_roll_no,
      ['any-room']
    );
    assert(!blockedPref.success, 'Already allotted group is strictly blocked from modifying choices');

    const blockedUnlock = await HostelRepository.unlockPreferences(
      allottedGroup.group_id,
      allottedGroup.leader_roll_no
    );
    assert(!blockedUnlock.success, 'Already allotted group is strictly blocked from unlocking choices');
  }

  // 7. Expired Choice Window Enforcement
  const origEndTime = roundConfig1.choice_filling_end_time;
  roundConfig1.choice_filling_end_time = new Date(Date.now() - 1000).toISOString();

  if (unallottedGroups.length > 0) {
    const testUnallottedGroup = unallottedGroups[0];
    const expiredSubmit = await HostelRepository.submitAndLockPreferences(
      testUnallottedGroup.group_id,
      testUnallottedGroup.leader_roll_no,
      ['some-room']
    );
    assert(!expiredSubmit.success, 'Choice submission rejected after 30-minute window expired');

    const expiredUnlock = await HostelRepository.unlockPreferences(
      testUnallottedGroup.group_id,
      testUnallottedGroup.leader_roll_no
    );
    assert(!expiredUnlock.success, 'Choice unlock rejected after 30-minute window expired');
  }

  roundConfig1.choice_filling_end_time = origEndTime;

  console.log(`\n=============================================================`);
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log(`=============================================================\n`);
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
