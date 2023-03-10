export const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/';
export const MONGO_TRADES_DB = process.env.MONGO_TRADES_DB || 'simutest';
export const MONGO_TRADES_COLLECTION =
  process.env.MONGO_TRADES_COLLECTION || 'trades';
export const MONGO_VOLUME_DB = process.env.MONGO_VOLUME_DB || 'references';
export const MONGO_VOLUME_COLLECTION =
  process.env.MONGO_VOLUME_COLLECTION || 'volume';

export const MONGO_PREDICTION_DB =
  process.env.MONGO_PREDICTION_DB || 'predictions';
export const MONGO_PREDICTION_COLLECTION =
  process.env.MONGO_PREDICTION_COLLECTION || 'predictions';

/* webserver configutation */
export const HTTP_PORT = process.env.PORT || 3210;

export const RECORDER_FILE_PATH = process.env.RECORDER_FILE_PATH || '.';

export const MODEL_FILE = process.env.MODEL_FILE || 'model.json';
