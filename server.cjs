
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(__dirname));

// Gemini setup
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        server: "MindSpace",
        geminiConfigured: Boolean(ai)
    });
});

// AI journal analysis
app.post("/api/analyse", async (req, res) => {
    console.log("Received journal analysis request.");

    try {
        const { journalText } = req.body || {};

        if (!journalText || !journalText.trim()) {
            return res.status(400).json({
                error: "Please provide journal text."
            });
        }

        if (journalText.length > 5000) {
            return res.status(400).json({
                error: "Journal entry is too long. Maximum 5000 characters."
            });
        }

        if (!ai) {
            return res.status(500).json({
                error: "Gemini API key is missing. Check your .env file."
            });
        }

        const prompt = `
You are MindSpace, a friendly and supportive journaling assistant.

Read the following journal entry and provide:
1. A brief understanding of the user's feelings.
2. Two or three helpful observations.
3. One small, practical suggestion for today.

Be warm, empathetic, clear and non-judgmental.
Do not diagnose mental health conditions.
Do not make assumptions beyond what the user has written.

Journal entry:
${journalText}
`;

        console.log("Sending request to Gemini...");

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt
        });

        const result =
            typeof response.text === "function"
                ? response.text()
                : response.text;

        if (!result || !String(result).trim()) {
            console.error("Gemini returned no text:", response);

            return res.status(502).json({
                error: "Gemini returned an empty response. Please try again."
            });
        }

        console.log("Gemini analysis successful.");

        return res.status(200).json({
            success: true,
            result: String(result).trim()
        });

    } catch (error) {
        console.error("GEMINI BACKEND ERROR:", error);

        return res.status(500).json({
            error: error.message || "AI analysis failed. Please try again."
        });
    }
});

// Handle invalid routes
app.use((req, res) => {
    res.status(404).json({
        error: "Requested API route was not found."
    });
});

app.listen(PORT, () => {
    console.log("MindSpace server is running!");
    console.log(`Open: http://localhost:${PORT}`);
});
