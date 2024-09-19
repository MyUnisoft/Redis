// Import Internal Dependencies
import type { DatabaseConnection, GetConnectionPerfResponse } from "../../types";

export class MemoryAdapter implements DatabaseConnection {
  async initialize(): Promise<void> {
    // Simple connection logic
  }

  async close(forceExit?: boolean): Promise<void> {
    // Simple close connection logic
  }

  async isAlive(): Promise<boolean> {
    return true;
  }

  async getPerformance(): Promise<GetConnectionPerfResponse> {
    return { isAlive: true, perf: 100 };
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
