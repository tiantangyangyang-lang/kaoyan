import json
import unittest
from pathlib import Path

from scripts.apply_m1_2020_human_review import (
    Q12_EXPLANATION,
    apply_confirmed_corrections,
    question_by_number,
    validate,
)


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "2020" / "questions.json"


class TestMath1HumanReview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(STAGING, "r", encoding="utf-8") as source:
            cls.staging = json.load(source)
        cls.result = apply_confirmed_corrections(cls.staging)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_q3_has_distinct_c_and_d_options(self):
        q3 = question_by_number(self.result["questions"], 3)
        self.assertEqual([option["label"] for option in q3["options"]], ["A", "B", "C", "D"])
        self.assertIn(r"\pmb{\alpha}\cdot", q3["options"][2]["value"])
        self.assertIn(r"\pmb{\alpha}\times", q3["options"][3]["value"])

    def test_q8_is_normalized_and_heading_removed(self):
        q8 = question_by_number(self.result["questions"], 8)
        self.assertNotIn("0,2", q8["stem"])
        self.assertNotIn("# 二、填空题", q8["stem"])
        self.assertNotIn("# 二、填空题", q8["explanationCandidate"])

    def test_q12_uses_confirmed_explanation(self):
        q12 = question_by_number(self.result["questions"], 12)
        self.assertEqual(q12["explanationCandidate"], Q12_EXPLANATION)
        self.assertIn(r"\frac{\partial f}{\partial y}", q12["explanationCandidate"])

    def test_q14_heading_removed(self):
        q14 = question_by_number(self.result["questions"], 14)
        self.assertNotIn("# 三、解答题", q14["stem"])
        self.assertNotIn("# 三、解答题", q14["explanationCandidate"])

    def test_q23_trailing_q22_content_removed(self):
        q23 = question_by_number(self.result["questions"], 23)
        self.assertNotIn("F _ {Y} (y)", q23["explanationCandidate"])
        self.assertTrue(q23["explanationCandidate"].endswith(
            r"$\hat{\theta} = \sqrt[m]{\frac{1}{n}\sum_{i=1}^{n}t_i^m}$ ."
        ))

    def test_staging_input_is_not_mutated(self):
        original_q8 = question_by_number(self.staging["questions"], 8)
        self.assertIn("0,2", original_q8["stem"])
        self.assertIn("# 二、填空题", original_q8["stem"])


if __name__ == "__main__":
    unittest.main()
