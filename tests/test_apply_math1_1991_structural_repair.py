import json
import unittest
from pathlib import Path

from scripts.apply_math1_1991_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1991" / "questions.json"


class TestMath11991StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_q11_and_q14_containers_are_split(self):
        q11 = question_by_number(self.result["questions"], 11)
        q12 = question_by_number(self.result["questions"], 12)
        q13 = question_by_number(self.result["questions"], 13)
        q14 = question_by_number(self.result["questions"], 14)
        q15 = question_by_number(self.result["questions"], 15)
        self.assertNotIn("(2)【解】", q11["explanationCandidate"])
        self.assertTrue(q12["explanationCandidate"].startswith("(2)【解】"))
        self.assertTrue(q13["explanationCandidate"].startswith("(3)【解】"))
        self.assertNotIn("五、【解】", q14["explanationCandidate"])
        self.assertTrue(q15["explanationCandidate"].startswith("五、【解】"))

    def test_q7_options_are_restored(self):
        q7 = question_by_number(self.result["questions"], 7)
        self.assertEqual([option["label"] for option in q7["options"]], ["A", "B", "C", "D"])
        self.assertEqual(q7["options"][2]["value"], r"\mathrm{e}^{x} + \ln 2")
        self.assertEqual(q7["options"][3]["value"], r"\mathrm{e}^{2x} + \ln 2")

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 12)["explanationCandidate"])
        self.assertIsNone(question_by_number(self.staging["questions"], 15)["explanationCandidate"])
        self.assertEqual([option["label"] for option in question_by_number(self.staging["questions"], 7)["options"]], ["A", "B"])


if __name__ == "__main__":
    unittest.main()
