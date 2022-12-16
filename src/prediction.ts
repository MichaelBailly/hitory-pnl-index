import { sub } from 'date-fns';
import { getPredictionStore } from './types/predictionStore';

export async function getPrediction(type: string, config: string) {
  const { collection, close } = await getPredictionStore();

  const result = await collection
    .find({ 'watcher.type': type, 'watcher.config': config })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();
  close();
  return result[0];
}

export async function getAllPredictions() {
  const { collection, close } = await getPredictionStore();

  const result = await collection
    .find({ created_at: { $gt: sub(new Date(), { hours: 3 }) } })
    .toArray();
  close();
  return result;
}
