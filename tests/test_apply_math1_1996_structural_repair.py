import json
import unittest
from pathlib import Path

from scripts.apply_math1_1996_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1996" / "questions.json"


class TestMath11996StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_all_explanations_are_recovered(self):
        self.assertEqual(self.result["validation"]["questionsWithExplanations"], 22)
        for number in (12, 14):
            self.assertTrue(question_by_number(self.result["questions"], number)["explanationCandidate"])

    def test_q11_and_q13_containers_are_split(self):
        q11 = question_by_number(self.result["questions"], 11)
        q12 = question_by_number(self.result["questions"], 12)
        q13 = question_by_number(self.result["questions"], 13)
        q14 = question_by_number(self.result["questions"], 14)
        self.assertNotIn("(2)【解】", q11["explanationCandidate"])
        self.assertIn("(2)【解】", q12["explanationCandidate"])
        self.assertNotIn("(2)【解】", q13["explanationCandidate"])
        self.assertIn("(2)【解】", q14["explanationCandidate"])

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 12)["explanationCandidate"])
        self.assertIsNone(question_by_number(self.staging["questions"], 14)["explanationCandidate"])


if __name__ == "__main__":
    unittest.main()
