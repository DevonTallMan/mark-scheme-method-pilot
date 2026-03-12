"""Unit tests for the Mark Scheme Method platform."""


def test_content_area_filenames_are_well_formed():
    content_files = [
        "classroom-611-v3.html",
        "6-1-2-why-organisations-need-data.html",
    ]
    for name in content_files:
        assert name.endswith(".html"), f"{name} should end with .html"
        assert len(name) > 5, f"{name} should have a meaningful name"


def test_topic_slugs_are_lowercase_with_hyphens():
    slugs = ["6-1-1", "6-1-2", "6-1-3", "6-1-4"]
    for slug in slugs:
        assert slug == slug.lower()
        assert " " not in slug
