"""
Unit tests for inventory.py

Run with:
    python -m unittest tests.test_inventory

Requirements: Python 3.8+ standard library only (unittest).
"""

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
import inventory as inv


class TestExtractYear(unittest.TestCase):
    """Test year extraction from file paths."""

    def test_math1_paper_year(self):
        self.assertEqual(inv._extract_year(
            "papers/2020年考研数学(一)真题.md"), 2020)

    def test_math1_paper_year_1987(self):
        self.assertEqual(inv._extract_year(
            "papers/1987年考研数学(一)真题.md"), 1987)

    def test_math1_solution_year(self):
        self.assertEqual(inv._extract_year(
            "solutions/2020年解析/2020年解析.md"), 2020)

    def test_math2_paper_year(self):
        self.assertEqual(inv._extract_year(
            "papers/math2_2020.pdf"), 2020)

    def test_math2_mineru_year(self):
        self.assertEqual(inv._extract_year(
            "papers/MinerU_markdown_math2_2020_2065687152877731840.md"), 2020)

    def test_math2_solution_year(self):
        self.assertEqual(inv._extract_year(
            "solutions/2020/math2_2020/math2_2020.md"), 2020)

    def test_math2_image_in_solution(self):
        self.assertEqual(inv._extract_year(
            "solutions/2020/math2_2020/images/some_image.jpg"), 2020)

    def test_no_year(self):
        self.assertIsNone(inv._extract_year("LICENSE"))
        self.assertIsNone(inv._extract_year("README.md"))
        self.assertIsNone(inv._extract_year(".gitignore"))

    def test_year_in_english_dir(self):
        # Year extraction from contamination paths still works
        self.assertEqual(inv._extract_year(
            "solutions/英语一/答案解析_2019/.../file.md"), 2019)


class TestYearRange(unittest.TestCase):
    """Test year range extraction."""

    def test_merged_file_range(self):
        start, end = inv._extract_years_from_range(
            "papers/math2_1987-2019.pdf")
        self.assertEqual(start, 1987)
        self.assertEqual(end, 2019)

    def test_no_range(self):
        start, end = inv._extract_years_from_range(
            "papers/math2_2020.pdf")
        self.assertIsNone(start)
        self.assertIsNone(end)

    def test_solution_range(self):
        start, end = inv._extract_years_from_range(
            "solutions/math2_1987-2019/layout.json")
        self.assertEqual(start, 1987)
        self.assertEqual(end, 2019)


class TestClassifyFile(unittest.TestCase):
    """Test file classification."""

    def test_math1_paper_md(self):
        self.assertEqual(
            inv._classify_file("papers/2020年考研数学(一)真题.md"),
            "paper_markdown")

    def test_math2_paper_pdf(self):
        self.assertEqual(
            inv._classify_file("papers/math2_2020.pdf"),
            "paper_pdf")

    def test_solution_md(self):
        self.assertEqual(
            inv._classify_file("solutions/2020年解析/2020年解析.md"),
            "solution_markdown")

    def test_content_list_json(self):
        self.assertEqual(
            inv._classify_file("solutions/2020年解析/content_list_v2.json"),
            "content_list_json")

    def test_model_json(self):
        self.assertEqual(
            inv._classify_file("solutions/2020年解析/some_uuid_model.json"),
            "model_json")

    def test_layout_json(self):
        self.assertEqual(
            inv._classify_file("solutions/2020年解析/layout.json"),
            "layout_json")

    def test_image(self):
        self.assertEqual(
            inv._classify_file("solutions/2020年解析/images/abc123.jpg"),
            "image")

    def test_license(self):
        self.assertEqual(inv._classify_file("LICENSE"), "license_file")

    def test_readme(self):
        self.assertEqual(inv._classify_file("README.md"), "readme_file")

    def test_gitignore(self):
        self.assertEqual(inv._classify_file(".gitignore"), "gitignore")

    def test_contamination_english(self):
        self.assertEqual(
            inv._classify_file("solutions/英语一/答案解析_2019/file.md"),
            "contamination")

    def test_contamination_math3(self):
        self.assertEqual(
            inv._classify_file("solutions/math3/2020解析/file.md"),
            "contamination")


