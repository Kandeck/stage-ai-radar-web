const { caseTimeline, graphLinks, graphNodes, mentions, performances } = window.StageAiRadarData;
const { FILTER_ALL, buildOverview, computePulseScore, getScoreTone } = window.StageAiRadarScoring;

function buildShell() {
  document.body.className = "app-body";
  document.body.innerHTML = `
    <div class="ambient-layer ambient-one"></div>
    <div class="ambient-layer ambient-two"></div>
    <div class="ambient-grid"></div>
    <div class="page-shell">
      <header class="topbar glass-panel">
        <div class="brand-block">
          <div class="brand-mark" aria-hidden="true"></div>
          <div>
            <p class="eyebrow">Stage AI Radar</p>
            <h2>AI Performance Intelligence</h2>
          </div>
        </div>
        <div class="topbar-side">
          <span class="status-pill" id="dataMode">Loading</span>
          <p class="mode-hint" id="modeHint">Preparing interface…</p>
        </div>
      </header>

      <main class="main-layout">
        <section class="hero-grid">
          <article class="hero-card glass-panel">
            <p class="eyebrow">Global Theatre / Exhibition / Live Performance</p>
            <h1>把全球 AI 介入戏剧、展演、展览与音乐现场的观众反馈，收束成一张可比较的实时面板。</h1>
            <p class="hero-copy">
              这不是普通的评论列表，而是把观众评价、AI 介入程度、融合完成度与争议压力，统一转成可追踪的作品脉冲。
            </p>
            <div class="hero-actions">
              <a class="primary-action" href="#dashboard">查看实时面板</a>
              <a class="secondary-action" href="#graph">查看关系图谱</a>
            </div>
            <div class="hero-metrics" id="heroMetrics"></div>
          </article>

          <aside class="spotlight-shell glass-panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Live Spotlight</p>
                <h3>当前最强信号</h3>
              </div>
              <span class="live-pill">Live</span>
            </div>
            <div id="spotlightPanel"></div>
          </aside>
        </section>

        <section class="control-shell glass-panel" id="dashboard">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Search & Segment</p>
              <h3>筛选全球作品信号</h3>
            </div>
            <p class="section-copy">直接打开网页时显示内置 demo。运行本地服务后，这里会自动切到 API 数据。</p>
          </div>

          <div class="search-grid">
            <label class="search-field">
              <span>搜索作品 / 城市 / 场馆 / AI 工具</span>
              <input id="searchInput" type="search" placeholder="例如：Tokyo, immersive, voice, museum" autocomplete="off" />
            </label>
          </div>

          <div class="filter-groups">
            <div class="filter-group">
              <span class="filter-label">类别</span>
              <div class="chip-row" id="categoryFilters"></div>
            </div>
            <div class="filter-group">
              <span class="filter-label">地区</span>
              <div class="chip-row" id="regionFilters"></div>
            </div>
          </div>
        </section>

        <section class="timeline-shell glass-panel" id="timeline">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Case Timeline</p>
              <h3>2024 至今的 AI 介入戏剧案例</h3>
            </div>
            <p class="section-copy" id="timelineCaption"></p>
          </div>
          <div class="filter-groups">
            <div class="filter-group">
              <span class="filter-label">年份</span>
              <div class="chip-row" id="timelineYearFilters"></div>
            </div>
            <div class="filter-group">
              <span class="filter-label">甯傚満</span>
              <div class="chip-row" id="timelineMarketFilters"></div>
            </div>
          </div>
          <div class="timeline-list" id="caseTimeline"></div>
        </section>

        <section class="dashboard-grid">
          <div class="signal-column">
            <div class="section-heading compact">
              <div>
                <p class="eyebrow">Performance Signals</p>
                <h3>作品脉冲列表</h3>
              </div>
              <span class="status-pill subtle" id="resultCount"></span>
            </div>
            <div class="signal-list" id="signalList"></div>
          </div>

          <aside class="detail-column">
            <article class="inspector-shell glass-panel" id="inspectorPanel"></article>
            <article class="feed-shell glass-panel">
              <div class="section-heading compact">
                <div>
                  <p class="eyebrow">Audience Flow</p>
                  <h3>实时评论流</h3>
                </div>
                <span class="status-pill subtle">Rolling</span>
              </div>
              <div class="live-feed-list" id="liveFeed"></div>
            </article>
          </aside>
        </section>

        <section class="insight-grid">
          <article class="graph-shell glass-panel" id="graph">
            <div class="section-heading">
              <div>
                <p class="eyebrow">AI Relationship Map</p>
                <h3>AI 工具介入与现场戏剧的关系图谱</h3>
              </div>
              <span class="status-pill subtle">Interactive</span>
            </div>
            <div class="graph-layout">
              <div class="graph-stage">
                <svg id="relationshipGraph" viewBox="0 0 760 460" aria-label="AI relationship graph"></svg>
              </div>
              <div class="graph-detail" id="graphDetail"></div>
            </div>
          </article>

          <div class="side-panels">
            <article class="score-shell glass-panel" id="scorePanel"></article>
            <article class="source-shell glass-panel" id="sourcePanel"></article>
            <article class="context-shell glass-panel">
              <p class="eyebrow">Usage</p>
              <h3>现在怎么用</h3>
              <p>直接打开网页会显示内置演示数据。要看到本地 API、来源控制与采集按钮，请在项目目录运行 <code>npm run dev</code>。</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  `;
}

buildShell();

const elements = {
  heroMetrics: document.querySelector("#heroMetrics"),
  spotlightPanel: document.querySelector("#spotlightPanel"),
  categoryFilters: document.querySelector("#categoryFilters"),
  regionFilters: document.querySelector("#regionFilters"),
  timelineYearFilters: document.querySelector("#timelineYearFilters"),
  timelineMarketFilters: document.querySelector("#timelineMarketFilters"),
  timelineCaption: document.querySelector("#timelineCaption"),
  caseTimeline: document.querySelector("#caseTimeline"),
  searchInput: document.querySelector("#searchInput"),
  signalList: document.querySelector("#signalList"),
  resultCount: document.querySelector("#resultCount"),
  inspectorPanel: document.querySelector("#inspectorPanel"),
  liveFeed: document.querySelector("#liveFeed"),
  relationshipGraph: document.querySelector("#relationshipGraph"),
  graphDetail: document.querySelector("#graphDetail"),
  scorePanel: document.querySelector("#scorePanel"),
  sourcePanel: document.querySelector("#sourcePanel"),
  dataMode: document.querySelector("#dataMode"),
  modeHint: document.querySelector("#modeHint")
};

const numberFormatter = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function enrichSignals(items) {
  return items.map((item) => {
    const pulseScore = item.pulseScore ?? computePulseScore(item);
    return {
      ...item,
      pulseScore,
      scoreTone: item.scoreTone ?? getScoreTone(pulseScore)
    };
  });
}

function createFallbackPayload() {
  const signals = enrichSignals(performances);
  return {
    meta: {
      mode: "demo",
      generatedAt: new Date().toISOString(),
      overview: buildOverview(signals)
    },
    signals,
    mentions,
    caseTimeline,
    graph: {
      nodes: graphNodes,
      links: graphLinks
    },
    sourceStatus: {
      items: [],
      collectionPreview: [],
      recentRuns: [],
      storage: {
        storageMode: "demo",
        rawReviewCount: 0,
        collectionRunCount: 0,
        fallbackReason: null
      }
    }
  };
}

const state = {
  category: FILTER_ALL,
  region: FILTER_ALL,
  timelineYear: FILTER_ALL,
  timelineMarket: FILTER_ALL,
  search: "",
  selectedSignalId: null,
  activeNodeId: graphNodes[0]?.id ?? "",
  liveOffset: 0,
  dataMode: "Loading",
  modeHint: "",
  sourceActionMessage: "",
  sourceActionPending: "",
  signalStorageById: {},
  downloadMessageById: {},
  downloadPending: "",
  data: createFallbackPayload()
};

let liveFeedTimer = null;
let refreshTimer = null;

function canUseApi() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

