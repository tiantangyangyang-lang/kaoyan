import unittest
from pathlib import Path

from scripts.transform_math1_2024 import (
    ALTERNATIVE_COMBINED,
    PRIMARY_PAPER,
    SOLUTION_COPY,
    transform,
)


SOURCE = Path(r"D:\work\Kaoyan-Math1-Papers")


class TestMath12024MultiVersion(unittest.TestCase):
    def test_real_source_generates_complete_review_candidates(self):
        payload, _ = transform(SOURCE)
        self.assertEqual(len(payload["questions"]), 22)
        self.assertTrue(payload["validation"]["countsMatch"])
        self.assertEqual(
            payload["validation"]["questionCounts"],
            {"multiple_choice": 10, "fill_in_blank": 6, "solution": 6},
        )
        self.assertTrue(payload["validation"]["allQuestionsNeedsReview"])
        self.assertTrue(all(q["explanationStatus"] == "missing" for q in payload["questions"]))

    def test_provenance_retains_all_versions(self):
        payload, anomalies = transform(SOURCE)
        first = payload["questions"][0]
        self.assertEqual(first["sourceRelativePaths"][0], PRIMARY_PAPER)
        self.assertIn(SOLUTION_COPY, first["sourceRelativePaths"])
        self.assertIn(ALTERNATIVE_COMBINED, first["sourceRelativePaths"])
        self.assertTrue(any(item["type"] == "multiple_paper_versions" for item in anomalies))

    def test_known_alternative_answer_conflicts_are_reported(self):
        _, anomalies = transform(SOURCE)
        conflict_numbers = {
            item["questionNumber"]
            for item in anomalies
            if item["type"] == "alternative_answer_conflict"
        }
        self.assertIn(13, conflict_numbers)
        self.assertIn(18, conflict_numbers)


if __name__ == "__main__":
    unittest.main()
