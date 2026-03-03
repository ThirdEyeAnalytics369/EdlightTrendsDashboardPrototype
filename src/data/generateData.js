/**
 * EdLight Trends Dashboard — Simulated Data Generator
 *
 * Generates ~12,000+ rows matching EdLight's KIPP export format exactly.
 * Each row = one student × one standard × one assignment.
 *
 * Timeline: Sep 8, 2025 → Feb 23, 2026 (24 weeks, full first semester + start of second)
 * Standards are taught in two passes (spiraling curriculum).
 *
 * Embedded performance patterns:
 *   - Grade 3: STRONG START, DECLINING — starts ~82%, drops to ~42% by February
 *     → OA standards stay high (78-85%), NF/MD standards collapse (25-40%)
 *   - Grade 4: MIXED BAG — OA/NBT standards consistently high (78-88%),
 *     NF standards consistently low (35-48%), MD/G in the middle (55-65%)
 *   - Grade 5: IMPROVING — starts ~32%, climbs to ~78% by February
 *     → NBT/OA cross above 75% by November, NF catches up by January
 *   - Below-average teachers: James Wright (3B), Omar Hassan (4C), Carlos Rivera (5B)
 *   - High N/A teacher: Angela Foster (5C)
 */

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

const SCHOOL = 'Westfield Elementary School';
const ORG = 'Westfield Unified School District';

const TEACHERS = {
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

// Misconception clustering weights by standard domain type
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

function pickMisconception(domain, code) {
  const weights = getMisconceptionWeights(domain, code);
  const r = random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return MISCONCEPTION_TYPES[i];
  }
  return MISCONCEPTION_TYPES[MISCONCEPTION_TYPES.length - 1];
}

