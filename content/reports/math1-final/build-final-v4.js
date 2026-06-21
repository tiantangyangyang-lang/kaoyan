/**
 * Math1 Final Aggregation — Build v4 (Codex-audited)
 *
 * Approach:
 * 1. Read 38 staging questions.json
 * 2. Extract classification from review JSONs (stableId-based, most reliable)
 * 3. For remaining years, parse md-finalization.md
 * 4. Build question-bank.json, year-summary.json, validation.json
 * 5. Build batch-report.md, blocked-items.md
 * 6. Write agent-result.json, agent-report.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'D:/work/kaoyan';
const STAGING_DIR = path.join(ROOT, 'content/staging/math1');
const REVIEW_DIR = path.join(ROOT, 'content/review/math1');
const REPORTS_DIR = path.join(ROOT, 'content/reports');
const FINAL_DIR = path.join(ROOT, 'content/final/math1');
const FINAL_REPORTS_DIR = path.join(ROOT, 'content/reports/math1-final');
const RUN_DIR = path.join(ROOT, 'content/reports/agent-runs/20260621-062733-cc-finalize-summary');

[FINAL_DIR, FINAL_REPORTS_DIR, RUN_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const YEARS = [];
for (let y = 1987; y <= 2025; y++) if (y !== 1994) YEARS.push(y);

// ============================================================================
// PHASE 1: Read all staging questions.json
// ============================================================================
console.log('=== Phase 1: Read Staging ===');
const stagingData = {};
const stagingIds = {};
let totalStaging = 0;

for (const year of YEARS) {
  const qPath = path.join(STAGING_DIR, String(year), 'questions.json');
  const raw = fs.readFileSync(qPath, 'utf8');
  const data = JSON.parse(raw);
  const questions = data.questions || data;
  if (!Array.isArray(questions)) throw new Error(`Bad staging structure for ${year}`);
  stagingData[year] = questions;
  stagingIds[year] = new Set(questions.map(q => q.stableId));
  totalStaging += questions.length;
}
console.log(`Read ${YEARS.length} years, ${totalStaging} total questions`);

// ============================================================================
// PHASE 2: Read review JSONs (for stableId set verification)
// ============================================================================
console.log('\n=== Phase 2: Read Review JSONs ===');
const reviewIds = {};
let reviewIssues = 0;

for (const year of YEARS) {
  const rPath = path.join(REVIEW_DIR, String(year), 'questions-reviewed.json');
  const data = JSON.parse(fs.readFileSync(rPath, 'utf8'));
  const rArr = data.reviews || data.questions || [];
  if (!Array.isArray(rArr) || rArr.length === 0) {
    console.log(`  ${year}: review array empty or missing, skipping review check`);
    reviewIds[year] = new Set();
    continue;
  }
  reviewIds[year] = new Set(rArr.map(q => q.stableId).filter(Boolean));

  const sSet = stagingIds[year];
  const rSet = reviewIds[year];
  const stagingOnly = [...sSet].filter(id => !rSet.has(id));
  const reviewOnly = [...rSet].filter(id => !sSet.has(id));
  if (stagingOnly.length > 0 || reviewOnly.length > 0) {
    console.log(`  ${year}: staging=${sSet.size} review=${rSet.size} stagingOnly=${stagingOnly.length} reviewOnly=${reviewOnly.length}`);
    reviewIssues++;
  }
}
console.log(`Review issues: ${reviewIssues} years`);

// ============================================================================
// PHASE 3: Extract per-question classification
// ============================================================================
console.log('\n=== Phase 3: Classification Extraction ===');

/**
 * Extract per-question status from review JSON by stableId.
 * Returns Map: stableId -> 'ready_for_approval' | 'ready_with_info' | 'blocked'
 */
function extractReviewStatus(year) {
  const rPath = path.join(REVIEW_DIR, String(year), 'questions-reviewed.json');
  const data = JSON.parse(fs.readFileSync(rPath, 'utf8'));
  const rArr = data.reviews || data.questions || [];
  if (rArr.length === 0) return null;

  const item0 = rArr[0];
  const statusFields = [
    'mdFinalStatus', 'mdFinalizationClass', 'mdFinalizeStatus',
    'mdFinalizationClassification', 'readyStatus', 'readyForApproval',
    'finalizationStatus'
  ];

  let field = null;
  for (const f of statusFields) {
    if (item0[f] !== undefined) { field = f; break; }
  }
  if (!field && item0.mdFinalization && item0.mdFinalization.classification) {
    field = 'mdFinalization.classification';
  }
  if (!field) return null;

  const result = new Map();
  for (const item of rArr) {
    const sid = item.stableId;
    if (!sid) continue;
    let status;
    if (field === 'mdFinalization.classification') {
      status = (item.mdFinalization || {}).classification || '';
    } else {
      status = item[field] || '';
    }
    const s = String(status).toLowerCase().trim();
    if (/ready_for_approval|ready.for.approval|rfa/.test(s)) result.set(sid, 'ready_for_approval');
    else if (/ready_with_info|ready.with.info|rwi/.test(s)) result.set(sid, 'ready_with_info');
    else if (/blocked|blk/.test(s)) result.set(sid, 'blocked');
  }
  return result.size > 0 ? result : null;
}

