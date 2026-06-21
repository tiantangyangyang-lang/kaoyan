import unittest
from pathlib import Path

from scripts.transform_math1_modern_year import transform


SOURCE = Path(r"D:\work\Kaoyan-Math1-Papers")


class TestModernMath1Years(unittest.TestCase):
    def test_supported_real_years(self):
        for year in (2021, 2022, 2023, 2025):
            with self.subTest(year=year):
                payload, _ = transform(SOURCE, year)
                self.assertTrue(payload["validation"]["countsMatch"])
                self.assertEqual(len(payload["questions"]), 22)
                self.assertTrue(payload["validation"]["allQuestionsNeedsReview"])
                self.assertEqual(
                    [q["questionNumber"] for q in payload["questions"]],
                    list(range(1, 23)),
                )

    def test_2022_marks_recovered_question_starts(self):
        payload, _ = transform(SOURCE, 2022)
        recovered = {
            q["questionNumber"]
            for q in payload["questions"]
            if any(a["type"] == "question_start_recovered_by_line_map" for a in q["anomalies"])
        }
        self.assertEqual(recovered, {3, 4, 12, 17})
        self.assertEqual(
            sum(q["answerStatus"] != "missing" for q in payload["questions"]),
            22,
        )

    def test_2023_solution_blocks_are_attached(self):
        payload, _ = transform(SOURCE, 2023)
        self.assertEqual(
            sum(q["explanationStatus"] != "missing" for q in payload["questions"]),
            22,
        )


if __name__ == "__main__":
    unittest.main()
