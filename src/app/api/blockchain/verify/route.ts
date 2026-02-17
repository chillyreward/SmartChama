import { NextRequest, NextResponse } from "next/server";
import { verifyBlockchainTransaction, getExplorerUrl } from "@/lib/blockchain";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const txHash = searchParams.get("hash");

    if (!txHash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 }
      );
    }

    const isValid = await verifyBlockchainTransaction(txHash);
    const explorerUrl = getExplorerUrl(txHash);

    return NextResponse.json({
      success: true,
      valid: isValid,
      hash: txHash,
      explorerUrl,
    });
  } catch (error) {
    console.error("Blockchain verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
