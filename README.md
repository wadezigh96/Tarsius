# Tarsius

**Tarsius — Personal Crypto Agent**

A safety-first crypto assistant for personal portfolio management across **BNB Chain**, **Solana**, and **Robinhood Crypto**.

## Product goal

Tarsius is designed to do useful crypto work without giving an AI model custody of private keys.

### Core modules

- Unified portfolio and transaction history
- BNB Chain wallet connector
- Solana wallet connector
- Robinhood Crypto API connector
- Meme-token scanner
- Anti-rug risk engine
- Paper sniper
- Live sniper behind explicit policy + human approval
- Transaction simulation and audit log

## Safety model

The LLM may **observe, analyze, propose, simulate, and request approval**.

The LLM must **never receive or store private keys** and must not silently execute trades.

Default policy:

- Max trade: $10
- Max daily spend: $50
- Max slippage: 2%
- Paper mode by default
- Human approval required for live execution
- Block unknown/unverified execution paths

Anti-rug checks are risk indicators, not guarantees. A token can still be malicious even when a checklist passes.

## MVP status

v0.1 is a paper-first UI scaffold. Chain data, wallet signing, Robinhood credentials, and live execution are intentionally not wired yet.

## Run

```bash
npm install
npm run dev
```

Then open the local Next.js URL.

## Roadmap

1. Read-only BNB + Solana portfolio
2. Robinhood read-only connector
3. Real token/DEX risk data
4. Transaction simulation
5. Paper sniper alerts
6. Explicit approval flow
7. Live execution adapters
8. Audit log + kill switch

## Security principle

**Keys stay with the wallet/signer. The agent receives capabilities, not secrets.**
