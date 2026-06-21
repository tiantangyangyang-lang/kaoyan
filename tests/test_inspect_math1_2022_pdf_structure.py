import unittest
from pathlib import Path

from scripts.inspect_math1_2022_pdf_structure import inspect


SOURCE = Path(r"D:\work\Kaoyan-Math1-Papers\solutions\2022年解析\content_list_v2.json")


class TestInspectMath12022PdfStructure(unittest.TestCase):
    def test_real_structure_map(self):
        results = inspect(SOURCE)
        self.assertEqual(len(results), 26)
        detected = {
            number
            for page in results
            for number in page["questionStarts"]
        }
        self.assertTrue({1, 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22}.issubset(detected))
        self.assertFalse({3, 4, 5}.intersection(detected))


if __name__ == "__main__":
    unittest.main()
