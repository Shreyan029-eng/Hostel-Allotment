import fs from 'fs';

export interface RoomDefinition {
  room_id: string;
  hostel_id: string;
  room_number: string;
  floor: number;
  floor_label: string;
  capacity: number; // 3 for Triplets, 4 for Fourlets
  sharing_type: 'Triplets' | 'Fourlets';
  status: 'free' | 'locked';
}

export function generateAllHostelRooms(): RoomDefinition[] {
  const rooms: RoomDefinition[] = [];

  // ===========================================================================
  // 1. HIMADRI BOYS HOSTEL (2nd Year Boys - Exact Specification from Document)
  // ===========================================================================
  const hostelId = 'HBH';

  // Level G1 (Floor 0)
  // Fourlets: G-101, G-102, G-107, G-108, G-109, G-110
  const g1Fourlets = ['G-101', 'G-102', 'G-107', 'G-108', 'G-109', 'G-110'];
  g1Fourlets.forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 0,
      floor_label: 'Level G1',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  });

  // Triplets: G-133 - G-138
  for (let num = 133; num <= 138; num++) {
    const rm = `G-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 0,
      floor_label: 'Level G1',
      capacity: 3,
      sharing_type: 'Triplets',
      status: 'free',
    });
  }

  // Level 1 (Floor 1)
  // Fourlets: 101, 102, 107 - 116
  const l1Fourlets = ['101', '102', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116'];
  l1Fourlets.forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 1,
      floor_label: 'Level 1',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  });

  // Triplets: 118, 119, 124, 125, 127 - 140
  const l1Triplets = ['118', '119', '124', '125'];
  for (let num = 127; num <= 140; num++) {
    l1Triplets.push(String(num));
  }
  l1Triplets.forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 1,
      floor_label: 'Level 1',
      capacity: 3,
      sharing_type: 'Triplets',
      status: 'free',
    });
  });

  // Level 2 (Floor 2)
  // Fourlets: 201 - 219, 224 & 225
  const l2Fourlets: string[] = [];
  for (let num = 201; num <= 219; num++) l2Fourlets.push(String(num));
  l2Fourlets.push('224', '225');
  l2Fourlets.forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 2,
      floor_label: 'Level 2',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  });

  // Triplets: 226 - 240
  for (let num = 226; num <= 240; num++) {
    const rm = String(num);
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 2,
      floor_label: 'Level 2',
      capacity: 3,
      sharing_type: 'Triplets',
      status: 'free',
    });
  }

  // Level 3 (Floor 3)
  // Fourlets: 301 - 325
  for (let num = 301; num <= 325; num++) {
    const rm = String(num);
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Level 3',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  }

  // Triplets: 326 - 340
  for (let num = 326; num <= 340; num++) {
    const rm = String(num);
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Level 3',
      capacity: 3,
      sharing_type: 'Triplets',
      status: 'free',
    });
  }

  // Level 4 (Floor 4)
  // Fourlets: 401 - 425, 439
  const l4Fourlets: string[] = [];
  for (let num = 401; num <= 425; num++) l4Fourlets.push(String(num));
  l4Fourlets.push('439');
  l4Fourlets.forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 4,
      floor_label: 'Level 4',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  });

  // Triplets: 426 - 438, 440
  const l4Triplets: string[] = [];
  for (let num = 426; num <= 438; num++) l4Triplets.push(String(num));
  l4Triplets.push('440');
  l4Triplets.forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 4,
      floor_label: 'Level 4',
      capacity: 3,
      sharing_type: 'Triplets',
      status: 'free',
    });
  });

  // Level 5 (Floor 5)
  // Fourlets: 501 - 525, 539 & 540
  const l5Fourlets: string[] = [];
  for (let num = 501; num <= 525; num++) l5Fourlets.push(String(num));
  l5Fourlets.push('539', '540');
  l5Fourlets.forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 5,
      floor_label: 'Level 5',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  });

  // Triplets: 526 - 538
  for (let num = 526; num <= 538; num++) {
    const rm = String(num);
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 5,
      floor_label: 'Level 5',
      capacity: 3,
      sharing_type: 'Triplets',
      status: 'free',
    });
  }

  // ===========================================================================
  // 2. OTHER HOSTELS (AGH, DBH, NBH, PGH, SGH, HGBH, VBH, UBH, MMGH)
  // ===========================================================================
  const otherHostels = [
    { id: 'AGH', floors: 4, fourletsPerFloor: 10, tripletsPerFloor: 10 },
    { id: 'DBH', floors: 4, fourletsPerFloor: 12, tripletsPerFloor: 8 },
    { id: 'NBH', floors: 4, fourletsPerFloor: 10, tripletsPerFloor: 10 },
    { id: 'PGH', floors: 4, fourletsPerFloor: 8, tripletsPerFloor: 12 },
    { id: 'SGH', floors: 4, fourletsPerFloor: 10, tripletsPerFloor: 8 },
    { id: 'HGBH', floors: 4, fourletsPerFloor: 10, tripletsPerFloor: 10 },
    { id: 'VBH', floors: 4, fourletsPerFloor: 10, tripletsPerFloor: 10 },
    { id: 'UBH', floors: 4, fourletsPerFloor: 10, tripletsPerFloor: 10 },
    { id: 'MMGH', floors: 4, fourletsPerFloor: 8, tripletsPerFloor: 10 },
  ];

  otherHostels.forEach((h) => {
    for (let f = 1; f <= h.floors; f++) {
      const floorLabel = `Floor ${f}`;
      // Fourlets
      for (let i = 1; i <= h.fourletsPerFloor; i++) {
        const rm = `${f}${String(i).padStart(2, '0')}`;
        rooms.push({
          room_id: `${h.id}-${rm}`,
          hostel_id: h.id,
          room_number: rm,
          floor: f,
          floor_label: floorLabel,
          capacity: 4,
          sharing_type: 'Fourlets',
          status: 'free',
        });
      }
      // Triplets
      for (let i = 1; i <= h.tripletsPerFloor; i++) {
        const rm = `${f}${String(50 + i).padStart(2, '0')}`;
        rooms.push({
          room_id: `${h.id}-${rm}`,
          hostel_id: h.id,
          room_number: rm,
          floor: f,
          floor_label: floorLabel,
          capacity: 3,
          sharing_type: 'Triplets',
          status: 'free',
        });
      }
    }
  });

  return rooms;
}

if (process.argv[1]?.includes('generate-himadri-rooms')) {
  const allRooms = generateAllHostelRooms();
  fs.writeFileSync('src/lib/db/nith-rooms.json', JSON.stringify(allRooms, null, 2), 'utf-8');
  const hbhRooms = allRooms.filter((r) => r.hostel_id === 'HBH');
  console.log(`Generated ${allRooms.length} total rooms.`);
  console.log(`Himadri Boys Hostel (HBH): ${hbhRooms.length} rooms generated.`);
  console.log(`- Fourlets in HBH: ${hbhRooms.filter((r) => r.sharing_type === 'Fourlets').length}`);
  console.log(`- Triplets in HBH: ${hbhRooms.filter((r) => r.sharing_type === 'Triplets').length}`);
}
