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
      const ai = new GoogleGenAI({ apiKey });
      
      // Map history to the format expected by some models if needed, 
      // but for interactions.create, we can use previous_interaction_id if we had it.
      // Since we don't have it from the client, we'll construct a prompt that includes history context.
      
      let contextPrompt = "";
      if (history && history.length > 0) {
        contextPrompt = "Previous Conversation:\n" + history.map((m: any) => `${m.role}: ${m.parts[0].text}`).join('\n') + "\n\n";
      }
      contextPrompt += `User: ${prompt}`;

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: contextPrompt,
        system_instruction: systemInstruction || "You are a professional fitness trainer and anatomy expert.",
        generation_config: {
          max_output_tokens: 2048,
        }
      });

      res.json({ text: interaction.output_text });
    } catch (error: any) {
      res.json({ text: "I apologize, but my neural processing units are currently operating at maximum capacity (API rate limit). Please try again in a moment, and I'll be happy to assist you!" });
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
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Based on the following workout history and user's active focus areas:
Focus Areas: ${activeFocus?.join(', ') || 'General Fitness'}
Recent Workouts: ${JSON.stringify(workoutHistory || [])}

Provide exactly 2 or 3 short, actionable exercise or habit recommendations tailored to the user.`;

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: prompt,
        response_format: {
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
      });

      const recommendations = JSON.parse(interaction.output_text || '[]');
      res.json(recommendations);
    } catch (error: any) {
      // Fallback recommendations if rate limited or API fails
      const fallbackRecommendations = [
        { name: "Hydration Focus", reason: "Maintain optimal fluid intake for better recovery and performance." },
        { name: "Active Mobility", reason: "Include 10 minutes of dynamic stretching to improve joint health." }
      ];
      res.json(fallbackRecommendations);
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
      const ai = new GoogleGenAI({ apiKey });
      
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

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: prompt,
        response_format: {
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
      });

      const recoveryAI = JSON.parse(interaction.output_text || '{}');
      res.json(recoveryAI);
    } catch (error: any) {
      // Fallback data if rate limited or API fails
      const avgScore = Math.round(
        [
          factors.timeSinceWorkout,
          factors.muscleSoreness,
          factors.sleepQuality,
          factors.proteinIntake,
          factors.energyLevels,
        ].reduce((a, b) => a + (b || 50), 0) / 5
      );
      
      const fallbackRecovery = {
        score: avgScore,
        status: "System operating at standard capacity. API limits reached; using local heuristic assessment.",
        recommendations: [
          "Prioritize quality sleep tonight.",
          "Ensure adequate protein intake across your next 2 meals.",
          "Consider active recovery if muscle soreness persists."
        ]
      };
      res.json(fallbackRecovery);
    }
  });

  // Generate Image
  app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const interaction = await ai.interactions.create({
        model: 'gemini-3.1-flash-lite-image',
        input: `Clinical anatomical demonstration of: ${prompt}. Photo-realistic high-definition style. The image MUST strictly show the correct human form and bio-mechanical movement for this specific exercise. Use a professional athletic setting. NO abstract elements, NO distorted limbs, NO multiple people, NO text. If the exercise is complex or difficult to visualize accurately, do not generate anything. Focus on precision and safety.`,
        response_modalities: ['image'],
        generation_config: {
          image_config: {
            aspect_ratio: "16:9",
            image_size: "1K"
          },
        },
      });

      if (interaction.output_image) {
        const { data, mime_type } = interaction.output_image;
        res.json({ url: `data:${mime_type};base64,${data}` });
      } else {
        res.json({ url: '' }); // Empty URL as fallback
      }
    } catch (error: any) {
      res.json({ url: '' }); // Empty URL as fallback
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
