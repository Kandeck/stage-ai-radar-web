import { Buffer } from "node:buffer";
import { createSampleAdapter } from "./base.mjs";

const redditTokenCache = {
  accessToken: "",
  expiresAt: 0
};

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(/[,\r\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function minutesAgoFromUtc(createdUtc) {
  if (!createdUtc) {
    return 5;
  }
  const delta = Date.now() - Number(createdUtc) * 1000;
  return Math.max(1, Math.round(delta / 60000));
}

function inferCategory(text, subreddit = "") {
  const input = `${text} ${subreddit}`.toLowerCase();
  if (/(concert|orchestra|choir|music|live music)/i.test(input)) {
    return "音乐会";
  }
  if (/(exhibition|museum|gallery|installation|curatorial)/i.test(input)) {
    return "展览";
  }
  if (/(immersive|walkthrough|interactive|site-specific)/i.test(input)) {
    return "沉浸式演出";
  }
  if (/(performance art|cross-disciplinary|multimedia)/i.test(input)) {
    return "跨界展演";
  }
  return "戏剧";
}

function inferAiSignals(text, subreddit = "") {
  const input = `${text} ${subreddit}`.toLowerCase();
  const dictionary = [
    ["ai", "AI"],
    ["llm", "LLM dramaturgy"],
    ["voice", "AI voice"],
    ["subtitle", "subtitle engine"],
    ["projection", "generative projection"],
    ["visual", "generative visuals"],
    ["sound", "adaptive sound"],
    ["avatar", "digital avatar"],
    ["interactive", "audience interaction"],
    ["lighting", "adaptive lighting"],
    ["immersive", "immersive control"]
  ];

  const hits = dictionary.filter(([keyword]) => input.includes(keyword)).map(([, label]) => label);
  return hits.length ? [...new Set(hits)] : ["reddit-discussion-ingestion"];
}

function cleanPerformanceTitle(title) {
  return title
    .replace(/^(review|saw|thoughts on|critic(?:'s)? notebook)\s*:\s*/i, "")
    .replace(/\[[^\]]+\]\s*/g, "")
    .trim();
}

async function getAccessToken(env) {
  if (redditTokenCache.accessToken && Date.now() < redditTokenCache.expiresAt) {
    return redditTokenCache.accessToken;
  }

  const basicAuth = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": env.REDDIT_USER_AGENT
    },
    body: new URLSearchParams({
      grant_type: "client_credentials"
    }).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Reddit OAuth failed: ${response.status} ${payload.error ?? payload.message ?? "unknown_error"}`);
  }

  redditTokenCache.accessToken = payload.access_token;
  redditTokenCache.expiresAt = Date.now() + Math.max((Number(payload.expires_in) || 3600) - 60, 60) * 1000;
  return redditTokenCache.accessToken;
}

async function fetchSearchPosts({ accessToken, query, subreddit, sort, timeRange, limit, userAgent }) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort,
    t: timeRange,
    type: "link",
    raw_json: "1"
  });

  let endpoint = "https://oauth.reddit.com/search";
  if (subreddit) {
    endpoint = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/search`;
    params.set("restrict_sr", "true");
  }

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": userAgent,
      Accept: "application/json"
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Reddit search failed: ${response.status} ${payload.message ?? payload.error ?? "unknown_error"}`);
  }

  return (payload.data?.children ?? []).map((item) => item.data).filter(Boolean);
}

function normalisePost(post, subredditHint = "") {
  const bodyText = [post.title, post.selftext].filter(Boolean).join(". ").trim();
  const subreddit = post.subreddit ?? subredditHint ?? "reddit";

  return {
    externalId: post.name ?? `reddit-${post.id}`,
    performanceTitle: cleanPerformanceTitle(post.title || "Untitled Reddit Signal"),
    title: post.title || "Untitled Reddit Signal",
    category: inferCategory(bodyText, subreddit),
    region: "全球",
    country: "待补充",
    city: "待补充",
    venue: `r/${subreddit}`,
    language: "en",
    text: bodyText || "Reddit post with no body text.",
    aiSignals: inferAiSignals(bodyText, subreddit),
    collectedAt: post.created_utc ? new Date(Number(post.created_utc) * 1000).toISOString() : new Date().toISOString(),
    updatedMinutesAgo: minutesAgoFromUtc(post.created_utc)
  };
}

async function collectLiveReddit({ limit, options, env, envState }) {
  if (!envState.configured) {
    return {
      reviews: [],
      warnings: [`Missing environment variables: ${envState.missing.join(", ")}`]
    };
  }

  const query =
    String(options.query ?? env.REDDIT_SEARCH_QUERY ?? "AI theatre immersive exhibition concert performance")
      .trim() || "AI theatre immersive exhibition concert performance";
  const subreddits = parseList(options.subreddits ?? env.REDDIT_SEARCH_SUBREDDITS);
  const sort = String(options.sort ?? env.REDDIT_RESULT_SORT ?? "new").trim() || "new";
  const timeRange = String(options.time ?? env.REDDIT_TIME_RANGE ?? "month").trim() || "month";
  const perRequestLimit = Math.min(Math.max(Number(limit) || 5, 1), 25);
  const accessToken = await getAccessToken(env);

  const targets = subreddits.length ? subreddits : [""];
  const posts = [];
  const warnings = [];
  const seen = new Set();

  for (const subreddit of targets) {
    try {
      const results = await fetchSearchPosts({
        accessToken,
        query,
        subreddit,
        sort,
        timeRange,
        limit: perRequestLimit,
        userAgent: env.REDDIT_USER_AGENT
      });

      for (const post of results) {
        const dedupeId = post.name ?? post.id;
        if (!dedupeId || seen.has(dedupeId)) {
          continue;
        }
        seen.add(dedupeId);
        posts.push(normalisePost(post, subreddit));
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Failed to query reddit for ${subreddit || "global search"}`);
    }
  }

  return {
    reviews: posts.slice(0, perRequestLimit),
    warnings
  };
}

export const redditAdapter = createSampleAdapter({
  id: "reddit",
  label: "Reddit",
  auth: "OAuth",
  coverage: "全球英文社区讨论",
  notes: "适合沉浸式戏剧、AI 伦理争议和长评论抽样。支持 Reddit application-only OAuth live 搜索。",
  envVars: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT"],
  collectLive: collectLiveReddit,
  sampleReviews: [
    {
      performanceTitle: "Future Chorus",
      title: "Future Chorus",
      category: "戏剧",
      region: "欧洲",
      country: "英国",
      city: "伦敦",
      venue: "Southbank Centre",
      language: "en",
      text: "Beautiful immersive staging with AI voice characters. It felt human first, machine second.",
      aiSignals: ["AI voice", "immersive control", "adaptive lighting"],
      updatedMinutesAgo: 3
    },
    {
      performanceTitle: "Soft Electric Garden",
      title: "Soft Electric Garden",
      category: "展览",
      region: "北美",
      country: "美国",
      city: "纽约",
      venue: "The Shed",
      language: "en",
      text: "Generative visuals were strong, but some rooms felt more like a demo than a show.",
      aiSignals: ["generative visuals", "projection", "interactive pathing"],
      updatedMinutesAgo: 8
    }
  ]
});
