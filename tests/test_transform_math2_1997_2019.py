import json
import os
import tempfile
import unittest
from pathlib import Path

from scripts.transform_math2_1997_2019 import (
    PAPER_SHA256,
    SOLUTIONS_SHA256,
    YEARS,
    parse_expected_markers,
    transform_all,
)


class Math2AggregateParserTests(unittest.TestCase):
    def test_parses_global_ranges(self):
        self.assertEqual(
            parse_expected_markers("选择题（7～14小题，每小题4分，共32分）"),
            list(range(7, 15)),
        )
        self.assertEqual(
            parse_expected_markers("三、解答题（15～23题，共94分）"),
            list(range(15, 24)),
        )

    def test_parses_local_counts(self):
        self.assertEqual(
            parse_expected_markers("填空题（本题共5小题，每小题3分，满分15分）"),
            [1, 2, 3, 4, 5],
        )


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for read-only source integration tests",
)
class Math2AggregateTransformTests(unittest.TestCase):
    def setUp(self):
        self.source_root = Path(os.environ["MATH2_SOURCE_DIR"])

    def test_generates_blocked_math2_payloads(self):
        with tempfile.TemporaryDirectory() as output_dir, tempfile.TemporaryDirectory() as report_dir:
            payloads = transform_all(self.source_root, Path(output_dir), Path(report_dir))
            self.assertEqual([payload["sourceYear"] for payload in payloads], list(YEARS))
            self.assertGreater(sum(len(payload["questions"]) for payload in payloads), 300)

            for payload in payloads:
                year = payload["sourceYear"]
                self.assertEqual(payload["subjectCode"], "math2")
                self.assertTrue(payload["validation"]["schemaValid"])
                self.assertTrue(payload["validation"]["allQuestionsBlocked"])
                self.assertTrue(payload["validation"]["allQuestionsNeedReview"])
                self.assertGreater(payload["validation"]["explanationsPresent"], 0)
                for index, question in enumerate(payload["questions"], start=1):
                    self.assertEqual(question["stableId"], f"math2-{year}-q{index:02d}")
                    self.assertEqual(question["subjectCode"], "math2")
                    self.assertEqual(question["reviewStatus"], "needs_human_review")
                    self.assertEqual(question["finalizationStatus"], "blocked")
                    self.assertTrue(all(set(option) == {"label", "value"} for option in question["options"]))

    def test_source_inventory_records_hashes_and_post_state(self):
        with tempfile.TemporaryDirectory() as output_dir, tempfile.TemporaryDirectory() as report_dir:
            transform_all(self.source_root, Path(output_dir), Path(report_dir))
            inventory = json.loads((Path(report_dir) / "source-inventory.json").read_text(encoding="utf-8"))
            files = {item["relativePath"]: item for item in inventory["sourceFiles"]}
            self.assertEqual(files["papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md"]["sha256"], PAPER_SHA256)
            self.assertEqual(files["solutions/math2_1987-2019/math2_1987-2019.md"]["sha256"], SOLUTIONS_SHA256)
            self.assertEqual(inventory["sourceRepositoryBefore"], inventory["sourceRepositoryAfter"])

    def test_audit_records_cross_paper_references(self):
        with tempfile.TemporaryDirectory() as output_dir, tempfile.TemporaryDirectory() as report_dir:
            transform_all(self.source_root, Path(output_dir), Path(report_dir))
            audit = json.loads((Path(report_dir) / "audit.json").read_text(encoding="utf-8"))
            self.assertEqual(len(audit["crossPaperReferenceScan"]), len(YEARS))
            self.assertGreater(
                sum(item["crossPaperReferenceRecords"] for item in audit["crossPaperReferenceScan"]),
                0,
            )


if __name__ == "__main__":
    unittest.main()
