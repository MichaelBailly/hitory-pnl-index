import { MongoClient } from 'mongodb';
import { MONGO_URL, MONGO_VOLUME_COLLECTION, MONGO_VOLUME_DB } from './config';
import { Volume } from './types/Volume';

export async function getVolumes() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(MONGO_VOLUME_DB);
  const volumes = await db
    .collection(MONGO_VOLUME_COLLECTION)
    .find()
    .sort({ volUsdt: 1 })
    .toArray();

  await client.close();
  const result = volumes.map(({ pair, volUsdt }) => ({ pair, volUsdt }));
  if (!result.every(isVolume)) {
    throw new Error('Invalid volume');
  }
  return result;
}

export function isVolume(obj: unknown): obj is Volume {
  return (
    typeof (obj as Volume) === 'object' &&
    (obj as Volume) !== null &&
    typeof (obj as Volume).pair === 'string' &&
    typeof (obj as Volume).volUsdt === 'number'
  );
}

export function getPairsForRadius(
  volumes: Volume[],
  pair: string,
  radius: number
) {
  const result: string[] = [];
  const pairIndex = volumes.findIndex((v) => v.pair === pair);
  if (pairIndex === -1) {
    return result;
  }
  for (let i = pairIndex - radius; i <= pairIndex + radius; i++) {
    if (i < 0 || i >= volumes.length) {
      continue;
    }
    result.push(volumes[i].pair);
  }
  return result;
}

export const VolumeFamilies = [
  {
    name: 'xs',
    label: 'Micro',
    min: 0,
    max: 800000,
  },
  {
    name: 's',
    label: 'Small',
    min: 800000,
    max: 2000000,
  },
  {
    name: 'm',
    label: 'Medium',
    min: 2000000,
    max: 5000000,
  },
  {
    name: 'l',
    label: 'Large',
    min: 5000000,
    max: 10000000,
  },
  {
    name: 'xl',
    label: 'X-Large',
    min: 10000000,
    max: 2000000000000,
  },
];

export function isInFamily(volumes: Volume[], pair: string, family: string) {
  const volume = volumes.find((v) => v.pair === pair);
  if (!volume) {
    return false;
  }
  const familyConfig = VolumeFamilies.find((f) => f.name === family);
  if (!familyConfig) {
    return false;
  }
  return (
    volume.volUsdt >= familyConfig.min && volume.volUsdt < familyConfig.max
  );
}
