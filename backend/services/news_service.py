"""Recent headlines for a ticker, via yfinance's news feed."""

from services.stock_service import get_news


def latest_news(ticker: str) -> list[dict]:
    return get_news(ticker)
