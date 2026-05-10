import * as StellarSdk from "@stellar/stellar-sdk";
import { encrypt, decrypt } from "./encryption";

const NETWORK = process.env.STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = process.env.STELLAR_FRIENDBOT_URL || "https://friendbot.stellar.org";

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export const NETWORK_PASSPHRASE =
  NETWORK === "mainnet"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

export const USDC_ASSET = new StellarSdk.Asset(
  process.env.USDC_ASSET_CODE || "USDC",
  process.env.USDC_ASSET_ISSUER || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
);

export const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || "0.005");
export const MIN_TRANSACTION_USD = parseFloat(process.env.MIN_TRANSACTION_USD || "1");

// Generate a new Stellar keypair and return encrypted secret
export function generateWallet(): { publicKey: string; encryptedSecret: string } {
  const keypair = StellarSdk.Keypair.random();
  const publicKey = keypair.publicKey();
  const encryptedSecret = encrypt(keypair.secret());
  return { publicKey, encryptedSecret };
}

// Get keypair from encrypted secret
export function getKeypairFromEncrypted(encryptedSecret: string): StellarSdk.Keypair {
  const secret = decrypt(encryptedSecret);
  return StellarSdk.Keypair.fromSecret(secret);
}

// Fund wallet via Friendbot (testnet only)
export async function fundWalletFriendbot(publicKey: string): Promise<boolean> {
  if (NETWORK === "mainnet") {
    throw new Error("Friendbot not available on mainnet. Use treasury wallet.");
  }
  try {
    const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
    return response.ok;
  } catch {
    return false;
  }
}

// Create USDC trustline for a wallet
export async function createUSDCTrustline(encryptedSecret: string): Promise<string> {
  const keypair = getKeypairFromEncrypted(encryptedSecret);
  const account = await server.loadAccount(keypair.publicKey());

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: USDC_ASSET,
        limit: "1000000000",
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(keypair);
  const result = await server.submitTransaction(transaction);
  return result.hash;
}

// Get USDC balance for an account
export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const usdcBalance = account.balances.find(
      (b) =>
        b.asset_type === "credit_alphanum4" &&
        (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code === USDC_ASSET.getCode() &&
        (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer === USDC_ASSET.getIssuer()
    );
    return usdcBalance ? usdcBalance.balance : "0";
  } catch {
    return "0";
  }
}

// Send USDC from one wallet to another with fee split
export async function sendUSDCWithFee(params: {
  fromEncryptedSecret: string;
  toPublicKey: string;
  amount: string;
  memo?: string;
}): Promise<{ hash: string; netAmount: string; fee: string }> {
  const { fromEncryptedSecret, toPublicKey, amount, memo } = params;
  const keypair = getKeypairFromEncrypted(fromEncryptedSecret);
  const account = await server.loadAccount(keypair.publicKey());

  const amountNum = parseFloat(amount);
  const feeAmount = (amountNum * PLATFORM_FEE_PERCENT).toFixed(7);
  const netAmount = (amountNum - parseFloat(feeAmount)).toFixed(7);

  const feePublicKey = process.env.PLATFORM_FEE_PUBLIC_KEY!;

  const txBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: (parseInt(StellarSdk.BASE_FEE) * 2).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: toPublicKey,
        asset: USDC_ASSET,
        amount: netAmount,
      })
    )
    .addOperation(
      StellarSdk.Operation.payment({
        destination: feePublicKey,
        asset: USDC_ASSET,
        amount: feeAmount,
      })
    );

  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo.substring(0, 28)));
  }

  const transaction = txBuilder.setTimeout(30).build();
  transaction.sign(keypair);
  const result = await server.submitTransaction(transaction);

  return { hash: result.hash, netAmount, fee: feeAmount };
}

// Send USDC from platform intermediary to creator after payment validation
export async function forwardPaymentToCreator(params: {
  toPublicKey: string;
  amount: string;
  memo: string;
}): Promise<string> {
  const { toPublicKey, amount, memo } = params;
  const intermediarySecret = process.env.PLATFORM_INTERMEDIARY_SECRET_KEY!;
  const keypair = StellarSdk.Keypair.fromSecret(intermediarySecret);
  const account = await server.loadAccount(keypair.publicKey());

  const amountNum = parseFloat(amount);
  const feeAmount = (amountNum * PLATFORM_FEE_PERCENT).toFixed(7);
  const netAmount = (amountNum - parseFloat(feeAmount)).toFixed(7);
  const feePublicKey = process.env.PLATFORM_FEE_PUBLIC_KEY!;

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: (parseInt(StellarSdk.BASE_FEE) * 2).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: toPublicKey,
        asset: USDC_ASSET,
        amount: netAmount,
      })
    )
    .addOperation(
      StellarSdk.Operation.payment({
        destination: feePublicKey,
        asset: USDC_ASSET,
        amount: feeAmount,
      })
    )
    .addMemo(StellarSdk.Memo.text(memo.substring(0, 28)))
    .setTimeout(30)
    .build();

  transaction.sign(keypair);
  const result = await server.submitTransaction(transaction);
  return result.hash;
}

// Refund a payment back to sender
export async function refundPayment(params: {
  toPublicKey: string;
  amount: string;
  memo: string;
}): Promise<string> {
  const { toPublicKey, amount, memo } = params;
  const intermediarySecret = process.env.PLATFORM_INTERMEDIARY_SECRET_KEY!;
  const keypair = StellarSdk.Keypair.fromSecret(intermediarySecret);
  const account = await server.loadAccount(keypair.publicKey());

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: toPublicKey,
        asset: USDC_ASSET,
        amount: amount,
      })
    )
    .addMemo(StellarSdk.Memo.text(`REFUND:${memo}`.substring(0, 28)))
    .setTimeout(30)
    .build();

  transaction.sign(keypair);
  const result = await server.submitTransaction(transaction);
  return result.hash;
}

// Generate SEP-0007 payment URI
export function generateSEP0007URI(params: {
  destination: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: string;
}): string {
  const { destination, amount, assetCode, assetIssuer, memo, memoType } = params;
  const queryParams = new URLSearchParams({ destination });
  if (amount) queryParams.set("amount", amount);
  if (assetCode) queryParams.set("asset_code", assetCode);
  if (assetIssuer) queryParams.set("asset_issuer", assetIssuer);
  if (memo) queryParams.set("memo", memo);
  if (memoType) queryParams.set("memo_type", memoType);
  return `web+stellar:pay?${queryParams.toString()}`;
}

// Generate unique payment memo
export function generatePaymentMemo(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let memo = "SPL-";
  for (let i = 0; i < 6; i++) {
    memo += chars[Math.floor(Math.random() * chars.length)];
  }
  return memo;
}

// Validate Stellar public key
export function isValidPublicKey(key: string): boolean {
  try {
    StellarSdk.Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
}
