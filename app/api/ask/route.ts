import { getAIService } from '../../../lib/server/services';
import { assembleHealthContext } from '../../../lib/health-context';
import type { HealthData } from '../../../lib/health';

const headers = { 'Cache-Control': 'no-store' };
export async function POST(request: Request) {
  let question: string;
  let data: HealthData | undefined;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 250000) return Response.json({ error: 'This history is too large. Ask without including your records.' }, { status: 413, headers });
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || !('question' in body) || typeof body.question !== 'string' || !body.question.trim() || body.question.length > 2000) {
      return Response.json({ error: 'Enter a question of up to 2,000 characters.' }, { status: 400, headers });
    }
    question = body.question.trim();
    if ('data' in body && assembleHealthContext(body.data)) data = body.data as HealthData;
  } catch {
    return Response.json({ error: 'The question or included records could not be read. Ask without records or check the data and try again.' }, { status: 400, headers });
  }
  try {
    const service = getAIService();
    const answer = await service.answerHealthQuestion(question, data);
    return Response.json(
      { answer, provider: process.env.AI_PROVIDER || 'development' },
      { headers }
    );
  } catch (err) {
    console.error('[API /api/ask Error]:', err);
    return Response.json({ error: 'The assistant is unavailable. Your question is still here; try again shortly.' }, { status: 503, headers });
  }
}
