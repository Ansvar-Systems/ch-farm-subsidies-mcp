# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-05

### Added

- Initial release covering all 7 Swiss direct payment categories (Direktzahlungen)
- 10 tools: `about`, `list_sources`, `check_data_freshness`, `search_schemes`, `get_scheme_details`, `get_payment_rates`, `check_eligibility`, `list_scheme_options`, `get_oeln_requirements`, `search_application_guidance`
- 20 schemes, 80 payment rates, 12 OELN requirements, 8 application guidance entries
- FTS5 full-text search with 6-tier fallback (phrase, AND, prefix, stemmed, OR, LIKE)
- Jurisdiction validation (CH only)
- Dual transport: stdio (npm/npx) and Streamable HTTP (Docker)
- Bilingual disclaimer (DE/EN) via `_meta` on all responses
- Golden standard documentation: README, TOOLS.md, COVERAGE.md, DISCLAIMER.md, SECURITY.md, PRIVACY.md
- CI/CD: CodeQL, Gitleaks, GHCR build, npm publish, ingestion workflow, freshness checks
- Contract tests for all tools
