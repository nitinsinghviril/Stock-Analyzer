"""Fundamental metrics pulled from the yfinance info dictionary."""

from services.stock_service import get_info


def _round(value, digits: int = 2):
    return round(float(value), digits) if isinstance(value, (int, float)) else None


def fundamentals(ticker: str) -> dict:
    info = get_info(ticker)
    debt_to_equity = info.get("debtToEquity")
    return {
        "name": info.get("longName") or info.get("shortName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": _round(info.get("trailingPE")),
        "forward_pe": _round(info.get("forwardPE")),
        "pb_ratio": _round(info.get("priceToBook")),
        "eps": _round(info.get("trailingEps")),
        "roe_pct": _round(info.get("returnOnEquity", 0) * 100) if info.get("returnOnEquity") is not None else None,
        # Yahoo reports debt-to-equity as a percentage (e.g. 45.2 means 0.452x).
        "debt_to_equity": _round(debt_to_equity / 100) if isinstance(debt_to_equity, (int, float)) else None,
        "current_ratio": _round(info.get("currentRatio")),
        "revenue_growth_pct": _round(info.get("revenueGrowth", 0) * 100) if info.get("revenueGrowth") is not None else None,
        "earnings_growth_pct": _round(info.get("earningsGrowth", 0) * 100) if info.get("earningsGrowth") is not None else None,
        "dividend_yield_pct": _round(info.get("dividendYield")),
        "week52_high": _round(info.get("fiftyTwoWeekHigh")),
        "week52_low": _round(info.get("fiftyTwoWeekLow")),
    }
