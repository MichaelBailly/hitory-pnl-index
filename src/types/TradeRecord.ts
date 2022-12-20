import { Watcher } from './Watcher';

export type TradeRecord = {
  id: string;
  amount: number;
  quoteAmount: number;
  price: number;
  buyTimestamp: Date;
  boughtTimestamp: Date;
  sellTimestamp: Date;
  soldTimestamp: Date;
  low: number;
  pair: string;
  soldAmount: number;
  soldPrice: number;
  watcher: Watcher;
  pnl: number;
};

// create the validator function for the TradeRecord type using typescript type guard
export function isTradeRecord(trade: unknown): trade is TradeRecord {
  return (
    typeof trade === 'object' &&
    trade !== null &&
    typeof (trade as TradeRecord).id === 'string' &&
    typeof (trade as TradeRecord).amount === 'number' &&
    typeof (trade as TradeRecord).quoteAmount === 'number' &&
    typeof (trade as TradeRecord).price === 'number' &&
    typeof (trade as TradeRecord).buyTimestamp === 'object' &&
    typeof (trade as TradeRecord).boughtTimestamp === 'object' &&
    typeof (trade as TradeRecord).sellTimestamp === 'object' &&
    typeof (trade as TradeRecord).soldTimestamp === 'object' &&
    typeof (trade as TradeRecord).low === 'number' &&
    typeof (trade as TradeRecord).pair === 'string' &&
    typeof (trade as TradeRecord).soldAmount === 'number' &&
    typeof (trade as TradeRecord).soldPrice === 'number' &&
    typeof (trade as TradeRecord).watcher === 'object' &&
    typeof (trade as TradeRecord).watcher.type === 'string' &&
    typeof (trade as TradeRecord).watcher.config === 'string' &&
    typeof (trade as TradeRecord).pnl === 'number'
  );
}