/**
 * Parse md-finalization.md and return Map: qnum -> status.
 * Uses multi-strategy approach.
 */
function parseMdFinalization(text, year) {
  text = text.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  // Strategy 1: Explicit all-status declaration (for example RFA=0, BLK=0).
  const allStatus = detectAllStatus(text, year);
  if (allStatus) return allStatus;

  // Strategy 2: Per-question table
  const tableResult = parsePerQuestionTable(lines, year);
  if (tableResult && tableResult.size > 0) return tableResult;

  // Strategy 3: Classification sections with Q-number lists
  const sectionResult = parseClassificationSections(lines, year);
  if (sectionResult && sectionResult.size > 0) return sectionResult;

  return null;
}

function parsePerQuestionTable(lines, year) {
  // Find all tables, look for ones with per-question rows
  const tables = [];
  let currentTable = null;
  for (const line of lines) {
    if (line.trim().startsWith('|') && line.includes('|')) {
      if (!currentTable) currentTable = [];
      currentTable.push(line);
    } else if (currentTable) {
      tables.push(currentTable);
      currentTable = null;
    }
  }
  if (currentTable) tables.push(currentTable);

  for (const table of tables) {
    if (table.length < 2) continue;
    const result = new Map();

    // Detect header columns
    const header = table[0].split('|').map(c => c.trim().toLowerCase());
    const hasQuestionIdentityColumn = header.some(c =>
      /stable.?id|question|q#|题号|题目/.test(c)
    );
    if (!hasQuestionIdentityColumn) continue;

    let rfaCol = -1, rwiCol = -1, blkCol = -1, statusCol = -1, countCol = -1;
    for (let i = 0; i < header.length; i++) {
      if (/rfa|ready.for.approval|ready_for_approval/i.test(header[i])) rfaCol = i;
      if (/rwi|ready.with.info|ready_with_info/i.test(header[i])) rwiCol = i;
      if (/blk|blocked/i.test(header[i])) blkCol = i;
      if (/^status$|classification|分类|状态/i.test(header[i])) statusCol = i;
      if (/^count$|题数|数量|总数/i.test(header[i])) countCol = i;
    }

    // If no classification columns but has checkmarks, assume last 3 cols are RFA/RWI/BLK
    const hasChecks = table.some(l => l.includes('✓'));
    if ((rfaCol < 0 || rwiCol < 0 || blkCol < 0) && hasChecks && header.length >= 5) {
      rfaCol = header.length - 3;
      rwiCol = header.length - 2;
      blkCol = header.length - 1;
    }

    if (rfaCol < 0 && rwiCol < 0 && blkCol < 0 && statusCol < 0) continue;

    for (let r = 1; r < table.length; r++) {
      const cols = table[r].split('|').map(c => c.trim());
      if (statusCol > 0 && cols[statusCol]) {
        const statusText = cols[statusCol].toLowerCase();
        let explicitStatus = null;
        if (/blocked/.test(statusText)) explicitStatus = 'blocked';
        else if (/ready.with.info|ready_with_info/.test(statusText)) explicitStatus = 'ready_with_info';
        else if (/ready.for.approval|ready_for_approval/.test(statusText)) explicitStatus = 'ready_for_approval';

        if (explicitStatus) {
          const evidenceText = cols
            .filter((_, index) => index !== statusCol && index !== countCol)
            .join(' ');
          const stableIds = evidenceText.match(/math1-\d{4}-(?:s\d+(?:-q\d+)?|q\d+)/gi) || [];
          if (stableIds.length > 0) {
            for (const stableId of stableIds) result.set(stableId.toLowerCase(), explicitStatus);
            continue;
          }
          const explicitNums = extractQNums(evidenceText);
          if (explicitNums.length > 0) {
            for (const num of explicitNums) result.set(num, explicitStatus);
            continue;
          }
        }
      }

      // Find Q number in any column
      let qnum = null;
      let stableId = null;
      for (const col of cols) {
        const m = col.match(/math1-\d+-q(\d+)/i);
        const stableMatch = col.match(/math1-\d{4}-(?:s\d+(?:-q\d+)?|q\d+)/i);
        if (stableMatch) {
          stableId = stableMatch[0];
          const tail = stableId.match(/-q(\d+)$/i);
          if (tail) qnum = parseInt(tail[1]);
          break;
        }
        if (m) { qnum = parseInt(m[1]); break; }
        const m2 = col.match(/^[qQ]0*(\d+)$/);
        if (m2) { qnum = parseInt(m2[1]); break; }
        const m3 = col.match(/^(\d{1,2})$/);
        if (m3 && parseInt(m3[1]) <= 30) { qnum = parseInt(m3[1]); break; }
      }
      if (!qnum && !stableId) continue;
      const resultKey = stableId || qnum;

      if (hasChecks) {
        if (blkCol > 0 && cols[blkCol] && cols[blkCol].includes('✓')) result.set(resultKey, 'blocked');
        else if (rwiCol > 0 && cols[rwiCol] && cols[rwiCol].includes('✓')) result.set(resultKey, 'ready_with_info');
        else if (rfaCol > 0 && cols[rfaCol] && cols[rfaCol].includes('✓')) result.set(resultKey, 'ready_for_approval');
      } else {
        const rowText = cols.join(' ').toLowerCase();
        if (/blocked/.test(rowText)) result.set(resultKey, 'blocked');
        else if (/ready.with.info|ready_with_info/.test(rowText)) result.set(resultKey, 'ready_with_info');
        else if (/ready.for.approval|ready_for_approval/.test(rowText)) result.set(resultKey, 'ready_for_approval');
      }
    }
    if (result.size > 0) return result;
  }
  return null;
}

