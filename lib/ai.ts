import type { HealthData } from './health';
import { assembleHealthContext, type HealthContext } from './health-context';
import { DevelopmentResearchRetriever, type ResearchRetriever, type ResearchSource } from './research';

export type Answer = { source: 'Your data' | 'Research' | 'AI interpretation' | 'Community experiences' | 'Questions for your clinician'; text: string; citations?: ResearchSource[] }[];
export interface AIService {
  answerHealthQuestion(question: string, data?: HealthData): Promise<Answer>;
  summarizeHealthHistory(data: HealthData): Promise<string>;
  generateVisitSummary(data: HealthData): Promise<string>;
  retrieveRelevantResearch(question: string): Promise<ResearchSource[]>;
}
export function describeContext(context?: HealthContext): string {
  if (!context) return 'Personalization is off. Your health records were not included.';
  const symptoms = context.symptoms.slice(0, 5).map(s => `${s.name}: ${s.days} logged ${s.days === 1 ? 'day' : 'days'}`).join('; ');
  return `${context.loggedDays} distinct ${context.loggedDays === 1 ? 'day' : 'days'} logged from ${context.start} to ${context.end}. ${symptoms ? `${symptoms}.` : 'No symptoms recorded in this period.'} Recorded in this period: ${context.periodStarts.length} period starts, ${context.medications.length} overlapping medications, and ${context.labs.length} lab results. Unlogged days do not mean symptom-free days.`;
}
export class DevelopmentAIService implements AIService {
  private readonly research: ResearchRetriever;
  constructor(research: ResearchRetriever = new DevelopmentResearchRetriever()) { this.research = research; }
  async answerHealthQuestion(question: string, data?: HealthData): Promise<Answer> {
    const context = assembleHealthContext(data);
    const q = question.toLowerCase();
    let clinician = 'Which changes in my recorded history would be useful to discuss at my next appointment?';
    let interpretation = 'This is a scripted development response, not an AI assessment. It cannot diagnose a condition or determine what caused a change.';
    if (/lab|result|test/.test(q)) {
      clinician = 'How should we understand this result alongside its units, reference range, and my medical history?';
      interpretation = 'This development assistant does not interpret lab results. Bring the original report and its reference ranges to your clinician.';
    } else if (/medication|metformin|side effect/.test(q)) {
      clinician = 'Can we review the timing of my symptoms and medication changes?';
      interpretation = 'This scripted response cannot establish whether a medication caused a recorded change or advise a dose change.';
    } else if (/cycle|period/.test(q)) {
      clinician = 'What cycle details would help our discussion, and when should we follow up?';
    } else if (/snack|food|meal/.test(q)) {
      clinician = 'What food options fit my preferences and individual care needs?';
    }
    const research = await this.research.retrieve(question, { limit: 5 });
    return [
      { source: 'Your data', text: describeContext(context) },
      { source: 'Research', text: research.status === 'not-connected' ? 'Research retrieval is not connected. No medical evidence was retrieved for this response.' : research.sources.length ? 'Retrieved source excerpts are provided for review; the development provider does not synthesize medical advice.' : 'No relevant sources were found.', citations: research.sources },
      { source: 'AI interpretation', text: interpretation },
      { source: 'Community experiences', text: 'Not connected. No community stories or statistics are used.' },
      { source: 'Questions for your clinician', text: clinician },
    ];
  }
  async summarizeHealthHistory(data: HealthData) { return describeContext(assembleHealthContext(data)); }
  async generateVisitSummary(data: HealthData) { return this.summarizeHealthHistory(data); }
  async retrieveRelevantResearch(question: string) { return (await this.research.retrieve(question, { limit: 5 })).sources; }
}
// Compatibility export. Real providers belong in lib/server.
export const aiService: AIService = new DevelopmentAIService();
