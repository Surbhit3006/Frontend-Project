import express from "express"; 
import { GoogleGenAI } from "@google/genai"; 
import "dotenv/config"; 
const app = express(); 
app.use(express.json()); 
const ai = new GoogleGenAI({}); 
// POST /ask { "prompt": "your question" } 
app.post("/ask", async (req, res) => { 
try { 
const { prompt } = req.body; 
if (!prompt) { 
return res.status(400).json({ error: "prompt is required" }); 
} 
const response = await ai.models.generateContent({ 
model: "gemini-3.6-flash", 
contents: prompt, 
}); 
res.json({ answer: response.text }); 
} catch (err) { 
console.error(err); 
res.status(500).json({ error: "Something went wrong" }); 
} 
}); 
const PORT = 3000; 
app.listen(PORT, () => 
console.log(`Server running on http://localhost:${PORT}`) 
);
