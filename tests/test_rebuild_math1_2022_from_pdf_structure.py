import json
import unittest
from pathlib import Path

from scripts.rebuild_math1_2022_from_pdf_structure import rebuild, validate


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r"D:\work\Kaoyan-Math1-Papers")
STAGING = ROOT / "content" / "staging" / "math1" / "2022" / "questions.json"
CONTENT_LIST = SOURCE / "solutions" / "2022年解析" / "content_list_v2.json"
PDF = SOURCE / "solutions" / "2022年解析" / "db938df1-9376-4a28-b484-c7514390ead3_origin.pdf"


class TestRebuildMath12022FromPdfStructure(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        staging = json.loads(STAGING.read_text(encoding="utf-8"))
        cls.result = rebuild(staging, CONTENT_LIST, PDF)

    def test_result_validates(self):
        self.assertEqual(validate(self.result), [])

    def test_all_questions_have_clean_candidates(self):
        self.assertEqual(len(self.result["questions"]), 22)
        self.assertEqual(self.result["validation"]["questionsWithAnswers"], 22)
        self.assertEqual(self.result["validation"]["questionsWithExplanations"], 22)
        self.assertTrue(self.result["validation"]["allNeedsHumanReview"])

    def test_recovered_q3_to_q5(self):
        for number in (3, 4, 5):
            question = self.result["questions"][number - 1]
            self.assertTrue(question["stem"])
            self.assertTrue(question["answerCandidate"])

    def test_multiple_choice_answers_ignore_page_number_noise(self):
        self.assertEqual(
            [question["answerCandidate"] for question in self.result["questions"][:10]],
            ["B.", "B.", "D.", "A.", "A.", "C.", "C.", "C.", "A.", "D."],
        )

    def test_staging_ocr_warnings_are_not_copied(self):
        for question in self.result["questions"]:
            types = {item["type"] for item in question["anomalies"]}
            self.assertNotIn("high_ocr_risk_source", types)
            self.assertNotIn("replacement_character_detected", types)


if __name__ == "__main__":
    unittest.main()
