import json
import unittest
from pathlib import Path

from scripts.apply_math1_2002_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "2002" / "questions.json"


class TestMath12002StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_all_explanations_are_recovered(self):
        self.assertEqual(self.result["validation"]["questionsWithExplanations"], 20)
        for number in (2, 3, 4, 5, 7, 8, 9, 10):
            self.assertTrue(question_by_number(self.result["questions"], number)["explanationCandidate"])

    def test_q10_has_four_options(self):
        labels = [option["label"] for option in question_by_number(self.result["questions"], 10)["options"]]
        self.assertEqual(labels, ["A", "B", "C", "D"])

    def test_choice_answers_are_recovered(self):
        self.assertEqual(
            [question_by_number(self.result["questions"], number)["answerCandidate"] for number in range(6, 11)],
            ["（A）.", "(C).", "（B）.", "（B）.", "(D)."],
        )

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 7)["explanationCandidate"])
        self.assertEqual(
            [option["label"] for option in question_by_number(self.staging["questions"], 10)["options"]],
            ["B"],
        )


if __name__ == "__main__":
    unittest.main()
