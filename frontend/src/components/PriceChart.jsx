// Minimal SVG line chart of closing prices with the 50-day average overlaid.
export default function PriceChart({ data }) {
  if (!data || data.length < 2) return null;

  const width = 720;
  const height = 240;
  const values = data.flatMap((d) => [d.close, d.sma50].filter((v) => v != null));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i) => (i / (data.length - 1)) * width;
  const y = (v) => height - ((v - min) / (max - min || 1)) * height;

  // Each run of values starts with M and continues with L; a gap starts a new run.
  const path = (key) => {
    let command = "M";
    return data
      .map((d, i) => {
        if (d[key] == null) {
          command = "M";
          return null;
        }
        const segment = `${command}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`;
        command = "L";
        return segment;
      })
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Price chart">
        <path d={path("close")} className="line-price" />
        <path d={path("sma50")} className="line-sma" />
      </svg>
      <div className="legend">
        <span className="swatch price" /> Close <span className="swatch sma" /> 50-day average
      </div>
    </div>
  );
}
