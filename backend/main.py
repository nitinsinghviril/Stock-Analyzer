import math

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS
from services import analysis_service
from services.competitor_service import competitors
from services.fundamentals_service import fundamentals
from services.news_service import latest_news
from services.stock_service import InvalidTicker, clear_cache, get_history, normalise_ticker

ALLOWED_PERIODS = {"1mo", "3mo", "6mo", "1y", "2y", "5y"}
ALLOWED_INTERVALS = {"1d", "1wk", "1mo"}

app = FastAPI(title="Stock Analyzer API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def json_safe(value):
    """Replace NaN and infinity with None; JSON cannot represent them."""
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    return value


def _resolve(raw: str) -> str:
    try:
        return normalise_ticker(raw)
    except InvalidTicker as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _history(ticker: str, period: str, interval: str = "1d"):
    if period not in ALLOWED_PERIODS:
        raise HTTPException(status_code=400, detail=f"period must be one of {sorted(ALLOWED_PERIODS)}")
    if interval not in ALLOWED_INTERVALS:
        raise HTTPException(status_code=400, detail=f"interval must be one of {sorted(ALLOWED_INTERVALS)}")
    # yfinance can return a trailing row with no close yet; drop it so the
    # latest price and every indicator use real values.
    history = get_history(ticker, period, interval).dropna(subset=["Close"])
    if history.empty:
        raise HTTPException(status_code=404, detail=f"No market data for {ticker}")
    return history


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/analyze/{raw_ticker}")
def analyze(raw_ticker: str):
    ticker = _resolve(raw_ticker)
    history = _history(ticker, "1y")
    return json_safe({
        "ticker": ticker,
        "technical": analysis_service.technical_summary(history["Close"]),
        "fundamentals": fundamentals(ticker),
        "news": latest_news(ticker),
    })


@app.get("/api/competitors/{raw_ticker}")
def competitor_view(raw_ticker: str):
    ticker = _resolve(raw_ticker)
    return json_safe({"ticker": ticker, **competitors(ticker)})


@app.get("/api/chart/{raw_ticker}")
def chart(raw_ticker: str, period: str = Query("1y"), interval: str = Query("1d")):
    ticker = _resolve(raw_ticker)
    history = _history(ticker, period, interval)
    indicators = analysis_service.chart_indicators(history["Close"])
    rows = []
    for index, row in history.iterrows():
        entry = {
            "date": index.strftime("%Y-%m-%d"),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        }
        for name, value in indicators.loc[index].items():
            entry[name] = round(float(value), 2)
        rows.append(entry)
    return json_safe({"ticker": ticker, "period": period, "interval": interval, "data": rows})


@app.post("/api/cache/clear")
def refresh_cache():
    clear_cache()
    return {"cleared": True}
