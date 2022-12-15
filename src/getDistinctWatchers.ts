import { MongoClient } from 'mongodb';
import { MONGO_TRADES_DB, MONGO_URL } from './config';
import { Watcher } from './types/Watcher';

export async function getDistinctWatchers() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(MONGO_TRADES_DB);
  const collection = db.collection('trades');
  const watchers = await collection.distinct('watcher');
  await client.close();
  if (!watchers.every(isWatcher)) {
    throw new Error('Invalid watcher');
  }
  return watchers;
}
function isWatcher(obj: unknown): obj is Watcher {
  return (
    typeof (obj as Watcher) === 'object' &&
    (obj as Watcher) !== null &&
    typeof (obj as Watcher).type === 'string' &&
    typeof (obj as Watcher).config === 'string'
  );
}
