/**
 * SQLForge Studio - Interactive Application Controller
 */
(function () {
  'use strict';

  const Formatter = window.SqlFormatter;
  const Translator = window.SqlTranslator;
  const Advisor = window.SqlAdvisor;
  const Samples = window.SqlSamples;

  let currentDialect = 'postgres';
  let indentSize = 2;
  let uppercase = true;

  // DOM Elements
  const el = {
    sqlInput: document.getElementById('sql-input'),
    sqlOutput: document.getElementById('sql-output'),
    errorBanner: document.getElementById('error-banner'),

    // Format Controls
    dialectSelect: document.getElementById('select-dialect'),
    indentSelect: document.getElementById('select-indent'),
    casingSelect: document.getElementById('select-casing'),

    // Toolbar Buttons
    formatBtn: document.getElementById('btn-format'),
    minifyBtn: document.getElementById('btn-minify'),
    clearBtn: document.getElementById('btn-clear'),
    copyBtn: document.getElementById('btn-copy'),
    downloadBtn: document.getElementById('btn-download'),

    // Advisor Elements
    scoreValue: document.getElementById('score-value'),
    scoreBadge: document.getElementById('score-badge'),
    suggestionsContainer: document.getElementById('suggestions-container'),
    planTreeContainer: document.getElementById('plan-tree-container'),

    // Preset Samples
    sampleChips: document.querySelectorAll('[data-sample]'),
    toast: document.getElementById('toast')
  };

  function showToast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.remove('hidden');
    el.toast.classList.add('visible');
    setTimeout(() => {
      el.toast.classList.remove('visible');
      setTimeout(() => el.toast.classList.add('hidden'), 300);
    }, 2200);
  }

  function handleProcess() {
    const raw = el.sqlInput.value;
    if (!raw.trim()) {
      el.sqlOutput.textContent = '-- Formatted SQL output will appear here...';
      if (el.errorBanner) el.errorBanner.classList.add('hidden');
      updateAdvisor({ score: 100, suggestions: [], planTree: [] });
      return;
    }

    // 1. Run Linter
    const diagnostics = Formatter.lint(raw);
    if (diagnostics.length > 0) {
      el.errorBanner.classList.remove('hidden');
      el.errorBanner.innerHTML = diagnostics.map(d => `Line ${d.line}: ${escapeHtml(d.message)}`).join('<br>');
    } else {
      el.errorBanner.classList.add('hidden');
    }

    // 2. Format
    const formatted = Formatter.formatSql(raw, {
      indentSize: indentSize,
      uppercase: uppercase
    });

    el.sqlOutput.textContent = formatted;

    // 3. Run Performance Advisor
    const analysis = Advisor.analyzeQuery(raw);
    updateAdvisor(analysis);
  }

  function updateAdvisor(analysis) {
    if (el.scoreValue) el.scoreValue.textContent = analysis.score || 100;
    if (el.scoreBadge) {
      const s = analysis.score || 100;
      el.scoreBadge.textContent = s >= 85 ? 'Optimized' : s >= 65 ? 'Moderate' : 'Needs Optimization';
      el.scoreBadge.className = `badge ${s >= 85 ? 'badge-good' : s >= 65 ? 'badge-warn' : 'badge-bad'}`;
    }

    // Render Suggestions
    if (el.suggestionsContainer) {
      el.suggestionsContainer.innerHTML = '';
      if (analysis.suggestions.length === 0) {
        el.suggestionsContainer.innerHTML = '<div class="text-xs text-emerald-400 p-2">✓ No critical performance hazards detected. Query structure is sound.</div>';
      } else {
        analysis.suggestions.forEach(sug => {
          const card = document.createElement('div');
          card.className = `advisor-card advisor-${sug.type}`;
          card.innerHTML = `
            <div class="advisor-title">${escapeHtml(sug.title)} <span class="badge badge-impact">${sug.impact} Impact</span></div>
            <div class="advisor-desc">${escapeHtml(sug.description)}</div>
          `;
          el.suggestionsContainer.appendChild(card);
        });
      }
    }

    // Render Execution Plan Tree
    if (el.planTreeContainer) {
      el.planTreeContainer.innerHTML = '';
      if (!analysis.planTree || analysis.planTree.length === 0) {
        el.planTreeContainer.innerHTML = '<div class="text-xs text-slate-500 p-2">No execution plan available</div>';
      } else {
        analysis.planTree.forEach((node, idx) => {
          const item = document.createElement('div');
          item.className = 'plan-node';
          item.innerHTML = `
            <div class="plan-op">${idx > 0 ? '↳ ' : ''}${escapeHtml(node.op)} <span class="plan-cost">Cost: ${node.cost}</span></div>
            <div class="plan-detail">${escapeHtml(node.detail)}</div>
          `;
          el.planTreeContainer.appendChild(item);
        });
      }
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initEventListeners() {
    el.sqlInput.addEventListener('input', handleProcess);

    el.dialectSelect.addEventListener('change', (e) => {
      const prev = currentDialect;
      currentDialect = e.target.value;
      // Automatically translate between dialects
      el.sqlInput.value = Translator.translate(el.sqlInput.value, prev, currentDialect);
      handleProcess();
      showToast(`Translated to ${currentDialect.toUpperCase()}`);
    });

    el.indentSelect.addEventListener('change', (e) => {
      indentSize = parseInt(e.target.value) || 2;
      handleProcess();
    });

    el.casingSelect.addEventListener('change', (e) => {
      uppercase = e.target.value === 'upper';
      handleProcess();
    });

    if (el.formatBtn) {
      el.formatBtn.addEventListener('click', () => {
        handleProcess();
        showToast('SQL Formatted ✨');
      });
    }

    if (el.minifyBtn) {
      el.minifyBtn.addEventListener('click', () => {
        const minified = el.sqlInput.value.replace(/\s+/g, ' ').trim();
        el.sqlInput.value = minified;
        handleProcess();
        showToast('SQL Compacted');
      });
    }

    if (el.clearBtn) {
      el.clearBtn.addEventListener('click', () => {
        el.sqlInput.value = '';
        handleProcess();
      });
    }

    if (el.copyBtn) {
      el.copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(el.sqlOutput.textContent).then(() => {
          showToast('Formatted SQL copied to clipboard! 📋');
        });
      });
    }

    if (el.downloadBtn) {
      el.downloadBtn.addEventListener('click', () => {
        const blob = new Blob([el.sqlOutput.textContent], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query_${currentDialect}_${Date.now()}.sql`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded .sql file!');
      });
    }

    // Sample Chips
    el.sampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.sample;
        if (Samples.SAMPLES[key]) {
          el.sqlInput.value = Samples.SAMPLES[key].sql;
          el.sampleChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          handleProcess();
          showToast(`Loaded sample: ${Samples.SAMPLES[key].name}`);
        }
      });
    });
  }

  function init() {
    el.sqlInput.value = Samples.getDefaultSample();
    initEventListeners();
    handleProcess();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