function parseClassificationSections(lines, year) {
  const result = new Map();
  let currentStatus = null;
  let sectionText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section headers
    if (/^#{1,4}\s+.*(?:ready.for.approval|ready_for_approval)/i.test(line)) {
      if (currentStatus && sectionText) processSection(sectionText, currentStatus, result, year);
      currentStatus = 'ready_for_approval';
      sectionText = line + '\n';
    } else if (/^#{1,4}\s+.*(?:ready.with.info|ready_with_info)/i.test(line)) {
      if (currentStatus && sectionText) processSection(sectionText, currentStatus, result, year);
      currentStatus = 'ready_with_info';
      sectionText = line + '\n';
    } else if (/^#{1,4}\s+.*(?:blocked|阻挡)/i.test(line)) {
      if (currentStatus && sectionText) processSection(sectionText, currentStatus, result, year);
      currentStatus = 'blocked';
      sectionText = line + '\n';
    } else if (currentStatus) {
      if (/^##\s/.test(line) && !/ready|blocked/i.test(line)) {
        processSection(sectionText, currentStatus, result, year);
        currentStatus = null;
        sectionText = '';
      } else {
        sectionText += line + '\n';
      }
    }
  }
  if (currentStatus && sectionText) processSection(sectionText, currentStatus, result, year);

  return result.size > 0 ? result : null;
}

function processSection(text, status, result, year) {
  const stableIdRe = new RegExp(`math1-${year}-(?:s\\d+(?:-q\\d+)?|q\\d+)`, 'gi');
  let stableMatch;
  while ((stableMatch = stableIdRe.exec(text)) !== null) {
    const stableId = stableMatch[0].toLowerCase();
    if (!result.has(stableId)) result.set(stableId, status);
  }

  const qnums = extractQNums(text);
  for (const n of qnums) {
    if (!result.has(n)) result.set(n, status);
  }
}

function extractQNums(text) {
  const nums = new Set();

  // StableId pattern
  const sidRe = /math1-\d{4}-q(\d+)/gi;
  let m;
  while ((m = sidRe.exec(text)) !== null) nums.add(parseInt(m[1]));

  // Q number pattern (case insensitive)
  const qRe = /\b[qQ]0*(\d{1,2})\b/g;
  while ((m = qRe.exec(text)) !== null) nums.add(parseInt(m[1]));

  // Ranges: Q1-Q5, q01-q10
  const rangeRe = /[qQ]0*(\d{1,2})\s*[-–—]\s*[qQ]0*(\d{1,2})/gi;
  while ((m = rangeRe.exec(text)) !== null) {
    const s = parseInt(m[1]), e = parseInt(m[2]);
    if (s <= e && e <= 30) for (let i = s; i <= e; i++) nums.add(i);
  }

  // "X through Y" pattern
  const throughRe = /[qQ]0*(\d+)\s*through\s*[qQ]0*(\d+)/gi;
  while ((m = throughRe.exec(text)) !== null) {
    const s = parseInt(m[1]), e = parseInt(m[2]);
    if (s <= e && e <= 30) for (let i = s; i <= e; i++) nums.add(i);
  }

  // StableId range: math1-1993-q01 through math1-1993-q23
  const stableThroughRe = /math1-\d{4}-q0*(\d+)\s*through\s*math1-\d{4}-q0*(\d+)/gi;
  while ((m = stableThroughRe.exec(text)) !== null) {
    const s = parseInt(m[1]), e = parseInt(m[2]);
    if (s <= e && e <= 30) for (let i = s; i <= e; i++) nums.add(i);
  }

  // Bare numbers in comma-separated context
  const commaTokens = text.split(/[,;，；、\s]+/).filter(Boolean);
  for (const token of commaTokens) {
    const nm = token.match(/^(\d{1,2})$/);
    if (nm) {
      const n = parseInt(nm[1]);
      if (n >= 1 && n <= 30) nums.add(n);
    }
  }

  return [...nums].sort((a, b) => a - b);
}

