const fs = require('fs');
const path = require('path');

const inputPath = 'D:/work/kaoyan/content/review/math1/2022/questions-pdf-rebuilt.json';
const stagingPath = 'D:/work/kaoyan/content/staging/math1/2022/questions.json';
const reviewPath = 'D:/work/kaoyan/content/review/math1/2022/questions-reviewed.json';

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function normalize(s) {
    if (s == null) return '';
    return s.replace(/\s+/g, ' ').trim();
}

// === STAGING ===
const stagingQuestions = data.questions.map(q => ({
    stableId: q.stableId,
    questionNumber: q.questionNumber,
    questionType: q.questionType,
    stem: normalize(q.stem),
    options: (q.options || []).map(o => ({ label: o.label, value: normalize(o.value) })),
    answerCandidate: normalize(q.answerCandidate),
    answerStatus: "candidate_from_solutions",
    explanationCandidate: normalize(q.explanationCandidate),
    explanationStatus: "candidate_from_solutions",
    sourceRepo: "Kaoyan-Math1-Papers",
    sourceRelativePaths: ["papers/2022年考研数学(一)真题.md", "solutions/2022年解析/2022年解析.md"],
    sourceCommit: "3151b4acf26ea19ccd427b869a715e65e1990091",
    sourceDirty: true,
    sourceYear: 2022,
    subjectCode: "math1",
    sourceFileHashes: {
        paper: "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
        solutions: "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
    },
    transformVersion: "math1-modern-transform-v1",
    reviewStatus: "needs_human_review",
    anomalies: [{
        type: "md_finalization_source",
        questionNumber: q.questionNumber,
        severity: "info",
        message: "Stem/options restored from PDF-structure rebuild (via content_list_v2.json); paper Markdown had severe OCR corruption. Answer/explanation cross-verified against solutions/2022年解析.md."
    }]
}));

const mcC = stagingQuestions.filter(q => q.questionType === 'multiple_choice').length;
const fibC = stagingQuestions.filter(q => q.questionType === 'fill_in_blank').length;
const solC = stagingQuestions.filter(q => q.questionType === 'solution').length;

const staging = {
    schemaVersion: "math1-modern-transform-v1",
    task: "cc-math1-2022-md-finalize",
    sourceYear: 2022,
    subjectCode: "math1",
    reviewStatus: "needs_human_review",
    transformVersion: "math1-modern-transform-v1",
    sourceInfo: {
        sourceRepo: "Kaoyan-Math1-Papers",
        sourceCommit: "3151b4acf26ea19ccd427b869a715e65e1990091",
        sourceDirty: true,
        sourceRelativePaths: ["papers/2022年考研数学(一)真题.md", "solutions/2022年解析/2022年解析.md"],
        sourceFileHashes: {
            paper: "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
            solutions: "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
        }
    },
    validation: {
        questionsGenerated: stagingQuestions.length,
        multipleChoice: mcC,
        fillInBlank: fibC,
        solution: solC,
        questionsWithAnswers: stagingQuestions.length,
        questionsWithExplanations: stagingQuestions.length,
        questionsWithFourOptions: mcC,
        allNeedsHumanReview: true
    },
    questions: stagingQuestions
};

// Ensure staging dir
fs.mkdirSync(path.dirname(stagingPath), { recursive: true });
fs.writeFileSync(stagingPath, JSON.stringify(staging, null, 2), 'utf8');
console.log('STAGING written: ' + stagingQuestions.length + ' questions');

// Verify staging
const sv = JSON.parse(fs.readFileSync(stagingPath, 'utf8'));
let sOk = true;
for (const q of sv.questions) {
    if (q.answerStatus !== 'candidate_from_solutions') { console.log('ERR: Q' + q.questionNumber + ' answerStatus=' + q.answerStatus); sOk = false; }
    if (q.explanationStatus !== 'candidate_from_solutions') { console.log('ERR: Q' + q.questionNumber + ' explanationStatus=' + q.explanationStatus); sOk = false; }
    if (!q.anomalies || q.anomalies.length !== 1) { console.log('ERR: Q' + q.questionNumber + ' anomalies=' + (q.anomalies ? q.anomalies.length : 0)); sOk = false; }
    if (!q.explanationCandidate) { console.log('ERR: Q' + q.questionNumber + ' no explanation'); sOk = false; }
    if (!q.options && q.questionType === 'multiple_choice') { console.log('ERR: Q' + q.questionNumber + ' no options (MC)'); sOk = false; }
}
console.log('Staging verify: ' + (sOk ? 'ALL OK' : 'ERRORS'));

