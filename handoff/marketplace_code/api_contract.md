# Marketplace API Contract — starting point

GET /api/market/cards/{cardMasterId}?condition=PSA_8&period=90D
GET /api/market/cards/{cardMasterId}/active-listings
GET /api/market/cards/{cardMasterId}/trade-availability
GET /api/market/cards/{cardMasterId}/grail-rating

POST /api/listings
PATCH /api/listings/{id}
POST /api/listings/{id}/offers
POST /api/offers/{id}/counter
POST /api/offers/{id}/accept

POST /api/auctions/{id}/bids
GET /api/auctions/{id}/bid-history

POST /api/trades
PATCH /api/trades/{id}
POST /api/trades/{id}/counter
POST /api/trades/{id}/accept
POST /api/trades/{id}/decline
GET /api/trades/{id}/market-alignment

All mutating endpoints must enforce ownership, instance availability, idempotency, authorization and state-machine transitions. Acceptance endpoints should create a market snapshot and lock relevant card instances atomically.
