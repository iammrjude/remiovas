# Contributing to Remiovas

Thanks for your interest in improving Remiovas.

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

## Branch and Commit Rules

- Create a descriptive branch name, for example `feature/payment-notes`.
- Write clear commits that explain intent, not only file changes.
- Keep commit history clean and easy to review.

## Pull Request Checklist

- Explain what changed and why.
- Include screenshots for UI changes.
- Add or update tests when behavior changes.
- Ensure `yarn lint` passes before requesting review.
- Confirm no unrelated files were modified.

## Package Manager Policy

- `yarn.lock` is the single lockfile source of truth.
- Do not commit `package-lock.json`, `pnpm-lock.yaml`, or bun lockfiles.

## Reporting Bugs

When filing an issue, include:

- What you expected.
- What happened instead.
- Steps to reproduce.
- Environment details (OS, Node version, browser if relevant).
