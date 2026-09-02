// The Grail marketplace domain contracts — implementation starting point.
export type CardAvailability = 'PC'|'OPEN'|'TRADE'|'SELL'|'AUCTION'|'PRIVATE'|'PENDING'|'SOLD'|'TRADED';
export type VerificationStatus = 'GRAIL_VERIFIED'|'EXTERNAL_VERIFIED'|'REPORTED'|'UNVERIFIED';
export type ListingType = 'BUY_NOW'|'AUCTION'|'MAKE_OFFER'|'TRADE'|'TRADE_PLUS_CASH';
export type TradeStatus = 'DRAFT'|'PROPOSED'|'COUNTERED'|'ACCEPTED'|'LOCKED'|'AUTHENTICATION'|'SHIPPING'|'SETTLED'|'COMPLETE'|'DECLINED'|'EXPIRED'|'CANCELLED'|'DISPUTED'|'FAILED_AUTH'|'FAILED_PAYMENT';

export interface MarketSnapshot {
  capturedAt: string;
  cardMasterId: string;
  conditionKey: string; // RAW, PSA_8, BGS_9_5 etc.
  estimate: number|null;
  low: number|null;
  high: number|null;
  lastSale: number|null;
  sales30d: number;
  sales90d: number;
  confidence: 'HIGH'|'MEDIUM'|'LOW';
  sourceObservationIds: string[];
}

export interface MarketplaceListing {
  id: string; cardInstanceId: string; sellerId: string; type: ListingType;
  status: 'DRAFT'|'ACTIVE'|'RESERVED'|'SOLD'|'CANCELLED'|'EXPIRED';
  askPrice?: number; reservePrice?: number; startsAt?: string; endsAt?: string;
  allowOffers: boolean; allowTrades: boolean; createdAt: string;
}

export interface Bid { id:string; auctionId:string; bidderId:string; amount:number; maxAmount?:number; createdAt:string; status:'ACTIVE'|'OUTBID'|'WINNING'|'RETRACTED'|'INVALID'; }
export interface Offer { id:string; listingId:string; buyerId:string; amount:number; status:'OPEN'|'COUNTERED'|'ACCEPTED'|'DECLINED'|'EXPIRED'|'CANCELLED'; expiresAt:string; marketSnapshot:MarketSnapshot; }
export interface TradeItem { cardInstanceId:string; ownerId:string; marketSnapshot:MarketSnapshot; }
export interface TradeProposal { id:string; proposerId:string; counterpartyId:string; offered:TradeItem[]; requested:TradeItem[]; cashFromProposer:number; cashFromCounterparty:number; status:TradeStatus; expiresAt?:string; createdAt:string; }

export interface GrailRating {
  cardMasterId:string; conditionKey?:string; score:number;
  valueScore:number; demandScore:number; scarcityScore:number; significanceScore:number; momentumScore:number;
  band:'GRAIL'|'ELITE'|'NOTABLE'|'NONE'; calculatedAt:string; explanation:string[];
}
