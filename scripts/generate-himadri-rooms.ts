import fs from 'fs';

export interface RoomDefinition {
  room_id: string;
  hostel_id: string;
  room_number: string;
  floor: number;
  floor_label: string;
  capacity: number; // 2 for Twolets, 3 for Triplets, 4 for Fourlets
  sharing_type: 'Twolets' | 'Triplets' | 'Fourlets';
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
  // 2. AMBIKA GIRLS HOSTEL (AGH - Exact Specification from Document)
  // ===========================================================================
  rooms.push(...generateAmbikaRooms());

  // ===========================================================================
  // 3. OTHER HOSTELS (DBH, NBH, PGH, SGH, HGBH, VBH, UBH, MMGH)
  // ===========================================================================
  const otherHostels = [
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

export function generateAmbikaRooms(): RoomDefinition[] {
  const rooms: RoomDefinition[] = [];
  const hostelId = 'AGH';

  // ---------------------------------------------------------------------------
  // OLD AGH
  // ---------------------------------------------------------------------------

  // Series 3: (Fourlets)
  // Block A: A-301 - A-303
  for (let num = 301; num <= 303; num++) {
    const rm = `A-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Series 3 (Old Wing)',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  }
  // Block B: B-301 - B-303
  for (let num = 301; num <= 303; num++) {
    const rm = `B-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Series 3 (Old Wing)',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  }
  // Block C: C-301 - C-304
  for (let num = 301; num <= 304; num++) {
    const rm = `C-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Series 3 (Old Wing)',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  }

  // Series 4: (Fourlets)
  // Block B: B-401 - B-403
  for (let num = 401; num <= 403; num++) {
    const rm = `B-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 4,
      floor_label: 'Series 4 (Old Wing)',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  }
  // Block A: A-401 - A-404
  for (let num = 401; num <= 404; num++) {
    const rm = `A-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 4,
      floor_label: 'Series 4 (Old Wing)',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  }

  // Series 5: (Twolets)
  // Block C: C-501 - C-512
  for (let num = 501; num <= 512; num++) {
    const rm = `C-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 5,
      floor_label: 'Series 5 (Old Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  }

  // Series 6:
  // Block C: (Twolets): C-601 - C-612
  for (let num = 601; num <= 612; num++) {
    const rm = `C-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 6,
      floor_label: 'Series 6 (Old Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  }
  // Block A: (Fourlets): A-601 - A-603
  for (let num = 601; num <= 603; num++) {
    const rm = `A-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 6,
      floor_label: 'Series 6 (Old Wing)',
      capacity: 4,
      sharing_type: 'Fourlets',
      status: 'free',
    });
  }

  // ---------------------------------------------------------------------------
  // NEW AGH: (All Twolets)
  // ---------------------------------------------------------------------------

  // Series 2:
  // Block F: F-201 - F-208
  for (let num = 201; num <= 208; num++) {
    const rm = `F-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 2,
      floor_label: 'Series 2 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  }
  // Block G: G-201, G-202
  ['G-201', 'G-202'].forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 2,
      floor_label: 'Series 2 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  });
  // Block E: E-201, E-101
  ['E-201', 'E-101'].forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 2,
      floor_label: 'Series 2 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  });

  // Series 3:
  // Block F: F-301 - F-308
  for (let num = 301; num <= 308; num++) {
    const rm = `F-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Series 3 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  }
  // Block G: G-301, G-302
  ['G-301', 'G-302'].forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Series 3 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  });
  // Block E: E-301
  rooms.push({
    room_id: `${hostelId}-E-301`,
    hostel_id: hostelId,
    room_number: 'E-301',
    floor: 3,
    floor_label: 'Series 3 (New Wing)',
    capacity: 2,
    sharing_type: 'Twolets',
    status: 'free',
  });
  // Block H: H-301 - H-304
  for (let num = 301; num <= 304; num++) {
    const rm = `H-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 3,
      floor_label: 'Series 3 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  }

  // Series 4:
  // Block F: F-401 - F-408
  for (let num = 401; num <= 408; num++) {
    const rm = `F-${num}`;
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 4,
      floor_label: 'Series 4 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  }
  // Block G: G-401, G-402
  ['G-401', 'G-402'].forEach((rm) => {
    rooms.push({
      room_id: `${hostelId}-${rm}`,
      hostel_id: hostelId,
      room_number: rm,
      floor: 4,
      floor_label: 'Series 4 (New Wing)',
      capacity: 2,
      sharing_type: 'Twolets',
      status: 'free',
    });
  });
  // Block E: E-401
  rooms.push({
    room_id: `${hostelId}-E-401`,
    hostel_id: hostelId,
    room_number: 'E-401',
    floor: 4,
    floor_label: 'Series 4 (New Wing)',
    capacity: 2,
    sharing_type: 'Twolets',
    status: 'free',
  });

  return rooms;
}

if (process.argv[1]?.includes('generate-himadri-rooms')) {
  const allRooms = generateAllHostelRooms();
  fs.writeFileSync('src/lib/db/nith-rooms.json', JSON.stringify(allRooms, null, 2), 'utf-8');
  const hbhRooms = allRooms.filter((r) => r.hostel_id === 'HBH');
  const aghRooms = allRooms.filter((r) => r.hostel_id === 'AGH');
  console.log(`Generated ${allRooms.length} total rooms.`);
  console.log(`Himadri Boys Hostel (HBH): ${hbhRooms.length} rooms generated.`);
  console.log(`- Fourlets in HBH: ${hbhRooms.filter((r) => r.sharing_type === 'Fourlets').length}`);
  console.log(`- Triplets in HBH: ${hbhRooms.filter((r) => r.sharing_type === 'Triplets').length}`);
  console.log(`Ambika Girls Hostel (AGH): ${aghRooms.length} rooms generated.`);
  console.log(`- Fourlets in AGH: ${aghRooms.filter((r) => r.sharing_type === 'Fourlets').length}`);
  console.log(`- Twolets in AGH: ${aghRooms.filter((r) => r.sharing_type === 'Twolets').length}`);
}
