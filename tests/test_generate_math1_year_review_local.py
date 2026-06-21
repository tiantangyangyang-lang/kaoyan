import unittest

from scripts.generate_math1_year_review_local import (
    build_anomalies_reviewed,
    build_checklist,
    build_questions_reviewed,
)


class TestGenerateMath1YearReviewLocal(unittest.TestCase):
    def setUp(self):
        self.questions = [
            {
                "stableId": "math1-2007-q01",
                "sourceRepo": "Kaoyan-Math1-Papers",
                "sourceCommit": "abc",
                "sourceDirty": True,
                "sourceRelativePaths": ["papers/2007.md", "solutions/2007.md"],
                "sourceFileHashes": {"paper": "p", "solutions": "s"},
                "questionNumber": 1,
                "questionType": "multiple_choice",
                "stem": "stem",
                "options": [{"label": "A", "value": "x"}],
                "answerCandidate": "(A)",
                "answerStatus": "candidate_from_solutions",
                "explanationCandidate": "exp",
                "explanationStatus": "candidate_from_solutions",
                "anomalies": [],
            },
            {
                "stableId": "math1-2007-q15",
                "sourceRepo": "Kaoyan-Math1-Papers",
                "sourceCommit": "abc",
                "sourceDirty": True,
                "sourceRelativePaths": ["papers/2007.md", "solutions/2007.md"],
                "sourceFileHashes": {"paper": "p", "solutions": "s"},
                "questionNumber": 15,
                "questionType": "solution",
                "stem": "solution stem",
                "options": [],
                "answerCandidate": None,
                "answerStatus": "missing",
                "explanationCandidate": "solution exp",
                "explanationStatus": "candidate_from_solutions",
                "anomalies": [],
            },
        ]
        self.anomalies = [
            {
                "type": "incomplete_options",
                "questionNumber": 1,
                "severity": "warning",
                "message": "Extracted option labels: ['A']",
            }
        ]

    def test_build_questions_reviewed(self):
        payload = build_questions_reviewed(2007, self.questions, self.anomalies)
        self.assertEqual(payload["schemaVersion"], "review-v1")
        self.assertEqual(payload["summary"]["totalQuestions"], 2)
        self.assertEqual(len(payload["reviews"]), 2)
        self.assertEqual(payload["reviews"][0]["reviewStatus"], "needs_human_review")
        self.assertEqual(payload["reviews"][1]["semanticReview"]["uncertainties"][-1]["item"], "missing_answer_for_solution_type")

    def test_build_anomalies_reviewed(self):
        payload = build_anomalies_reviewed(2007, self.questions, self.anomalies)
        self.assertEqual(payload["summary"]["totalAnomalies"], 1)
        self.assertEqual(payload["summary"]["bySeverity"]["warning"], 1)

    def test_build_checklist(self):
        checklist = build_checklist(2007, self.anomalies)
        self.assertIn("P1", checklist)
        self.assertIn("math1-2007-q01", checklist)


if __name__ == "__main__":
    unittest.main()