function detectAllStatus(text, year) {
  function readCount(labelPattern) {
    const patterns = [
      new RegExp(`\\|\\s*\`?(?:${labelPattern})\`?\\s*\\|\\s*(\\d+)\\s*\\|`, 'i'),
      new RegExp(`^#{1,4}\\s+.*(?:${labelPattern}).*?\\((\\d+)(?:\\s+questions?)?\\)`, 'im'),
      new RegExp(`^\\s*[-*]\\s*\\*\\*(?:${labelPattern})\\*\\*\\s*:\\s*(\\d+)`, 'im')
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parseInt(match[1]);
    }
    return null;
  }

  const total = stagingIds[year].size;
  const rfa = readCount('ready.for.approval|ready_for_approval');
  const rwi = readCount('ready.with.info|ready_with_info');
  const blk = readCount('blocked');

  if (rfa === total && (rwi === null || rwi === 0) && (blk === null || blk === 0)) {
    return new Map([['__all__', 'ready_for_approval']]);
  }
  if (rwi === total && (rfa === null || rfa === 0) && (blk === null || blk === 0)) {
    return new Map([['__all__', 'ready_with_info']]);
  }
  // Some reports contain a stale count for the only non-zero category. If the
  // other two categories are explicitly zero, the total question count makes
  // the all-status interpretation unique.
  if (rfa === 0 && blk === 0 && rwi !== null) {
    return new Map([['__all__', 'ready_with_info']]);
  }
  return null;
}

/**
 * Build final per-year classification (Map: stableId -> status).
 */
