import { Collection } from 'mongodb';
import { isTradeRecord, TradeRecord } from './types/TradeRecord';
import { SimulationRecord } from './types/SimulationRecord';
import { TradeRecordFragment } from './types/TradeRecordFragment';

export async function getPredictionOnSimulation(
  collection: Collection<TradeRecord>,
  radiusPairs: string[],
  trade: TradeRecordFragment,
  simulation: SimulationRecord
) {
  const tradeHistory = await collection
    .find({
      pair: { $in: radiusPairs },
      'watcher.type': trade.watcher.type,
      'watcher.config': trade.watcher.config,
      boughtTimestamp: { $lt: trade.boughtTimestamp },
    })
    .sort({ boughtTimestamp: -1 })
    .limit(simulation.config.historyLimit)
    .toArray();

  if (!tradeHistory.every(isTradeRecord)) {
    throw new Error('Invalid trade record');
  }

  const testResult: boolean | null = testHistoryPnlOf(
    tradeHistory,
    simulation.config.historyLimit,
    simulation.config.winRateLimit
  );
  return testResult;
}

export async function getHistoryPnlWithRadiusOf(
  collection: Collection<TradeRecord>,
  radiusPairs: string[],
  trade: TradeRecordFragment,
  historyMin: number,
  historyMax: number,
  winRateMin: number,
  winRateMax: number
) {
  const result: Record<number, Record<number, boolean | null>> = {};
  const tradeHistory = await collection
    .find({
      pair: { $in: radiusPairs },
      'watcher.type': trade.watcher.type,
      'watcher.config': trade.watcher.config,
      boughtTimestamp: { $lt: trade.boughtTimestamp },
    })
    .sort({ boughtTimestamp: -1 })
    .limit(historyMax)
    .toArray();

  if (!tradeHistory.every(isTradeRecord)) {
    throw new Error('Invalid trade record');
  }

  for (
    let historyLimit = historyMin;
    historyLimit <= historyMax;
    historyLimit++
  ) {
    for (
      let winRateLimit = winRateMin;
      winRateLimit <= winRateMax;
      winRateLimit += 0.1
    ) {
      const testResult: boolean | null = testHistoryPnlOf(
        tradeHistory,
        historyLimit,
        winRateLimit
      );
      if (!result[historyLimit]) {
        result[historyLimit] = {};
      }
      result[historyLimit][winRateLimit] = testResult;
    }
  }
  return result;
}

/**
 * Given a collection of trades, and constraints historyLimit and winRateLimit,
 * tell whether:
 * - the trades collection meets at least the criteria (returns true)
 * - the trades collection doesn't have enough history (returns null)
 * - the trades collection doesn't meet the winRateLimit criteria (returns false)
 */
export function testHistoryPnlOf(
  tradeHistory: TradeRecord[],
  historyLimit: number,
  winRateLimit: number
) {
  const population = tradeHistory.slice(0, historyLimit);
  if (population.length !== historyLimit) {
    return null;
  }
  const wins = population.filter((t) => t.pnl > 0).length;
  if (wins / historyLimit > winRateLimit) {
    return true;
  }
  return false;
}
