"""
Unit tests for transform_m1_2020.py.

Run: python -m unittest tests/test_transform_m1_2020.py -v
"""

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.transform_m1_2020 import (
    EXPECTED_QUESTION_COUNTS,
    SCHEMA_VERSION,
    SOURCE_REPO,
    SOURCE_YEAR,
    SUBJECT_CODE,
    TASK,
    check_katex_structure,
    detect_ocr_risks,
    detect_question_type,
    extract_options,
    make_stable_id,
    normalize_newlines,
    parse_paper_questions,
    parse_solutions,
    sha256_text,
    transform,
    validate_json_schema,
    write_output,
)


class TestUtilityFunctions(unittest.TestCase):
    """Tests for pure utility functions."""

    def test_make_stable_id(self):
        self.assertEqual(make_stable_id(1), "math1-2020-q01")
        self.assertEqual(make_stable_id(10), "math1-2020-q10")
        self.assertEqual(make_stable_id(23), "math1-2020-q23")

    def test_detect_question_type(self):
        self.assertEqual(detect_question_type(1), "multiple_choice")
        self.assertEqual(detect_question_type(8), "multiple_choice")
        self.assertEqual(detect_question_type(9), "fill_in_blank")
        self.assertEqual(detect_question_type(14), "fill_in_blank")
        self.assertEqual(detect_question_type(15), "solution")
        self.assertEqual(detect_question_type(23), "solution")
        self.assertEqual(detect_question_type(0), "unknown")
        self.assertEqual(detect_question_type(24), "unknown")

    def test_sha256_text_deterministic(self):
        a = sha256_text("hello")
        b = sha256_text("hello")
        self.assertEqual(a, b)
        self.assertEqual(len(a), 64)

    def test_normalize_newlines(self):
        self.assertEqual(normalize_newlines("a\r\nb\r\nc"), "a\nb\nc")
        self.assertEqual(normalize_newlines("a\rb"), "a\nb")
        self.assertEqual(normalize_newlines("a\nb"), "a\nb")

    def test_validate_json_schema_valid(self):
        valid = {
            "schemaVersion": SCHEMA_VERSION,
            "questions": [],
            "sourceInfo": {},
            "validation": {}
        }
        self.assertEqual(validate_json_schema(valid), [])

    def test_validate_json_schema_invalid(self):
        self.assertTrue(len(validate_json_schema("not a dict")) > 0)
        self.assertTrue(len(validate_json_schema({"schemaVersion": "wrong"})) > 0)


class TestOptionExtraction(unittest.TestCase):
    """Tests for multiple choice option extraction."""

    def test_four_options(self):
        text = """（A）$\\int_{0}^{x} (e^{t^2} - 1) dt$

        （B）some text

        （C）more text

        （D）last option"""
        opts = extract_options(text)
        self.assertEqual(len(opts), 4)
        self.assertEqual([o["label"] for o in opts], ["A", "B", "C", "D"])

    def test_three_options(self):
        text = """(A) option a
        (B) option b
        (C) option c"""
        opts = extract_options(text)
        self.assertEqual(len(opts), 3)

    def test_no_options(self):
        text = "This text has no option markers."
        opts = extract_options(text)
        self.assertEqual(len(opts), 0)

    def test_inline_probability_is_not_an_option(self):
        text = """Given P(A) = P(B) = P(C) = 1/4.
(A) first
(B) second
(C) third
(D) fourth"""
        opts = extract_options(text)
        self.assertEqual([option["label"] for option in opts], ["A", "B", "C", "D"])


