# Project Memory: Arc Bridge & Swap Frontend

## Project Overview
A unified bridge and swap frontend allowing users to transfer USDC from the Arc blockchain to any token on any EVM or SVM network.

## Architecture
- **Framework**: Next.js 14 App Router, React, Tailwind CSS, Framer Motion
- **Web3 Stack**: Privy (`@privy-io/react-auth`, `@privy-io/wagmi`), Wagmi, Viem, `@solana/web3.js`
- **Hub Routing Architecture (EVM)**:
  - Leg 1: CCTP from Arc -> Base Hub (via `depositForBurn`).
  - Leg 2: LI.FI swap/bridge from Base Hub -> Final Destination Chain & Token.
- **Isolated Solana Architecture (Phase 2.5)**:
  - CCTP Burn on Arc -> Circle Forwarding Service / Gas Station (Fee Payer) funds ATA & Mints USDC on Solana.
- **Smart Wallet / Gas Abstraction (Phase 3 - PENDING)**:
  - ZeroDev/Biconomy integration to allow users to pay gas in USDC on EVM networks.

## Current State
- ✅ Phase 1: Hub Routing Architecture (Completed & Tested)
- ✅ Phase 2: UI implementation with Framer Motion (Completed)
- ✅ Phase 2.5: Solana Integration & UX Upgrades (Implemented)
- ⏳ Phase 3: Smart Wallet / Gas Abstraction (Not Started)

## Latest Summary
- **Current Focus**: Waiting for the user to verify Phase 2.5 before starting Phase 3.
- **Last Action**: Fully implemented Phase 2.5 in `page.tsx`, `quote/route.ts`, and `solana.ts`. Migrated from raw Wagmi to Privy for dual EVM/SVM wallet support. Added Unified Transfer toggle (Send vs Swap). Added Custom Token CA parsing via `viem` / `@solana/web3.js`. Branched execution logic so Solana is isolated to `solanaService`.
- **Blockers**: None. Awaiting user testing.

## Change Log
- [2026-09-20] - IMPORTANT - Finalized Hub Routing and UI design.
- [2026-09-20] - CRITICAL - Designed Phase 2.5 and Phase 3 roadmap.
- [2026-09-21] - IMPORTANT - Migrated to Privy Provider in `providers.tsx`.
- [2026-09-21] - CRITICAL - Added Solana CCTP/Gas Station isolation and Unified Transfer UI to `page.tsx`.

## Pending Tasks
- User needs to provide a `NEXT_PUBLIC_PRIVY_APP_ID` in their environment variables.
- User needs to test the Privy login and Solana routing on the dev server.
- Proceed to Phase 3 (Smart Wallets/Gas Abstraction) once testing is complete.

## Known Issues
- LI.FI quotes for Custom Tokens might fail or have high slippage if the token lacks liquidity on the destination chain.

## Decisions & Reasoning
- **Privy Migration**: Selected Privy over standard wagmi connectors to elegantly handle dual wallet injection (MetaMask + Phantom) without overwhelming the user or fragmenting the UI.
- **Solana Isolation**: Separated Solana CCTP Minting into `solana.ts` because it avoids the LI.FI Hub entirely, routing directly Arc -> Solana and relying on Circle's Gas Station to fund the ATA, preventing EVM smart contract logic from running unnecessarily.