async function loadBootstrapData() {
  if (!canUseApi()) {
    state.dataMode = "静态演示";
    state.modeHint = "当前是直接打开网页的模式，显示内置 demo 数据。";
    return createFallbackPayload();
  }

  try {
    const response = await fetch("/api/bootstrap", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Bootstrap request failed with ${response.status}`);
    }

    const payload = await response.json();
    state.dataMode = "Live API";
    state.modeHint = `已连接本地 API · ${payload.signals?.length ?? 0} 个 signals`;

    return {
      ...createFallbackPayload(),
      ...payload,
      signals: enrichSignals(payload.signals ?? []),
      mentions: payload.mentions ?? mentions,
      caseTimeline: payload.caseTimeline ?? caseTimeline,
      graph: {
        nodes: payload.graph?.nodes ?? graphNodes,
        links: payload.graph?.links ?? graphLinks
      },
      sourceStatus: payload.sourceStatus ?? createFallbackPayload().sourceStatus
    };
  } catch {
    state.dataMode = "Demo Fallback";
    state.modeHint = "本地 API 暂不可达，当前回退到内置 demo 数据。";
    return createFallbackPayload();
  }
}

function getSignals() {
  return state.data.signals ?? [];
}

function getMentions() {
  return state.data.mentions ?? [];
}

function getGraphNodes() {
  return state.data.graph?.nodes ?? [];
}

function getGraphLinks() {
  return state.data.graph?.links ?? [];
}

function getSourceStatus() {
  return state.data.sourceStatus ?? createFallbackPayload().sourceStatus;
}

function getTimelineCases() {
  return state.data.caseTimeline ?? caseTimeline ?? [];
}

function getTimelineYears() {
  return [FILTER_ALL, ...new Set(getTimelineCases().map((item) => String(item.startDate ?? "").slice(0, 4)).filter(Boolean))];
}

function getTimelineMarkets() {
  return [FILTER_ALL, ...new Set(getTimelineCases().map((item) => item.market ?? (item.country === "中国" ? "中国" : "海外")).filter(Boolean))];
}

function getCaseSources(item) {
  if (Array.isArray(item.sources) && item.sources.length) {
    return item.sources.filter((source) => source?.label && source?.url);
  }

  if (item.sourceLabel && item.sourceUrl) {
    return [{ label: item.sourceLabel, url: item.sourceUrl }];
  }

  return [];
}

function formatAgo(minutes) {
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }
  if (minutes < 1440) {
    return `${Math.floor(minutes / 60)} 小时前`;
  }
  return `${Math.floor(minutes / 1440)} 天前`;
}

function sparklinePath(values, width = 320, height = 88) {
  if (!values.length) {
    return "";
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 12) - 6;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function getCategories() {
  return [FILTER_ALL, ...new Set(getSignals().map((item) => item.category).filter(Boolean))];
}

function getRegions() {
  return [FILTER_ALL, ...new Set(getSignals().map((item) => item.region).filter(Boolean))];
}

function getFilteredSignals() {
  const query = state.search.trim().toLowerCase();

  return getSignals().filter((item) => {
    const matchesCategory = state.category === FILTER_ALL || item.category === state.category;
    const matchesRegion = state.region === FILTER_ALL || item.region === state.region;
    const matchesQuery =
      !query ||
      [item.title, item.city, item.country, item.venue, ...(item.sources ?? []), ...(item.stack ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return matchesCategory && matchesRegion && matchesQuery;
  });
}

function getSelectedSignal(filteredSignals) {
  const selected = filteredSignals.find((item) => item.id === state.selectedSignalId);
  if (selected) {
    return selected;
  }
  if (filteredSignals[0]) {
    state.selectedSignalId = filteredSignals[0].id;
    return filteredSignals[0];
  }
  return null;
}

function getVisibleMentions(filteredSignals) {
  if (!filteredSignals.length) {
    return [];
  }

  const filteredIds = new Set(filteredSignals.map((item) => item.id));
  const scopedMentions = getMentions().filter((item) => {
    if (!filteredIds.has(item.signalId)) {
      return false;
    }
    if (state.region !== FILTER_ALL && item.region !== state.region) {
      return false;
    }
    return true;
  });

  const pool = scopedMentions.length ? scopedMentions : getMentions();
  if (!pool.length) {
    return [];
  }

  return Array.from({ length: Math.min(6, pool.length) }, (_, index) => pool[(state.liveOffset + index) % pool.length]);
}

function getFilteredTimelineCases() {
  const year = state.timelineYear;
  const market = state.timelineMarket;
  return [...getTimelineCases()]
    .filter((item) => {
      const matchesYear = year === FILTER_ALL || String(item.startDate ?? "").startsWith(`${year}`);
      const itemMarket = item.market ?? (item.country === "中国" ? "中国" : "海外");
      const matchesMarket = market === FILTER_ALL || itemMarket === market;
      return matchesYear && matchesMarket;
    })
    .sort((left, right) => String(right.startDate).localeCompare(String(left.startDate)));
}

function getSignalStorageState(signalId) {
  return state.signalStorageById[signalId] ?? { status: "idle", data: null, error: "" };
}

function formatDateRange(startDate, endDate) {
  if (!startDate) {
    return "日期待补充";
  }

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const start = formatter.format(new Date(startDate));
  if (!endDate || endDate === startDate) {
    return start;
  }
  return `${start} - ${formatter.format(new Date(endDate))}`;
}

function metricBar(label, value, suffix = "") {
  return `
    <div class="metric-bar">
      <div class="metric-bar-top">
        <span>${escapeHtml(label)}</span>
        <span>${escapeHtml(value)}${escapeHtml(suffix)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.max(0, Math.min(Number(value) || 0, 100))}%"></div>
      </div>
    </div>
  `;
}

function statusLabel(status) {
  const labels = {
    "live-ready": "可 live",
    "waiting-for-credentials": "待配置",
    skeleton: "骨架",
    completed: "完成",
    failed: "失败",
    started: "运行中"
  };
  return labels[status] ?? status ?? "未知";
}

function sourceRoleLabel(role) {
  const labels = {
    "case-discovery": "案例发现",
    "audience-reviews": "观众评论",
    "ai-method-verification": "介入说明",
    "long-review-supplement": "长评补充",
    "heat-signal": "热度辅助",
    "critic-reviews": "媒体评论",
    "post-purchase-reviews": "购后反馈"
  };
  return labels[role] ?? role ?? "未分类";
}

function renderDataMode() {
  elements.dataMode.textContent = state.dataMode;
  elements.modeHint.textContent = state.modeHint;
}

function renderFilters() {
  elements.categoryFilters.innerHTML = getCategories()
    .map(
      (category) => `
        <button class="filter-chip" data-category="${escapeHtml(category)}" data-active="${String(category === state.category)}">
          ${escapeHtml(category)}
        </button>
      `
    )
    .join("");

  elements.regionFilters.innerHTML = getRegions()
    .map(
      (region) => `
        <button class="filter-chip" data-region="${escapeHtml(region)}" data-active="${String(region === state.region)}">
          ${escapeHtml(region)}
        </button>
      `
    )
    .join("");
}

function renderTimeline() {
  const cases = getFilteredTimelineCases();
  elements.timelineYearFilters.innerHTML = getTimelineYears()
    .map(
      (year) => `
        <button class="filter-chip" data-timeline-year="${escapeHtml(year)}" data-active="${String(year === state.timelineYear)}">
          ${escapeHtml(year)}
        </button>
      `
    )
    .join("");

  elements.timelineMarketFilters.innerHTML = getTimelineMarkets()
    .map(
      (market) => `
        <button class="filter-chip" data-timeline-market="${escapeHtml(market)}" data-active="${String(market === state.timelineMarket)}">
          ${escapeHtml(market)}
        </button>
      `
    )
    .join("");

  elements.timelineCaption.textContent = `收录 2024-01-01 到 2026-03-22 的公开案例，当前显示 ${cases.length} 条，按时间倒序。`;

  const timelineEnd = new Date().toISOString().slice(0, 10);
  elements.timelineCaption.textContent = `已入库 2024-01-01 到 ${timelineEnd} 的公开案例 ${getTimelineCases().length} 条，当前显示 ${cases.length} 条，按时间倒序。`;

  if (!cases.length) {
    elements.caseTimeline.innerHTML = `<div class="empty-state">当前年份筛选下还没有案例卡片。</div>`;
    return;
  }

  elements.caseTimeline.innerHTML = cases
    .map(
      (item) => `
        <article class="case-card">
          <div class="case-topline">
            <div>
              <p class="case-date">${escapeHtml(formatDateRange(item.startDate, item.endDate))}</p>
              <h4 class="case-title">${escapeHtml(item.title)}</h4>
              <p class="signal-meta">${escapeHtml(item.format)} · ${escapeHtml(item.city)} · ${escapeHtml(item.venue)}</p>
            </div>
            <div class="case-score">
              <span>AI 介入</span>
              <strong>${escapeHtml(item.aiInvolvement)}</strong>
            </div>
          </div>
          <p class="signal-copy">${escapeHtml(item.summary)}</p>
          <div class="case-meta-grid">
            <div class="detail-card">
              <span>介入方式</span>
              <strong>${escapeHtml(item.aiMode)}</strong>
            </div>
            <div class="detail-card">
              <span>呈现机构</span>
              <strong>${escapeHtml(item.curator)}</strong>
            </div>
          </div>
          <div class="case-footer">
            <div class="stack-row">
              <span class="stack-pill">${escapeHtml(item.category)}</span>
              <span class="stack-pill">${escapeHtml(item.country)}</span>
              <span class="stack-pill">${escapeHtml(item.market ?? (item.country === "中国" ? "中国" : "海外"))}</span>
            </div>
            <a class="case-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">查看来源 · ${escapeHtml(item.sourceLabel)}</a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderHero(filteredSignals) {
  const overview = buildOverview(filteredSignals);
  elements.heroMetrics.innerHTML = [
    { label: "纳入作品", value: `${overview.signalCount}`, meta: "按作品聚合" },
    { label: "评论总量", value: numberFormatter.format(overview.reviewTotal), meta: "跨来源汇总" },
    { label: "平均 AI 介入", value: `${overview.averageAiInvolvement}`, meta: "0 - 100" },
    { label: "平均脉冲分", value: `${overview.averagePulseScore}`, meta: `${overview.sourceTotal} 个来源` }
  ]
    .map(
      (metric) => `
        <article class="metric-card">
          <span class="metric-label">${escapeHtml(metric.label)}</span>
          <strong class="metric-value">${escapeHtml(metric.value)}</strong>
          <span class="metric-meta">${escapeHtml(metric.meta)}</span>
        </article>
      `
    )
    .join("");
}

function renderSpotlight(filteredSignals) {
  if (!filteredSignals.length) {
    elements.spotlightPanel.innerHTML = `<div class="empty-state">当前筛选条件下没有可展示的作品信号。</div>`;
    return;
  }

  const ranked = [...filteredSignals].sort((left, right) => right.pulseScore - left.pulseScore);
  const featured = ranked[0];
  const others = ranked.slice(1, 4);

  elements.spotlightPanel.innerHTML = `
    <div class="spotlight-score">
      <span>Pulse Score</span>
      <strong>${featured.pulseScore}</strong>
    </div>
    <h4 class="spotlight-title">${escapeHtml(featured.title)}</h4>
    <p class="spotlight-meta">${escapeHtml(featured.category)} · ${escapeHtml(featured.city)} · ${escapeHtml(formatAgo(featured.updatedMinutesAgo))}</p>
    <p class="spotlight-copy">${escapeHtml(featured.highlight)}</p>
    <div class="stack-row">
      ${(featured.stack ?? []).slice(0, 4).map((item) => `<span class="stack-pill">${escapeHtml(item)}</span>`).join("")}
    </div>
    <div class="mini-list">
      ${others
        .map(
          (item) => `
            <button class="mini-signal" data-signal-id="${escapeHtml(item.id)}">
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.city)} · AI ${item.aiInvolvement}</span>
              </div>
              <b>${item.pulseScore}</b>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSignalList(filteredSignals) {
  elements.resultCount.textContent = `${filteredSignals.length} 条结果`;

  if (!filteredSignals.length) {
    elements.signalList.innerHTML = `
      <div class="empty-state">
        当前筛选条件下没有命中作品。<br />
        试试更宽的搜索词，或者切换地区与类别。
      </div>
    `;
    return;
  }

  elements.signalList.innerHTML = filteredSignals
    .map(
      (item) => `
        <article class="signal-card" data-signal-id="${escapeHtml(item.id)}" data-active="${String(item.id === state.selectedSignalId)}">
          <div class="signal-topline">
            <div>
              <h4 class="signal-title">${escapeHtml(item.title)}</h4>
              <p class="signal-meta">${escapeHtml(item.category)} · ${escapeHtml(item.city)}, ${escapeHtml(item.country)} · ${escapeHtml(item.venue)}</p>
            </div>
            <div class="signal-score">
              <strong>${item.pulseScore}</strong>
              <span>${escapeHtml(item.scoreTone.label)}</span>
            </div>
          </div>
          <p class="signal-copy">${escapeHtml(item.highlight)}</p>
          <div class="metric-stack">
            ${metricBar("观众评价", item.audienceSentiment)}
            ${metricBar("AI 介入", item.aiInvolvement)}
            ${metricBar("融合完成度", item.integrationQuality)}
          </div>
          <div class="signal-footer">
            <div class="stack-row">
              ${(item.stack ?? []).slice(0, 3).map((stack) => `<span class="stack-pill">${escapeHtml(stack)}</span>`).join("")}
            </div>
            <span class="tone-pill ${escapeHtml(item.scoreTone.className)}">${escapeHtml(item.scoreTone.label)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderInspector(selectedSignal) {
  if (!selectedSignal) {
    elements.inspectorPanel.innerHTML = `<div class="empty-state">没有可展示的作品信号。</div>`;
    elements.scorePanel.innerHTML = `<div class="empty-state">没有可展示的评分细节。</div>`;
    return;
  }

  const storageState = getSignalStorageState(selectedSignal.id);
  const storage = storageState.data;
  const storageMessage =
    !canUseApi()
      ? "直接打开静态页面时不连接本地 API。运行 npm run dev 后才能导出已保存的评论原文。"
      : storageState.status === "loaded" && storage
      ? `本地已存 ${storage.storedReviewCount} 条原文评论 · 约 ${storage.totalKilobytes} KB`
      : storageState.status === "loading"
        ? "正在读取本地原文评论存储…"
        : storageState.error || "当前作品还没有本地原文评论。";
  const isDownloadDisabled =
    !canUseApi() ||
    storageState.status === "loading" ||
    !storage ||
    Number(storage.storedReviewCount ?? 0) <= 0;
  const downloadMessage = state.downloadMessageById[selectedSignal.id] ?? "";

  elements.inspectorPanel.innerHTML = `
    <div class="inspector-header">
      <p class="eyebrow">Signal Inspector</p>
      <h3>${escapeHtml(selectedSignal.title)}</h3>
      <p class="signal-meta">${escapeHtml(selectedSignal.category)} · ${escapeHtml(selectedSignal.city)} · ${escapeHtml(selectedSignal.country)} · ${escapeHtml(selectedSignal.reviewCount)} 条评论</p>
    </div>

    <div class="inspector-grid">
      <div class="score-orb">
        <span>Pulse Score</span>
        <strong>${selectedSignal.pulseScore}</strong>
        <b class="${escapeHtml(selectedSignal.scoreTone.className)}">${escapeHtml(selectedSignal.scoreTone.label)}</b>
      </div>
      <div class="metric-stack">
        ${metricBar("观众评价", selectedSignal.audienceSentiment)}
        ${metricBar("AI 介入程度", selectedSignal.aiInvolvement)}
        ${metricBar("融合完成度", selectedSignal.integrationQuality)}
        ${metricBar("争议压力", selectedSignal.controversy)}
      </div>
    </div>

    <blockquote class="quote-card">${escapeHtml(selectedSignal.quote)}</blockquote>

    <div class="trend-card">
      <div class="trend-head">
        <span>近 8 个时间片热度走势</span>
        <span>${escapeHtml((selectedSignal.sources ?? []).join(" · "))}</span>
      </div>
      <svg viewBox="0 0 320 88" aria-hidden="true">
        <path d="${sparklinePath(selectedSignal.trend ?? [])}" fill="none" stroke="url(#trendGradient)" stroke-width="4" stroke-linecap="round"></path>
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6e8bff"></stop>
            <stop offset="100%" stop-color="#6fd3ff"></stop>
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div class="stack-row">
      ${(selectedSignal.stack ?? []).map((item) => `<span class="stack-pill">${escapeHtml(item)}</span>`).join("")}
    </div>

    <div class="download-panel">
      <div class="download-panel-head">
        <div>
          <p class="eyebrow">Comments Export</p>
          <h4>下载评论原文与时间</h4>
        </div>
        ${storage ? `<span class="status-pill subtle">${escapeHtml(storage.storageMode ?? "api")}</span>` : ""}
      </div>
      <p class="download-note">${escapeHtml(storageMessage)}</p>
      <div class="download-actions">
        <button
          class="source-button primary"
          data-download-format="csv"
          data-download-signal-id="${escapeHtml(selectedSignal.id)}"
          ${isDownloadDisabled || state.downloadPending ? "disabled" : ""}
        >
          下载评论 CSV
        </button>
        <button
          class="source-button"
          data-download-format="json"
          data-download-signal-id="${escapeHtml(selectedSignal.id)}"
          ${isDownloadDisabled || state.downloadPending ? "disabled" : ""}
        >
          下载原始 JSON
        </button>
      </div>
      ${
        downloadMessage
          ? `<p class="download-note subtle">${escapeHtml(downloadMessage)}</p>`
          : `<p class="download-note subtle">导出的文件会带上评论原文、采集时间、来源、语言与 AI 标签。</p>`
      }
    </div>
  `;

  elements.scorePanel.innerHTML = `
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Scoring Logic</p>
        <h3>评分模型</h3>
      </div>
    </div>
    <h4>${escapeHtml(selectedSignal.title)}</h4>
    <p class="formula-card">Pulse Score = 观众评价 × 60% + AI 介入 × 25% + 融合完成度 × 15%</p>
    <div class="metric-stack">
      ${metricBar("观众评价", selectedSignal.audienceSentiment, " · 权重 60%")}
      ${metricBar("AI 介入", selectedSignal.aiInvolvement, " · 权重 25%")}
      ${metricBar("融合完成度", selectedSignal.integrationQuality, " · 权重 15%")}
    </div>
    <p class="score-note">
      当前综合分为 <strong>${selectedSignal.pulseScore}</strong>。这一层适合先做跨作品比较，后续可以继续叠加来源可信度、评论去重质量和地区权重。
    </p>
  `;
}

function renderLiveFeed(filteredSignals) {
  const visibleMentions = getVisibleMentions(filteredSignals);
  if (!visibleMentions.length) {
    elements.liveFeed.innerHTML = `<div class="empty-state">等待更多评论流进入面板。</div>`;
    return;
  }

  elements.liveFeed.innerHTML = visibleMentions
    .map((item, index) => {
      const signal = getSignals().find((entry) => entry.id === item.signalId);
      const toneClass = item.tone === "positive" ? "tone-positive" : item.tone === "mixed" ? "tone-mixed" : "tone-watch";
      return `
        <article class="feed-card-item" data-feed-signal-id="${escapeHtml(item.signalId)}" data-priority="${String(index === 0)}">
          <div class="feed-topline">
            <span>${escapeHtml(signal?.title ?? item.signalId)}</span>
            <span class="${toneClass}">${escapeHtml(item.source)} · ${escapeHtml(item.language)} · ${escapeHtml(formatAgo(item.minutesAgo))}</span>
          </div>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `;
    })
    .join("");
}

function renderSourcePanel() {
  const sourceStatus = getSourceStatus();
  const items = sourceStatus.items ?? [];
  const storage = sourceStatus.storage ?? {};
  const recentRuns = sourceStatus.recentRuns ?? [];
  const readyCount = items.filter((item) => item.supportsLiveMode && item.enabled).length;
  const chinaSources = items.filter((item) => item.market === "china").sort((left, right) => (left.priority ?? 99) - (right.priority ?? 99));
  const strategyText = chinaSources.length
    ? `中国优先链路：${chinaSources.map((item) => item.label).join(" → ")}`
    : "";

  if (!items.length) {
    elements.sourcePanel.innerHTML = `
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Source Control</p>
          <h3>来源控制</h3>
        </div>
        <span class="status-pill subtle">${escapeHtml(storage.storageMode ?? "demo")}</span>
      </div>
      <p class="source-note">
        当前是演示模式，所以这里不显示真实来源控制。运行 <code>npm run dev</code> 后，这里会出现大麦、小红书、公众号白名单以及全球补充来源的状态与采集按钮。
      </p>
    `;
    return;
  }

  elements.sourcePanel.innerHTML = `
    <div class="section-heading compact">
      <div>
        <p class="eyebrow">Source Control</p>
        <h3>来源控制</h3>
      </div>
      <span class="status-pill subtle">${escapeHtml(storage.storageMode ?? "unknown")}</span>
    </div>

    <div class="source-summary">
      <article class="source-summary-card">
        <strong>${items.length}</strong>
        <span>适配器总数</span>
      </article>
      <article class="source-summary-card">
        <strong>${readyCount}</strong>
        <span>已就绪来源</span>
      </article>
      <article class="source-summary-card">
        <strong>${storage.rawReviewCount ?? 0}</strong>
        <span>本地评论存量</span>
      </article>
      <article class="source-summary-card">
        <strong>${storage.collectionRunCount ?? recentRuns.length ?? 0}</strong>
        <span>累计运行次数</span>
      </article>
    </div>

    ${strategyText ? `<p class="source-strategy">${escapeHtml(strategyText)}</p>` : ""}
    ${state.sourceActionMessage ? `<p class="source-note">${escapeHtml(state.sourceActionMessage)}</p>` : ""}

    <div class="source-grid">
      ${items
        .map(
          (item) => `
            <article class="source-item">
              <div class="source-head">
                <div>
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>${escapeHtml(item.coverage)} · ${escapeHtml(sourceRoleLabel(item.role))}</span>
                </div>
                <span class="status-pill subtle ${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span>
              </div>
              <p class="source-note">${escapeHtml(item.notes)}</p>
              <div class="stack-row">
                ${item.market ? `<span class="stack-pill">${escapeHtml(item.market === "china" ? "中国优先" : "全球补充")}</span>` : ""}
                ${item.recommendedFor ? `<span class="stack-pill">${escapeHtml(item.recommendedFor)}</span>` : ""}
              </div>
              ${item.officialAccess ? `<p class="source-note">接入方式：${escapeHtml(item.officialAccess)}</p>` : ""}
              ${
                item.missingEnv?.length
                  ? `<p class="source-warning">缺少配置: ${escapeHtml(item.missingEnv.join(", "))}</p>`
                  : `<p class="source-warning">配置已就绪，可以尝试 live 模式。</p>`
              }
              <div class="source-actions">
                <button
                  class="source-button"
                  data-source-action="sample"
                  data-source-id="${escapeHtml(item.id)}"
                  ${!item.supportsSampleMode || !canUseApi() || state.sourceActionPending ? "disabled" : ""}
                >
                  示例采集
                </button>
                <button
                  class="source-button primary"
                  data-source-action="live"
                  data-source-id="${escapeHtml(item.id)}"
                  ${!item.supportsLiveMode || !canUseApi() || state.sourceActionPending ? "disabled" : ""}
                >
                  实时采集
                </button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>

    <div class="run-list">
      <h4>最近运行</h4>
      ${
        recentRuns.length
          ? recentRuns
              .slice(0, 4)
              .map(
                (run) => `
                  <div class="run-item">
                    <span>${escapeHtml(run.source_id)} · ${escapeHtml(run.mode)}</span>
                    <span>${escapeHtml(statusLabel(run.status))} · ${escapeHtml(run.collected_count ?? 0)}</span>
                  </div>
                `
              )
              .join("")
          : `<p class="source-note">还没有采集运行记录。</p>`
      }
    </div>
  `;
}

function renderGraphLegacy() {
  const nodes = getGraphNodes();
  const links = getGraphLinks();
  const activeNode = nodes.find((item) => item.id === state.activeNodeId) ?? nodes[0];
  const core = { x: 382, y: 228 };

  if (!activeNode) {
    elements.relationshipGraph.innerHTML = "";
    elements.graphDetail.innerHTML = `<div class="empty-state">图谱数据暂不可用。</div>`;
    return;
  }

  const nodeLookup = Object.fromEntries(nodes.map((item) => [item.id, item]));

  elements.relationshipGraph.innerHTML = `
    <defs>
      <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="rgba(255,255,255,1)"></stop>
        <stop offset="40%" stop-color="rgba(110,139,255,0.9)"></stop>
        <stop offset="100%" stop-color="rgba(110,139,255,0.08)"></stop>
      </radialGradient>
    </defs>

    ${links
      .map((link) => {
        const fromNode = link.source === "core" ? core : nodeLookup[link.source];
        const toNode = link.target === "core" ? core : nodeLookup[link.target];
        if (!fromNode || !toNode) {
          return "";
        }
        const isActive = [link.source, link.target].includes(state.activeNodeId);
        return `
          <path
            class="graph-link ${isActive ? "active" : ""}"
            d="M ${fromNode.x} ${fromNode.y} C ${(fromNode.x + toNode.x) / 2} ${fromNode.y}, ${(fromNode.x + toNode.x) / 2} ${toNode.y}, ${toNode.x} ${toNode.y}"
          ></path>
        `;
      })
      .join("")}

    <circle cx="${core.x}" cy="${core.y}" r="110" fill="rgba(110,139,255,0.07)"></circle>
    <circle cx="${core.x}" cy="${core.y}" r="84" fill="url(#coreGlow)"></circle>
    <circle cx="${core.x}" cy="${core.y}" r="64" fill="rgba(255,255,255,0.92)"></circle>
    <text x="${core.x}" y="${core.y - 8}" text-anchor="middle" class="graph-core-title">AI x Stage</text>
    <text x="${core.x}" y="${core.y + 18}" text-anchor="middle" class="graph-core-subtitle">story · audience · space</text>

    ${nodes
      .map(
        (node) => `
          <g class="graph-node" data-node-id="${escapeHtml(node.id)}" data-active="${String(node.id === state.activeNodeId)}">
            <circle class="outer" cx="${node.x}" cy="${node.y}" r="${node.radius}" style="fill:${node.accent}14;stroke:${node.accent}"></circle>
            <circle class="inner" cx="${node.x}" cy="${node.y}" r="${node.radius - 10}" style="fill:white"></circle>
            <text class="node-title" x="${node.x}" y="${node.y - 4}">${escapeHtml(node.title)}</text>
            <text class="node-subtitle" x="${node.x}" y="${node.y + 18}">${escapeHtml(node.subtitle)}</text>
          </g>
        `
      )
      .join("")}
  `;

  elements.graphDetail.innerHTML = `
    <p class="eyebrow">Node Detail</p>
    <h3>${escapeHtml(activeNode.title)}</h3>
    <p class="detail-copy">${escapeHtml(activeNode.impact)}</p>
    <div class="detail-grid">
      <article class="detail-card">
        <span>所在层</span>
        <strong>${escapeHtml(activeNode.subtitle)}</strong>
      </article>
      <article class="detail-card">
        <span>带来的价值</span>
        <strong>${escapeHtml(activeNode.value)}</strong>
      </article>
      <article class="detail-card">
        <span>关键张力</span>
        <strong>${escapeHtml(activeNode.tension)}</strong>
      </article>
    </div>
  `;
}

const GRAPH_LAYER_LIBRARY = [
  {
    id: "script-engine",
    title: "Script Intelligence",
    subtitle: "文本与编剧",
    accent: "#7A5CFA",
    description: "负责剧本、对白和结构生成，是 AI 最早进入戏剧创作的入口层。",
    value: "把想法和提示快速转成可排练文本。",
    tension: "文本生成越强，作者性和导演控制感越容易被重新讨论。"
  },
  {
    id: "voice-avatar",
    title: "Voice & Avatar",
    subtitle: "角色与表演",
    accent: "#34C5AA",
    description: "语音克隆、AI演员、数字替身和 lip sync 都落在这一层。",
    value: "扩展角色数量、跨语种演出和非人角色的在场方式。",
    tension: "观众会不断追问，到底是谁在说话、谁在表演。"
  },
  {
    id: "spatial-stage",
    title: "Spatial Stage",
    subtitle: "空间与调度",
    accent: "#FF9B52",
    description: "XR、VR、AR、投影和全息共同构成了 AI 进入现场空间的主层。",
    value: "让舞台和展场从固定布景变成实时可变环境。",
    tension: "视觉和空间系统一旦过强，戏剧核心容易被技术奇观盖过去。"
  },
  {
    id: "curation-layer",
    title: "Curation Layer",
    subtitle: "展陈与共创",
    accent: "#FF6688",
    description: "AI 在展览和跨媒介项目里常常扮演策展、注释和共创助手。",
    value: "提升信息密度，并提供更个性化的阅读路径。",
    tension: "解释性越强，观众的想象空白反而可能越少。"
  },
  {
    id: "audience-loop",
    title: "Audience Loop",
    subtitle: "互动与反馈",
    accent: "#5AB6FF",
    description: "观众选择、问答和参与式机制会直接决定内容如何被重新组织。",
    value: "把观众从观察者变成真正的叙事变量。",
    tension: "互动设计如果失衡，现场会更像系统演示而不是完整作品。"
  },
  {
    id: "ops-feedback",
    title: "Ops & Data",
    subtitle: "数据与运营",
    accent: "#98A2B3",
    description: "预测、评分、数据伦理和运营闭环决定 AI 如何反馈到制作层。",
    value: "让评价、风险和复购倾向进入创作决策。",
    tension: "当数据反馈越来越强，作品可能会向更安全的方向收缩。"
  }
];

const GRAPH_TOOL_LIBRARY = [
  {
    id: "tool-llm",
    title: "LLM / ChatGPT",
    subtitle: "文本生成",
    accent: "#8B5CF6",
    layerId: "script-engine",
    description: "用于联合编剧、对白生成和叙事结构辅助。",
    keywords: ["chatgpt", "llm", "playwriting", "剧本", "编剧", "写作", "文本", "大语言模型", "联合编剧", "ai写作"]
  },
  {
    id: "tool-voice",
    title: "AI Voice",
    subtitle: "语音 / lip sync",
    accent: "#10B981",
    layerId: "voice-avatar",
    description: "包括语音克隆、AI 语音代理和声音角色生成。",
    keywords: ["voice", "语音", "voice clone", "lip sync", "口型", "语音代理", "声音", "voice characters"]
  },
  {
    id: "tool-avatar",
    title: "Digital Avatar",
    subtitle: "数字替身",
    accent: "#22C55E",
    layerId: "voice-avatar",
    description: "包括 AI 演员、数字替身、虚拟化身和历史人物数字共演。",
    keywords: ["数字替身", "avatar", "化身", "数字化共演", "虚拟化身", "ai演员", "演员", "digital likeness", "performance generation"]
  },
  {
    id: "tool-xr",
    title: "XR / VR / AR",
    subtitle: "沉浸空间",
    accent: "#F97316",
    layerId: "spatial-stage",
    description: "用于沉浸式空间和混合现实展演。",
    keywords: ["xr", "vr", "ar", "混合现实", "mixed reality", "沉浸式", "immersive", "虚拟现实"]
  },
  {
    id: "tool-hologram",
    title: "Projection / Hologram",
    subtitle: "投影与全息",
    accent: "#FB7185",
    layerId: "spatial-stage",
    description: "包括全息、巨幕、环绕屏、outpainting 和空间影像扩展。",
    keywords: ["全息", "投影", "巨幕", "16k", "270", "环绕屏", "projection", "outpainting"]
  },
  {
    id: "tool-music",
    title: "AI Music",
    subtitle: "作曲与编曲",
    accent: "#A855F7",
    layerId: "spatial-stage",
    description: "AI 作曲、编曲、情绪配乐和生成式音频控制。",
    keywords: ["suno", "作曲", "编曲", "音乐", "歌曲", "song", "audio", "空间音频", "配乐"]
  },
  {
    id: "tool-aigc-visual",
    title: "AIGC Visuals",
    subtitle: "视觉生成",
    accent: "#38BDF8",
    layerId: "curation-layer",
    description: "图像生成、视觉共创和动态媒体系统。",
    keywords: ["midjourney", "aigc", "视觉", "image", "海报", "视觉共创", "生成式视觉", "digital art", "数字艺术"]
  },
  {
    id: "tool-curation",
    title: "AI Curation",
    subtitle: "策展与导览",
    accent: "#EC4899",
    layerId: "curation-layer",
    description: "把 AI 用作策展、导览或观展路线生成工具。",
    keywords: ["策展", "导览", "展览", "共创展", "注释", "艺术展", "展陈", "curation"]
  },
  {
    id: "tool-interaction",
    title: "Realtime Interaction",
    subtitle: "观众参与",
    accent: "#3B82F6",
    layerId: "audience-loop",
    description: "实时问答、观众选择、路径触发和参与式机制。",
    keywords: ["互动", "问答", "参与式", "路径", "选择", "实时答疑", "观众", "interactive", "参与"]
  },
  {
    id: "tool-data",
    title: "Data / Prediction",
    subtitle: "数据伦理",
    accent: "#64748B",
    layerId: "ops-feedback",
    description: "数据建模、算法决策、预测和风险提示。",
    keywords: ["数据", "算法", "prediction", "ethical", "伦理", "评分", "黑箱", "decision", "risk"]
  }
];

const GRAPH_LAYER_POINTS = [
  { x: -170, y: -112, z: 100 },
  { x: 0, y: -148, z: 164 },
  { x: 174, y: -96, z: 88 },
  { x: 192, y: 92, z: -62 },
  { x: -8, y: 172, z: -152 },
  { x: -196, y: 84, z: -80 }
];

const graphRuntime = {
  rotationX: -0.32,
  rotationY: 0.78,
  dragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0,
  frameId: 0,
  needsRender: true,
  sceneKey: "",
  scene: null,
  suppressClick: false
};

function markGraphDirty() {
  graphRuntime.needsRender = true;
}

function toCaseNodeId(value) {
  return `case-${value}`;
}

function truncateGraphLabel(value, maxLength = 22) {
  const text = String(value ?? "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildGraphSceneKey(cases) {
  return cases.map((item) => `${item.id}:${item.startDate}:${item.aiMode}`).join("|");
}

function generateSpherePositions(total, radius, options = {}) {
  const { yScale = 0.88, rotationOffset = 0, xBias = 0, zBias = 0 } = options;

  if (!total) {
    return [];
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: total }, (_, index) => {
    const progress = total === 1 ? 0.5 : index / (total - 1);
    const vertical = 1 - progress * 2;
    const radial = Math.sqrt(Math.max(0, 1 - vertical * vertical));
    const theta = goldenAngle * index + rotationOffset;

    return {
      x: Math.cos(theta) * radial * radius + xBias,
      y: vertical * radius * yScale,
      z: Math.sin(theta) * radial * radius + zBias
    };
  });
}

function rotateGraphPoint(point, rotationX, rotationY) {
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const rotatedX = point.x * cosY + point.z * sinY;
  const rotatedZ = point.z * cosY - point.x * sinY;
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);

  return {
    x: rotatedX,
    y: point.y * cosX - rotatedZ * sinX,
    z: point.y * sinX + rotatedZ * cosX
  };
}

function projectGraphPoint(point, options = {}) {
  const width = options.width ?? 760;
  const height = options.height ?? 460;
  const perspective = options.perspective ?? 920;
  const projectedScale = perspective / (perspective - point.z);

  return {
    x: width / 2 + point.x * projectedScale,
    y: height / 2 + point.y * projectedScale,
    scale: projectedScale,
    depth: point.z
  };
}

function buildGraphLinkPath(fromPoint, toPoint) {
  const fromX = fromPoint.projectedX ?? fromPoint.x ?? 0;
  const fromY = fromPoint.projectedY ?? fromPoint.y ?? 0;
  const toX = toPoint.projectedX ?? toPoint.x ?? 0;
  const toY = toPoint.projectedY ?? toPoint.y ?? 0;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curve = Math.min(82, distance * 0.18);
  const controlX = (fromX + toX) / 2;
  const controlY = (fromY + toY) / 2 - curve;
  return `M ${fromX.toFixed(1)} ${fromY.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${toX.toFixed(1)} ${toY.toFixed(1)}`;
}

function deriveToolIdsFromCase(item) {
  const haystack = [item.title, item.aiMode, item.summary, item.format, item.category].join(" ").toLowerCase();
  const matched = GRAPH_TOOL_LIBRARY.filter((tool) => tool.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))).map((tool) => tool.id);

  if (!matched.length) {
    if (String(item.category).includes("展")) {
      matched.push("tool-curation", "tool-aigc-visual");
    } else if (String(item.category).includes("沉浸")) {
      matched.push("tool-xr", "tool-interaction");
    } else if (String(item.category).includes("音乐")) {
      matched.push("tool-music", "tool-aigc-visual");
    } else {
      matched.push("tool-llm", "tool-voice");
    }
  }

  return Array.from(new Set(matched));
}

function buildGraphScene() {
  const cases = getTimelineCases();
  const sceneKey = buildGraphSceneKey(cases);

  if (graphRuntime.sceneKey === sceneKey && graphRuntime.scene) {
    return graphRuntime.scene;
  }

  const scene = {
    nodes: [],
    links: [],
    lookup: {},
    caseLookup: {}
  };

  function registerNode(node) {
    scene.nodes.push(node);
    scene.lookup[node.id] = node;
    if (node.type === "case") {
      scene.caseLookup[node.caseItem.id] = node;
    }
    return node;
  }

  const coreNode = registerNode({
    id: "core",
    type: "core",
    title: "AI x Stage",
    subtitle: "工具 / 方法 / 案例",
    accent: "#326BFF",
    point: { x: 0, y: 0, z: 0 },
    description: "从 AI 工具到介入方式，再到真实案例，这个图谱把不同层级放到同一颗可旋转的 3D 关系球里。",
    value: `当前已挂入 ${cases.length} 条案例。`,
    tension: "技术能力越多，现场语言也越容易被拆成多个相互竞争的系统。",
    caseIds: cases.map((item) => item.id),
    toolIds: GRAPH_TOOL_LIBRARY.map((item) => item.id),
    layerIds: GRAPH_LAYER_LIBRARY.map((item) => item.id),
    connectedIds: new Set()
  });

  GRAPH_LAYER_LIBRARY.forEach((layer, index) => {
    const point = GRAPH_LAYER_POINTS[index] ?? { x: 0, y: 0, z: 0 };
    registerNode({
      ...layer,
      type: "layer",
      point,
      toolIds: [],
      caseIds: [],
      connectedIds: new Set(["core"])
    });
    coreNode.connectedIds.add(layer.id);
    scene.links.push({ source: "core", target: layer.id });
  });

  generateSpherePositions(GRAPH_TOOL_LIBRARY.length, 246, { yScale: 0.74, rotationOffset: 0.42 }).forEach((point, index) => {
    const tool = GRAPH_TOOL_LIBRARY[index];
    registerNode({
      ...tool,
      type: "tool",
      point,
      caseIds: [],
      connectedIds: new Set([tool.layerId])
    });
    const layerNode = scene.lookup[tool.layerId];
    layerNode.toolIds.push(tool.id);
    layerNode.connectedIds.add(tool.id);
    scene.links.push({ source: tool.id, target: tool.layerId });
  });

  const chinaCases = cases.filter((item) => item.market === "中国");
  const globalCases = cases.filter((item) => item.market !== "中国");
  const chinaPoints = generateSpherePositions(chinaCases.length, 352, { yScale: 0.92, rotationOffset: 0.18, xBias: -84 });
  const globalPoints = generateSpherePositions(globalCases.length, 352, { yScale: 0.92, rotationOffset: 1.48, xBias: 84 });

  function registerCaseNodes(items, points, accent) {
    items.forEach((item, index) => {
      const toolIds = deriveToolIdsFromCase(item);
      registerNode({
        id: toCaseNodeId(item.id),
        type: "case",
        title: item.title,
        subtitle: `${item.market ?? (item.country === "中国" ? "中国" : "海外")} · ${item.startDate}`,
        accent,
        point: points[index] ?? { x: 0, y: 0, z: 0 },
        caseItem: item,
        toolIds,
        connectedIds: new Set(toolIds)
      });

      coreNode.connectedIds.add(toCaseNodeId(item.id));

      toolIds.forEach((toolId) => {
        const toolNode = scene.lookup[toolId];
        if (!toolNode) {
          return;
        }

        toolNode.caseIds.push(item.id);
        toolNode.connectedIds.add(toCaseNodeId(item.id));

        const layerNode = scene.lookup[toolNode.layerId];
        if (layerNode) {
          layerNode.caseIds.push(item.id);
          layerNode.connectedIds.add(toCaseNodeId(item.id));
        }

        scene.links.push({ source: toCaseNodeId(item.id), target: toolId });
      });
    });
  }

  registerCaseNodes(chinaCases, chinaPoints, "#326BFF");
  registerCaseNodes(globalCases, globalPoints, "#F97316");

  scene.defaultActiveId = scene.lookup[state.activeNodeId] ? state.activeNodeId : "script-engine";
  graphRuntime.scene = scene;
  graphRuntime.sceneKey = sceneKey;
  return scene;
}

function collectGraphHighlightIds(scene, activeNode) {
  const highlighted = new Set([activeNode.id]);
  activeNode.connectedIds?.forEach((id) => highlighted.add(id));

  if (activeNode.type === "layer") {
    activeNode.toolIds?.forEach((toolId) => {
      highlighted.add(toolId);
      const toolNode = scene.lookup[toolId];
      toolNode?.caseIds?.forEach((caseId) => highlighted.add(toCaseNodeId(caseId)));
    });
  }

  if (activeNode.type === "tool") {
    activeNode.caseIds?.forEach((caseId) => highlighted.add(toCaseNodeId(caseId)));
    if (activeNode.layerId) {
      highlighted.add(activeNode.layerId);
    }
  }

  if (activeNode.type === "case") {
    activeNode.toolIds?.forEach((toolId) => {
      highlighted.add(toolId);
      const toolNode = scene.lookup[toolId];
      if (toolNode?.layerId) {
        highlighted.add(toolNode.layerId);
      }
    });
  }

  if (activeNode.type === "core") {
    GRAPH_LAYER_LIBRARY.forEach((layer) => highlighted.add(layer.id));
  }

  return highlighted;
}

function getRelatedCaseEntries(scene, activeNode) {
  if (activeNode.type === "case") {
    return [activeNode.caseItem];
  }

  if (activeNode.type === "tool") {
    return activeNode.caseIds.map((caseId) => scene.caseLookup[caseId]?.caseItem).filter(Boolean);
  }

  if (activeNode.type === "layer") {
    return Array.from(new Set(activeNode.caseIds)).map((caseId) => scene.caseLookup[caseId]?.caseItem).filter(Boolean);
  }

  return getTimelineCases();
}

function getRelatedToolEntries(scene, activeNode) {
  if (activeNode.type === "case") {
    return activeNode.toolIds.map((toolId) => scene.lookup[toolId]).filter(Boolean);
  }

  if (activeNode.type === "layer") {
    return activeNode.toolIds.map((toolId) => scene.lookup[toolId]).filter(Boolean);
  }

  if (activeNode.type === "tool") {
    return [activeNode];
  }

  return GRAPH_TOOL_LIBRARY.map((tool) => scene.lookup[tool.id]).filter(Boolean);
}

function renderGraphRelatedCases(scene, activeNode, limit = 6) {
  const relatedCases = getRelatedCaseEntries(scene, activeNode);

  if (!relatedCases.length) {
    return `<div class="empty-state">当前节点还没有挂接案例。</div>`;
  }

  return `
    <div class="graph-related-list">
      ${relatedCases
        .slice(0, limit)
        .map(
          (item) => `
            <button class="graph-related-item" data-node-id="${escapeHtml(toCaseNodeId(item.id))}">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.startDate)} · ${escapeHtml(item.country)} · ${escapeHtml(item.category)}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderGraphRelatedTools(scene, activeNode) {
  const relatedTools = getRelatedToolEntries(scene, activeNode);

  if (!relatedTools.length) {
    return `<div class="empty-state">当前节点还没有识别到工具连接。</div>`;
  }

  return `
    <div class="stack-row">
      ${relatedTools
        .slice(0, 8)
        .map((tool) => `<button class="stack-pill graph-chip-button" data-node-id="${escapeHtml(tool.id)}">${escapeHtml(tool.title)}</button>`)
        .join("")}
    </div>
  `;
}

function renderGraphDetail(scene, activeNode) {
  if (activeNode.type === "case") {
    const item = activeNode.caseItem;

    return `
      <p class="eyebrow">Case Node</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="detail-copy">${escapeHtml(item.summary)}</p>
      <div class="detail-grid">
        <article class="detail-card">
          <span>时间</span>
          <strong>${escapeHtml(formatDateRange(item.startDate, item.endDate))}</strong>
        </article>
        <article class="detail-card">
          <span>地点</span>
          <strong>${escapeHtml(item.city)} · ${escapeHtml(item.venue)}</strong>
        </article>
        <article class="detail-card">
          <span>AI 介入</span>
          <strong>${escapeHtml(item.aiInvolvement)}</strong>
        </article>
      </div>
      <div class="formula-card">
        <p class="eyebrow">AI Mode</p>
        <p class="download-note">${escapeHtml(item.aiMode)}</p>
      </div>
      <p class="eyebrow">Related Tools</p>
      ${renderGraphRelatedTools(scene, activeNode)}
      <p class="eyebrow">Sources</p>
      <div class="case-source-list">
        ${getCaseSources(item)
          .slice(0, 4)
          .map(
            (source) =>
              `<a class="case-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`
          )
          .join("")}
      </div>
    `;
  }

  const relatedCases = getRelatedCaseEntries(scene, activeNode);

  return `
    <p class="eyebrow">${escapeHtml(activeNode.type === "tool" ? "Tool Node" : activeNode.type === "layer" ? "Layer Node" : "3D Overview")}</p>
    <h3>${escapeHtml(activeNode.title)}</h3>
    <p class="detail-copy">${escapeHtml(activeNode.description)}</p>
    <div class="detail-grid">
      <article class="detail-card">
        <span>所在层</span>
        <strong>${escapeHtml(activeNode.subtitle)}</strong>
      </article>
      <article class="detail-card">
        <span>覆盖案例</span>
        <strong>${escapeHtml(relatedCases.length)}</strong>
      </article>
      <article class="detail-card">
        <span>关键张力</span>
        <strong>${escapeHtml(activeNode.tension)}</strong>
      </article>
    </div>
    <div class="formula-card">
      <p class="eyebrow">Value</p>
      <p class="download-note">${escapeHtml(activeNode.value)}</p>
    </div>
    <p class="eyebrow">Connected Cases</p>
    ${renderGraphRelatedCases(scene, activeNode)}
  `;
}

function renderGraph() {
  const scene = buildGraphScene();

  if (!scene.nodes.length) {
    elements.relationshipGraph.innerHTML = "";
    elements.graphDetail.innerHTML = `<div class="empty-state">图谱数据暂不可用。</div>`;
    graphRuntime.needsRender = false;
    return;
  }

  if (!scene.lookup[state.activeNodeId]) {
    state.activeNodeId = scene.defaultActiveId;
  }

  const activeNode = scene.lookup[state.activeNodeId] ?? scene.lookup[scene.defaultActiveId];
  const highlightedIds = collectGraphHighlightIds(scene, activeNode);
  const projectedNodes = scene.nodes
    .map((node) => {
      const rotated = rotateGraphPoint(node.point, graphRuntime.rotationX, graphRuntime.rotationY);
      const projected = projectGraphPoint(rotated);
      const radius = node.type === "case" ? 14 : node.type === "tool" ? 20 : node.type === "core" ? 46 : 30;

      return {
        ...node,
        projectedX: projected.x,
        projectedY: projected.y,
        projectedScale: projected.scale,
        projectedDepth: projected.depth,
        projectedRadius: radius * projected.scale
      };
    })
    .sort((left, right) => left.projectedDepth - right.projectedDepth);

  const nodeLookup = Object.fromEntries(projectedNodes.map((node) => [node.id, node]));

  const linkMarkup = scene.links
    .map((link) => {
      const fromNode = nodeLookup[link.source];
      const toNode = nodeLookup[link.target];

      if (!fromNode || !toNode) {
        return "";
      }

      const avgDepth = (fromNode.projectedDepth + toNode.projectedDepth) / 2;
      const opacity = Math.min(0.58, Math.max(0.08, 0.14 + (avgDepth + 420) / 980));
      const isHighlighted = highlightedIds.has(link.source) && highlightedIds.has(link.target);
      const isActiveLink = link.source === activeNode.id || link.target === activeNode.id;

      return `
        <path
          class="graph-link${isHighlighted ? " connected" : ""}${isActiveLink ? " active" : ""}"
          d="${buildGraphLinkPath(fromNode, toNode)}"
          style="opacity:${opacity.toFixed(3)}"
        ></path>
      `;
    })
    .join("");

  const nodeMarkup = projectedNodes
    .map((node) => {
      const isActive = node.id === activeNode.id;
      const isConnected = highlightedIds.has(node.id) && !isActive;
      const labelVisible = node.type !== "case" || isActive || isConnected || node.projectedScale > 1.05;
      const haloRadius = node.projectedRadius * (isActive ? 1.62 : 1.28);
      const innerRadius = Math.max(8, node.projectedRadius * (node.type === "case" ? 0.56 : 0.62));
      const subtitleY = node.projectedY + Math.min(24, node.projectedRadius * 0.48);
      const titleY = node.projectedY - Math.min(6, node.projectedRadius * 0.1);
      const opacity = Math.min(1, Math.max(0.2, 0.28 + (node.projectedDepth + 460) / 920));

      return `
        <g
          class="graph-node"
          data-node-id="${escapeHtml(node.id)}"
          data-type="${escapeHtml(node.type)}"
          data-active="${String(isActive)}"
          data-connected="${String(isConnected)}"
          style="opacity:${opacity.toFixed(3)}"
        >
          <title>${escapeHtml(node.title)}</title>
          <circle class="halo" cx="${node.projectedX.toFixed(1)}" cy="${node.projectedY.toFixed(1)}" r="${haloRadius.toFixed(1)}" style="fill:${node.accent}22"></circle>
          <circle class="outer" cx="${node.projectedX.toFixed(1)}" cy="${node.projectedY.toFixed(1)}" r="${node.projectedRadius.toFixed(1)}" style="fill:${node.accent}18;stroke:${node.accent}"></circle>
          <circle class="inner" cx="${node.projectedX.toFixed(1)}" cy="${node.projectedY.toFixed(1)}" r="${innerRadius.toFixed(1)}" style="fill:white"></circle>
          ${
            labelVisible
              ? `<text class="node-title" x="${node.projectedX.toFixed(1)}" y="${titleY.toFixed(1)}">${escapeHtml(
                  truncateGraphLabel(node.title, node.type === "case" ? 18 : 22)
                )}</text>`
              : ""
          }
          ${
            labelVisible
              ? `<text class="node-subtitle" x="${node.projectedX.toFixed(1)}" y="${subtitleY.toFixed(1)}">${escapeHtml(
                  truncateGraphLabel(node.subtitle, 20)
                )}</text>`
              : ""
          }
        </g>
      `;
    })
    .join("");

  elements.relationshipGraph.dataset.dragging = String(graphRuntime.dragging);
  elements.relationshipGraph.innerHTML = `
    <defs>
      <radialGradient id="coreGlow3d" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="rgba(255,255,255,1)"></stop>
        <stop offset="40%" stop-color="rgba(50,107,255,0.88)"></stop>
        <stop offset="100%" stop-color="rgba(50,107,255,0.06)"></stop>
      </radialGradient>
    </defs>
    <text x="24" y="34" class="graph-stage-note">Drag to orbit · Click any node to focus · All timeline cases are included</text>
    <ellipse class="graph-core-orbit" cx="380" cy="230" rx="186" ry="76"></ellipse>
    ${linkMarkup}
    ${nodeMarkup}
  `;

  elements.graphDetail.innerHTML = renderGraphDetail(scene, activeNode);
  graphRuntime.needsRender = false;
}

function tickGraph() {
  if (!graphRuntime.dragging && document.visibilityState === "visible") {
    graphRuntime.rotationY += 0.0024;
    markGraphDirty();
  }

  if (graphRuntime.needsRender) {
    renderGraph();
  }

  graphRuntime.frameId = window.requestAnimationFrame(tickGraph);
}

function startGraphAnimation() {
  if (graphRuntime.frameId) {
    return;
  }

  graphRuntime.frameId = window.requestAnimationFrame(tickGraph);
}

function stopGraphAnimation() {
  if (!graphRuntime.frameId) {
    return;
  }

  window.cancelAnimationFrame(graphRuntime.frameId);
  graphRuntime.frameId = 0;
}

function render() {
  const filteredSignals = getFilteredSignals();
  const selectedSignal = filteredSignals.length ? getSelectedSignal(filteredSignals) : null;

  renderDataMode();
  renderFilters();
  renderHero(filteredSignals);
  renderSpotlight(filteredSignals);
  renderTimeline();
  renderSignalList(filteredSignals);
  renderInspector(selectedSignal);
  renderLiveFeed(filteredSignals);
  renderSourcePanel();
  renderGraph();

  if (selectedSignal && canUseApi()) {
    void loadSignalStorage(selectedSignal.id);
  }
}

async function loadSignalStorage(signalId) {
  if (!canUseApi() || !signalId) {
    return;
  }

  const current = getSignalStorageState(signalId);
  if (current.status === "loading" || current.status === "loaded" || current.status === "empty") {
    return;
  }

  state.signalStorageById[signalId] = {
    status: "loading",
    data: current.data ?? null,
    error: ""
  };

  if (state.selectedSignalId === signalId) {
    renderInspector(getSelectedSignal(getFilteredSignals()));
  }

  try {
    const response = await fetch(`/api/signals/${encodeURIComponent(signalId)}/storage`, {
      headers: { Accept: "application/json" }
    });

    if (response.status === 404) {
      state.signalStorageById[signalId] = {
        status: "empty",
        data: null,
        error: "当前作品还没有本地原文评论。"
      };
    } else if (!response.ok) {
      throw new Error(`Storage request failed with ${response.status}`);
    } else {
      const payload = await response.json();
      const storedReviewCount = Number(payload.storage?.storedReviewCount ?? 0);
      state.signalStorageById[signalId] = {
        status: storedReviewCount > 0 ? "loaded" : "empty",
        data: payload.storage ?? null,
        error: storedReviewCount > 0 ? "" : "当前作品还没有本地原文评论。"
      };
    }
  } catch (error) {
    state.signalStorageById[signalId] = {
      status: "error",
      data: null,
      error: error instanceof Error ? error.message : "读取评论存储失败。"
    };
  }

  if (state.selectedSignalId === signalId) {
    renderInspector(getSelectedSignal(getFilteredSignals()));
  }
}

function triggerDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 2000);
}

async function handleCommentDownload(signalId, format) {
  if (!canUseApi() || !signalId) {
    return;
  }

  state.downloadPending = `${signalId}:${format}`;
  state.downloadMessageById[signalId] = format === "csv" ? "正在导出评论 CSV…" : "正在导出原始 JSON…";
  renderInspector(getSelectedSignal(getFilteredSignals()));

  try {
    const response = await fetch(`/api/signals/${encodeURIComponent(signalId)}/comments/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || `Export request failed with ${response.status}`);
    }

    const fileNameHeader = response.headers.get("Content-Disposition") ?? "";
    const fileNameMatch = fileNameHeader.match(/filename="([^"]+)"/i);
    const fallbackName = `${signalId}.${format === "json" ? "json" : "csv"}`;
    const fileName = decodeURIComponent(fileNameMatch?.[1] ?? fallbackName);
    const blob = await response.blob();
    triggerDownload(blob, fileName);
    state.downloadMessageById[signalId] = `已下载 ${fileName}`;
  } catch (error) {
    state.downloadMessageById[signalId] = error instanceof Error ? error.message : "评论导出失败。";
  } finally {
    state.downloadPending = "";
    renderInspector(getSelectedSignal(getFilteredSignals()));
  }
}

