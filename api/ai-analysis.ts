// U11: Vercel function POST /api/ai-analysis. Needs (server env only):
//   ANTHROPIC_API_KEY     — never exposed to the client
//   FIREBASE_PROJECT_ID   — to verify Firebase ID tokens (falls back to VITE_FIREBASE_PROJECT_ID)
//   AI_ALLOWED_ORIGINS    — optional, comma-separated extra CORS origins
// The Android app (origin https://localhost) is allowed by default.
import Anthropic from '@anthropic-ai/sdk';
import { createRateLimiter, firebaseTokenVerifier, handleAnalysisRequest } from '../server/aiAnalysis';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
const allowedOrigins = ['https://localhost', 'capacitor://localhost', ...(process.env.AI_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)];
const rateLimiter = createRateLimiter();

let client: Anthropic | null = null;
let verify: ((token: string) => Promise<string>) | null = null;

const handle = (request: Request): Promise<Response> | Response => {
    if (!process.env.ANTHROPIC_API_KEY || !projectId) {
        return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    client ??= new Anthropic();
    verify ??= firebaseTokenVerifier(projectId);
    const anthropic = client;
    return handleAnalysisRequest(request, {
        verifyToken: verify,
        createMessage: (params) => anthropic.beta.messages.create(params),
        rateLimiter,
        allowedOrigins,
    });
};

export const POST = handle;
export const OPTIONS = handle;
