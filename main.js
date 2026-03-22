import { graphLinks, graphNodes, mentions, performances } from "./demo-data.js";
import { FILTER_ALL, buildOverview, computePulseScore, getScoreTone } from "./shared/scoring.js";

const elements = {
  heroMetrics: document.querySelector("#heroMetrics"),
  spotlightPanel: document.querySelector("#spotlightPanel"),
  categoryFilters: document.querySelector("#categoryFilters"),
  regionFilters: document.querySelector("#regionFilters"),
  searchInput: document.querySelector("#searchInput"),
  signalList: document.querySelector("#signalList"),
  resultCount: document.querySelector("#resultCount"),
  inspectorPanel: document.querySelector("#inspectorPanel"),
  liveFeed: document.querySelector("#liveFeed"),
  relationshipGraph: document.querySelector("#relationshipGraph"),
  graphDetail: document.querySelector("#graphDetail"),
  scorePanel: document.querySelector("#scorePanel"),
  sourcePanel: document.querySelector("#sourcePanel"),
  dataMode: document.querySelector("#dataMode")
};

const numberFormatter = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

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
    graph: {
      nodes: graphNodes,
      links: graphLinks
    },
    sources: [],
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
  search: "",
  selectedSignalId: null,
  activeNodeId: "audience-loop",
  liveOffset: 0,
  dataMode: "演示数据",
  sourceActionMessage: "",
  sourceActionPending: "",
  data: createFallbackPayload()
};

function canUseApi() {
  return window.location.protocol !== "file:";
}

