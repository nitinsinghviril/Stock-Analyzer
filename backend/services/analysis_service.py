"""Pure indicator maths on a pandas Series of closing prices.

Kept free of network calls so it can be tested with synthetic data.
"""

import pandas as pd


def sma(close: pd.Series, window: int) -> pd.Series:
    return close.rolling(window=window).mean()


def rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(window=window).mean()
    loss = (-delta.clip(upper=0)).rolling(window=window).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    fast_ema = close.ewm(span=fast, adjust=False).mean()
    slow_ema = close.ewm(span=slow, adjust=False).mean()
    line = fast_ema - slow_ema
    signal_line = line.ewm(span=signal, adjust=False).mean()
    return line, signal_line, line - signal_line


def bollinger(close: pd.Series, window: int = 20, num_std: float = 2.0):
    middle = close.rolling(window=window).mean()
    std = close.rolling(window=window).std()
    return middle + num_std * std, middle, middle - num_std * std


def _last(series: pd.Series):
    value = series.dropna()
    return round(float(value.iloc[-1]), 2) if not value.empty else None


def technical_summary(close: pd.Series) -> dict:
    """Latest value of each indicator plus a plain-language signal per indicator."""
    price = float(close.iloc[-1])
    sma20, sma50, sma200 = _last(sma(close, 20)), _last(sma(close, 50)), _last(sma(close, 200))
    rsi_value = _last(rsi(close))
    macd_line, macd_signal, macd_hist = macd(close)
    upper, middle, lower = bollinger(close)

    signals = {}
    if sma50 is not None and sma200 is not None:
        signals["trend"] = "bullish" if sma50 > sma200 else "bearish"
    if rsi_value is not None:
        signals["rsi"] = "overbought" if rsi_value >= 70 else "oversold" if rsi_value <= 30 else "neutral"
    macd_value, macd_sig_value = _last(macd_line), _last(macd_signal)
    if macd_value is not None and macd_sig_value is not None:
        signals["macd"] = "bullish" if macd_value > macd_sig_value else "bearish"
    upper_value, lower_value = _last(upper), _last(lower)
    if upper_value is not None and lower_value is not None:
        signals["bollinger"] = (
            "overbought" if price >= upper_value else "oversold" if price <= lower_value else "neutral"
        )

    return {
        "price": round(price, 2),
        "sma": {"20": sma20, "50": sma50, "200": sma200},
        "rsi": rsi_value,
        "macd": {"line": macd_value, "signal": macd_sig_value, "histogram": _last(macd_hist)},
        "bollinger": {"upper": upper_value, "middle": _last(middle), "lower": lower_value},
        "signals": signals,
    }
