import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!process.env.BLOCKCHAIN_RPC_URL || !process.env.BLOCKCHAIN_PRIVATE_KEY) {
      console.warn("Blockchain env vars missing, skipping real transaction.");
      return NextResponse.json({ 
        tx_hash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        success: true,
        simulated: true
      });
    }

    // Connect to blockchain using existing env vars
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, provider);
    
    // Create tamper-proof hash of the transaction
    const dataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({
        type: body.type,
        member_id: body.member_id,
        chama_id: body.chama_id,
        amount: body.amount,
        receipt: body.mpesa_receipt,
        timestamp: body.timestamp
      }))
    );
    
    // Send to blockchain (append-only record)
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      data: dataHash,
      value: 0
    });
    
    await tx.wait();
    
    return NextResponse.json({ 
      tx_hash: tx.hash,
      success: true 
    });
  } catch (error: any) {
    console.error("Blockchain error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
