# Product Specification: SQL Formatter & Query Optimizer Studio (`sql-query-formatter-optimizer`)

## 1. Executive Summary & Vision
**SQL Formatter & Query Optimizer Studio** is a privacy-first, zero-dependency offline web utility and developer toolkit for formatting, linting, translating, and optimizing SQL queries. It runs entirely inside the browser without transmitting database credentials or proprietary schemas to external servers.

## 2. Target Market
- **Backend & Full-Stack Developers**: Cleaning up complex queries, ORM-generated raw SQL, and debugging slow transactions.
- **Database Administrators & Data Engineers**: Analyzing query execution plans, identifying anti-patterns, and enforcing consistent team SQL formatting standards.
- **Data Analysts & Business Intelligence Engineers**: Writing readable, maintainable queries with CTEs and window functions.

## 3. Core Architecture & Modules
- `js/formatter.js`: Pure AST/token-based SQL beautifier supporting PostgreSQL, MySQL, and SQLite dialects. Handles capitalization (UPPERCASE/lowercase keywords), indentation depth, comma-first/comma-last placement, and subquery alignment.
- `js/linter.js`: Static query security and performance analyzer detecting:
  - `SELECT *` anti-patterns on production tables
  - Missing `LIMIT` on potentially unbounded queries
  - Leading wildcard `LIKE '%query'` breaking B-Tree index scans
  - Missing `ON` / `USING` in JOIN clauses causing accidental Cartesian products (`CROSS JOIN`)
  - Redundant nested subqueries vs CTEs
- `js/optimizer.js`: Visual `EXPLAIN` query plan parser calculating node cost percentages, bottleneck indicators, and recommending indexes.
- `js/presets.js`: Curated collection of real-world queries (recursive CTE, e-commerce reporting, financial ledgers).
- `server.js`: Zero-dependency static server.
- `test/formatter.test.js`: Native `node:test` verification suite.

## 4. Monetization & Commercial Potential
- **VS Code Extension Pro ($19 lifetime or $4/mo)**: Integrated within developer IDE with inline query execution and live database connection linting.
- **Team Standard Linter CLI ($49/seat/yr)**: Git pre-commit hook and CI/CD pull request gate blocking unformatted SQL or dangerous `SELECT *` migrations.
- **Sponsored Developer Tooling & Database Cloud Placements**: High-intent database developer traffic monetized via cloud hosting sponsors (Supabase, Neon, PlanetScale).
