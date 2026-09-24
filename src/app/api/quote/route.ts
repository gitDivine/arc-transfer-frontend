import { NextRequest, NextResponse } from 'next/server';
import { lifiService } from '@/services/lifi';
import { parseUnits } from 'viem';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      amount,
      userAddress,
      destinationAddress,
      destinationChainId,
      destinationTokenAddress
    } = body;

    if (!amount || !userAddress || !destinationAddress || !destinationChainId || !destinationTokenAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const amountInMicro = parseUnits(amount, 6).toString();

    let lifiLeg;
    try {
      const lifiQuote = await lifiService.getQuote({
        fromChain: 5042,
        toChain: destinationChainId,
        fromToken: 'USDC',
        toToken: destinationTokenAddress,
        fromAmount: amountInMicro,
        fromAddress: userAddress,
        toAddress: destinationAddress
      });
      
      lifiLeg = {
        type: 'aggregator',
        provider: 'lifi',
        sourceChainId: 5042,
        destinationChainId: destinationChainId,
        estimatedTimeSeconds: lifiQuote.estimate.executionDuration,
        feeCosts: lifiQuote.estimate.feeCosts,
        gasCosts: lifiQuote.estimate.gasCosts,
        expectedOutputAmount: lifiQuote.estimate.toAmount,
        toTokenDecimals: lifiQuote.action.toToken.decimals,
        toTokenSymbol: lifiQuote.action.toToken.symbol,
        transactionRequest: lifiQuote.transactionRequest
      };
    } catch (err: any) {
      return NextResponse.json({ 
        success: false, 
        error: err.message || 'Failed to get LI.FI quote'
      });
    }
    
    return NextResponse.json({
      success: true,
      route: {
        totalAmountIn: amountInMicro,
        estimatedTotalTimeSeconds: lifiLeg.estimatedTimeSeconds,
        legs: [lifiLeg]
      }
    });

  } catch (error) {
    console.error('Quote Route Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
