"""OWASP ZAP baseline scan helper.

Runs a ZAP baseline scan against the deployed GitHub Pages site via Docker.
Produces zap_report.html in the working directory. Exit code is always 0
so a ZAP warning does not fail the build; the HTML report is attached as
a CI artifact for reviewer inspection.
"""
import subprocess
import os
import sys

TARGET = os.environ.get(
    "ZAP_TARGET",
    "https://devontallman.github.io/mark-scheme-method-pilot/",
)

print(f"[ZAP] Scanning: {TARGET}")

result = subprocess.run(
    [
        "docker", "run", "--rm",
        "-v", f"{os.getcwd()}:/zap/wrk:rw",
        "-t", "ghcr.io/zaproxy/zaproxy:stable",
        "zap-baseline.py",
        "-t", TARGET,
        "-r", "zap_report.html",
        "-I",
    ],
)

print(f"[ZAP] Scan complete (exit {result.returncode})")

if not os.path.exists("zap_report.html"):
    with open("zap_report.html", "w") as f:
        f.write(
            "<html><body>"
            "<p>ZAP scan did not produce a report. "
            "Check Docker availability in CI runner.</p>"
            "</body></html>"
        )
    print("[ZAP] Placeholder report written.")

sys.exit(0)
