/**
 * Unit Test Suite for SQLForge Formatter, Translator & Advisor
 */
const assert = require('assert');
const formatter = require('../js/sql-formatter.js');
const translator = require('../js/dialect-translator.js');
const advisor = require('../js/explain-advisor.js');
const samples = require('../js/samples.js');

let passCount = 0;
let failCount = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

console.log('--- RUNNING SQLFORGE TEST SUITE ---');

it('formats basic SELECT query with clauses on separate lines', () => {
  const raw = 'select id, name, email from users where active = 1 order by id desc limit 10;';
  const formatted = formatter.formatSql(raw, { indentSize: 2, uppercase: true });

  assert(formatted.includes('SELECT'), 'Must uppercase SELECT');
  assert(formatted.includes('FROM'), 'Must uppercase FROM');
  assert(formatted.includes('WHERE'), 'Must uppercase WHERE');
  assert(formatted.includes('ORDER BY'), 'Must uppercase ORDER BY');
  assert(formatted.includes('LIMIT'), 'Must uppercase LIMIT');
  assert(formatted.split('\n').length >= 4, 'Must split across multiple lines');
});

it('detects syntax errors and dangling commas in linter', () => {
  const badSql = "SELECT id, name, FROM users WHERE id = 'unclosed";
  const diagnostics = formatter.lint(badSql);

  assert(diagnostics.some(d => d.message.includes('Unclosed single quote')), 'Must flag unclosed quote');
  assert(diagnostics.some(d => d.message.includes('Dangling comma')), 'Must flag dangling comma before FROM');
});

it('translates MySQL syntax to PostgreSQL standards', () => {
  const mysqlSql = "SELECT `id`, `name`, IFNULL(`bio`, '') FROM `users` LIMIT 10, 20;";
  const pgSql = translator.translate(mysqlSql, 'mysql', 'postgres');

  assert(pgSql.includes('"id"'), 'Must convert backticks to double quotes');
  assert(pgSql.includes('COALESCE('), 'Must convert IFNULL to COALESCE');
  assert(pgSql.includes('LIMIT 20 OFFSET 10'), 'Must convert comma limit to OFFSET');
});

it('translates PostgreSQL DDL to SQLite compatible syntax', () => {
  const pgSql = 'CREATE TABLE items (id SERIAL PRIMARY KEY, title TEXT);';
  const sqliteSql = translator.translate(pgSql, 'postgres', 'sqlite');

  assert(sqliteSql.includes('INTEGER PRIMARY KEY AUTOINCREMENT'), 'Must convert SERIAL to AUTOINCREMENT');
});

it('flags performance anti-patterns and calculates score', () => {
  const badQuery = "SELECT * FROM logs WHERE message LIKE '%error%' ORDER BY RAND();";
  const analysis = advisor.analyzeQuery(badQuery);

  assert(analysis.score < 60, 'Score must be penalized for multiple anti-patterns');
  assert(analysis.suggestions.some(s => s.title.includes('SELECT *')), 'Must flag SELECT *');
  assert(analysis.suggestions.some(s => s.title.includes('ORDER BY RAND()')), 'Must flag ORDER BY RAND()');
  assert(analysis.suggestions.some(s => s.title.includes('Leading Wildcard')), 'Must flag LIKE %');
});

it('verifies all preloaded samples format and analyze cleanly', () => {
  for (const [key, sample] of Object.entries(samples.SAMPLES)) {
    const formatted = formatter.formatSql(sample.sql);
    assert(formatted.length > 20, `Sample ${key} must format`);

    const analysis = advisor.analyzeQuery(sample.sql);
    assert(Number.isFinite(analysis.score), `Sample ${key} score must be finite`);
    assert(Array.isArray(analysis.planTree), `Sample ${key} must produce plan tree`);
  }
});

console.log(`\nTest results: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All SQLForge tests passed successfully! ✨');
}
