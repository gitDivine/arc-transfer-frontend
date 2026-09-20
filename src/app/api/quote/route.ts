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
      destinationTokenAddress,
      hubChainId,
      hubTokenAddress,
      hubChainName
    } = body;

    if (!amount || !userAddress || !destinationChainId || !destinationTokenAddress || !hubChainId || !hubTokenAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const amountInMicro = parseUnits(amount, 6).toString();

    const cctpLeg = {
      type: 'cctp',
      sourceChain: networks.arcMainnet.name,
      sourceChainId: networks.arcMainnet.chainId,
      destinationChain: hubChainName,
      destinationChainId: hubChainId,
      token: networks.arcMainnet.usdcAddress,
      amount: amountInMicro,
      estimatedTimeSeconds: 20,
      instructions: {
        contractAddress: networks.arcMainnet.cctpTokenMessenger,
        functionName: 'depositForBurn',
        destinationDomain: hubChainId === 42161 ? 3 : 6
      }
    };
    
    let lifiLeg;
    try {
      const lifiQuote = await lifiService.getQuote({
        fromChain: hubChainId,
        toChain: destinationChainId,
        fromToken: hubTokenAddress,
        toToken: destinationTokenAddress,
        fromAmount: amountInMicro,
        fromAddress: userAddress
      });
      
      lifiLeg = {
        type: 'aggregator',
        provider: 'lifi',
        sourceChainId: hubChainId,
        destinationChainId: destinationChainId,
        estimatedTimeSeconds: lifiQuote.estimate.executionDuration,
        feeCosts: lifiQuote.estimate.feeCosts,
        gasCosts: lifiQuote.estimate.gasCosts,
        expectedOutputAmount: lifiQuote.estimate.toAmount,
        toTokenDecimals: lifiQuote.action.toToken.decimals,
        toTokenSymbol: lifiQuote.action.toToken.symbol,
        transactionRequest: lifiQuote.transactionRequest
      };
    } catch (e) {
      console.error('LI.FI Quote Error:', e instanceof Error ? e.message : 'Unknown error');
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

  } catch (error) {
    console.error('Quote Route Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
