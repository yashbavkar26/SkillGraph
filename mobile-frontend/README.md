# SkillGraph Mobile

Flutter client for the SkillGraph backend.

## Run

```bash
flutter pub get
flutter run
```

## Backend URL on phone

1. Start backend on your laptop, typically `http://0.0.0.0:3000`.
2. Make sure phone and laptop are on the same Wi-Fi/LAN.
3. In the app (login screen or dashboard), tap `Change API URL`.
4. Set: `http://<your-laptop-lan-ip>:3000` (example `http://192.168.1.40:3000`).
5. Retry login/API calls.

Notes:
- Android emulator default is `http://10.0.2.2:3000`.
- API URL is saved in app storage and reused on next app launch.

## API coverage in Flutter

The app now includes all backend endpoint integrations:
- `GET /health`
- `POST /api/users`, `POST /api/users/register`, `POST /api/users/login`, `GET /api/users`, `GET /api/users/:id`
- `POST /api/skills`, `GET /api/skills`, `GET /api/skills/:id`, `GET /api/skills/:id/history`
- `POST /api/relationships`, `GET /api/relationships/users/:userId/skills`
- `POST /api/evidence`, `GET /api/evidence/:userId`
- `POST /api/endorse`, `GET /api/endorse/:userId`
- `POST /api/assessment/ingest`
- `POST /api/recruiter/search`

Use the in-app `API Workbench` button in the dashboard to hit these endpoints directly.
