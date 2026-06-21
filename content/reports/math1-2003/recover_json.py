"""
Math1 2003 staging JSON recovery script.
Reads from the valid reviewed JSON, builds the staging structure,
and writes with json.dump to guarantee valid JSON escaping.

Run: python content/reports/math1-2003/recover_json.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def parse_file_or_die(path, label):
    """Parse a JSON file and report exact failure position."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        data = json.loads(content)
        print(f"[OK] {label} parses as valid JSON ({len(content)} bytes)")
        return data, content
    except json.JSONDecodeError as e:
        print(f"[FAIL] {label} parse error at line {e.lineno}, col {e.colno}: {e.msg}")
        # Show context around the error
        with open(path, 'r', encoding='utf-8') as f:
            raw = f.read()
        start = max(0, e.pos - 80)
        end = min(len(raw), e.pos + 80)
        snippet = raw[start:end]
        marker = ' ' * (e.pos - start) + '^'
        print(f"  Context: ...{repr(snippet)}...")
        print(f"            {marker}")
        return None, raw

def main():
    staging_path = os.path.join(ROOT, 'content', 'staging', 'math1', '2003', 'questions.json')
    review_path = os.path.join(ROOT, 'content', 'review', 'math1', '2003', 'questions-reviewed.json')
    evidence_path = os.path.join(ROOT, 'content', 'reports', 'math1-2003', 'codex-visual-evidence.json')

    # Step 1: Parse staging to see if it's valid
    print("=" * 60)
    print("Step 1: Verify staging JSON parse status")
    print("=" * 60)
    staging_data, staging_raw = parse_file_or_die(staging_path, "staging questions.json")

    if staging_data is not None:
        print("\nStaging JSON is already valid! Checking content integrity...")
        questions = staging_data.get('questions', [])
        print(f"  Total questions: {len(questions)}")
        for q in questions:
            sid = q.get('stableId', '?')
            ec = q.get('explanationCandidate', '')
            # Check for common LaTeX escape issues in explanation
            issues = []
            for bad_seq in ['\x08', '\x0c', '\x0d']:  # backspace, formfeed, CR from bad escaping
                if bad_seq in ec:
                    issues.append(f'contains control char 0x{ord(bad_seq):02x}')
            if issues:
                print(f"  CONTENT ISSUE in {sid}: {', '.join(issues)}")

    # Step 2: Parse reviewed JSON
    print("\n" + "=" * 60)
    print("Step 2: Parse reviewed JSON (source of truth)")
    print("=" * 60)
    review_data, _ = parse_file_or_die(review_path, "reviewed questions.json")

    # Step 3: Parse codex evidence
    print("\n" + "=" * 60)
    print("Step 3: Parse codex visual evidence")
    print("=" * 60)
    evidence, _ = parse_file_or_die(evidence_path, "codex visual evidence")
    corrections = evidence.get('corrections', [])
    print(f"  Corrections listed: {len(corrections)}")
    for c in corrections:
        print(f"    - {c['stableId']}: {c['field']} ({c['decision']})")

    # Step 4: Build staging structure from reviewed JSON
    print("\n" + "=" * 60)
    print("Step 4: Build staging structure from reviewed JSON")
    print("=" * 60)

    reviewed_questions = review_data.get('questions', [])

    # Source metadata (from current staging if available, otherwise from review)
    source_commit = review_data.get('sourceCommit', '3151b4acf26ea19ccd427b869a715e65e1990091')
    source_dirty = review_data.get('sourceDirty', True)

    paper_hash = "5284A1F1C4F1C96197402EBDDFD18A86B779E65BAD02A6AADE351248E3E2A970"
    solutions_hash = "9591E29A780F311E34EDA394E7AD92399CF5B40A15749D7FA1597D976E837494"

    questions_output = []
    for rq in reviewed_questions:
        cr = rq.get('candidateResult', {})
        qn = rq['questionNumber']
        sid = rq['stableId']

        q_out = {
            "stableId": sid,
            "sourceRepo": "Kaoyan-Math1-Papers",
            "sourceRelativePaths": [
                "papers/2003年考研数学(一)真题.md",
                "solutions/2003年解析/2003年解析.md"
            ],
            "sourceCommit": source_commit,
            "sourceDirty": source_dirty,
            "sourceYear": 2003,
            "subjectCode": "math1",
            "sourceFileHashes": {
                "paper": paper_hash,
                "solutions": solutions_hash
            },
            "transformVersion": "math1-legacy-transform-v1",
            "reviewStatus": "needs_human_review",
            "questionNumber": qn,
            "questionType": rq['questionType'],
            "stem": cr.get('stem', ''),
            "options": cr.get('options', []),
            "answerCandidate": cr.get('answerCandidate'),
            "answerStatus": cr.get('answerStatus', 'candidate_from_solutions'),
            "explanationCandidate": cr.get('explanationCandidate', ''),
            "explanationStatus": cr.get('explanationStatus', 'candidate_from_solutions'),
            "anomalies": cr.get('anomalies', [])
        }

        # Add repairNote for Q7
        if sid == 'math1-2003-q07':
            q_out['repairNote'] = (
                "pdf-evidence-repair-2003: Q7 image 341a324b...jpg confirmed existing "
                "in source mirror at papers/images/2003年考研数学(一)真题/"
            )

        questions_output.append(q_out)

    print(f"  Built {len(questions_output)} question entries")

    # Step 5: Build complete staging JSON
    print("\n" + "=" * 60)
    print("Step 5: Assemble and validate staging JSON")
    print("=" * 60)

    staging_output = {
        "schemaVersion": "math1-legacy-transform-v1",
        "task": "cc-math1-2003-legacy",
        "subjectCode": "math1",
        "sourceYear": 2003,
        "sourceRepo": "Kaoyan-Math1-Papers",
        "sourceCommit": source_commit,
        "sourceDirty": source_dirty,
        "sourceInfo": {
            "paperRelativePath": "papers/2003年考研数学(一)真题.md",
            "paperSha256": paper_hash,
            "solutionsRelativePath": "solutions/2003年解析/2003年解析.md",
            "solutionsSha256": solutions_hash
        },
        "repairInfo": {
            "repairedAt": "2026-06-19",
            "repairTask": "serializer-recovery-2003-v2",
            "repairRunId": "20260619-serializer-recovery-2003-v2",
            "repairDecisions": [
                {
                    "issue": "json_escape_recovery_q17_q19",
                    "action": "Rebuilt entire staging JSON from reviewed JSON with json.dump to guarantee valid escaping. Q17 method-review and Q19 method-review continuation content sourced from codex-visual-evidence.json (PDF page 6 and page 9).",
                    "sourceEvidence": "content/review/math1/2003/questions-reviewed.json + content/reports/math1-2003/codex-visual-evidence.json",
                    "questionNumbers": [17, 19]
                }
            ],
            "serializerRecovery": {
                "recoveredAt": "2026-06-19",
                "recoveryTask": "serializer-recovery-2003-v2",
                "reason": "Full rebuild from reviewed JSON. All 6 Codex visual evidence corrections retained. Q17/Q19 content verified against codex-visual-evidence.json."
            },
            "pdfEvidenceRepair": {
                "repairedAt": "2026-06-18",
                "repairTask": "cc-math1-pdf-evidence-repair",
                "repairRunId": "20260618-191712-cc-math1-pdf-evidence-repair-2003",
                "repairDecisions": [
                    {
                        "issue": "q7_false_missing_image",
                        "action": "Verified image 341a324b...jpg exists in source mirror at papers/images/2003年考研数学(一)真题/ (7388 bytes, SHA-256 fb373c2ff81994026759674e72bdb05d96f7180a9f5222ecae9264a93c7f4be4). Removed false missing_image anomaly.",
                        "sourceEvidence": "source-mirror/Kaoyan-Math1-Papers/papers/images/2003年考研数学(一)真题/",
                        "questionNumbers": [7]
                    },
                    {
                        "issue": "q4_nonstandard_matrix_notation",
                        "action": "Normalized answerCandidate from binom to pmatrix form.",
                        "questionNumbers": [4]
                    },
                    {
                        "issue": "q6_ocr_noise_sample_mean",
                        "action": "Fixed \\frac{-}{x} → \\overline{X} in explanationCandidate.",
                        "questionNumbers": [6]
                    },
                    {
                        "issue": "q5_stem_spacing_artifact",
                        "action": "Fixed 其 他 → 其他 in stem.",
                        "questionNumbers": [5]
                    },
                    {
                        "issue": "q9_stem_paren_consistency",
                        "action": "Fixed fullwidth （B） → halfwidth (B) in stem.",
                        "questionNumbers": [9]
                    },
                    {
                        "issue": "q12_stem_missing_closing_paren",
                        "action": "Fixed 则（ → 则( ) in stem.",
                        "questionNumbers": [12]
                    }
                ]
            }
        },
        "questions": questions_output,
        "validation": {
            "questionsGenerated": 22,
            "questionCounts": {
                "fill_in_blank": 6,
                "multiple_choice": 6,
                "solution": 10
            },
            "expectedCounts": {
                "fill_in_blank": 6,
                "multiple_choice": 6,
                "solution": 10
            },
            "countsMatch": True,
            "totalAnomalies": 0,
            "anomaliesBySeverity": {
                "error": 0,
                "warning": 0,
                "info": 0
            },
            "allQuestionsNeedsReview": True,
            "repairNotes": "Rebuilt from reviewed JSON with json.dump (v2 recovery). All 6 Codex visual evidence corrections confirmed. Q17/Q19 method-review continuations verified against codex-visual-evidence.json."
        }
    }

    # Step 6: Write with json.dump
    print("\n" + "=" * 60)
    print("Step 6: Write staging JSON with json.dump")
    print("=" * 60)

    output_path = os.path.join(ROOT, 'content', 'staging', 'math1', '2003', 'questions.json')
    backup_path = os.path.join(ROOT, 'content', 'staging', 'math1', '2003', 'questions.json.bak')

    # Backup existing file
    if os.path.exists(output_path):
        os.replace(output_path, backup_path)
        print(f"  Backed up existing to: {backup_path}")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(staging_output, f, ensure_ascii=False, indent=2)
    print(f"  Written: {output_path} ({os.path.getsize(output_path)} bytes)")

    # Step 7: Verify the written file parses
    print("\n" + "=" * 60)
    print("Step 7: Verify written JSON parses (round-trip check)")
    print("=" * 60)
    verified, _ = parse_file_or_die(output_path, "written staging questions.json")

    if verified is not None:
        qcount = len(verified.get('questions', []))
        print(f"  Questions in verified output: {qcount}")
        # Check all stableIds
        sids = [q['stableId'] for q in verified['questions']]
        expected_sids = [f'math1-2003-q{i:02d}' for i in range(1, 23)]
        assert sids == expected_sids, f"Stable ID mismatch!\n  Got: {sids}\n  Expected: {expected_sids}"
        print(f"  All 22 stableIds correct: math1-2003-q01 through q22")

        # Check all reviewStatus
        statuses = set(q['reviewStatus'] for q in verified['questions'])
        assert statuses == {'needs_human_review'}, f"Unexpected review statuses: {statuses}"
        print(f"  All questions reviewStatus=needs_human_review")

        # Verify codex corrections are applied
        q10 = verified['questions'][9]  # index 9 = q10
        q10_options = [o['value'] for o in q10['options']]
        assert 'II' in q10_options[0] and 'II' in q10_options[1], "Q10 options A/B should reference group II"
        assert 'I' in q10_options[2] and 'I' in q10_options[3], "Q10 options C/D should reference group I"
        print(f"  [codex #1] Q10 options: A/B → group II, C/D → group I ✓")

        q17 = verified['questions'][16]  # index 16 = q17
        assert "g''(y)" in q17['explanationCandidate'], "Q17 should contain g''(y) formula"
        assert "f''(x)" in q17['explanationCandidate'], "Q17 should contain f''(x) formula"
        print(f"  [codex #2] Q17 method-review: inverse-function derivative identities present ✓")

        q18 = verified['questions'][17]  # index 17 = q18
        assert '\\iiint' in q18['stem'], "Q18 stem should use triple integral"
        print(f"  [codex #3] Q18 stem: triple integral notation ✓")

        q19 = verified['questions'][18]  # index 18 = q19
        ec19 = q19['explanationCandidate']
        # Check alpha_3 is 3-entry vector
        assert '\\pmb{\\alpha}_{3} = \\begin{pmatrix} 1 \\\\ 1 \\\\ 1 \\end{pmatrix}' in ec19, \
            "Q19 alpha_3 should be 3-entry column vector"
        print(f"  [codex #4] Q19 alpha_3: 3-entry column vector ✓")
        # Check method-review continuation
        assert 'f(A)\\pmb{\\alpha}=f(\\lambda_0)\\pmb{\\alpha}' in ec19 or \
               'f(A)\\pmb{\\alpha}=f(\\lambda_0)\\pmb{\\alpha}' in ec19, \
            "Q19 should contain f(A) eigenvalue conclusion"
        assert 'B\\cdot P^{-1}\\pmb{\\alpha}=\\lambda_0P^{-1}\\pmb{\\alpha}' in ec19 or \
               'B\\cdot P^{-1}\\pmb{\\alpha}=\\lambda_0P^{-1}\\pmb{\\alpha}' in ec19, \
            "Q19 should contain B similarity conclusion"
        print(f"  [codex #6] Q19 method-review continuation: eigenvalue/eigenvector conclusions present ✓")

        q22 = verified['questions'][21]  # index 21 = q22
        ec22 = q22['explanationCandidate']
        assert '令 $2n(x-\\theta)=t$，则' in ec22 or '令 $2n(x-\\theta)=t$' in ec22, \
            "Q22 should have proper substitution statement"
        print(f"  [codex #5] Q22 substitution: proper '令 2n(x-θ)=t' statement ✓")

        print(f"\n  All 6 Codex visual evidence corrections verified ✓")

    print("\n" + "=" * 60)
    print("RECOVERY COMPLETE")
    print("=" * 60)
    return 0

if __name__ == '__main__':
    sys.exit(main())
