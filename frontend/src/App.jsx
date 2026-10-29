import { useState } from "react";
import SearchBar from "./components/SearchBar.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [ticker, setTicker] = useState("");

  return (
    <main className="container">
      <header>
        <h1>Stock Analyzer</h1>
        <p className="muted">NSE/BSE listed stocks. Data from Yahoo Finance, may be delayed.</p>
      </header>
      <SearchBar onSearch={setTicker} />
      {ticker && <Dashboard key={ticker} ticker={ticker} onSelect={setTicker} />}
    </main>
  );
}
