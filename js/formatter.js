/**
 * High-Performance Deterministic SQL Formatter Engine (UMD)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlFormatter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAJOR_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY',
    'LIMIT', 'OFFSET', 'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'WITH'
  ];

  const JOIN_KEYWORDS = [
    'INNER JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
    'CROSS JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'JOIN', 'NATURAL JOIN'
  ];

  const CLAUSE_KEYWORDS = [
    'AND', 'OR', 'ON', 'USING', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'OVER', 'PARTITION BY', 'WINDOW', 'DESC', 'ASC', 'IN', 'IS', 'NOT',
    'NULL', 'LIKE', 'ILIKE', 'BETWEEN', 'AS'
  ];

  const SQL_FUNCTIONS = [
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF',
    'DATE_TRUNC', 'NOW', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD',
    'CONCAT', 'LOWER', 'UPPER', 'TRIM', 'ROUND', 'FLOOR', 'CEIL', 'CAST'
  ];

  const DEFAULT_OPTIONS = {
    indent: '  ',
    uppercase: true,
    commaPosition: 'after' // 'after' or 'before'
  };

  /**
   * Tokenizes SQL input preserving string literals and comments
   */
  function tokenize(sql) {
    const tokens = [];
    let i = 0;
    const len = sql.length;

    while (i < len) {
      const char = sql[i];

      // Single line comments
      if (char === '-' && sql[i + 1] === '-') {
        let comment = '';
        while (i < len && sql[i] !== '\n') {
          comment += sql[i];
          i++;
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      }

      // Block comments
      if (char === '/' && sql[i + 1] === '*') {
        let comment = '';
        while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) {
          comment += sql[i];
          i++;
        }
        if (i < len) {
          comment += '*/';
          i += 2;
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      }

      // String literals
      if (char === "'" || char === '"' || char === '`') {
        const quote = char;
        let str = quote;
        i++;
        while (i < len && sql[i] !== quote) {
          if (sql[i] === '\\' && i + 1 < len) {
            str += sql[i] + sql[i + 1];
            i += 2;
          } else {
            str += sql[i];
            i++;
          }
        }
        if (i < len) {
          str += quote;
          i++;
        }
        tokens.push({ type: 'string', value: str });
        continue;
      }

      // Whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Punctuation
      if (char === '(' || char === ')' || char === ',' || char === ';') {
        tokens.push({ type: 'punct', value: char });
        i++;
        continue;
      }

      // Operators
      if (/[=<>!+\-*/%]/.test(char)) {
        let op = char;
        i++;
        while (i < len && /[=<>!+\-*/%]/.test(sql[i])) {
          op += sql[i];
          i++;
        }
        tokens.push({ type: 'operator', value: op });
        continue;
      }

      // Words (identifiers or keywords)
      let word = '';
      while (i < len && /[a-zA-Z0-9_.]/.test(sql[i])) {
        word += sql[i];
        i++;
      }
      tokens.push({ type: 'word', value: word });
    }

    return tokens;
  }

  /**
   * Formats raw SQL string according to options
   */
  function format(sql, userOptions = {}) {
    if (!sql || typeof sql !== 'string') return '';
    const options = Object.assign({}, DEFAULT_OPTIONS, userOptions);
    const tokens = tokenize(sql.trim());

    let formatted = '';
    let indentLevel = 0;
    let newlineNeeded = false;

    function getIndent() {
      return options.indent.repeat(Math.max(0, indentLevel));
    }

    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];
      const nextToken = tokens[idx + 1];
      let val = token.value;

      if (token.type === 'comment') {
        if (formatted.length > 0 && !formatted.endsWith('\n')) {
          formatted += '\n';
        }
        formatted += getIndent() + val + '\n';
        newlineNeeded = true;
        continue;
      }

      if (token.type === 'word') {
        const upper = val.toUpperCase();

        // Check for multi-word keywords (e.g. GROUP BY, ORDER BY, LEFT JOIN)
        let matchedMulti = null;
        if (nextToken && nextToken.type === 'word') {
          const twoWord = (upper + ' ' + nextToken.value.toUpperCase()).trim();
          if (MAJOR_KEYWORDS.includes(twoWord) || JOIN_KEYWORDS.includes(twoWord)) {
            matchedMulti = twoWord;
          }
        }

        if (matchedMulti) {
          idx++; // consume second word
          const kw = options.uppercase ? matchedMulti : matchedMulti.toLowerCase();
          if (formatted.length > 0) formatted += '\n';
          formatted += getIndent() + kw + ' ';
          continue;
        }

        if (MAJOR_KEYWORDS.includes(upper)) {
          const kw = options.uppercase ? upper : upper.toLowerCase();
          if (formatted.length > 0) formatted += '\n';
          formatted += getIndent() + kw + ' ';
          continue;
        }

        if (JOIN_KEYWORDS.includes(upper)) {
          const kw = options.uppercase ? upper : upper.toLowerCase();
          if (formatted.length > 0) formatted += '\n';
          formatted += getIndent() + kw + ' ';
          continue;
        }

        if (upper === 'AND' || upper === 'OR') {
          const kw = options.uppercase ? upper : upper.toLowerCase();
          if (formatted.length > 0) formatted += '\n';
          formatted += getIndent() + options.indent + kw + ' ';
          continue;
        }

        if (SQL_FUNCTIONS.includes(upper)) {
          val = options.uppercase ? upper : upper.toLowerCase();
        } else if (CLAUSE_KEYWORDS.includes(upper)) {
          val = options.uppercase ? upper : upper.toLowerCase();
        }

        formatted += val;
        if (nextToken && nextToken.type !== 'punct' && nextToken.value !== ';') {
          formatted += ' ';
        }
        continue;
      }

      if (token.type === 'punct') {
        if (val === '(') {
          formatted += '(';
          indentLevel++;
          continue;
        }

        if (val === ')') {
          indentLevel = Math.max(0, indentLevel - 1);
          formatted += ')';
          if (nextToken && nextToken.type === 'word') {
            formatted += ' ';
          }
          continue;
        }

        if (val === ',') {
          if (options.commaPosition === 'after') {
            formatted += ',\n' + getIndent() + options.indent;
          } else {
            formatted += '\n' + getIndent() + options.indent + ', ';
          }
          continue;
        }

        if (val === ';') {
          formatted += ';\n';
          continue;
        }
      }

      if (token.type === 'operator') {
        if (!formatted.endsWith(' ')) formatted += ' ';
        formatted += val + ' ';
        continue;
      }

      formatted += val;
      if (nextToken && nextToken.type !== 'punct') {
        formatted += ' ';
      }
    }

    return formatted.replace(/\n\s*\n+/g, '\n').trim();
  }

  return {
    tokenize,
    format
  };
});
