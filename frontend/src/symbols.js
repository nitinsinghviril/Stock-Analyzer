// Map our ticker format (TCS.NS, TCS.BO) to TradingView's (NSE:TCS, BSE:TCS).
export function toTradingViewSymbol(ticker) {
  if (ticker.endsWith(".BO")) return `BSE:${ticker.slice(0, -3)}`;
  return `NSE:${ticker.replace(/\.NS$/, "")}`;
}
