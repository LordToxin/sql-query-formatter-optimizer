/**
 * Sample SQL Queries for SQLForge Studio
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlSamples = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SAMPLES = {
    analyticsJoin: {
      name: 'E-Commerce Analytics JOIN',
      sql: `SELECT o.id AS order_id, u.email, u.full_name, COUNT(oi.id) AS total_items, SUM(oi.price * oi.quantity) AS gross_revenue, AVG(oi.price) AS average_item_price, DENSE_RANK() OVER (PARTITION BY u.id ORDER BY o.created_at DESC) AS user_order_sequence FROM orders o INNER JOIN users u ON o.user_id = u.id LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.status = 'completed' AND o.created_at >= '2026-01-01' GROUP BY o.id, u.email, u.full_name HAVING SUM(oi.price * oi.quantity) > 100 ORDER BY gross_revenue DESC LIMIT 50 OFFSET 0;`
    },
    messyQuery: {
      name: 'Messy Unformatted Query',
      sql: `select id,customer_name,total_amount,created_at from transactions where status='active' and (payment_method='stripe' or payment_method='crypto') and amount>50 order by created_at desc limit 25;`
    },
    unoptimized: {
      name: 'Unoptimized Query (Full Scan Anti-pattern)',
      sql: `SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@gmail.com') AND total_price > 100 ORDER BY RAND();`
    },
    ddlSchema: {
      name: 'DDL Schema Creation',
      sql: `CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, total_amount NUMERIC(10, 2) NOT NULL, status VARCHAR(20) DEFAULT 'pending');`
    }
  };

  return {
    SAMPLES,
    getDefaultSample: () => SAMPLES.analyticsJoin.sql
  };
});
