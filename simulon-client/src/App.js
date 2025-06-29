import React, { useState } from "react";
import "./index.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFromBackend = async (query) => {
    const response = await fetch("https://simulon-api.onrender.com/api/think", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.results; // The result will be an array of question/answer pairs
  };

  const startLoop = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const results = await fetchFromBackend(query);

      if (!Array.isArray(results)) {
        throw new Error("Unexpected response format");
      }

      let idx = 0;

      // Set interval to update thoughts one by one
      const intervalId = setInterval(() => {
        if (idx < results.length) {
          setThoughts((prevThoughts) => [...prevThoughts, results[idx]]);
          idx++;
        } else {
          clearInterval(intervalId); // Stop the interval once all results are added
        }
      }, 1000); // Updates every second (you can adjust this speed)

    } catch (error) {
      console.error("API error:", error);
      setThoughts([
        { q: "(Failed to fetch response)", a: "(Failed to fetch response)" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") startLoop();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-16 px-4">
      <img src="/simulon-logo.png" alt="Simulon Logo" className="w-28 h-auto mb-4 drop-shadow-lg" />
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
