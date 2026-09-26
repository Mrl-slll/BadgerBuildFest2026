export type ResearchSource = {
  id: string; title: string; url: string; publisher: string; publishedAt?: string; excerpt: string;
};
export type ResearchResult = { status: 'available' | 'not-connected' | 'no-results'; sources: ResearchSource[] };
export interface ResearchRetriever {
  retrieve(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<ResearchResult>;
}
/** No invented evidence in development. */
export class DevelopmentResearchRetriever implements ResearchRetriever {
  async retrieve(): Promise<ResearchResult> { return { status: 'not-connected', sources: [] }; }
}
