"""Market data from Yahoo Finance via yfinance.

Indian listings use the .NS (NSE) or .BO (BSE) suffix, e.g. TCS.NS.
Results are cached in memory for CACHE_TTL_SECONDS to avoid hammering the source.
"""

import logging
import re
import time

import pandas as pd
import yfinance as yf

from config import CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)
TICKER_PATTERN = re.compile(r"^[A-Z0-9&\-]{1,15}(\.(NS|BO))?$")
_cache: dict[tuple, tuple[float, object]] = {}


class InvalidTicker(ValueError):
    pass


def normalise_ticker(raw: str) -> str:
    ticker = raw.strip().upper()
    if not TICKER_PATTERN.match(ticker):
        raise InvalidTicker(f"Invalid ticker: {raw!r}")
    # Default to NSE for bare symbols so "TCS" means TCS.NS.
    return ticker if "." in ticker else f"{ticker}.NS"


def _cached(key: tuple, loader):
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < CACHE_TTL_SECONDS:
        return hit[1]
    value = loader()
    _cache[key] = (now, value)
    return value


def clear_cache() -> None:
    _cache.clear()


def get_history(ticker: str, period: str = "1y") -> pd.DataFrame:
    def load():
        return yf.Ticker(ticker).history(period=period, auto_adjust=True)

    return _cached(("history", ticker, period), load)


def get_info(ticker: str) -> dict:
    def load():
        try:
            info = yf.Ticker(ticker).info or {}
        except Exception:
            logger.exception("Company info failed for %s", ticker)
            return {}
        if not info:
            logger.warning("Yahoo returned no company info for %s", ticker)
        return info

    return _cached(("info", ticker), load)


def get_news(ticker: str, limit: int = 8) -> list[dict]:
    def load():
        try:
            items = yf.Ticker(ticker).news or []
        except Exception:
            logger.exception("News failed for %s", ticker)
            return []
        if not items:
            logger.warning("Yahoo returned no news for %s", ticker)
        news = []
        for item in items[:limit]:
            content = item.get("content", item)
            url = (content.get("canonicalUrl") or {}).get("url") or content.get("link")
            news.append({
                "title": content.get("title"),
                "publisher": (content.get("provider") or {}).get("displayName") or content.get("publisher"),
                "url": url,
            })
        return news

    return _cached(("news", ticker), load)
