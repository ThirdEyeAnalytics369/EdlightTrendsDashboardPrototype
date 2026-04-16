/**
 * EdLight Trends Dashboard — Multi-School Simulated Data Generator
 *
 * Generates ~48,000-52,000 rows across 4 schools matching EdLight's KIPP export format.
 * Each row = one student x one standard x one assignment.
 *
 * Run:  node src/data/generateMultiSchoolData.js
 *
 * Timeline: Sep 2 2025 -> Mar 20 2026 (28 weeks, full first semester + second semester start)
 * Standards are taught in two passes (spiraling curriculum).
 *
 * Schools and their patterns:
 *   1. Westfield Elementary (seed=42) — IDENTICAL to original generateData.js output
 *   2. Lincoln Heights Elementary (seed=1000) — HIGH performing, stable
 *   3. Riverside Academy (seed=2000) — STRUGGLING, declining, many flagged teachers
 *   4. Oak Park Elementary (seed=3000) — HIDDEN VARIATION, moderate averages but extreme teacher variance
 *
 * Outputs (all written to src/data/):
 *   - data_westfield.json
 *   - data_lincoln.json
 *   - data_riverside.json
 *   - data_oakpark.json
 *   - priorYear.json
 *   - districtSummary.json
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Deterministic PRNG (mulberry32) ──────────────────────────────────────────
let _seed = 42;
function seedRandom(s) { _seed = s; }
function random() {
  let t = (_seed += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(random() * arr.length)];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DISTRICT_NAME = 'Westfield Unified School District';

// Domain full names
const DOMAIN_NAMES = {
  'OA': 'Operations and Algebraic Thinking',
  'NBT': 'Number and Operations in Base Ten',
  'NF': 'Number and Operations—Fractions',
  'MD': 'Measurement and Data',
  'G': 'Geometry',
};

const STANDARDS = {
  3: [
    { code: '3.OA.A.1', desc: 'Interpret products of whole numbers', domain: 'OA' },
    { code: '3.OA.A.3', desc: 'Use multiplication and division to solve word problems', domain: 'OA' },
    { code: '3.OA.B.5', desc: 'Apply properties of operations', domain: 'OA' },
    { code: '3.NBT.A.2', desc: 'Fluently add and subtract within 1000', domain: 'NBT' },
    { code: '3.NF.A.1', desc: 'Understand a fraction as a quantity', domain: 'NF' },
    { code: '3.NF.A.3', desc: 'Explain equivalence of fractions', domain: 'NF' },
    { code: '3.MD.B.3', desc: 'Draw scaled picture and bar graphs', domain: 'MD' },
    { code: '3.MD.C.7', desc: 'Relate area to multiplication', domain: 'MD' },
  ],
  4: [
    { code: '4.OA.A.1', desc: 'Interpret a multiplication equation as a comparison', domain: 'OA' },
    { code: '4.OA.A.3', desc: 'Solve multistep word problems', domain: 'OA' },
    { code: '4.NBT.A.2', desc: 'Read and write multi-digit whole numbers', domain: 'NBT' },
    { code: '4.NBT.B.5', desc: 'Multiply a whole number up to four digits', domain: 'NBT' },
    { code: '4.NF.A.1', desc: 'Explain why a fraction is equivalent', domain: 'NF' },
    { code: '4.NF.B.3', desc: 'Understand a fraction as a sum of fractions', domain: 'NF' },
    { code: '4.MD.A.1', desc: 'Know relative sizes of measurement units', domain: 'MD' },
    { code: '4.G.A.1', desc: 'Draw points, lines, line segments, rays, angles', domain: 'G' },
  ],
  5: [
    { code: '5.OA.A.1', desc: 'Use parentheses, brackets in numerical expressions', domain: 'OA' },
    { code: '5.OA.A.2', desc: 'Write simple expressions', domain: 'OA' },
    { code: '5.NBT.A.1', desc: 'Recognize place value system', domain: 'NBT' },
    { code: '5.NBT.B.5', desc: 'Fluently multiply multi-digit whole numbers', domain: 'NBT' },
    { code: '5.NF.A.1', desc: 'Add and subtract fractions with unlike denominators', domain: 'NF' },
    { code: '5.NF.B.4', desc: 'Apply and extend understanding of multiplication to fractions', domain: 'NF' },
    { code: '5.MD.C.3', desc: 'Recognize volume as an attribute', domain: 'MD' },
    { code: '5.G.A.1', desc: 'Use a pair of perpendicular number lines (coordinate plane)', domain: 'G' },
  ],
};

// Misconception types — EdLight's fixed taxonomy
const MISCONCEPTION_TYPES = [
  'Computation Error (e.g., mental math errors)',
  'Conceptual Misunderstanding',
  'Did Not Follow Directions',
  'Incomplete (Didn\'t finish / didn\'t answer the question)',
  'Precision Error (e.g., notation, labeling, decimal)',
  'Representational Error (e.g., graphing, diagramming)',
  'Insufficient Explanation',
  'Unable to Diagnose',
];

// Standard misconception weights by domain
function getMisconceptionWeights(domain, code) {
  if (domain === 'OA' && (code.includes('.A.1') || code.includes('.A.2')) && code.startsWith('5.')) {
    return [0.30, 0.10, 0.05, 0.20, 0.35, 0.00, 0.00, 0.00];
  }
  if (domain === 'NBT') {
    return [0.65, 0.18, 0.03, 0.04, 0.05, 0.01, 0.02, 0.02];
  }
  if (domain === 'NF' || domain === 'OA') {
    return [0.20, 0.55, 0.05, 0.05, 0.05, 0.02, 0.05, 0.03];
  }
  if (domain === 'MD' || domain === 'G') {
    return [0.08, 0.25, 0.04, 0.05, 0.05, 0.45, 0.05, 0.03];
  }
  return [0.25, 0.25, 0.10, 0.10, 0.10, 0.05, 0.10, 0.05];
}

// Concentrated misconception weights for Riverside (70%+ single type)
function getConcentratedMisconceptionWeights(domain, code) {
  if (domain === 'NBT') {
    return [0.78, 0.08, 0.02, 0.03, 0.04, 0.01, 0.02, 0.02];
  }
  if (domain === 'NF' || domain === 'OA') {
    return [0.10, 0.72, 0.03, 0.03, 0.04, 0.02, 0.03, 0.03];
  }
  if (domain === 'MD' || domain === 'G') {
    return [0.04, 0.10, 0.02, 0.03, 0.03, 0.72, 0.03, 0.03];
  }
  return [0.25, 0.25, 0.10, 0.10, 0.10, 0.05, 0.10, 0.05];
}

function pickMisconception(domain, code, concentrated = false) {
  const weights = concentrated
    ? getConcentratedMisconceptionWeights(domain, code)
    : getMisconceptionWeights(domain, code);
  const r = random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return MISCONCEPTION_TYPES[i];
  }
  return MISCONCEPTION_TYPES[MISCONCEPTION_TYPES.length - 1];
}

function pickMisconceptions(domain, code, concentrated = false) {
  const r = random();
  const count = r < 0.65 ? 1 : r < 0.95 ? 2 : 3;
  const types = new Set();
  for (let i = 0; i < count; i++) {
    types.add(pickMisconception(domain, code, concentrated));
  }
  return Array.from(types).join(', ');
}

// ── Student name generation ─────────────────────────────────────────────────

const FIRST_NAMES = [
  'Marcus', 'Aaliyah', 'Jayden', 'Sofia', 'Ethan', 'Zara', 'Noah', 'Amara',
  'Liam', 'Maya', 'Aiden', 'Camila', 'Jackson', 'Nia', 'Lucas', 'Priya',
  'Mason', 'Isabelle', 'Logan', 'Fatima', 'Elijah', 'Valentina', 'Oliver',
  'Jasmine', 'Mateo', 'Layla', 'Daniel', 'Autumn', 'Sebastian', 'Chloe',
  'Henry', 'Destiny', 'Alexander', 'Brooklyn', 'Benjamin', 'Savannah',
  'James', 'Gabriella', 'David', 'Riley', 'Joseph', 'Mia', 'Samuel',
  'Naomi', 'Christopher', 'Kayla', 'Andrew', 'Trinity', 'Nathan', 'Ariana',
  'Ryan', 'Skylar', 'Dylan', 'Jade', 'Isaiah', 'Kiara', 'Aaron', 'Leah',
  'Joshua', 'Ana', 'Caleb', 'Brianna', 'Owen', 'Kennedy', 'Brandon', 'Nyla',
  'Jordan', 'Aliyah', 'Tyler', 'Mariana', 'Gabriel', 'Serenity', 'Christian',
  'Zoey', 'Anthony', 'Nevaeh', 'Kevin', 'Lillian', 'Luis', 'Hazel',
  'Xavier', 'Mila', 'Adrian', 'Elena', 'Carlos', 'Iris', 'Miguel', 'Stella',
  'Rafael', 'Clara', 'Dominic', 'Penelope', 'Andre', 'Lydia',
];

const LAST_NAMES = [
  'Williams', 'Johnson', 'Brown', 'Garcia', 'Martinez', 'Davis', 'Rodriguez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris',
  'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan',
  'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos',
  'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez',
  'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long',
  'Ross', 'Foster', 'Jimenez', 'Powell',
];

function generateStudentNames(count) {
  const names = new Set();
  while (names.size < count) {
    names.add(`${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`);
  }
  return Array.from(names);
}

// ── Week dates ──────────────────────────────────────────────────────────────

// Westfield original: 24 weeks starting Sep 8, 2025
// Multi-school: 28 weeks starting Sep 2, 2025 (Tue Sep 2 is a Monday week start)
function generateWeeks(numWeeks, startDate) {
  const weeks = [];
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().slice(0, 10);
    weeks.push(iso);
  }
  return weeks;
}

// Original 24 weeks for Westfield backward compat
const WEEKS_24 = generateWeeks(24, new Date(2025, 8, 8)); // Sep 8

// Extended 28 weeks for new schools
const WEEKS_28 = generateWeeks(28, new Date(2025, 8, 2)); // Sep 2 (Tuesday)

// ── Standard teaching schedule ──────────────────────────────────────────────

// 24-week schedule (original Westfield)
function getStandardSchedule24() {
  return [
    // Pass 1: Initial instruction
    { stdIdx: 0, weeks: [0, 1] },
    { stdIdx: 1, weeks: [1, 2] },
    { stdIdx: 2, weeks: [3, 4] },
    { stdIdx: 3, weeks: [4, 5] },
    { stdIdx: 4, weeks: [6, 7] },
    { stdIdx: 5, weeks: [7, 8] },
    { stdIdx: 6, weeks: [9, 10] },
    { stdIdx: 7, weeks: [10, 11] },
    // Pass 2: Spiral review
    { stdIdx: 0, weeks: [12, 13] },
    { stdIdx: 1, weeks: [13, 14] },
    { stdIdx: 2, weeks: [14, 15] },
    { stdIdx: 3, weeks: [15, 16] },
    { stdIdx: 4, weeks: [17, 18] },
    { stdIdx: 5, weeks: [18, 19] },
    { stdIdx: 6, weeks: [20, 21] },
    { stdIdx: 7, weeks: [22, 23] },
  ];
}

// 28-week schedule for new schools (extended)
function getStandardSchedule28() {
  return [
    // Pass 1: Initial instruction (weeks 0-13)
    { stdIdx: 0, weeks: [0, 1] },
    { stdIdx: 1, weeks: [2, 3] },
    { stdIdx: 2, weeks: [4, 5] },
    { stdIdx: 3, weeks: [5, 6] },
    { stdIdx: 4, weeks: [7, 8] },
    { stdIdx: 5, weeks: [9, 10] },
    { stdIdx: 6, weeks: [11, 12] },
    { stdIdx: 7, weeks: [12, 13] },
    // Pass 2: Spiral review (weeks 14-27)
    { stdIdx: 0, weeks: [14, 15] },
    { stdIdx: 1, weeks: [15, 16] },
    { stdIdx: 2, weeks: [17, 18] },
    { stdIdx: 3, weeks: [18, 19] },
    { stdIdx: 4, weeks: [20, 21] },
    { stdIdx: 5, weeks: [21, 22] },
    { stdIdx: 6, weeks: [23, 24] },
    { stdIdx: 7, weeks: [25, 27] },
  ];
}

// ── Mastery classification ──────────────────────────────────────────────────

function classifyStudent(celebrateRate, naRate) {
  const r = random();
  if (r < naRate) {
    return { mastery: '4. N/A', sortOrder: 4, overall: null };
  }
  const effectiveR = (r - naRate) / (1 - naRate);
  if (effectiveR < celebrateRate) {
    return { mastery: '1. Celebrate', sortOrder: 1, overall: 0 };
  }
  const supportRate = 0.45 + random() * 0.1;
  const remainingR = (effectiveR - celebrateRate) / (1 - celebrateRate);
  if (remainingR < supportRate) {
    return { mastery: '2. Support', sortOrder: 2, overall: randomInt(1, 2) };
  }
  return { mastery: '3. Intervene', sortOrder: 3, overall: randomInt(3, 4) };
}

// ── Assignment date within a week ───────────────────────────────────────────

function getAssignmentDate(weekDate, lessonInWeek, capDate) {
  const d = new Date(weekDate);
  const dayOffset = lessonInWeek === 0 ? 0 : lessonInWeek === 1 ? 2 : 4;
  d.setDate(d.getDate() + dayOffset);
  const cap = new Date(capDate);
  if (d > cap) return cap.toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════════════
// SCHOOL DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

const SCHOOL_CONFIGS = [
  // ─── School 1: Westfield Elementary ──────────────────────────────────────
  {
    name: 'Westfield Elementary School',
    slug: 'westfield-elementary',
    org: DISTRICT_NAME,
    seed: 42,
    useOriginalSchedule: true, // 24-week schedule for backward compat
    teachers: {
      3: [
        { name: 'Maria Santos', email: 'msantos@westfield.edu', section: '3A' },
        { name: 'James Wright', email: 'jwright@westfield.edu', section: '3B' },
        { name: 'Keisha Johnson', email: 'kjohnson@westfield.edu', section: '3C' },
      ],
      4: [
        { name: 'David Chen', email: 'dchen@westfield.edu', section: '4A' },
        { name: 'Rachel Thompson', email: 'rthompson@westfield.edu', section: '4B' },
        { name: 'Omar Hassan', email: 'ohassan@westfield.edu', section: '4C' },
      ],
      5: [
        { name: 'Sarah Mitchell', email: 'smitchell@westfield.edu', section: '5A' },
        { name: 'Carlos Rivera', email: 'crivera@westfield.edu', section: '5B' },
        { name: 'Angela Foster', email: 'afoster@westfield.edu', section: '5C' },
      ],
    },
    // Performance functions
    getGradeCelebrateRate(grade, weekIdx, totalWeeks) {
      const progress = weekIdx / (totalWeeks - 1);
      if (grade === 3) return 0.82 - progress * 0.40;
      if (grade === 4) return 0.62 + (random() * 0.06 - 0.03);
      if (grade === 5) return 0.32 + progress * 0.46;
      return 0.55;
    },
    getStandardDifficultyAdjustment(grade, stdIdx, weekIdx, totalWeeks) {
      const progress = weekIdx / (totalWeeks - 1);
      if (grade === 3) {
        const base = [+0.12, +0.08, +0.06, +0.05, -0.15, -0.18, -0.02, -0.08];
        const drift = [0, 0, 0, 0, -progress * 0.10, -progress * 0.08, -progress * 0.05, -progress * 0.06];
        return base[stdIdx] + (drift[stdIdx] || 0);
      }
      if (grade === 4) {
        return [+0.20, +0.16, +0.18, +0.14, -0.22, -0.18, -0.04, +0.02][stdIdx];
      }
      if (grade === 5) {
        const base = [+0.08, +0.10, +0.14, +0.06, -0.16, -0.12, +0.02, +0.04];
        const drift = [+progress * 0.08, +progress * 0.06, +progress * 0.06, +progress * 0.08,
                       +progress * 0.12, +progress * 0.10, +progress * 0.04, +progress * 0.02];
        return base[stdIdx] + drift[stdIdx];
      }
      return 0;
    },
    getTeacherAdjustment(grade, teacherName, stdIdx) {
      if (grade === 3 && teacherName === 'James Wright') {
        return stdIdx >= 4 ? -0.20 : -0.12;
      }
      if (grade === 4 && teacherName === 'Omar Hassan') {
        return (stdIdx === 4 || stdIdx === 5) ? -0.18 : -0.08;
      }
      if (grade === 5 && teacherName === 'Carlos Rivera') {
        return -0.12;
      }
      return randomInt(-2, 3) / 100;
    },
    getEffectiveTeacherAdj(grade, teacherAdj, stdIdx) {
      let effectiveAdj = teacherAdj;
      if (teacherAdj < -0.05) {
        if (grade === 3 && teacherAdj < -0.15 && stdIdx < 4) {
          effectiveAdj = teacherAdj * 0.5;
        }
      }
      return effectiveAdj;
    },
    getNaRate(teacherName) {
      if (teacherName === 'Angela Foster') return 0.12;
      return 0.05 + random() * 0.03;
    },
    // Omar Hassan special: limit students on standard 7, pass 1
    specialStudentFilter(teacherName, stdIdx, scheduleIdx, students) {
      if (teacherName === 'Omar Hassan' && stdIdx === 7 && scheduleIdx < 8) {
        return students.slice(0, 7);
      }
      return students;
    },
    concentratedMisconceptions: false,
  },

  // ─── School 2: Lincoln Heights Elementary ────────────────────────────────
  {
    name: 'Lincoln Heights Elementary School',
    slug: 'lincoln-heights',
    org: DISTRICT_NAME,
    seed: 1000,
    useOriginalSchedule: false,
    teachers: {
      3: [
        { name: 'Patricia Nguyen', email: 'pnguyen@lincoln.edu', section: '3A' },
        { name: 'Robert Kim', email: 'rkim@lincoln.edu', section: '3B' },
        { name: 'Diana Flores', email: 'dflores@lincoln.edu', section: '3C' },
      ],
      4: [
        { name: 'Michael Barnes', email: 'mbarnes@lincoln.edu', section: '4A' },
        { name: 'Stephanie Lee', email: 'slee@lincoln.edu', section: '4B' },
        { name: 'Kevin Williams', email: 'kwilliams@lincoln.edu', section: '4C' },
      ],
      5: [
        { name: 'Jennifer Park', email: 'jpark@lincoln.edu', section: '5A' },
        { name: 'Antonio Garcia', email: 'agarcia@lincoln.edu', section: '5B' },
        { name: 'Melissa Chang', email: 'mchang@lincoln.edu', section: '5C' },
      ],
    },
    getGradeCelebrateRate(grade, weekIdx, totalWeeks) {
      // HIGH performing but with realistic variation — mix of green and yellow cells
      if (grade === 3) return 0.58 + (random() * 0.06 - 0.03); // ~55-61%
      if (grade === 4) {
        // slight dip from 60% to 50% over time
        const progress = weekIdx / (totalWeeks - 1);
        return 0.60 - progress * 0.10;
      }
      if (grade === 5) return 0.55 + (random() * 0.06 - 0.03); // ~52-58%
      return 0.55;
    },
    getStandardDifficultyAdjustment(grade, stdIdx, weekIdx, totalWeeks) {
      // Real variation: OA/NBT strong, NF weaker even at a strong school
      const adjustments = {
        3: [+0.12, +0.08, +0.05, +0.10, -0.10, -0.08, +0.04, +0.06],
        4: [+0.14, +0.10, +0.12, +0.08, -0.12, -0.08, +0.04, +0.06],
        5: [+0.10, +0.08, +0.12, +0.06, -0.10, -0.06, +0.05, +0.04],
      };
      return (adjustments[grade] || adjustments[3])[stdIdx] || 0;
    },
    getTeacherAdjustment(grade, teacherName, stdIdx) {
      // NO below-average teachers — all within 5pts of grade average
      return randomInt(-3, 3) / 100;
    },
    getEffectiveTeacherAdj(grade, teacherAdj, stdIdx) {
      return teacherAdj;
    },
    getNaRate(teacherName) {
      // Normal N/A rate (5-8%)
      return 0.05 + random() * 0.03;
    },
    specialStudentFilter(teacherName, stdIdx, scheduleIdx, students) {
      return students;
    },
    concentratedMisconceptions: false,
  },

  // ─── School 3: Riverside Academy ─────────────────────────────────────────
  {
    name: 'Riverside Academy',
    slug: 'riverside-academy',
    org: DISTRICT_NAME,
    seed: 2000,
    useOriginalSchedule: false,
    teachers: {
      3: [
        { name: 'Thomas Bradley', email: 'tbradley@riverside.edu', section: '3A' },
        { name: 'Lisa Morales', email: 'lmorales@riverside.edu', section: '3B' },
        { name: 'Nathan Scott', email: 'nscott@riverside.edu', section: '3C' },
      ],
      4: [
        { name: 'Christine Adams', email: 'cadams@riverside.edu', section: '4A' },
        { name: 'Derek Washington', email: 'dwashington@riverside.edu', section: '4B' },
        { name: 'Priya Patel', email: 'ppatel@riverside.edu', section: '4C' },
      ],
      5: [
        { name: 'Marcus Hill', email: 'mhill@riverside.edu', section: '5A' },
        { name: 'Susan O\'Brien', email: 'sobrien@riverside.edu', section: '5B' },
        { name: 'James Nakamura', email: 'jnakamura@riverside.edu', section: '5C' },
      ],
    },
    getGradeCelebrateRate(grade, weekIdx, totalWeeks) {
      // STRUGGLING but realistic — not wall-to-wall red.
      // OA/NBT are relative strengths (can reach yellow), NF/MD are the real problem areas.
      // Some standards break 50%, many don't. Tells a more believable story.
      const progress = weekIdx / (totalWeeks - 1);
      if (grade === 3) return 0.38 - progress * 0.10; // declining 38% -> 28%
      if (grade === 4) return 0.35 + (random() * 0.04 - 0.02); // stable ~33-37%
      if (grade === 5) return 0.36 - progress * 0.10; // declining 36% -> 26%
      return 0.35;
    },
    getStandardDifficultyAdjustment(grade, stdIdx, weekIdx, totalWeeks) {
      // Key differentiation: OA/NBT can reach yellow (50%+), NF drops hard
      // This creates a mix of red and yellow instead of all red
      const adjustments = {
        3: [+0.14, +0.10, +0.08, +0.12, -0.12, -0.15, -0.04, -0.06],
        4: [+0.16, +0.12, +0.14, +0.10, -0.14, -0.12, -0.02, +0.02],
        5: [+0.12, +0.10, +0.14, +0.08, -0.14, -0.12, -0.03, -0.01],
      };
      return (adjustments[grade] || adjustments[3])[stdIdx] || 0;
    },
    getTeacherAdjustment(grade, teacherName, stdIdx) {
      // Moderate teacher variation — one stronger, two weaker, but not as extreme
      // Grade 3: Thomas Bradley slightly better, others lag
      if (grade === 3 && teacherName === 'Thomas Bradley') return +0.10;
      if (grade === 3 && teacherName === 'Lisa Morales') return -0.12;
      if (grade === 3 && teacherName === 'Nathan Scott') return -0.10;
      // Grade 4: Christine Adams slightly better
      if (grade === 4 && teacherName === 'Christine Adams') return +0.10;
      if (grade === 4 && teacherName === 'Derek Washington') return -0.12;
      if (grade === 4 && teacherName === 'Priya Patel') return -0.08;
      // Grade 5: Marcus Hill slightly better
      if (grade === 5 && teacherName === 'Marcus Hill') return +0.10;
      if (grade === 5 && teacherName === 'Susan O\'Brien') return -0.10;
      if (grade === 5 && teacherName === 'James Nakamura') return -0.08;
      return 0;
    },
    getEffectiveTeacherAdj(grade, teacherAdj, stdIdx) {
      return teacherAdj;
    },
    getNaRate(teacherName) {
      // Normal N/A rate
      return 0.05 + random() * 0.03;
    },
    specialStudentFilter(teacherName, stdIdx, scheduleIdx, students) {
      return students;
    },
    concentratedMisconceptions: true, // heavy misconception concentration
  },

  // ─── School 4: Oak Park Elementary ───────────────────────────────────────
  {
    name: 'Oak Park Elementary School',
    slug: 'oak-park',
    org: DISTRICT_NAME,
    seed: 3000,
    useOriginalSchedule: false,
    teachers: {
      3: [
        { name: 'Amanda Foster', email: 'afoster@oakpark.edu', section: '3A' },
        { name: 'Brian Jackson', email: 'bjackson@oakpark.edu', section: '3B' },
        { name: 'Rosa Martinez', email: 'rmartinez@oakpark.edu', section: '3C' },
      ],
      4: [
        { name: 'Helen Tran', email: 'htran@oakpark.edu', section: '4A' },
        { name: 'William Cooper', email: 'wcooper@oakpark.edu', section: '4B' },
        { name: 'Jasmine Powell', email: 'jpowell@oakpark.edu', section: '4C' },
      ],
      5: [
        { name: 'Daniel Kim', email: 'dkim@oakpark.edu', section: '5A' },
        { name: 'Laura Bennett', email: 'lbennett@oakpark.edu', section: '5B' },
        { name: 'Chris Young', email: 'cyoung@oakpark.edu', section: '5C' },
      ],
    },
    getGradeCelebrateRate(grade, weekIdx, totalWeeks) {
      // HIDDEN VARIATION: grade averages look moderate (35-40%)
      // The extreme variance is handled entirely in teacher adjustments
      if (grade === 3) return 0.38 + (random() * 0.04 - 0.02);
      if (grade === 4) return 0.36 + (random() * 0.04 - 0.02);
      if (grade === 5) return 0.40 + (random() * 0.04 - 0.02);
      return 0.38;
    },
    getStandardDifficultyAdjustment(grade, stdIdx, weekIdx, totalWeeks) {
      // NF (fractions) standards are LOW across all grades (school-wide content gap)
      // stdIdx 4 and 5 are NF for all grades
      const baseAdj = {
        3: [+0.04, +0.03, +0.02, +0.05, -0.15, -0.18, +0.01, +0.02],
        4: [+0.05, +0.04, +0.06, +0.03, -0.16, -0.14, +0.02, +0.03],
        5: [+0.04, +0.03, +0.05, +0.04, -0.17, -0.15, +0.02, +0.01],
      };
      return (baseAdj[grade] || baseAdj[3])[stdIdx] || 0;
    },
    getTeacherAdjustment(grade, teacherName, stdIdx) {
      // EXTREME teacher-level variance
      // Strong teachers: +20-25pt bonus
      if (teacherName === 'Amanda Foster') return +0.22;
      if (teacherName === 'Helen Tran') return +0.20;
      if (teacherName === 'Daniel Kim') return +0.25;
      // Weak teachers: -15-20pt penalty
      if (teacherName === 'Brian Jackson') return -0.18;
      if (teacherName === 'William Cooper') return -0.17;
      if (teacherName === 'Laura Bennett') return -0.15;
      // Average teachers: near grade avg
      if (teacherName === 'Rosa Martinez') return randomInt(-2, 2) / 100;
      if (teacherName === 'Jasmine Powell') return randomInt(-2, 2) / 100;
      if (teacherName === 'Chris Young') return randomInt(-2, 2) / 100;
      return 0;
    },
    getEffectiveTeacherAdj(grade, teacherAdj, stdIdx) {
      return teacherAdj;
    },
    getNaRate(teacherName) {
      // Normal N/A, no elevated N/A teachers
      return 0.05 + random() * 0.03;
    },
    specialStudentFilter(teacherName, stdIdx, scheduleIdx, students) {
      return students;
    },
    concentratedMisconceptions: false,
  },
];


// ══════════════════════════════════════════════════════════════════════════════
// MAIN GENERATION LOGIC
// ══════════════════════════════════════════════════════════════════════════════

function generateSchoolData(config) {
  seedRandom(config.seed);
  const rows = [];
  let studentIdCounter = 10001;

  const isOriginal = config.useOriginalSchedule;
  const weeks = isOriginal ? WEEKS_24 : WEEKS_28;
  const totalWeeks = weeks.length;
  const schedule = isOriginal ? getStandardSchedule24() : getStandardSchedule28();
  const capDate = isOriginal ? '2026-02-25' : '2026-03-22';

  for (const grade of [3, 4, 5]) {
    const teachers = config.teachers[grade];
    const standards = STANDARDS[grade];

    for (const teacher of teachers) {
      const numStudents = randomInt(25, 30);
      const studentNames = generateStudentNames(numStudents);
      const students = studentNames.map((name, i) => ({
        name,
        sisId: `STU${studentIdCounter + i}`,
      }));
      studentIdCounter += numStudents;

      for (let si = 0; si < schedule.length; si++) {
        const { stdIdx, weeks: activeWeeks } = schedule[si];
        const standard = standards[stdIdx];

        const activeStudents = config.specialStudentFilter(teacher.name, stdIdx, si, students);

        let moduleNum = stdIdx + 1;
        let lessonNum = si >= 8 ? 3 : 0;

        for (const weekIdx of activeWeeks) {
          const weekDate = weeks[weekIdx];
          const lessonsThisWeek = weekIdx === activeWeeks[0] ? 2 : 1;

          for (let l = 0; l < lessonsThisWeek; l++) {
            lessonNum++;
            const assignmentDate = getAssignmentDate(weekDate, l, capDate);
            const passLabel = si >= 8 ? ' (Review)' : '';
            const assignmentName = `Module ${moduleNum} - Lesson ${lessonNum} - Exit Ticket${passLabel}`;

            const baseCelebRate = config.getGradeCelebrateRate(grade, weekIdx, totalWeeks);
            const teacherAdj = config.getTeacherAdjustment(grade, teacher.name, stdIdx);
            const effectiveAdj = config.getEffectiveTeacherAdj(grade, teacherAdj, stdIdx);
            const stdDiffAdj = config.getStandardDifficultyAdjustment(grade, stdIdx, weekIdx, totalWeeks);
            const celebrateRate = Math.max(0.05, Math.min(0.92, baseCelebRate + effectiveAdj + stdDiffAdj));
            const naRate = config.getNaRate(teacher.name);

            for (const student of activeStudents) {
              const classification = classifyStudent(celebrateRate, naRate);

              let misconceptions = null;
              if (classification.mastery === '2. Support' || classification.mastery === '3. Intervene') {
                misconceptions = pickMisconceptions(standard.domain, standard.code, config.concentratedMisconceptions);
              }

              rows.push({
                'Assignment Date': assignmentDate,
                'sis_id': student.sisId,
                'Student': student.name,
                'Organization': config.org,
                'School': config.name,
                'schoolSlug': config.slug,
                'Grade': grade,
                'Teacher': teacher.name,
                'Teacher Email': teacher.email,
                'Section': teacher.section,
                'Assignment Name': assignmentName,
                'Standard': standard.code,
                'Standard Description': standard.desc,
                'Domain': standard.domain,
                'Domain Name': DOMAIN_NAMES[standard.domain] || standard.domain,
                'Overall Mastery': classification.overall,
                'Misconceptions': misconceptions,
                'Attempt #': 1,
                'Week of': weekDate,
                'Mastery': classification.mastery,
                'Mastery Sort Order': classification.sortOrder,
                'At Celebrate': classification.mastery === '1. Celebrate' ? 1 : 0,
                'At Support': classification.mastery === '2. Support' ? 1 : 0,
                'At Intervene': classification.mastery === '3. Intervene' ? 1 : 0,
                'At N/A': classification.mastery === '4. N/A' ? 1 : 0,
              });
            }
          }
        }
      }
    }
  }

  return rows;
}


// ══════════════════════════════════════════════════════════════════════════════
// PRIOR YEAR DATA GENERATION
// ══════════════════════════════════════════════════════════════════════════════

function generatePriorYearData(allSchoolData) {
  const priorYear = [];

  for (const config of SCHOOL_CONFIGS) {
    const schoolData = allSchoolData[config.slug];
    if (!schoolData) continue;

    for (const grade of [3, 4, 5]) {
      const standards = STANDARDS[grade];

      for (const standard of standards) {
        // Calculate current year early-data celebrate rate (first 8 weeks)
        const earlyRows = schoolData.filter(r =>
          r.Grade === grade &&
          r.Standard === standard.code
        );

        // Get the first ~1/3 of weeks to estimate early data
        const allWeeks = [...new Set(earlyRows.map(r => r['Week of']))].sort();
        const earlyWeekCutoff = allWeeks[Math.min(7, allWeeks.length - 1)];
        const earlyFiltered = earlyRows.filter(r => r['Week of'] <= earlyWeekCutoff);

        let currentEarlyCelebrate = 0;
        if (earlyFiltered.length > 0) {
          const celebCount = earlyFiltered.filter(r => r['At Celebrate'] === 1).length;
          const nonNaCount = earlyFiltered.filter(r => r['At N/A'] !== 1).length;
          currentEarlyCelebrate = nonNaCount > 0 ? Math.round(celebCount / nonNaCount * 100) : 0;
        }

        // Prior year patterns per school
        let priorCelebrate;
        let priorStudentCount;

        // Use deterministic seed for prior year generation
        seedRandom(config.seed + grade * 100 + standards.indexOf(standard) * 10 + 777);

        if (config.slug === 'westfield-elementary') {
          // Prior year ~5 points HIGHER than current early data (regression)
          priorCelebrate = Math.min(95, currentEarlyCelebrate + randomInt(3, 8));
        } else if (config.slug === 'lincoln-heights') {
          // Prior year SIMILAR to current (consistency)
          priorCelebrate = currentEarlyCelebrate + randomInt(-3, 3);
        } else if (config.slug === 'riverside-academy') {
          // Prior year SLIGHTLY HIGHER than current (worsening)
          priorCelebrate = currentEarlyCelebrate + randomInt(2, 6);
        } else if (config.slug === 'oak-park') {
          // Prior year LOWER than current (improving school)
          priorCelebrate = Math.max(5, currentEarlyCelebrate - randomInt(3, 10));
        } else {
          priorCelebrate = currentEarlyCelebrate;
        }

        priorCelebrate = Math.max(5, Math.min(95, priorCelebrate));
        priorStudentCount = randomInt(75, 100);

        priorYear.push({
          school: config.name,
          schoolSlug: config.slug,
          grade: grade,
          standardCode: standard.code,
          priorYearCelebratePercent: priorCelebrate,
          priorYearStudentCount: priorStudentCount,
        });
      }
    }
  }

  return priorYear;
}


// ══════════════════════════════════════════════════════════════════════════════
// DISTRICT SUMMARY GENERATION
// ══════════════════════════════════════════════════════════════════════════════

function computeSchoolSummary(config, rows) {
  // Overall celebrate %
  const nonNaRows = rows.filter(r => r['At N/A'] !== 1);
  const celebCount = rows.filter(r => r['At Celebrate'] === 1).length;
  const overallCelebratePercent = nonNaRows.length > 0
    ? Math.round(celebCount / nonNaRows.length * 100)
    : 0;

  // Unique students / teachers
  const uniqueStudents = new Set(rows.map(r => r.sis_id)).size;
  const uniqueTeachers = new Set(rows.map(r => r.Teacher)).size;

  // Red cells: grade-standard-week combos below 25% celebrate
  const gradeStdWeekMap = {};
  for (const r of rows) {
    const key = `${r.Grade}-${r.Standard}-${r['Week of']}`;
    if (!gradeStdWeekMap[key]) gradeStdWeekMap[key] = { celebrate: 0, nonNa: 0 };
    if (r['At N/A'] !== 1) {
      gradeStdWeekMap[key].nonNa++;
      if (r['At Celebrate'] === 1) gradeStdWeekMap[key].celebrate++;
    }
  }
  let redCellCount = 0;
  for (const key of Object.keys(gradeStdWeekMap)) {
    const { celebrate, nonNa } = gradeStdWeekMap[key];
    if (nonNa > 0 && (celebrate / nonNa) < 0.25) redCellCount++;
  }

  // Declining grades: compare first 4 weeks avg vs last 4 weeks avg, flag if >15pt drop
  const allWeeks = [...new Set(rows.map(r => r['Week of']))].sort();
  const earlyWeeks = new Set(allWeeks.slice(0, 4));
  const lateWeeks = new Set(allWeeks.slice(-4));
  let decliningGrades = 0;
  for (const grade of [3, 4, 5]) {
    const gradeRows = rows.filter(r => r.Grade === grade);
    const earlyGrade = gradeRows.filter(r => earlyWeeks.has(r['Week of']));
    const lateGrade = gradeRows.filter(r => lateWeeks.has(r['Week of']));

    const earlyNonNa = earlyGrade.filter(r => r['At N/A'] !== 1);
    const lateNonNa = lateGrade.filter(r => r['At N/A'] !== 1);

    const earlyCeleb = earlyNonNa.length > 0
      ? earlyNonNa.filter(r => r['At Celebrate'] === 1).length / earlyNonNa.length
      : 0;
    const lateCeleb = lateNonNa.length > 0
      ? lateNonNa.filter(r => r['At Celebrate'] === 1).length / lateNonNa.length
      : 0;

    if ((earlyCeleb - lateCeleb) > 0.15) decliningGrades++;
  }

  // Flagged teachers: teacher avg more than 10pts below grade avg
  let flaggedTeachers = 0;
  const topConcerns = [];
  for (const grade of [3, 4, 5]) {
    const gradeRows = rows.filter(r => r.Grade === grade);
    const gradeNonNa = gradeRows.filter(r => r['At N/A'] !== 1);
    const gradeAvg = gradeNonNa.length > 0
      ? gradeNonNa.filter(r => r['At Celebrate'] === 1).length / gradeNonNa.length
      : 0;

    const teachers = [...new Set(gradeRows.map(r => r.Teacher))];
    for (const teacher of teachers) {
      const teacherRows = gradeNonNa.filter(r => r.Teacher === teacher);
      const teacherAvg = teacherRows.length > 0
        ? teacherRows.filter(r => r['At Celebrate'] === 1).length / teacherRows.length
        : 0;

      const diff = Math.round((gradeAvg - teacherAvg) * 100);
      if (diff >= 10) {
        flaggedTeachers++;
        // Find the weakest domain for this teacher
        const domains = [...new Set(teacherRows.map(r => r.Domain))];
        let worstDomain = '';
        let worstDomainDiff = 0;
        for (const domain of domains) {
          const domainRows = teacherRows.filter(r => r.Domain === domain);
          const domainAvg = domainRows.length > 0
            ? domainRows.filter(r => r['At Celebrate'] === 1).length / domainRows.length
            : 0;
          const domainDiff = gradeAvg - domainAvg;
          if (domainDiff > worstDomainDiff) {
            worstDomainDiff = domainDiff;
            worstDomain = domain;
          }
        }
        const section = rows.find(r => r.Teacher === teacher)?.Section || '';
        topConcerns.push({
          text: `Grade ${grade} ${DOMAIN_NAMES[worstDomain] || worstDomain} — ${teacher}'s class (${section}) ${diff}pts below avg`,
          severity: diff,
        });
      }
    }
  }

  // Pick the top concern
  topConcerns.sort((a, b) => b.severity - a.severity);
  const topConcern = topConcerns.length > 0
    ? topConcerns[0].text
    : (decliningGrades > 0 ? 'Grade-level declining trends detected' : 'No major concerns');

  // Determine trend
  let trend = 'stable';
  if (decliningGrades >= 2) trend = 'declining';
  else if (decliningGrades === 1 && flaggedTeachers > 0) trend = 'mixed';
  else if (flaggedTeachers === 0 && redCellCount < 3) trend = 'strong';
  else if (flaggedTeachers > 3) trend = 'concerning';

  return {
    name: config.name,
    slug: config.slug,
    overallCelebratePercent,
    totalStudents: uniqueStudents,
    totalTeachers: uniqueTeachers,
    redCellCount,
    decliningGrades,
    flaggedTeachers,
    trend,
    topConcern,
  };
}


// ══════════════════════════════════════════════════════════════════════════════
// EXECUTION
// ══════════════════════════════════════════════════════════════════════════════

console.log('EdLight Multi-School Data Generator');
console.log('===================================\n');

const allSchoolData = {};
const schoolSummaries = [];
const outputDir = __dirname;

// Generate data for each school
for (const config of SCHOOL_CONFIGS) {
  console.log(`Generating ${config.name} (seed=${config.seed})...`);
  const rows = generateSchoolData(config);
  allSchoolData[config.slug] = rows;
  console.log(`  -> ${rows.length.toLocaleString()} rows, ${new Set(rows.map(r => r.sis_id)).size} students`);
}

console.log('');

// Generate prior year data
console.log('Generating prior year data...');
const priorYearData = generatePriorYearData(allSchoolData);
console.log(`  -> ${priorYearData.length} records`);

// Compute district summaries
console.log('Computing district summaries...');
for (const config of SCHOOL_CONFIGS) {
  const summary = computeSchoolSummary(config, allSchoolData[config.slug]);
  schoolSummaries.push(summary);
  console.log(`  ${config.name}: ${summary.overallCelebratePercent}% celebrate, ${summary.flaggedTeachers} flagged, trend=${summary.trend}`);
}

const districtSummary = {
  districtName: DISTRICT_NAME,
  schools: schoolSummaries,
};

// Write output files
console.log('\nWriting output files...');

const fileMap = {
  'data_westfield.json': allSchoolData['westfield-elementary'],
  'data_lincoln.json': allSchoolData['lincoln-heights'],
  'data_riverside.json': allSchoolData['riverside-academy'],
  'data_oakpark.json': allSchoolData['oak-park'],
  'priorYear.json': priorYearData,
  'districtSummary.json': districtSummary,
};

let totalRows = 0;
for (const [filename, data] of Object.entries(fileMap)) {
  const filepath = join(outputDir, filename);
  const json = JSON.stringify(data, null, 2);
  writeFileSync(filepath, json, 'utf8');
  const sizeKB = Math.round(json.length / 1024);
  const rowCount = Array.isArray(data) ? data.length : '-';
  console.log(`  ${filename}: ${sizeKB} KB (${typeof rowCount === 'number' ? rowCount.toLocaleString() + ' rows' : 'summary'})`);
  if (typeof rowCount === 'number') totalRows += rowCount;
}

console.log(`\nTotal rows across all schools: ${totalRows.toLocaleString()}`);
console.log('Done!');
