import { Collection, MongoClient } from 'mongodb';
import {
  MONGO_PREDICTION_COLLECTION,
  MONGO_PREDICTION_DB,
  MONGO_URL,
} from '../config';
import { SimulationRecord } from './SimulationRecord';

export async function getPredictionStore() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(MONGO_PREDICTION_DB);
  const collection: Collection<SimulationRecord> = db.collection(
    MONGO_PREDICTION_COLLECTION
  );

  return {
    collection,
    close: async () => client.close(),
  };
}
