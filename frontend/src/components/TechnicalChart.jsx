import { useEffect, useState } from "react";
import { chart } from "../api.js";

const PERIODS = ["1mo", "3mo", "6mo", "1y", "2y", "5y"];
const INTERVALS = [
  { value: "1d", label: "Daily" },
  { value: "1wk", label: "Weekly" },
  { value: "1mo", label: "Monthly" },
];
const OVERLAYS = [
  { key: "sma20", label: "SMA 20", color: "#f59e0b" },
  { key: "sma50", label: "SMA 50", color: "#16a34a" },
  { key: "sma200", label: "SMA 200", color: "#a855f7" },
  { key: "ema20", label: "EMA 20", color: "#06b6d4" },
  { key: "bollinger", label: "Bollinger", color: "#64748b" },
];
const PANELS = [
  { key: "volume", label: "Volume" },
  { key: "rsi", label: "RSI 14" },
  { key: "macd", label: "MACD 12/26/9" },
];

const WIDTH = 720;
const PRICE_HEIGHT = 320;
const PANEL_HEIGHT = 110;
const GAP = 14;

// Line path that starts a new subpath after every gap in the data.
function linePath(values, x, y) {
  let command = "M";
  return values
    .map((value, i) => {
      if (value == null) {
        command = "M";
        return null;
      }
      const segment = `${command}${x(i).toFixed(1)},${y(value).toFixed(1)}`;
      command = "L";
      return segment;
    })
    .filter(Boolean)
    .join(" ");
}

function scale(min, max, top, height) {
  const span = max - min || 1;
  return (value) => top + height - ((value - min) / span) * height;
}

function toggle(list, key) {
  return list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
}

export default function TechnicalChart({ ticker }) {
  const [period, setPeriod] = useState("1y");
  const [interval, setInterval] = useState("1d");
  const [overlays, setOverlays] = useState(["sma50"]);
  const [panels, setPanels] = useState(["volume"]);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setError(null);
    chart(ticker, period, interval)
      .then((data) => active && setRows(data.data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [ticker, period, interval]);

  const overlaySeries = (key) =>
    key === "bollinger" ? ["bb_upper", "bb_lower"] : [key];

  let chartBody = <p className="muted">Loading chart…</p>;
  if (error) chartBody = <p className="error-text">{error}</p>;
  if (rows && rows.length > 1) {
    const n = rows.length;
    const x = (i) => (i / (n - 1)) * WIDTH;
    const barWidth = Math.max(1, (WIDTH / n) * 0.6);

    const priceValues = rows.flatMap((r) =>
      [r.close, ...overlays.flatMap((key) => overlaySeries(key).map((s) => r[s]))].filter((v) => v != null)
    );
    const priceY = scale(Math.min(...priceValues), Math.max(...priceValues), 0, PRICE_HEIGHT);

    let top = PRICE_HEIGHT + GAP;
    const panelBlocks = panels.map((key) => {
      const block = { key, top };
      top += PANEL_HEIGHT + GAP;
      return block;
    });
    const totalHeight = top - GAP;

    chartBody = (
      <>
        <svg
          className="tech-chart"
          viewBox={`0 0 ${WIDTH} ${totalHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${ticker} chart`}
        >
          <path d={linePath(rows.map((r) => r.close), x, priceY)} className="line-price" />
          {overlays.flatMap((key) =>
            overlaySeries(key).map((series, idx) => (
              <path
                key={`${key}-${idx}`}
                d={linePath(rows.map((r) => r[series]), x, priceY)}
                fill="none"
                stroke={OVERLAYS.find((o) => o.key === key).color}
                strokeWidth="1.5"
                strokeDasharray={key === "bollinger" ? "4 3" : undefined}
              />
            ))
          )}

          {panelBlocks.map(({ key, top: panelTop }) => {
            const label = PANELS.find((p) => p.key === key).label;
            const frame = (
              <text x="6" y={panelTop + 14} className="panel-label">
                {label}
              </text>
            );

            if (key === "volume") {
              const maxVolume = Math.max(...rows.map((r) => r.volume)) || 1;
              const volumeY = scale(0, maxVolume, panelTop, PANEL_HEIGHT);
              return (
                <g key={key}>
                  {frame}
                  {rows.map((r, i) => (
                    <rect
                      key={r.date}
                      x={x(i) - barWidth / 2}
                      y={volumeY(r.volume)}
                      width={barWidth}
                      height={panelTop + PANEL_HEIGHT - volumeY(r.volume)}
                      className="bar-volume"
                    />
                  ))}
                </g>
              );
            }

            if (key === "rsi") {
              const rsiY = scale(0, 100, panelTop, PANEL_HEIGHT);
              return (
                <g key={key}>
                  {frame}
                  <line x1="0" x2={WIDTH} y1={rsiY(70)} y2={rsiY(70)} className="guide" />
                  <line x1="0" x2={WIDTH} y1={rsiY(30)} y2={rsiY(30)} className="guide" />
                  <path d={linePath(rows.map((r) => r.rsi), x, rsiY)} className="line-rsi" />
                </g>
              );
            }

            // MACD: histogram bars plus the MACD and signal lines.
            const macdValues = rows.flatMap((r) => [r.macd, r.macd_signal, r.macd_hist]).filter((v) => v != null);
            const macdY = scale(Math.min(...macdValues), Math.max(...macdValues), panelTop, PANEL_HEIGHT);
            const zeroY = macdY(0);
            return (
              <g key={key}>
                {frame}
                {rows.map((r, i) =>
                  r.macd_hist == null ? null : (
                    <rect
                      key={r.date}
                      x={x(i) - barWidth / 2}
                      y={Math.min(zeroY, macdY(r.macd_hist))}
                      width={barWidth}
                      height={Math.abs(zeroY - macdY(r.macd_hist))}
                      className={r.macd_hist >= 0 ? "bar-up" : "bar-down"}
                    />
                  )
                )}
                <path d={linePath(rows.map((r) => r.macd), x, macdY)} className="line-macd" />
                <path d={linePath(rows.map((r) => r.macd_signal), x, macdY)} className="line-signal" />
              </g>
            );
          })}
        </svg>
        <div className="legend">
          <span className="swatch price" /> Close
          {overlays.map((key) => {
            const o = OVERLAYS.find((item) => item.key === key);
            return (
              <span key={key}>
                <span className="swatch" style={{ background: o.color }} /> {o.label}
              </span>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div className="tech-chart-wrap">
      <div className="control-row">
        {PERIODS.map((p) => (
          <button key={p} className={p === period ? "pill active" : "pill"} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="control-row">
        {INTERVALS.map((i) => (
          <button
            key={i.value}
            className={i.value === interval ? "pill active" : "pill"}
            onClick={() => setInterval(i.value)}
          >
            {i.label}
          </button>
        ))}
      </div>
      <div className="control-row">
        {OVERLAYS.map((o) => (
          <button
            key={o.key}
            className={overlays.includes(o.key) ? "pill active" : "pill"}
            onClick={() => setOverlays(toggle(overlays, o.key))}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="control-row">
        {PANELS.map((p) => (
          <button
            key={p.key}
            className={panels.includes(p.key) ? "pill active" : "pill"}
            onClick={() => setPanels(toggle(panels, p.key))}
          >
            {p.label}
          </button>
        ))}
      </div>
      {chartBody}
    </div>
  );
}
