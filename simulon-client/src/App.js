import React, { useState } from "react";
import "./index.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sessionId = crypto.randomUUID(); // simple unique session ID
  const apiBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

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

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.results)) {
      throw new Error("Unexpected response format");
    }

    return data.results;
  };

  const startLoop = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setThoughts([]);

    try {
      const results = await fetchFromBackend(query);
      setThoughts(results);
    } catch (err) {
      console.error("API error:", err);
      setError("💥 Failed to fetch response from server.");
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

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-10 w-full max-w-2xl">
        {Array.isArray(thoughts) &&
          thoughts.map((t, idx) => (
            <div
              key={idx}
              className="mb-6 border-b border-gray-700 pb-4"
            >
              <p className="text-sm text-gray-400">💭 {t.q}</p>
              <p className="mt-2 whitespace-pre-wrap">{t.a}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
