import os
import tempfile
import unittest
from pathlib import Path

from scripts.inventory_math2_markdown import build_inventory


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for source inventory tests",
)
class Math2InventoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inventory = build_inventory(Path(os.environ["MATH2_SOURCE_DIR"]))

    def test_exact_repository_counts(self):
        counts = self.inventory["counts"]
        self.assertEqual(counts["totalFiles"], 775)
        self.assertEqual(counts["trackedFiles"], 770)
        self.assertEqual(counts["untrackedFiles"], 5)
        self.assertEqual(counts["markdownFilesAudited"], 11)
        self.assertEqual(counts["byExtension"][".pdf"], 12)
        self.assertEqual(counts["byExtension"][".jpg"], 727)
        self.assertEqual(counts["byExtension"][".json"], 24)
        self.assertEqual(counts["byExtension"][".md"], 12)

    def test_pairings_and_images(self):
        pairings = {item["years"]: item for item in self.inventory["pairings"]}
        for years in ("1987-2019", "2020", "2021", "2022", "2023"):
            self.assertEqual(len(pairings[years]["paperCandidates"]), 1)
            self.assertEqual(len(pairings[years]["solutionPathCandidates"]), 1)
        self.assertEqual(pairings["2024"]["paperCandidates"], [])
        self.assertEqual(len(pairings["2024"]["solutionPathCandidates"]), 1)
        self.assertEqual(
            self.inventory["counts"]["missingRelativeImageReferences"],
            0,
        )

    def test_inventory_is_deterministic(self):
        second = build_inventory(Path(os.environ["MATH2_SOURCE_DIR"]))
        self.assertEqual(self.inventory, second)


if __name__ == "__main__":
    unittest.main()
