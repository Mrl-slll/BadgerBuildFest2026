import 'server-only';

export interface ExpertReviewRecord {
  reviewId: string;
  messageId: string;
  expertId: string;
  expertName: string;
  userQuestion: string;
  userLogsSummary: string;
  originalAIResponse: string;
  correctedResponse?: string;
  ratingAccuracy: number;      // 1 to 5
  ratingGroundedness: number;  // 1 to 5
  ratingEmpathy: number;       // 1 to 5
  isClinicallySafe: boolean;
  expertComments: string;
  status: 'reviewed' | 'corrected' | 'approved_for_training';
  createdAt: string;
}

export interface DatabricksExpertConfig {
  host?: string;
  token?: string;
  warehouseId?: string;
  tableName?: string;
}

// In-memory fallback cache for development or when Databricks credentials are not configured
const inMemoryReviews: ExpertReviewRecord[] = [];

export class DatabricksExpertReviewService {
  private readonly host: string;
  private readonly token: string;
  private readonly warehouseId: string;
  private readonly fullTableName: string;
  private tableEnsured = false;

  constructor(config?: DatabricksExpertConfig) {
    this.host = (config?.host ?? process.env.DATABRICKS_HOST ?? '').replace(/\/+$/, '');
    this.token = config?.token ?? process.env.DATABRICKS_TOKEN ?? '';
    this.warehouseId = config?.warehouseId ?? process.env.DATABRICKS_SQL_WAREHOUSE_ID ?? '';
    this.fullTableName = config?.tableName ?? process.env.DATABRICKS_EXPERT_TABLE ?? 'default.expert_response_reviews';
  }

  isConfigured(): boolean {
    return Boolean(this.host && this.token && this.warehouseId);
  }

  private async executeStatement(
    statement: string,
    parameters?: Array<{ name: string; value: string; type?: string }>
  ) {
    if (!this.isConfigured()) {
      throw new Error('Databricks SQL is not fully configured.');
    }

    const payload: Record<string, unknown> = {
      warehouse_id: this.warehouseId,
      statement,
      wait_timeout: '30s',
      on_wait_timeout: 'CONTINUE',
    };

    if (parameters && parameters.length > 0) {
      payload.parameters = parameters.map((p) => ({
        name: p.name,
        value: p.value,
        type: p.type ?? 'STRING',
      }));
    }

    const response = await fetch(`${this.host}/api/2.0/sql/statements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Databricks SQL API returned HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  async ensureTable(): Promise<void> {
    if (this.tableEnsured || !this.isConfigured()) return;

    try {
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
          review_id STRING NOT NULL,
          message_id STRING NOT NULL,
          expert_id STRING NOT NULL,
          expert_name STRING,
          user_question STRING NOT NULL,
          user_logs_summary STRING,
          original_ai_response STRING NOT NULL,
          corrected_response STRING,
          rating_accuracy INT,
          rating_groundedness INT,
          rating_empathy INT,
          is_clinically_safe BOOLEAN,
          expert_comments STRING,
          status STRING,
          created_at TIMESTAMP
        ) USING DELTA;
      `;
      await this.executeStatement(createTableSql);
      this.tableEnsured = true;
    } catch (err) {
      console.warn(`[Databricks Expert Reviews] Warning verifying table ${this.fullTableName}:`, err);
    }
  }

