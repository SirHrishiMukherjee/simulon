import React, { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import "./index.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(uuidv4());

  const fetchFromBackend = async (queryOrMessages, isRawMessage = false) => {
    try {
      const body = isRawMessage
        ? { sessionId: sessionId.current, messages: JSON.parse(queryOrMessages) }
        : { sessionId: sessionId.current, query: queryOrMessages };

      const response = await fetch("http://localhost:5000/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data.result?.trim() || "(No response)";
    } catch (error) {
      console.error("Fetch error:", error);
      return "(Failed to fetch response)";
    }
  };

  const startLoop = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const contextEvalPrompt = `Given the following input, describe the assistant's identity in the format: 'You are a ...'. Input: ${query}`;
    const systemMessage = await fetchFromBackend(contextEvalPrompt);
    let currentContext = [
      { role: "system", content: systemMessage },
      { role: "user", content: query },
    ];

    for (let i = 0; i < 10; i++) {
      const followupPrompt = [
        ...currentContext,
        { role: "user", content: "Based on our conversation so far, suggest a specific, intelligent follow-up question." },
      ];
      const newQuestion = await fetchFromBackend(JSON.stringify(followupPrompt), true);

      const answerPrompt = [
        ...currentContext,
        { role: "user", content: newQuestion },
        { role: "system", content: "Respond concisely in about 10 lines as a thoughtful paragraph." },
      ];
      const newAnswer = await fetchFromBackend(JSON.stringify(answerPrompt), true);

      setThoughts(prev => [...prev, { q: newQuestion, a: newAnswer }]);

      currentContext.push({ role: "user", content: newQuestion });
      currentContext.push({ role: "assistant", content: newAnswer });
    }

    setLoading(false);
    setQuery("");
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
