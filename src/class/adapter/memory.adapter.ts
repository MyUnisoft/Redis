// Import Internal Dependencies
import { DatabaseConnection } from "../Connection.class.js";

export interface MemoryDatabaseConnection extends DatabaseConnection {
  getValue(): Promise<any>;
}

export class MemoryAdapter implements MemoryDatabaseConnection {
  async connect(): Promise<void> {
    // Simple connection logic
  }

  async close(forceExit?: boolean): Promise<void> {
    // Simple close connection logic
  }

  async isAlive(): Promise<boolean> {
    return true;
  }

  async getPerformance(): Promise<number> {
    return 100;
  }

  async setValue(): Promise<any> {
    // Set value logic
  }

  async deleteValue(): Promise<any> {
    // Delete value logic
  }

  // Implement the no-argument version of getValue
  async getValue(): Promise<any> {
    // Simple getValue logic with no arguments
    return {};
  }
}
