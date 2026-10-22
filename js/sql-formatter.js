/**
 * SQLForge Core SQL Tokenizer, Formatter & Linter Engine
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlFormatter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAJOR_CLAUSES = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY',
    'LIMIT', 'OFFSET', 'UNION', 'UNION ALL', 'INSERT INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'WITH', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN'
  ];

  const SECONDARY_KEYWORDS = [
    'AND', 'OR', 'ON', 'AS', 'IN', 'IS', 'NOT', 'NULL', 'LIKE', 'BETWEEN',
    'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'OVER', 'PARTITION BY',
    'DISTINCT', 'ALL', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'COALESCE', 'NOW', 'CURRENT_TIMESTAMP', 'INTERVAL'
  ];

  const ALL_KEYWORDS_MAP = {};
  [...MAJOR_CLAUSES, ...SECONDARY_KEYWORDS].forEach(kw => {
    ALL_KEYWORDS_MAP[kw.toUpperCase()] = kw.toUpperCase();
  });

  /**
   * Tokenizes SQL string into structured tokens
   */
  function tokenize(sql) {
    const tokens = [];
    let i = 0;
    const len = sql.length;

    while (i < len) {
      const char = sql[i];

      // Whitespace
      if (/\s/.test(char)) {
        let ws = '';
        while (i < len && /\s/.test(sql[i])) {
          ws += sql[i++];
        }
        tokens.push({ type: 'whitespace', value: ws });
        continue;
      }

      // Single line comment --
      if (char === '-' && sql[i + 1] === '-') {
        let comment = '';
        while (i < len && sql[i] !== '\n') {
          comment += sql[i++];
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      }

      // Multiline comment /* ... */
      if (char === '/' && sql[i + 1] === '*') {
        let comment = '/*';
        i += 2;
        while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) {
          comment += sql[i++];
        }
        if (i < len) {
          comment += '*/';
          i += 2;
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      }

      // String literal '...'
      if (char === "'") {
        let str = "'";
        i++;
        while (i < len && sql[i] !== "'") {
          if (sql[i] === '\\') str += sql[i++];
          str += sql[i++];
        }
        if (i < len) str += sql[i++]; // include closing quote
        tokens.push({ type: 'string', value: str });
        continue;
      }

      // Quoted identifier `...` or "..."
      if (char === '`' || char === '"') {
        const quote = char;
        let ident = quote;
        i++;
        while (i < len && sql[i] !== quote) {
          ident += sql[i++];
        }
        if (i < len) ident += sql[i++];
        tokens.push({ type: 'identifier', value: ident });
        continue;
      }

      // Punctuation
      if (/[(),;]/.test(char)) {
        tokens.push({ type: 'punct', value: char });
        i++;
        continue;
      }

      // Operators
      if (/[+\-*\/=<>!&|]/.test(char)) {
        let op = char;
        i++;
        if (i < len && /[=><]/.test(sql[i])) {
          op += sql[i++];
        }
        tokens.push({ type: 'operator', value: op });
        continue;
      }

      // Word / Number
      let word = '';
      while (i < len && !/[\s(),;=<>!&|+\-*\/`'"]/.test(sql[i])) {
        word += sql[i++];
      }

      tokens.push({ type: 'word', value: word });
    }

    return tokens;
  }

  /**
   * Linter: performs syntax validation
   */
  function lint(sql) {
    const diagnostics = [];
    if (!sql || !sql.trim()) return diagnostics;

    // 1. Check quotes
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    let parenDepth = 0;

    for (let i = 0; i < sql.length; i++) {
      const c = sql[i];
      if (c === "'" && !inDoubleQuote && !inBacktick) {
        if (sql[i - 1] !== '\\') inSingleQuote = !inSingleQuote;
      } else if (c === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
      } else if (c === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
      } else if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
        if (c === '(') parenDepth++;
        else if (c === ')') {
          parenDepth--;
          if (parenDepth < 0) {
            diagnostics.push({ line: getLineNumber(sql, i), message: 'Unexpected closing parenthesis ")"' });
            parenDepth = 0;
          }
        }
      }
    }

    if (inSingleQuote) diagnostics.push({ line: 1, message: 'Unclosed single quote (\')' });
    if (inDoubleQuote) diagnostics.push({ line: 1, message: 'Unclosed double quote (")' });
    if (inBacktick) diagnostics.push({ line: 1, message: 'Unclosed backtick identifier (`)' });
    if (parenDepth > 0) diagnostics.push({ line: 1, message: `Missing ${parenDepth} closing parenthesis ")"` });

    // 2. Check dangling commas before FROM or WHERE
    const danglingMatch = /,\s*(FROM|WHERE|GROUP|ORDER|LIMIT|HAVING|\))/gi.exec(sql);
    if (danglingMatch) {
      diagnostics.push({
        line: getLineNumber(sql, danglingMatch.index),
        message: `Dangling comma before "${danglingMatch[1].toUpperCase()}"`
      });
    }

    return diagnostics;
  }

  function getLineNumber(str, index) {
    return (str.substring(0, index).match(/\n/g) || []).length + 1;
  }

  /**
   * Formats SQL with custom indentation, keyword casing, and newline alignment
   */
  function formatSql(sql, options = {}) {
    if (!sql || !sql.trim()) return '';

    const indentSize = options.indentSize || 2;
    const indentChar = ' '.repeat(indentSize);
    const uppercaseKw = options.uppercase !== false;

    const rawTokens = tokenize(sql).filter(t => t.type !== 'whitespace');
    const formattedLines = [];
    let currentLine = '';
    let indentLevel = 0;

    const getIndent = () => indentChar.repeat(indentLevel);

    const pushLine = () => {
      if (currentLine.trim().length > 0) {
        formattedLines.push(getIndent() + currentLine.trim());
        currentLine = '';
      }
    };

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      let val = token.value;
      const upper = val.toUpperCase();

      // Lookahead for 2-word clauses: "GROUP BY", "ORDER BY", "INNER JOIN", etc.
      let combinedClause = upper;
      let nextToken = rawTokens[i + 1];
      if (nextToken) {
        const test2 = `${upper} ${nextToken.value.toUpperCase()}`;
        if (MAJOR_CLAUSES.includes(test2)) {
          combinedClause = test2;
          val = uppercaseKw ? test2 : test2.toLowerCase();
          i++; // skip next token
        }
      }

      const isMajor = MAJOR_CLAUSES.includes(combinedClause);

      if (isMajor) {
        pushLine();
        if (combinedClause === 'FROM' || combinedClause === 'WHERE' || combinedClause === 'GROUP BY' || combinedClause === 'ORDER BY' || combinedClause === 'HAVING' || combinedClause === 'LIMIT') {
          // base level for major query blocks
        }
        currentLine += (uppercaseKw ? combinedClause : combinedClause.toLowerCase()) + ' ';
      } else if (token.type === 'punct') {
        if (val === ',') {
          currentLine += ',';
          pushLine();
        } else if (val === '(') {
          currentLine += ' (';
          indentLevel++;
          pushLine();
        } else if (val === ')') {
          pushLine();
          indentLevel = Math.max(0, indentLevel - 1);
          currentLine += ')';
        } else if (val === ';') {
          currentLine += ';';
          pushLine();
        }
      } else if (token.type === 'word') {
        if (ALL_KEYWORDS_MAP[upper]) {
          const kwText = uppercaseKw ? upper : upper.toLowerCase();
          if (upper === 'AND' || upper === 'OR') {
            pushLine();
            currentLine += '  ' + kwText + ' ';
          } else {
            currentLine += kwText + ' ';
          }
        } else {
          currentLine += val + ' ';
        }
      } else {
        currentLine += val + ' ';
      }
    }

    pushLine();

    return formattedLines.join('\n');
  }

  return {
    tokenize,
    lint,
    formatSql,
    MAJOR_CLAUSES,
    SECONDARY_KEYWORDS
  };
});
