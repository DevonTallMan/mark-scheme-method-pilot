"""Integration tests – verify cross-file link targets exist on disk."""
import os

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

EXPECTED_FILES = [
    "topics.html",
    "dashboard.html",
    "hub.html",
    "index.html",
    "content-areas/classroom-611-v3.html",
    "content-areas/6-1-2-why-organisations-need-data.html",
]


def test_expected_files_present():
    for rel_path in EXPECTED_FILES:
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.exists(full_path), f"Missing file: {rel_path}"


def test_topics_html_references_content_areas():
    with open(os.path.join(REPO_ROOT, "topics.html"), encoding="utf-8") as f:
        content = f.read()
    assert 'href="content-areas/classroom-611-v3.html"' in content
    assert 'href="content-areas/6-1-2-why-organisations-need-data.html"' in content
