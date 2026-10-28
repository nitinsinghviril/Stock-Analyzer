import { useState } from "react";

const QUICK = ["TCS", "RELIANCE", "INFY", "HDFCBANK", "ICICIBANK"];

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <div className="search">
      <form onSubmit={submit}>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ticker, e.g. TCS or TCS.BO"
          maxLength={20}
          aria-label="Stock ticker"
        />
        <button type="submit">Analyse</button>
      </form>
      <div className="quick">
        {QUICK.map((symbol) => (
          <button key={symbol} type="button" className="chip" onClick={() => onSearch(symbol)}>
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
