# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Email:** security@ansvar.eu

**Response times:**

- Acknowledgement within 48 hours
- Triage and severity assessment within 5 business days
- Fix timeline communicated after triage

**Please include:**

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Any suggested mitigations

## Scope

This policy covers the `ch-farm-subsidies-mcp` server, its npm package, Docker image, and the Streamable HTTP endpoint at `mcp.ansvar.eu/ch-farm-subsidies/mcp`.

## Security Measures

- **No secrets in repository.** All credentials managed outside the codebase.
- **Read-only database.** The SQLite database is opened in `journal_mode = DELETE` and mounted read-only in production containers.
- **No user data stored.** The server does not collect, store, or process personal data. All data is publicly available Swiss federal information.
- **Dependency scanning.** CodeQL (weekly), Gitleaks (on push), and npm audit in CI.
- **Container hardening.** Non-root user, minimal base image (`node:20-slim`), health checks enabled.
- **Input validation.** All tool parameters validated via Zod schemas before processing.
- **Parameterized queries.** All database queries use parameterized statements to prevent SQL injection.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Disclosure Policy

We follow coordinated disclosure. We ask that you give us reasonable time to address the issue before public disclosure.
