import 'server-only';
import { DevelopmentAIService, type Answer, type AIService } from '../ai';
import type { HealthContext } from '../health-context';
import type { ResearchResult, ResearchRetriever } from '../research';

/** Server-managed OAuth/workload identity only; never accept credentials from a browser. */
export interface DatabricksModelServing {
  answer(input: { question: string; context?: HealthContext; research: ResearchResult }, options?: { signal?: AbortSignal }): Promise<Answer>;
}
/** Curated Vector Search index adapter; sources must include provenance. */
export interface DatabricksResearchRetrieval extends ResearchRetriever {
  readonly provider: 'databricks-vector-search';
}
/** Queries must use authenticated server identity, never a client-supplied user ID. */
export interface HealthContextRepository {
  getContext(authenticatedUserId: string, range: { start: string; end: string }, options?: { signal?: AbortSignal }): Promise<HealthContext>;
}
export function getAIService(): AIService {
  if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== 'development') {
    throw new Error('Provider requires a server-side authenticated integration');
  }
  return new DevelopmentAIService();
}
