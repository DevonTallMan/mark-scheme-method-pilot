'use strict';
// ── teacher-logic.js ──────────────────────────────────────────────────────────
// Pure functions extracted from teacher.html for unit testing.
// Add <script src="./teacher-logic.js"></script> to teacher.html before the
// main <script> block. All behaviour is identical to the inline originals.

const BADGES = {
  raw_signal:          { icon: '\uD83D\uDCE1', name: 'Raw Signal'         },
  market_intelligence: { icon: '\uD83D\uDCCA', name: 'Market Intel'       },
  full_clearance:      { icon: '\uD83D\uDD34', name: 'Full Clearance'     },
  first_strike:        { icon: '\u26A1', name: 'First Strike'      },
  impact_specialist:   { icon: '\uD83C\uDFAF', name: 'Impact Specialist'  },
  precision_writer:    { icon: '\uD83D\uDD3A', name: 'Precision Writer'   },
  signal_recovered:    { icon: '\uD83D\uDCD8', name: 'Signal Recovered'   },
  resilient_analyst:   { icon: '\uD83D\uDD35', name: 'Resilient Analyst'  },
  method_mastery:      { icon: '\uD83C\uDF1F', name: 'Method Mastery'     },
};

const RANKS = [
  { id: 0, title: 'TRAINEE'          },
  { id: 1, title: 'DATA CADET'       },
  { id: 2, title: 'SIGNAL ANALYST'   },
  { id: 3, title: 'SYSTEMS OPERATOR' },
  { id: 4, title: 'DATA STRATEGIST'  },
  { id: 5, title: 'INSIGHT ARCHITECT'},
];

// Exact copy of rankFromBadges() from teacher.html lines 389-402
function rankFromBadges(badgeObj) {
  const earned = Object.keys(badgeObj || {}).filter(k => badgeObj[k]?.earned);
  const reqs = [
    [],
    ['raw_signal'],
    ['raw_signal', 'market_intelligence'],
    ['raw_signal', 'market_intelligence', 'full_clearance'],
    ['raw_signal', 'market_intelligence', 'full_clearance', 'impact_specialist'],
    ['raw_signal', 'market_intelligence', 'full_clearance', 'impact_specialist', 'method_mastery'],
  ];
  let rankId = 0;
  reqs.forEach((req, i) => { if (req.every(r => earned.includes(r))) rankId = i; });
  return RANKS[rankId];
}

// Exact copy of genCode() from teacher.html lines 405-410
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Pure extraction of the studentId generation logic from addStudent() line 610
function generateStudentId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Pure extraction of the stats calculation from updateStats() lines 505-517.
// Returns values instead of writing to DOM.
// Accepts optional `now` (epoch ms) so tests can control time.
function calculateStats(students, now) {
  now = (now == null) ? Date.now() : now;
  const enrolled = students.length;
  const weekMs   = 7 * 24 * 60 * 60 * 1000;
  const active   = students.filter(
    s => s.lastActive && (now - (s.lastActive.toMillis?.() || 0)) < weekMs
  ).length;
  let totalBadges = 0, impactEarners = 0;
  students.forEach(s => {
    const b     = s.badges || {};
    const count = Object.keys(b).filter(k => b[k]?.earned).length;
    totalBadges += count;
    if (b['impact_specialist']?.earned) impactEarners++;
  });
  const impactPct = enrolled ? Math.round((impactEarners / enrolled) * 100) : 0;
  return { enrolled, active, totalBadges, impactPct };
}

// Pure extraction of the alert calculation logic from renderAlerts() lines 583-588.
// Returns values instead of writing to DOM.
function calculateAlerts(students) {
  const total = students.length;
  const impactMissers = students.filter(
    s => !(s.badges || {})['impact_specialist']?.earned &&
         Object.keys(s.badges || {}).length > 0
  ).length;
  const moduleOnlyCount = students.filter(
    s => (s.badges || {})['raw_signal']?.earned &&
         !(s.badges || {})['market_intelligence']?.earned
  ).length;
  const noBadges = students.filter(
    s => !Object.keys(s.badges || {}).filter(k => (s.badges || {})[k]?.earned).length
  ).length;
  const noImpactPct = total ? Math.round((impactMissers / total) * 100) : 0;
  return { impactMissers, moduleOnlyCount, noBadges, noImpactPct };
}

if (typeof module !== 'undefined') {
  module.exports = {
    rankFromBadges, genCode, generateStudentId,
    calculateStats, calculateAlerts,
    RANKS, BADGES,
  };
}
