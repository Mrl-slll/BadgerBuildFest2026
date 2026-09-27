import 'server-only';
import type { HealthData } from '../health';

export interface DatabricksStorageConfig {
  host?: string;
  token?: string;
  warehouseId?: string;
  catalog?: string;
  schema?: string;
  tableName?: string;
}

export class DatabricksStorageService {
  private readonly host: string;
  private readonly token: string;
  private readonly warehouseId: string;
  private readonly fullTableName: string;
  private tableEnsured = false;

  constructor(config?: DatabricksStorageConfig) {
    this.host = (config?.host ?? process.env.DATABRICKS_HOST ?? '').replace(/\/+$/, '');
    this.token = config?.token ?? process.env.DATABRICKS_TOKEN ?? '';
    this.warehouseId = config?.warehouseId ?? process.env.DATABRICKS_SQL_WAREHOUSE_ID ?? '';
    
    // Default catalog and schema in Databricks
    const schema = config?.schema ?? 'default';
    const table = config?.tableName ?? 'user_health_records';
    this.fullTableName = `${schema}.${table}`;
  }

  isConfigured(): boolean {
    return Boolean(this.host && this.token && this.warehouseId);
  }

  /**
   * Executes a SQL statement against Databricks SQL Warehouse with optional parameters.
   */
  private async executeStatement(
    statement: string,
    parameters?: Array<{ name: string; value: string; type?: string }>
  ) {
    if (!this.isConfigured()) {
      throw new Error('Databricks SQL is not fully configured (missing host, token, or warehouse ID).');
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

  /**
   * Ensures the Delta Lake table exists in Databricks.
   */
  async ensureTable(): Promise<void> {
    if (this.tableEnsured || !this.isConfigured()) return;

    try {
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
          user_id STRING NOT NULL,
          version INT,
          updated_at TIMESTAMP,
          payload_json STRING
        ) USING DELTA;
      `;
      await this.executeStatement(createTableSql);
      this.tableEnsured = true;
    } catch (err) {
      console.warn(`[Databricks Storage] Warning verifying table ${this.fullTableName}:`, err);
    }
  }

  /**
   * Loads a user's health logs from Databricks Delta Lake table.
   */
  async getUserHealthData(userId: string): Promise<HealthData | null> {
    if (!this.isConfigured() || !userId) return null;

    try {
      await this.ensureTable();

      const selectSql = `
        SELECT payload_json 
        FROM ${this.fullTableName} 
        WHERE user_id = :userId 
        LIMIT 1
      `;

      const result = await this.executeStatement(selectSql, [
        { name: 'userId', value: userId, type: 'STRING' },
      ]);

      const state = result.status?.state;
      if (state === 'SUCCEEDED') {
        const row = result.result?.data_array?.[0];
        if (row && typeof row[0] === 'string') {
          return JSON.parse(row[0]) as HealthData;
        }
      }
      return null;
    } catch (err) {
      console.error(`[Databricks Storage] Failed to load data for user ${userId}:`, err);
      return null;
    }
  }

  /**
   * Upserts the user's health logs into the Databricks Delta Lake table using MERGE.
   */
  async saveUserHealthData(userId: string, data: HealthData): Promise<{ success: boolean; status?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Databricks credentials not configured in environment.' };
    }

    try {
      await this.ensureTable();

      const jsonPayload = JSON.stringify(data);
      const mergeSql = `
        MERGE INTO ${this.fullTableName} AS target
        USING (
          SELECT 
            :userId AS user_id, 
            :version AS version, 
            current_timestamp() AS updated_at, 
            :payload AS payload_json
        ) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET 
            target.payload_json = source.payload_json,
            target.updated_at = source.updated_at,
            target.version = source.version
        WHEN NOT MATCHED THEN
          INSERT (user_id, version, updated_at, payload_json)
          VALUES (source.user_id, source.version, source.updated_at, source.payload_json);
      `;

      const result = await this.executeStatement(mergeSql, [
        { name: 'userId', value: userId, type: 'STRING' },
        { name: 'version', value: String(data.version || 1), type: 'INT' },
        { name: 'payload', value: jsonPayload, type: 'STRING' },
      ]);

      const state = result.status?.state;
      return {
        success: state === 'SUCCEEDED' || state === 'PENDING' || state === 'RUNNING',
        status: state,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Databricks Storage] Error saving records for user ${userId}:`, message);
      return { success: false, error: message };
    }
  }
}
