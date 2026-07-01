import json
import os
import tempfile
import unittest
from pathlib import Path

from scripts.audit_math2_2021_2022 import (
    EXPECTED_NUMBERS,
    build_audit,
    choice_option_scan,
    detect_subject_identity,
    boundary_scan,
    FALLBACK_QUESTION_RE,
    write_outputs,
)


class Math2_2021_2022AuditUnitTests(unittest.TestCase):
    def test_subject_identity_detects_math3(self):
        subject = detect_subject_identity("# 2021考研数学三试题解析\n", "math2")
        self.assertEqual(subject["detectedSubjectCode"], "math3")
        self.assertFalse(subject["matchesExpected"])

    def test_boundary_scan_reports_missing_q2(self):
        text = "\n".join([
            "（1） first",
            "content",
            "（3） third",
            *[f"（{number}） body" for number in range(4, 23)],
        ])
        scan = boundary_scan(text, FALLBACK_QUESTION_RE)
        self.assertIn(2, scan["missingExpectedNumbers"])
        self.assertFalse(scan["firstOccurrencesMatchExpected"])

    def test_choice_option_scan_requires_all_choice_boundaries(self):
        text = "\n".join([
            "（1） first",
            "（A） one",
            "（B） two",
            "（C） three",
            "（D） four",
            *[f"（{number}） body" for number in range(3, 23)],
        ])
        scan = boundary_scan(text, FALLBACK_QUESTION_RE)
        options = choice_option_scan(text, scan)
        missing = {
            item["questionNumber"]
            for item in options["incompleteChoiceQuestions"]
            if item["status"] == "missing_question_boundary"
        }
        self.assertIn(2, missing)
        self.assertFalse(options["allChoiceOptionsComplete"])


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for read-only source integration tests",
)
class Math2_2021_2022RealSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_root = Path(os.environ["MATH2_SOURCE_DIR"])
        cls.audit = build_audit(cls.source_root)
        cls.by_year = {item["year"]: item for item in cls.audit["years"]}

    def test_2021_is_blocked_as_wrong_subject(self):
        year = self.by_year[2021]
        self.assertEqual(year["status"], "blocked_wrong_subject")
        self.assertFalse(year["stagingReady"])
        for source in year["sources"]:
            self.assertEqual(source["subjectIdentity"]["detectedSubjectCode"], "math3")
            self.assertTrue(source["hashMatchesExpected"])

    def test_2022_requires_source_role_decision(self):
        year = self.by_year[2022]
        self.assertEqual(year["status"], "blocked_source_role_decision_required")
        self.assertFalse(year["stagingReady"])
        paper = next(source for source in year["sources"] if source["role"] == "paper_candidate")
        solutions = next(source for source in year["sources"] if source["role"] == "solutions_candidate")
        self.assertEqual(paper["subjectIdentity"]["detectedSubjectCode"], "math2")
        self.assertIn(2, paper["boundaryScans"]["fallbackNumeric"]["missingExpectedNumbers"])
        self.assertIn(10, solutions["boundaryScans"]["fallbackNumeric"]["missingExpectedNumbers"])
        blocker_types = {item["type"] for item in year["blockers"]}
        self.assertIn("paper_candidate_not_mechanically_stageable", blocker_types)
        self.assertIn("solutions_candidate_not_mechanically_stageable_without_repair", blocker_types)
        self.assertIn("solutions_candidate_requires_source_role_decision", blocker_types)
        self.assertTrue(paper["hashMatchesExpected"])
        self.assertTrue(solutions["hashMatchesExpected"])

    def test_outputs_are_deterministic_json_and_markdown(self):
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            write_outputs(Path(first_dir) / "report", self.audit, Path(first_dir))
            write_outputs(Path(second_dir) / "report", self.audit, Path(second_dir))
            first_json = json.loads((Path(first_dir) / "report" / "audit.json").read_text(encoding="utf-8"))
            second_json = json.loads((Path(second_dir) / "report" / "audit.json").read_text(encoding="utf-8"))
            self.assertEqual(first_json, second_json)
            self.assertEqual(
                (Path(first_dir) / "report" / "audit.md").read_text(encoding="utf-8"),
                (Path(second_dir) / "report" / "audit.md").read_text(encoding="utf-8"),
            )


if __name__ == "__main__":
    unittest.main()
