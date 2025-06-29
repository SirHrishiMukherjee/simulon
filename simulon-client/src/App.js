import React, { useState } from "react";
import "./index.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(false);

  const startLoop = () => {
    if (!query.trim()) return;
    setLoading(true);
    setThoughts([]); // Reset thoughts before starting the loop

    // Create a new EventSource to listen for SSE data
    const eventSource = new EventSource(`https://simulon-api.onrender.com/api/think`, {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    eventSource.onmessage = function (event) {
      const data = JSON.parse(event.data);
      if (data === "[DONE]") {
        eventSource.close(); // Close connection after all messages are sent
        setLoading(false);
      } else {
        setThoughts((prevThoughts) => [...prevThoughts, data]); // Append each new QA pair
      }
    };

    eventSource.onerror = function (error) {
      console.error("Error in SSE:", error);
      setLoading(false);
    };
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
        {thoughts.map((t, idx) => {
          if (!t || !t.q || !t.a) return null; // Skip rendering incomplete data
          return (
            <div key={idx} className="mb-6 border-b border-gray-700 pb-4">
              <p className="text-sm text-gray-400">💭 {t.q}</p>
              <p className="mt-2 whitespace-pre-wrap">{t.a}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
