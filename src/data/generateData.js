/**
 * EdLight Trends Dashboard — Simulated Data Generator
 *
 * Generates ~5,800 rows matching EdLight's KIPP export format exactly.
 * Each row = one student × one standard × one assignment.
 *
 * Embedded performance patterns:
 *   - Grade 3: DECLINING (40% → 20% Celebrate over 12 weeks)
 *   - Grade 4: STABLE (~30-35% Celebrate throughout)
 *   - Grade 5: IMPROVING (20% → 40-45% Celebrate over 12 weeks)
 *   - James Wright (3B): 15-20pt below Grade 3 avg on ≥2 standards
 *   - Omar Hassan (4C): 12-18pt below Grade 4 avg, one standard with n<10
 *   - Carlos Rivera (5B): 10-15pt below Grade 5 avg on ≥2 standards
 *   - Angela Foster (5C): ~12% N/A rate (vs ~5-8% overall)
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
  // Expression/equation standards (OA expressions like 5.OA.A.1, 5.OA.A.2)
  if (domain === 'OA' && (code.includes('.A.1') || code.includes('.A.2')) && code.startsWith('5.')) {
    return [0.30, 0.10, 0.05, 0.20, 0.35, 0.00, 0.00, 0.00]; // Precision 35%, Computation 30%, Incomplete 20%
  }
  // Computation-heavy: NBT (add, sub, multiply, divide)
  if (domain === 'NBT') {
    return [0.65, 0.18, 0.03, 0.04, 0.05, 0.01, 0.02, 0.02];
  }
  // Conceptual: NF (fractions), OA word problems
  if (domain === 'NF' || domain === 'OA') {
    return [0.20, 0.55, 0.05, 0.05, 0.05, 0.02, 0.05, 0.03];
  }
  // Geometry/Measurement: MD, G
  if (domain === 'MD' || domain === 'G') {
    return [0.08, 0.25, 0.04, 0.05, 0.05, 0.45, 0.05, 0.03];
  }
  // Fallback
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
  // 65% get 1 misconception, 30% get 2, 5% get 3
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

// 12 weeks: Sep 8 – Nov 28, 2025
const WEEKS = [];
for (let i = 0; i < 12; i++) {
  const d = new Date(2025, 8, 8 + i * 7); // Month 8 = September
  const iso = d.toISOString().slice(0, 10);
  WEEKS.push(iso);
}

// Standard teaching schedule: 8 standards over 12 weeks
// Each standard gets ~1.5 weeks, 2-3 exit tickets
function getStandardSchedule() {
  // Returns which weeks each standard index is active
  // We assign each standard roughly 1.5 weeks with some overlap
  return [
    { stdIdx: 0, weeks: [0, 1] },       // Wk 1-2
    { stdIdx: 1, weeks: [1, 2] },       // Wk 2-3
    { stdIdx: 2, weeks: [2, 3] },       // Wk 3-4
    { stdIdx: 3, weeks: [3, 4] },       // Wk 4-5
    { stdIdx: 4, weeks: [5, 6] },       // Wk 6-7
    { stdIdx: 5, weeks: [6, 7] },       // Wk 7-8
    { stdIdx: 6, weeks: [8, 9] },       // Wk 9-10
    { stdIdx: 7, weeks: [10, 11] },     // Wk 11-12
  ];
}

// ── Grade-level Celebrate rate by week (the core patterns) ──────────────────

function getGradeCelebrateRate(grade, weekIdx) {
  if (grade === 3) {
    // DECLINING: 40% → 30% → 20%
    if (weekIdx < 4) return 0.40;
    if (weekIdx < 8) return 0.30;
    return 0.20;
  }
  if (grade === 4) {
    // STABLE: ~30-35%
    return 0.32 + (random() * 0.06 - 0.03); // 29-35% with noise
  }
  if (grade === 5) {
    // IMPROVING: 20% → 30% → 40-45%
    if (weekIdx < 4) return 0.20;
    if (weekIdx < 8) return 0.30;
    return 0.42;
  }
  return 0.30;
}

// Teacher-level adjustment: below-average teachers get penalized
function getTeacherAdjustment(grade, teacherName) {
  // Below-average teachers
  if (grade === 3 && teacherName === 'James Wright') return -0.18; // 15-20pt below
  if (grade === 4 && teacherName === 'Omar Hassan') return -0.15;  // 12-18pt below
  if (grade === 5 && teacherName === 'Carlos Rivera') return -0.12; // 10-15pt below
  // Normal teachers are close to grade average
  return randomInt(-2, 3) / 100; // ±2-3pt noise
}

// N/A rate by teacher
function getNaRate(teacherName) {
  if (teacherName === 'Angela Foster') return 0.12; // ~12%
  return 0.05 + random() * 0.03; // 5-8% for everyone else
}

// ── Mastery classification ──────────────────────────────────────────────────

function classifyStudent(celebrateRate, naRate) {
  const r = random();

  // First check N/A
  if (r < naRate) {
    return { mastery: '4. N/A', sortOrder: 4, overall: null };
  }

  const effectiveR = (r - naRate) / (1 - naRate);

  if (effectiveR < celebrateRate) {
    return { mastery: '1. Celebrate', sortOrder: 1, overall: 0 };
  }

  // Remaining split between Support (~40-50% of non-celebrate) and Intervene
  const supportRate = 0.45 + random() * 0.1; // 45-55% of remainder
  const remainingR = (effectiveR - celebrateRate) / (1 - celebrateRate);

  if (remainingR < supportRate) {
    return { mastery: '2. Support', sortOrder: 2, overall: randomInt(1, 2) };
  }

  return { mastery: '3. Intervene', sortOrder: 3, overall: randomInt(3, 4) };
}

// ── Assignment date within a week ───────────────────────────────────────────

function getAssignmentDate(weekDate, lessonInWeek) {
  const d = new Date(weekDate);
  // Lessons on Mon(0), Wed(2), Fri(4)
  const dayOffset = lessonInWeek === 0 ? 0 : lessonInWeek === 1 ? 2 : 4;
  d.setDate(d.getDate() + dayOffset);
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
      // Generate students for this teacher
      const numStudents = randomInt(25, 30);

      // Special case: Omar Hassan gets a small class for one standard
      const isOmarHassan = teacher.name === 'Omar Hassan';

      const studentNames = generateStudentNames(numStudents);
      const students = studentNames.map((name, i) => ({
        name,
        sisId: `STU${studentIdCounter + i}`,
      }));
      studentIdCounter += numStudents;

      // For each standard on the schedule
      for (let si = 0; si < schedule.length; si++) {
        const { stdIdx, weeks: activeWeeks } = schedule[si];
        const standard = standards[stdIdx];

        // Omar Hassan: for the last standard (index 7), only 7 students do assignments
        const activeStudents = (isOmarHassan && stdIdx === 7)
          ? students.slice(0, 7)
          : students;

        let moduleNum = stdIdx + 1;
        let lessonNum = 0;

        // Generate 2-3 exit tickets across the active weeks
        for (const weekIdx of activeWeeks) {
          const weekDate = WEEKS[weekIdx];
          const lessonsThisWeek = weekIdx === activeWeeks[0] ? 2 : 1;

          for (let l = 0; l < lessonsThisWeek; l++) {
            lessonNum++;
            const assignmentDate = getAssignmentDate(weekDate, l);
            const assignmentName = `Module ${moduleNum} - Lesson ${lessonNum} - Exit Ticket`;

            // Get the celebrate rate for this grade/week/teacher
            const baseCelebRate = getGradeCelebrateRate(grade, weekIdx);
            const teacherAdj = getTeacherAdjustment(grade, teacher.name);

            // Below-average teachers are penalized on at least 2 standards
            // Apply the full penalty on standards 0-1 and 4-5, partial on others
            let effectiveAdj = teacherAdj;
            if (teacherAdj < -0.05) {
              // This is a below-average teacher
              if (stdIdx >= 2 && stdIdx <= 3) {
                effectiveAdj = teacherAdj * 0.3; // Partial penalty on middle standards
              }
              // Full penalty on standards 0-1, 4-7
            }

            const celebrateRate = Math.max(0.05, Math.min(0.90, baseCelebRate + effectiveAdj));
            const naRate = getNaRate(teacher.name);

            for (const student of activeStudents) {
              const classification = classifyStudent(celebrateRate, naRate);

              // Assign misconceptions only for Support or Intervene
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
