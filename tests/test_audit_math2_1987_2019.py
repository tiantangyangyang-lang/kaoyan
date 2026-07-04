import json
import os
import tempfile
import unittest
from pathlib import Path

from scripts.audit_math2_1987_2019 import (
    EXPECTED_YEARS,
    HISTORICAL_REVIEW_YEARS,
    build_audit,
    chinese_year_to_int,
    scan_question_blocks,
    split_years,
    write_outputs,
)


class Math2_1987_2019AuditUnitTests(unittest.TestCase):
    def test_chinese_year_parser(self):
        self.assertEqual(chinese_year_to_int("一九八七"), 1987)
        self.assertEqual(chinese_year_to_int("二〇一九"), 2019)

    def test_split_years_detects_subject_marker(self):
        text = "\n".join([
            "# 一九八七年考研数学试卷三解答",
            "1. body",
            "# 一九九七年考研数学试卷二解答",
            "1. body",
        ])
        sections = split_years(text)
        self.assertEqual([item["year"] for item in sections], [1987, 1997])
        self.assertEqual(sections[0]["detectedSubjectCode"], "math3")
        self.assertEqual(sections[1]["detectedSubjectCode"], "math2")

    def test_question_blocks_keep_option_shape(self):
        blocks = scan_question_blocks([
            "1. choice",
            "(A) one",
            "(B) two",
            "(C) three",
            "(D) four",
        ])
        self.assertEqual(len(blocks), 1)
        self.assertEqual([item["label"] for item in blocks[0]["options"]], ["A", "B", "C", "D"])
        self.assertTrue(all(set(item) == {"label", "value", "lineOffset"} for item in blocks[0]["options"]))


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for read-only source integration tests",
)
class Math2_1987_2019RealSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_root = Path(os.environ["MATH2_SOURCE_DIR"])
        cls.audit = build_audit(cls.source_root)

    def test_expected_year_boundaries_exist_in_both_sources(self):
        for source in self.audit["sources"]:
            self.assertEqual(source["yearBoundaryScan"]["yearsDetected"], EXPECTED_YEARS)
            self.assertTrue(source["yearBoundaryScan"]["completeExpectedSet"])
            self.assertEqual(source["yearBoundaryScan"]["missingYears"], [])
            self.assertTrue(source["source"]["hashMatchesExpected"])

    def test_historical_years_are_blocked(self):
        by_year = {item["year"]: item for item in self.audit["decisions"]}
        for year in HISTORICAL_REVIEW_YEARS:
            self.assertEqual(by_year[year]["status"], "blocked_historical_subject_title_review")
            self.assertIn("pre_1997_heading_uses_shijuan_san", by_year[year]["blockers"])

    def test_no_req015_staging_or_db_import(self):
        self.assertFalse(self.audit["summary"]["stagingGenerated"])
        self.assertFalse(self.audit["summary"]["databaseImportRun"])
        for decision in self.audit["decisions"]:
            self.assertFalse(decision["stagingReadyInReq015"])
            self.assertFalse(decision["databaseImportReadyInReq015"])

    def test_outputs_are_deterministic(self):
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            write_outputs(Path(first_dir), self.audit)
            write_outputs(Path(second_dir), self.audit)
            for name in (
                "aggregate-audit.json",
                "source-inventory.json",
                "aggregate-audit.md",
                "year-boundary-scan.md",
                "blocker-report.md",
            ):
                self.assertEqual(
                    (Path(first_dir) / name).read_text(encoding="utf-8"),
                    (Path(second_dir) / name).read_text(encoding="utf-8"),
                    name,
                )
            self.assertEqual(
                json.loads((Path(first_dir) / "aggregate-audit.json").read_text(encoding="utf-8")),
                json.loads((Path(second_dir) / "aggregate-audit.json").read_text(encoding="utf-8")),
            )


if __name__ == "__main__":
    unittest.main()
