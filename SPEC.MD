🧠 VaniBlu Social Agent — Full Product Spec
1. 🎯 Mission

האייג'נט הוא Social Media Manager מלא למותג VaniBlu.

הוא לא “כותב פוסטים”, אלא:

מקבל החלטות אסטרטגיות, לומד מהשוק, מציע כיוונים, מייצר תוכן, ומבקר את עצמו.

2. 🧬 Core Objectives
🎯 KPI Priority (כפי שהגדרת)
Newsletter (primary)
Waitlist
WhatsApp community

👉 המשמעות:

CTA ברירת מחדל = מייל
כל פוסט נשפט לפי conversion פוטנציאלי למייל
3. 🧠 Agent Personality
🗣️ טון
אחות גדולה חכמה
לא מתיילד
לא שיווקי מדי
רגשי + מדעי
🧭 Decision Style

(B — כמו שבחרת)

מוביל, לא רק מציע
נותן recommendation ברור
מסביר למה
מבקש אישור
4. 🏗️ Agent Architecture (החלק הכי חשוב)

האייג'נט בנוי מ־5 מודולים (לא שרשרת — מערכת):

1. 🔍 Researcher
תפקיד:
לזהות טרנדים (ישראל + גלובלי)
לנתח תוכן מצליח
להביא insights
מקורות:
TikTok / IG (ידני/API)
Ramdam (אם יש API/סקראפינג)
Facebook groups (אמהות)
YouTube (נערות)
Output:
{
  "trend": "...",
  "relevance_to_brand": "...",
  "risk_level": "...",
  "opportunity": "...",
  "content_angles": [...]
}
2. 🧠 Strategist
תפקיד:
לבחור מה לעשות השבוע
לקשר בין:
טרנדים
KPI
Brand
Output:
Weekly plan
3–5 content directions
3. ✍️ Creator
תפקיד:
לייצר פוסטים מלאים

כולל:

hook
body
CTA (מייל)
וריאציות
Output:
{
  "post_text": "...",
  "cta": "...",
  "platform": "facebook",
  "angle": "education/emotional/...",
  "visual_prompt": "...",
  "variants": [...]
}
4. 🧪 Critic (קריטי)
תפקיד:
לבקר כל פוסט לפני שהוא מגיע לאשתך
בודק:
קרינג'
אמינות
התאמה לנערות
האם מייצר חרדה
האם משרת KPI
Output:
{
  "score": 0-10,
  "issues": [...],
  "improvements": [...],
  "final_verdict": "approve / revise"
}
5. 📊 Analyst (בהמשך)
תפקיד:
לנתח ביצועים

מקורות:

Facebook analytics
Klaviyo
Vercel (מבחנים)
Output:
מה עובד
מה לא
מה לשנות
5. 🔁 Agent Loop (החלק האייג'נטי האמיתי)

כל שבוע:

Research → Strategy → Content → Critique → User approval → (future: publish) → Analysis → Learn → Repeat

👉 זה מה שהופך את זה לאייג'נט ולא chain

6. 🧪 Experimentation Policy

(B — balanced)

60% תוכן בטוח
40% ניסויים
ניסויים יכולים להיות:
hooks שונים
טון רגשי יותר
storytelling
formats חדשים
7. 📱 MVP Platform Strategy
Phase 1:

👉 Facebook (אמהות בלבד)

למה:
low risk
test איכות agent
לא פוגע ב־brand הראשי
8. 📅 Cadence
3–5 posts בשבוע
(לא באמת 3 ביום — האייג'נט יאזן)
9. 📊 Success Definition (Post Level)

פוסט נחשב מוצלח אם:

מייצר תגובות איכותיות
מייצר saves / shares
מייצר intent (קליקים / שאלות)
תומך conversion למייל
10. 🧠 Memory System

האייג'נט שומר:

Brand rules
פוסטים קודמים
מה עבד / לא עבד
תגובות קהל

👉 זה קריטי ללמידה

11. 🎨 Visual System
שלב ראשון:
רק prompts לתמונה
בהמשך:
Midjourney / DALL·E integration
12. 💬 Community Layer

האייג'נט:

מציע תגובות לפוסטים
מציע תשובות לתגובות
לא עונה אוטומטית
13. 🔐 Permissions
MVP:
Drafts בלבד
Future:
Publishing (אופציונלי)
14. ⚙️ Tech Stack (מותאם למה שאתה כבר עושה)
Core:
Claude API (generation + reasoning)
Orchestration:

👉 Python agent (לא OpenClaw בשלב ראשון)

למה לא OpenClaw עכשיו:
אתה עדיין מגדיר behavior
עדיף שליטה מלאה
מבנה בסיסי:
agent/
  researcher.py
  strategist.py
  creator.py
  critic.py
  analyst.py
  memory.py
15. 🚀 MVP Plan (פרקטי לגמרי)
Week 1:
1. Hardcode Brand Brain
JSON עם כל מה שכתבנו
2. לבנות:
Researcher (basic)
Creator
Critic
3. Flow:
trend → post → critique → final draft
Week 2:
Strategist
Weekly plan
3 posts batch
Week 3:
Feedback loop
manual analytics input
16. 🧠 איפה נכנס “האייג'נטיות”

זה לא:

❌ prompt אחד
❌ שרשרת

זה כן:

✔️ מערכת שמקבלת החלטות
✔️ מבקרת את עצמה
✔️ לומדת
✔️ מובילה

17. 🔥 מה ה־Agent היה אומר לאשתך

דוגמה:

“זיהיתי טרנד חזק סביב פחד מטעויות בטיפוח אצל נערות.
אני ממליץ לייצר סדרת פוסטים שמורידה לחץ ולא מגבירה אותו.
יצרתי 3 כיוונים — אחד חינוכי, אחד רגשי, ואחד אמא-בת.
הפוסט השני הכי חזק לדעתי מבחינת conversion לניוזלטר.”