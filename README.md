# Stage AI Radar

一个独立的网页原型，用来展示“实时收集全球 AI 介入戏剧、展演、沉浸式演出、展览、演出、音乐会观众评价，并根据评价和 AI 介入程度打分”的产品方向。

现在这个目录已经包含一个不依赖第三方安装包的本地 API 骨架，前端会优先请求本地 `/api/*`，拿不到时会退回演示数据。
后端存储优先使用 Node 自带的 `node:sqlite`，所以不需要额外安装 ORM 或 SQLite 包，但当前 Node 会提示这是 experimental feature。
如果当前环境上的 SQLite 文件模式不可用，系统会自动回退到 `data/stage-ai-radar.store.json`，接口保持不变。
服务会自动读取 `.env` 和 `.env.local`，不需要额外安装 dotenv。

## 文件

- `index.html`: 页面结构
- `styles.css`: 高级感响应式视觉样式
- `main.js`: 前端交互与 API 数据接入
- `demo-data.js`: 演示数据
- `shared/scoring.js`: 评分逻辑与评论归一化逻辑
- `server/index.mjs`: 本地 API 与静态资源服务
- `server/lib/api.mjs`: 筛选、图谱、采集预览接口
- `server/lib/db.mjs`: SQLite 持久化、评论入库、运行记录
- `server/lib/source-registry.mjs`: 采集源适配器注册表
- `server/adapters/*`: Reddit / X / 小红书 / 媒体 RSS / 票务平台采集器骨架
- `.env.example`: 采集器所需凭证占位

## 预览

直接在浏览器里打开 `index.html` 即可，页面会使用演示数据。

如果你想启用本地 API 与静态服务，在这个目录运行：

```powershell
npm run dev
```

然后访问 `http://localhost:4173/`。

## API

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/db/stats`
- `GET /api/signals`
- `GET /api/signals/:id`
- `GET /api/mentions`
- `GET /api/graph`
- `GET /api/sources`
- `POST /api/intake/reviews`
- `POST /api/intake/reviews/commit`
- `POST /api/sources/collect`

`POST /api/intake/reviews` 可以先拿来做采集器联调。传入：

```json
{
  "items": [
    {
      "performanceTitle": "Future Chorus",
      "category": "戏剧",
      "region": "欧洲",
      "country": "英国",
      "city": "伦敦",
      "source": "reddit",
      "language": "en",
      "text": "Beautiful immersive staging with AI voice characters.",
      "aiSignals": ["AI voice", "immersive control"]
    }
  ]
}
```

接口会返回归一化后的临时信号分组结果，方便后面接真实采集器。

如果你想把评论真正写入本地数据库，改用：

```powershell
curl.exe -X POST http://localhost:4173/api/intake/reviews/commit ^
  -H "Content-Type: application/json" ^
  -d "{\"items\":[{\"performanceTitle\":\"Future Chorus\",\"category\":\"戏剧\",\"region\":\"欧洲\",\"country\":\"英国\",\"city\":\"伦敦\",\"source\":\"reddit\",\"language\":\"en\",\"text\":\"Beautiful immersive staging with AI voice characters.\",\"aiSignals\":[\"AI voice\",\"immersive control\"]}]}"
```

如果你想测试采集器骨架，可以直接让某个 source 用 sample 模式写入数据库：

```powershell
curl.exe -X POST http://localhost:4173/api/sources/collect ^
  -H "Content-Type: application/json" ^
  -d "{\"sourceId\":\"reddit\",\"mode\":\"sample\",\"persist\":true,\"limit\":2}"
```

## RSS Live 采集

媒体评论源现在支持真实 RSS / XML 拉取。最简单的方式是先创建 `.env.local`：

```powershell
copy .env.example .env.local
```

默认示例里已经把 `MEDIA_FEED_URL` 指到了本地测试文件 [media-feed.xml](D:/codex/stage-ai-radar-web/server/fixtures/media-feed.xml)，所以你启动服务后，在页面的“采集源状态与运行”面板里点 `运行 live` 就能先做本地 smoke test。

后面把 `MEDIA_FEED_URL` 改成真实 RSS 地址即可，例如：

```text
MEDIA_FEED_URL=https://example.com/reviews.xml
```

也可以传多个地址，逗号分隔：

```text
MEDIA_FEED_URL=https://example.com/feed-a.xml,https://example.com/feed-b.xml
```

## Reddit Live Collection

The Reddit adapter now supports application-only OAuth live search.
Create `.env.local` first:

```powershell
copy .env.example .env.local
```

Then fill in these required credentials:

```text
REDDIT_CLIENT_ID=your_app_id
REDDIT_CLIENT_SECRET=your_app_secret
REDDIT_USER_AGENT=stage-ai-radar/1.0 by your_reddit_name
```

Optional search controls:

```text
REDDIT_SEARCH_QUERY=AI theatre immersive exhibition concert performance
REDDIT_SEARCH_SUBREDDITS=theatre,immersive,performanceart,art
REDDIT_RESULT_SORT=new
REDDIT_TIME_RANGE=month
```

You can also trigger a live collection directly with the API:

```powershell
curl.exe -X POST http://localhost:4173/api/sources/collect ^
  -H "Content-Type: application/json" ^
  -d "{\"sourceId\":\"reddit\",\"mode\":\"live\",\"persist\":true,\"limit\":5}"