class TestParseGitStatus(unittest.TestCase):
    """Test git status parsing."""

    def test_untracked(self):
        result = inv._parse_git_status([
            "?? papers/MinerU_markdown_math2_2020_1234.md"
        ])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["status"], "untracked")
        self.assertIn("MinerU_markdown_math2_2020", result[0]["path"])

    def test_modified(self):
        result = inv._parse_git_status([" M modified_file.md"])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["status"], "modified")

    def test_empty(self):
        result = inv._parse_git_status([])
        self.assertEqual(len(result), 0)

    def test_multiple(self):
        result = inv._parse_git_status([
            "?? untracked1.md",
            "?? untracked2.md",
            " M modified.md",
        ])
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["status"], "untracked")
        self.assertEqual(result[2]["status"], "modified")

    def test_identified_untracked_files_are_sorted(self):
        repo = {
            "files": [
                {"relativePath": "papers\\z.md"},
                {"relativePath": "papers\\a.md"},
            ]
        }
        parsed = [
            {"status": "untracked", "path": "papers/z.md"},
            {"status": "untracked", "path": "papers/a.md"},
        ]

        self.assertEqual(
            inv._identify_untracked_files(repo, parsed),
            ["papers\\a.md", "papers\\z.md"],
        )


class TestRepoName(unittest.TestCase):
    """Test repository name extraction."""

    def test_windows_path(self):
        name = inv._repo_name_from_root(
            r"D:\work\Kaoyan-Math1-Papers")
        self.assertEqual(name, "Kaoyan-Math1-Papers")

    def test_unix_path(self):
        name = inv._repo_name_from_root(
            "/home/work/Kaoyan-Math2-Papers")
        self.assertEqual(name, "Kaoyan-Math2-Papers")


class TestFormatSize(unittest.TestCase):
    """Test file size formatting."""

    def test_bytes(self):
        self.assertEqual(inv._format_size(500), "500 B")

    def test_kb(self):
        self.assertEqual(inv._format_size(1536), "1.5 KB")

    def test_mb(self):
        self.assertEqual(inv._format_size(2 * 1024 * 1024), "2.0 MB")


