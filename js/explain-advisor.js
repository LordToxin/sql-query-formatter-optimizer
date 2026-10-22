/**
 * SQL Query EXPLAIN Analyzer & Performance Advisor
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlAdvisor = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Analyzes SQL query for performance anti-patterns and generates index suggestions
   */
  function analyzeQuery(sql) {
    if (!sql || !sql.trim()) {
      return { score: 100, suggestions: [], planTree: [] };
    }

    const suggestions = [];
    let penalty = 0;
    const clean = sql.replace(/\s+/g, ' ');

    // 1. SELECT * Anti-pattern
    if (/SELECT\s+\*\s+FROM/i.test(clean)) {
      penalty += 15;
      suggestions.push({
        type: 'warning',
        title: 'Avoid "SELECT *"',
        description: 'Retrieving all columns forces extra disk I/O, prevents covering index optimizations, and wastes bandwidth. Specify explicit column names.',
        impact: 'Medium'
      });
    }

    // 2. ORDER BY RAND()
    if (/ORDER\s+BY\s+(RAND\(\)|RANDOM\(\))/i.test(clean)) {
      penalty += 35;
      suggestions.push({
        type: 'critical',
        title: 'Critical: "ORDER BY RAND()" Detected',
        description: 'Generates random values for every row in the table, requiring a full table scan and filesort. Scales terribly on tables with >1,000 rows.',
        impact: 'High'
      });
    }

    // 3. Leading Wildcard in LIKE
    const wildcardMatch = /LIKE\s+['"]%[^'"]+['"]/i.exec(clean);
    if (wildcardMatch) {
      penalty += 20;
      suggestions.push({
        type: 'warning',
        title: 'Unindexable Leading Wildcard LIKE "%..."',
        description: 'B-Tree indexes cannot be used when the search pattern begins with a wildcard "%". Consider PostgreSQL pg_trgm (GIN/GiST) or Full-Text search.',
        impact: 'High'
      });
    }

    // 4. Missing LIMIT on non-aggregated SELECT
    const hasLimit = /LIMIT\s+\d+/i.test(clean);
    const hasAggregate = /(COUNT|SUM|AVG|MIN|MAX|GROUP\s+BY)\b/i.test(clean);
    if (/SELECT\b/i.test(clean) && !hasLimit && !hasAggregate) {
      penalty += 10;
      suggestions.push({
        type: 'info',
        title: 'Unbounded Result Set (Missing LIMIT)',
        description: 'Query has no LIMIT clause. If the table grows to millions of rows, this query may crash the client application or cause out-of-memory errors.',
        impact: 'Medium'
      });
    }

    // 5. WHERE column IN (SELECT ...)
    if (/WHERE\s+[\w.]+\s+IN\s*\(\s*SELECT/i.test(clean)) {
      penalty += 15;
      suggestions.push({
        type: 'warning',
        title: 'Subquery in IN Clause',
        description: 'In many database engines, "IN (SELECT ...)" executes as a dependent subquery per row. Rewrite as an "INNER JOIN" or "EXISTS" clause.',
        impact: 'Medium'
      });
    }

    // Calculate simulated plan tree
    const planTree = buildSimulatedPlan(clean);

    const score = Math.max(10, 100 - penalty);

    return {
      score,
      rating: score >= 85 ? 'Optimized' : score >= 65 ? 'Moderate' : 'Needs Optimization',
      suggestions,
      planTree
    };
  }

  function buildSimulatedPlan(sql) {
    const nodes = [];

    if (/GROUP\s+BY|COUNT|SUM|AVG/i.test(sql)) {
      nodes.push({ op: 'Aggregate', cost: '142.50..148.00', detail: 'Group & aggregate computed fields' });
    }

    if (/JOIN/i.test(sql)) {
      nodes.push({ op: 'Hash Join', cost: '85.20..130.00', detail: 'Inner hash match on join condition' });
    }

    if (/WHERE/i.test(sql)) {
      if (/WHERE\s+id\b/i.test(sql)) {
        nodes.push({ op: 'Index Scan', cost: '0.42..8.44', detail: 'Using primary key index (Fastest)' });
      } else {
        nodes.push({ op: 'Seq Scan (Table)', cost: '0.00..45.00', detail: 'Full table sequential scan (Potential index missing)' });
      }
    } else {
      nodes.push({ op: 'Seq Scan', cost: '0.00..32.00', detail: 'Reading raw table records' });
    }

    return nodes;
  }

  return {
    analyzeQuery
  };
});
