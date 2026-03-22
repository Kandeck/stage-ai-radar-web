const performances = [
  {
    id: "echoes-of-the-ninth-wall",
    title: "Echoes of the Ninth Wall",
    category: "沉浸式戏剧",
    city: "伦敦",
    country: "英国",
    region: "欧洲",
    venue: "Battersea Arts Centre",
    updatedMinutesAgo: 6,
    reviewCount: 4281,
    audienceSentiment: 89,
    aiInvolvement: 82,
    integrationQuality: 84,
    controversy: 31,
    highlight: "观众对实时分支叙事接受度非常高，讨论集中在“AI 是否改变演员控制权”。",
    quote: "像是和一部会呼吸的剧本一起走进舞台，剧情每一次转向都能感觉到机器在听观众。",
    sources: ["Reddit", "Instagram", "The Stage", "X", "Ticketing"],
    languages: ["English", "Spanish"],
    stack: ["LLM 分支剧作", "实时字幕", "生成式投影", "观众路径感应"],
    trend: [66, 70, 73, 76, 79, 83, 86, 89],
    mix: [
      { label: "剧本生成", value: 78 },
      { label: "舞台视觉", value: 92 },
      { label: "声音合成", value: 64 },
      { label: "互动控制", value: 88 },
      { label: "数字角色", value: 73 }
    ]
  },
  {
    id: "neural-reverie-orchestra",
    title: "Neural Reverie Orchestra",
    category: "音乐会",
    city: "洛杉矶",
    country: "美国",
    region: "北美",
    venue: "Walt Disney Concert Hall",
    updatedMinutesAgo: 12,
    reviewCount: 3675,
    audienceSentiment: 86,
    aiInvolvement: 91,
    integrationQuality: 78,
    controversy: 40,
    highlight: "观众高度认可 AI 与管弦乐的动态编排，但对“机器是否抢走作曲家位置”出现明显分歧。",
    quote: "最好看的不是屏幕，而是 AI 如何让同一段旋律在现场像潮汐一样被改写。",
    sources: ["YouTube", "Threads", "Billboard", "X"],
    languages: ["English", "Korean"],
    stack: ["AI 编曲引擎", "实时情绪映射", "空间音频控制", "灯光联动"],
    trend: [72, 76, 79, 81, 80, 84, 85, 86],
    mix: [
      { label: "编曲生成", value: 95 },
      { label: "舞台视觉", value: 74 },
      { label: "声音系统", value: 93 },
      { label: "互动控制", value: 69 },
      { label: "数字角色", value: 58 }
    ]
  },
  {
    id: "museum-of-synthetic-memory",
    title: "Museum of Synthetic Memory",
    category: "展览",
    city: "巴黎",
    country: "法国",
    region: "欧洲",
    venue: "Gaite Lyrique",
    updatedMinutesAgo: 18,
    reviewCount: 2914,
    audienceSentiment: 83,
    aiInvolvement: 76,
    integrationQuality: 88,
    controversy: 22,
    highlight: "策展叙事和 AI 记忆重建的配合非常完整，社交平台普遍把它当成“可被讨论的未来展览模板”。",
    quote: "这不像技术秀，更像 AI 帮策展人搭出了一个可以进入的记忆建筑。",
    sources: ["Le Monde", "Instagram", "TikTok", "Reddit"],
    languages: ["French", "English"],
    stack: ["生成式策展", "记忆图像重建", "语义导览", "动态内容分发"],
    trend: [61, 67, 71, 74, 77, 79, 81, 83],
    mix: [
      { label: "策展逻辑", value: 82 },
      { label: "视觉生成", value: 86 },
      { label: "声音设计", value: 58 },
      { label: "互动控制", value: 73 },
      { label: "数据叙事", value: 81 }
    ]
  },
  {
    id: "proxy-bodies",
    title: "Proxy Bodies",
    category: "跨界展演",
    city: "柏林",
    country: "德国",
    region: "欧洲",
    venue: "Haus der Berliner Festspiele",
    updatedMinutesAgo: 9,
    reviewCount: 2548,
    audienceSentiment: 74,
    aiInvolvement: 88,
    integrationQuality: 69,
    controversy: 61,
    highlight: "作品热度很高，但也因为深度换脸和 AI 表演代理引发伦理争议，评价两极明显。",
    quote: "它像一场非常锋利的实验，惊艳和不安几乎同时发生。",
    sources: ["Zeit", "X", "Mastodon", "Festival Blog"],
    languages: ["German", "English"],
    stack: ["数字替身", "动作迁移", "实时视觉风格化", "语音代理"],
    trend: [58, 63, 67, 71, 69, 72, 73, 74],
    mix: [
      { label: "表演代理", value: 94 },
      { label: "舞台视觉", value: 85 },
      { label: "声音合成", value: 71 },
      { label: "互动控制", value: 61 },
      { label: "伦理压力", value: 88 }
    ]
  },
  {
    id: "liminal-chorus",
    title: "Liminal Chorus",
    category: "戏剧",
    city: "东京",
    country: "日本",
    region: "亚太",
    venue: "Tokyo Metropolitan Theatre",
    updatedMinutesAgo: 15,
    reviewCount: 3168,
    audienceSentiment: 87,
    aiInvolvement: 79,
    integrationQuality: 90,
    controversy: 27,
    highlight: "AI 语音角色和真人演员之间的节奏协同被观众反复夸赞，成为讨论峰值。",
    quote: "最厉害的是你几乎忘了哪一部分是机器，戏剧的呼吸感被完整保住了。",
    sources: ["X", "Yahoo Japan", "YouTube", "Ticket Reviews"],
    languages: ["Japanese", "English"],
    stack: ["AI 语音角色", "排练辅助提示", "字幕引擎", "情绪灯光映射"],
    trend: [64, 68, 72, 76, 81, 83, 86, 87],
    mix: [
      { label: "文本引擎", value: 66 },
      { label: "声音角色", value: 90 },
      { label: "舞台视觉", value: 73 },
      { label: "互动控制", value: 68 },
      { label: "排练系统", value: 85 }
    ]
  },
  {
    id: "signal-rain-atlas",
    title: "Signal Rain Atlas",
    category: "沉浸式演出",
    city: "新加坡",
    country: "新加坡",
    region: "亚太",
    venue: "Esplanade Annex",
    updatedMinutesAgo: 4,
    reviewCount: 2186,
    audienceSentiment: 92,
    aiInvolvement: 85,
    integrationQuality: 88,
    controversy: 18,
    highlight: "观众对“AI 根据人流密度实时改变场景和声场”评价极高，社交媒体传播效率很强。",
    quote: "这不是被动看演出，而是你走到哪，演出就重新组织到哪。",
    sources: ["Instagram", "TikTok", "The Straits Times", "X"],
    languages: ["English", "Chinese"],
    stack: ["群体轨迹感知", "环境声场生成", "投影排程", "实时观演路径"],
    trend: [70, 73, 77, 82, 85, 88, 90, 92],
    mix: [
      { label: "环境感知", value: 93 },
      { label: "视觉生成", value: 87 },
      { label: "声音空间", value: 91 },
      { label: "互动控制", value: 95 },
      { label: "票务运营", value: 58 }
    ]
  }
];

