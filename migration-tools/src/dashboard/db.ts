import { Pool } from 'pg';
import { MigrationStatus } from '../types/index.js';

export class MigrationDatabase {
  private pool: Pool;
  
  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL || 
        'postgresql://postgres:postgres@localhost:5432/astermanagement'
    });
  }
  
  async initialize(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migration_status (
        id SERIAL PRIMARY KEY,
        component_path VARCHAR(500) NOT NULL UNIQUE,
        react_loc INTEGER DEFAULT 0,
        vue_loc INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        migrated_at TIMESTAMP,
        migrated_by VARCHAR(100),
        test_coverage DECIMAL(5,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_migration_status ON migration_status(status);
      CREATE INDEX IF NOT EXISTS idx_migration_path ON migration_status(component_path);
    `;
    
    await this.pool.query(createTableQuery);
  }
  
  async upsertComponent(component: MigrationStatus): Promise<void> {
    const query = `
      INSERT INTO migration_status (
        component_path, react_loc, vue_loc, status, 
        migrated_at, migrated_by, test_coverage, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (component_path) 
      DO UPDATE SET
        react_loc = EXCLUDED.react_loc,
        vue_loc = EXCLUDED.vue_loc,
        status = EXCLUDED.status,
        migrated_at = EXCLUDED.migrated_at,
        migrated_by = EXCLUDED.migrated_by,
        test_coverage = EXCLUDED.test_coverage,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await this.pool.query(query, [
      component.componentPath,
      component.reactLoc,
      component.vueLoc,
      component.status,
      component.migratedAt,
      component.migratedBy,
      component.testCoverage,
      component.notes
    ]);
  }
  
  async getComponentStatus(path: string): Promise<MigrationStatus | null> {
    const result = await this.pool.query(
      'SELECT * FROM migration_status WHERE component_path = $1',
      [path]
    );
    
    return result.rows[0] || null;
  }
  
  async getAllComponents(): Promise<MigrationStatus[]> {
    const result = await this.pool.query(
      'SELECT * FROM migration_status ORDER BY component_path'
    );
    
    return result.rows;
  }
  
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    migrated: number;
    verified: number;
    totalReactLoc: number;
    totalVueLoc: number;
    averageTestCoverage: number;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'migrated') as migrated,
        COUNT(*) FILTER (WHERE status = 'verified') as verified,
        SUM(react_loc) as total_react_loc,
        SUM(vue_loc) as total_vue_loc,
        AVG(test_coverage) as avg_test_coverage
      FROM migration_status
    `;
    
    const result = await this.pool.query(statsQuery);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total) || 0,
      pending: parseInt(row.pending) || 0,
      inProgress: parseInt(row.in_progress) || 0,
      migrated: parseInt(row.migrated) || 0,
      verified: parseInt(row.verified) || 0,
      totalReactLoc: parseInt(row.total_react_loc) || 0,
      totalVueLoc: parseInt(row.total_vue_loc) || 0,
      averageTestCoverage: parseFloat(row.avg_test_coverage) || 0
    };
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }
}