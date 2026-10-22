/**
 * SQL Pre-loaded Examples & Demonstrations
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlPresets = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRESETS = {
    ecommerce: {
      name: 'E-commerce Revenue by Tier (Window Function & CTE)',
      sql: `WITH customer_orders AS (
SELECT c.id AS customer_id, c.email, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS lifetime_spend, MAX(o.created_at) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'completed' AND o.created_at >= NOW() - INTERVAL '1 year'
GROUP BY c.id, c.email
)
SELECT customer_id, email, lifetime_spend, DENSE_RANK() OVER (ORDER BY lifetime_spend DESC) AS spend_rank,
CASE WHEN lifetime_spend >= 1000 THEN 'VIP' WHEN lifetime_spend >= 250 THEN 'Regular' ELSE 'Occasional' END AS tier
FROM customer_orders
ORDER BY lifetime_spend DESC
LIMIT 50;`
    },
    unoptimized: {
      name: 'Unoptimized Query (Triggers Linter Rules)',
      sql: `SELECT * FROM users, orders
WHERE users.email LIKE '%@gmail.com'
ORDER BY RAND();`
    },
    analytics: {
      name: 'Daily Active Users & Rolling 7-Day Average',
      sql: `SELECT date_trunc('day', activity_time) AS active_day,
COUNT(DISTINCT user_id) AS daily_users,
AVG(COUNT(DISTINCT user_id)) OVER (ORDER BY date_trunc('day', activity_time) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7d_avg
FROM user_events
WHERE event_name IN ('pageview', 'click', 'search')
GROUP BY 1
ORDER BY active_day DESC
LIMIT 90;`
    }
  };

  return {
    PRESETS
  };
});
