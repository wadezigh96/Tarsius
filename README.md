# Tarsius

**Tarsius — Personal Crypto Agent**

A flexible, safety-aware crypto assistant for personal portfolio management across **BNB Chain**, **Solana**, and **Robinhood Crypto**.

## Current status: v0.3

Tarsius now has a real onchain read layer:

- BNB Smart Chain mainnet RPC reads
- Solana mainnet RPC reads
- Native BNB and SOL balances by user-supplied address
- Live block/slot indicators
- 5-second dashboard refresh
- No private keys
- No transaction signing or broadcast from the dashboard

BNB Smart Chain mainnet uses chain ID 56. Solana RPC supports state reads and live subscriptions; this first dashboard layer uses short polling so it also works cleanly in serverless deployments. citeturn0search5turn0search0

## Safety model

The agent may **observe, analyze, propose, simulate, and request approval**.

The agent must **never receive or store private keys**.

Safety is intentionally flexible:

- **Normal:** light confirmation
- **Risky:** show reasons and let the user confirm
- **Critical:** explicit confirmation / user policy
- **Impossible:** block invalid or technically impossible execution

User-configurable policy includes maximum trade, maximum daily spend, maximum slippage, and whether critical-risk actions are allowed.

Anti-rug checks are **risk indicators, not guarantees**.

## Roadmap

1. Live BNB + Solana portfolio reads — **done**
2. Robinhood read-only connector
3. Onchain token contract inspection
4. DEX liquidity / holder / authority risk engine
5. Solana mint and token-account inspection
6. Transaction simulation
7. Paper sniper alerts
8. Assisted live execution
9. Optional policy-based auto execution
10. Audit log + kill switch

## RPC configuration

Development defaults are included. For production, use dedicated/private RPC providers rather than shared public endpoints. Solana explicitly notes that its public RPC endpoints are shared infrastructure and not intended for production applications. citeturn0search0

Set:

- `BNB_RPC_URL`
- `SOLANA_RPC_URL`

See `.env.example`.

## Run

```bash
npm install
npm run dev
```

## Security principle

**Keys stay with the wallet/signer. The agent receives capabilities, not secrets.**
