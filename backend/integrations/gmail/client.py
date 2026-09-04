import base64
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


def create_gmail_client(
    access_token: str,
    refresh_token: str | None = None,
    client_id: str | None = None,
    client_secret: str | None = None,
):
    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
    )

    return build("gmail", "v1", credentials=credentials)


def get_profile(gmail_service):
    return gmail_service.users().getProfile(userId="me").execute()


def list_messages(gmail_service, query=None, max_results=50):
    request = gmail_service.users().messages().list(
        userId="me",
        q=query,
        maxResults=max_results,
    )

    response = request.execute()

    return response.get("messages", [])


def get_message(gmail_service, message_id):
    return (
        gmail_service.users()
        .messages()
        .get(
            userId="me",
            id=message_id,
            format="full",
        )
        .execute()
    )


def get_attachment(gmail_service, message_id: str, attachment_id: str) -> bytes:
    """Download raw attachment bytes from Gmail message."""
    try:
        response = (
            gmail_service.users()
            .messages()
            .attachments()
            .get(userId="me", messageId=message_id, id=attachment_id)
            .execute()
        )
        data = response.get("data", "")
        if data:
            return base64.urlsafe_b64decode(data + "===")
    except Exception as e:
        print(f"[GmailClient Attachment Download Error]: {e}")
    return b""