# AGENTS.md — MSM Platform Non-Negotiable Standards

This file is injected into every AI-assisted session working on the
`DevonTallMan/mark-scheme-method-pilot` repository. All rules below are
mandatory. Deviation requires explicit written approval from the project owner.

---

## Repo context

- **Stack:** Vanilla HTML/CSS/JS · Firebase Firestore v10 modular SDK · Groq API
  (`llama-3.3-70b-versatile`) via AXIOM-7 Cloudflare Worker proxy · GitHub Pages
  · GitHub Actions CI/CD
- **Live URL:** `https://devontallman.github.io/mark-scheme-method-pilot`
- **Deployment:** Every commit to `main` deploys immediately to GitHub Pages.
  There is no build step. Treat every push to `main` as a production release.
- **Active pilot:** Class code `5MFH4P`, teacher Dave Smith. Real students are
  using the live platform. Do not break the live site.

---

## Branch rules

- **Never commit feature changes directly to `main`** unless the change is a
  single-line hotfix with an explicit instruction to do so.
- New features and copy changes go to a named branch (e.g. `voice-v2`,
  `nav-improvements`). Merge to `main` only after explicit approval.
- When creating a branch via the GitHub Contents API, every subsequent PUT
  request must include the `branch` parameter to target that branch.

---

## GitHub Actions — mandatory workflow pattern

Every workflow MUST include a sync step immediately after checkout and before
any file changes. No exceptions.

```yaml
- name: Sync with latest remote main
  run: git fetch origin main && git merge origin/main --ff-only
```

Failure to include this step causes non-fast-forward push failures. It has
caused wasted runs on this repo multiple times. It is non-negotiable.

---

## GitHub Contents API — commit method

Bash tool returns 403 for `api.github.com` (proxy block). The only reliable
commit method in this environment is browser `fetch` via the Claude in Chrome
extension.

**Always decode with TextDecoder — never use `atob()` directly as a string:**

```js
const bytes = Uint8Array.from(atob(d.content.replace(/\n/g,'')), c => c.charCodeAt(0));
const text = new TextDecoder('utf-8').decode(bytes);
```

`atob()` alone returns latin-1 and corrupts multi-byte characters (emojis, ®, —).

**Always re-encode in chunks to avoid call stack limits on large files:**

```js
const bytes2 = new TextEncoder().encode(text);
const chunks = [];
for (let i = 0; i < bytes2.length; i += 8192) {
  chunks.push(String.fromCharCode(...bytes2.slice(i, i + 8192)));
}
const encoded = btoa(chunks.join(''));
```

**Always fetch the current SHA before any PUT:**

```js
const d = await fetch('https://api.github.com/repos/.../contents/path', { headers }).then(r => r.json());
window._fileSha = d.sha;
```

**Always strip newlines from API content before decoding:**

```js
d.content.replace(/\n/g, '')
```

---

## PAT hygiene

- PATs are created with `repo` scope and 1-day expiry only.
- Revoke the PAT at `https://github.com/settings/tokens` at the end of every
  session. Never leave a PAT active overnight.
- `workflow` scope is required to commit files under `.github/workflows/`. If
  the PAT only has `repo` scope, commit workflow files via the GitHub web editor
  instead.

---

## Verification rules (anti-cardboard-muffin)

Verify steps MUST check for specific content strings, not just marker comments.

**Wrong — passes even if patch did nothing:**
```bash
grep -q '<!-- MSM-VOICE-V2 -->' file.html && echo "OK"
```

**Right — confirms actual content was changed:**
```bash
grep -q "Here's something most students don't know" learn/6-1-1/index.html && echo "OK"
```

For any patch touching multiple files, verify at least one content-specific
string per file. Enumerate the count explicitly: "6 of 6 FT files patched,
18 of 18 AXIOM-7 feedback states updated."

Verify steps MUST exit 1 on failure. Silent success on missing content is the
single most common failure mode on this repo.

```bash
grep -q 'expected string' file.html || { echo "FAIL"; exit 1; }
```

---

## Python in GitHub Actions YAML

Never embed multi-line Python as heredocs in `run: |` blocks. The YAML parser
rejects unindented content.

