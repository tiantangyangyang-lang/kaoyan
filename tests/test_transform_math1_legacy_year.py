import unittest
from pathlib import Path

from scripts.transform_math1_legacy_year import transform


SOURCE = Path(r"D:\work\Kaoyan-Math1-Papers")


class TestLegacyMath1Years(unittest.TestCase):
    def test_representative_real_years(self):
        expectations = {
            1987: {"fill_in_blank": 8, "multiple_choice": 4, "solution": 8, "total": 20},
            1997: {"fill_in_blank": 5, "multiple_choice": 5, "solution": 12, "total": 22},
            2003: {"fill_in_blank": 6, "multiple_choice": 6, "solution": 10, "total": 22},
        }
        for year, expected in expectations.items():
            with self.subTest(year=year):
                payload, _ = transform(SOURCE, year)
                self.assertTrue(payload["validation"]["countsMatch"])
                self.assertEqual(payload["validation"]["questionCounts"]["fill_in_blank"], expected["fill_in_blank"])
                self.assertEqual(payload["validation"]["questionCounts"]["multiple_choice"], expected["multiple_choice"])
                self.assertEqual(payload["validation"]["questionCounts"]["solution"], expected["solution"])
                self.assertEqual(len(payload["questions"]), expected["total"])
                self.assertTrue(payload["validation"]["allQuestionsNeedsReview"])
                self.assertEqual(
                    len({question["stableId"] for question in payload["questions"]}),
                    len(payload["questions"]),
                )


if __name__ == "__main__":
    unittest.main()
