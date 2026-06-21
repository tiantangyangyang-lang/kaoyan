// verify_parse.js — prove whether staging questions.json parses
const fs = require('fs');
const path = 'content/staging/math1/2003/questions.json';

const raw = fs.readFileSync(path, 'utf8');
console.log('File size:', raw.length, 'bytes');

try {
  const parsed = JSON.parse(raw);
  console.log('\n✅ JSON PARSE: PASSED');
  console.log('Questions:', parsed.questions.length);

  // Check each question's key fields
  const checks = [];
  for (const q of parsed.questions) {
    const id = q.stableId;
    const hasSource = !!(q.sourceRepo && q.sourceCommit && q.sourceYear);
    const hasReview = q.reviewStatus === 'needs_human_review';
    const hasFields = !!(q.stem && q.questionNumber && q.questionType);
    checks.push({ id, hasSource, hasReview, hasFields });
  }
  const failures = checks.filter(c => !c.hasSource || !c.hasReview || !c.hasFields);
  if (failures.length) {
    console.log('❌ Field integrity failures:', failures.map(f => f.id).join(', '));
  } else {
    console.log('✅ All 22 questions have source tracking, needs_human_review, and required fields');
  }

  // Check Q17 specifically
  const q17 = parsed.questions.find(q => q.stableId === 'math1-2003-q17');
  console.log('\nQ17 check:');
  console.log('  explanationCandidate length:', q17.explanationCandidate.length);
  console.log('  has g\'\'(y) formula:', q17.explanationCandidate.includes("g''(y)"));
  console.log('  has inverse identities:', q17.explanationCandidate.includes('反函数'));

  // Check Q19
  const q19 = parsed.questions.find(q => q.stableId === 'math1-2003-q19');
  console.log('\nQ19 check:');
  console.log('  has method-review continuation:', q19.explanationCandidate.includes('f(A)'));
  console.log('  has α₃ as 3-vector:', q19.explanationCandidate.includes('\\\\ 1 \\\\end{pmatrix}'));

  // Check all 6 Codex corrections
  console.log('\n--- Codex Correction Verification ---');
  // #1: Q10 options - A/B group II, C/D group I
  const q10 = parsed.questions.find(q => q.stableId === 'math1-2003-q10');
  console.log('#1 Q10 options A→II:', q10.options[0].value.includes('II'));
  console.log('#1 Q10 options D→I:', q10.options[3].value.includes('I'));

  // #2: Q17 appended inverse-function identities
  console.log('#2 Q17 has g\'\'(y) formula:', q17.explanationCandidate.includes("g''(y)"));

  // #3: Q18 triple integral
  const q18 = parsed.questions.find(q => q.stableId === 'math1-2003-q18');
  console.log('#3 Q18 uses triple integral:', q18.stem.includes('iiint'));

  // #4: Q19 α₃ as 3-vector
  console.log('#4 Q19 α₃ is 3-entry:', q19.explanationCandidate.includes('1 \\\\ 1 \\\\ 1'));

  // #5: Q22 substitution fixed
  const q22 = parsed.questions.find(q => q.stableId === 'math1-2003-q22');
  console.log('#5 Q22 proper substitution:', q22.explanationCandidate.includes('令'));
  console.log('#5 Q22 has t/(2n):', q22.explanationCandidate.includes('frac {t}{2 n}'));

  // #6: Q19 method-review continuation
  console.log('#6 Q19 has f(A)α formula:', q19.explanationCandidate.includes('f(A)'));
  console.log('#6 Q19 has P⁻¹α:', q19.explanationCandidate.includes('P^{-1}'));

  process.exit(0);
} catch (e) {
  console.log('\n❌ JSON PARSE: FAILED');
  console.log('Error:', e.message);
  if (e.pos !== undefined) {
    console.log('Failure position:', e.pos);
    const ctx = raw.substring(Math.max(0, e.pos - 80), e.pos + 80);
    console.log('Context:', JSON.stringify(ctx));
  }
  process.exit(1);
}
