import json
import os
import tempfile
import unittest
from pathlib import Path

from scripts.audit_math2_2022_source_role import (
    HARD_BLOCKED_QUESTIONS,
    build_report,
    write_outputs,
)


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for read-only source integration tests",
)
class Math2_2022SourceRoleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_root = Path(os.environ["MATH2_SOURCE_DIR"])
        cls.report = build_report(cls.source_root)

    def test_decision_blocks_staging(self):
        decision = self.report["sourceRoleDecision"]
        self.assertEqual(decision["status"], "blocked_no_invention_staging_not_safe")
        self.assertFalse(decision["stagingReady"])
        self.assertFalse(self.report["nonStagingDecision"]["questionsJsonWritten"])

    def test_hard_blockers_are_q5_q7_q10(self):
        self.assertEqual(
            [item["questionNumber"] for item in self.report["hardBlockers"]],
            HARD_BLOCKED_QUESTIONS,
        )
        for item in self.report["hardBlockers"]:
            self.assertIn("no candidate with complete A-D option values", item["message"])

    def test_source_hashes_match_expected(self):
        for source in self.report["sources"]:
            self.assertTrue(source["hashMatchesExpected"], source["relativePath"])
        by_role = {source["role"]: source for source in self.report["sources"]}
        self.assertEqual(by_role["paper_candidate"]["gitState"], "untracked")
        self.assertEqual(by_role["solutions_candidate"]["gitState"], "tracked")

    def test_outputs_are_deterministic(self):
        with tempfile.TemporaryDirectory() as first, tempfile.TemporaryDirectory() as second:
            write_outputs(Path(first), self.report)
            write_outputs(Path(second), self.report)
            for name in ("source-scan.json", "blocker-report.md"):
                self.assertEqual(
                    (Path(first) / name).read_bytes(),
                    (Path(second) / name).read_bytes(),
                    name,
                )
            data = json.loads((Path(first) / "source-scan.json").read_text(encoding="utf-8"))
            self.assertEqual(data["sourceRoleDecision"]["decision"], "do_not_generate_2022_staging_in_req_014")

if __name__ == "__main__":
    unittest.main()