async function handleSourceAction(sourceId, mode) {
  if (!canUseApi()) {
    return;
  }

  state.sourceActionPending = `${sourceId}:${mode}`;
  state.sourceActionMessage = `正在运行 ${sourceId} 的 ${mode} 采集…`;
  renderSourcePanel();

  try {
    const response = await fetch("/api/sources/collect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        sourceId,
        mode,
        persist: true,
        limit: mode === "sample" ? 2 : 5
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `Failed to run ${sourceId}`);
    }

    const warningText = payload.warnings?.length ? ` 警告: ${payload.warnings.join(" | ")}` : "";
    state.sourceActionMessage = `${sourceId} 已完成 ${mode} 采集，新增 ${payload.persistence?.inserted ?? 0} 条评论。${warningText}`;
    await refreshData();
  } catch (error) {
    state.sourceActionMessage = error instanceof Error ? error.message : `运行 ${sourceId} 失败。`;
    renderSourcePanel();
  } finally {
    state.sourceActionPending = "";
    renderSourcePanel();
  }
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  elements.categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) {
      return;
    }
    state.category = button.dataset.category;
    render();
  });

  elements.regionFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region]");
    if (!button) {
      return;
    }
    state.region = button.dataset.region;
    render();
  });

  elements.timelineYearFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timeline-year]");
    if (!button) {
      return;
    }
    state.timelineYear = button.dataset.timelineYear;
    renderTimeline();
  });

  elements.timelineMarketFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timeline-market]");
    if (!button) {
      return;
    }
    state.timelineMarket = button.dataset.timelineMarket;
    renderTimeline();
  });

  elements.relationshipGraph.addEventListener("pointerdown", (event) => {
    graphRuntime.dragging = true;
    graphRuntime.dragMoved = false;
    graphRuntime.lastX = event.clientX;
    graphRuntime.lastY = event.clientY;
    elements.relationshipGraph.dataset.dragging = "true";
  });

  window.addEventListener("pointermove", (event) => {
    if (!graphRuntime.dragging) {
      return;
    }

    const deltaX = event.clientX - graphRuntime.lastX;
    const deltaY = event.clientY - graphRuntime.lastY;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) {
      graphRuntime.dragMoved = true;
      graphRuntime.suppressClick = true;
    }

    graphRuntime.rotationY += deltaX * 0.008;
    graphRuntime.rotationX = Math.min(1.15, Math.max(-1.15, graphRuntime.rotationX + deltaY * 0.006));
    graphRuntime.lastX = event.clientX;
    graphRuntime.lastY = event.clientY;
    markGraphDirty();
  });

  const finishGraphDrag = () => {
    if (!graphRuntime.dragging) {
      return;
    }

    graphRuntime.dragging = false;
    elements.relationshipGraph.dataset.dragging = "false";
    window.setTimeout(() => {
      graphRuntime.suppressClick = false;
    }, 0);
  };

  window.addEventListener("pointerup", finishGraphDrag);
  window.addEventListener("pointercancel", finishGraphDrag);

  document.body.addEventListener("click", (event) => {
    const signalButton = event.target.closest("[data-signal-id]");
    if (signalButton) {
      state.selectedSignalId = signalButton.dataset.signalId;
      render();
      return;
    }

    const feedItem = event.target.closest("[data-feed-signal-id]");
    if (feedItem) {
      state.selectedSignalId = feedItem.dataset.feedSignalId;
      render();
      return;
    }

    const sourceButton = event.target.closest("[data-source-action]");
    if (sourceButton) {
      void handleSourceAction(sourceButton.dataset.sourceId, sourceButton.dataset.sourceAction);
      return;
    }

    const downloadButton = event.target.closest("[data-download-format]");
    if (downloadButton) {
      void handleCommentDownload(downloadButton.dataset.downloadSignalId, downloadButton.dataset.downloadFormat);
      return;
    }

    const node = event.target.closest("[data-node-id]");
    if (node) {
      if (graphRuntime.suppressClick) {
        return;
      }
      state.activeNodeId = node.dataset.nodeId;
      markGraphDirty();
      renderGraph();
    }
  });
}

