# Project Development & Documentation Skill

## Purpose

This skill defines the mandatory rules, workflow, documentation standards, and project-management practices that must be followed whenever working on this project.

The primary goals are:

1. Keep the project continuously documented.
2. Always make the current project status clear.
3. Keep `README.md` synchronized with the actual implementation.
4. Track completed, ongoing, and pending work.
5. Record important changes and decisions.
6. Prevent undocumented changes.
7. Maintain a clean, organized, production-quality project.

---

# 1. Mandatory Documentation Files

The project MUST maintain the following files at the project root:

```text
README.md
PROJECT_STATUS.md
CHANGELOG.md
DECISIONS.md
TODO.md
HANDOFF.md
```

These files must be kept up to date throughout development.

**Note on `HANDOFF.md`:** this project is being developed by two people taking turns on a shared account limit (an "account relay"). `HANDOFF.md` is a special addition — see Section 1.2 — required specifically for this handoff scenario. It is not part of the standard 5-file skill and should be treated as the highest-priority document to keep current, since a stale handoff document costs the incoming developer real time.

## 1.1 README.md

`README.md` is the primary user-facing documentation for the project.

It MUST contain, where applicable:

- Project name
- Project overview
- Problem statement
- Project objectives
- Key features
- Technology stack
- System architecture
- Project structure
- Installation/setup instructions
- Configuration instructions
- How to run the project
- How to use the project
- API documentation, if applicable
- Database information, if applicable
- Environment variables
- Dependencies
- Screenshots/examples, if applicable
- Known limitations (for this project, explicitly include any RDKit installation friction encountered and the verified working install method — see Section 26.1)
- Future improvements
- Current project status
- Credits/references, if applicable

### README Update Rule

**Whenever ANY project change is made, `README.md` MUST be reviewed and updated if the change affects documentation.**

Examples of changes that require a README update:

- Adding a feature
- Removing a feature
- Changing functionality
- Changing the architecture
- Adding/removing dependencies
- Changing installation steps
- Changing environment variables
- Changing commands
- Changing APIs
- Changing database structure
- Changing project structure
- Changing configuration
- Changing UI behavior
- Changing deployment instructions

Do NOT assume that a README update is unnecessary without checking.

The README must always describe the project as it currently exists, not how it existed previously.

## 1.2 HANDOFF.md (account-relay document)

This project is being built in shifts by two developers sharing an account limit. When one developer's session/limit ends, the other must be able to sit down cold, read **one file**, and start being productive within minutes — without re-reading the entire `PROJECT_STATUS.md` history or reverse-engineering the setup.

`HANDOFF.md` MUST be the single highest-priority document. It is short by design — a person under time pressure, not an agent, reads it first.

Use the following structure:

```markdown
# Handoff

## Last handed off
YYYY-MM-DD HH:MM — by [name]

## Right now, the project is:
[One or two sentences: what works, what's mid-change, what's broken]

## To get running immediately

1. Backend: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000`
2. Frontend: `cd frontend && npm run dev`
3. Open: http://localhost:3000
4. [Any other exact command needed — do not assume the reader remembers]

## What I was doing when I stopped
[Exact file(s), exact function/component, exact next line of logic]

## Do this next
1. [Single most important next action]
2. [Second]
3. [Third]

## Do NOT touch / known fragile areas
- [Anything mid-refactor, anything with an unresolved bug, anything with a workaround that looks wrong but is intentional]

## Blockers right now
- [Anything that stopped you — missing package, unclear requirement, failing test]

