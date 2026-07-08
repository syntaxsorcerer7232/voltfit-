var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const port = 3e3;
  app.use(import_express.default.json());
  app.get("/api/auth/url", (req, res) => {
    const { redirectUri } = req.query;
    const clientId = process.env.OAUTH_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "Spotify Client ID not configured on server." });
    }
    const scopes = [
      "user-read-currently-playing",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-library-read",
      "playlist-read-private",
      "playlist-read-collaborative"
    ].join(" ");
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    res.json({ url: spotifyAuthUrl });
  });
  app.post("/api/gemini", async (req, res) => {
    const { prompt, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured." });
    }
    try {
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        history: history || []
      });
      const result = await chat.sendMessage({ message: prompt });
      res.json({ text: result.text });
    } catch (error) {
      console.error("Gemini error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/recommendations", async (req, res) => {
    const { workoutHistory, activeFocus } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured." });
    }
    try {
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const prompt = `Based on the following workout history and user's active focus areas:
Focus Areas: ${activeFocus?.join(", ") || "General Fitness"}
Recent Workouts: ${JSON.stringify(workoutHistory || [])}

Provide exactly 2 or 3 short, actionable exercise or habit recommendations tailored to the user.
Return the output as a valid JSON array of objects with "name" and "reason" keys.
Format: [{"name": "Exercise Name", "reason": "Short reason"}]
Do not include any markdown formatting, backticks, or extra text.`;
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const recommendations = JSON.parse(result.text || "[]");
      res.json(recommendations);
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
