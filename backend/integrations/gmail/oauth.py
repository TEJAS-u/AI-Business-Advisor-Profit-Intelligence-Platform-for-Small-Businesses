import os
from google_auth_oauthlib.flow import Flow
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_GMAIL_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_GMAIL_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_GMAIL_REDIRECT_URI")

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly"
]


def create_gmail_flow(state=None):
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GMAIL_SCOPES,
        state=state,
    )

    flow.redirect_uri = GOOGLE_REDIRECT_URI

    return flow


def create_authorization_flow():
    flow = create_gmail_flow()

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    return flow, authorization_url, state