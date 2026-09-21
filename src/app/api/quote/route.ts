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
      destinationAddress,
      destinationChainId,
      destinationTokenAddress,
      hubChainId,
      hubTokenAddress,
      hubChainName
    } = body;

    if (!amount || !userAddress || !destinationAddress || !destinationChainId || !destinationTokenAddress || !hubChainId || !hubTokenAddress) {
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
      // Only fetch LI.FI if we actually need a swap or a bridge
      const isSameChain = hubChainId === destinationChainId;
      const isSameToken = hubTokenAddress.toLowerCase() === destinationTokenAddress.toLowerCase();
      
      if (!isSameChain || !isSameToken) {
        const lifiQuote = await lifiService.getQuote({
          fromChain: hubChainId,
          toChain: destinationChainId,
          fromToken: hubTokenAddress,
          toToken: destinationTokenAddress,
          fromAmount: amountInMicro,
          fromAddress: userAddress,
          toAddress: destinationAddress
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
      }
    } catch (err: any) {
      return NextResponse.json({ 
        success: false, 
        route: { legs: [cctpLeg] },
        error: err.message || 'Failed to get LI.FI quote'
      });
    }
    
    const legs = [cctpLeg];
    if (lifiLeg) legs.push(lifiLeg);

    return NextResponse.json({
      success: true,
      route: {
        totalAmountIn: amountInMicro,
        estimatedTotalTimeSeconds: cctpLeg.estimatedTimeSeconds + (lifiLeg?.estimatedTimeSeconds || 0),
        legs
      }
    });

  } catch (error) {
    console.error('Quote Route Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
