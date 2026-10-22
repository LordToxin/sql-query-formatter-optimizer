/**
 * Static SQL Linter & Anti-Pattern Analyzer (UMD)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlLinter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RULES = [
    {
      id: 'LINT001',
      name: 'Wildcard Projection (SELECT *)',
      severity: 'warning',
      pattern: /SELECT\s+(\*\s*|\w+\.\*\s*)FROM/i,
      message: 'Using SELECT * retrieves all columns across the wire, prevents index-only scans, and breaks API contracts on schema migrations.',
      recommendation: 'Explicitly specify only the required column names (e.g. SELECT id, name, created_at).'
    },
    {
      id: 'LINT002',
      name: 'Leading Wildcard in LIKE',
      severity: 'warning',
      pattern: /LIKE\s+['"]%[^'"]+['"]/i,
      message: "Leading wildcard ('%value') invalidates standard B-Tree indexes, triggering costly sequential full table scans.",
      recommendation: 'Use trailing wildcard only (LIKE \'prefix%\'), or migrate to Full-Text Search (tsvector/GIN in PostgreSQL or MATCH/AGAINST in MySQL).'
    },
    {
      id: 'LINT003',
      name: 'Random Ordering (ORDER BY RAND/RANDOM)',
      severity: 'critical',
      pattern: /ORDER\s+BY\s+(RAND\(\)|RANDOM\(\))/i,
      message: 'ORDER BY RAND() / RANDOM() assigns a random number to every row and sorts the entire table in memory, causing O(N log N) database paralysis on large datasets.',
      recommendation: 'Use indexed ID range sampling, TABLESAMPLE, or offset-based reservoir sampling.'
    },
    {
      id: 'LINT004',
      name: 'Missing LIMIT on Unbounded Query',
      severity: 'info',
      check: (sql) => {
        const isSelect = /^\s*SELECT/i.test(sql);
        const hasLimit = /\bLIMIT\s+\d+/i.test(sql);
        const hasAggregation = /\b(COUNT|SUM|AVG|MIN|MAX|GROUP\s+BY)\b/i.test(sql);
        return isSelect && !hasLimit && !hasAggregation;
      },
      message: 'Query has no LIMIT clause and no aggregation. On production tables, this may return millions of rows, spiking server memory.',
      recommendation: 'Append LIMIT <count> or implement cursor-based pagination.'
    },
    {
      id: 'LINT005',
      name: 'Implicit Cartesian Product (Cross Join)',
      severity: 'critical',
      pattern: /FROM\s+[a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)?\s*,\s*[a-zA-Z0-9_]+/i,
      message: 'Comma-separated table list in FROM without explicit JOIN conditions can lead to unintentional Cartesian products.',
      recommendation: 'Use explicit modern ANSI JOIN syntax (e.g. INNER JOIN ... ON a.id = b.a_id).'
    },
    {
      id: 'LINT006',
      name: 'HAVING without GROUP BY',
      severity: 'warning',
      check: (sql) => {
        const hasHaving = /\bHAVING\b/i.test(sql);
        const hasGroupBy = /\bGROUP\s+BY\b/i.test(sql);
        return hasHaving && !hasGroupBy;
      },
      message: 'HAVING clause used without GROUP BY. Filter conditions that do not aggregate should be placed in the WHERE clause.',
      recommendation: 'Move non-aggregate filters to the WHERE clause to prune rows prior to grouping.'
    }
  ];

  /**
   * Lints SQL query and returns list of actionable warnings and recommendations
   */
  function lint(sql) {
    if (!sql || typeof sql !== 'string') return [];
    const cleanSql = sql.trim();
    const findings = [];

    for (const rule of RULES) {
      let triggered = false;
      if (rule.pattern) {
        triggered = rule.pattern.test(cleanSql);
      } else if (typeof rule.check === 'function') {
        triggered = rule.check(cleanSql);
      }

      if (triggered) {
        findings.push({
          id: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.message,
          recommendation: rule.recommendation
        });
      }
    }

    return findings;
  }

  return {
    lint,
    RULES
  };
});
