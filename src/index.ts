import { Collection, MongoClient } from 'mongodb';
import { MONGO_TRADES_DB, MONGO_URL } from './config';
import { getDistinctWatchers, Watcher } from './getDistinctWatchers';
import { getHistoryPnlWithRadiusOf } from './getHistoryPnlOf';
import { getPairsForRadius, getVolumes, Volume } from './getVolumes';
import { isTradeRecord, TradeRecord } from './isTradeRecord';

async function run() {
  const radiusMin = 10;
  const radiusMax = 30;
  const historyMin = 3;
  const historyMax = 10;
  const winRateMin = 0.5;
  const winRateMax = 0.9;
  trainModel2(
    radiusMin,
    radiusMax,
    historyMin,
    historyMax,
    winRateMin,
    winRateMax
  );
}

run();

/**
 * This function trains the model for volume radius prediction
 *
 * Asumption here is that:
 * - for a given watcher
 * - a combination CMB of radius/history size/winRate ratio
 * - gives a prediction of whether the trade should be taken
 *
 * // not in this function
 * Then, when a new trade is coming, applying CMB
 * shall give a take/pass on the trade
 */
async function trainModel2(
  radiusMin: number,
  radiusMax: number,
  historyMin: number,
  historyMax: number,
  winRateMin: number,
  winRateMax: number
) {
  const volumes = await getVolumes();
  const watchers = await getDistinctWatchers();
  const startDate = new Date('2022-12-01');

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(MONGO_TRADES_DB);
  const collection: Collection<TradeRecord> = db.collection('trades');

  for (const watcher of watchers) {
    const bestConfig = {
      radius: 0,
      historyLimit: 0,
      winRateLimit: 0,
      result: {
        netPnlBase: 0,
        netPnlWithPrediction: 0,
        tradeCountWithPrediction: 0,
        tradeCountBase: 0,
      },
    };
    for (let radius = radiusMin; radius <= radiusMax; radius++) {
      const simulationResults = await testHistoryPnl2(
        collection,
        volumes,
        watcher,
        startDate,
        radius,
        historyMin,
        historyMax,
        winRateMin,
        winRateMax
      );
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
          if (!simulationResults[historyLimit]) {
            continue;
          }
          const rawResult = simulationResults[historyLimit][winRateLimit];
          if (!rawResult) {
            continue;
          }
          const result = substractFees(rawResult);
          if (
            result.netPnlWithPrediction < 0 ||
            result.netPnlBase > result.netPnlWithPrediction
          ) {
            continue;
          }
          if (
            result.netPnlWithPrediction > bestConfig.result.netPnlWithPrediction
          ) {
            bestConfig.radius = radius;
            bestConfig.historyLimit = historyLimit;
            bestConfig.winRateLimit = winRateLimit;
            bestConfig.result = result;
          }
        }
      }
    }
    console.log(watcher.type, watcher.config);
    if (bestConfig.result.netPnlWithPrediction > 0) {
      //      console.log(watcher.type, watcher.config);
      console.log('best config', bestConfig);
      console.log('-');
    }
  }
  await client.close();
}

function substractFees(result: SimulationUnitResult): SimulationUnitResult {
  const feePerTrade = 100 * 0.0075 * 2;
  return {
    netPnlBase: result.netPnlBase - result.tradeCountBase * feePerTrade,
    netPnlWithPrediction:
      result.netPnlWithPrediction -
      result.tradeCountWithPrediction * feePerTrade,
    tradeCountBase: result.tradeCountBase,
    tradeCountWithPrediction: result.tradeCountWithPrediction,
  };
}

type SimulationUnitResult = {
  netPnlBase: number;
  netPnlWithPrediction: number;
  tradeCountBase: number;
  tradeCountWithPrediction: number;
};

/**
 * This method gives, for a watcher, radius,
 * history size and win rate, the PNL without prediction, and
 * the PnL with prediction
 *
 * @param collection Mongo collection
 * @param volumes volumes reference
 * @param watcher watcher being analyzed
 * @param startDate date to start the experiment
 * @param radius number of pairs from adjacent volumes to take (/2)
 * @param historyLimit number of history records to keep
 * @param winRateLimit the winrate ratio to have
 * @returns
 */
async function testHistoryPnl2(
  collection: Collection<TradeRecord>,
  volumes: Volume[],
  watcher: Watcher,
  startDate: Date,
  radius: number,
  historyMin: number,
  historyMax: number,
  winRateMin: number,
  winRateMax: number
) {
  let simulation: Record<number, Record<number, SimulationUnitResult>> = {};
  const tradeCursor = collection
    .find({
      'watcher.type': watcher.type,
      'watcher.config': watcher.config,
      boughtTimestamp: { $gte: startDate },
    })
    .sort({ boughtTimestamp: 1 });
  for await (const trade of tradeCursor) {
    if (!isTradeRecord(trade)) {
      continue;
    }

    const radiusPairs = getPairsForRadius(volumes, trade.pair, radius);
    const historyPnlResults = await getHistoryPnlWithRadiusOf(
      collection,
      radiusPairs,
      trade,
      historyMin,
      historyMax,
      winRateMin,
      winRateMax
    );

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
        if (
          historyPnlResults[historyLimit][winRateLimit] === undefined ||
          historyPnlResults[historyLimit][winRateLimit] === null
        ) {
          continue;
        }
        if (!simulation[historyLimit]) {
          simulation[historyLimit] = {};
        }
        if (!simulation[historyLimit][winRateLimit]) {
          simulation[historyLimit][winRateLimit] = {
            netPnlBase: 0,
            netPnlWithPrediction: 0,
            tradeCountBase: 0,
            tradeCountWithPrediction: 0,
          };
        }
        simulation[historyLimit][winRateLimit].netPnlBase += trade.pnl;
        simulation[historyLimit][winRateLimit].tradeCountBase += 1;
        if (historyPnlResults[historyLimit][winRateLimit] === true) {
          simulation[historyLimit][winRateLimit].netPnlWithPrediction +=
            trade.pnl;
          simulation[historyLimit][winRateLimit].tradeCountWithPrediction += 1;
        }
      }
    }
  }
  return simulation;
}
