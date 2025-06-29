// simulon-server/index.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utility to get a context string
const getContext = async (content) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content:
          `Given the following query or dialogue, respond with "You are a ..." followed by a concise AI persona description. Just the sentence starting with "You are a ...".\n\nQuery:\n${content}`,
      },
    ],
  });

  const result = response.choices?.[0]?.message?.content?.trim();
  console.log("🧠 Context set:", result);
  return result || "You are a helpful assistant.";
};

app.post("/api/think", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "No query provided." });
  }

  try {
    const contextLine = await getContext(query);

    const baseMessages = [
      { role: "system", content: contextLine },
      { role: "user", content: query },
    ];

    const qaPairs = [];
    let currentContext = [...baseMessages];

    // Set up a response stream
    res.setHeader('Content-Type', 'application/json');
    res.write('{"results":['); // Start of the JSON array

    let first = true;
    for (let i = 0; i < 10; i++) {
      // Ask for follow-up question
      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          ...currentContext,
          {
            role: "user",
            content: "Based on our conversation, generate a follow-up question.",
          },
        ],
      });

      const followUp = followUpResponse.choices?.[0]?.message?.content?.trim();

      // Ask for the answer
      const answerResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Respond in a clear paragraph." },
          { role: "user", content: followUp },
        ],
      });

      const answer = answerResponse.choices?.[0]?.message?.content?.trim();

      qaPairs.push({ q: followUp, a: answer });

      currentContext.push({ role: "user", content: followUp });
      currentContext.push({ role: "assistant", content: answer });

      // Send each result progressively
      if (!first) {
        res.write(','); // Add a comma between results
      }

      res.write(JSON.stringify({ q: followUp, a: answer }));
      first = false;

      // Optionally re-evaluate context at each step
      const newContextLine = await getContext(followUp + "\n" + answer);
      currentContext.unshift({ role: "system", content: newContextLine });

      // Simulate delay between questions/answers
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
    }

    res.write(']}'); // End of the JSON array
    res.end();

  } catch (err) {
    console.error("Error in /api/think:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Simulon server listening on http://localhost:${port}`);
});
