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

    let currentContext = [...baseMessages];

    // Set up SSE stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Necessary to send initial response headers

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

      // Send each question-answer pair to the client incrementally
      const message = JSON.stringify({ q: followUp, a: answer });

      // Write the message in SSE format
      res.write(`data: ${message}\n\n`);

      currentContext.push({ role: "user", content: followUp });
      currentContext.push({ role: "assistant", content: answer });

      // Optionally re-evaluate context at each step
      const newContextLine = await getContext(followUp + "\n" + answer);
      currentContext.unshift({ role: "system", content: newContextLine });

      // Simulate delay between questions/answers (optional)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
    }

    // End the SSE stream after all messages are sent
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error("Error in /api/think:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Simulon server listening on http://localhost:${port}`);
});
