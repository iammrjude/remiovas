# Remiovas

> **"Stripe payment links, but on Stellar."**

A full-stack fintech web app for creating shareable payment pages on Stellar in
under 30 seconds. Accept USDC from anyone, anywhere, with no crypto expertise
required.

---

## What It Does

- **Sign up** → get an auto-generated Stellar wallet
- **Create a payment page** → shareable link at `/pay/your-slug`
- **Create payment requests** → fixed-amount links per invoice or product
- **Accept USDC** via platform account (instant) or external Stellar wallet (SEP-0007)
- **Send USDC** to other users by username or any Stellar address
- **QR codes** for every payment page and request (SEP-0007 compliant -
  auto-fills all fields)
- **0.5% platform fee** on every payment (sustainable business model built in)

---

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Frontend | Next.js | 16.2.6 |
| Styling | Tailwind CSS | 4.3.0 |
| Database | MongoDB + Mongoose | 9.6.2 |
| Blockchain | @stellar/stellar-sdk | 15.1.0 |
| Auth | JWT + bcryptjs + jose | latest |
| Email | Nodemailer + Gmail SMTP | 8.0.7 |
| Encryption | Node.js crypto (AES-256-GCM) | built-in |
| QR Codes | qrcode | 1.5.4 |
| Runtime | Node.js | 20.x |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 1.22.22+
- MongoDB (local or Atlas)
- A Gmail account with App Password enabled
- Stellar testnet account (for platform wallets)

> This repository is Yarn-only. Please do not commit npm/pnpm/bun lockfiles.

### If `yarn` Command Is Not Found

Use Corepack first (included with modern Node.js versions):

#### Windows (PowerShell)

```powershell
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn --version
```

#### macOS (Terminal)

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn --version
```

#### Linux (Terminal)

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn --version
```

If Corepack is unavailable, install Yarn globally:

- Windows: `npm install -g yarn`
- macOS: `npm install -g yarn`
- Linux: `npm install -g yarn`

### 1. Clone and Install

```bash
git clone https://github.com/your-username/remiovas.git
cd remiovas
yarn install
```

### 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/remiovas

# Auth
NEXTAUTH_SECRET=your-random-secret-min-32-chars
JWT_SECRET=your-random-jwt-secret-min-32-chars

# AES-256 key (exactly 64 hex characters = 32 bytes)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-char-hex-key

# Stellar (testnet)
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_FRIENDBOT_URL=https://friendbot.stellar.org

# Platform wallets (generate 3 Stellar keypairs)
# Use:
# node -e "const sdk = require('@stellar/stellar-sdk');"
# "const kp = sdk.Keypair.random();"
# "console.log(kp.publicKey(), kp.secret())"
PLATFORM_INTERMEDIARY_SECRET_KEY=S...
PLATFORM_INTERMEDIARY_PUBLIC_KEY=G...
PLATFORM_FEE_SECRET_KEY=S...
PLATFORM_FEE_PUBLIC_KEY=G...
PLATFORM_GAS_SECRET_KEY=S...
PLATFORM_GAS_PUBLIC_KEY=G...

# USDC on Stellar Testnet
USDC_ASSET_CODE=USDC
USDC_ASSET_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5

# Email (Gmail SMTP)
GMAIL_USER=your-app@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Remiovas

