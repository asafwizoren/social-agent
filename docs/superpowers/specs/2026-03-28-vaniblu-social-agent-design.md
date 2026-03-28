# VaniBlu Social Agent — Design Spec
**Date:** 2026-03-28
**Status:** Approved

---

## 1. Mission

VaniBlu Social Agent הוא Social Media Manager מלא למותג VaniBlu — מוצר טיפוח לנערות.

הוא לא "כותב פוסטים" — הוא מקבל החלטות אסטרטגיות, לומד מהשוק, מייצר תוכן, ומבקר את עצמו.

**End user:** אשת המפתח — מנהלת מותג VaniBlu, Hebrew only, דרך Telegram.

---

## 2. KPIs (לפי עדיפות)

1. Newsletter signups (primary) — CTA ברירת מחדל = מייל
2. Waitlist
3. WhatsApp community

כל פוסט נשפט לפי conversion פוטנציאלי למייל.

---

## 3. Brand Personality

**קהל יעד MVP:** אמהות — Facebook בלבד
**טון:** אחות גדולה חכמה, לא מתיילדת, לא שיווקית מדי, רגשית + מדעית
**Decision style:** מוביל (לא רק מציע), נותן recommendation ברור, מסביר למה, מבקש אישור

---

## 4. Architecture

### Platform: OpenClaw

OpenClaw הוא ה-runtime של האייג'נט — מטפל ב:
- Telegram channel (מובנה)
- Memory system (מובנה)
- Browser automation לאיסוף טרנדים (מובנה)
- Claude Sonnet 4.6 כ-LLM

### VaniBlu Plugin

Plugin אחד שרושם 5 tools ב-OpenClaw:

```
extensions/vaniblu/
├── package.json
├── openclaw.plugin.json
├── index.ts              # רישום כל ה-tools
├── tools/
│   ├── researcher.ts     # browser automation של OpenClaw
│   ├── strategist.ts
│   ├── creator.ts
│   ├── critic.ts
│   └── image.ts          # Imagen 3 (Google AI Studio)
└── data/
    └── brand_brain.json  # VaniBlu brand rules (hardcoded MVP)
```

### Data Flow

```
אשתך (Telegram)
       ↕
   OpenClaw Platform
   ├── Telegram channel (מובנה)
   ├── Memory system (מובנה)
   ├── Browser automation (מובנה)
   └── VaniBlu Plugin
       ├── researcher_tool  → browser automation
       ├── strategist_tool
       ├── creator_tool     → image_tool → Imagen 3
       └── critic_tool
```

---

## 5. The 5 Tools

### researcher_tool
- מזהה טרנדים דרך browser automation של OpenClaw
- מקורות: TikTok, IG, Facebook groups (אמהות), YouTube (נערות)
- Output:
```json
{
  "trend": "...",
  "relevance_to_brand": "...",
  "risk_level": "low|medium|high",
  "opportunity": "...",
  "content_angles": []
}
```

### strategist_tool
- בוחר מה לעשות השבוע
- מקשר טרנדים + KPI + Brand
- Output: weekly plan עם 5-15 content directions

### creator_tool
- מייצר פוסט מלא: hook + body + CTA (מייל) + variants
- Output:
```json
{
  "post_text": "...",
  "cta": "...",
  "platform": "facebook",
  "angle": "education|emotional|storytelling|...",
  "visual_prompt": "...",
  "variants": []
}
```

### critic_tool
- בודק: קרינג', אמינות, התאמה לנערות, חרדה, KPI
- Output:
```json
{
  "score": "<0-10>",
  "issues": [],
  "improvements": [],
  "final_verdict": "approve|revise"
}
```

### image_tool
- מקבל `visual_prompt` מ-creator_tool
- מריץ Imagen 3 דרך Google AI Studio API (free tier)
- שולח תמונה ישירות לטלגרם
- תומך ב-iteration: אשתך יכולה לבקש שינויים בצ'אט

---

## 6. UX Flow (Telegram Sessions)

**Session יזום:**
```
אשתך:   "בואי נתכנן תוכן לשבוע הבא"
אייג'נט: "זיהיתי 2 טרנדים רלוונטיים השבוע..."
          "ממליצה על 4 פוסטים: [plan]. נתחיל עם איזה?"
אשתך:   "הראשון"
אייג'נט: [שולח טיוטה + תמונה]
          "ציון: 8.5/10. ה-CTA קצת חלש — רוצה שאחזק?"
```

**בקשה נקודתית:**
```
אשתך:   "תייצרי פוסט על חרדת גיל ההתבגרות"
אייג'נט: [Creator + Critic + Imagen 3]
          [שולח פוסט + תמונה]
          "ציון: 9/10 — אפשר לפרסם"
```

**שיפור תמונה:**
```
אשתך:   "תורידי את הגוון הסגול"
אייג'נט: [מעדכן prompt, Imagen 3 שוב]
          [תמונה חדשה]
```

---

## 7. Memory

OpenClaw's built-in memory system שומר:
- Brand rules (permanent)
- פוסטים קודמים + ציונים
- מה עבד / לא עבד (insights)
- תגובות קהל (manual input בשלב ראשון)

---

## 8. Tech Stack

| שכבה | טכנולוגיה |
|---|---|
| Platform | OpenClaw (Node.js) |
| Plugin language | TypeScript |
| LLM | Claude Sonnet 4.6 (via OpenClaw) |
| Images | Imagen 3 — Google AI Studio (free tier) |
| Bot | OpenClaw Telegram channel (מובנה) |
| Memory | OpenClaw memory system (מובנה) |
| Browser/Trends | OpenClaw browser automation (מובנה) |

---

## 9. Experimentation Policy

- 60% תוכן בטוח
- 40% ניסויים: hooks שונים, טון רגשי, storytelling, formats חדשים

---

## 10. Cadence

5-15 פוסטים בשבוע, האייג'נט מאזן לפי איכות ולא כמות.

---

## 11. Success Definition (Post Level)

פוסט נחשב מוצלח אם:
- מייצר תגובות איכותיות
- מייצר saves / shares
- מייצר intent (קליקים / שאלות)
- תומך conversion למייל

---

## 12. MVP Scope

**כן ב-MVP:**
- researcher_tool — מחקר טרנדים ראשוני (browser automation)
- creator_tool + critic_tool (עובדים מלא, מבוססים על מחקר)
- image_tool (Imagen 3)
- OpenClaw מנהל session בטלגרם (מובנה — לא קוד שנכתוב)
- brand_brain.json עם כל הסגנון של VaniBlu

**נדחה לאחרי MVP:**
- strategist_tool (weekly plan אוטומטי)
- analyst_tool (performance analysis)
- פרסום אוטומטי לפייסבוק

---

## 13. MVP Plan

**Week 1:**
1. התקנת OpenClaw + הגדרת Telegram channel
2. brand_brain.json — כל ה-brand rules
3. researcher_tool — browser automation לטרנדים (TikTok, IG, Facebook groups, YouTube)
4. Flow ראשוני: בקשת מחקר → insights → Telegram

**Week 2:**
- creator_tool + critic_tool (מבוססים על outputs של researcher)
- image_tool (Imagen 3)
- Flow מלא: מחקר → פוסט → ביקורת → תמונה → Telegram

**Week 3:**
- strategist_tool — weekly plan המבוסס על researcher
- batch של 5-15 פוסטים + feedback loop ראשוני

---

## 14. Permissions

- MVP: Drafts בלבד — אשתך מאשרת ומעלה ידנית
- Future: Publishing אוטומטי לפייסבוק (optional)
