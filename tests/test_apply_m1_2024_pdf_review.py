import json
import unittest
from pathlib import Path

from scripts.apply_m1_2024_pdf_review import apply_pdf_corrections, question_by_number, validate


ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / "content" / "staging" / "math1" / "2024" / "questions.json"


class TestMath12024PdfReview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = apply_pdf_corrections(cls.staging, "pdf-hash")

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_damaged_options_are_restored(self):
        for number in (2, 3, 8, 9):
            with self.subTest(number=number):
                question = question_by_number(self.result["questions"], number)
                self.assertEqual([option["label"] for option in question["options"]], ["A", "B", "C", "D"])

    def test_answer_conflicts_are_resolved_from_pdf(self):
        self.assertEqual(question_by_number(self.result["questions"], 13)["answerCandidate"], r"$-\frac{1}{\pi}$")
        self.assertIn(r"\frac{17}{27}", question_by_number(self.result["questions"], 18)["answerCandidate"])
        self.assertIn("z_n=12", question_by_number(self.result["questions"], 21)["answerCandidate"])

    def test_q22_boundary_is_repaired(self):
        q22 = question_by_number(self.result["questions"], 22)
        self.assertNotIn("A ^ {n}", q22["stem"])
        self.assertNotIn("【22】", q22["stem"])
        self.assertTrue(q22["stem"].startswith("设总体"))

    def test_user_confirmed_q17_to_q22_are_normalized(self):
        q17 = question_by_number(self.result["questions"], 17)
        q19 = question_by_number(self.result["questions"], 19)
        q20 = question_by_number(self.result["questions"], 20)
        q21 = question_by_number(self.result["questions"], 21)
        q22 = question_by_number(self.result["questions"], 22)
        self.assertTrue(q17["stem"].startswith("（17）"))
        self.assertIn(r"\frac{x(1-x)}{2}", q19["stem"])
        self.assertNotIn("对于（1）结果两边同时积分", q20["stem"])
        self.assertIn(r"\alpha_n=(x_n,y_n,z_n)^{\mathrm T}", q21["stem"])
        self.assertIn(r"X\sim U(0,\theta)", q22["stem"])

    def test_staging_is_not_mutated(self):
        self.assertIn("【22】", question_by_number(self.staging["questions"], 22)["stem"])


if __name__ == "__main__":
    unittest.main()
