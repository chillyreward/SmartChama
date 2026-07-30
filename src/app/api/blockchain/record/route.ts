import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.type || !body.chama_id) {
      return NextResponse.json({ error: 'Missing required fields: type, chama_id' }, { status: 400 });
    }

    if (!process.env.BLOCKCHAIN_RPC_URL || !process.env.BLOCKCHAIN_PRIVATE_KEY) {
      console.warn("Blockchain env vars missing, skipping real transaction.");
      return NextResponse.json({ 
        tx_hash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        success: true,
        simulated: true
      });
    }

    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, provider);
    
    const dataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({
        type: body.type,
        member_id: body.member_id,
        chama_id: body.chama_id,
        amount: body.amount,
        receipt: body.mpesa_receipt,
        timestamp: body.timestamp || new Date().toISOString()
      }))
    );
    
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
