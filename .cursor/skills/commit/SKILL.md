---
name: commit
description: >
  Create well-structured git commits following the Conventional Commits specification.
  Trigger: When creating commits, analyzing git history, or reviewing commit messages.
disable-model-invocation: true
---

## When to Use
- User asks to create a commit or "commit changes"
- User asks to review git status or diff
- User wants to analyze commit history
- After completing features/fixes that need to be committed

---

## Commit Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types (in order of usage frequency)
| Type | Description | Example |
|------|-------------|---------|
| `feat` | New functionality | `feat(agent): add tool selection logic` |
| `fix` | Bug fix | `fix(auth): resolve token refresh race condition` |
| `refactor` | Code refactoring, no functional change | `refactor(core): extract validation logic to service` |
| `test` | Add or modify tests | `test(agent): add unit tests for planner` |
| `docs` | Documentation changes | `docs(readme): add installation instructions` |
| `chore` | Maintenance tasks | `chore(deps): update langchain to v0.3` |
| `style` | Formatting, semicolons, etc. | `style(api): apply prettier formatting` |
| `perf` | Performance improvements | `perf(query): optimize embedding search` |
| `ci` | CI/CD changes | `ci(github): add deployment workflow` |
| `build` | Build system or dependencies | `build(docker): optimize production image` |
| `revert` | Revert previous commit | `revert: feat(agent): add tool selection logic` |

### Subject Rules
1. Use imperative mood: "add" NOT "added" or "adds"
2. Lowercase first letter
3. No period at the end
4. Maximum 120 characters
5. Describe WHAT, not HOW

**Good:**
- `feat(agent): add publication date validation`
- `fix(auth): resolve token refresh issue`

**Bad:**
- `feat(agent): Added validation` (past tense)
- `fix(auth): Resolve issue` (uppercase)
- `feat(agent): add validation.` (period)

### Body Rules (Optional)
1. Separate from subject with blank line
2. Explain WHY, not WHAT
3. Wrap at 72 characters per line
4. Can use bullet points with `-`

### Footer Rules (Optional)
1. Reference issues: `Closes #123`, `Fixes #456`
2. Breaking changes: `BREAKING CHANGE: <description>`

---

## Commit Workflow

### 1. Analyze Changes
```bash
git status
git diff
git diff --staged
git log --oneline -10
```

### 2. Group Related Changes

- One commit = one logical change
- Don't mix features with fixes
- Don't mix multiple unrelated modules
- Multiple files are OK if they implement one feature

### 3. Generate Message
Analyze the changes and determine:
1. **Type**: feat, fix, refactor, etc.
2. **Scope**: Which module/component is affected?
3. **Subject**: What does this change do?
4. **Body** (if needed): Why was this change necessary?
5. **Footer** (if needed): Issue references, breaking changes

### 4. Execute Commit
```bash
git add <files>
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

<body>

<footer>
EOF
)"
```

---

## Code Examples

### Simple Feature
```
feat(agent): add tool selection based on task type

Select appropriate tools dynamically based on the
classification of the user's task.

Closes #12
```

### Bug Fix with Context
```
fix(auth): resolve token refresh race condition

Multiple simultaneous requests could trigger parallel
token refreshes, causing some requests to fail.

- Add mutex lock during refresh
- Queue pending requests until refresh completes
- Add retry logic for failed requests

Fixes #34
```

### Refactor
```
refactor(core): extract embedding logic to dedicated service

Move embedding generation from the route handler to
a dedicated EmbeddingService for reusability.

No functional changes.
```

### Breaking Change
```
feat(api)!: change pagination response format

BREAKING CHANGE: Pagination response now uses cursor-based
format instead of offset-based.

Before: { items: [], total: 100, page: 1 }
After: { items: [], nextCursor: "abc", hasMore: true }
```

### Dependency Update
```
chore(deps): update langchain packages to v0.3

- langchain: 0.2.0 -> 0.3.0
- @langchain/core: 0.2.0 -> 0.3.0

No breaking changes in this update.
```

---

## Anti-Patterns to Avoid
| Bad | Good |
|-----|------|
| `git commit -m "fix"` | `fix(auth): resolve token expiration bug` |
| `git commit -m "WIP"` | Finish the work or use feature branch |
| `git commit -m "changes"` | `refactor(core): extract common validation logic` |
| `git commit -m "update files"` | `feat(agent): add planning step to workflow` |
| `git commit -am "everything"` | Split into logical commits |
| Mix feat + fix + refactor | Separate commits for each type |

---

## Decision Trees

### Should I commit now?
```
Has code changed? ──NO──> No commit needed
      │
     YES
      │
Is it a logical unit? ──NO──> Break into smaller commits
      │
     YES
      │
Do tests pass? ──NO──> Fix tests first
      │
     YES
      │
  Create commit
```

### What type should I use?
```
New functionality? ──YES──> feat
      │
      NO
      │
Fixing a bug? ──YES──> fix
      │
      NO
      │
No functional change? ──YES──> refactor
      │
      NO
      │
Only tests? ──YES──> test
      │
      NO
      │
Dependencies? ──YES──> chore(deps)
      │
      NO
      │
Documentation? ──YES──> docs
      │
      NO
      │
    Default: chore
```

### How to scope?
```
Single module changed? ──YES──> Use module name
      │
      NO
      │
Multiple related modules? ──YES──> Use common parent or higher scope
      │
      NO
      │
Infrastructure? ──YES──> Use: ci, docker, config, deps
      │
      NO
      │
    Omit scope or use project name
```

---

## Resources
- **Specification**: https://www.conventionalcommits.org/
