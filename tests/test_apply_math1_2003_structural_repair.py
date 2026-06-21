import json
import unittest
from pathlib import Path

from scripts.apply_math1_2003_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r"D:\work\Kaoyan-Math1-Papers")
STAGING = ROOT / "content" / "staging" / "math1" / "2003" / "questions.json"


class TestMath12003StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        solution_relative = cls.staging["sourceInfo"]["solutionsRelativePath"]
        solution_text = (SOURCE / solution_relative).read_text(encoding="utf-8-sig")
        cls.result = apply_structural_repairs(cls.staging, solution_text)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_all_explanations_are_recovered(self):
        self.assertEqual(self.result["validation"]["questionsWithExplanations"], 22)
        for number in (8, 9, 10, 11, 12, 20):
            self.assertTrue(question_by_number(self.result["questions"], number)["explanationCandidate"])

    def test_multiple_choice_answers_are_recovered(self):
        expected = ["(C).", "(D).", "（A）.", "(D).", "(B).", "(C)."]
        actual = [
            question_by_number(self.result["questions"], number)["answerCandidate"]
            for number in range(7, 13)
        ]
        self.assertEqual(actual, expected)

    def test_q20_is_recovered_from_source_solution(self):
        q20 = question_by_number(self.result["questions"], 20)
        self.assertIn("【证明】", q20["explanationCandidate"])
        self.assertIn("a + b + c = 0", q20["explanationCandidate"])

    def test_staging_is_not_mutated(self):
        self.assertIsNone(question_by_number(self.staging["questions"], 8)["explanationCandidate"])
        self.assertIsNone(question_by_number(self.staging["questions"], 20)["explanationCandidate"])


if __name__ == "__main__":
    unittest.main()
