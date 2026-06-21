import unittest
from pathlib import Path

from scripts.build_math1_batch_manifest import build_manifest


ROOT = Path(r"D:\work\Kaoyan-Math1-Papers")


class TestMath1BatchManifest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = build_manifest(ROOT)
        cls.by_year = {item["year"]: item for item in cls.manifest["years"]}

    def test_year_range(self):
        self.assertEqual(len(self.manifest["years"]), 39)
        self.assertEqual(set(self.by_year), set(range(1987, 2026)))

    def test_known_missing_pairings(self):
        self.assertEqual(self.by_year[1994]["disposition"], "blocked_missing_paper")
        self.assertIn("missing_solution_markdown", self.by_year[2025]["risks"])
        self.assertEqual(
            self.by_year[2025]["disposition"],
            "needs_manual_or_special_parser",
        )

    def test_known_multiple_versions(self):
        self.assertEqual(self.by_year[2024]["disposition"], "blocked_version_selection")
        self.assertEqual(len(self.by_year[2024]["paperCandidates"]), 3)

    def test_structure_families(self):
        self.assertEqual(self.by_year[1987]["structureFamily"], "legacy_section_based")
        self.assertEqual(self.by_year[2020]["structureFamily"], "sequential_23")
        self.assertEqual(self.by_year[2021]["structureFamily"], "sequential_22_mixed_markers")
        self.assertEqual(
            self.by_year[2025]["structureFamily"],
            "modern_plain_numbered_or_embedded",
        )

    def test_2022_ocr_risk(self):
        self.assertIn("ocr_risk_detected", self.by_year[2022]["risks"])

    def test_2007_has_24_questions(self):
        self.assertEqual(self.by_year[2007]["expectedQuestionCount"], 24)
        self.assertEqual(self.by_year[2007]["maxDetectedQuestionMarkers"], 24)


if __name__ == "__main__":
    unittest.main()