const mentions = [
  {
    signalId: "signal-rain-atlas",
    source: "TikTok",
    region: "亚太",
    language: "English",
    minutesAgo: 2,
    tone: "positive",
    text: "人一多，整个空间的声场和视觉就自动重排，这个即时反馈太上头了。"
  },
  {
    signalId: "echoes-of-the-ninth-wall",
    source: "X",
    region: "欧洲",
    language: "English",
    minutesAgo: 3,
    tone: "positive",
    text: "第三次剧情分支之后，AI 灯光像接管了导演的第二意识，观众全场都在惊呼。"
  },
  {
    signalId: "proxy-bodies",
    source: "Festival Blog",
    region: "欧洲",
    language: "German",
    minutesAgo: 5,
    tone: "watch",
    text: "技术确实惊人，但深度代理真人表演的边界问题让人没法轻松离场。"
  },
  {
    signalId: "liminal-chorus",
    source: "Yahoo Japan",
    region: "亚太",
    language: "Japanese",
    minutesAgo: 7,
    tone: "positive",
    text: "AI 语音角色和演员换气节奏的同步感意外地自然，戏没有被技术切碎。"
  },
  {
    signalId: "museum-of-synthetic-memory",
    source: "Instagram",
    region: "欧洲",
    language: "French",
    minutesAgo: 8,
    tone: "positive",
    text: "像是走进一个会根据你回忆重新布展的展厅，AI 在这里更像策展助手。"
  },
  {
    signalId: "neural-reverie-orchestra",
    source: "YouTube",
    region: "北美",
    language: "English",
    minutesAgo: 10,
    tone: "mixed",
    text: "现场生成旋律的部分太强了，但我还是想知道人类作曲家在这里还剩多少份量。"
  },
  {
    signalId: "echoes-of-the-ninth-wall",
    source: "Reddit",
    region: "欧洲",
    language: "Spanish",
    minutesAgo: 12,
    tone: "positive",
    text: "它让观众不只是投票，而是真的在改变剧情压力和演员节奏。"
  },
  {
    signalId: "signal-rain-atlas",
    source: "The Straits Times",
    region: "亚太",
    language: "English",
    minutesAgo: 14,
    tone: "positive",
    text: "这类把人流、路径和实时场景编排绑在一起的演出，已经非常接近新一代沉浸式标准。"
  },
  {
    signalId: "proxy-bodies",
    source: "Mastodon",
    region: "欧洲",
    language: "English",
    minutesAgo: 16,
    tone: "watch",
    text: "真正值得讨论的不是效果，而是以后观众是否还能分清“谁在表演”。"
  },
  {
    signalId: "neural-reverie-orchestra",
    source: "Threads",
    region: "北美",
    language: "Korean",
    minutesAgo: 19,
    tone: "mixed",
    text: "AI 和乐团的交互很华丽，但有时会让作品更像系统展示而不是情感表达。"
  }
];

