# Requirements & Accounts Needed

Everything a new developer needs before running VaniBlu Social Agent.

---

## 1. Software

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | included with Node.js |
| OpenClaw | 2026.3.24+ | `npm install -g openclaw` |

---

## 2. Accounts & API Keys

You need **4 external accounts**. Get each key and put it in `social-agent/.env`.

---

### Anthropic (Claude AI) — Text generation

- **Sign up**: [console.anthropic.com](https://console.anthropic.com)
- **Get key**: Settings → API Keys → Create Key
- **Cost**: Pay-as-you-go. The agent uses `claude-haiku-4-5` (~$0.001 per 1K tokens)
- **Env var**: `ANTHROPIC_API_KEY`

---

### Google AI Studio (Imagen 3) — Image generation

- **Sign up**: [aistudio.google.com](https://aistudio.google.com)
- **Get key**: Click "Get API Key" → Create API key
- **Cost**: Imagen 3 has a free tier; check current pricing at AI Studio
- **Env var**: `GOOGLE_AI_STUDIO_KEY`

---

### Telegram — Bot channel

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow instructions
3. Copy the token it gives you
- **Cost**: Free
- **Env var**: `TELEGRAM_BOT_TOKEN`

**Note**: Each person who wants to chat with the bot must be approved via `openclaw pairing approve` the first time.

---

### Meta Graph API (Instagram) — Analytics

This is the most involved setup. The Instagram account must be a **Business account** (not Creator).

**Steps:**
1. Go to [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App
2. Choose "Business" app type
3. Add **Instagram Graph API** product
4. Go to Graph API Explorer: [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
5. Select your app and generate a User Token with these permissions:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`
6. Copy the token
- **Cost**: Free
- **Env var**: `INSTAGRAM_API_KEY`

**Known account details** (already configured in code):
- Instagram Business Account ID: `17841400071340846`
- Facebook Page ID: `550626061476661`
- Username: `nitzanwizman`

If connecting a different Instagram account, update `IG_ACCOUNT_ID` in [extensions/vaniblu/tools/analyst.ts](extensions/vaniblu/tools/analyst.ts).

---

## 3. The .env File

Create `social-agent/.env` with this structure:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
GOOGLE_AI_STUDIO_KEY=AIzaSy...
TELEGRAM_BOT_TOKEN=1234567890:AAF...
INSTAGRAM_API_KEY=EAAS...
```

**Never commit this file.** It is listed in `.gitignore`.

---

## 4. Windows-Specific: Env Vars for Gateway

OpenClaw's gateway (when running as a background service) does not load `.env` automatically. To make all API keys available:

```powershell
# Run in PowerShell as the same user who runs the gateway
Get-Content C:\Users\<you>\social-agent\.env | Where-Object { $_ -match "^[A-Z_]+=.+" } | ForEach-Object {
    $parts = $_ -split "=", 2
    [System.Environment]::SetEnvironmentVariable($parts[0], $parts[1], "User")
    Write-Host "Set $($parts[0])"
}
```

Then restart the gateway. The `INSTAGRAM_API_KEY` has a fallback that reads the `.env` file directly, so it works without this step.

---

## 5. OpenClaw Config Fix (One-Time)

After `openclaw plugins install .`, you may need to manually edit:

**File:** `C:\Users\<you>\.openclaw\extensions\@vaniblu-social-agent-78cf6fb007\openclaw.plugin.json`

Add the two missing fields:

```json
{
  "id": "vaniblu-social-agent",
  "name": "vaniblu-social-agent",
  "displayName": "VaniBlu Social Agent",
  "version": "1.0.0",
  "description": "Social media manager for VaniBlu brand",
  "author": "VaniBlu",
  "config": {},
  "configSchema": {}
}
```

This is a bug in the current version of OpenClaw and may be fixed in future releases.
