import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const contextStore = new Map(); // Map of sessionId -> message history

app.post("/api/think", async (req, res) => {
  const { sessionId, query, messages } = req.body;

  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  let context = contextStore.get(sessionId) || [
    { role: "system", content: "You are Simulon, a mind-expanding AI." }
  ];

  if (query) {
    context.push({ role: "user", content: query });
  } else if (messages) {
    context = messages;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: context,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    context.push({ role: "assistant", content: reply });
    contextStore.set(sessionId, context);

    if (reply.startsWith("You are a") || reply.startsWith("You are an")) {
      console.log(`[Context Evaluation] ${reply}`);
    }

    res.json({ result: reply });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Simulon server listening on http://localhost:${port}`);
});