const graphNodes = [
  {
    id: "dramaturgy",
    title: "AI 剧作",
    subtitle: "创作前期",
    x: 130,
    y: 100,
    radius: 42,
    accent: "#ffb56c",
    value: "负责分支剧本、台词重写、角色动机生成，是最先改变舞台创作链条的入口。",
    tension: "容易提升创作速度，但也最容易引发“原创性”和“作者归属”的争议。",
    impact: "如果系统只给草案，人类导演仍掌控最终节奏；如果系统参与现场分支，观众会明显感知 AI 的在场。"
  },
  {
    id: "vision",
    title: "生成视觉",
    subtitle: "舞台空间",
    x: 150,
    y: 320,
    radius: 46,
    accent: "#61dcff",
    value: "负责投影、场景纹理、灯光风格和空间氛围变化，是观众最直观看见 AI 的位置。",
    tension: "视觉爆发力极强，但如果只做“炫技幕墙”，观众会觉得技术压过戏剧。",
    impact: "在展览和沉浸式演出里，它往往是决定传播效率和打卡意愿的核心。"
  },
  {
    id: "voice",
    title: "语音角色",
    subtitle: "演员系统",
    x: 340,
    y: 372,
    radius: 38,
    accent: "#bcff85",
    value: "负责 AI 角色声音、旁白、多语字幕对接，是戏剧和音乐会里保持节奏感的关键模块。",
    tension: "如果声音拟真过高，观众会对“是否替代真人演员”变得敏感。",
    impact: "当它和真人演员配合得好，观众会觉得技术被戏剧驯化了，而不是反过来。"
  },
  {
    id: "audience-loop",
    title: "观众交互",
    subtitle: "演出当下",
    x: 550,
    y: 315,
    radius: 48,
    accent: "#7bc6ff",
    value: "通过位置、动作、选择、停留时长实时改变剧情、声场和视觉，是最能体现 AI 介入深度的模块。",
    tension: "交互过强会导致叙事被拆散，交互过弱又会让观众觉得只是伪装成互动。",
    impact: "对沉浸式演出价值最高，因为它直接决定观众“我是否参与塑造了作品”。"
  },
  {
    id: "analytics",
    title: "情绪分析",
    subtitle: "复盘与运营",
    x: 545,
    y: 110,
    radius: 40,
    accent: "#ffd27c",
    value: "负责聚合评论、识别情绪和口碑峰值，直接服务于后续运营、巡演和作品迭代。",
    tension: "它常常看不见，但会反过来塑造下一轮内容生产逻辑。",
    impact: "这正是你这个产品的核心价值点，因为评分与趋势监控都建立在它之上。"
  },
  {
    id: "production",
    title: "制作调度",
    subtitle: "排练与控制",
    x: 338,
    y: 72,
    radius: 36,
    accent: "#ff8f97",
    value: "负责排练提示、切换节拍、设备协同和技术预演，是让复杂 AI 演出可复制的幕后层。",
    tension: "观众不一定能看见它，但没有这一层，现场往往不稳定也无法巡演。",
    impact: "它更偏 B 端价值，适合在产品里做后台效率模块和导演控制台。"
  }
];