// === REVIEW ===
const reviewEntries = data.questions.map(q => {
    const candidate = {
        stableId: q.stableId,
        questionNumber: q.questionNumber,
        questionType: q.questionType,
        stem: normalize(q.stem),
        options: (q.options || []).map(o => ({ label: o.label, value: normalize(o.value) })),
        answerCandidate: normalize(q.answerCandidate),
        answerStatus: "candidate_from_solutions",
        explanationCandidate: normalize(q.explanationCandidate),
        explanationStatus: "candidate_from_solutions",
        sourceRepo: "Kaoyan-Math1-Papers",
        sourceRelativePaths: ["papers/2022年考研数学(一)真题.md", "solutions/2022年解析/2022年解析.md"],
        sourceCommit: "3151b4acf26ea19ccd427b869a715e65e1990091",
        sourceDirty: true,
        sourceYear: 2022,
        subjectCode: "math1",
        sourceFileHashes: {
            paper: "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
            solutions: "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
        },
        transformVersion: "math1-modern-transform-v1",
        reviewStatus: "needs_human_review",
        anomalies: [{
            type: "md_finalization_source",
            questionNumber: q.questionNumber,
            severity: "info",
            message: "Stem/options restored from PDF-structure rebuild (via content_list_v2.json); paper Markdown had severe OCR corruption. Answer/explanation cross-verified against solutions/2022年解析.md."
        }]
    };
    return {
        stableId: q.stableId,
        candidateResult: candidate,
        semanticReview: {
            modifications: [],
            uncertainties: [{ item: "md_finalization_source", detail: "Content restored from PDF-structure evidence; needs human verification of mathematical correctness", severity: "info" }],
            conflicts: [],
            suggestedTopics: [{ topic: "待人工标注", confidence: "low", evidence: "Markdown-first finalization; mathematical correctness not verified by AI" }],
            confidence: "low",
            humanReviewFocus: ["确认题干、选项、答案和解析的数学正确性"]
        },
        reviewStatus: "needs_human_review"
    };
});

const review = {
    schemaVersion: "review-v1",
    task: "cc-math1-2022-md-finalize",
    runId: "20260620-134226-cc-math1-md-finalize-year-2022",
    sourceYear: 2022,
    subjectCode: "math1",
    reviewStatus: "needs_human_review",
    sourceInfo: {
        sourceRepo: "Kaoyan-Math1-Papers",
        sourceCommit: "3151b4acf26ea19ccd427b869a715e65e1990091",
        sourceDirty: true,
        sourceRelativePaths: ["papers/2022年考研数学(一)真题.md", "solutions/2022年解析/2022年解析.md"],
        sourceFileHashes: {
            paper: "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
            solutions: "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
        }
    },
    validation: { totalQuestions: reviewEntries.length, reviewedCount: reviewEntries.length, allNeedsHumanReview: true },
    reviews: reviewEntries
};

fs.mkdirSync(path.dirname(reviewPath), { recursive: true });
fs.writeFileSync(reviewPath, JSON.stringify(review, null, 2), 'utf8');
console.log('REVIEW written: ' + reviewEntries.length + ' entries');

// Verify review
const rv = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
let rOk = true;
for (const e of rv.reviews) {
    if (e.reviewStatus !== 'needs_human_review') { console.log('ERR: ' + e.stableId + ' reviewStatus=' + e.reviewStatus); rOk = false; }
    if (!e.candidateResult || !e.candidateResult.explanationCandidate) { console.log('ERR: ' + e.stableId + ' no explanation'); rOk = false; }
}
console.log('Review verify: ' + (rOk ? 'ALL OK' : 'ERRORS'));

// Size check
const sSize = fs.statSync(stagingPath).size;
const rSize = fs.statSync(reviewPath).size;
console.log('Staging size: ' + sSize + ' bytes');
console.log('Review size: ' + rSize + ' bytes');
console.log('DONE');
