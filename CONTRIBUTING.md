# Contributing to Remiovas

Thanks for your interest in improving Remiovas.

## Quality Rules

These rules are mandatory for all contributions:

1. Understand the project and feature context before writing code.
2. Follow the 15-minute rule: attempt to solve and debug first.
3. AI use is allowed, but you must fully understand and verify all output.
4. Contributors own correctness end-to-end. "AI generated it" is not a
   valid excuse for broken code.

## Before You Start

- Read the [Code of Conduct](./CODE_OF_CONDUCT.md).
- Use Yarn for dependency management and scripts.
- Keep your branch focused on one clear change.

## Local Setup

1. Fork and clone the repository.
2. Install dependencies.
3. Copy environment variables.
4. Start the development server.

```bash
yarn install
cp .env.example .env.local
yarn dev
```

## Required Local Verification

Before you commit, push, or open a PR, run and pass:

```bash
yarn lint
yarn build
yarn lint:md
```

- If the issue adds a new test command, run that command too.
- If a `test` script exists, run `yarn test` and ensure it passes.
- If your changes affect UI or flows, manually verify the affected routes.
- Do not open a PR with known failing checks.

## File Hygiene

Do not commit generated, ignored, or local-only files, including:

- `node_modules/`, `.next/`, `out/`, `build/`, `dist/`, `coverage/`
- logs, temp files, editor artifacts, and OS artifacts
- local secrets or machine-specific files like `.env.local`
- non-Yarn lockfiles such as `package-lock.json`, `pnpm-lock.yaml`,
  `npm-shrinkwrap.json`, and bun lockfiles

## Branch and Commit Rules

- Create a descriptive branch name, for example `feature/payment-notes`.
- Write clear commits that explain intent, not only file changes.
- Keep commit history clean and easy to review.

## Pull Request Requirements

Every PR must include:

- a summary of what changed and why
- a short project understanding section
- commands run locally and their results
- screenshots for UI changes
- tests added or updated when behavior changes
- confirmation that no unrelated files were modified

## Merge Gates

PRs are merge-ready only when:

- all required GitHub checks are green
- CI/CD workflows and pipelines pass
- all tests required by the issue pass
- at least one maintainer approves

## Reporting Bugs

When filing an issue, include:

- what you expected
- what happened instead
- steps to reproduce
- environment details (OS, Node version, browser if relevant)
