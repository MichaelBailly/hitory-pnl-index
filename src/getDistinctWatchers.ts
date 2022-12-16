import { getTradeStore } from './tradesStore';
import { Watcher } from './types/Watcher';

export async function getDistinctWatchers() {
  const { collection, close } = await getTradeStore();
  const watchers = await collection.distinct('watcher');
  await close();
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
