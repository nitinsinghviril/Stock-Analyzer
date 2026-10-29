"""Compare a stock with the peers yfinance lists for the same industry."""

from services.fundamentals_service import fundamentals
from services.stock_service import get_info

MAX_PEERS = 4


def competitors(ticker: str) -> dict:
    info = get_info(ticker)
    # yfinance does not expose a peer list, so peers come from curated maps.
    # Ticker is checked first because Yahoo's industry field is often empty.
    peers = PEERS_BY_TICKER.get(ticker) or PEERS_BY_INDUSTRY.get(info.get("industry") or "", [])
    rows = []
    for peer in [p for p in peers if p != ticker][:MAX_PEERS]:
        data = fundamentals(peer)
        rows.append({
            "ticker": peer,
            "name": data["name"],
            "market_cap": data["market_cap"],
            "pe_ratio": data["pe_ratio"],
            "roe_pct": data["roe_pct"],
            "debt_to_equity": data["debt_to_equity"],
        })
    return {"industry": info.get("industry"), "peers": rows}


PEERS_BY_TICKER = {
    "TCS.NS": ["INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS"],
    "INFY.NS": ["TCS.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS"],
    "WIPRO.NS": ["TCS.NS", "INFY.NS", "HCLTECH.NS", "TECHM.NS"],
    "HCLTECH.NS": ["TCS.NS", "INFY.NS", "WIPRO.NS", "TECHM.NS"],
    "TECHM.NS": ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS"],
    "RELIANCE.NS": ["IOC.NS", "BPCL.NS", "HINDPETRO.NS", "ONGC.NS"],
    "HDFCBANK.NS": ["ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "SBIN.NS"],
    "ICICIBANK.NS": ["HDFCBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "SBIN.NS"],
    "KOTAKBANK.NS": ["HDFCBANK.NS", "ICICIBANK.NS", "AXISBANK.NS", "SBIN.NS"],
    "AXISBANK.NS": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS"],
    "SBIN.NS": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS"],
}


PEERS_BY_INDUSTRY = {
    "Information Technology Services": ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS"],
    "Oil & Gas Refining & Marketing": ["RELIANCE.NS", "IOC.NS", "BPCL.NS", "HINDPETRO.NS"],
    "Banks—Regional": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "SBIN.NS"],
    "Banks - Regional": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "SBIN.NS"],
}
