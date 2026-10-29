import { useEffect, useRef } from "react";

// Embeds a TradingView widget using its standard script embed format.
// `script` is the widget name, e.g. "embed-widget-advanced-chart".
export default function TradingViewWidget({ script, config, height = 450 }) {
  const ref = useRef(null);
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    container.appendChild(widget);

    const embed = document.createElement("script");
    embed.src = `https://s3.tradingview.com/external-embedding/${script}.js`;
    embed.async = true;
    embed.innerHTML = configJson;
    container.appendChild(embed);

    return () => {
      container.innerHTML = "";
    };
  }, [script, configJson]);

  return <div ref={ref} className="tradingview-widget-container" style={{ height }} />;
}