const graphLinks = [
  ["dramaturgy", "core"],
  ["vision", "core"],
  ["voice", "core"],
  ["audience-loop", "core"],
  ["analytics", "core"],
  ["production", "core"],
  ["dramaturgy", "analytics"],
  ["vision", "audience-loop"],
  ["voice", "production"],
  ["analytics", "production"]
];

const state = {
  category: "全部",
  region: "全部",
  search: "",
  selectedSignalId: performances[0].id,
  activeNodeId: "audience-loop",
  liveOffset: 0
};

const numberFormatter = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

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
  scorePanel: document.querySelector("#scorePanel")
};

function computeScore(item) {
  return Math.round(item.audienceSentiment * 0.6 + item.aiInvolvement * 0.25 + item.integrationQuality * 0.15);
}

function scoreTone(score) {
  if (score >= 88) {
    return { label: "强势上升", className: "tone-positive" };
  }
  if (score >= 78) {
    return { label: "值得关注", className: "tone-mixed" };
  }
  return { label: "观察中", className: "tone-watch" };
}

function formatAgo(minutes) {
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} 小时前`;
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
  return ["全部", ...new Set(performances.map((item) => item.category))];
}

function getRegions() {
  return ["全部", ...new Set(performances.map((item) => item.region))];
}

function getFilteredSignals() {
  const query = state.search.trim().toLowerCase();
  return performances.filter((item) => {
    const matchesCategory = state.category === "全部" || item.category === state.category;
    const matchesRegion = state.region === "全部" || item.region === state.region;
    const matchesQuery =
      !query ||
      [item.title, item.city, item.country, item.venue, ...item.sources, ...item.stack]
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
  const filteredIds = new Set(filteredSignals.map((item) => item.id));
  const scopedMentions = mentions.filter((item) => {
    if (!filteredIds.has(item.signalId)) {
      return false;
    }
    if (state.region !== "全部" && item.region !== state.region) {
      return false;
    }
    return true;
  });

  const pool = scopedMentions.length ? scopedMentions : mentions;
  return Array.from({ length: Math.min(6, pool.length) }, (_, index) => pool[(state.liveOffset + index) % pool.length]);
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
  const reviewTotal = filteredSignals.reduce((sum, item) => sum + item.reviewCount, 0);
  const sourceTotal = new Set(filteredSignals.flatMap((item) => item.sources)).size;
  const avgInvolvement = filteredSignals.length
    ? Math.round(filteredSignals.reduce((sum, item) => sum + item.aiInvolvement, 0) / filteredSignals.length)
    : 0;
  const avgScore = filteredSignals.length
    ? Math.round(filteredSignals.reduce((sum, item) => sum + computeScore(item), 0) / filteredSignals.length)
    : 0;

  elements.heroMetrics.innerHTML = [
    { label: "纳入演出", value: `${filteredSignals.length}`, meta: "按作品级别聚合" },
    { label: "评价总量", value: numberFormatter.format(reviewTotal), meta: "全网多语种评论" },
    { label: "平均 AI 介入", value: `${avgInvolvement}`, meta: "0 - 100" },
    { label: "综合脉冲分", value: `${avgScore}`, meta: `${sourceTotal} 个来源平台` }
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
  const ranked = [...filteredSignals].sort((left, right) => computeScore(right) - computeScore(left));
  const featured = ranked[0] ?? performances[0];
  const others = ranked.slice(1, 4);
  const featuredScore = computeScore(featured);

  elements.spotlightPanel.innerHTML = `
    <div class="spotlight-card">
      <div class="spotlight-main">
        <div class="score-ring" style="--score-angle:${featuredScore * 3.6}deg;">
          <div>
            <strong>${featuredScore}</strong>
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
            ${featured.stack.slice(0, 4).map((item) => `<span class="tag">${item}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="mini-grid">
        ${others
          .map((item) => {
            const score = computeScore(item);
            return `
              <article class="mini-metric">
                <span class="mini-metric-label">${item.title}</span>
                <span class="mini-metric-value">${score}</span>
                <span class="metric-card-meta">${item.city} · AI ${item.aiInvolvement}</span>
              </article>
            `;
          })
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
    .map((item) => {
      const score = computeScore(item);
      const tone = scoreTone(score);
      return `
        <article class="signal-card" data-signal-id="${item.id}" data-active="${String(item.id === state.selectedSignalId)}">
          <div class="signal-topline">
            <div>
              <h4 class="signal-title">${item.title}</h4>
              <p class="signal-kicker">${item.category} · ${item.city}, ${item.country} · ${item.venue}</p>
            </div>
            <div class="signal-score">
              <strong>${score}</strong>
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
              ${item.stack.slice(0, 3).map((stack) => `<span class="stack-pill">${stack}</span>`).join("")}
            </div>
            <span class="tone-pill ${tone.className}">${tone.label}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderInspector(selectedSignal) {
  if (!selectedSignal) {
    elements.inspectorPanel.innerHTML = `<div class="empty-state">没有可展示的作品信号。</div>`;
    elements.scorePanel.innerHTML = `<div class="empty-state">没有可展示的评分引擎示例。</div>`;
    return;
  }

  const score = computeScore(selectedSignal);
  const scoreBand = scoreTone(score);

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
      <div class="score-ring" style="--score-angle:${score * 3.6}deg;">
        <div>
          <strong>${score}</strong>
          <span>${scoreBand.label}</span>
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

    <div class="inspector-quote">
      ${selectedSignal.quote}
    </div>

    <div class="sparkline-card">
      <div class="sparkline-label">
        <span>近 8 个时间片的讨论热度变化</span>
        <span>${selectedSignal.sources.join(" · ")}</span>
      </div>
      <svg viewBox="0 0 320 96" aria-hidden="true">
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#61dcff"></stop>
            <stop offset="100%" stop-color="#ffb56c"></stop>
          </linearGradient>
        </defs>
        <path d="${sparklinePath(selectedSignal.trend)}" fill="none" stroke="url(#sparklineGradient)" stroke-width="4" stroke-linecap="round"></path>
      </svg>
    </div>

    <div class="mix-list">
      ${selectedSignal.mix
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
      ${selectedSignal.stack.map((item) => `<span class="tag">${item}</span>`).join("")}
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
      当前作品的综合分为 <strong>${score}</strong>。这个模型适合前端快速比较，也方便后续升级成更复杂的版本，例如加入来源可信度、评论去重质量、
      负面事件惩罚项或不同国家市场的校准因子。
    </p>
  `;
}

function renderLiveFeed(filteredSignals) {
  const visibleMentions = getVisibleMentions(filteredSignals);
  elements.liveFeed.innerHTML = visibleMentions
    .map((item, index) => {
      const signal = performances.find((entry) => entry.id === item.signalId);
      const toneClass = item.tone === "positive" ? "tone-positive" : item.tone === "mixed" ? "tone-mixed" : "tone-watch";
      return `
        <article class="live-feed-item" data-feed-signal-id="${item.signalId}" data-priority="${String(index === 0)}">
          <div class="feed-topline">
            <span>${signal.title}</span>
            <span class="${toneClass}">${item.source} · ${item.language} · ${formatAgo(item.minutesAgo)}</span>
          </div>
          <p class="feed-snippet">${item.text}</p>
        </article>
      `;
    })
    .join("");
}

function renderGraph() {
  const activeNode = graphNodes.find((item) => item.id === state.activeNodeId) ?? graphNodes[0];
  const core = { x: 340, y: 220 };
  const nodeLookup = Object.fromEntries(graphNodes.map((item) => [item.id, item]));

  elements.relationshipGraph.innerHTML = `
    <defs>
      <radialGradient id="coreGradient" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.95)"></stop>
        <stop offset="35%" stop-color="#61dcff"></stop>
        <stop offset="100%" stop-color="rgba(97,220,255,0.12)"></stop>
      </radialGradient>
    </defs>
    ${graphLinks
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
    ${graphNodes
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
}

function render() {
  const filteredSignals = getFilteredSignals();
  const renderPool = filteredSignals.length ? filteredSignals : performances;
  const selectedSignal = getSelectedSignal(filteredSignals);
  renderFilters();
  renderHero(renderPool);
  renderSpotlight(renderPool);
  renderSignalList(filteredSignals);
  renderInspector(selectedSignal);
  renderLiveFeed(renderPool);
  renderGraph();
}

bindEvents();
render();

window.setInterval(() => {
  state.liveOffset = (state.liveOffset + 1) % mentions.length;
  const filteredSignals = getFilteredSignals();
  const renderPool = filteredSignals.length ? filteredSignals : performances;
  renderSpotlight(renderPool);
  renderLiveFeed(renderPool);
}, 3600);