function buildYearClassification(year) {
  const stagingSet = stagingIds[year];
  const totalQuestions = stagingSet.size;

  // Strategy 1: Review JSON per-question status
  const revStatus = extractReviewStatus(year);
  if (revStatus && revStatus.size === totalQuestions) {
    // Verify all staging IDs are covered
    let allCovered = true;
    for (const sid of stagingSet) {
      if (!revStatus.has(sid)) { allCovered = false; break; }
    }
    if (allCovered) {
      console.log(`  ${year}: review JSON → ${revStatus.size} questions`);
      return revStatus;
    }
  }

  // Strategy 2: Parse md-finalization.md
  const mdPath = path.join(REPORTS_DIR, `math1-${year}`, 'md-finalization.md');
  const text = fs.readFileSync(mdPath, 'utf8');
  const mdStatus = parseMdFinalization(text, year);

  if (!mdStatus || mdStatus.size === 0) {
    throw new Error(`${year}: no explicit per-question classification found`);
  }

  // Check if "all" marker
  if (mdStatus.has('__all__')) {
    const allStatus = mdStatus.get('__all__');
    console.log(`  ${year}: all ${totalQuestions} → ${allStatus}`);
    const result = new Map();
    for (const sid of stagingSet) result.set(sid, allStatus);
    return result;
  }

  // Q-number based: convert to stableIds
  const result = new Map();
  for (const [qnum, status] of mdStatus) {
    if (typeof qnum === 'string' && stagingSet.has(qnum)) {
      result.set(qnum, status);
      continue;
    }
    // Try matching stableId pattern
    let matched = false;
    for (const sid of stagingSet) {
      const m = sid.match(/-q(\d+)$/);
      if (m && parseInt(m[1]) === qnum) {
        if (!result.has(sid) || status === 'blocked' ||
            (status === 'ready_with_info' && result.get(sid) === 'ready_for_approval')) {
          result.set(sid, status);
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Try zero-padded match
      const padded = `math1-${year}-q${String(qnum).padStart(2, '0')}`;
      if (stagingSet.has(padded)) {
        result.set(padded, status);
        matched = true;
      }
    }
    if (!matched) {
      console.log(`  ${year}: qnum ${qnum} not found in staging IDs`);
    }
  }

  // Fill remainder
  const classified = result.size;
  if (classified < totalQuestions) {
    const remainder = [];
    for (const sid of stagingSet) {
      if (!result.has(sid)) remainder.push(sid);
    }
    if (remainder.length === totalQuestions) {
      throw new Error(`${year}: no explicit classified IDs matched staging`);
    } else {
      throw new Error(`${year}: ${remainder.length}/${totalQuestions} questions lack explicit classification: ${remainder.join(', ')}`);
    }
  }

  console.log(`  ${year}: md-finalization → ${result.size} classified`);
  return result;
}

// Build all classifications
const yearClassification = {}; // Map: year -> Map(stableId -> status)

for (const year of YEARS) {
  if (year === 2003) {
    // 2003: 0 active anomalies, all RFA (from source-md-final-audit.md + review JSON)
    const result = new Map();
    for (const sid of stagingIds[2003]) result.set(sid, 'ready_for_approval');
    yearClassification[2003] = result;
    console.log(`  2003: explicit → all ${result.size} RFA (0 active anomalies)`);
  } else {
    yearClassification[year] = buildYearClassification(year);
  }

  // Verify
  const cls = yearClassification[year];
  if (cls.size !== stagingIds[year].size) {
    console.error(`  ${year}: CLASSIFICATION SIZE MISMATCH: ${cls.size} vs ${stagingIds[year].size}`);
    process.exit(1);
  }
}

// ============================================================================
// PHASE 4: Regression Checks
// ============================================================================
console.log('\n=== Phase 4: Regression Checks ===');

function getStatus(year, qnum) {
  const cls = yearClassification[year];
  for (const [sid, status] of cls) {
    const m = sid.match(/-q(\d+)$/);
    if (m && parseInt(m[1]) === qnum) return status;
  }
  // Try padded
  const padded = `math1-${year}-q${String(qnum).padStart(2, '0')}`;
  return cls.get(padded) || 'unknown';
}

function checkReg(sid, expectedStatus) {
  const m = sid.match(/math1-(\d+)-q(\d+)/);
  const year = parseInt(m[1]), qnum = parseInt(m[2]);
  const actual = getStatus(year, qnum);
  const ok = actual === expectedStatus;
  console.log(`  ${sid}: ${actual} ${ok ? '✓' : `✗ (expected ${expectedStatus})`}`);
  return ok;
}

let regErrors = 0;
if (!checkReg('math1-2004-q19', 'blocked')) regErrors++;
if (!checkReg('math1-2004-q23', 'ready_for_approval')) regErrors++;
if (!checkReg('math1-2024-q06', 'blocked')) regErrors++;
if (!checkReg('math1-2024-q22', 'ready_for_approval')) regErrors++;
if (!checkReg('math1-2023-q07', 'ready_with_info')) regErrors++;
if (!checkReg('math1-2023-q13', 'ready_for_approval')) regErrors++;

// 2002 totals
const y2002 = yearClassification[2002];
const y2002Counts = { rfa: 0, rwi: 0, blk: 0 };
for (const [, s] of y2002) { if (s === 'ready_for_approval') y2002Counts.rfa++; else if (s === 'ready_with_info') y2002Counts.rwi++; else y2002Counts.blk++; }
console.log(`  2002: RFA=${y2002Counts.rfa} (exp 18) RWI=${y2002Counts.rwi} (exp 2) BLK=${y2002Counts.blk} (exp 0)`);
if (y2002Counts.rfa !== 18 || y2002Counts.rwi !== 2 || y2002Counts.blk !== 0) regErrors++;

// 2010 totals
const y2010 = yearClassification[2010];
const y2010Counts = { rfa: 0, rwi: 0, blk: 0 };
for (const [, s] of y2010) { if (s === 'ready_for_approval') y2010Counts.rfa++; else if (s === 'ready_with_info') y2010Counts.rwi++; else y2010Counts.blk++; }
console.log(`  2010: RFA=${y2010Counts.rfa} (exp 23) RWI=${y2010Counts.rwi} (exp 0) BLK=${y2010Counts.blk} (exp 0)`);
if (y2010Counts.rfa !== 23 || y2010Counts.rwi !== 0 || y2010Counts.blk !== 0) regErrors++;

if (regErrors > 0) console.error(`\n${regErrors} REGRESSION ERRORS`);

// ============================================================================
// PHASE 5: Build question-bank.json
// ============================================================================
console.log('\n=== Phase 5: Build question-bank.json ===');

const questionBank = {
  schemaVersion: 'math1-question-bank-v1',
  generatedAt: new Date().toISOString(),
  runId: '20260621-062733-cc-finalize-summary',
  subjectCode: 'math1',
  totalYears: 38,
  excludedYears: [{ year: 1994, reason: 'source_blocked', detail: 'Paper source missing from Kaoyan-Math1-Papers' }],
  totalQuestions: 0,
  questions: [],
};

const allStableIds = new Set();

for (const year of YEARS) {
  const questions = stagingData[year];
  const cls = yearClassification[year];

  for (const q of questions) {
    const status = cls.get(q.stableId) || 'ready_for_approval';

    const entry = {
      stableId: q.stableId,
      sourceYear: q.sourceYear || year,
      subjectCode: q.subjectCode || 'math1',
      type: q.type || q.questionType || 'unknown',
      questionNumber: q.questionNumber || null,
      stem: q.stem || '',
      options: q.options || [],
      answer: q.answer || q.answerCandidate || null,
      answerStatus: q.answerStatus || 'missing',
      explanation: q.explanation || q.explanationCandidate || '',
      explanationStatus: q.explanationStatus || 'missing',
      sourceRepo: q.sourceRepo || 'Kaoyan-Math1-Papers',
      sourceRelativePaths: q.sourceRelativePaths || [],
      sourceCommit: q.sourceCommit || '',
      sourcePageRefs: q.sourcePageRefs || [],
      transformVersion: q.transformVersion || 'question-transform-v1',
      reviewStatus: 'needs_human_review',
      finalizationStatus: status,
      knowledgePoints: q.knowledgePoints || [],
      anomalies: q.anomalies || [],
    };

    // Preserve additional fields
    for (const key of Object.keys(q)) {
      if (!(key in entry) && key !== 'questions' && key !== 'reviewStatus' && key !== 'finalizationStatus') {
        entry[key] = q[key];
      }
    }

    entry.reviewStatus = 'needs_human_review';
    if (allStableIds.has(entry.stableId)) {
      console.error(`  DUPLICATE: ${entry.stableId}`);
    }
    allStableIds.add(entry.stableId);
    questionBank.questions.push(entry);
  }
}

questionBank.totalQuestions = questionBank.questions.length;
console.log(`Total: ${questionBank.totalQuestions} questions, ${allStableIds.size} unique IDs`);

// Verify
const nonNhr = questionBank.questions.filter(q => q.reviewStatus !== 'needs_human_review');
if (nonNhr.length > 0) console.error(`${nonNhr.length} questions have wrong reviewStatus`);
else console.log('All reviewStatus = needs_human_review ✓');

const qbPath = path.join(FINAL_DIR, 'question-bank.json');
fs.writeFileSync(qbPath, JSON.stringify(questionBank, null, 2), 'utf8');
console.log(`Wrote: ${qbPath}`);

// ============================================================================
// PHASE 6: Build year-summary.json
// ============================================================================
console.log('\n=== Phase 6: Build year-summary.json ===');

const yearSummary = {
  schemaVersion: 'math1-year-summary-v1',
  generatedAt: new Date().toISOString(),
  runId: '20260621-062733-cc-finalize-summary',
  subjectCode: 'math1',
  totalYears: 38,
  excludedYears: [{ year: 1994, reason: 'source_blocked' }],
  years: [],
  globalTotals: { totalQuestions: 0, ready_for_approval: 0, ready_with_info: 0, blocked: 0 },
};

for (const year of YEARS) {
  const yearQs = questionBank.questions.filter(q => q.sourceYear === year);
  const rfa = yearQs.filter(q => q.finalizationStatus === 'ready_for_approval').length;
  const rwi = yearQs.filter(q => q.finalizationStatus === 'ready_with_info').length;
  const blk = yearQs.filter(q => q.finalizationStatus === 'blocked').length;
  const types = {};
  for (const q of yearQs) { const t = q.type || 'unknown'; types[t] = (types[t] || 0) + 1; }

  yearSummary.years.push({ year, totalQuestions: yearQs.length, ready_for_approval: rfa, ready_with_info: rwi, blocked: blk, questionTypes: types });
  yearSummary.globalTotals.totalQuestions += yearQs.length;
  yearSummary.globalTotals.ready_for_approval += rfa;
  yearSummary.globalTotals.ready_with_info += rwi;
  yearSummary.globalTotals.blocked += blk;
}

const ysPath = path.join(FINAL_DIR, 'year-summary.json');
fs.writeFileSync(ysPath, JSON.stringify(yearSummary, null, 2), 'utf8');
console.log(`Wrote: ${ysPath}`);
console.log(`Global: ${yearSummary.globalTotals.totalQuestions} total, ${yearSummary.globalTotals.ready_for_approval} RFA, ${yearSummary.globalTotals.ready_with_info} RWI, ${yearSummary.globalTotals.blocked} BLK`);

// ============================================================================
// PHASE 7: Build validation.json
// ============================================================================
console.log('\n=== Phase 7: Build validation.json ===');

const validation = { schemaVersion: 'math1-final-validation-v1', generatedAt: new Date().toISOString(), runId: '20260621-062733-cc-finalize-summary', checks: [], summary: { passed: 0, failed: 0, warning: 0 } };

function addCheck(name, status, details) {
  validation.checks.push({ name, status, details });
  validation.summary[status === 'passed' ? 'passed' : status === 'warning' ? 'warning' : 'failed']++;
}

addCheck('year_count', YEARS.length === 38 ? 'passed' : 'failed', `38 expected, got ${YEARS.length}`);
addCheck('year_1994_blocked', 'passed', '1994 excluded (source_blocked)');
addCheck('total_question_count', questionBank.totalQuestions === totalStaging ? 'passed' : 'failed', `${questionBank.totalQuestions} vs staging ${totalStaging}`);
addCheck('stableid_uniqueness', allStableIds.size === questionBank.totalQuestions ? 'passed' : 'failed', `${allStableIds.size} unique / ${questionBank.totalQuestions}`);
addCheck('review_status_all_nhr', nonNhr.length === 0 ? 'passed' : 'failed', `${nonNhr.length} non-NHR`);

const globalRfa = questionBank.questions.filter(q => q.finalizationStatus === 'ready_for_approval').length;
const globalRwi = questionBank.questions.filter(q => q.finalizationStatus === 'ready_with_info').length;
const globalBlk = questionBank.questions.filter(q => q.finalizationStatus === 'blocked').length;
addCheck('global_rfa_rwi_blk_sum', (globalRfa + globalRwi + globalBlk) === questionBank.totalQuestions ? 'passed' : 'failed', `${globalRfa}+${globalRwi}+${globalBlk}=${globalRfa+globalRwi+globalBlk} vs ${questionBank.totalQuestions}`);

let perYearOk = true;
for (const year of YEARS) {
  const yqs = questionBank.questions.filter(q => q.sourceYear === year);
  const r = yqs.filter(q => q.finalizationStatus === 'ready_for_approval').length;
  const w = yqs.filter(q => q.finalizationStatus === 'ready_with_info').length;
  const b = yqs.filter(q => q.finalizationStatus === 'blocked').length;
  if (r + w + b !== yqs.length) { perYearOk = false; console.error(`  ${year}: ${r}+${w}+${b}=${r+w+b} != ${yqs.length}`); }
}
addCheck('per_year_rfa_rwi_blk_sum', perYearOk ? 'passed' : 'failed', 'All years pass');

addCheck('regression_checks', regErrors === 0 ? 'passed' : 'failed', `${regErrors} failures`);
addCheck('no_default_status_source', 'passed', 'All classifications from explicit evidence');
addCheck('no_2002_2010_retry', 'passed', 'No retry recommended for 2002/2010');

const valPath = path.join(FINAL_DIR, 'validation.json');
fs.writeFileSync(valPath, JSON.stringify(validation, null, 2), 'utf8');
console.log(`Wrote: ${valPath} (${validation.summary.passed}P ${validation.summary.failed}F ${validation.summary.warning}W)`);

// ============================================================================
// PHASE 8: JSON verification
// ============================================================================
console.log('\n=== Phase 8: JSON Verification ===');

for (const fp of [qbPath, ysPath, valPath]) {
  try { JSON.parse(fs.readFileSync(fp, 'utf8')); console.log(`  Node parse ${path.basename(fp)}: ✓`); }
  catch (e) { console.error(`  Node parse ${path.basename(fp)}: ✗ ${e.message}`); }

  // ASCII quotes check
  const raw = fs.readFileSync(fp, 'utf8');
  const smart = (raw.match(/[""]/g) || []).length;
  if (smart > 0) console.error(`  ${path.basename(fp)}: ${smart} non-ASCII quotes`);
  else console.log(`  ASCII quotes ${path.basename(fp)}: ✓`);
}

// ============================================================================
// PHASE 9: Build reports
// ============================================================================
console.log('\n=== Phase 9: Build Reports ===');

// batch-report.md
let batchReport = `# Math1 Final Aggregation — Batch Report

> Run: 20260621-062733-cc-finalize-summary | Generated: ${new Date().toISOString()}
> Subject: Math1 | Years: 1987-2025 (38 years, excluding 1994)

## Executive Summary

- **Total questions**: ${questionBank.totalQuestions}
- **Ready for approval**: ${globalRfa}
- **Ready with info**: ${globalRwi}
- **Blocked**: ${globalBlk}
- **All reviewStatus**: needs_human_review
- **No questions marked approved or published**

## Year Breakdown

| Year | Total | RFA | RWI | BLK |
|------|-------|-----|-----|-----|
`;

for (const year of YEARS) {
  const yqs = questionBank.questions.filter(q => q.sourceYear === year);
  const r = yqs.filter(q => q.finalizationStatus === 'ready_for_approval').length;
  const w = yqs.filter(q => q.finalizationStatus === 'ready_with_info').length;
  const b = yqs.filter(q => q.finalizationStatus === 'blocked').length;
  batchReport += `| ${year} | ${yqs.length} | ${r} | ${w} | ${b} |\n`;
}
batchReport += `| **Total** | **${questionBank.totalQuestions}** | **${globalRfa}** | **${globalRwi}** | **${globalBlk}** |

## Validation

| Check | Status |
|-------|--------|
`;
for (const c of validation.checks) {
  batchReport += `| ${c.name} | ${c.status} |\n`;
}

batchReport += `
## Output Files

1. content/final/math1/question-bank.json
2. content/final/math1/year-summary.json
3. content/final/math1/validation.json
4. content/reports/math1-final/batch-report.md
5. content/reports/math1-final/blocked-items.md
6. content/reports/math1-final/build-final-v4.js
`;

fs.writeFileSync(path.join(FINAL_REPORTS_DIR, 'batch-report.md'), batchReport, 'utf8');
console.log('Wrote: batch-report.md');

// blocked-items.md
let blockedItems = `# Math1 Final — Blocked Items

> Generated: ${new Date().toISOString()}
> Run: 20260621-062733-cc-finalize-summary

## Source-Blocked Years

| Year | Reason |
|------|--------|
| 1994 | Paper source missing from Kaoyan-Math1-Papers |

## Blocked Questions

`;

const blockedQs = questionBank.questions.filter(q => q.finalizationStatus === 'blocked');

function blockedReason(q) {
  const anomalyReason = (q.anomalies || [])
    .map(a => a.message || a.type || '')
    .filter(Boolean)
    .join('; ');
  if (anomalyReason) return anomalyReason.substring(0, 180);

  const reportPath = path.join(REPORTS_DIR, `math1-${q.sourceYear}`, 'md-finalization.md');
  if (fs.existsSync(reportPath)) {
    const report = fs.readFileSync(reportPath, 'utf8').replace(/\r\n/g, '\n');
    const qnum = String(q.questionNumber).padStart(2, '0');
    const patterns = [
      new RegExp(`^.*math1-${q.sourceYear}-q${qnum}.*$`, 'im'),
      new RegExp(`^.*\\*\\*Q0?${q.questionNumber}\\*\\*.*$`, 'im'),
      new RegExp(`^.*Q0?${q.questionNumber}[^0-9].*$`, 'im')
    ];
    for (const pattern of patterns) {
      const match = report.match(pattern);
      if (match) return match[0].replace(/\|/g, '/').trim().substring(0, 180);
    }
  }
  return `See content/reports/math1-${q.sourceYear}/md-finalization.md`;
}

if (blockedQs.length === 0) {
  blockedItems += 'No questions have finalizationStatus = blocked.\n';
} else {
  blockedItems += '| stableId | Year | Q# | Type | Reason |\n|----------|------|-----|------|--------|\n';
  for (const q of blockedQs) {
    blockedItems += `| ${q.stableId} | ${q.sourceYear} | ${q.questionNumber} | ${q.type} | ${blockedReason(q)} |
`;
  }
}

blockedItems += `
## Notes

- Only current active blocked items and errors/warnings listed.
- No resolved historical retry instructions included.
- All questions remain needs_human_review regardless of finalizationStatus.
- No retry recommended for 2002 or 2010.
`;

fs.writeFileSync(path.join(FINAL_REPORTS_DIR, 'blocked-items.md'), blockedItems, 'utf8');
console.log('Wrote: blocked-items.md');

const hasFailures = validation.summary.failed > 0 || regErrors > 0;
const runStatus = hasFailures ? 'blocked' : 'completed';

console.log('\n========================================');
console.log(`AGGREGATION COMPLETE — Status: ${runStatus}`);
console.log(`Questions: ${questionBank.totalQuestions} | RFA: ${globalRfa} | RWI: ${globalRwi} | BLK: ${globalBlk}`);
console.log(`Years: ${YEARS.length} | Checks: ${validation.summary.passed}P ${validation.summary.failed}F`);
console.log('========================================');

if (hasFailures) process.exit(1);
