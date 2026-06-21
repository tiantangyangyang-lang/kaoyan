import json
import unittest
from pathlib import Path

from scripts.apply_math1_2025_auto_repair import (
    FRAGMENTED_LIM,
    apply_auto_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "2025" / "questions.json"


class TestMath12025AutoRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_auto_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_seven_choice_sets_are_restored(self):
        for number in (1, 2, 3, 5, 6, 7, 8):
            labels = [option["label"] for option in question_by_number(self.result["questions"], number)["options"]]
            self.assertEqual(labels, ["A", "B", "C", "D"])

    def test_q8_answer_is_recovered_from_explicit_explanation(self):
        self.assertEqual(question_by_number(self.result["questions"], 8)["answerCandidate"], "C")

    def test_fragmented_lim_is_normalized(self):
        for number in (3, 11):
            self.assertNotIn(FRAGMENTED_LIM, question_by_number(self.result["questions"], number)["stem"])

    def test_only_source_damaged_options_remain(self):
        self.assertEqual(
            {item["questionNumber"] for item in self.result["remainingAnomalies"]},
            {4, 9, 10},
        )

    def test_staging_is_not_mutated(self):
        self.assertEqual(question_by_number(self.staging["questions"], 1)["options"], [])
        self.assertEqual(question_by_number(self.staging["questions"], 8)["answerCandidate"], "【解析】")


if __name__ == "__main__":
    unittest.main()
