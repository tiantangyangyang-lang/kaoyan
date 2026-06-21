import json
import unittest
from pathlib import Path

from scripts.apply_math1_1992_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1992" / "questions.json"


class TestMath11992StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_all_explanations_are_recovered(self):
        self.assertEqual(self.result["validation"]["questionsWithExplanations"], 22)
        for number in (7, 8, 9, 10, 11, 12, 13, 19):
            self.assertTrue(question_by_number(self.result["questions"], number)["explanationCandidate"])

    def test_multiple_choice_answers_are_recovered(self):
        for number in range(6, 11):
            self.assertEqual(
                question_by_number(self.result["questions"], number)["answerStatus"],
                "candidate_from_solutions",
            )

    def test_q11_to_q13_explanations_are_split_out_of_q6(self):
        q6 = question_by_number(self.result["questions"], 6)
        q11 = question_by_number(self.result["questions"], 11)
        q13 = question_by_number(self.result["questions"], 13)
        self.assertNotIn("三、", q6["explanationCandidate"])
        self.assertIn("【解】", q11["explanationCandidate"])
        self.assertIn("【解】", q13["explanationCandidate"])

    def test_q19_explanation_is_split_out_of_q18(self):
        q18 = question_by_number(self.result["questions"], 18)
        q19 = question_by_number(self.result["questions"], 19)
        self.assertNotIn("九、", q18["explanationCandidate"])
        self.assertIn("【解】", q19["explanationCandidate"])

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 7)["explanationCandidate"])
        self.assertIsNone(question_by_number(self.staging["questions"], 19)["explanationCandidate"])


if __name__ == "__main__":
    unittest.main()
