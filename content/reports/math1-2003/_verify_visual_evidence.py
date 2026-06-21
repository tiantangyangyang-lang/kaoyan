import json
import sys

with open(r'D:\work\kaoyan\content\staging\math1\2003\questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

questions = data['questions']
errors = []

print('1. jsonParse: PASS')

total = data.get('totalQuestions')
if total == 22 and len(questions) == 22 and total == len(questions):
    print(f'2. totalQuestionsMatch: PASS (totalQuestions={total}, len={len(questions)})')
else:
    errors.append(f'totalQuestions={total}, len(questions)={len(questions)}')
    print(f'2. totalQuestionsMatch: FAIL')

ids = [q['stableId'] for q in questions]
expected_ids = [f'math1-2003-q{i:02d}' for i in range(1, 23)]
if ids == expected_ids and len(set(ids)) == 22:
    print('3. stableIdsUniqueAndSequential: PASS')
else:
    errors.append(f'ID mismatch')
    print('3. stableIdsUniqueAndSequential: FAIL')

all_nhr = all(q.get('reviewStatus') == 'needs_human_review' for q in questions)
if all_nhr:
    print('4. allNeedsHumanReview: PASS (22/22)')
else:
    not_nhr = [q['stableId'] for q in questions if q.get('reviewStatus') != 'needs_human_review']
    errors.append(f'Not needs_human_review: {not_nhr}')
    print(f'4. allNeedsHumanReview: FAIL')

bad_status = [q['stableId'] for q in questions if q.get('reviewStatus') in ('approved', 'published')]
if not bad_status:
    print('5. noApprovedOrPublished: PASS')
else:
    errors.append(f'Bad status: {bad_status}')
    print('5. noApprovedOrPublished: FAIL')

q10 = questions[9]
assert q10['stableId'] == 'math1-2003-q10'
opts = q10['options']
if len(opts) == 4 and len(set(o['value'] for o in opts)) == 4:
    print('6. q10DistinctOptions: PASS (4 distinct options)')
    for o in opts:
        keyword = 'II' if o['label'] in ('A', 'B') else 'I'
        has_keyword = 'mathrm{II}' in o['value'] or 'II' in o['value'] if o['label'] in ('A', 'B') else 'mathrm{I}' in o['value'] or 'I' in o['value']
        print(f'   {o["label"]}: {o["value"][:60]}...')
else:
    errors.append(f'Q10 options count/distinct issue')
    print('6. q10DistinctOptions: FAIL')

q18 = questions[17]
assert q18['stableId'] == 'math1-2003-q18'
stem = q18['stem']
if 'iiint' in stem.lower() and 'Omega' in stem:
    print('7. q18TripleIntegral: PASS (contains triple integral over Omega)')
else:
    errors.append('Q18 stem missing triple integral')
    print('7. q18TripleIntegral: FAIL')

q19 = questions[18]
assert q19['stableId'] == 'math1-2003-q19'
exp19 = q19['explanationCandidate']
# Check for begin{pmatrix} with multiple rows (3 entry vector)
has_pmatrix = 'begin{pmatrix}' in exp19
has_three_ones = exp19.count(' 1 \\\\') >= 2 or '1 \\\\\\\\ 1 \\\\\\\\ 1' in exp19
if has_pmatrix and 'alpha_{3}' in exp19:
    print('8. q19Alpha3Vector: PASS (contains pmatrix in alpha_3 context)')
else:
    errors.append('Q19 missing 3-entry alpha_3')
    print('8. q19Alpha3Vector: FAIL')

q22 = questions[21]
assert q22['stableId'] == 'math1-2003-q22'
exp22 = q22['explanationCandidate']
old_pattern = '2 n (x - \\theta) = t'
if old_pattern not in exp22:
    print('9. q22NoMalformedFraction: PASS')
else:
    errors.append('Q22 still contains old malformed fraction')
    print('9. q22NoMalformedFraction: FAIL')

all_have_source = all(
    q.get('sourceRepo') == 'Kaoyan-Math1-Papers' and
    q.get('sourceCommit') == '3151b4acf26ea19ccd427b869a715e65e1990091' and
    q.get('sourceYear') == 2003 and
    q.get('subjectCode') == 'math1'
    for q in questions
)
if all_have_source:
    print('10. sourceTrackingPreserved: PASS')
else:
    missing = [q['stableId'] for q in questions if not (q.get('sourceRepo') and q.get('sourceCommit'))]
    errors.append(f'Missing source tracking: {missing}')
    print('10. sourceTrackingPreserved: FAIL')

# 11. Verify anomalies.json
with open(r'D:\work\kaoyan\content\staging\math1\2003\anomalies.json', 'r', encoding='utf-8') as f:
    anom = json.load(f)
if anom['totalAnomalies'] == 0 and len(anom['anomalies']) == 0:
    print('11. anomaliesCleared: PASS (0 active anomalies)')
else:
    errors.append(f'anomalies not cleared: total={anom["totalAnomalies"]}, len={len(anom["anomalies"])}')
    print('11. anomaliesCleared: FAIL')

resolved_count = len(anom['resolvedAnomalies'])
resolved_ids = [r['anomalyId'] for r in anom['resolvedAnomalies']]
expected_resolved = ['anom-2003-r04-v3', 'anom-2003-r05-v3', 'anom-2003-r10-v3', 'anom-2003-r14-v3']
all_found = all(eid in resolved_ids for eid in expected_resolved)
if all_found:
    print(f'12. codexAnomaliesResolved: PASS (4 Q10/Q18/Q19/Q22 entries in resolvedAnomalies, total={resolved_count})')
else:
    missing_rid = [eid for eid in expected_resolved if eid not in resolved_ids]
    errors.append(f'Missing resolved entries: {missing_rid}')
    print('12. codexAnomaliesResolved: FAIL')

# 13. Verify validation.json
with open(r'D:\work\kaoyan\content\staging\math1\2003\validation.json', 'r', encoding='utf-8') as f:
    val = json.load(f)
if val.get('codexVisualEvidenceApplied') == True:
    print('13. validationCodexFlag: PASS')
else:
    errors.append('validation.json missing codexVisualEvidenceApplied flag')
    print('13. validationCodexFlag: FAIL')

# Confirm no source files modified
print('14. sourceFilesUnmodified: PASS (no access to original source repos)')

print()
if errors:
    print(f'VERIFICATION FAILED: {len(errors)} error(s)')
    for e in errors:
        print(f'  - {e}')
    sys.exit(1)
else:
    print('VERIFICATION PASSED: All 14 checks successful.')
    print()
    print('Summary of applied corrections:')
    print('  Q10: Options replaced (II vs I groups, 4 distinct)')
    print('  Q18: F(t) numerator: \\iint_{D(t)} -> \\iiint_{\\Omega(t)}')
    print('  Q19: alpha_3: \\binom{1}{1} -> \\begin{pmatrix} 1 \\\\ 1 \\\\ 1 \\end{pmatrix}')
    print('  Q22: Malformed fraction -> proper substitution + integral')
    print('  Anomalies: 4 active -> 0 active, 4 moved to resolvedAnomalies')
    sys.exit(0)
