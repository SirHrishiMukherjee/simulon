import React, { useState, useEffect } from "react";
import "./index.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    // Generate a unique session ID on load
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
  }, []);

  const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const fetchFromBackend = async (rootQuery) => {
    const response = await fetch(`${apiBase}/api/think`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        rootQuery,
      }),
    });

    const data = await response.json();
    return data.results; // array of { q, a }
  };

  const startLoop = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await fetchFromBackend(query);
      setThoughts(results);
    } catch (err) {
      setThoughts([
        ...thoughts,
        { q: "(Failed to fetch response)", a: "(Failed to fetch response)" },
      ]);
      console.error("Fetch error:", err);
    }
    setLoading(false);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") startLoop();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-16 px-4">
      <img
        src="/simulon-logo.png"
        alt="Simulon Logo"
        className="w-28 h-auto mb-4 drop-shadow-lg"
      />
      <h1 className="text-3xl font-bold mb-6">Simulon</h1>

      <input
        type="text"
        placeholder="What are you thinking?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl p-3 rounded text-black"
      />

      <button
        onClick={startLoop}
        disabled={loading}
        className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
      >
        {loading ? "Thinking..." : "Think"}
      </button>

      <div className="mt-10 w-full max-w-2xl">
        {thoughts.map((t, idx) => (
          <div key={idx} className="mb-6 border-b border-gray-700 pb-4">
            <p className="text-sm text-gray-400">💭 {t.q}</p>
            <p className="mt-2 whitespace-pre-wrap">{t.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
