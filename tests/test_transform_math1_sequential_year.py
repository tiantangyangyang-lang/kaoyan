import unittest
from pathlib import Path

from scripts.transform_math1_sequential_year import expected_counts, transform


SOURCE = Path(r"D:\work\Kaoyan-Math1-Papers")


class TestSequentialMath1Years(unittest.TestCase):
    def test_expected_count_variants(self):
        self.assertEqual(expected_counts(2004), {
            "fill_in_blank": 6,
            "multiple_choice": 8,
            "solution": 9,
        })
        self.assertEqual(sum(expected_counts(2007).values()), 24)
        self.assertEqual(sum(expected_counts(2020).values()), 23)

    def test_representative_real_years(self):
        for year in (2004, 2007, 2019):
            with self.subTest(year=year):
                payload, _ = transform(SOURCE, year)
                self.assertTrue(payload["validation"]["countsMatch"])
                self.assertEqual(
                    len(payload["questions"]),
                    sum(expected_counts(year).values()),
                )
                self.assertTrue(payload["validation"]["allQuestionsNeedsReview"])
                self.assertEqual(
                    len({question["stableId"] for question in payload["questions"]}),
                    len(payload["questions"]),
                )


if __name__ == "__main__":
    unittest.main()
