// index.js — Adjusted to return correct response format

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const fetchChatGPT = async (messages) => {
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages,
  });
  return completion.data.choices[0].message.content.trim();
};

app.post("/api/think", async (req, res) => {
  const { rootQuery } = req.body;
  if (!rootQuery) return res.status(400).json({ error: "Missing rootQuery" });

  try {
    // Initial context evaluation
    const identityMsg = await fetchChatGPT([
      {
        role: "user",
        content: `You are Simulon, based on the query: '${rootQuery}', complete this sentence exactly: You are a ...`,
      },
    ]);
    console.log("You are a", identityMsg);

    let context = [
      { role: "system", content: identityMsg },
      { role: "user", content: rootQuery },
    ];

    const results = [];

    for (let i = 0; i < 10; i++) {
      const followUpPrompt = [
        ...context,
        {
          role: "user",
          content:
            "Based on our conversation, generate a single intelligent follow-up question.",
        },
      ];

      const followUpQ = await fetchChatGPT(followUpPrompt);

      const answerPrompt = [
        { role: "system", content: "Respond concisely in about 10 lines." },
        { role: "user", content: followUpQ },
      ];

      const answer = await fetchChatGPT(answerPrompt);
      results.push({ q: followUpQ, a: answer });

      // Optional: reevaluate identity
      const newIdentity = await fetchChatGPT([
        {
          role: "user",
          content: `You are Simulon, based on the question '${followUpQ}' and answer '${answer}', complete this sentence exactly: You are a ...`,
        },
      ]);
      console.log("You are a", newIdentity);

      context.push({ role: "assistant", content: followUpQ });
      context.push({ role: "assistant", content: answer });
    }

    res.json({ results });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Simulon server listening on http://localhost:${port}`);
});
