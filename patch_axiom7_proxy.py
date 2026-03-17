—───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────——────────────────────────────────────────────—────────────────────────────────────────────────────────────────────────────────────────────────────────────—────────────────────——────────────────────────────────────——───────────────────────────────────────────────────────────#!/usr/bin/env python3
"""
patch_axiom7_proxy.py
Stage 5: Update AXIOM-7 client code in learn/6-1-3/index.html
to use the Cloudflare Worker proxy instead of calling Groq directly.

Usage:
    python patch_axiom7_proxy.py

    Replace YOUR_SUBDOMAIN with your actual Cloudflare workers.dev subdomain
    before running, or set the WORKER_URL environment variable.
    """

import os
import re
import sys

TARGET_FILE = os.path.join("learn", "6-1-3", "index.html")
WORKER_URL = os.environ.get(
      "WORKER_URL",
      "https://msm-axiom-proxy.YOUR_SUBDOMAIN.workers.dev/api/axiom"
)


def patch(src: str) -> str:
      # 1. Replace the Groq API URL constant with the Worker URL constant
      src = re.sub(
                r"const\s+PA_GROQ_URL\s*=\s*'https://api\.groq\.com/openai/v1/chat/completions'\s*;",
                f"const AXIOM_WORKER_URL = '{WORKER_URL}';",
                src
      )

    # 2. Replace usage of PA_GROQ_URL with AXIOM_WORKER_URL in fetch calls
      src = src.replace("PA_GROQ_URL,", "AXIOM_WORKER_URL,")
      src = src.replace("PA_GROQ_URL)", "AXIOM_WORKER_URL)")

    # 3. Remove the Authorization header line (key no longer sent from browser)
      src = re.sub(
          r"\s*'Authorization':\s*`Bearer \$\{[^`}]+\}`\s*,?\n?",
          "\n",
          src
      )

    # 4. Remove const key = paGetKey(); line in paRunAxiom7
      src = re.sub(r"\s*const key\s*=\s*paGetKey\(\)\s*;\n?", "\n", src)

    # 5. Remove key guard block: if (!key || !key.startsWith('gsk_')) { ... }
      src = re.sub(
          r"\s*if\s*\(\s*!key\s*\|\|\s*!key\.startsWith\('gsk_'\)\s*\)\s*\{[^}]*\}\n?",
          "\n",
          src,
          flags=re.DOTALL
      )

    # 6. Add uid to the body sent to the Worker (for rate limiting)
      src = re.sub(
          r"(const body\s*=\s*\{)",
          r"\1\n        uid: localStorage.getItem('msm_uid') || 'anon',",
          src
      )

    # 7. Stub out key management functions (no longer needed)
      stubs = """
  // Stage 5: API key management removed — key is held server-side in CF Worker
  function paKeyInput() { return ''; }
  function paSaveKey() {}
  function paGetKey() { return ''; }
  function paInitArena() { paRenderMissions(); }
  """
      for fn_name in ["paKeyInput", "paSaveKey", "paGetKey", "paInitArena"]:
                src = re.sub(
                              r"function\s+" + fn_name + r"\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}",
                              "",
                              src,
                              flags=re.DOTALL
                )
            # Insert stubs before closing script tag
            src = src.replace("</script>", stubs + "\n</script>", 1)

    # 8. Remove the .pa-config API key input bar from HTML
    src = re.sub(
              r'<div[^>]+class="[^"]*pa-config[^"]*"[^>]*>.*?</div>',
              "<!-- Stage 5: API key input removed — key held in CF Worker -->",
              src,
              flags=re.DOTALL
    )

    # 9. Remove localStorage get/set for axiom7_groq_key
    src = re.sub(
              r"localStorage\.(setItem|getItem|removeItem)\('axiom7_groq_key'[^)]*\)\s*;?\n?",
              "",
              src
    )

    return src


def main():
      if not os.path.exists(TARGET_FILE):
                print(f"ERROR: {TARGET_FILE} not found. Run from repo root.")
                sys.exit(1)

    with open(TARGET_FILE, "r", encoding="utf-8") as f:
              original = f.read()

    patched = patch(original)

    if patched == original:
              print("WARNING: No changes made. Check regex patterns match the source.")
              sys.exit(1)

    with open(TARGET_FILE, "w", encoding="utf-8") as f:
              f.write(patched)

    print(f"OK: Patched {TARGET_FILE}")
    print("Next steps:")
    print("  1. Set WORKER_URL in the file or via env var to your actual workers.dev URL")
    print("  2. Run: grep -i groq learn/6-1-3/index.html  (should return nothing)")
    print("  3. Commit: git add learn/6-1-3/index.html && git commit -m 'Stage 5: Remove client-side Groq key, use CF Worker proxy'")


if __name__ == "__main__":
      main()