```

If credentials are missing, the adapter returns a warning and does not write broken data into storage.

## Xiaohongshu Feed Collection

The Xiaohongshu adapter supports compliant JSON export and partner feed ingestion.
It is designed for note exports, city-level audience discussion snapshots, and third-party collection pipelines that write JSON or NDJSON.

Create `.env.local` first:

```powershell
copy .env.example .env.local
```

Then point the feed variable to a local export or feed URL:

```text
XHS_FEED_URL=./server/fixtures/xiaohongshu-notes.json
```

You can also point it to a hosted JSON feed:

```text
XHS_FEED_URL=https://example.com/xiaohongshu-notes.json
```

Supported payload shapes:

- JSON array
- `{ "items": [...] }`
- `{ "notes": [...] }`
- NDJSON

The adapter normalizes fields such as `noteId`, `title`, `content`, `tags`, `city`, `venue`, and `publishedAt`, then estimates AI involvement from note text and tags.

## China Source Strategy

For China-focused discovery, the recommended collection order is:

1. `damai` for case discovery and show indexing
2. `xiaohongshu` for audience reactions and city-level discussion
3. `wechat-official` for official descriptions of how AI is used in the work
4. `bilibili` for longer-form reviews and backstage explainers
5. `douyin` for short-video heat signals

The local skeleton now includes dedicated adapters for `damai` and `wechat-official`.
You can test them with the included fixtures by copying `.env.example` to `.env.local`.

```text
DAMAI_FEED_URL=./server/fixtures/damai-shows.json
WECHAT_FEED_URL=./server/fixtures/wechat-posts.json
```

Suggested sample run:

```powershell
node server/scripts/collect.mjs --mode=live --persist=true --limit=2 --source=damai,xiaohongshu,wechat-official
```

## Batch Collection Runner

You can also run source collection from the command line without clicking the UI.

Sample mode for all sources:

```powershell
npm run collect:sample
```

Live mode for all sources:

```powershell
npm run collect:live
```

Custom runs are also supported:

```powershell
node server/scripts/collect.mjs --mode=live --persist=false --limit=2 --source=reddit,media,xiaohongshu
```

Supported flags:

- `--mode=sample|live`
- `--persist=true|false`
- `--limit=NUMBER`
- `--source=reddit,media,xiaohongshu,x,ticketing`

The runner prints a JSON summary with per-source status, warnings, and insert counts, which makes it easy to wire into Windows Task Scheduler or a future automation layer.

## PostgreSQL Storage

For production storage, switch the app to PostgreSQL instead of the local JSON file.

1. Copy `.env.example` to `.env.local`
2. Fill in:
   - `STAGE_AI_RADAR_STORAGE=postgres`
   - `DATABASE_URL=postgres://...`
   - `DATABASE_SSL=true` if your provider requires SSL
   - `DATABASE_SSL_REJECT_UNAUTHORIZED=false` for common managed providers that use self-signed chains
3. Install dependencies:

```powershell
npm install
```

4. Start the app:

```powershell
npm run dev
```

5. If you want to import the current local JSON reviews into PostgreSQL:

```powershell
npm run db:migrate:json
```

The migration script imports deduplicated reviews from `data/stage-ai-radar.store.json` and writes one retrieval event per imported review.

## Render Deployment

For long-term public access, deploy this app as a Render Web Service.

This project already includes [render.yaml](D:/codex/stage-ai-radar-web/render.yaml), so Render can read the service settings automatically.

Recommended steps:

1. Create a new GitHub repository
2. Upload the contents of this folder to that repository
3. In Render, choose `New +` -> `Blueprint`
4. Connect the GitHub repository
5. Render will detect `render.yaml`
6. In Render dashboard, set `DATABASE_URL` to your managed PostgreSQL connection string
7. Deploy

Notes:

- `healthCheckPath` is already set to `/api/health`
- `DATABASE_URL` is intentionally left as a dashboard secret
- The included blueprint defaults to the `free` plan; switch to `starter` in Render if you want fewer cold-start limits
