import QRCode from "qrcode";

// Polygon Mumbai Testnet configuration
const POLYGON_RPC = process.env.BLOCKCHAIN_RPC_URL || "https://rpc-mumbai.maticvigil.com";
const EXPLORER_URL = "https://mumbai.polygonscan.com";

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  explorerUrl: string;
  qrCode: string;
}

export async function recordTransactionOnBlockchain(
  transactionData: {
    chamaId: string;
    memberId: string;
    amount: number;
    type: string;
    timestamp: number;
  }
): Promise<BlockchainTransaction | null> {
  try {
    // Check if blockchain is configured
    if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
      return null;
    }

    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);

    // Create transaction data hash
    const dataString = JSON.stringify(transactionData);
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(dataString));

    // Send transaction with data hash in the data field
    const tx = await wallet.sendTransaction({
      to: wallet.address, // Send to self
      value: 0, // No value transfer
      data: dataHash,
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    // Generate explorer URL
    const explorerUrl = `${EXPLORER_URL}/tx/${receipt.hash}`;

    // Generate QR code
    const qrCode = await QRCode.toDataURL(explorerUrl);

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      explorerUrl,
      qrCode,
    };
  } catch (error) {
    console.error("Error recording on blockchain:", error);
    return null;
  }
}

export async function verifyBlockchainTransaction(
  txHash: string
): Promise<boolean> {
  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt !== null && receipt.status === 1;
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return false;
  }
}

export function getExplorerUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}