async function refreshData() {
  state.data = await loadBootstrapData();
  state.signalStorageById = {};
  graphRuntime.scene = null;
  graphRuntime.sceneKey = "";
  markGraphDirty();
  if (!state.selectedSignalId || !getSignals().some((item) => item.id === state.selectedSignalId)) {
    state.selectedSignalId = getSignals()[0]?.id ?? null;
  }
  render();
}

function stopBackgroundWork() {
  if (liveFeedTimer) {
    window.clearInterval(liveFeedTimer);
    liveFeedTimer = null;
  }

  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function startBackgroundWork() {
  stopBackgroundWork();

  liveFeedTimer = window.setInterval(() => {
    const pool = getMentions();
    if (!pool.length) {
      return;
    }
    state.liveOffset = (state.liveOffset + 1) % pool.length;
    renderLiveFeed(getFilteredSignals());
  }, 4000);

  if (canUseApi()) {
    refreshTimer = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void refreshData();
    }, 30000);
  }
}

async function init() {
  bindEvents();
  await refreshData();
  startBackgroundWork();
  startGraphAnimation();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshData();
      startBackgroundWork();
      startGraphAnimation();
      return;
    }
    stopBackgroundWork();
    stopGraphAnimation();
  });

  window.addEventListener("pagehide", () => {
    stopBackgroundWork();
    stopGraphAnimation();
  });
}

void init();