  async saveReview(review: Omit<ExpertReviewRecord, 'reviewId' | 'createdAt'> & { reviewId?: string }): Promise<ExpertReviewRecord> {
    const record: ExpertReviewRecord = {
      ...review,
      reviewId: review.reviewId || `rev-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };

    // Save in memory for immediate retrieval and fast local dev
    const existingIdx = inMemoryReviews.findIndex(r => r.messageId === record.messageId);
    if (existingIdx >= 0) {
      inMemoryReviews[existingIdx] = record;
    } else {
      inMemoryReviews.unshift(record);
    }

    if (!this.isConfigured()) {
      return record;
    }

    try {
      await this.ensureTable();

      const insertSql = `
        INSERT INTO ${this.fullTableName} (
          review_id, message_id, expert_id, expert_name, user_question,
          user_logs_summary, original_ai_response, corrected_response,
          rating_accuracy, rating_groundedness, rating_empathy,
          is_clinically_safe, expert_comments, status, created_at
        ) VALUES (
          :review_id, :message_id, :expert_id, :expert_name, :user_question,
          :user_logs_summary, :original_ai_response, :corrected_response,
          :rating_accuracy, :rating_groundedness, :rating_empathy,
          :is_clinically_safe, :expert_comments, :status, current_timestamp()
        );
      `;

      await this.executeStatement(insertSql, [
        { name: 'review_id', value: record.reviewId },
        { name: 'message_id', value: record.messageId },
        { name: 'expert_id', value: record.expertId },
        { name: 'expert_name', value: record.expertName },
        { name: 'user_question', value: record.userQuestion },
        { name: 'user_logs_summary', value: record.userLogsSummary },
        { name: 'original_ai_response', value: record.originalAIResponse },
        { name: 'corrected_response', value: record.correctedResponse || '' },
        { name: 'rating_accuracy', value: String(record.ratingAccuracy), type: 'INT' },
        { name: 'rating_groundedness', value: String(record.ratingGroundedness), type: 'INT' },
        { name: 'rating_empathy', value: String(record.ratingEmpathy), type: 'INT' },
        { name: 'is_clinically_safe', value: String(record.isClinicallySafe), type: 'BOOLEAN' },
        { name: 'expert_comments', value: record.expertComments },
        { name: 'status', value: record.status },
      ]);
    } catch (err) {
      console.warn('[Databricks Expert Reviews] Error saving to SQL warehouse; retained in memory cache:', err);
    }

    return record;
  }

  async getRecentReviews(limit = 20): Promise<ExpertReviewRecord[]> {
    if (!this.isConfigured()) {
      return inMemoryReviews.slice(0, limit);
    }

    try {
      await this.ensureTable();
      const selectSql = `
        SELECT review_id, message_id, expert_id, expert_name, user_question,
               user_logs_summary, original_ai_response, corrected_response,
               rating_accuracy, rating_groundedness, rating_empathy,
               is_clinically_safe, expert_comments, status, created_at
        FROM ${this.fullTableName}
        ORDER BY created_at DESC
        LIMIT ${Math.min(limit, 100)};
      `;

      const result = await this.executeStatement(selectSql);
      const rows = result.result?.data_array;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: string[]) => ({
          reviewId: r[0],
          messageId: r[1],
          expertId: r[2],
          expertName: r[3],
          userQuestion: r[4],
          userLogsSummary: r[5],
          originalAIResponse: r[6],
          correctedResponse: r[7] || undefined,
          ratingAccuracy: Number(r[8]) || 5,
          ratingGroundedness: Number(r[9]) || 5,
          ratingEmpathy: Number(r[10]) || 5,
          isClinicallySafe: r[11] === 'true' || r[11] === '1',
          expertComments: r[12] || '',
          status: (r[13] as ExpertReviewRecord['status']) || 'reviewed',
          createdAt: r[14] || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('[Databricks Expert Reviews] Error reading from SQL warehouse, falling back to cache:', err);
    }

    return inMemoryReviews.slice(0, limit);
  }

  /**
   * Retrieves high-performing clinician-verified examples to inject as few-shot in-context learning.
   */
  async getTopVerifiedExamples(question: string, limit = 1): Promise<Array<{ question: string; answer: string; expertComments?: string }>> {
    const all = await this.getRecentReviews(30);
    const qLower = question.toLowerCase();

    // Find verified examples where an expert corrected the response or gave high ratings
    const verified = all.filter((r) => r.isClinicallySafe && r.ratingAccuracy >= 4);

    if (verified.length === 0) return [];

    // Simple keyword relevance ranking
    const scored = verified.map((v) => {
      const vWords = v.userQuestion.toLowerCase().split(/\s+/);
      const overlap = vWords.filter((w) => w.length > 3 && qLower.includes(w)).length;
      return { item: v, score: overlap };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored
      .filter((s) => s.score > 0 || scored.length <= limit)
      .slice(0, limit)
      .map((s) => ({
        question: s.item.userQuestion,
        answer: s.item.correctedResponse || s.item.originalAIResponse,
        expertComments: s.item.expertComments,
      }));
  }
}

export const databricksExpertReviews = new DatabricksExpertReviewService();
