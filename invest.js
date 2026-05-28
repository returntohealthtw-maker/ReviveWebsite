/**
 * 納醫芽價值股權體驗 — 估值模型、模擬行情、體驗交易（localStorage）
 * 非實際證券交易，僅供品牌敘事與教育體驗。
 */
(function () {
  'use strict';

  const STOCK = {
    symbol: 'Nayah',
    name: '納醫芽',
    company: '納醫芽健康管理顧問股份有限公司',
    sharesOutstanding: 10000000,
    currency: 'TWD',
  };

  const STORAGE_KEY = 'nayah_invest_portfolio_v1';
  const STARTING_CASH = 1000000;

  /** 四大變現商品：單價為預設參考，可透過滑桿調整銷量 */
  const PRODUCT_PRICES = {
    reportPrice: 4500,
    appMonthly: 599,
    resonancePrice: 15800,
    coursePrice: 6800,
  };

  const defaultParams = {
    reportMonthly: 80,
    appSubs: 600,
    resonanceMonthly: 35,
    courseMonthly: 100,
    revenueGrowth: 35,
    ebitdaMargin: 28,
    revenueMultiple: 6.5,
    tamMarket: 85000000000,
    tamCapture: 0.12,
    brandPremium: 115,
    techPremium: 122,
  };

  let params = { ...defaultParams };
  let fairValue = 0;
  let marketPrice = 0;
  let priceHistory = [];
  let chart = null;
  let chartRange = 90;
  let tickTimer = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function formatMoney(n, compact) {
    if (compact && Math.abs(n) >= 100000000) {
      return (n / 100000000).toFixed(2) + ' 億';
    }
    if (compact && Math.abs(n) >= 10000) {
      return (n / 10000).toFixed(0) + ' 萬';
    }
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatPrice(n) {
    return 'NT$ ' + n.toFixed(2);
  }

  function calcProductRevenue(p) {
    const revReport =
      p.reportMonthly * PRODUCT_PRICES.reportPrice * 12;
    const revApp = p.appSubs * PRODUCT_PRICES.appMonthly * 12;
    const revResonance =
      p.resonanceMonthly * PRODUCT_PRICES.resonancePrice * 12;
    const revCourse = p.courseMonthly * PRODUCT_PRICES.coursePrice * 12;
    const annualRevenue = revReport + revApp + revResonance + revCourse;
    return {
      annualRevenue,
      revReport,
      revApp,
      revResonance,
      revCourse,
      recurringShare: (revApp + revResonance) / annualRevenue,
    };
  }

  function calcValuation(p) {
    const products = calcProductRevenue(p);
    const revenue = products.annualRevenue;
    const growth = p.revenueGrowth / 100;
    const margin = p.ebitdaMargin / 100;
    const ebitda = revenue * margin;

    const saasBoost = 1 + products.recurringShare * 0.35;
    const methodRevenue = revenue * p.revenueMultiple * saasBoost;
    const methodEbitda = ebitda * 12;
    const methodTam =
      p.tamMarket * (p.tamCapture / 100) * (p.brandPremium / 100);

    let dcf = 0;
    let r = revenue;
    for (let y = 1; y <= 5; y++) {
      const g = growth * (1 - (y - 1) * 0.08);
      r *= 1 + g;
      dcf += (r * margin * 4) / Math.pow(1.12, y);
    }
    const terminal = (r * margin * 4 * 8) / Math.pow(1.12, 5);
    const methodDcf = dcf + terminal;

    const premium = (p.brandPremium / 100) * (p.techPremium / 100);
    const enterpriseValue =
      (methodRevenue * 0.25 +
        methodEbitda * 0.25 +
        methodTam * 0.2 +
        methodDcf * 0.3) *
      premium;

    const fair = enterpriseValue / STOCK.sharesOutstanding;

    return {
      enterpriseValue,
      fair,
      annualRevenue: revenue,
      products,
      methodRevenue,
      methodEbitda,
      methodTam,
      methodDcf,
      marketCap: fair * STOCK.sharesOutstanding,
    };
  }

  function generateHistory(fair, days) {
    const history = [];
    let price = fair * 0.82;
    const now = Date.now();
    for (let i = days; i >= 0; i--) {
      const drift = (fair - price) * 0.04;
      const noise = (Math.random() - 0.48) * fair * 0.018;
      price = Math.max(fair * 0.65, Math.min(fair * 1.35, price + drift + noise));
      history.push({
        t: now - i * 86400000,
        price: Math.round(price * 100) / 100,
      });
    }
    history[history.length - 1].price = fair * (0.98 + Math.random() * 0.06);
    return history;
  }

  function loadPortfolio() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      cash: STARTING_CASH,
      shares: 0,
      history: [],
    };
  }

  function savePortfolio(portfolio) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }

  function updateTickerUI(valuation) {
    const last = priceHistory[priceHistory.length - 1];
    const prev = priceHistory[priceHistory.length - 2] || last;
    const change = last.price - prev.price;
    const changePct = prev.price ? (change / prev.price) * 100 : 0;

    $('#stockPrice').textContent = formatPrice(last.price);
    const changeEl = $('#stockChange');
    const isUp = change >= 0;
    changeEl.textContent =
      (isUp ? '▲ ' : '▼ ') +
      Math.abs(change).toFixed(2) +
      ' (' +
      (isUp ? '+' : '') +
      changePct.toFixed(2) +
      '%)';
    changeEl.className = 'stock-change ' + (isUp ? 'up' : 'down');

    $('#metaFair').textContent = formatPrice(valuation.fair);
    $('#metaMarketCap').textContent = formatMoney(valuation.marketCap, true);
    $('#metaEV').textContent = formatMoney(valuation.enterpriseValue, true);
    $('#metricFair').textContent = formatPrice(valuation.fair);
    $('#metricEV').textContent = formatMoney(valuation.enterpriseValue, true);
    $('#metricCap').textContent = formatMoney(valuation.marketCap, true);
    $('#metricUpside').textContent =
      (((valuation.fair - last.price) / last.price) * 100).toFixed(1) + '%';

    $('#methodRevenue').textContent = formatMoney(valuation.methodRevenue, true);
    $('#methodEbitda').textContent = formatMoney(valuation.methodEbitda, true);
    $('#methodTam').textContent = formatMoney(valuation.methodTam, true);
    $('#methodDcf').textContent = formatMoney(valuation.methodDcf, true);

    const pr = valuation.products;
    $('#annualRevenueTotal').textContent = formatMoney(pr.annualRevenue, true);
    $('#revReport').textContent = formatMoney(pr.revReport, true);
    $('#revApp').textContent = formatMoney(pr.revApp, true);
    $('#revResonance').textContent = formatMoney(pr.revResonance, true);
    $('#revCourse').textContent = formatMoney(pr.revCourse, true);
    $('#cardRevReport').textContent =
      '年化約 ' + formatMoney(pr.revReport, true);
    $('#cardRevApp').textContent = '年化約 ' + formatMoney(pr.revApp, true);
    $('#cardRevResonance').textContent =
      '年化約 ' + formatMoney(pr.revResonance, true);
    $('#cardRevCourse').textContent =
      '年化約 ' + formatMoney(pr.revCourse, true);
  }

  function updateChart() {
    const slice = priceHistory.slice(-chartRange);
    const labels = slice.map((d) => {
      const dt = new Date(d.t);
      return chartRange <= 30
        ? dt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
        : dt.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    });
    const data = slice.map((d) => d.price);

    if (!chart) {
      const ctx = document.getElementById('priceChart');
      if (!ctx || typeof Chart === 'undefined') return;
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Nayah 參考價',
              data,
              borderColor: '#0D5C73',
              backgroundColor: 'rgba(13, 92, 115, 0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              borderWidth: 2,
            },
            {
              label: '公允價值',
              data: data.map(() => fairValue),
              borderColor: '#B8860B',
              borderDash: [6, 4],
              pointRadius: 0,
              borderWidth: 1.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: {
              callbacks: {
                label: (ctx) => ctx.dataset.label + ': ' + formatPrice(ctx.parsed.y),
              },
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              ticks: {
                callback: (v) => 'NT$' + Number(v).toFixed(2),
              },
            },
          },
        },
      });
    } else {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[1].data = data.map(() => fairValue);
      chart.update('none');
    }
  }

  function tickPrice() {
    const last = priceHistory[priceHistory.length - 1];
    const drift = (fairValue - last.price) * 0.02;
    const noise = (Math.random() - 0.5) * fairValue * 0.004;
    let next = last.price + drift + noise;
    next = Math.max(fairValue * 0.7, Math.min(fairValue * 1.3, next));
    next = Math.round(next * 100) / 100;

    priceHistory.push({ t: Date.now(), price: next });
    if (priceHistory.length > 500) priceHistory.shift();

    marketPrice = next;
    const valuation = calcValuation(params);
    updateTickerUI(valuation);
    updateChart();
    updatePortfolioUI();
  }

  const sliderConfig = [
    ['reportMonthly', 'reportMonthlyVal', (v) => v + ' 份/月'],
    ['appSubs', 'appSubsVal', (v) => Number(v).toLocaleString('zh-TW') + ' 人'],
    ['resonanceMonthly', 'resonanceMonthlyVal', (v) => v + ' 套/月'],
    ['courseMonthly', 'courseMonthlyVal', (v) => v + ' 次/月'],
    ['revenueGrowth', 'revenueGrowthVal', (v) => v + '%'],
    ['ebitdaMargin', 'ebitdaMarginVal', (v) => v + '%'],
    ['revenueMultiple', 'revenueMultipleVal', (v) => v + 'x'],
    ['tamCapture', 'tamCaptureVal', (v) => v + '%'],
    ['brandPremium', 'brandPremiumVal', (v) => v + '%'],
    ['techPremium', 'techPremiumVal', (v) => v + '%'],
  ];

  function updateSliderLabels() {
    sliderConfig.forEach(([id, labelId, fmt]) => {
      const el = document.getElementById(id);
      const label = document.getElementById(labelId);
      if (el && label) label.textContent = fmt(el.value);
    });
  }

  function bindSliders() {
    sliderConfig.forEach(([id, labelId, fmt]) => {
      const el = document.getElementById(id);
      const label = document.getElementById(labelId);
      if (!el || !label) return;
      el.addEventListener('input', () => {
        params[id] = Number(el.value);
        label.textContent = fmt(el.value);
        refreshValuation();
      });
    });
  }

  function refreshValuation() {
    const valuation = calcValuation(params);
    fairValue = valuation.fair;
    if (priceHistory.length === 0) {
      priceHistory = generateHistory(fairValue, 90);
    }
    marketPrice = priceHistory[priceHistory.length - 1].price;
    updateTickerUI(valuation);
    updateChart();
  }

  function updatePortfolioUI() {
    const p = loadPortfolio();
    const price = priceHistory[priceHistory.length - 1].price;
    const equity = p.shares * price;
    const total = p.cash + equity;

    $('#portCash').textContent = formatMoney(p.cash);
    $('#portShares').textContent = p.shares.toLocaleString('zh-TW') + ' 股';
    $('#portEquity').textContent = formatMoney(equity);
    $('#portTotal').textContent = formatMoney(total);

    const histEl = $('#tradeHistory');
    if (!histEl) return;
    if (!p.history.length) {
      histEl.innerHTML = '<div class="trade-history-item">尚無交易紀錄</div>';
      return;
    }
    histEl.innerHTML = p.history
      .slice()
      .reverse()
      .slice(0, 12)
      .map(
        (h) =>
          `<div class="trade-history-item">${h.time} · ${h.type} ${h.qty} 股 @ ${formatPrice(h.price)} · ${h.note}</div>`
      )
      .join('');
  }

  function executeTrade(type) {
    const qty = Math.floor(Number($('#tradeQty').value) || 0);
    const msg = $('#tradeMsg');
    if (qty <= 0) {
      msg.textContent = '請輸入有效股數';
      msg.className = 'trade-msg err';
      return;
    }

    const price = priceHistory[priceHistory.length - 1].price;
    const portfolio = loadPortfolio();
    const cost = qty * price;

    if (type === 'buy') {
      if (cost > portfolio.cash) {
        msg.textContent = '體驗帳戶餘額不足';
        msg.className = 'trade-msg err';
        return;
      }
      portfolio.cash -= cost;
      portfolio.shares += qty;
      portfolio.history.push({
        time: new Date().toLocaleString('zh-TW'),
        type: '買進',
        qty,
        price,
        note: '模擬成交',
      });
      msg.textContent = `已買進 ${qty} 股（體驗交易）`;
      msg.className = 'trade-msg ok';
    } else {
      if (qty > portfolio.shares) {
        msg.textContent = '持股不足，無法賣出';
        msg.className = 'trade-msg err';
        return;
      }
      portfolio.cash += cost;
      portfolio.shares -= qty;
      portfolio.history.push({
        time: new Date().toLocaleString('zh-TW'),
        type: '賣出',
        qty,
        price,
        note: '模擬成交',
      });
      msg.textContent = `已賣出 ${qty} 股（體驗交易）`;
      msg.className = 'trade-msg ok';
    }

    savePortfolio(portfolio);
    updatePortfolioUI();
  }

  function resetPortfolio() {
    if (!confirm('確定要重置體驗帳戶？持股與紀錄將清空。')) return;
    savePortfolio({ cash: STARTING_CASH, shares: 0, history: [] });
    updatePortfolioUI();
    $('#tradeMsg').textContent = '體驗帳戶已重置';
    $('#tradeMsg').className = 'trade-msg ok';
  }

  function init() {
    Object.keys(defaultParams).forEach((key) => {
      const el = document.getElementById(key);
      if (el) {
        el.value = defaultParams[key];
        params[key] = defaultParams[key];
      }
    });

    bindSliders();
    updateSliderLabels();
    refreshValuation();
    updatePortfolioUI();

    $$('.chart-range-btns button').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.chart-range-btns button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        chartRange = Number(btn.dataset.range);
        if (chartRange > 30) {
          priceHistory = generateHistory(fairValue, chartRange);
        }
        updateChart();
      });
    });

    $('#btnBuy')?.addEventListener('click', () => executeTrade('buy'));
    $('#btnSell')?.addEventListener('click', () => executeTrade('sell'));
    $('#btnReset')?.addEventListener('click', resetPortfolio);

    tickTimer = setInterval(tickPrice, 3500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
