'use strict';
// ── teacher-logic.test.js ─────────────────────────────────────────────────────
// Jest unit tests for the MSM teacher dashboard logic.
// Tests the exact functions from teacher.html, extracted to teacher-logic.js.
// Run with: npm test

const {
  rankFromBadges,
  genCode,
  generateStudentId,
  calculateStats,
  calculateAlerts,
  RANKS,
} = require('../../teacher-logic.js');

// ─────────────────────────────────────────────────────────────────────────────
// rankFromBadges
// ─────────────────────────────────────────────────────────────────────────────
describe('rankFromBadges', () => {

  test('returns TRAINEE when badge object is empty', () => {
    expect(rankFromBadges({}).title).toBe('TRAINEE');
    expect(rankFromBadges({}).id).toBe(0);
  });

  test('returns TRAINEE when null is passed', () => {
    expect(rankFromBadges(null).title).toBe('TRAINEE');
  });

  test('returns TRAINEE when only a non-pathway badge is earned', () => {
    // first_strike is not part of the rank progression chain
    expect(rankFromBadges({ first_strike: { earned: true } }).title).toBe('TRAINEE');
  });

  test('returns TRAINEE when raw_signal is present but NOT earned', () => {
    expect(rankFromBadges({ raw_signal: { earned: false } }).title).toBe('TRAINEE');
  });

  test('returns DATA CADET when only raw_signal is earned', () => {
    expect(rankFromBadges({ raw_signal: { earned: true } }).title).toBe('DATA CADET');
    expect(rankFromBadges({ raw_signal: { earned: true } }).id).toBe(1);
  });

  test('returns SIGNAL ANALYST with raw_signal + market_intelligence', () => {
    const b = { raw_signal: { earned: true }, market_intelligence: { earned: true } };
    expect(rankFromBadges(b).title).toBe('SIGNAL ANALYST');
  });

  test('does not advance rank if market_intelligence is unearned', () => {
    const b = { raw_signal: { earned: true }, market_intelligence: { earned: false } };
    expect(rankFromBadges(b).title).toBe('DATA CADET');
  });

  test('returns SYSTEMS OPERATOR with three required badges', () => {
    const b = {
      raw_signal:          { earned: true },
      market_intelligence: { earned: true },
      full_clearance:      { earned: true },
    };
    expect(rankFromBadges(b).title).toBe('SYSTEMS OPERATOR');
  });

  test('returns DATA STRATEGIST with four required badges', () => {
    const b = {
      raw_signal:          { earned: true },
      market_intelligence: { earned: true },
      full_clearance:      { earned: true },
      impact_specialist:   { earned: true },
    };
    expect(rankFromBadges(b).title).toBe('DATA STRATEGIST');
  });

  test('returns INSIGHT ARCHITECT with all five required badges', () => {
    const b = {
      raw_signal:          { earned: true },
      market_intelligence: { earned: true },
      full_clearance:      { earned: true },
      impact_specialist:   { earned: true },
      method_mastery:      { earned: true },
    };
    expect(rankFromBadges(b).title).toBe('INSIGHT ARCHITECT');
    expect(rankFromBadges(b).id).toBe(5);
  });

  test('extra non-pathway badges do not affect rank calculation', () => {
    const b = {
      raw_signal:       { earned: true },
      precision_writer: { earned: true }, // not in pathway
      first_strike:     { earned: true }, // not in pathway
    };
    expect(rankFromBadges(b).title).toBe('DATA CADET');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// genCode
// ─────────────────────────────────────────────────────────────────────────────
describe('genCode', () => {

  test('returns a string of exactly 6 characters', () => {
    expect(genCode()).toHaveLength(6);
  });

  test('only contains valid characters from the charset', () => {
    const validCharset = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 50; i++) {
      expect(genCode()).toMatch(validCharset);
    }
  });

  test('never contains ambiguous characters O, I, 0, or 1', () => {
    const ambiguous = /[OI01]/;
    for (let i = 0; i < 50; i++) {
      expect(genCode()).not.toMatch(ambiguous);
    }
  });

  test('returns a string type', () => {
    expect(typeof genCode()).toBe('string');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// generateStudentId
// ─────────────────────────────────────────────────────────────────────────────
describe('generateStudentId', () => {

  test('converts a simple two-part name to lowercase with a hyphen', () => {
    expect(generateStudentId('Alex M')).toBe('alex-m');
  });

  test('handles multiple spaces', () => {
    expect(generateStudentId('Test Student 123')).toBe('test-student-123');
  });

  test('strips apostrophes and special characters', () => {
    expect(generateStudentId("O'Brien")).toBe('obrien');
  });

  test('strips parentheses', () => {
    // "Smith (Jon)" → lowercase → "smith (jon)"
    // replace spaces → "smith-(jon)"
    // strip non-alphanumeric non-hyphen → "smith-jon"
    expect(generateStudentId('Smith (Jon)')).toBe('smith-jon');
  });

  test('returns empty string for empty input', () => {
    expect(generateStudentId('')).toBe('');
  });

  test('handles a single word name', () => {
    expect(generateStudentId('Alice')).toBe('alice');
  });

  test('preserves numbers in the name', () => {
    expect(generateStudentId('Student 2')).toBe('student-2');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// calculateStats
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateStats', () => {

  test('returns all zeros for an empty class', () => {
    const result = calculateStats([]);
    expect(result.enrolled).toBe(0);
    expect(result.active).toBe(0);
    expect(result.totalBadges).toBe(0);
    expect(result.impactPct).toBe(0);
  });

  test('enrolled count equals the student array length', () => {
    const students = [{ badges: {} }, { badges: {} }, { badges: {} }];
    expect(calculateStats(students).enrolled).toBe(3);
  });

  test('active count only includes students active within 7 days', () => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const students = [
      { badges: {}, lastActive: { toMillis: () => now - (2 * DAY) } },   // 2 days ago — active
      { badges: {}, lastActive: { toMillis: () => now - (10 * DAY) } },  // 10 days ago — not active
      { badges: {} },                                                      // no lastActive — not active
    ];
    expect(calculateStats(students, now).active).toBe(1);
  });

  test('student active exactly at the 7-day boundary is not counted', () => {
    const now = Date.now();
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const students = [
      { badges: {}, lastActive: { toMillis: () => now - WEEK_MS } }, // exactly 7 days — boundary
    ];
    // now - weekMs === weekMs, which is NOT < weekMs, so not active
    expect(calculateStats(students, now).active).toBe(0);
  });

  test('totalBadges counts all earned badges across students', () => {
    const students = [
      { badges: { raw_signal: { earned: true }, market_intelligence: { earned: true } } },
      { badges: { raw_signal: { earned: true } } },
    ];
    expect(calculateStats(students).totalBadges).toBe(3);
  });

  test('unearned badges do not contribute to totalBadges', () => {
    const students = [
      { badges: { raw_signal: { earned: true }, market_intelligence: { earned: false } } },
    ];
    expect(calculateStats(students).totalBadges).toBe(1);
  });

  test('impactPct is 33 for 1 of 3 students (rounds down)', () => {
    const students = [
      { badges: { impact_specialist: { earned: true } } },
      { badges: {} },
      { badges: {} },
    ];
    expect(calculateStats(students).impactPct).toBe(33);
  });

  test('impactPct is 100 when all students have impact_specialist', () => {
    const students = [
      { badges: { impact_specialist: { earned: true } } },
      { badges: { impact_specialist: { earned: true } } },
    ];
    expect(calculateStats(students).impactPct).toBe(100);
  });

  test('impactPct is 0 when no students have impact_specialist', () => {
    const students = [{ badges: {} }, { badges: { raw_signal: { earned: true } } }];
    expect(calculateStats(students).impactPct).toBe(0);
  });

  test('impactPct rounds to nearest integer', () => {
    // 2 of 3 = 66.66... → rounds to 67
    const students = [
      { badges: { impact_specialist: { earned: true } } },
      { badges: { impact_specialist: { earned: true } } },
      { badges: {} },
    ];
    expect(calculateStats(students).impactPct).toBe(67);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// calculateAlerts
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateAlerts', () => {

  test('returns zeros for an empty class', () => {
    const result = calculateAlerts([]);
    expect(result.noBadges).toBe(0);
    expect(result.moduleOnlyCount).toBe(0);
    expect(result.impactMissers).toBe(0);
    expect(result.noImpactPct).toBe(0);
  });

  test('noBadges counts students with zero earned badges', () => {
    const students = [
      { badges: {} },                                    // 0 earned badges
      { badges: { raw_signal: { earned: true } } },     // 1 earned badge
      { badges: { raw_signal: { earned: false } } },    // 0 earned badges
    ];
    expect(calculateAlerts(students).noBadges).toBe(2);
  });

  test('moduleOnlyCount identifies students who have raw_signal but not market_intelligence', () => {
    const students = [
      { badges: { raw_signal: { earned: true } } },                                                             // stuck after module 1
      { badges: { raw_signal: { earned: true }, market_intelligence: { earned: true } } },                     // progressed
      { badges: {} },                                                                                           // no badges at all
    ];
    expect(calculateAlerts(students).moduleOnlyCount).toBe(1);
  });

  test('impactMissers counts students with badges but no impact_specialist', () => {
    const students = [
      { badges: { raw_signal: { earned: true } } },                                // has badge, no impact
      { badges: { raw_signal: { earned: true }, impact_specialist: { earned: true } } }, // has impact
      { badges: {} },                                                               // no badges — excluded from missers
    ];
    // impactMissers: student 1 (has badges, no impact_specialist)
    expect(calculateAlerts(students).impactMissers).toBe(1);
  });

  test('noImpactPct is correct for 1 impactMisser out of 3 students', () => {
    const students = [
      { badges: { raw_signal: { earned: true } } },
      { badges: { raw_signal: { earned: true }, impact_specialist: { earned: true } } },
      { badges: {} },
    ];
    // impactMissers = 1, total = 3, pct = round(1/3*100) = 33
    expect(calculateAlerts(students).noImpactPct).toBe(33);
  });

});
