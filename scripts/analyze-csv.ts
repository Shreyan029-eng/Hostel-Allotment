import fs from 'fs';
import readline from 'readline';

export interface ProcessedStudent {
  roll_no: string;
  name: string;
  father_name: string;
  email: string;
  gender: 'Male' | 'Female';
  year: 2 | 3 | 4;
  cgpa: number;
  phone: string;
  guardian_contact: string;
  barcode_id: string;
  is_active: boolean;
}

const femaleSuffixes = ['A', 'I', 'EE', 'YA', 'IKA', 'ITA', 'TI', 'RI', 'NA', 'MA', 'LA'];
const femaleNames = new Set([
  'KUMARI', 'DEVI', 'KAUR', 'PRIYA', 'PRIYANKA', 'ANANYA', 'SHREYA', 'SHRIYA',
  'POOJA', 'NITIKA', 'RITU', 'ANJALI', 'NEHA', 'DIKSHA', 'ISHITA', 'ISHA',
  'TANVI', 'SIMRAN', 'DIVYA', 'MUSKAN', 'RASHMI', 'SHIVANI', 'SWATI', 'MEGHA',
  'AASTHA', 'AKANSHA', 'AKANKSHA', 'GARIMA', 'KIRAN', 'MANSI', 'PAYAL', 'KOMAL',
  'PALAK', 'RADHIKA', 'SNEHA', 'SONALI', 'VRINDA', 'TAMANNA', 'SHIKHA', 'NANDINI',
  'VAISHNAVI', 'PRERNA', 'SAKSHI', 'PARUL', 'SHIVANGI', 'KANIKA', 'ADITI', 'KRITI',
  'SHEETAL', 'PREETI', 'PRITI', 'AAYUSHI', 'AYUSHI', 'RASHMIKA', 'SHALINI', 'JYOTI'
]);

const maleNames = new Set([
  'KUMAR', 'SINGH', 'RAM', 'LAL', 'CHAND', 'SHARMA', 'VERMA', 'GUPTA', 'PATEL',
  'MOHIT', 'HARIOM', 'SURAJ', 'AYUSH', 'HARSHIT', 'KANISHK', 'ANIRUDH', 'PIYUSH',
  'AMIT', 'ABHISHEK', 'RAHUL', 'ROHIT', 'ANKIT', 'SACHIN', 'AMAN', 'VIKAS',
  'VIVEK', 'ASHISH', 'DEEPAK', 'MANISH', 'GAURAV', 'PANKAJ', 'PRASHANT', 'SANDEEP',
  'SUMIT', 'RAJESH', 'DINESH', 'NAVEEN', 'SUNIL', 'ANIL', 'SANJAY', 'VIJAY'
]);

export async function parseActiveNithStudents(): Promise<ProcessedStudent[]> {
  const fileStream = fs.createReadStream('results_rows.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  const studentsMap = new Map<string, ProcessedStudent>();

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue;

    const lastCommaIndex = line.lastIndexOf(',');
    if (lastCommaIndex === -1) continue;
    const cgStr = line.substring(lastCommaIndex + 1).trim();
    let cg = parseFloat(cgStr);
    if (isNaN(cg) || cg < 0) cg = 7.0;
    if (cg > 10) cg = 10.0;

    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    const thirdComma = line.indexOf(',', secondComma + 1);
    const fourthComma = line.indexOf(',', thirdComma + 1);

    if (firstComma === -1 || secondComma === -1 || thirdComma === -1) continue;

    const rawRoll = line.substring(firstComma + 1, secondComma).trim().toLowerCase();
    
    // Batches from 2023 onwards: 2023, 2024, 2025
    if (!rawRoll.startsWith('23') && !rawRoll.startsWith('24') && !rawRoll.startsWith('25')) {
      continue;
    }

    const roll_no = rawRoll.toUpperCase();
    const rawStudentName = line.substring(secondComma + 1, thirdComma).trim().replace(/^"|"$/g, '');
    const rawFatherName = fourthComma !== -1
      ? line.substring(thirdComma + 1, fourthComma).trim().replace(/^"|"$/g, '')
      : '';

    // Academic Year Mapping in 2026-2027:
    // Batch 2025 -> Year 2
    // Batch 2024 -> Year 3
    // Batch 2023 -> Year 4
    let year: 2 | 3 | 4 = 3;
    if (rawRoll.startsWith('25')) {
      year = 2;
    } else if (rawRoll.startsWith('24')) {
      year = 3;
    } else if (rawRoll.startsWith('23')) {
      year = 4;
    }

    // Determine gender
    const upperName = rawStudentName.toUpperCase();
    const words = upperName.split(/\s+/);
    const firstName = words[0] || '';

    let gender: 'Male' | 'Female' = 'Male';

    if (words.some((w) => femaleNames.has(w))) {
      gender = 'Female';
    } else if (words.some((w) => maleNames.has(w))) {
      gender = 'Male';
    } else if (
      femaleSuffixes.some((sfx) => firstName.endsWith(sfx)) &&
      !['KRISHNA', 'SHIVA', 'SURYA', 'ADITYA', 'ARYA'].includes(firstName)
    ) {
      gender = 'Female';
    }

    const email = `${rawRoll}@nith.ac.in`;
    const barcode_id = `BARCODE-${roll_no}`;
    
    const phone = '';
    const guardian_contact = rawFatherName;

    studentsMap.set(roll_no, {
      roll_no,
      name: rawStudentName,
      father_name: rawFatherName,
      email,
      gender,
      year,
      cgpa: Number(cg.toFixed(2)),
      phone,
      guardian_contact,
      barcode_id,
      is_active: true,
    });
  }

  const result = Array.from(studentsMap.values());
  const year2Count = result.filter((s) => s.year === 2).length;
  const year3Count = result.filter((s) => s.year === 3).length;
  const year4Count = result.filter((s) => s.year === 4).length;
  const females = result.filter((s) => s.gender === 'Female').length;
  const males = result.filter((s) => s.gender === 'Male').length;

  console.log(`Parsed total ${result.length} active students across 2023, 2024, and 2025 batches.`);
  console.log(`Breakdown by Year: Year 2 (2025): ${year2Count}, Year 3 (2024): ${year3Count}, Year 4 (2023): ${year4Count}`);
  console.log(`Breakdown by Gender: ${males} Males, ${females} Females.`);
  return result;
}

if (process.argv[1]?.includes('analyze-csv')) {
  parseActiveNithStudents().then((res) => {
    console.log('Sample parsed students:', res.slice(0, 3));
  });
}
