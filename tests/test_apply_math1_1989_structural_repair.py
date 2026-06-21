import json
import unittest
from pathlib import Path

from scripts.apply_math1_1989_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1989" / "questions.json"


class TestMath11989StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_q11_is_cleared_while_q12_and_q13_are_restored(self):
        q11 = question_by_number(self.result["questions"], 11)
        q12 = question_by_number(self.result["questions"], 12)
        q13 = question_by_number(self.result["questions"], 13)
        self.assertIsNone(q11["explanationCandidate"])
        self.assertEqual(q11["explanationStatus"], "missing")
        self.assertTrue(q12["explanationCandidate"].startswith("(2)【解】"))
        self.assertTrue(q13["explanationCandidate"].startswith("（3）【解】"))

    def test_q19_no_longer_carries_q20_q22_answers(self):
        q19 = question_by_number(self.result["questions"], 19)
        q20 = question_by_number(self.result["questions"], 20)
        q21 = question_by_number(self.result["questions"], 21)
        q22 = question_by_number(self.result["questions"], 22)
        self.assertNotIn("十、填空题", q19["explanationCandidate"])
        self.assertIsNone(q19["answerCandidate"])
        self.assertEqual(q20["answerCandidate"], "0.7.")
        self.assertEqual(q21["answerCandidate"], "0.75.")
        self.assertEqual(q22["answerCandidate"], "0.8.")

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 12)["explanationCandidate"])
        self.assertIsNone(question_by_number(self.staging["questions"], 20)["explanationCandidate"])
        self.assertIsNotNone(question_by_number(self.staging["questions"], 11)["explanationCandidate"])


if __name__ == "__main__":
    unittest.main()
