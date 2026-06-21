import json
import tempfile
import unittest
from pathlib import Path

from scripts.repair_math1_year_review import build_review_payload, build_checklist


class TestRepairMath1YearReview(unittest.TestCase):
    def setUp(self):
        self.legacy = {
            "runId": "legacy-run",
            "sourceRepo": "Kaoyan-Math1-Papers",
            "sourceCommit": "abc123",
            "sourceInfo": {
                "paperRelativePath": "papers/2004.md",
                "paperSha256": "paperhash",
                "solutionsRelativePath": "solutions/2004.md",
                "solutionsSha256": "solhash",
            },
            "reviews": [
                {
                    "stableId": "math1-2004-q01",
                    "questionNumber": 1,
                    "questionType": "fill_in_blank",
                    "candidateResult": {
                        "stem": "stem",
                        "options": [],
                        "answerCandidate": "a",
                        "answerStatus": "candidate_from_solutions",
                        "explanationCandidate": "exp",
                        "explanationStatus": "candidate_from_solutions",
                        "anomalies": [],
                    },
                    "semanticReview": {
                        "ocrNoise": [],
                        "formulaIssues": [],
                        "structuralIssues": [
                            {"type": "pollution", "detail": "x", "severity": "warning"}
                        ],
                        "paperSolutionConflicts": [],
                        "knowledgePointCandidates": [
                            {"topic": "导数", "confidence": "high", "evidence": "e"}
                        ],
                        "humanReviewFocus": ["check"],
                        "confidence": "high",
                    },
                }
            ],
        }
        self.anomalies = {
            "anomalies": [
                {
                    "stableId": "math1-2004-q01",
                    "questionNumber": 1,
                    "severity": "warning",
                    "message": "issue",
                }
            ],
            "summary": {"totalAnomalies": 1},
        }

    def test_build_review_payload(self):
        payload = build_review_payload(self.legacy, self.anomalies, 2004)
        self.assertEqual(payload["schemaVersion"], "review-v1")
        self.assertEqual(payload["summary"]["totalQuestions"], 1)
        self.assertTrue(payload["summary"]["allNeedsHumanReview"])
        self.assertEqual(payload["sourceInfo"]["sourceRepo"], "Kaoyan-Math1-Papers")
        self.assertEqual(payload["sourceInfo"]["sourceCommit"], "abc123")
        review = payload["reviews"][0]
        self.assertEqual(review["candidateResult"]["questionNumber"], 1)
        self.assertEqual(review["reviewStatus"], "needs_human_review")
        self.assertEqual(review["semanticReview"]["suggestedTopics"][0]["topic"], "导数")
        self.assertEqual(review["semanticReview"]["uncertainties"][0]["item"], "pollution")

    def test_build_checklist(self):
        payload = build_review_payload(self.legacy, self.anomalies, 2004)
        checklist = build_checklist(
            payload,
            self.anomalies,
            2004,
            "content/reports/math1-2004/conflicts-and-uncertainties.md",
        )
        self.assertIn("P1", checklist)
        self.assertIn("math1-2004-q01", checklist)
        self.assertIn("conflicts-and-uncertainties.md", checklist)


if __name__ == "__main__":
    unittest.main()
