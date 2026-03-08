export type NbaGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sportKey: string;
};

export type MarketLine = {
  name: string;
  price: number;
  point?: number;
};

export type BookmakerMarket = {
  bookmaker: string;
  marketKey: 'h2h' | 'spreads' | 'totals';
  outcomes: MarketLine[];
};

export type GameOdds = {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  markets: BookmakerMarket[];
};

export type BetSide = 'home' | 'away';

export type BetOffer = {
  id: string;
  gameId: string;
  createdBy: string;
  offeredToGroupId: string;
  side: BetSide;
  stakeAmount: string;
  stakeToken: 'LUSD';
  oddsAmerican: number;
  status: 'open' | 'matched' | 'cancelled' | 'settled';
  createdAt: string;
  expiresAt: string;
  acceptedBy?: string;
  escrowTxHash?: string;
  receiptCid?: string;
};

export type BetSettlement = {
  offerId: string;
  winnerUserId: string;
  settledAt: string;
  payoutTxHash?: string;
  settlementReceiptCid?: string;
};
