import { Collection, MongoClient } from 'mongodb';
import { MONGO_TRADES_DB, MONGO_URL } from './config';
import { TradeRecord } from './types/TradeRecord';

export async function getTradeStore() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(MONGO_TRADES_DB);
  const collection: Collection<TradeRecord> = db.collection('trades');

  return {
    collection,
    close: async () => client.close(),
  };
}
