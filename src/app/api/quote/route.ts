import { NextRequest, NextResponse } from 'next/server';
import { lifiService } from '@/services/lifi';
import { networks } from '@/config/networks';
import { parseUnits } from 'viem';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      amount,
      userAddress,
      destinationChainId,
      destinationTokenAddress
    } = body;

    if (!amount || !userAddress || !destinationChainId || !destinationTokenAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const amountInMicro = parseUnits(amount, 6).toString();

    const cctpLeg = {
      type: 'cctp',
      sourceChain: networks.arcTestnet.name,
      sourceChainId: networks.arcTestnet.chainId,
      destinationChain: networks.baseSepolia.name,
      destinationChainId: networks.baseSepolia.chainId,
      token: networks.arcTestnet.usdcAddress,
      amount: amountInMicro,
      estimatedTimeSeconds: 20,
      instructions: {
        contractAddress: networks.arcTestnet.cctpTokenMessenger,
        functionName: 'depositForBurn',
      }
    };

    const baseMainnetUSDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    
    let lifiLeg;
    try {
      const lifiQuote = await lifiService.getQuote({
        fromChain: 8453,
        toChain: destinationChainId,
        fromToken: baseMainnetUSDC,
        toToken: destinationTokenAddress,
        fromAmount: amountInMicro,
        fromAddress: userAddress
      });
      
      lifiLeg = {
        type: 'aggregator',
        provider: 'lifi',
        sourceChainId: 8453,
        destinationChainId: destinationChainId,
        estimatedTimeSeconds: lifiQuote.estimate.executionDuration,
        feeCosts: lifiQuote.estimate.feeCosts,
        gasCosts: lifiQuote.estimate.gasCosts,
        expectedOutputAmount: lifiQuote.estimate.toAmount,
        transactionRequest: lifiQuote.transactionRequest
      };
    } catch (e: any) {
      console.error('LI.FI Quote Error:', e.message);
      lifiLeg = {
        type: 'aggregator',
        provider: 'lifi',
        error: 'Failed to fetch aggregator route for Leg 2: ' + e.message
      };
    }

    return NextResponse.json({
      success: true,
      route: {
        totalAmountIn: amountInMicro,
        estimatedTotalTimeSeconds: cctpLeg.estimatedTimeSeconds + (lifiLeg.estimatedTimeSeconds || 0),
        legs: [cctpLeg, lifiLeg]
      }
    });

  } catch (error: any) {
    console.error('Quote Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
