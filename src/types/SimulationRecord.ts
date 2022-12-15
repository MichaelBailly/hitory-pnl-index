import { Watcher } from './Watcher';

export type SimulationRecord = {
  watcher: Watcher;
  config: {
    radius: number;
    historyLimit: number;
    winRateLimit: number;
  };
  created_at: Date;
};