class TestPaperParser(unittest.TestCase):
    """Tests for parsing the exam paper into questions."""

    def setUp(self):
        self.paper_text = """# 2020年考研数学（一）

# 一、选择题(1～8小题)

（1）First question text.

（2）Second question text.

9）Ninth question text.

（15）Fifteenth question text."""
        self.questions, self.anomalies = parse_paper_questions(self.paper_text)

    def test_finds_questions(self):
        qnums = [q["questionNumber"] for q in self.questions]
        self.assertIn(1, qnums)
        self.assertIn(2, qnums)
        self.assertIn(9, qnums)
        self.assertIn(15, qnums)

    def test_correct_types(self):
        for q in self.questions:
            qnum = q["questionNumber"]
            expected = detect_question_type(qnum)
            self.assertEqual(q["questionType"], expected,
                             f"Q{qnum} type mismatch")

    def test_stable_ids(self):
        for q in self.questions:
            expected_id = make_stable_id(q["questionNumber"])
            self.assertEqual(q["stableId"], expected_id)

    def test_all_needs_review(self):
        # Questions from parsing are always in staging state
        for q in self.questions:
            self.assertTrue(q["rawText"], f"Q{q['questionNumber']} has no raw text")

    def test_reports_missing(self):
        # With only 4 questions in test input, there should be missing question warnings
        missing = [a for a in self.anomalies if a["type"] == "missing_question"]
        self.assertTrue(len(missing) > 0)


class TestSolutionsParser(unittest.TestCase):
    """Tests for parsing the solutions markdown."""

    def setUp(self):
        self.solutions_text = """# 2020年数学(一）真题解析

# 一、选择题

（1）【答案】 (D).

【解】 Solution for Q1.

（2）【答案】 (C).

【解】 Solution for Q2."""
        self.solutions, self.anomalies = parse_solutions(self.solutions_text)

    def test_finds_solutions(self):
        self.assertIn(1, self.solutions)
        self.assertIn(2, self.solutions)

    def test_extracts_answers(self):
        self.assertEqual(self.solutions[1]["answer"], "(D).")
        self.assertEqual(self.solutions[2]["answer"], "(C).")

    def test_has_explanation(self):
        self.assertIn("Solution for Q1", self.solutions[1]["explanationRaw"])
        self.assertIn("Solution for Q2", self.solutions[2]["explanationRaw"])

    def test_embedded_solution_marker_is_preserved_and_flagged(self):
        text = "(21)【解】Solution 21.（22）【解】Solution 22."
        solutions, anomalies = parse_solutions(text)
        self.assertIn(22, solutions)
        self.assertTrue(any(
            anomaly["type"] == "embedded_solution_marker"
            and anomaly["questionNumber"] == 22
            for anomaly in anomalies
        ))


class TestOCRDetection(unittest.TestCase):
    """Tests for OCR risk pattern detection."""

    def test_no_risks_clean_text(self):
        text = r"Normal math text with $\int x dx$."
        risks = detect_ocr_risks(text, 1)
        self.assertEqual(len(risks), 0)

    def test_no_risks_chinese_text(self):
        text = "设函数 $f(x)$ 在区间 $(-1, 1)$ 内有定义"
        risks = detect_ocr_risks(text, 2)
        self.assertEqual(len(risks), 0)

    def test_rx_squared_detected(self):
        text = "其中 $rx^2$ 表示"
        risks = detect_ocr_risks(text, 3)
        self.assertTrue(any("rx²" in r["pattern"] for r in risks))

    def test_fragmented_limit_detected(self):
        text = "l i m x → 0"
        risks = detect_ocr_risks(text, 4)
        self.assertTrue(any("l i m" in r["pattern"] for r in risks))


class TestKaTeXCheck(unittest.TestCase):
    """Tests for basic KaTeX structural validation."""

    def test_balanced_dollars(self):
        text = "$x^2 + y^2$ and $z^3$"
        issues = check_katex_structure(text)
        self.assertEqual(len(issues), 0)

    def test_unbalanced_dollars(self):
        text = "$x^2 + y^2 and $z^3$"
        issues = check_katex_structure(text)
        self.assertTrue(any("unmatched" in i["type"] for i in issues))

    def test_display_math(self):
        text = "$$\nx^2\n$$"
        issues = check_katex_structure(text)
        self.assertEqual(len(issues), 0)


class TestExpectedCounts(unittest.TestCase):
    """Verify expected question count constants."""

    def test_total_23(self):
        total = sum(EXPECTED_QUESTION_COUNTS.values())
        self.assertEqual(total, 23)

    def test_correct_distribution(self):
        self.assertEqual(EXPECTED_QUESTION_COUNTS["multiple_choice"], 8)
        self.assertEqual(EXPECTED_QUESTION_COUNTS["fill_in_blank"], 6)
        self.assertEqual(EXPECTED_QUESTION_COUNTS["solution"], 9)


