import json
import unittest
from pathlib import Path

from scripts.apply_math1_1997_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1997" / "questions.json"


class TestMath11997StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_all_explanations_are_recovered(self):
        self.assertEqual(self.result["validation"]["questionsWithExplanations"], 22)
        for number in (7, 8, 9, 10, 11, 12, 13, 15, 19):
            self.assertTrue(question_by_number(self.result["questions"], number)["explanationCandidate"])

    def test_q7_and_q9_have_four_options(self):
        for number in (7, 9):
            labels = [option["label"] for option in question_by_number(self.result["questions"], number)["options"]]
            self.assertEqual(labels, ["A", "B", "C", "D"])

    def test_choice_answers_are_recovered(self):
        self.assertEqual(
            [question_by_number(self.result["questions"], number)["answerCandidate"] for number in range(6, 11)],
            ["(C).", "(B).", "（A).", "(D).", "(D)."],
        )

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 7)["explanationCandidate"])
        self.assertEqual(
            [option["label"] for option in question_by_number(self.staging["questions"], 7)["options"]],
            ["A", "B", "C"],
        )


if __name__ == "__main__":
    unittest.main()
