import { createHash } from 'crypto';
import { writeFile } from 'fs/promises';
import { RECORDER_FILE_PATH } from './config';
import { getPredictionOnSimulation } from './getHistoryPnlOf';
import { getPairsForRadius, getVolumes } from './getVolumes';
import { TradeRecordFragment } from './types/TradeRecordFragment';
import { getTradeStore } from './tradesStore';
import { getAllPredictions } from './prediction';

export async function buildAndRecordPredictionModel(
  filename: string = 'model.json'
) {
  const model: Record<string, Record<string, Record<string, boolean>>> = {};

  const volume = await getVolumes();
  const simulationRecords = await getAllPredictions();

  const { collection, close } = await getTradeStore();

  const pairs = await collection.distinct('pair');

  for (let pair of pairs) {
    for (let simulation of simulationRecords) {
      const volumeRadius = getPairsForRadius(
        volume,
        pair,
        simulation.config.radius
      );

      if (!volumeRadius.length) {
        continue;
      }

      const tradeRecordFragment: TradeRecordFragment = {
        watcher: {
          type: simulation.watcher.type,
          config: simulation.watcher.config,
        },
        boughtTimestamp: new Date(),
      };

      const simulationResponse = await getPredictionOnSimulation(
        collection,
        volumeRadius,
        tradeRecordFragment,
        simulation
      );
      if (simulationResponse === true) {
        if (!model[pair]) {
          model[pair] = {};
        }
        if (!model[pair][simulation.watcher.type]) {
          model[pair][simulation.watcher.type] = {};
        }
        model[pair][simulation.watcher.type][simulation.watcher.config] =
          simulationResponse;
        console.log(
          pair,
          simulation.watcher.type,
          simulation.watcher.config,
          simulationResponse
        );
      }
    }
  }
  const shasum = createHash('sha1');
  shasum.update(JSON.stringify(model));
  const hash = shasum.digest('hex');
  const modelInfos = {
    hash,
    watchers: simulationRecords.map((s) => s.watcher),
    model,
  };
  await writeFile(
    `${RECORDER_FILE_PATH}/${filename}`,
    JSON.stringify(modelInfos)
  );

  await close();
}
