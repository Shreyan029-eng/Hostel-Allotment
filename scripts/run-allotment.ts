/**
 * Offline Batch-Processing Script for JOSAA-Style Hostel Allotment
 * Run via CLI: npx tsx scripts/run-allotment.ts [round_number] [academic_year]
 */

import { JosaaAllotmentEngine } from '../src/lib/engine/allotment-engine';
import { mockDb } from '../src/lib/db/mock-store';

async function main() {
  const roundArg = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
  const yearArg = process.argv[3] || '2026-2027';

  console.log(`\n=============================================================`);
  console.log(`🏛️  JOSAA-STYLE HOSTEL ALLOTMENT BATCH ENGINE (CLI)`);
  console.log(`=============================================================`);
  console.log(`Target Round    : ${roundArg}`);
  console.log(`Academic Year   : ${yearArg}`);
  console.log(`Timestamp       : ${new Date().toISOString()}`);
  console.log(`Total Locked Grps: ${mockDb.groups.filter((g) => g.is_locked).length}`);
  console.log(`-------------------------------------------------------------\n`);

  const startTime = Date.now();
  const result = await JosaaAllotmentEngine.runBatchAllotment(roundArg, yearArg);
  const durationMs = Date.now() - startTime;

  console.log(`\n📊 ALLOTMENT RESULTS SUMMARY:`);
  console.log(`- Groups Considered : ${result.totalGroupsConsidered}`);
  console.log(`- Groups Allotted   : ${result.totalAllottedGroups} ✅`);
  console.log(`- Groups Unallotted : ${result.totalUnallottedGroups} ⚠️`);
  console.log(`- Students Placed   : ${result.totalStudentsPlaced} 🎓`);
  console.log(`- Execution Time    : ${durationMs}ms`);
  console.log(`-------------------------------------------------------------`);

  console.log(`\n📋 AUDIT TRAIL LOG:`);
  result.auditTrail.forEach((log) => {
    const tieTag = log.tieBreakerApplied ? ' [TIE-BREAKER: TIMESTAMP]' : '';
    console.log(
      `Rank #${log.rank} | Code: ${log.groupCode} | Max CGPA: ${log.maxCgpa}${tieTag} | Status: ${log.status} | Details: ${log.notes}`
    );
  });

  console.log(`\n🔒 Status: Results are currently HIDDEN from students.`);
  console.log(`ℹ️  Admin must execute 'Publish Round ${roundArg}' from dashboard to reveal results to students.`);
  console.log(`=============================================================\n`);
}

main().catch((err) => {
  console.error('Fatal allotment engine error:', err);
  process.exit(1);
});
