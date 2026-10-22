# ⚡ SQLForge Pro — Offline SQL Formatter, Dialect Translator & EXPLAIN Advisor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Pure Vanilla JS](https://img.shields.io/badge/Stack-HTML5%20%2F%20CSS3%20%2F%20Vanilla%20JS-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Zero External Dependencies](https://img.shields.io/badge/Dependencies-Zero-10B981.svg)](package.json)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

> **The privacy-first developer utility for formatting SQL queries, cross-translating dialects (PostgreSQL, MySQL, SQLite), and analyzing query performance costs with anti-pattern detection.** 100% offline — zero database credentials or queries ever leave your machine.

---

## 🌐 English Description

### 🎯 The Problem
Engineers frequently deal with unformatted, multi-line SQL queries dumped from ORM logs or legacy procedures. Online SQL formatters pose severe security risks (leaking database schemas, table names, and confidential queries). Moreover, migrating queries between PostgreSQL, MySQL, and SQLite involves tedious syntax adjustments (backticks vs quotes, `AUTO_INCREMENT` vs `SERIAL`, `IFNULL` vs `COALESCE`, and comma limits).

### 💡 The Solution
**SQLForge Pro** is an offline, zero-dependency SQL workbench running completely in your browser. It formats messy queries, detects syntax errors, translates between dialects, and audits queries for critical performance anti-patterns (e.g. `SELECT *`, `ORDER BY RAND()`, unindexed `LIKE '%...'`, subqueries in `IN`).

---

### ✨ Features
- 🧹 **Intelligent Multi-Clause SQL Formatter**:
  - Automatically aligns major clauses (`SELECT`, `FROM`, `JOIN`, `WHERE`, `GROUP BY`, `ORDER BY`, `HAVING`, `LIMIT`).
  - Indents conditions (`AND`, `OR`) and subqueries.
  - Keyword casing switcher: UPPERCASE vs lowercase.
  - Configurable indentation (2 spaces or 4 spaces).
  - Compact / Minify tool for embedding SQL in strings.
- 🔍 **Syntax Linter & Diagnostic Engine**:
  - Real-time detection of unclosed quotes (`'`, `"`, `` ` ``).
  - Unbalanced parentheses checking.
  - Flags dangling commas before `FROM` or `WHERE`.
- 🔄 **Cross-Dialect Translator**:
  - **PostgreSQL ⇄ MySQL ⇄ SQLite** conversion.
  - Auto-converts backtick identifiers `` `col` `` to standard quotes `"col"`.
  - Translates MySQL `LIMIT offset, count` to PostgreSQL `LIMIT count OFFSET offset`.
  - Maps `AUTO_INCREMENT` ⇄ `SERIAL` ⇄ `AUTOINCREMENT`.
  - Normalizes `IFNULL(...)` to ANSI `COALESCE(...)`.
- ⚡ **EXPLAIN Query Performance & Index Advisor**:
  - Calculates a 0–100 Performance Optimization Score.
  - Detects full-table-scan hazards: `SELECT *`, leading wildcards `LIKE '%xyz'`, and `ORDER BY RAND()`.
  - Visual simulated execution plan tree (`Aggregate -> Hash Join -> Index Scan / Seq Scan`).
- 📁 **Preloaded Real-World Samples**:
  - *E-Commerce Analytics JOIN* (with window functions and aggregations)
  - *Messy Single-Line Query*
  - *Unoptimized Anti-Pattern Query*
  - *DDL Schema Creation*

---

### 🚀 Quickstart (Run in 2 Clicks)

#### Option 1: Direct Browser Launch
Double-click `index.html` in your file explorer, or run:
```bash
# Windows PowerShell
Start-Process index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

#### Option 2: Local Server
```bash
npx serve .
# Or Python
python -m http.server 3000
```

#### Run Automated Test Suite
```bash
node test/sql.test.js
```

---

## 🇷🇺 Русское описание

### 🎯 Какую проблему решает?
Разработчикам и аналитикам ежедневно приходится разбирать длинные неформатированные SQL-запросы из логов ORM (Hibernate, Prisma, TypeORM, SQLAlchemy). Отправлять корпоративные SQL-запросы в сторонние онлайн-сервисы небезопасно: это раскрывает структуру базы данных и коммерческую тайну. Кроме того, перевод запросов между PostgreSQL, MySQL и SQLite требует ручной замены кавычек, типов полей и пагинации.

### 💡 Решение
**SQLForge Pro** — полностью автономная утилита, работающая строго в браузере без обращения к внешним серверам. Форматирует сложные запросы, находит синтаксические ошибки, автоматически переводит синтаксис между диалектами и анализирует потенциальные узкие места производительности.

---

### ✨ Главные возможности
1. **Интеллектуальное форматирование**:
   - Автоматический перенос ключевых секций (`SELECT`, `FROM`, `JOIN`, `WHERE`, `GROUP BY`).
   - Переключение регистра ключевых слов (ВЕРХНИЙ / нижний).
   - Минификация SQL в одну строку.
2. **Проверка синтаксиса (Linter)**:
   - Обнаружение незакрытых кавычек, скобок и висячих запятых.
3. **Перевод между диалектами**:
   - PostgreSQL ⇄ MySQL ⇄ SQLite в один клик.
   - Корректная конвертация кавычек, `LIMIT/OFFSET`, `AUTO_INCREMENT/SERIAL`, `IFNULL/COALESCE`.
4. **Анализатор производительности и EXPLAIN-советник**:
   - Индекс оптимизации запроса (0–100 баллов).
   - Предупреждения об опасных конструкциях: `SELECT *`, `ORDER BY RAND()`, `LIKE '%...'`.
   - Визуальное дерево этапов выполнения (Execution Plan Tree).
5. **4 готовых примера**:
   - Аналитика с JOIN, неформатированный запрос, неоптимизированный запрос, DDL создание таблиц.

---

## 💰 Monetization & Commercial Potential

| Channel / Model | Description | Revenue Potential |
| :--- | :--- | :--- |
| **Developer Productivity Tool (VS Code Extension)** | Package this offline engine as a lightweight, zero-telemetry VS Code / JetBrains extension. | **Free organic growth / Paid Pro features ($5/mo)** |
| **B2B Database Consulting Magnet** | Showcase technical depth in query optimization to land high-ticket PostgreSQL/MySQL tuning contracts. | **$5k – $25k** database audit contracts |
| **Self-Hosted Team Portal** | White-label version for enterprise dev teams needing an internal, zero-leak SQL sanitizer and query reviewer. | **$199 – $499** one-off license |

---

## 📄 License
MIT License. Free for commercial and personal projects.
