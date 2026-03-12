"""End-to-end tests using Playwright."""
import pytest

BASE_URL = "https://devontallman.github.io/mark-scheme-method-pilot"


@pytest.mark.parametrize("path,needle", [
    ("/topics.html", "MISSION"),
    ("/dashboard.html", ""),
    ("/hub.html", ""),
])
def test_page_loads(page, path, needle):
    response = page.goto(f"{BASE_URL}{path}")
    assert response.status == 200, f"{path} returned {response.status}"
    if needle:
        assert needle in page.content()
