-- Marketplace extension sketch for PostgreSQL. Refine migrations before production.
create table listings (
 id uuid primary key, card_instance_id uuid not null, seller_id uuid not null,
 listing_type text not null, status text not null, ask_price numeric(14,2), reserve_price numeric(14,2),
 starts_at timestamptz, ends_at timestamptz, allow_offers boolean default true, allow_trades boolean default false,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table bids (
 id uuid primary key, auction_id uuid not null references listings(id), bidder_id uuid not null,
 amount numeric(14,2) not null, max_amount numeric(14,2), status text not null, created_at timestamptz default now()
);
create table offers (
 id uuid primary key, listing_id uuid not null references listings(id), buyer_id uuid not null,
 amount numeric(14,2) not null, status text not null, expires_at timestamptz,
 market_snapshot jsonb not null, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table trade_proposals (
 id uuid primary key, proposer_id uuid not null, counterparty_id uuid not null, status text not null,
 cash_from_proposer numeric(14,2) default 0, cash_from_counterparty numeric(14,2) default 0,
 expires_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table trade_items (
 id uuid primary key, trade_id uuid not null references trade_proposals(id), side text not null,
 card_instance_id uuid not null, owner_id uuid not null, market_snapshot jsonb not null
);
create table provenance_events (
 id uuid primary key, card_instance_id uuid not null, event_type text not null,
 occurred_at timestamptz not null, transaction_id uuid, payload jsonb, verification_status text not null
);
create table grail_ratings (
 id uuid primary key, card_master_id uuid not null, condition_key text, score numeric(5,2) not null,
 value_score numeric(5,2), demand_score numeric(5,2), scarcity_score numeric(5,2), significance_score numeric(5,2), momentum_score numeric(5,2),
 band text not null, explanation jsonb, calculated_at timestamptz default now()
);
