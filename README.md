# VaniBlu Social Agent

An AI-powered social media manager for the VaniBlu skincare brand, built as an OpenClaw plugin. Operates via Telegram — send a message, get content research, post drafts, critique, images, and Instagram analytics back.

---

## What It Does

| Tool | What You Say | What It Returns |
|------|-------------|-----------------|
| `vaniblu_researcher` | "מה הטרנדים בטיפוח עכשיו?" | Trend insights with brand relevance scores |
| `vaniblu_creator` | "צרי פוסט על שגרת לילה" | Full Facebook post: hook, body, CTA, visual prompt |
| `vaniblu_critic` | _(called automatically after creator)_ | Score 0–10, issues, improvements, approve/revise verdict |
| `vaniblu_image` | _(called automatically after creator)_ | Generated image via Imagen 3 |
| `vaniblu_analyst` | "נתחי את הביצועים של האינסטגרם" | Follower count, last N posts, likes, comments, reach |

---

## Requirements

- **Node.js** 20+
- **OpenClaw** 2026.3.24+ — `npm install -g openclaw`
- **Telegram bot** — create one via [@BotFather](https://t.me/BotFather)
- API keys (see below)

---

## API Keys

Create a `.env` file at the project root (`social-agent/.env`) with:

```env
ANTHROPIC_API_KEY=sk-ant-...        # claude.ai/settings → API Keys
GOOGLE_AI_STUDIO_KEY=AIza...        # aistudio.google.com → Get API Key
TELEGRAM_BOT_TOKEN=123456:ABC...    # from @BotFather on Telegram
INSTAGRAM_API_KEY=EAAS...           # Meta Developer → Graph API token
```

### Instagram API Key Requirements

The Instagram token must belong to a **Business** (not Creator) account and have these permissions:
- `instagram_basic`
- `instagram_manage_insights`
- `pages_show_list`
- `pages_read_engagement`

Generate at: [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)

---

## Setup

```bash
# 1. Install dependencies
cd social-agent/extensions/vaniblu
npm install

# 2. Configure OpenClaw
openclaw config set gateway.mode local
openclaw channels add --channel telegram --token <TELEGRAM_BOT_TOKEN>

# 3. Install plugin
cd social-agent/extensions/vaniblu
openclaw plugins install .

# 4. Fix plugin manifest (required once)
# Add "id" and "configSchema" fields to:
# C:\Users\<you>\.openclaw\extensions\@vaniblu-social-agent-78cf6fb007\openclaw.plugin.json

# 5. Start gateway
openclaw gateway
```

### First-Time Telegram Pairing

In a second terminal (while gateway is running):
```bash
openclaw pairing list          # see the pairing code
openclaw pairing approve <code>
```

---

## Project Structure

```
social-agent/
├── .env                          # API keys (never commit)
└── extensions/vaniblu/
    ├── index.ts                  # Plugin entry, registers all tools
    ├── package.json
    ├── data/
    │   └── brand_brain.json      # Brand persona, tone, target audience
    ├── lib/
    │   ├── anthropic-client.ts   # Shared Claude client
    │   ├── brand-brain.ts        # Brand Brain loader
    │   └── types.ts              # Shared TypeScript types
    ├── tools/
    │   ├── researcher.ts         # Trend research via web search + Claude
    │   ├── creator.ts            # Post generation
    │   ├── critic.ts             # Post quality scoring
    │   ├── image.ts              # Imagen 3 image generation
    │   └── analyst.ts            # Instagram performance analytics
    └── tests/
        ├── brand-brain.test.ts
        ├── researcher.test.ts
        ├── creator.test.ts
        ├── critic.test.ts
        ├── image.test.ts
        └── analyst.test.ts
```

---

## Running Tests

```bash
cd extensions/vaniblu
npm test
```

19 tests, no network calls (all mocked).

---

## Brand Brain

The agent's personality and content rules live in [extensions/vaniblu/data/brand_brain.json](extensions/vaniblu/data/brand_brain.json). Edit this file to change tone, target audience, forbidden themes, post examples, or KPIs without touching any code.

---

## Known Issues

- **Plugin install**: `openclaw plugins install .` may fail at the config-write step with "plugin manifest requires id". Fix: manually add `"id"` and `"configSchema": {}` to `~/.openclaw/extensions/@vaniblu-social-agent-78cf6fb007/openclaw.plugin.json`, then restart the gateway.
- **Env vars**: The gateway does not auto-load `.env`. The `INSTAGRAM_API_KEY` is read directly from `~/social-agent/.env` as a fallback. Other keys should be set as Windows User environment variables or configured via `openclaw configure --section model`.