async function loadBootstrapData() {
  if (!canUseApi()) {
    state.dataMode = "演示数据";
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
    state.dataMode = "API 模式";
    return {
      ...createFallbackPayload(),
      ...payload,
      signals: enrichSignals(payload.signals ?? []),
      mentions: payload.mentions ?? mentions,
      graph: {
        nodes: payload.graph?.nodes ?? graphNodes,
        links: payload.graph?.links ?? graphLinks
      },
      sourceStatus: payload.sourceStatus ?? createFallbackPayload().sourceStatus
    };
  } catch {
    state.dataMode = "演示数据";
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

function formatAgo(minutes) {
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }
  return `${Math.floor(minutes / 60)} 小时前`;
}

function sparklinePath(values, width = 320, height = 96) {
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
  return [FILTER_ALL, ...new Set(getSignals().map((item) => item.category))];
}

function getRegions() {
  return [FILTER_ALL, ...new Set(getSignals().map((item) => item.region))];
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

function renderDataMode() {
  elements.dataMode.textContent = state.dataMode;
}

function renderFilters() {
  elements.categoryFilters.innerHTML = getCategories()
    .map(
      (category) => `
        <button class="filter-chip" data-category="${category}" data-active="${String(category === state.category)}">
          ${category}
        </button>
      `
    )
    .join("");

  elements.regionFilters.innerHTML = getRegions()
    .map(
      (region) => `
        <button class="filter-chip" data-region="${region}" data-active="${String(region === state.region)}">
          ${region}
        </button>
      `
    )
    .join("");
}

function renderHero(filteredSignals) {
  const overview = buildOverview(filteredSignals);

  elements.heroMetrics.innerHTML = [
    { label: "纳入演出", value: `${overview.signalCount}`, meta: "按作品级别聚合" },
    { label: "评价总量", value: numberFormatter.format(overview.reviewTotal), meta: "全网多语种评论" },
    { label: "平均 AI 介入", value: `${overview.averageAiInvolvement}`, meta: "0 - 100" },
    { label: "综合脉冲分", value: `${overview.averagePulseScore}`, meta: `${overview.sourceTotal} 个来源平台` }
  ]
    .map(
      (metric) => `
        <article class="metric-card">
          <span class="metric-card-label">${metric.label}</span>
          <span class="metric-card-value">${metric.value}</span>
          <span class="metric-card-meta">${metric.meta}</span>
        </article>
      `
    )
    .join("");
}

function renderSpotlight(filteredSignals) {
  if (!filteredSignals.length) {
    elements.spotlightPanel.innerHTML = `<div class="empty-state">当前筛选下没有可展示的重点信号。</div>`;
    return;
  }

  const ranked = [...filteredSignals].sort((left, right) => right.pulseScore - left.pulseScore);
  const featured = ranked[0];
  const others = ranked.slice(1, 4);

  elements.spotlightPanel.innerHTML = `
    <div class="spotlight-card">
      <div class="spotlight-main">
        <div class="score-ring" style="--score-angle:${featured.pulseScore * 3.6}deg;">
          <div>
            <strong>${featured.pulseScore}</strong>
            <span>Pulse Score</span>
          </div>
        </div>
        <div class="spotlight-main-meta">
          <h4>${featured.title}</h4>
          <p class="meta-line">
            <span>${featured.category}</span>
            <span>${featured.city} · ${featured.country}</span>
            <span>${formatAgo(featured.updatedMinutesAgo)}</span>
          </p>
          <p class="signal-desc">${featured.highlight}</p>
          <div class="tag-row">
            ${(featured.stack ?? []).slice(0, 4).map((item) => `<span class="tag">${item}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="mini-grid">
        ${others
          .map(
            (item) => `
              <article class="mini-metric">
                <span class="mini-metric-label">${item.title}</span>
                <span class="mini-metric-value">${item.pulseScore}</span>
                <span class="metric-card-meta">${item.city} · AI ${item.aiInvolvement}</span>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderSignalList(filteredSignals) {
  elements.resultCount.textContent = `${filteredSignals.length} 条结果`;

  if (!filteredSignals.length) {
    elements.signalList.innerHTML = `
      <div class="empty-state">
        当前筛选条件下还没有命中信号。<br />
        你可以换一个地区、类别或更宽的关键词继续查看。
      </div>
    `;
    return;
  }

  elements.signalList.innerHTML = filteredSignals
    .map((item) => `
      <article class="signal-card" data-signal-id="${item.id}" data-active="${String(item.id === state.selectedSignalId)}">
        <div class="signal-topline">
          <div>
            <h4 class="signal-title">${item.title}</h4>
            <p class="signal-kicker">${item.category} · ${item.city}, ${item.country} · ${item.venue}</p>
          </div>
          <div class="signal-score">
            <strong>${item.pulseScore}</strong>
            <span>Pulse Score</span>
          </div>
        </div>

        <p class="signal-desc">${item.highlight}</p>

        <div class="signal-bars">
          ${[
            ["观众评价", item.audienceSentiment],
            ["AI 介入", item.aiInvolvement],
            ["融合完成度", item.integrationQuality]
          ]
            .map(
              ([label, value]) => `
                <div class="metric-bar">
                  <div class="metric-bar-top">
                    <span>${label}</span>
                    <span>${value}</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" style="width:${value}%"></div>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>

        <div class="signal-footer">
          <div class="signal-stack">
            ${(item.stack ?? []).slice(0, 3).map((stack) => `<span class="stack-pill">${stack}</span>`).join("")}
          </div>
          <span class="tone-pill ${item.scoreTone.className}">${item.scoreTone.label}</span>
        </div>
      </article>
    `)
    .join("");
}

function renderInspector(selectedSignal) {
  if (!selectedSignal) {
    elements.inspectorPanel.innerHTML = `<div class="empty-state">没有可展示的作品信号。</div>`;
    elements.scorePanel.innerHTML = `<div class="empty-state">没有可展示的评分引擎示例。</div>`;
    return;
  }

  elements.inspectorPanel.innerHTML = `
    <div class="inspector-header">
      <p class="eyebrow">Signal Inspector</p>
      <h3>${selectedSignal.title}</h3>
      <p class="meta-line">
        <strong>${selectedSignal.category}</strong>
        <span>${selectedSignal.city} · ${selectedSignal.country}</span>
        <span>${selectedSignal.reviewCount} 条评价</span>
        <span>${formatAgo(selectedSignal.updatedMinutesAgo)}</span>
      </p>
    </div>

    <div class="inspector-main">
      <div class="score-ring" style="--score-angle:${selectedSignal.pulseScore * 3.6}deg;">
        <div>
          <strong>${selectedSignal.pulseScore}</strong>
          <span>${selectedSignal.scoreTone.label}</span>
        </div>
      </div>
      <div class="inspector-rail">
        ${[
          ["观众评价", selectedSignal.audienceSentiment],
          ["AI 介入程度", selectedSignal.aiInvolvement],
          ["融合完成度", selectedSignal.integrationQuality],
          ["争议压力", selectedSignal.controversy]
        ]
          .map(
            ([label, value]) => `
              <div class="metric-bar">
                <div class="metric-bar-top">
                  <span>${label}</span>
                  <span>${value}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width:${value}%"></div>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>

    <div class="inspector-quote">${selectedSignal.quote}</div>

    <div class="sparkline-card">
      <div class="sparkline-label">
        <span>近 8 个时间片的讨论热度变化</span>
        <span>${(selectedSignal.sources ?? []).join(" · ")}</span>
      </div>
      <svg viewBox="0 0 320 96" aria-hidden="true">
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#61dcff"></stop>
            <stop offset="100%" stop-color="#ffb56c"></stop>
          </linearGradient>
        </defs>
        <path d="${sparklinePath(selectedSignal.trend ?? [])}" fill="none" stroke="url(#sparklineGradient)" stroke-width="4" stroke-linecap="round"></path>
      </svg>
    </div>

    <div class="mix-list">
      ${(selectedSignal.mix ?? [])
        .map(
          (item) => `
            <div class="metric-bar">
              <div class="metric-bar-top">
                <span>${item.label}</span>
                <span>${item.value}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${item.value}%"></div>
              </div>
            </div>
          `
        )
        .join("")}
    </div>

    <div class="tag-row">
      ${(selectedSignal.stack ?? []).map((item) => `<span class="tag">${item}</span>`).join("")}
    </div>
  `;

  elements.scorePanel.innerHTML = `
    <div class="section-header compact">
      <div>
        <p class="eyebrow">Scoring Logic</p>
        <h3>评价 + 程度的统一打分</h3>
      </div>
    </div>
    <h4>${selectedSignal.title}</h4>
    <div class="score-formula">
      Pulse Score = 观众评价 × 60% + AI 介入程度 × 25% + 融合完成度 × 15%
    </div>
    <div class="score-breakdown">
      ${[
        ["观众评价", selectedSignal.audienceSentiment, "60%"],
        ["AI 介入程度", selectedSignal.aiInvolvement, "25%"],
        ["融合完成度", selectedSignal.integrationQuality, "15%"]
      ]
        .map(
          ([label, value, weight]) => `
            <div class="metric-bar">
              <div class="metric-bar-top">
                <span>${label}</span>
                <span>${value} · 权重 ${weight}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${value}%"></div>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
    <p class="score-note">
      当前作品的综合分为 <strong>${selectedSignal.pulseScore}</strong>。这个模型适合前端快速比较，也方便后续升级成更复杂的版本，例如加入来源可信度、
      评论去重质量、负面事件惩罚项或不同国家市场的校准因子。
    </p>
  `;
}

function renderLiveFeed(filteredSignals) {
  const visibleMentions = getVisibleMentions(filteredSignals);
  if (!visibleMentions.length) {
    elements.liveFeed.innerHTML = `<div class="empty-state">等待更多观众评论进入实时流。</div>`;
    return;
  }

  elements.liveFeed.innerHTML = visibleMentions
    .map((item, index) => {
      const signal = getSignals().find((entry) => entry.id === item.signalId);
      const toneClass = item.tone === "positive" ? "tone-positive" : item.tone === "mixed" ? "tone-mixed" : "tone-watch";
      return `
        <article class="live-feed-item" data-feed-signal-id="${item.signalId}" data-priority="${String(index === 0)}">
          <div class="feed-topline">
            <span>${signal?.title ?? item.signalId}</span>
            <span class="${toneClass}">${item.source} · ${item.language} · ${formatAgo(item.minutesAgo)}</span>
          </div>
          <p class="feed-snippet">${item.text}</p>
        </article>
      `;
    })
    .join("");
}

function renderSourcePanel() {
  const sourceStatus = getSourceStatus();
  const items = sourceStatus.items ?? [];
  const recentRuns = sourceStatus.recentRuns ?? [];
  const storage = sourceStatus.storage ?? {};
  const readyCount = items.filter((item) => item.supportsLiveMode && item.enabled).length;
  const sampleCount = items.filter((item) => item.supportsSampleMode).length;

  elements.sourcePanel.innerHTML = `
    <div class="section-header compact">
      <div>
        <p class="eyebrow">Source Control</p>
        <h3>采集源状态与运行</h3>
      </div>
      <span class="summary-chip">${storage.storageMode ?? "demo"}</span>
    </div>

    <p class="source-note">
      当前已接入可运行的采集器骨架。媒体源支持真实 RSS / XML 拉取，其他源先保留 sample 模式和凭证占位。
    </p>

    <div class="source-summary">
      <div class="source-summary-card">
        <strong>${items.length}</strong>
        <span>来源适配器总数</span>
      </div>
      <div class="source-summary-card">
        <strong>${readyCount}</strong>
        <span>可直接 live 的来源</span>
      </div>
      <div class="source-summary-card">
        <strong>${sampleCount}</strong>
        <span>可 sample 运行</span>
      </div>
      <div class="source-summary-card">
        <strong>${storage.rawReviewCount ?? 0}</strong>
        <span>已入库存量评论</span>
      </div>
    </div>

    ${state.sourceActionMessage ? `<p class="source-note">${state.sourceActionMessage}</p>` : ""}

    <div class="source-grid">
      ${items.length
        ? items
            .map(
              (item) => `
                <article class="source-card">
                  <div class="source-card-header">
                    <div class="source-card-title">
                      <strong>${item.label}</strong>
                      <span class="source-meta">${item.coverage}</span>
                    </div>
                    <span class="source-badge ${item.status}">${item.status}</span>
                  </div>
                  <p class="source-meta">${item.notes}</p>
                  ${
                    item.missingEnv?.length
                      ? `<p class="source-warning">缺少配置: ${item.missingEnv.join(", ")}</p>`
                      : `<p class="source-warning">配置已就绪，可尝试 live 模式。</p>`
                  }
                  <div class="source-card-actions">
                    <button
                      class="source-button"
                      data-source-action="sample"
                      data-source-id="${item.id}"
                      ${!item.supportsSampleMode || !canUseApi() || state.sourceActionPending ? "disabled" : ""}
                    >
                      运行 sample
                    </button>
                    <button
                      class="source-button primary"
                      data-source-action="live"
                      data-source-id="${item.id}"
                      ${!item.supportsLiveMode || !canUseApi() || state.sourceActionPending ? "disabled" : ""}
                    >
                      运行 live
                    </button>
                  </div>
                </article>
              `
            )
            .join("")
        : `<p class="source-empty">本地静态预览模式下不会展示 API 来源状态。启动服务后这里会显示 live / sample 采集器。</p>`}
    </div>

    <div class="source-run-list">
      <h5>最近运行记录</h5>
      ${
        recentRuns.length
          ? recentRuns
              .slice(0, 4)
              .map(
                (run) => `
                  <div class="source-run-item">
                    <span>${run.source_id} · ${run.mode}</span>
                    <span class="source-badge ${run.status}">${run.status} · ${run.collected_count ?? 0}</span>
                  </div>
                `
              )
              .join("")
          : `<p class="source-empty">还没有采集运行记录。</p>`
      }
    </div>
  `;
}

function renderGraph() {
  const nodes = getGraphNodes();
  const links = getGraphLinks();
  const activeNode = nodes.find((item) => item.id === state.activeNodeId) ?? nodes[0];
  const core = { x: 340, y: 220 };

  if (!activeNode) {
    elements.relationshipGraph.innerHTML = "";
    elements.graphDetail.innerHTML = `<div class="empty-state">关系图谱数据未加载。</div>`;
    return;
  }

  const nodeLookup = Object.fromEntries(nodes.map((item) => [item.id, item]));

  elements.relationshipGraph.innerHTML = `
    <defs>
      <radialGradient id="coreGradient" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.95)"></stop>
        <stop offset="35%" stop-color="#61dcff"></stop>
        <stop offset="100%" stop-color="rgba(97,220,255,0.12)"></stop>
      </radialGradient>
    </defs>
    ${links
      .map(([from, to]) => {
        const fromNode = from === "core" ? core : nodeLookup[from];
        const toNode = to === "core" ? core : nodeLookup[to];
        const isActive = from === state.activeNodeId || to === state.activeNodeId;
        return `
          <path
            class="graph-link ${isActive ? "active" : ""}"
            d="M ${fromNode.x} ${fromNode.y} C ${(fromNode.x + toNode.x) / 2} ${fromNode.y}, ${(fromNode.x + toNode.x) / 2} ${toNode.y}, ${toNode.x} ${toNode.y}"
          ></path>
        `;
      })
      .join("")}
    <circle cx="${core.x}" cy="${core.y}" r="92" class="graph-core-glow"></circle>
    <circle cx="${core.x}" cy="${core.y}" r="66" fill="url(#coreGradient)"></circle>
    <circle cx="${core.x}" cy="${core.y}" r="52" fill="rgba(8,12,20,0.92)" stroke="rgba(255,255,255,0.18)"></circle>
    <text x="${core.x}" y="${core.y - 6}" text-anchor="middle" fill="#f7efe1" font-size="28" font-weight="700">现场戏剧体验</text>
    <text x="${core.x}" y="${core.y + 22}" text-anchor="middle" fill="#9dadc2" font-size="14">Audience / Story / Stage / Memory</text>
    ${nodes
      .map(
        (node) => `
          <g class="graph-node" data-node-id="${node.id}" data-active="${String(node.id === state.activeNodeId)}">
            <circle class="outer" cx="${node.x}" cy="${node.y}" r="${node.radius}" style="stroke:${node.id === state.activeNodeId ? node.accent : "rgba(255,255,255,0.18)"}"></circle>
            <circle class="inner" cx="${node.x}" cy="${node.y}" r="${node.radius - 11}" style="fill:${node.id === state.activeNodeId ? `${node.accent}33` : "rgba(255,255,255,0.03)"}"></circle>
            <text class="node-title" x="${node.x}" y="${node.y - 2}">${node.title}</text>
            <text class="node-subtitle" x="${node.x}" y="${node.y + 18}">${node.subtitle}</text>
          </g>
        `
      )
      .join("")}
  `;

  elements.graphDetail.innerHTML = `
    <p class="eyebrow">Node Detail</p>
    <h4>${activeNode.title}</h4>
    <p class="graph-note">${activeNode.impact}</p>
    <div class="graph-detail-grid">
      <div class="detail-card">
        <span class="detail-card-label">所在阶段</span>
        <span class="detail-card-value">${activeNode.subtitle}</span>
      </div>
      <div class="detail-card">
        <span class="detail-card-label">它解决什么问题</span>
        <span class="detail-card-value">${activeNode.value}</span>
      </div>
      <div class="detail-card">
        <span class="detail-card-label">它带来的紧张关系</span>
        <span class="detail-card-value">${activeNode.tension}</span>
      </div>
    </div>
  `;
}

function render() {
  const filteredSignals = getFilteredSignals();
  const selectedSignal = filteredSignals.length ? getSelectedSignal(filteredSignals) : null;
  renderDataMode();
  renderFilters();
  renderHero(filteredSignals);
  renderSpotlight(filteredSignals);
  renderSignalList(filteredSignals);
  renderInspector(selectedSignal);
  renderLiveFeed(filteredSignals);
  renderSourcePanel();
  renderGraph();
}

async function handleSourceAction(sourceId, mode) {
  if (!canUseApi()) {
    return;
  }

  state.sourceActionPending = `${sourceId}:${mode}`;
  state.sourceActionMessage = `正在运行 ${sourceId} 的 ${mode} 采集...`;
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

  elements.signalList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-signal-id]");
    if (!card) {
      return;
    }
    state.selectedSignalId = card.dataset.signalId;
    render();
  });

  elements.liveFeed.addEventListener("click", (event) => {
    const card = event.target.closest("[data-feed-signal-id]");
    if (!card) {
      return;
    }
    state.selectedSignalId = card.dataset.feedSignalId;
    render();
  });

  elements.relationshipGraph.addEventListener("click", (event) => {
    const node = event.target.closest("[data-node-id]");
    if (!node) {
      return;
    }
    state.activeNodeId = node.dataset.nodeId;
    renderGraph();
  });

  elements.sourcePanel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-source-action]");
    if (!button) {
      return;
    }
    void handleSourceAction(button.dataset.sourceId, button.dataset.sourceAction);
  });
}

async function refreshData() {
  state.data = await loadBootstrapData();
  if (!state.selectedSignalId || !getSignals().some((item) => item.id === state.selectedSignalId)) {
    state.selectedSignalId = getSignals()[0]?.id ?? null;
  }
  render();
}

async function init() {
  bindEvents();
  await refreshData();

  window.setInterval(() => {
    const mentionPool = getMentions();
    if (!mentionPool.length) {
      return;
    }
    state.liveOffset = (state.liveOffset + 1) % mentionPool.length;
    const filteredSignals = getFilteredSignals();
    renderSpotlight(filteredSignals);
    renderLiveFeed(filteredSignals);
  }, 3600);

  if (canUseApi()) {
    window.setInterval(() => {
      void refreshData();
    }, 30000);
  }
}

void init();
