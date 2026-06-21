import json
import unittest
from pathlib import Path

from scripts.apply_math1_1988_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1988" / "questions.json"


class TestMath11988StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_all_explanations_are_recovered(self):
        self.assertEqual(self.result["validation"]["questionsWithExplanations"], 22)
        for number in (2, 3):
            self.assertTrue(question_by_number(self.result["questions"], number)["explanationCandidate"])

    def test_q1_container_is_split(self):
        q1 = question_by_number(self.result["questions"], 1)
        q2 = question_by_number(self.result["questions"], 2)
        q3 = question_by_number(self.result["questions"], 3)
        self.assertNotIn("(2)【解】", q1["explanationCandidate"])
        self.assertIn("(2)【解】", q2["explanationCandidate"])
        self.assertIn("（3）【解】", q3["explanationCandidate"])

    def test_staging_is_not_mutated(self):
        self.assertEqual(question_by_number(self.staging["questions"], 2)["explanationCandidate"], None)
        self.assertEqual(question_by_number(self.staging["questions"], 3)["explanationCandidate"], None)


if __name__ == "__main__":
    unittest.main()
