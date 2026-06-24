import copy
import json
import os
import tempfile
import unittest
from pathlib import Path

from scripts.transform_math2_2020 import (
    COMPARISON_RELATIVE,
    EXPECTED_COUNTS,
    PAPER_RELATIVE,
    extract_stem_and_options,
    parse_question_blocks,
    stable_id,
    transform,
    validate_payload,
    write_outputs,
)


class Math2ParserUnitTests(unittest.TestCase):
    def test_boundaries_must_be_complete(self):
        with self.assertRaisesRegex(ValueError, "1..23"):
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
        self.assertEqual(stable_id(1), "math2-2020-q01")
        self.assertEqual(stable_id(23), "math2-2020-q23")


@unittest.skipUnless(
    os.environ.get("MATH2_SOURCE_DIR"),
    "MATH2_SOURCE_DIR is required for read-only source integration tests",
)
class Math2RealSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_root = Path(os.environ["MATH2_SOURCE_DIR"])
        cls.payload, cls.batch_anomalies = transform(cls.source_root)

    def test_expected_question_contract(self):
        self.assertEqual(len(self.payload["questions"]), 23)
        self.assertEqual(
            self.payload["validation"]["questionCounts"],
            EXPECTED_COUNTS,
        )
        self.assertEqual(
            [item["stableId"] for item in self.payload["questions"]],
            [stable_id(number) for number in range(1, 24)],
        )

    def test_no_answers_are_invented(self):
        for question in self.payload["questions"]:
            self.assertIsNone(question["answer"])
            self.assertEqual(question["answerStatus"], "missing")
            self.assertIsNone(question["explanation"])
            self.assertEqual(question["explanationStatus"], "missing")
            self.assertEqual(question["finalizationStatus"], "blocked")

    def test_primary_options_are_complete(self):
        for question in self.payload["questions"][:8]:
            self.assertEqual(
                [option["label"] for option in question["options"]],
                ["A", "B", "C", "D"],
            )
            self.assertTrue(all("value" in option for option in question["options"]))
            self.assertTrue(all("text" not in option for option in question["options"]))

    def test_known_anomalies_are_preserved(self):
        q6 = self.payload["questions"][5]
        q22 = self.payload["questions"][21]
        self.assertTrue(any(
            item["type"] == "comparison_incomplete_options"
            for item in q6["anomalies"]
        ))
        self.assertTrue(any(
            item["type"] == "formula_dimension_conflict"
            for item in q22["anomalies"]
        ))

    def test_source_roles_and_hashes(self):
        source_by_path = {
            item["relativePath"]: item for item in self.payload["sourceFiles"]
        }
        self.assertEqual(source_by_path[PAPER_RELATIVE]["gitState"], "untracked")
        self.assertEqual(source_by_path[COMPARISON_RELATIVE]["gitState"], "tracked")
        self.assertEqual(len(source_by_path[PAPER_RELATIVE]["sha256"]), 64)
        self.assertEqual(len(source_by_path[COMPARISON_RELATIVE]["sha256"]), 64)

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
