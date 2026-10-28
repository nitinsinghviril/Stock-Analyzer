import { useEffect, useState } from "react";
import { analyze, chart, competitors } from "../api.js";
import PriceChart from "./PriceChart.jsx";

const TABS = ["Overview", "Technical", "Fundamental", "Competitors", "News"];

const fmt = (value, suffix = "") => (value == null ? "—" : `${value}${suffix}`);
const fmtCap = (value) => {
  if (value == null) return "—";
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)} T`;
  if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)} B`;
  return `₹${(value / 1e6).toFixed(2)} M`;
};

export default function Dashboard({ ticker }) {
  const [tab, setTab] = useState("Overview");
  const [analysis, setAnalysis] = useState(null);
  const [prices, setPrices] = useState(null);
  const [peers, setPeers] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([analyze(ticker), chart(ticker)])
      .then(([analysisData, chartData]) => {
        setAnalysis(analysisData);
        setPrices(chartData.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [ticker]);

  useEffect(() => {
    if (tab === "Competitors" && peers === null) {
      competitors(ticker)
        .then(setPeers)
        .catch((err) => setPeers({ error: err.message }));
    }
  }, [tab, ticker, peers]);

  if (loading) return <p className="muted">Loading {ticker}…</p>;
  if (error) {
    return (
      <div className="card error">
        <p>{error}</p>
        <button onClick={load}>Retry</button>
      </div>
    );
  }

  const { technical, fundamentals: f, news } = analysis;

  return (
    <section className="card">
      <div className="dash-head">
        <div>
          <h2>{f.name || analysis.ticker}</h2>
          <p className="muted">{analysis.ticker}{f.sector ? ` · ${f.sector}` : ""}</p>
        </div>
        <button onClick={load}>Refresh</button>
      </div>

      <nav className="tabs">
        {TABS.map((name) => (
          <button key={name} className={name === tab ? "tab active" : "tab"} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </nav>

      {tab === "Overview" && (
        <>
          <div className="stats">
            <Stat label="Last price" value={`₹${technical.price}`} />
            <Stat label="Market cap" value={fmtCap(f.market_cap)} />
            <Stat label="P/E" value={fmt(f.pe_ratio)} />
            <Stat label="52-week range" value={`${fmt(f.week52_low)} – ${fmt(f.week52_high)}`} />
          </div>
          <PriceChart data={prices} />
        </>
      )}

      {tab === "Technical" && (
        <>
          <div className="stats">
            <Stat label="SMA 20" value={fmt(technical.sma["20"])} />
            <Stat label="SMA 50" value={fmt(technical.sma["50"])} />
            <Stat label="SMA 200" value={fmt(technical.sma["200"])} />
            <Stat label="RSI (14)" value={fmt(technical.rsi)} />
            <Stat label="MACD" value={fmt(technical.macd.line)} />
            <Stat label="Signal line" value={fmt(technical.macd.signal)} />
            <Stat label="Bollinger upper" value={fmt(technical.bollinger.upper)} />
            <Stat label="Bollinger lower" value={fmt(technical.bollinger.lower)} />
          </div>
          <h3>Signals</h3>
          <ul>
            {Object.entries(technical.signals).map(([name, signal]) => (
              <li key={name}>
                <strong>{name}</strong>: {signal}
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "Fundamental" && (
        <div className="stats">
          <Stat label="P/E (trailing)" value={fmt(f.pe_ratio)} />
          <Stat label="P/E (forward)" value={fmt(f.forward_pe)} />
          <Stat label="P/B" value={fmt(f.pb_ratio)} />
          <Stat label="EPS" value={fmt(f.eps)} />
          <Stat label="ROE" value={fmt(f.roe_pct, "%")} />
          <Stat label="Debt / equity" value={fmt(f.debt_to_equity)} />
          <Stat label="Current ratio" value={fmt(f.current_ratio)} />
          <Stat label="Revenue growth" value={fmt(f.revenue_growth_pct, "%")} />
          <Stat label="Earnings growth" value={fmt(f.earnings_growth_pct, "%")} />
          <Stat label="Dividend yield" value={fmt(f.dividend_yield_pct, "%")} />
        </div>
      )}

      {tab === "Competitors" && <CompetitorTable data={peers} />}

      {tab === "News" && (
        <ul className="news">
          {news.length === 0 && <li className="muted">No recent headlines.</li>}
          {news.map((item, i) => (
            <li key={i}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
              ) : (
                item.title
              )}
              {item.publisher && <span className="muted"> · {item.publisher}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompetitorTable({ data }) {
  if (!data) return <p className="muted">Loading peers…</p>;
  if (data.error) return <p className="error-text">{data.error}</p>;
  if (data.peers.length === 0) return <p className="muted">No peer group is mapped for this industry yet.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Market cap</th>
            <th>P/E</th>
            <th>ROE</th>
            <th>D/E</th>
          </tr>
        </thead>
        <tbody>
          {data.peers.map((peer) => (
            <tr key={peer.ticker}>
              <td>{peer.ticker}</td>
              <td>{fmtCap(peer.market_cap)}</td>
              <td>{fmt(peer.pe_ratio)}</td>
              <td>{fmt(peer.roe_pct, "%")}</td>
              <td>{fmt(peer.debt_to_equity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
