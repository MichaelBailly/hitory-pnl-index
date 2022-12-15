import { Collection } from 'mongodb';
import { isTradeRecord, TradeRecord } from './isTradeRecord';

export async function getHistoryPnlWithRadiusOf(
  collection: Collection<TradeRecord>,
  radiusPairs: string[],
  trade: TradeRecord,
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
      const testResult: boolean | null = await testHistoryPnlOf(
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
 * Get the win rate of pairs
 * @param collection MongoDB collection
 * @param radiusPairs pair symbols of assets close to the source
 * @param trade source trade record
 * @param historyLimit number of pair symbols to fetch (exact)
 * @param winRateLimit the ratio of wins for those symbols
 * @returns boolean|null is null, not enough history. Otherwise, whether the winRateLimit is reached
 */
/*
export async function getHistoryPnlOf(
  collection: Collection<TradeRecord>,
  radiusPairs: string[],
  trade: TradeRecord,
  historyLimit: number = 50,
  winRateLimit: number = 0.5
) {
  const tradeHistory = await collection
    .find({
      pair: { $in: radiusPairs },
      'watcher.type': trade.watcher.type,
      'watcher.config': trade.watcher.config,
      boughtTimestamp: { $lt: trade.boughtTimestamp },
    })
    .sort({ boughtTimestamp: -1 })
    .limit(historyLimit)
    .toArray();

  if (!tradeHistory.every(isTradeRecord)) {
    throw new Error('Invalid trade record');
  }
  return testHistoryPnlOf(tradeHistory, historyLimit, winRateLimit);
}
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
  const wins = tradeHistory.filter((t) => t.pnl > 0).length;
  if (wins / historyLimit > winRateLimit) {
    return true;
  }
  return false;
}