class TestBuildInventory(unittest.TestCase):
    """Integration-style tests using a minimal source-before.json fixture."""

    def _make_fixture(self, tmpdir):
        """Create a minimal source-before.json fixture."""
        fixture = {
            "capturedAt": "2026-06-14T16:33:12.7352037+08:00",
            "repositories": [
                {
                    "root": "D:\\work\\Kaoyan-Math1-Papers",
                    "headCommit": "abc123def456",
                    "dirty": False,
                    "gitStatus": [],
                    "files": [
                        {
                            "relativePath": "LICENSE",
                            "length": 954,
                            "lastWriteTimeUtc": "2026-06-13T06:15:18Z",
                            "sha256": "AAAA"
                        },
                        {
                            "relativePath": "papers\\2020年考研数学(一)真题.md",
                            "length": 5000,
                            "lastWriteTimeUtc": "2026-06-13T06:15:18Z",
                            "sha256": "BBBB"
                        },
                        {
                            "relativePath": "solutions\\2020年解析\\2020年解析.md",
                            "length": 8000,
                            "lastWriteTimeUtc": "2026-06-13T06:15:18Z",
                            "sha256": "CCCC"
                        },
                        {
                            "relativePath": "solutions\\1994年解析\\1994年解析.md",
                            "length": 2000,
                            "lastWriteTimeUtc": "2026-06-13T06:15:18Z",
                            "sha256": "DDDD"
                        },
                        {
                            "relativePath": "solutions\\英语一\\答案解析_2019\\file.md",
                            "length": 1000,
                            "lastWriteTimeUtc": "2026-06-13T06:15:18Z",
                            "sha256": "EEEE"
                        },
                    ]
                }
            ]
        }
        path = os.path.join(tmpdir, "source-before.json")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(fixture, f)
        return path

    def test_inventory_structure(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = self._make_fixture(tmpdir)
            inventory = inv.build_inventory(fixture_path)

            self.assertEqual(inventory["schemaVersion"], "source-inventory-v1")
            self.assertEqual(len(inventory["repositories"]), 1)

            repo = inventory["repositories"][0]
            self.assertEqual(repo["sourceRepo"], "Kaoyan-Math1-Papers")
            self.assertEqual(repo["subjectCode"], "math1")
            self.assertEqual(repo["totalFiles"], 5)
            self.assertFalse(repo["dirty"])

            # Anomalies should include:
            # - solution_without_paper (1994)
            # - contamination (英语一)
            # - license_note
            # - paper_without_solution (2020 has paper but no matching sol match pattern)
            anomaly_types = {a["type"] for a in inventory["anomalies"]}
            self.assertIn("contamination", anomaly_types)
            self.assertIn("solution_without_paper", anomaly_types)
            self.assertIn("license_note", anomaly_types)

    def test_deterministic_output(self):
        """Same fixture should produce identical inventory twice."""
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = self._make_fixture(tmpdir)
            inv1 = inv.build_inventory(fixture_path)
            inv2 = inv.build_inventory(fixture_path)

            # Compare as JSON strings for exact match
            s1 = json.dumps(inv1, ensure_ascii=False, indent=2, sort_keys=True)
            s2 = json.dumps(inv2, ensure_ascii=False, indent=2, sort_keys=True)
            self.assertEqual(s1, s2,
                             "Inventory output must be deterministic")

    def test_merged_year_range_is_grouped(self):
        """A merged directory should produce one grouped anomaly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = self._make_fixture(tmpdir)
            with open(fixture_path, "r", encoding="utf-8") as f:
                fixture = json.load(f)
            fixture["repositories"][0]["files"].extend([
                {
                    "relativePath": "solutions\\math2_1987-2019\\a.md",
                    "length": 1,
                    "lastWriteTimeUtc": "2026-06-13T06:15:18Z",
                    "sha256": "RANGE-A",
                },
                {
                    "relativePath": "solutions\\math2_1987-2019\\b.md",
                    "length": 1,
                    "lastWriteTimeUtc": "2026-06-13T06:15:18Z",
                    "sha256": "RANGE-B",
                },
            ])
            with open(fixture_path, "w", encoding="utf-8") as f:
                json.dump(fixture, f)

            inventory = inv.build_inventory(fixture_path)
            anomalies = [
                a for a in inventory["anomalies"]
                if a["type"] == "merged_year_range"
            ]

            self.assertEqual(len(anomalies), 1)
            self.assertEqual(anomalies[0]["totalFiles"], 2)

    def test_generated_at_matches_captured_at(self):
        """generatedAt should match capturedAt for determinism."""
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = self._make_fixture(tmpdir)
            inventory = inv.build_inventory(fixture_path)

            self.assertEqual(
                inventory["generatedAt"], inventory["capturedAt"],
                "generatedAt must equal capturedAt for deterministic output"
            )

    def test_accepts_utf8_bom_snapshot(self):
        """PowerShell-generated source snapshots may include a UTF-8 BOM."""
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = self._make_fixture(tmpdir)
            with open(fixture_path, "r", encoding="utf-8") as f:
                fixture = json.load(f)
            with open(fixture_path, "w", encoding="utf-8-sig") as f:
                json.dump(fixture, f, ensure_ascii=False)

            inventory = inv.build_inventory(fixture_path)

            self.assertEqual(inventory["summary"]["totalRepositories"], 1)

    def test_files_sorted(self):
        """Files should be sorted by relativePath."""
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture_path = self._make_fixture(tmpdir)
            inventory = inv.build_inventory(fixture_path)

            for repo in inventory["repositories"]:
                paths = [f["relativePath"] for f in repo["files"]]
                self.assertEqual(paths, sorted(paths),
                                 "Files must be sorted by relativePath")

    def test_math2_missing_license(self):
        """Math2 repo without LICENSE should trigger no_license anomaly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture = {
                "capturedAt": "2026-06-14T16:33:12Z",
                "repositories": [{
                    "root": "D:\\work\\Kaoyan-Math2-Papers",
                    "headCommit": "def456",
                    "dirty": False,
                    "gitStatus": [],
                    "files": [
                        {
                            "relativePath": "README.md",
                            "length": 874,
                            "sha256": "FFFF"
                        },
                        {
                            "relativePath": "papers\\math2_2020.pdf",
                            "length": 995159,
                            "sha256": "GGGG"
                        },
                    ]
                }]
            }
            path = os.path.join(tmpdir, "source-before.json")
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(fixture, f)
            inventory = inv.build_inventory(path)

            anomaly_types = {a["type"] for a in inventory["anomalies"]}
            self.assertIn("no_license", anomaly_types)

    def test_dirty_repo_anomaly(self):
        """Dirty repo should produce dirty_repository anomaly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            fixture = {
                "capturedAt": "2026-06-14T16:33:12Z",
                "repositories": [{
                    "root": "D:\\work\\Kaoyan-Math2-Papers",
                    "headCommit": "def456",
                    "dirty": True,
                    "gitStatus": [
                        "?? papers/MinerU_markdown_math2_2020_123.md"
                    ],
                    "files": [
                        {
                            "relativePath": "README.md",
                            "length": 874,
                            "sha256": "FFFF"
                        },
                        {
                            "relativePath": "papers\\MinerU_markdown_math2_2020_123.md",
                            "length": 6000,
                            "sha256": "HHHH"
                        },
                    ]
                }]
            }
            path = os.path.join(tmpdir, "source-before.json")
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(fixture, f)
            inventory = inv.build_inventory(path)

            anomaly_types = {a["type"] for a in inventory["anomalies"]}
            self.assertIn("dirty_repository", anomaly_types)
            self.assertIn("untracked_files", anomaly_types)


class TestAnomalyReport(unittest.TestCase):
    """Test anomaly report generation."""

    def test_report_contains_required_sections(self):
        """Report should contain key sections."""
        inventory = {
            "capturedAt": "2026-06-14T16:33:12Z",
            "sourceSnapshot": {
                "runId": "20260614-163308-cc-inventory",
                "sourceBeforePath": "source-before.json",
            },
            "summary": {
                "totalRepositories": 2,
                "totalFiles": 10,
                "totalAnomalies": 3,
            },
            "anomalies": [
                {
                    "type": "contamination",
                    "severity": "error",
                    "subject": "math1",
                    "repository": "Kaoyan-Math1-Papers",
                    "detail": "1 file in wrong-subject directory",
                    "action": "isolate",
                },
                {
                    "type": "missing_paper_years",
                    "severity": "warning",
                    "subject": "math1",
                    "repository": "Kaoyan-Math1-Papers",
                    "detail": "Missing year 1994",
                },
                {
                    "type": "merged_year_range",
                    "severity": "info",
                    "subject": "math2",
                    "repository": "Kaoyan-Math2-Papers",
                    "detail": "File covers 1987-2019",
                    "action": "must split",
                },
            ],
            "knownRisksForContentScan": {
                "math2_ocr_noise": {
                    "description": "Possible OCR noise",
                    "source": "spec",
                    "detected_in_inventory": False,
                    "requires_content_scan": True,
                }
            }
        }
        report = inv.generate_anomaly_report(inventory)

        self.assertIn("Source Inventory Anomaly Report", report)
        self.assertIn("Errors", report)
        self.assertIn("Warnings", report)
        self.assertIn("Info", report)
        self.assertIn("contamination", report)
        self.assertIn("Known Risks", report)
        self.assertIn("Summary", report)

    def test_report_with_no_anomalies(self):
        inventory = {
            "capturedAt": "2026-06-14T16:33:12Z",
            "sourceSnapshot": {
                "runId": "20260614-163308-cc-inventory",
                "sourceBeforePath": "source-before.json",
            },
            "summary": {
                "totalRepositories": 1,
                "totalFiles": 1,
                "totalAnomalies": 0,
            },
            "anomalies": [],
            "knownRisksForContentScan": {},
        }
        report = inv.generate_anomaly_report(inventory)
        self.assertIn("Source Inventory Anomaly Report", report)
        self.assertNotIn("Errors", report)


if __name__ == "__main__":
    unittest.main()