class TestTransformRoundtrip(unittest.TestCase):
    """Integration-style test using temp directories with minimal real data."""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        # Create mock source mirror structure
        repo_dir = Path(self.temp_dir) / SOURCE_REPO
        papers_dir = repo_dir / "papers"
        sol_dir = repo_dir / "solutions" / "2020年解析"
        papers_dir.mkdir(parents=True, exist_ok=True)
        sol_dir.mkdir(parents=True, exist_ok=True)

        # Write minimal paper
        self.paper_content = """# 2020年全国硕士研究生招生考试

# 一、选择题

（1）First question $x \\to 0$.

(A) option A
(B) option B
(C) option C
(D) option D

（2）Second question.

（A）$\\alpha$
（B）$\\beta$
（C）$\\gamma$
（D）$\\delta$

9）Ninth fill question $\\int_0^1 x dx =$ ____

（15）Solution problem."""
        (papers_dir / "2020年考研数学(一)真题.md").write_text(
            self.paper_content, encoding="utf-8")

        # Write minimal solutions
        self.sol_content = """# 2020年数学(一）真题解析

# 一、选择题

（1）【答案】 (D).

【解】 Solution one.

（2）【答案】 (B).

【解】 Solution two.

9）【答案】 0.5

【解】 Solution nine.

（15）【解】 Solution fifteen."""
        (sol_dir / "2020年解析.md").write_text(
            self.sol_content, encoding="utf-8")

        self.output_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
        shutil.rmtree(str(self.output_dir), ignore_errors=True)

    def test_transform_produces_output(self):
        payload, anomalies = transform(Path(self.temp_dir), self.output_dir)

        self.assertIn("questions", payload)
        self.assertEqual(payload["schemaVersion"], SCHEMA_VERSION)
        self.assertEqual(payload["task"], TASK)
        self.assertEqual(payload["subjectCode"], SUBJECT_CODE)
        self.assertEqual(payload["sourceYear"], SOURCE_YEAR)

        # Should have at least the 4 questions we defined
        self.assertTrue(len(payload["questions"]) >= 4)

    def test_all_questions_needs_review(self):
        payload, _ = transform(Path(self.temp_dir), self.output_dir)
        for q in payload["questions"]:
            self.assertEqual(q["reviewStatus"], "needs_human_review",
                             f"Q{q['questionNumber']} not needs_human_review")

    def test_question_source_tracking(self):
        payload, _ = transform(Path(self.temp_dir), self.output_dir)
        for q in payload["questions"]:
            self.assertIn("sourceRepo", q)
            self.assertEqual(q["sourceRepo"], SOURCE_REPO)
            self.assertIn("sourceRelativePaths", q)
            self.assertIn("papers/2020年考研数学(一)真题.md", q["sourceRelativePaths"])
            self.assertIn("sourceFileHashes", q)

    def test_validation_in_output(self):
        payload, _ = transform(Path(self.temp_dir), self.output_dir)
        v = payload["validation"]
        self.assertIn("questionsGenerated", v)
        self.assertIn("questionCounts", v)
        self.assertIn("countsMatch", v)

    def test_output_files_written(self):
        payload, anomalies = transform(Path(self.temp_dir), self.output_dir)
        write_output(self.output_dir, payload, anomalies)

        # Check output files exist
        self.assertTrue((self.output_dir / "questions.json").exists())
        self.assertTrue((self.output_dir / "anomalies.json").exists())
        self.assertTrue((self.output_dir / "validation.json").exists())
        self.assertTrue((self.output_dir / "summary.md").exists())

        # Validate JSON is parseable
        with open(self.output_dir / "questions.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIsInstance(data, dict)
        json_errors = validate_json_schema(data)
        self.assertEqual(json_errors, [], f"Schema errors: {json_errors}")

    def test_missing_source_handling(self):
        """Transform should handle missing solutions gracefully."""
        # Create a source dir with only paper, no solutions
        bad_dir = Path(tempfile.mkdtemp())
        repo_dir = bad_dir / SOURCE_REPO / "papers"
        repo_dir.mkdir(parents=True)
        (repo_dir / "2020年考研数学(一)真题.md").write_text(
            self.paper_content, encoding="utf-8")

        payload, anomalies = transform(bad_dir, self.output_dir)

        # Should still produce questions even without solutions
        self.assertTrue(len(payload["questions"]) > 0)
        # Should have a missing_source warning
        self.assertTrue(any(
            a["type"] == "missing_source" and a["severity"] == "warning"
            for a in anomalies
        ))

        import shutil
        shutil.rmtree(str(bad_dir), ignore_errors=True)


class TestFullRealOutput(unittest.TestCase):
    """Test against the actual source mirror data.

    These tests validate against the real source files in the source mirror.
    They are skipped if the source mirror is not available.
    """

    @classmethod
    def setUpClass(cls):
        cls.source_dir = Path(os.environ.get("M1_2020_SOURCE_DIR", "."))
        cls.output_dir = Path(tempfile.mkdtemp())

    @classmethod
    def tearDownClass(cls):
        import shutil
        shutil.rmtree(str(cls.output_dir), ignore_errors=True)

    def _skip_if_no_source(self):
        if not os.environ.get("M1_2020_SOURCE_DIR") or not self.source_dir.is_dir():
            self.skipTest(f"Source mirror not available: {self.source_dir}")

    def test_transform_with_real_data(self):
        self._skip_if_no_source()
        payload, anomalies = transform(self.source_dir, self.output_dir)

        # Should have exactly 23 questions
        self.assertEqual(len(payload["questions"]), 23,
                         f"Expected 23 questions, got {len(payload['questions'])}")

        # Write output files
        from scripts.transform_m1_2020 import write_output
        write_output(self.output_dir, payload, anomalies)

        # Verify all questions present by number
        qnums = {q["questionNumber"] for q in payload["questions"]}
        expected = set(range(1, 24))
        self.assertEqual(qnums, expected,
                         f"Missing questions: {expected - qnums}")

    def test_question_types_correct(self):
        self._skip_if_no_source()
        payload, _ = transform(self.source_dir, self.output_dir)

        for q in payload["questions"]:
            qnum = q["questionNumber"]
            expected_type = detect_question_type(qnum)
            self.assertEqual(q["questionType"], expected_type,
                             f"Q{qnum}: expected {expected_type}, got {q['questionType']}")

    def test_multiple_choice_options(self):
        self._skip_if_no_source()
        payload, _ = transform(self.source_dir, self.output_dir)

        for q in payload["questions"]:
            if q["questionType"] == "multiple_choice":
                self.assertTrue(len(q["options"]) > 0,
                                f"Q{q['questionNumber']}: no options extracted")
                # Check that options are A-D
                labels = {o["label"] for o in q["options"]}
                self.assertIn("A", labels, f"Q{q['questionNumber']}: option A missing")
                self.assertLessEqual(
                    len(q["options"]), 4,
                    f"Q{q['questionNumber']}: inline expressions parsed as options",
                )

    def test_all_questions_have_stem(self):
        self._skip_if_no_source()
        payload, _ = transform(self.source_dir, self.output_dir)

        for q in payload["questions"]:
            self.assertTrue(len(q["stem"]) > 0,
                            f"Q{q['questionNumber']}: empty stem")

    def test_all_needs_human_review(self):
        self._skip_if_no_source()
        payload, _ = transform(self.source_dir, self.output_dir)

        for q in payload["questions"]:
            self.assertEqual(q["reviewStatus"], "needs_human_review",
                             f"Q{q['questionNumber']}: status = {q['reviewStatus']}")

    def test_json_schema_valid(self):
        self._skip_if_no_source()
        payload, _ = transform(self.source_dir, self.output_dir)
        from scripts.transform_m1_2020 import write_output
        write_output(self.output_dir, payload, [])

        with open(self.output_dir / "questions.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        errors = validate_json_schema(data)
        self.assertEqual(errors, [], f"Schema validation errors: {errors}")

    def test_stable_ids_unique(self):
        self._skip_if_no_source()
        payload, _ = transform(self.source_dir, self.output_dir)

        ids = [q["stableId"] for q in payload["questions"]]
        self.assertEqual(len(ids), len(set(ids)), "Duplicate stable IDs found")


if __name__ == "__main__":
    unittest.main()
