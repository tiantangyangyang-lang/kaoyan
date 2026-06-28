import copy
import json
import os
import tempfile
import unittest
from pathlib import Path

from scripts.transform_math2_2024 import (
    EXPECTED_COUNTS,
    EXPECTED_PRIMARY_HASH,
    PRIMARY_RELATIVE,
    TOTAL_QUESTIONS,
    extract_stem_and_options,
    parse_question_blocks,
    stable_id,
    transform,
    validate_payload,
    write_outputs,
)


class Math2_2024ParserUnitTests(unittest.TestCase):
    def test_boundaries_ignore_chinese_subparts(self):
        text = "\n".join([
            "1. first",
            "A. a",
            "B. b",
            "C. c",
            "D. d",
            *[f"{number}. body" for number in range(2, 18)],
            "18. solution",
            "（1） subpart",
            "（2） subpart",
            *[f"{number}. body" for number in range(19, 23)],
        ])
        blocks = parse_question_blocks(text)
        self.assertEqual([item["number"] for item in blocks], list(range(1, 23)))

    def test_option_contract_strips_fused_fill_heading(self):
        stem, options = extract_stem_and_options(
            [
                "Question",
                "A. one",
                "B. two",
                "C. three",
                "D. four二、填空题: $11 \\sim 16$ 小题",
            ],
            "multiple_choice",
        )
        self.assertEqual(stem, "Question")
        self.assertEqual(options[-1], {"label": "D", "value": "four"})
        self.assertTrue(all(set(item) == {"label", "value"} for item in options))

    def test_stable_ids(self):
        self.assertEqual(stable_id(1), "math2-2024-q01")
        self.assertEqual(stable_id(22), "math2-2024-q22")


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for read-only source integration tests",
)
class Math2_2024RealSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_root = Path(os.environ["MATH2_SOURCE_DIR"])
        cls.payload, cls.batch_anomalies = transform(cls.source_root)

    def test_expected_question_contract(self):
        self.assertEqual(len(self.payload["questions"]), TOTAL_QUESTIONS)
        self.assertEqual(
            self.payload["validation"]["questionCounts"],
            EXPECTED_COUNTS,
        )
        self.assertEqual(
            [item["stableId"] for item in self.payload["questions"]],
            [stable_id(number) for number in range(1, TOTAL_QUESTIONS + 1)],
        )

    def test_source_decision_is_explicit(self):
        self.assertEqual(
            self.payload["sourceRoleDecision"]["decision"],
            "use_solutions_2024_markdown_as_approved_primary_source",
        )
        source_by_path = {
            item["relativePath"]: item for item in self.payload["sourceFiles"]
        }
        self.assertEqual(
            source_by_path[PRIMARY_RELATIVE]["role"],
            "maintainer_approved_markdown_source",
        )
        self.assertEqual(source_by_path[PRIMARY_RELATIVE]["sha256"], EXPECTED_PRIMARY_HASH)
        self.assertEqual(len(self.payload["sourceFiles"]), 4)

    def test_no_answers_are_invented(self):
        for question in self.payload["questions"]:
            self.assertIsNone(question["answer"])
            self.assertEqual(question["answerStatus"], "missing")
            self.assertIsNone(question["explanation"])
            self.assertEqual(question["explanationStatus"], "missing")
            self.assertEqual(question["reviewStatus"], "needs_human_review")
            self.assertEqual(question["finalizationStatus"], "blocked")

    def test_choice_options_are_complete(self):
        for question in self.payload["questions"][:10]:
            self.assertEqual(
                [option["label"] for option in question["options"]],
                ["A", "B", "C", "D"],
            )
            self.assertTrue(all(option["value"].strip() for option in question["options"]))
            self.assertTrue(all("text" not in option for option in question["options"]))
        q10 = self.payload["questions"][9]
        self.assertNotIn("二、填空题", q10["options"][3]["value"])

    def test_trailing_watermark_images_are_not_in_stem(self):
        q22 = self.payload["questions"][21]
        self.assertNotIn("![](", q22["stem"])
        self.assertTrue(
            any(
                item["type"] == "watermark_image_references_omitted"
                for item in q22["anomalies"]
            )
        )

    def test_feedback_email_is_configured_not_hardcoded(self):
        self.assertEqual(self.payload["feedback"]["configuredBy"], "VITE_FEEDBACK_EMAIL")
        self.assertIsNone(self.payload["feedback"]["hardcodedEmail"])
        self.assertEqual(self.payload["feedback"]["status"], "awaiting_maintainer_email")

    def test_schema_rejects_option_text(self):
        broken = copy.deepcopy(self.payload)
        broken["questions"][0]["options"][0] = {"label": "A", "text": "bad"}
        errors = validate_payload(broken)
        self.assertTrue(any("label/value" in error for error in errors))

    def test_deterministic_outputs(self):
        second_payload, second_anomalies = transform(self.source_root)
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            write_outputs(Path(first_dir), self.payload, self.batch_anomalies)
            write_outputs(Path(second_dir), second_payload, second_anomalies)
            for name in ("questions.json", "anomalies.json", "validation.json", "summary.md"):
                self.assertEqual(
                    (Path(first_dir) / name).read_bytes(),
                    (Path(second_dir) / name).read_bytes(),
                    name,
                )

    def test_payload_json_roundtrip(self):
        encoded = json.dumps(self.payload, ensure_ascii=False)
        decoded = json.loads(encoded)
        self.assertEqual(validate_payload(decoded), [])


if __name__ == "__main__":
    unittest.main()