Always base64-encode Python scripts and invoke as:

```bash
echo "BASE64_STRING" | base64 -d > /tmp/p.py && python3 /tmp/p.py
```

Or commit the script as a repo file (e.g. `.github/scripts/patch.py`) and call
it directly:

```bash
python3 .github/scripts/patch.py
```

Base64 characters `[A-Za-z0-9+/=]` are safe inside YAML strings with no
quoting conflicts.

---

## Firebase

- Platform uses Firestore v10 **modular SDK** — not compat, not Realtime
  Database.
- `firebase-config.js` exposes `window.MSM_DB` and `window.MSM_APP`.
- Auth requires `getAuth(window.MSM_APP)`.
- Security rules are deployed via the Firebase console CodeMirror API.

---

## Review page format

Review pages use `var QS=[{t:"mcq",...}]` — not `const QUESTIONS`.

Any workflow regex targeting `QUESTIONS` will silently skip these files.
Always target `var QS` when patching review page question arrays.

---

## Classroom page localStorage keys

The classroom template STEPS array ends at approximately character position
54821 (bracket-counting), not at `const BADGES` (position ~77008).

The `_pb`, `_badges` and `_completions` localStorage keys live in the game
engine code between STEPS end and BADGES. Replace `msm_611_` globally (covers
all three variants) AFTER injecting STEPS content, never before.

---

## Content path — file locations

| Stage | Path pattern |
|---|---|
| Field Training | `learn/6-x-x/index.html` |
| Classroom Lesson | `content-areas/classroom-6xx.html` |
| Solo Module | `6-x-x/index.html` |
| Return Mission | `review-6xx.html` |

Solo module directories only exist for CAs 6.1.1–6.1.4. The `6-2/`, `6-3/`
and `6-4/` solo module pages have not been built yet (as of April 2026).

---

## AXIOM-7 proxy

- Endpoint: `msm-axiom-proxy.morrischristopher675.workers.dev`
- Model: `llama-3.3-70b-versatile`, temperature 0.3
- All classroom files must call the proxy — never `api.groq.com` directly.
- The system prompt that governs AXIOM-7's marking voice and feedback register
  is the `var sys` string in the `handleNEI` function in each review page
  (review-611.html, review-612.html, review-613.html, review-62.html, review-63.html).

---

## Brand voice — strategic context and approved changes

### Why the voice is changing

This repositioning is driven by five years of direct classroom observation by
the project owner (an experienced FE practitioner and T-Level Digital teacher)
and corroborated through conversations with other FE teachers. It is not
speculative.

**The core insight:** Proactive learners will engage with revision content
regardless of how it is framed. Less confident students are highly sensitive to
signals that say "this is not for you" or "you have already failed." The
previous MSM voice sent those signals at two specific moments: the Field
Training briefing opener and the AXIOM-7 marking feedback.

**The secondary issue:** AXIOM-7 feedback assumed a frame of reference that
T-Level Digital students (typically 16-18 years old) do not yet have. Telling a
student to "demonstrate the impact on the organisation" is meaningless if they
have never worked in one. The feedback was technically accurate but practically
useless for the students who most needed it.

### The middle path — what changes and what does not

This is a repositioning of tone and relationship, not a dilution of the
examiner credential. The relationship implied shifts from examiner-as-judge to
examiner-as-insider. Students are being let in on what the examiner looks for,
not assessed against a standard they may already feel they cannot meet.

What changes:
- AXIOM-7 voice: verdict delivery replaced with coaching
- Field Training briefing: threat framing replaced with insider knowledge
- Statistics removed from briefing openers entirely
- Feedback anchored in everyday contexts the student can relate to
- Feedback affirms what is right before addressing the gap

What stays the same:
- N·E·I framework (Name, Explain, Impact)
- Three-stage content path (Field Training, Classroom, Solo Module)
- Examiner credential as the basis for authority
- Accuracy of what earns marks in every feedback template
- Mark scheme methodology throughout

### Approved AXIOM-7 feedback pattern

Every feedback response must follow this structure in order:

1. Affirm — acknowledge what the student got right before addressing the gap
2. Translate — illustrate the missing element using a familiar everyday context
   (supermarket examples are validated and preferred by the project owner)
