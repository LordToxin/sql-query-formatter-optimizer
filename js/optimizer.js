/**
 * SQL EXPLAIN Plan Inspector & Query Cost Visualizer (UMD)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SqlOptimizer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Analyzes an EXPLAIN plan (JSON structure or text representation)
   */
  function analyzePlan(planInput) {
    let rawObj = null;

    if (typeof planInput === 'string') {
      try {
        rawObj = JSON.parse(planInput);
      } catch (e) {
        return parseTextPlan(planInput);
      }
    } else if (typeof planInput === 'object') {
      rawObj = planInput;
    }

    if (!rawObj) {
      return { totalCost: 0, nodes: [], bottlenecks: [], summary: 'No valid plan data provided.' };
    }

    // Handles Postgres JSON EXPLAIN format
    const rootNode = Array.isArray(rawObj) && rawObj[0]?.Plan ? rawObj[0].Plan : rawObj.Plan || rawObj;
    const nodes = [];
    let maxCost = 0;

    function traverse(node, depth = 0) {
      if (!node) return;
      const nodeType = node['Node Type'] || node.type || 'Unknown';
      const totalCost = Number(node['Total Cost'] || node.cost || 0);
      const planRows = Number(node['Plan Rows'] || node.rows || 0);
      const relation = node['Relation Name'] || node.table || '';

      if (totalCost > maxCost) maxCost = totalCost;

      nodes.push({
        type: nodeType,
        relation,
        cost: totalCost,
        rows: planRows,
        depth,
        isSeqScan: nodeType.toLowerCase().includes('seq scan') || nodeType.toLowerCase() === 'all'
      });

      if (Array.isArray(node.Plans)) {
        node.Plans.forEach(child => traverse(child, depth + 1));
      }
    }

    traverse(rootNode, 0);

    const bottlenecks = nodes.filter(n => n.isSeqScan || (maxCost > 0 && (n.cost / maxCost) > 0.4));

    return {
      totalCost: maxCost,
      nodeCount: nodes.length,
      nodes,
      bottlenecks,
      hasBottleneck: bottlenecks.length > 0
    };
  }

  function parseTextPlan(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const nodes = [];
    let maxCost = 0;

    lines.forEach((line, idx) => {
      const isSeqScan = /seq scan/i.test(line) || /\bALL\b/.test(line);
      const costMatch = line.match(/cost=[\d.]+\.\.([\d.]+)/i);
      const cost = costMatch ? parseFloat(costMatch[1]) : 10;
      if (cost > maxCost) maxCost = cost;

      nodes.push({
        type: line.trim().split(/[\s(]/)[0],
        raw: line.trim(),
        cost,
        depth: (line.search(/\S/) || 0) / 2,
        isSeqScan
      });
    });

    return {
      totalCost: maxCost,
      nodeCount: nodes.length,
      nodes,
      bottlenecks: nodes.filter(n => n.isSeqScan),
      hasBottleneck: nodes.some(n => n.isSeqScan)
    };
  }

  return {
    analyzePlan
  };
});
