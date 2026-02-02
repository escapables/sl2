# AGENTS.md

Detta dokument är för AI‑agenter som ska arbeta i projektet. All information nedan är baserad på innehållet i repot.

**Projektöversikt**
`resrobot-bättre` är en lättviktig webbdashboard för att hitta kollektivtrafikrutter i Sverige. Den består av en liten Flask‑backend som proxyar ResRobot‑API:t och en frontend i ren HTML/CSS/JavaScript. Frontenden visar rutter, sökförslag, närliggande hållplatser och alternativa avgångar.

**Teknisk stack och körning**
- Backend: Python + Flask (`app.py`)
- HTTP‑klient: `requests`
- Frontend: Vanilla JS (`static/app.js`), HTML‑mall (`templates/index.html`), CSS (`static/style.css`)
- ResRobot API v2.1 (Trafiklab) används via backend‑proxy.

**Projektstruktur och moduler**
- `app.py`: Flask‑app och alla API‑slutpunkter.
- `templates/index.html`: Huvudsida (serveras av Flask).
- `static/app.js`: All frontendlogik (sök, rutter, modaler, API‑nyckelhantering, alternativa avgångar).
- `static/style.css`: UI‑stilar.

**Viktiga konfigurationsfiler**
- `requirements.txt`: Python‑beroenden (`flask`, `requests`).
- `README.md`: Projektbeskrivning, användning och API‑slutpunkter.

**Bygg och test**
Kör lokalt:
```bash
pip install -r requirements.txt
python app.py
```
Appen startar en Flask‑server på port `5000` (debug=True).

Test‑beroenden:
```bash
pip install -r requirements-dev.txt
```

Backend‑tester:
```bash
pytest
```

Frontend‑tester (E2E, Playwright):
```bash
npm install
npm run test:e2e
```

Kör allt (backend + frontend):
```bash
npm run test
```

Obs: E2E‑testerna förutsätter att appen körs lokalt på http://localhost:5000.
Obs: Ruttkort måste expanderas för att leg‑sträckor ska vara klickbara (samma gäller i E2E‑tester).

**Runtime‑arkitektur**
- Webbläsaren anropar Flask‑backendens API‑slutpunkter under `/api/*`.
- Flask‑backend proxyar vidare till ResRobot API (`https://api.resrobot.se/v2.1`) och returnerar JSON till frontend.

**API‑slutpunkter (backend)**
Alla slutpunkter förväntar headern `X-API-Key`:
- `GET /api/search?q=...`
- `GET /api/nearby?lat=...&lon=...`
- `GET /api/route?from=...&to=...&date=...&time=...`
- `GET /api/departures?id=...&date=...&time=...&duration=...&maxJourneys=...`
- `POST /api/validate-key`

**Kod‑ och stilkonventioner**
- Språket i kommentarer och UI‑text är huvudsakligen svenska.
- Frontenden är skriven utan ramverk; DOM‑manipulation sker i `static/app.js`.
- Backend returnerar JSON‑fel med relevanta HTTP‑statuskoder, men `/api/route` kan returnera 200 även vid fel för att frontend ska hantera det.

**Testning**
- Backend: `tests/test_api.py` med pytest + mockade ResRobot‑svar.
- Frontend: `tests/e2e/routes.spec.js` med Playwright som mockar `/api/*`‑svar.

**Säkerhet och nyckelhantering**
- API‑nyckeln skickas från frontend till backend i headern `X-API-Key`.
- Nyckeln kan sparas i `localStorage` i obfuskerad form (XOR + Base64) eller bara i minnet för sessionen.
- Obfuskering är inte kryptering; se README för användarvarning.

**Deployment**
Inga specifika deploy‑instruktioner eller konfigurationsfiler hittades.
