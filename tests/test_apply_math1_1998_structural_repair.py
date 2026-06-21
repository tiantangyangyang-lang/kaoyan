import json
import unittest
from pathlib import Path

from scripts.apply_math1_1998_structural_repair import (
    apply_structural_repairs,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "1998" / "questions.json"


class TestMath11998StructuralRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_structural_repairs(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_q10_a_option_is_restored(self):
        q10 = question_by_number(self.result["questions"], 10)
        self.assertEqual([option["label"] for option in q10["options"]], ["A", "B", "C", "D"])
        self.assertEqual(q10["options"][0]["value"], r"P(A\mid B) = P(\overline{A}\mid B).")

    def test_staging_is_not_mutated(self):
        self.assertEqual([option["label"] for option in question_by_number(self.staging["questions"], 10)["options"]], ["B", "C", "D"])


if __name__ == "__main__":
    unittest.main()