## Credentials / accounts needed
- [Any account, API key placeholder, or service the next person needs access to — never the secret value itself, just what's needed and where to get it]
```

### HANDOFF.md rules

1. Update this file at the **end of every working session**, not just when a limit is reached — sessions can end unexpectedly.
2. Keep it under one screen of reading if at all possible. Detail belongs in `PROJECT_STATUS.md`; `HANDOFF.md` is the fast-start summary that points there.
3. The "To get running immediately" commands must be copy-pasteable and verified working at the moment of writing — do not write commands from memory without checking them against the actual project.
4. If something is broken or half-finished, say so plainly. Do not leave the incoming developer to discover a broken state by trial and error.

---

# 2. PROJECT_STATUS.md

`PROJECT_STATUS.md` is the project's continuously updated development status document.

It MUST be updated after meaningful development work.

Use the following structure:

```markdown
# Project Status

## Last Updated

YYYY-MM-DD HH:MM

## Current Phase

[Current development phase]

## Overall Progress

[0-100% estimate]

## Current Objective

[What is currently being worked on]

## Recently Completed

- Item 1
- Item 2
- Item 3

## Currently In Progress

- Item 1
- Item 2

## Pending

- Item 1
- Item 2
- Item 3

## Blocked

- Item 1
- Reason for blockage

## Next Steps

1. Step 1
2. Step 2
3. Step 3

## Known Issues

- Issue 1
- Issue 2

## Recommendations

### High Priority

- Recommendation
- Reason

### Medium Priority

- Recommendation
- Reason

### Low Priority

- Recommendation
- Reason

## Important Decisions

- Decision 1
- Decision 2

## Notes

Additional project notes.
```

### Status Rules

After every meaningful task:

1. Update `Last Updated`.
2. Update `Current Phase` if necessary.
3. Update `Overall Progress`.
4. Move completed tasks into `Recently Completed`.
5. Update `Currently In Progress`.
6. Update `Pending`.
7. Record blockers.
8. Record important decisions.
9. Update `Next Steps`.
10. Add useful recommendations when appropriate.

Never leave the status file describing an outdated project state.

---

# 3. CHANGELOG.md

`CHANGELOG.md` records significant changes made to the project.

Use:

```markdown
# Changelog

## [Unreleased]

### Added

- 

### Changed

- 

### Fixed

- 

### Removed

- 

### Documentation

- 

### Notes

- 
```

When a meaningful change is made, add an appropriate entry.

Changes should be written in a concise and understandable manner.

---

# 4. DECISIONS.md

`DECISIONS.md` records important architectural, technical, and design decisions.

Use:

```markdown
# Project Decisions

## Decision Template

### [Date] — [Decision Title]

**Decision:**
[What was decided]

**Reason:**
[Why this decision was made]

**Alternatives Considered:**
- Alternative 1
- Alternative 2

**Consequences:**
- Positive consequence
- Negative consequence

---
```

Important decisions should be recorded whenever they affect:

- Architecture
- Technology choices
- Database design
- API design
- Security
- Deployment
- Major UI/UX decisions
- Project structure
- Performance strategy
- Development methodology

Do not record trivial implementation details.

---

# 5. TODO.md

`TODO.md` is the project's task backlog.

Use:

```markdown
# TODO

## High Priority

- [ ] Task

## Medium Priority

- [ ] Task

## Low Priority

- [ ] Task

## Future Ideas

- [ ] Idea
```

Update `TODO.md` whenever pending work is added, completed, removed, or reprioritized.

Do not duplicate completed work unnecessarily between `TODO.md` and `PROJECT_STATUS.md`.

---

# 6. Mandatory Workflow Before Starting Work

Before modifying the project:

## Step 1 — Inspect the project

Understand:

- Existing files
- Project structure
- Current implementation
- Existing documentation
- Current `PROJECT_STATUS.md`
- Current `README.md`
- Current `CHANGELOG.md`
- Current `DECISIONS.md`
- Current `TODO.md`
- Existing configuration
- Dependencies
- Relevant source code

Do NOT blindly modify files without understanding the existing implementation.

## Step 2 — Read project status

Always read:

```text
PROJECT_STATUS.md
TODO.md
```

before starting significant work.

Determine:

- What has already been completed
- What is currently being worked on
- What remains
- Known issues
- Blockers
- Next planned steps
- Existing recommendations

## Step 3 — Inspect relevant implementation

Before changing code, inspect the files directly related to the requested task.

Do not rely only on documentation when the actual implementation can be inspected.

## Step 4 — Determine the task

Clearly identify:

- User's requested change
- Files likely affected
- Dependencies affected
- Documentation affected
- Potential side effects
- Testing requirements

## Step 5 — Plan

For non-trivial tasks, create a short implementation plan before making changes.

---

# 7. Development Rules

## Do not unnecessarily rewrite working code

Prefer:

- Small changes
- Incremental improvements
- Reusing existing components
- Maintaining compatibility
- Minimal targeted modifications

Avoid unnecessary rewrites.

## Preserve existing functionality

Whenever implementing a new feature:

1. Understand existing behavior.
2. Add the new functionality.
3. Ensure existing functionality remains intact.
4. Test affected functionality.

## Follow existing project conventions

Before introducing a new pattern, check whether the project already has an established pattern for:

- Naming
- File organization
- Components
- APIs
- Error handling
- Logging
- Testing
- Configuration
- Styling

Follow the existing conventions unless there is a strong reason to change them.

---

# 8. Testing Requirements

After making changes:

1. Run relevant tests.
2. Run linting if available.
3. Run type checking if available.
4. Build the project if applicable.
5. Verify that the changed functionality works.
6. Check for regressions in related functionality.

If tests cannot be run, explicitly record that in `PROJECT_STATUS.md`.

Never claim that something was tested if it was not actually tested.

Document test results when they are important.

---

# 9. Documentation Synchronization Rule

Documentation and implementation MUST remain synchronized.

After every meaningful change, perform this checklist:

```text
[ ] Code updated
[ ] Tests updated/verified
[ ] README reviewed
[ ] README updated if necessary
[ ] PROJECT_STATUS.md updated
[ ] CHANGELOG.md updated
[ ] TODO.md updated if task status changed
[ ] DECISIONS.md updated if a significant decision was made
[ ] Configuration/dependency documentation checked
[ ] No unrelated files were accidentally changed
```

A task is NOT considered complete until documentation has been reviewed.

---

# 10. README Accuracy Rule

Never write documentation based on assumptions.

Documentation must reflect the actual implementation.

For example, do not document:

```text
Feature X is supported
```

unless Feature X actually exists.

Do not document commands that have not been verified.

Do not document configuration variables that do not exist.

Do not leave obsolete instructions in the README.

If implementation and documentation disagree, fix the documentation before considering the task complete.

---

# 11. Progress Tracking

Progress should be based on actual project completion, not simply the number of files created.

Use meaningful milestones.

Example:

```text
Phase 1 — Planning                 100%
Phase 2 — Architecture              100%
Phase 3 — Core Implementation        70%
Phase 4 — Testing                    30%
Phase 5 — Documentation              80%
Phase 6 — Deployment                  0%
```

If useful, maintain a milestone table in `PROJECT_STATUS.md`:

```markdown
| Phase | Status | Progress |
|---|---|---:|
| Planning | Complete | 100% |
| Architecture | Complete | 100% |
| Backend | In Progress | 70% |
| Frontend | In Progress | 50% |
| Testing | Pending | 0% |
| Deployment | Pending | 0% |
```

Do not artificially inflate progress.

---

# 12. Task Completion Rule

When completing a task, perform the following sequence:

```text
1. Implement change
2. Test change
3. Inspect resulting project
4. Update README.md
5. Update PROJECT_STATUS.md
6. Update CHANGELOG.md
7. Update TODO.md if applicable
8. Update DECISIONS.md if applicable
9. Check for unintended changes
10. Report what was completed
11. Report what remains
```

---

# 13. Handling Bugs

When a bug is discovered:

1. Reproduce it if possible.
2. Identify the root cause.
3. Implement the smallest appropriate fix.
4. Test the fix.
5. Check for regressions.
6. Document the fix in `CHANGELOG.md`.
7. Update `PROJECT_STATUS.md`.
8. Update `README.md` if user-facing behavior changed.
9. Update `TODO.md` if additional work remains.

Do not simply hide symptoms when the root cause can be addressed.

---

# 14. Dependencies

Whenever adding, removing, or upgrading a dependency:

1. Record the change.
2. Verify compatibility.
3. Update dependency files.
4. Update `README.md` if setup instructions are affected.
5. Update `CHANGELOG.md`.
6. Test the project.
7. Record significant technical decisions in `DECISIONS.md`.

Avoid adding dependencies when the existing project can reasonably accomplish the task without them.

---

# 14.1 Trained Model Artifacts and Large Files (project-specific)

This project produces a trained ML model file (e.g. `models/xgb_bbbp_model.pkl`) that is expensive to regenerate — retraining requires re-running the full data pipeline, which the incoming developer may not have time for mid-handoff.

Rules specific to this project:

1. **The trained model artifact MUST be included in the handoff, not gitignored.** A generic project would treat `.pkl` files as disposable build output. Here, treat the current working model as part of the deliverable — losing it costs real time the team may not have.
2. If the model is retrained or changed, note the change explicitly in `HANDOFF.md` and `CHANGELOG.md`, including which script produced it and when, so the incoming developer knows whether to trust the file in the repo or retrain.
3. The cleaned dataset (`bbbp_cleaned.csv`) should also be included rather than regenerated each handoff, since it's small (~2,000 rows) and removes a point of failure.
4. Raw, unmodified downloads (e.g. the original `BBBP.csv` before cleaning) do not need to be tracked — they're reproducible from the documented download command in the README.

---

# 15. Environment Variables and Secrets

Never commit:

- API keys
- Passwords
- Tokens
- Private credentials
- Authentication secrets
- Private certificates

Use environment variables or appropriate secret-management mechanisms.

If an environment variable is required, document its name and purpose in the README, but never expose its secret value.

Use `.env.example` where appropriate.

Example:

```text
API_KEY=your_api_key_here
```

---

# 16. Architecture Changes

Before making major architectural changes:

1. Understand the current architecture.
2. Explain the reason for the change.
3. Identify affected components.
4. Consider alternatives.
5. Implement incrementally.
6. Update architecture documentation.
7. Update README.
8. Record the decision in `DECISIONS.md`.
9. Update `PROJECT_STATUS.md`.
10. Record the change in `CHANGELOG.md`.

Important architectural decisions should be preserved so future development can understand why the current design exists.

---

# 17. Suggestions and Recommendations

The agent SHOULD proactively identify useful improvements.

Suggestions may include:

- Performance improvements
- Security improvements
- Better error handling
- Better UX
- Code quality improvements
- Testing improvements
- Documentation improvements
- Dependency improvements
- Architecture improvements
- Deployment improvements
- Accessibility improvements
- Maintainability improvements
- Reliability improvements
- Scalability improvements

However:

**Do not implement optional improvements without user approval if they could significantly change scope, architecture, behavior, cost, or security posture.**

Instead, add them to:

```text
PROJECT_STATUS.md
TODO.md
```

as appropriate.

Recommendations should explain:

1. What should be improved.
2. Why it matters.
3. Priority.
4. Possible implementation approach, if useful.

---

# 18. Scope Control

Do not silently expand the project scope.

If a requested feature reveals additional work:

1. Complete the requested work if possible.
2. Identify additional work.
3. Add it to `Pending` or `TODO.md`.
4. Explain why it may be useful.
5. Do not implement unrelated work automatically.

Do not turn a small request into a large refactoring project without justification.

---

# 19. Error Reporting

If something fails:

Do not pretend it succeeded.

Clearly state:

```text
What was attempted
What happened
Why it failed
What was investigated
What remains to be done
```

Record important unresolved issues in `PROJECT_STATUS.md`.

If the failure blocks further development, add it to the `Blocked` section.

---

# 20. Session Continuity

The project must be understandable even if a completely new agent opens it.

A new agent should be able to read:

```text
README.md
PROJECT_STATUS.md
CHANGELOG.md
DECISIONS.md
TODO.md
```

and immediately understand:

- What the project does
- How to run it
- What has been completed
- What is currently being developed
- What remains
- What problems exist
- What should be done next
- Why important architectural decisions were made

Do not rely solely on conversation history.

**The repository itself must contain the project's memory.**

---

# 21. Protect Existing User Work

Before modifying files:

- Inspect the current state.
- Do not overwrite unrelated work.
- Do not delete files unless required.
- Do not reset or revert user changes without explicit permission.
- Avoid destructive commands.
- Preserve existing functionality.
- Keep modifications focused on the requested task.

If unexpected existing modifications are found, understand them before making changes that could conflict with them.

---

# 22. Code Quality

Code should be:

- Readable
- Maintainable
- Modular
- Consistent with the existing project
- Appropriately documented
- Free of unnecessary duplication
- Reasonably efficient
- Secure where applicable

Avoid premature optimization.

Avoid unnecessary abstraction.

Prefer simple solutions when they satisfy the requirements.

---

# 23. Security

Security must be considered whenever relevant.

Pay particular attention to:

- Authentication
- Authorization
- Input validation
- File uploads
- Database queries
- API endpoints
- Secrets
- User-generated content
- Dependency vulnerabilities
- Sensitive data
- Error messages
- Logging

Never expose sensitive information through:

- Source code
- Logs
- README files
- Error responses
- Public configuration

When a security issue is discovered, prioritize fixing it and document the issue appropriately.

---

# 24. Performance

Consider performance when implementing features.

Avoid:

- Unnecessary database queries
- Repeated expensive operations
- Unbounded loops
- Excessive API calls
- Loading unnecessary data
- Large unnecessary dependencies

Do not optimize blindly.

Measure or reason about performance where optimization is actually relevant.

---

# 25. Final Verification

Before declaring a task complete, verify:

```text
[ ] Requested functionality implemented
[ ] Existing functionality preserved
[ ] Relevant tests passed
[ ] Build succeeds, if applicable
[ ] Lint/type checks pass, if applicable
[ ] README.md is accurate
[ ] PROJECT_STATUS.md is current
[ ] CHANGELOG.md contains the change
[ ] TODO.md reflects remaining work
[ ] DECISIONS.md reflects significant decisions
[ ] No secrets were introduced
[ ] No unrelated changes were made
[ ] Known issues are documented
```

If any applicable item is incomplete, do not falsely report the task as fully complete.

---

# 26. Final Response After Development Work

After completing work, provide a concise summary containing:

```text
## Completed

- Change 1
- Change 2

## Files Changed

- file1
- file2
- README.md
- PROJECT_STATUS.md
- CHANGELOG.md

## Testing

- Test performed
- Result

## Pending

- Remaining item

## Recommendations

- Optional improvement
```

Never claim completion if important requested work remains unfinished.

---

# 26.1 Two-Service Setup Clarity (project-specific)

This project runs as two separate local processes: a FastAPI backend and a Next.js frontend. Ambiguity in "how to run the project" is a common source of wasted handoff time.

1. `README.md` and `HANDOFF.md` must always list the exact commands to start **both** services, in the correct order, with the correct ports.
2. If the API contract between frontend and backend changes (new endpoint, changed request/response shape), this counts as an architecture-adjacent change under Section 16 and must be reflected in `README.md`'s API documentation section and noted in `CHANGELOG.md`.
3. Known environment friction should be documented explicitly in the README's "Known limitations" section — in particular, RDKit's native dependencies can fail to install cleanly on some platforms (especially Windows without conda). If this is encountered, document the working install method that was actually verified, not just the standard `pip install rdkit` instruction, so the incoming developer doesn't lose time to it.

---

# 26.2 Hackathon Time-Pressure Exception

This skill's full documentation workflow (Section 12, Section 9 checklist) is written for production software and is intentionally thorough. Under hackathon time pressure, applying it in full after every small change can cost more time than it saves and may cause documentation to be skipped altogether — the opposite of the intended outcome.

The following lightweight mode applies whenever the deadline is close (rule of thumb: less than a few hours of working time left):

1. **Always keep current, no exceptions:** `HANDOFF.md`. This is the one document that directly determines whether the handoff succeeds.
2. **Update at natural breakpoints, not after every change:** `PROJECT_STATUS.md`, `TODO.md` — update when finishing a feature or before a handoff, not after every function written.
3. **Can be deferred until after the deadline:** `CHANGELOG.md` entry-by-entry detail, `DECISIONS.md` for minor choices. Still record genuinely important decisions (e.g. "switched from Streamlit to Next.js/FastAPI") since those affect how the other person understands the codebase — but don't log every small implementation choice.
4. **Never skip:** keeping `README.md`'s setup/run instructions accurate. A wrong command in the README is worse than no README, because it costs the incoming developer time to discover it's wrong.

This exception does not relax Section 21 (Protect Existing User Work) or Section 19 (Error Reporting) — honesty about what's broken and careful handling of the other person's work matter *more*, not less, under time pressure, since there's less slack to recover from an avoidable mistake.

---

# 27. Golden Rule

The most important rule of this skill is:

> **Never leave the project in a state where the implementation has changed but the project documentation does not accurately describe the new state.**

Every meaningful change must leave the project:

```text
Implemented
Tested
Documented
Tracked
Understandable
```

The repository should always tell the truth about its current state.

---

# 28. Quick Operating Checklist

For every development session:

```text
START
  ↓
Read README.md
  ↓
Read PROJECT_STATUS.md
  ↓
Read TODO.md
  ↓
Inspect relevant code
  ↓
Understand the requested task
  ↓
Plan the change
  ↓
Implement
  ↓
Test
  ↓
Review implementation
  ↓
Update README.md
  ↓
Update PROJECT_STATUS.md
  ↓
Update CHANGELOG.md
  ↓
Update TODO.md
  ↓
Update DECISIONS.md if needed
  ↓
Check for unintended changes
  ↓
Report completed + pending + recommendations
  ↓
END
```

**This workflow is mandatory for all meaningful project changes.**