3. Redirect — send the student back to their own answer with a concrete prompt
   such as "What's different the next day because of this?"

The supermarket context is validated as appropriate for this student cohort.
Use it as the primary reference scenario across all CAs unless a CA-specific
context is more natural (hospital or bank for 6.1.3, banking for 6.3).

### Approved Field Training briefing opener pattern

Replace the THREAT ASSESSMENT opener only. The pattern is:

"Here's something most students don't know until it's too late: [the specific
examiner insight for this CA]. This module [shows you / walks you through /
gives you] [what that means in practice]."

The framing is always: the student is being given insider knowledge, not warned
about a failure rate.

### Explicit constraints — do not change without written approval

- The N·E·I framework terminology (Name, Explain, Impact)
- The three-stage content path (Field Training, Classroom, Solo Module)
- The examiner credential language in headers and module titles
- The accuracy of what earns marks in any feedback template
- The Examiner Secrets sections in classroom pages
- Any content in the Return Mission review pages
- Any content in the Dashboard or teacher portal

### Implementation scope

Changes are limited to:
- briefingScript array item index 1 (the THREAT ASSESSMENT item) in each
  learn/6-x-x/index.html file — 6 files
- The AXIOM-7 system prompt governing marking feedback — the `var sys` string
  inside the `handleNEI` function in each of the 5 review pages:
  review-611.html, review-612.html, review-613.html, review-62.html, review-63.html

No other files are in scope for the voice-v2 branch unless explicitly approved.

### Layer roadmap (do not implement without separate approval)

The voice changes are Layer 2 of a three-layer brand repositioning:
- Layer 1 (landing page positioning) — not yet approved
- Layer 2 (copy and tone) — approved, in scope for voice-v2
- Layer 3 (visual identity) — not yet approved

Do not make any Layer 1 or Layer 3 changes in the voice-v2 branch.

---

## Destructive operations — absolute prohibitions

These rules exist because AI-assisted git operations have caused permanent data
loss on other projects. They are non-negotiable on this repo.

**Never run any of the following without explicit written approval from the
project owner, stated in the same session:**

- `git branch -D` or `git push --delete` (branch deletion)
- `git push --force` or `git push --force-with-lease` (force push)
- `git clean -fd` or `git reset --hard` (working directory destruction)
- `rm -rf` on any directory containing tracked files
- Any GitHub API DELETE request targeting a branch, file, or repository

If an operation would remove or overwrite more than one file, state the full
list of affected files and wait for explicit confirmation before proceeding.

**Blast radius rule:** Before any commit touching more than 5 files, state:
- How many files will change
- What will change in each one
- What will not change

Then wait for confirmation.

---

## File size and complexity guardrails

The Eldritch Horror failure mode — a codebase mutating into an unmaintainable
monolith through rapid AI-assisted additions — is a real risk on this repo.
Several files are already large (classroom pages exceed 98,000 characters).

**After any commit that modifies an existing file, check:**

```bash
wc -c filename.html
```

If a file has grown by more than 20% in a single commit, flag it before
pushing. Do not silently commit large additions without noting the size change.

**No function or script committed to this repo should exceed 200 lines.**
If a patch script is growing beyond this, split it into smaller targeted
scripts per file group rather than one monolithic patcher.

---

## Verify step integrity

Verify steps exist to catch failures. They must not be softened, simplified,
or made conditional in ways that allow failures to pass silently.

**The following are prohibited in verify steps:**

- Checking for marker comments instead of actual content strings
- Using `grep -q` without `|| { echo "FAIL"; exit 1; }`
- Wrapping verify steps in `if` blocks that suppress failure
- Removing or combining verify checks to save lines

If a verify step is failing, the correct response is to fix the patch — not
to weaken the verify step. Any modification to a verify step requires explicit
approval from the project owner.

**Verify steps must enumerate counts explicitly:**
"6 of 6 FT briefing files patched" — not "FT briefing files patched."

---

## Post-merge smoke test

After any merge to `main`, run the following checks before closing the session.
This addresses the Disobedient Chef failure mode — brittle local workarounds
that appear to work but break on deployment.

