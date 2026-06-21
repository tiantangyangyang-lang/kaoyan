import json
import unittest
from pathlib import Path

from scripts.apply_math1_1993_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1993" / "questions.json"


class TestMath11993StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_q11_and_q16_containers_are_split(self):
        q11 = question_by_number(self.result["questions"], 11)
        q12 = question_by_number(self.result["questions"], 12)
        q13 = question_by_number(self.result["questions"], 13)
        q16 = question_by_number(self.result["questions"], 16)
        q17 = question_by_number(self.result["questions"], 17)
        self.assertNotIn("（2）【解】", q11["explanationCandidate"])
        self.assertTrue(q12["explanationCandidate"].startswith("（2）【解】"))
        self.assertTrue(q13["explanationCandidate"].startswith("(3)【解】"))
        self.assertNotIn("\n\n(2) $a^b > b^a$", q16["explanationCandidate"])
        self.assertTrue(q17["explanationCandidate"].startswith("(2) $a^b > b^a$"))

    def test_q9_and_q10_options_are_restored(self):
        q9 = question_by_number(self.result["questions"], 9)
        q10 = question_by_number(self.result["questions"], 10)
        self.assertEqual([option["label"] for option in q9["options"]], ["A", "B", "C", "D"])
        self.assertEqual([option["label"] for option in q10["options"]], ["A", "B", "C", "D"])
        self.assertEqual(q9["options"][3]["value"], r"1 - \frac{\mathrm{e}^{x} + \mathrm{e}^{-x}}{2}")
        self.assertIn(r"t = 6", q10["options"][1]["value"])
        self.assertIn(r"t\neq 6", q10["options"][3]["value"])

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 12)["explanationCandidate"])
        self.assertIsNone(question_by_number(self.staging["questions"], 17)["explanationCandidate"])
        self.assertEqual([option["label"] for option in question_by_number(self.staging["questions"], 10)["options"]], ["A", "C"])


if __name__ == "__main__":
    unittest.main()
