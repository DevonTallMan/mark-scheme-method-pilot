#!/usr/bin/env python3
"""
patch_axiom7_proxy.py  (v2 — works on partially-patched file)

Stage 5: Finish wiring learn/6-1-3/index.html to use the Cloudflare Worker
proxy instead of calling Groq directly.

The first pass already:
  - Replaced PA_GROQ_URL with AXIOM_WORKER_URL in the fetch() call
    - Injected msm_uid into the request body

    This pass completes what was missed:
      1. Replace YOUR_SUBDOMAIN placeholder with real subdomain
        2. Stub out paSaveKey() / paGetKey() / paKeyInput() — still have DOM bodies
          3. Remove the pa-config HTML block (key input bar)

          Usage (run from repo root):
              python patch_axiom7_proxy.py

              The WORKER_URL env var is optional — defaults to the correct production URL.
              """

import os
import re
import sys

TARGET_FILE = os.path.join("learn", "6-1-3", "index.html")

SUBDOMAIN = "morrischristopher675"
WORKER_URL = os.environ.get(
        "WORKER_URL",
        f"https://msm-axiom-proxy.{SUBDOMAIN}.workers.dev/api/axiom"
)


def patch(src: str) -> str:
        original = src

    # ------------------------------------------------------------------ #
        # 1. Fix YOUR_SUBDOMAIN placeholder in the AXIOM_WORKER_URL constant  #
        # ------------------------------------------------------------------ #
        src = src.replace(
            "https://msm-axiom-proxy.YOUR_SUBDOMAIN.workers.dev/api/axiom",
            WORKER_URL
        )

    # ------------------------------------------------------------------ #
        # 2. Stub paSaveKey — replace full function body with no-op           #
        # ------------------------------------------------------------------ #
        src = re.sub(
            r'function\s+paSaveKey\s*\(\s*\)\s*\{.*?\}',
            'function paSaveKey() {}',
            src,
            flags=re.DOTALL
        )

    # ------------------------------------------------------------------ #
        # 3. Stub paGetKey — replace full function body, return empty string  #
        # ------------------------------------------------------------------ #
        src = re.sub(
            r'function\s+paGetKey\s*\(\s*\)\s*\{.*?\}',
            "function paGetKey() { return ''; }",
            src,
            flags=re.DOTALL
        )

    # ------------------------------------------------------------------ #
        # 4. Stub paKeyInput — replace full function body with no-op          #
        # ------------------------------------------------------------------ #
        src = re.sub(
            r'function\s+paKeyInput\s*\(\s*\)\s*\{.*?\}',
            'function paKeyInput() {}',
            src,
            flags=re.DOTALL
        )

    # ------------------------------------------------------------------ #
        # 5. Remove pa-config HTML block (API key input bar)                  #
        #    Matches <div class="pa-config ...">...</div> (multiline)         #
        # ------------------------------------------------------------------ #
        src = re.sub(
            r'<div[^>]+class=["\'][^"\']*pa-config[^"\']*["\'][^>]*>.*?</div>',
            '<!-- Stage 5: API key input removed — key held in CF Worker -->',
            src,
            flags=re.DOTALL
        )

    return src


def verify(src: str) -> list[str]:
        """Return a list of problems found in the patched source."""
        problems = []
        if 'YOUR_SUBDOMAIN' in src:
                    problems.append("FAIL: YOUR_SUBDOMAIN placeholder still present")
                if SUBDOMAIN not in src:
                            problems.append(f"FAIL: {SUBDOMAIN} not found in AXIOM_WORKER_URL")
                        if re.search(r'function\s+paSaveKey\s*\(\s*\)\s*\{[^}]+\}', src, re.DOTALL):
                                    problems.append("FAIL: paSaveKey still has a body")
                                if re.search(r'function\s+paGetKey\s*\(\s*\)\s*\{[^}]+\}', src, re.DOTALL):
                                            problems.append("FAIL: paGetKey still has a body")
                                        if 'class="pa-config' in src or "class='pa-config" in src:
                                                    problems.append("FAIL: pa-config HTML block still present")
                                                if 'AXIOM_WORKER_URL' not in src:
                                                            problems.append("FAIL: AXIOM_WORKER_URL constant missing entirely")
                                                        return problems


def main():
        if not os.path.exists(TARGET_FILE):
                    print(f"ERROR: {TARGET_FILE} not found. Run from repo root.")
                    sys.exit(1)

    with open(TARGET_FILE, "r", encoding="utf-8") as f:
                original = f.read()

    patched = patch(original)

    if patched == original:
                print("WARNING: No changes made — file may already be fully patched.")
                problems = verify(original)
                if problems:
                                print("Verification problems found:")
                                for p in problems:
                                                    print(f"  {p}")
                                                sys.exit(1)
    else:
            print("OK: All checks pass — file is already correctly patched.")
                    sys.exit(0)

    problems = verify(patched)
    if problems:
                print("ERROR: Patch applied but verification failed:")
                for p in problems:
                                print(f"  {p}")
                            sys.exit(1)

    with open(TARGET_FILE, "w", encoding="utf-8") as f:
                f.write(patched)

    print(f"OK: Patched {TARGET_FILE}")
    print(f"    Worker URL: {WORKER_URL}")
    print()
    print("Verification checks passed:")
    print("  - YOUR_SUBDOMAIN placeholder replaced")
    print("  - paSaveKey / paGetKey / paKeyInput stubbed out")
    print("  - pa-config HTML block removed")
    print()
    print("Next steps:")
    print("  1. grep -i groq learn/6-1-3/index.html  (expect: only comments/docs)")
    print("  2. git add learn/6-1-3/index.html")
    print("  3. git commit -m 'Stage 5: Fix proxy wiring — real subdomain, stub key fns, remove pa-config'")
    print("  4. git push")


if __name__ == "__main__":
        main()
