/**
 * SQL Dialect Translator (PostgreSQL, MySQL, SQLite)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlTranslator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function translate(sql, fromDialect = 'mysql', toDialect = 'postgres') {
    if (!sql || fromDialect === toDialect) return sql;

    let res = sql;

    // 1. Quoted Identifiers
    if (fromDialect === 'mysql' && (toDialect === 'postgres' || toDialect === 'sqlite')) {
      // replace backticks with standard double quotes
      res = res.replace(/`([^`]+)`/g, '"$1"');
    } else if ((fromDialect === 'postgres' || fromDialect === 'sqlite') && toDialect === 'mysql') {
      res = res.replace(/"([^"]+)"/g, '`$1`');
    }

    // 2. MySQL `LIMIT offset, count` to `LIMIT count OFFSET offset`
    if (fromDialect === 'mysql' && (toDialect === 'postgres' || toDialect === 'sqlite')) {
      res = res.replace(/LIMIT\s+(\d+)\s*,\s*(\d+)/gi, 'LIMIT $2 OFFSET $1');
    } else if ((fromDialect === 'postgres' || fromDialect === 'sqlite') && toDialect === 'mysql') {
      res = res.replace(/LIMIT\s+(\d+)\s+OFFSET\s+(\d+)/gi, 'LIMIT $2, $1');
    }

    // 3. String concatenation
    if (fromDialect === 'mysql' && (toDialect === 'postgres' || toDialect === 'sqlite')) {
      res = res.replace(/CONCAT\(([^)]+)\)/gi, (_, args) => {
        return args.split(',').map(s => s.trim()).join(' || ');
      });
    }

    // 4. NULL replacement: IFNULL -> COALESCE
    if (toDialect === 'postgres') {
      res = res.replace(/IFNULL\s*\(/gi, 'COALESCE(');
    }

    // 5. Autoincrement DDL
    if (toDialect === 'postgres') {
      res = res.replace(/INT(EGER)?\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/gi, 'SERIAL PRIMARY KEY');
      res = res.replace(/AUTO_INCREMENT/gi, '');
      res = res.replace(/DATETIME/gi, 'TIMESTAMP');
    } else if (toDialect === 'sqlite') {
      res = res.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      res = res.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
      res = res.replace(/NOW\(\)/gi, "DATETIME('now')");
    } else if (toDialect === 'mysql') {
      res = res.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INT AUTO_INCREMENT PRIMARY KEY');
      res = res.replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT');
      res = res.replace(/DATETIME\('now'\)/gi, 'NOW()');
    }

    return res;
  }

  return {
    translate
  };
});
