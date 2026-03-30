import os
import json
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/yt-analytics.readonly"]
TOKEN_PATH = "youtube_token.json"


def get_credentials():
    creds = None

    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            client_secret_json = os.getenv("GOOGLE_CLIENT_SECRET_JSON")
            if not client_secret_json:
                raise ValueError("Missing GOOGLE_CLIENT_SECRET_JSON in .env")
            client_config = json.loads(client_secret_json)
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "w") as f:
            f.write(creds.to_json())

    return creds


def get_youtube_analytics(start_date="2024-01-01", end_date="2024-12-31"):
    creds = get_credentials()
    service = build("youtubeAnalytics", "v2", credentials=creds)

    return service.reports().query(
        ids="channel==MINE",
        startDate=start_date,
        endDate=end_date,
        metrics="views,estimatedMinutesWatched,averageViewDuration,subscribersGained",
    ).execute()


if __name__ == "__main__":
    import json
    result = get_youtube_analytics()
    print(json.dumps(result, indent=2, ensure_ascii=False))
