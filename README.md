# Stock Analyzer

Look up an NSE or BSE listed stock and see its price chart, technical indicators,
fundamentals, peer comparison and recent news.

- **Backend:** FastAPI + yfinance (`backend/`)
- **Frontend:** React + Vite (`frontend/`)

Market data comes from Yahoo Finance and may be delayed. This is not investment advice.

## Run locally

Backend (port 8000):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend (port 5173, proxies `/api` to the backend):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and try `TCS`, `RELIANCE` or `TCS.BO` (BSE).

## Tests

```bash
cd backend && python3 -m pytest -q tests
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness check |
| GET | `/api/analyze/{ticker}` | Technicals, fundamentals and news |
| GET | `/api/chart/{ticker}?period=1y` | OHLCV rows with 50-day average |
| GET | `/api/competitors/{ticker}` | Peer comparison for the industry |
| POST | `/api/cache/clear` | Drop cached market data |

Bare symbols default to NSE (`TCS` → `TCS.NS`). Use `.BO` for BSE.

## Configuration

Backend environment variables:

| Variable | Default | Notes |
|----------|---------|-------|
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `CACHE_TTL_SECONDS` | `300` | How long market data is cached in memory |

Frontend: set `VITE_API_URL` to the backend origin for production builds.

## Deploy on Render

1. **Backend:** New Web Service, root directory `backend`, build command
   `pip install -r requirements.txt`, start command
   `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `ALLOWED_ORIGINS` to your frontend URL.
2. **Frontend:** New Static Site, root directory `frontend`, build command
   `npm install && npm run build`, publish directory `dist`. Set `VITE_API_URL` to the backend URL.

## Known limits

- Peer groups come from a small hand-maintained map in
  `backend/services/competitor_service.py`. Industries not in the map show no peers.
- Cache is in memory, so each backend instance keeps its own copy.