# Limits
PLATFORM_FEE_PERCENT=0.005
MIN_TRANSACTION_USD=1
MAX_DAILY_REFUNDS=100
MAX_SENDER_FAILURES=3
```

### 3. Generate Platform Wallets

Run this script to generate your 3 platform wallets (intermediary, fee, gas):

```bash
node -e "
const sdk = require('@stellar/stellar-sdk');
['Intermediary', 'Fee', 'Gas'].forEach(name => {
  const kp = sdk.Keypair.random();
  console.log(name + ':');
  console.log('  Public:', kp.publicKey());
  console.log('  Secret:', kp.secret());
});
"
```

On testnet, fund each wallet via Friendbot:

```text
https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY
```

### 4. Run

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Architecture

### Wallet Strategy

**On signup:**

- Stellar keypair generated immediately
- Private key AES-256-GCM encrypted and stored in MongoDB
- Private key never returned in any API response

**On email verification (testnet):**

- Stellar Friendbot funds the wallet with test XLM
- USDC trustline created automatically

**On email verification (mainnet):**
> See [Mainnet Notes](#mainnet-notes) below.

### Payment Flow

**Platform account payments:**

1. Payer logs in inline on the payment page
2. Our backend constructs the Stellar transaction (server-side always)
3. USDC sent from payer's wallet to creator's wallet
4. 0.5% fee split to platform fee wallet in same transaction

**External wallet payments:**

1. We display our intermediary wallet address + unique memo
2. SEP-0007 QR auto-fills address, amount, and memo in Lobstr/Solar
3. Horizon SSE listener receives payment
4. We validate amount, asset, and memo
5. Correct → forward to creator minus 0.5% fee
6. Wrong → auto-refund to sender

### Fee / Gas Strategy

- 0.5% USDC fee collected on every successful payment
- A portion converted to XLM to maintain gas reserve wallet
- Gas reserve funds: wallet activations, trustlines, payment forwards, refunds
- Monitor `PLATFORM_GAS_PUBLIC_KEY` balance and top up when low

---

## Mainnet Notes

> **Important:** Friendbot does not exist on mainnet.

On mainnet, wallet activation requires a **treasury wallet** funded with XLM:

1. Maintain a treasury wallet with sufficient XLM (minimum recommended:
   10 XLM per expected daily signups)
2. On email verification, backend sends ~2 XLM from treasury to new user wallet
3. Then creates USDC trustline (costs 0.5 XLM base reserve + Stellar fee)
4. Monitor treasury balance via Stellar Horizon — alert when below threshold
5. Top up treasury from exchange or revenue XLM conversions

**Treasury monitoring:** Set up a cron job or monitoring service to check
`PLATFORM_GAS_PUBLIC_KEY` and `PLATFORM_INTERMEDIARY_PUBLIC_KEY` daily.

**Liquidity:** User USDC balances in our database are backed by USDC held in
our platform wallets. Ensure platform wallet USDC >= total user balances.

---

## Security

### Implemented

- AES-256-GCM encryption for all private keys (never stored plain)
- bcrypt password hashing (12 salt rounds)
- JWT auth with short-lived access tokens (15 min) + refresh tokens (7 days)
- HTTP-only cookies (never localStorage)
- CSRF protection via SameSite=Strict cookies
- Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- All transactions constructed server-side (fee wallet hardcoded)
- Input validation with Zod on all API routes
- Rate limiting on all sensitive endpoints
- Auto-refund system for wrong payments
- Daily refund cap (100/day) to prevent gas drain attacks
- Sender blacklist after 3 failures in 24 hours
- $1 minimum transaction to prevent dust attacks

### Known Loopholes & Mitigations (document for future hardening)

| Attack | Mitigation |
| --- | --- |
| Mass account creation | Email verification before wallet activation |
| SIM card farming for phone bypass | Phone OTP planned (post-MVP) |
| Device fingerprint spoofing | FingerprintJS planned (post-MVP) |
| Micro-transaction drain | $1 minimum transaction enforced |
| Refund abuse | 3-failure blacklist + 100/day auto-refund cap |
| Fake payment page phishing | Reserved slugs list + report page button |
| Client-side fee bypass | All transactions built server-side only |
| Rapid deposit/withdrawal cycling | Cooldown period planned (post-MVP) |

---

## Business Model

### Revenue Streams

#### 1. Transaction Fee (0.5%)

Every payment automatically splits: 99.5% to creator and 0.5% to the platform
fee wallet. Built in from day one with no opt-out.

| Volume | Monthly Revenue |
| --- | --- |
| 100 creators × $500/mo | $250 |
| 1,000 creators × $1,000/mo | $5,000 |
| 5,000 creators × $1,000/mo | $25,000 |

#### 2. Pro Subscription ($8/month) - Post-MVP

- Unlimited payment pages
- Remove "Powered by Remiovas" branding
- Custom domain support
- Advanced analytics

#### 3. Stellar Community Fund Grant

Apply to [SCF](https://communityfund.stellar.org/) once MVP has live on-chain
traction. Realistic range: $15,000-$50,000 for a working product with
measurable volume.

---

## Post-MVP Features (Planned)

- [ ] Avatar upload (requires Cloudinary or S3)
- [ ] Card payments on payment page (Flutterwave / Paystack)
- [ ] Virtual card issuing (Union54 or Stripe Issuing)
- [ ] Pro subscription billing
- [ ] EURC and NGNC stablecoin support
- [ ] Phone OTP verification
- [ ] Device fingerprinting for duplicate detection
- [ ] Withdrawal cooldown after deposit
- [ ] Manual review queue UI for held payments
- [ ] Programmatic API for generating payment links

---

## Wave Contributor Issues (Open for Contributors)

The following are planned Wave issues. Contributors earn points by
implementing them.

1. **Path Payments** - let payers send any Stellar asset; creator receives
   USDC automatically via Stellar DEX
2. **Email notifications on payment received** — Nodemailer email when payment lands
3. **CSV export** of payment history from dashboard
4. **Analytics dashboard** — 30-day payment volume chart per page
5. **Custom domain** for payment pages (`pay.yourdomain.com`)
6. **Multi-language support** (i18n) — start with French, Spanish, Portuguese
7. **EURC and NGNC** stablecoin support
8. **Dark mode** toggle
9. **Avatar upload** with Cloudinary or S3
10. **Tip-jar mode** — preset payment amount buttons ($5/$10/$25/Custom)
11. **Webhook support** — POST to creator's endpoint on payment received
12. **Programmatic API** — generate payment request links via REST API
13. **2FA via email OTP** — second factor on login
14. **Phone OTP verification** — stronger identity check for wallet activation
15. **Device fingerprinting** — FingerprintJS for duplicate account detection
16. **Manual review queue** — UI for admin to resolve held payments
17. **Forgot password flow** improvements — resend, expiry UI
18. **Pro subscription billing** — Flutterwave recurring payments
19. **Card payments** on payment page — Flutterwave/Paystack integration
20. **Virtual card issuing** — Union54 or Stripe Issuing

---

## Contributing

1. Pick an open issue from the Wave issue list above
2. Fork the repo and create a branch: `git checkout -b feature/your-feature`
3. Write clean, typed TypeScript
4. Test your changes locally
5. Open a PR with a clear description of what you built and why

### Local Dev

```bash
yarn dev     # development server
yarn build   # production build
yarn lint    # lint check
```

---

## License

MIT — free to use, modify, and distribute.

---

*Built on [Stellar](https://stellar.org) · Participating in [Drips Wave](https://drips.network/wave)*
