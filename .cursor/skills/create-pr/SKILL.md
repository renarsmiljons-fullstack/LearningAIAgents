---
name: create-pr
description: >
  Create a pull request with a clear statement of intent.
  Trigger: When opening a PR, preparing changes for review, or pushing a feature branch.
disable-model-invocation: true
---

## When to Use
- User asks to create or open a pull request
- User says "let's PR this" or "ready for review"
- A feature branch is ready to be proposed against main

---

## Workflow

### Step 1 — Gather Context

Run these in parallel to understand the full scope of the branch:

```bash
git status
git log main..HEAD --oneline
git diff main...HEAD --stat
git diff main...HEAD
```

Review **all** commits on the branch, not just the latest one. The PR represents the entire body of work since diverging from main.

### Step 2 — Draft the PR

The PR body follows a strict structure. **Intent comes first.**

#### Required Sections

**Intent** (mandatory, always first)
1-2 sentences answering: *"Why does this PR exist? What does it achieve?"*

This is the single most important section. If a reader only reads this, they should understand whether the PR is worth looking at and what it accomplishes. Write it as if explaining to someone with zero context.

**Summary**
Bullet points describing what changed. Be specific — reference files, modules, or concepts. Not a commit log rehash; group changes by theme.

**How to verify**
Steps or a checklist for confirming the changes work as intended. Can be manual steps, commands to run, or things to look for.

#### Template

```markdown
## Intent

<Why does this PR exist? What does it achieve?>

## Summary

- <Grouped change 1>
- <Grouped change 2>
- <Grouped change 3>

## How to verify

- [ ] <Verification step 1>
- [ ] <Verification step 2>
```

### Step 3 — Reflect

Before creating the PR, pause and evaluate:

- **Does this PR do one thing well?** If the intent section needs an "and" to explain itself, the PR might be doing too much.
- **Is the intent clear to someone with no context?** Read it as a stranger would.
- **Are there changes that don't belong?** Unrelated formatting, stray refactors, debug leftovers.

If the answer to any of these is unsatisfactory, discuss with the user before proceeding.

### Step 4 — Create

```bash
git push -u origin HEAD

gh pr create --title "<type>(<scope>): <concise title>" --body "$(cat <<'EOF'
## Intent

<intent>

## Summary

<summary bullets>

## How to verify

<verification checklist>
EOF
)"
```

The PR title should follow the same conventional format as commit messages (see `/commit` skill).

---

## Anti-Patterns

| Bad | Why |
|-----|-----|
| PR with no intent section | Reader can't evaluate if it's worth reviewing |
| "Various improvements" as intent | Too vague to be actionable |
| Mixing unrelated changes | Muddies the intent, harder to review and revert |
| Copy-pasting the commit log as summary | Doesn't add value; group by theme instead |
| Skipping "How to verify" | Reviewer has no way to validate the changes |

---

## Examples

### Good Intent
> Add the conventional commits skill so that commit messages across the repo follow a consistent, parseable format. This enables future automation (changelogs, semantic versioning) and makes git history useful.

### Bad Intent
> Updated some files and added a skill.
