import json
import os
from anthropic import Anthropic
from dotenv import load_dotenv

# טוען את ה-.env
load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-haiku-4-5-20251001"

def generate_post(topic: str) -> str:
    prompt = f"""
כתוב פוסט ללינקדאין בעברית בנושא: {topic}

דרישות:
- כתוב בעברית בלבד
- טון מקצועי אך נגיש
- 3-5 פסקאות קצרות
- הוסף קריאה לפעולה בסוף

החזר JSON בלבד בפורמט:
{{
  "title": "",
  "post": "",
  "hashtags": []
}}
"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=800,
        temperature=0.7,
        system="אתה כותב תוכן מקצועי בעברית ללינקדאין בצורה בהירה, חדה ואמינה.",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.content[0].text


def extract_json(text: str):
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except Exception:
        return {"raw": text}


if __name__ == "__main__":
    raw = generate_post("בינה מלאכותית בדיאגנוסטיקה רפואית")
    parsed = extract_json(raw)

    print(json.dumps(parsed, indent=2, ensure_ascii=False))