1. Load `https://devontallman.github.io/mark-scheme-method-pilot/` and confirm
   the page renders
2. Load one Field Training module and confirm the briefing script fires
3. Submit a test NEI answer in a Solo Module and confirm AXIOM-7 responds
4. Check the browser console for errors on each page loaded

If any check fails, revert the merge immediately using a new commit that
restores the previous file content — do not use `git revert` or force push.

---

## Voice changes — implementation plan (voice-v2 branch)

Run these steps in order when the browser extension reconnects.

### Step 1 — Create branch
Create `voice-v2` from current HEAD of main via the GitHub Contents API.
Every subsequent commit in this session must include `"branch": "voice-v2"` in
the PUT body.

### Step 2 — Confirm AXIOM-7 prompt location
Read the 6.1.1 solo module file (`6-1-1/index.html`) and confirm whether the
system prompt governing AXIOM-7's marking voice is embedded in the HTML or
routed through the Cloudflare Worker. Update the AGENTS.md location entry if needed — confirmed location is
  `var sys` in `handleNEI` in each of the 5 review pages.

### Step 3 — Commit AGENTS.md to voice-v2
Commit this file to `voice-v2` as the first committed change.

### Step 4 — Patch Field Training briefing openers (6 files)
Replace the THREAT ASSESSMENT opener in the `briefingScript` array in each
`learn/6-x-x/index.html` file with the approved copy from the voice changes
document.

Verify each file with a content-specific string check — not a marker comment:
```bash
grep -q "Here's something most students don't know" learn/6-1-1/index.html || { echo "FAIL 6.1.1"; exit 1; }
grep -q "Examiners see a lot of answers" learn/6-1-2/index.html || { echo "FAIL 6.1.2"; exit 1; }
grep -q "One of the most common mistakes" learn/6-1-3/index.html || { echo "FAIL 6.1.3"; exit 1; }
grep -q "Examiners aren't looking for a list" learn/6-2/index.html || { echo "FAIL 6.2"; exit 1; }
grep -q "Validation and verification are two" learn/6-3/index.html || { echo "FAIL 6.3"; exit 1; }
grep -q "The most common mistake examiners see" learn/6-4/index.html || { echo "FAIL 6.4"; exit 1; }
```

Confirm count: **6 of 6 FT briefing openers patched.**

### Step 5 — Patch AXIOM-7 feedback (18 states across 6 CAs)
Apply the approved feedback templates for all three marking states (Name
missing, Explain missing, Impact missing) across all six content areas.

Verify with content-specific string checks per CA — example for 6.1.1:
```bash
grep -q "Your Name and Explain are solid" 6-1-1/index.html || { echo "FAIL axiom 6.1.1 impact"; exit 1; }
```

Confirm count: **18 of 18 AXIOM-7 feedback states patched.**

### Step 6 — Runtime QA test (vibe coding grown-ups check)
This step verifies the outcome, not just the commit.

After patching, load the CA 6.1.1 Solo Module page from the `voice-v2` branch
preview (if GitHub Pages can serve branches, otherwise load the file directly).
Submit a deliberately weak NEI answer — for example:

> "Data is information. It helps organisations make decisions. This is important
> for the business."

Read the actual AXIOM-7 output. Confirm:
- The feedback affirms what the student got right before addressing the gap
- The missing element is illustrated with a familiar everyday context
  (supermarket or equivalent)
- The tone is coaching, not verdict delivery
- No phrases like "You have not demonstrated" appear in the output

If the output fails this check, the system prompt patch has not taken effect —
do not merge to main until resolved.

### Step 7 — Merge gate
Only merge `voice-v2` to `main` after Step 6 passes. Merge via pull request in
the GitHub UI so the diff is reviewable before it goes live to Dave Smith's
class.

### Step 8 — Clean up
- Revoke PAT at `https://github.com/settings/tokens`
- Clear `window._PAT` from browser memory

---

## Clean-up checklist (run at end of every session)

- [ ] PAT revoked at `https://github.com/settings/tokens`
- [ ] No temporary files left in the repo root
- [ ] No `console.log` debug statements committed
- [ ] Feature branch merged or explicitly left open with a reason
- [ ] `window._PAT` cleared from browser memory if extension was used