function pickMisconceptions(domain, code) {
  const r = random();
  const count = r < 0.65 ? 1 : r < 0.95 ? 2 : 3;
  const types = new Set();
  for (let i = 0; i < count; i++) {
    types.add(pickMisconception(domain, code));
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

// 24 weeks: Sep 8, 2025 → Feb 23, 2026
const WEEKS = [];
for (let i = 0; i < 24; i++) {
  const d = new Date(2025, 8, 8 + i * 7); // Month 8 = September
  const iso = d.toISOString().slice(0, 10);
  WEEKS.push(iso);
}

// Standard teaching schedule: 8 standards over 24 weeks (two passes)
// Pass 1: weeks 0-11 (Sep–Nov) — initial instruction
// Pass 2: weeks 12-23 (Dec–Feb) — spiraling review + deeper application
function getStandardSchedule() {
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
    // Pass 2: Spiral review (same standards revisited)
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

// ── Grade-level Celebrate rate by week (the core patterns) ──────────────────

function getGradeCelebrateRate(grade, weekIdx) {
  // weekIdx 0-23 maps to Sep 8 – Feb 23
  const progress = weekIdx / 23; // 0.0 to 1.0

  if (grade === 3) {
    // STRONG START, DECLINING: 82% → 62% → 42%
    // Steady decline as content gets harder and instruction breaks down
    return 0.82 - progress * 0.40;
  }
  if (grade === 4) {
    // STABLE/MIXED: hovers around 62% with gentle noise
    // Individual standards vary wildly (set via difficulty adjustments)
    return 0.62 + (random() * 0.06 - 0.03);
  }
  if (grade === 5) {
    // IMPROVING: 32% → 55% → 78%
    // Strong growth trajectory throughout the year
    return 0.32 + progress * 0.46;
  }
  return 0.55;
}

// Per-standard difficulty adjustment
// This is the KEY to creating variation — some standards consistently high, others consistently low
function getStandardDifficultyAdjustment(grade, stdIdx, weekIdx) {
  const progress = weekIdx / 23;

  if (grade === 3) {
    // OA standards (0,1,2): stay strong even as grade declines
    // NBT (3): stays okay
    // NF (4,5): collapse — fractions are the problem
    // MD (6,7): decline with the grade
    const base = [+0.12, +0.08, +0.06, +0.05, -0.15, -0.18, -0.02, -0.08];
    // NF standards get worse over time (compounding confusion)
    const drift = [0, 0, 0, 0, -progress * 0.10, -progress * 0.08, -progress * 0.05, -progress * 0.06];
    return base[stdIdx] + (drift[stdIdx] || 0);
  }

  if (grade === 4) {
    // OA (0,1): consistently HIGH — 78-88%
    // NBT (2,3): consistently HIGH — 76-85%
    // NF (4,5): consistently LOW — 35-48%
    // MD (6): middle ground — 55-65%
    // G (7): middle ground — 58-68%
    return [+0.20, +0.16, +0.18, +0.14, -0.22, -0.18, -0.04, +0.02][stdIdx];
  }

  if (grade === 5) {
    // Early: everything low. NBT/OA improve first, NF catches up later.
    // By Feb: OA/NBT are well above 75%, NF is approaching 75%, MD/G are solid
    const base = [+0.08, +0.10, +0.14, +0.06, -0.16, -0.12, +0.02, +0.04];
    // OA/NBT get bonus improvement over time, NF catches up
    const drift = [+progress * 0.08, +progress * 0.06, +progress * 0.06, +progress * 0.08,
                   +progress * 0.12, +progress * 0.10, +progress * 0.04, +progress * 0.02];
    return base[stdIdx] + drift[stdIdx];
  }

  return 0;
}

// Teacher-level adjustment: below-average teachers get penalized
function getTeacherAdjustment(grade, teacherName, stdIdx) {
  // Below-average teachers
  if (grade === 3 && teacherName === 'James Wright') {
    // Struggles most with fractions (std 4,5) and later standards
    return stdIdx >= 4 ? -0.20 : -0.12;
  }
  if (grade === 4 && teacherName === 'Omar Hassan') {
    // Below average on NF standards specifically
    return (stdIdx === 4 || stdIdx === 5) ? -0.18 : -0.08;
  }
  if (grade === 5 && teacherName === 'Carlos Rivera') {
    // Uniformly below, but improving less than peers
    return -0.12;
  }
  // Normal teachers are close to grade average
  return randomInt(-2, 3) / 100;
}

// N/A rate by teacher
function getNaRate(teacherName) {
  if (teacherName === 'Angela Foster') return 0.12;
  return 0.05 + random() * 0.03;
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

function getAssignmentDate(weekDate, lessonInWeek) {
  const d = new Date(weekDate);
  const dayOffset = lessonInWeek === 0 ? 0 : lessonInWeek === 1 ? 2 : 4;
  d.setDate(d.getDate() + dayOffset);
  // Cap at Feb 25, 2026
  const cap = new Date('2026-02-25');
  if (d > cap) return cap.toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// ── Main generation ─────────────────────────────────────────────────────────

export function generateData() {
  seedRandom(42);
  const rows = [];
  let studentIdCounter = 10001;

  const schedule = getStandardSchedule();

  for (const grade of [3, 4, 5]) {
    const teachers = TEACHERS[grade];
    const standards = STANDARDS[grade];

    for (const teacher of teachers) {
      const numStudents = randomInt(25, 30);
      const isOmarHassan = teacher.name === 'Omar Hassan';

      const studentNames = generateStudentNames(numStudents);
      const students = studentNames.map((name, i) => ({
        name,
        sisId: `STU${studentIdCounter + i}`,
      }));
      studentIdCounter += numStudents;

      for (let si = 0; si < schedule.length; si++) {
        const { stdIdx, weeks: activeWeeks } = schedule[si];
        const standard = standards[stdIdx];

        // Omar Hassan: for the last standard (index 7), only 7 students on first pass
        const activeStudents = (isOmarHassan && stdIdx === 7 && si < 8)
          ? students.slice(0, 7)
          : students;

        let moduleNum = stdIdx + 1;
        let lessonNum = si >= 8 ? 3 : 0; // Pass 2 starts at lesson 4

        for (const weekIdx of activeWeeks) {
          const weekDate = WEEKS[weekIdx];
          const lessonsThisWeek = weekIdx === activeWeeks[0] ? 2 : 1;

          for (let l = 0; l < lessonsThisWeek; l++) {
            lessonNum++;
            const assignmentDate = getAssignmentDate(weekDate, l);
            const passLabel = si >= 8 ? ' (Review)' : '';
            const assignmentName = `Module ${moduleNum} - Lesson ${lessonNum} - Exit Ticket${passLabel}`;

            const baseCelebRate = getGradeCelebrateRate(grade, weekIdx);
            const teacherAdj = getTeacherAdjustment(grade, teacher.name, stdIdx);

            let effectiveAdj = teacherAdj;
            if (teacherAdj < -0.05) {
              // Below-average: full penalty on target standards, partial elsewhere
              if (grade === 3 && teacherAdj < -0.15 && stdIdx < 4) {
                effectiveAdj = teacherAdj * 0.5;
              }
            }

            const stdDiffAdj = getStandardDifficultyAdjustment(grade, stdIdx, weekIdx);
            const celebrateRate = Math.max(0.05, Math.min(0.92, baseCelebRate + effectiveAdj + stdDiffAdj));
            const naRate = getNaRate(teacher.name);

            for (const student of activeStudents) {
              const classification = classifyStudent(celebrateRate, naRate);

              let misconceptions = null;
              if (classification.mastery === '2. Support' || classification.mastery === '3. Intervene') {
                misconceptions = pickMisconceptions(standard.domain, standard.code);
              }

              rows.push({
                'Assignment Date': assignmentDate,
                'sis_id': student.sisId,
                'Student': student.name,
                'Organization': ORG,
                'School': SCHOOL,
                'Grade': grade,
                'Teacher': teacher.name,
                'Teacher Email': teacher.email,
                'Section': teacher.section,
                'Assignment Name': assignmentName,
                'Standard': standard.code,
                'Overall Mastery': classification.overall,
                'Misconceptions': misconceptions,
                'Attempt #': 1,
                'Week of': weekDate,
                'Domain': standard.domain,
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

// Export pre-generated data
const data = generateData();
export default data;
