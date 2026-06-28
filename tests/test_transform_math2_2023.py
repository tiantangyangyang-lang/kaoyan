import copy
import json
import os
import tempfile
import unittest
from pathlib import Path

from scripts.transform_math2_2023 import (
    COMPARISON_RELATIVE,
    EXPECTED_COUNTS,
    EXPECTED_HASHES,
    PRIMARY_RELATIVE,
    TOTAL_QUESTIONS,
    extract_stem_and_options,
    parse_question_blocks,
    stable_id,
    transform,
    validate_payload,
    write_outputs,
)


class Math2_2023ParserUnitTests(unittest.TestCase):
    def test_boundaries_must_be_complete(self):
        with self.assertRaisesRegex(ValueError, "1..22"):
            parse_question_blocks("(1) first\n(2) second")

    def test_option_contract_uses_value(self):
        stem, options = extract_stem_and_options(
            ["Question", "(A) one", "(B) two", "(C) three", "(D) four"],
            "multiple_choice",
        )
        self.assertEqual(stem, "Question")
        self.assertEqual([item["label"] for item in options], ["A", "B", "C", "D"])
        self.assertTrue(all(set(item) == {"label", "value"} for item in options))

    def test_stable_ids(self):
        self.assertEqual(stable_id(1), "math2-2023-q01")
        self.assertEqual(stable_id(22), "math2-2023-q22")


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for read-only source integration tests",
)
class Math2_2023RealSourceTests(unittest.TestCase):
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

    def test_source_role_decision_is_explicit(self):
        self.assertEqual(
            self.payload["sourceRoleDecision"]["decision"],
            "use_verified_complete_transcript_as_primary",
        )
        source_by_path = {
            item["relativePath"]: item for item in self.payload["sourceFiles"]
        }
        self.assertEqual(
            source_by_path[PRIMARY_RELATIVE]["role"],
            "primary_complete_question_transcription",
        )
        self.assertEqual(
            source_by_path[COMPARISON_RELATIVE]["role"],
            "comparison_incomplete_question_transcription",
        )
        self.assertEqual(source_by_path[PRIMARY_RELATIVE]["sha256"], EXPECTED_HASHES[PRIMARY_RELATIVE])
        self.assertEqual(source_by_path[COMPARISON_RELATIVE]["sha256"], EXPECTED_HASHES[COMPARISON_RELATIVE])

    def test_no_answers_are_invented(self):
        for question in self.payload["questions"]:
            self.assertIsNone(question["answer"])
            self.assertEqual(question["answerStatus"], "missing")
            self.assertIsNone(question["explanation"])
            self.assertEqual(question["explanationStatus"], "missing")
            self.assertEqual(question["reviewStatus"], "needs_human_review")
            self.assertEqual(question["finalizationStatus"], "blocked")

    def test_primary_options_are_complete(self):
        for question in self.payload["questions"][:10]:
            self.assertEqual(
                [option["label"] for option in question["options"]],
                ["A", "B", "C", "D"],
            )
            self.assertTrue(all(option["value"].strip() for option in question["options"]))
            self.assertTrue(all("text" not in option for option in question["options"]))

    def test_known_comparison_option_defects_are_preserved(self):
        defect_numbers = [
            question["questionNumber"]
            for question in self.payload["questions"]
            if any(
                item["type"] == "comparison_options_incomplete"
                for item in question["anomalies"]
            )
        ]
        self.assertEqual(defect_numbers, [2, 4, 6, 7, 9, 10])

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
