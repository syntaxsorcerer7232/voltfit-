import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Spotify Auth URL helper
  app.get('/api/auth/url', (req, res) => {
    const { redirectUri } = req.query;
    const clientId = process.env.OAUTH_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: 'Spotify Client ID not configured on server.' });
    }

    const scopes = [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-library-read',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri as string)}`;
    
    res.json({ url: spotifyAuthUrl });
  });

  // Gemini Chat Proxy
  app.post('/api/chat', async (req, res) => {
    const { prompt, history, systemInstruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    try {
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        history: history || [],
        config: {
          systemInstruction: systemInstruction || "You are a professional fitness trainer and anatomy expert."
        }
      });

      const result = await chat.sendMessage({ message: prompt });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Recommendations
  app.post('/api/recommendations', async (req, res) => {
    const { workoutHistory, activeFocus } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set');
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    try {
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `Based on the following workout history and user's active focus areas:
Focus Areas: ${activeFocus?.join(', ') || 'General Fitness'}
Recent Workouts: ${JSON.stringify(workoutHistory || [])}

Provide exactly 2 or 3 short, actionable exercise or habit recommendations tailored to the user.`;

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "reason"]
              }
            }
        }
      });

      const recommendations = JSON.parse(result.text || '[]');
      res.json(recommendations);
    } catch (error: any) {
      console.error('Recommendations error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Recovery Analysis
  app.post('/api/recovery-ai', async (req, res) => {
    const { factors, workoutHistory, supplementLogs } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set');
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    try {
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `As a professional high-performance athletic coach specializing in natural (drug-free) physiological limits, analyze the following recovery factors for an athlete.

Recovery Factors (0-100 scale):
- Time Since Last Workout: ${factors.timeSinceWorkout}%
- Muscle Soreness: ${factors.muscleSoreness}%
- Strength Performance (recent vs past): ${factors.strengthPerformance}%
- Sleep Quality: ${factors.sleepQuality}%
- Protein Intake (Amino Load): ${factors.proteinIntake}%
- Energy Levels (Glycogen Flux): ${factors.energyLevels}%
- Resting Heart Rate (Static Pulse): ${factors.restingHeartRate}%
- Joint/Connective Tissue Integrity: ${factors.jointFeel}%
- Mood & Motivation: ${factors.moodMotivation}%

Context:
Recent Workout Volume/Frequency: ${JSON.stringify(workoutHistory?.slice(-3) || [])}
Today's Supplement Protocols: ${JSON.stringify(supplementLogs || [])}

Your task:
1. Calculate a final "Combat Readiness Score" (0-100).
2. Provide a 1-2 sentence high-level status assessment.
3. Provide 3 specific, actionable tactical recommendations for today (e.g., intensity adjustments, nutritional tweaks, recovery modalities).`;

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                status: { type: Type.STRING },
                recommendations: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["score", "status", "recommendations"]
            }
        }
      });

      const recoveryAI = JSON.parse(result.text || '{}');
      res.json(recoveryAI);
    } catch (error: any) {
      console.error('Recovery AI error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
