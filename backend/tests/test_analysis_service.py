import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import analysis_service as a  # noqa: E402
from services.stock_service import InvalidTicker, normalise_ticker  # noqa: E402


def test_sma_matches_manual_mean():
    close = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])
    assert a.sma(close, 3).iloc[-1] == pytest.approx(4.0)


def test_rsi_is_100_on_strictly_rising_prices():
    close = pd.Series(np.arange(1, 40, dtype=float))
    assert a.rsi(close).iloc[-1] == pytest.approx(100.0)


def test_rsi_is_0_on_strictly_falling_prices():
    close = pd.Series(np.arange(40, 1, -1, dtype=float))
    assert a.rsi(close).iloc[-1] == pytest.approx(0.0)


def test_bollinger_bands_bracket_middle():
    close = pd.Series(np.sin(np.arange(60)) + 100)
    upper, middle, lower = a.bollinger(close)
    assert (upper.dropna() >= middle.dropna()).all()
    assert (lower.dropna() <= middle.dropna()).all()


def test_technical_summary_reports_bullish_trend_on_rising_series():
    close = pd.Series(np.linspace(100, 300, 260))
    summary = a.technical_summary(close)
    assert summary["signals"]["trend"] == "bullish"
    assert summary["price"] == 300.0


def test_normalise_ticker_defaults_to_nse():
    assert normalise_ticker(" tcs ") == "TCS.NS"
    assert normalise_ticker("infy.bo") == "INFY.BO"


@pytest.mark.parametrize("bad", ["", "DROP TABLE", "A/B", "x" * 30])
def test_normalise_ticker_rejects_bad_input(bad):
    with pytest.raises(InvalidTicker):
        normalise_ticker(bad)


def test_json_safe_replaces_nan_and_infinity():
    from main import json_safe

    data = {"a": float("nan"), "b": [1.5, float("inf")], "c": {"d": None, "e": 2}}
    assert json_safe(data) == {"a": None, "b": [1.5, None], "c": {"d": None, "e": 2}}


def test_chart_indicators_returns_aligned_series():
    close = pd.Series(np.linspace(100, 300, 260))
    frame = a.chart_indicators(close)
    assert list(frame.index) == list(close.index)
    for column in ["sma20", "sma50", "sma200", "ema20", "bb_upper", "bb_lower", "rsi", "macd", "macd_signal", "macd_hist"]:
        assert column in frame.columns
    assert frame["sma20"].iloc[-1] == pytest.approx(close.iloc[-20:].mean())
