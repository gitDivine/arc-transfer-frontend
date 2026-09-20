'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useSendTransaction, useSwitchChain, useReadContract, usePublicClient } from 'wagmi';
import { Loader2, CheckCircle2, Zap, ArrowDown, Activity } from 'lucide-react';
import { parseUnits, erc20Abi, decodeEventLog, keccak256 } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const SUPPORTED_DESTINATIONS = [
  { 
    id: 56, 
    name: 'BNB Chain', 
    tokens: [
      { symbol: 'BNB', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' }
    ]
  },
  { 
    id: 42161, 
    name: 'Arbitrum', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' }
    ]
  },
  { 
    id: 10, 
    name: 'Optimism', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' }
    ]
  },
  { 
    id: 137, 
    name: 'Polygon', 
    tokens: [
      { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' }
    ]
  },
  { 
    id: 1, 
    name: 'Ethereum', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
    ]
  }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  
  const [amount, setAmount] = useState('');
  const [destIndex, setDestIndex] = useState(0);
  const [destTokenIndex, setDestTokenIndex] = useState(0);
  const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  const [activeStep, setActiveStep] = useState<number>(0);
  const [txHashes, setTxHashes] = useState<string[]>([]);
  
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();

  const { data: usdcBalance } = useReadContract({
    address: '0x3600000000000000000000000000000000000000', // Arc Mainnet USDC
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 5042
  });

  // Clear quote when inputs change
  useEffect(() => {
    setQuote(null);
  }, [amount, destIndex, destTokenIndex]);

  // Close modal when connected
  useEffect(() => {
    if (isConnected) setIsWalletModalOpen(false);
  }, [isConnected]);

  const handleGetQuote = async () => {
    if (!address) return;
    setIsLoadingQuote(true);
    setQuote(null);
    try {
      const dest = SUPPORTED_DESTINATIONS[destIndex];
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          userAddress: address,
          destinationChainId: dest.id,
          destinationTokenAddress: dest.tokens[destTokenIndex].address
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuote(data.route);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleExecute = async () => {
    if (!quote || !quote.legs || !address) return;
    
    try {
      const cctpLeg = quote.legs[0];
      if (chainId !== cctpLeg.sourceChainId) {
        await switchChainAsync({ chainId: cctpLeg.sourceChainId });
      }
      
      setActiveStep(1); // Approve CCTP
      
      const arcUSDC = '0x3600000000000000000000000000000000000000';
      const cctpApproveTx = await writeContractAsync({
        address: arcUSDC,
        abi: erc20Abi,
        functionName: 'approve',
        args: [cctpLeg.instructions.contractAddress as `0x${string}`, parseUnits(amount, 6)]
      });
      setTxHashes(prev => [...prev, cctpApproveTx]);
      
      setActiveStep(2); // Sign CCTP Burn
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait for approve to mine
      
      const mintRecipient = '0x000000000000000000000000' + address.slice(2).toLowerCase();
      
      const burnTx = await writeContractAsync({
        address: cctpLeg.instructions.contractAddress as `0x${string}`,
        abi: [{
            "inputs": [
              { "internalType": "uint256", "name": "amount", "type": "uint256" },
              { "internalType": "uint32", "name": "destinationDomain", "type": "uint32" },
              { "internalType": "bytes32", "name": "mintRecipient", "type": "bytes32" },
              { "internalType": "address", "name": "burnToken", "type": "address" },
              { "internalType": "bytes32", "name": "destinationCaller", "type": "bytes32" },
              { "internalType": "uint256", "name": "maxFee", "type": "uint256" },
              { "internalType": "uint32", "name": "minFinalityThreshold", "type": "uint32" }
            ],
            "name": "depositForBurn",
            "outputs": [{ "internalType": "uint64", "name": "_nonce", "type": "uint64" }],
            "stateMutability": "nonpayable",
            "type": "function"
        }],
        functionName: 'depositForBurn',
        args: [
          parseUnits(amount, 6),
          6, // Base CCTP Domain
          mintRecipient as `0x${string}`, 
          arcUSDC as `0x${string}`, // The actual USDC token to burn
          '0x0000000000000000000000000000000000000000000000000000000000000000', // destinationCaller
          0n, // maxFee
          2000 // minFinalityThreshold (Standard Transfer)
        ]
      });
      
      setTxHashes(prev => [...prev, burnTx]);
      setActiveStep(3); // Waiting for Circle Attestation
      
      if (!publicClient) throw new Error("Public client not found");
      
      // 1. Get transaction receipt to extract MessageBytes
      const receipt = await publicClient.waitForTransactionReceipt({ hash: burnTx });
      const messageSentTopic = '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';
      const log = receipt.logs.find(l => l.topics[0] === messageSentTopic);
      if (!log) throw new Error("MessageSent log not found");
      
      const decodedLog = decodeEventLog({
        abi: [{ type: 'event', name: 'MessageSent', inputs: [{ indexed: false, name: 'message', type: 'bytes' }] }],
        data: log.data,
        topics: log.topics,
      });
      const messageBytes = decodedLog.args.message;
      const messageHash = keccak256(messageBytes as `0x${string}`);
      
      // 2. Poll Circle IRIS API for Attestation
      let attestation = '';
      while (true) {
        try {
          const res = await fetch(`https://iris-api.circle.com/v1/attestations/${messageHash}`);
          if (res.status === 200) {
            const data = await res.json();
            if (data.status === 'complete' || data.attestation) {
              attestation = data.attestation;
              break;
            }
          }
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      setActiveStep(3.5); // Switch & Claim on Base
      const lifiLeg = quote.legs[1];
      if (chainId !== lifiLeg.sourceChainId) {
        await switchChainAsync({ chainId: lifiLeg.sourceChainId });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // 3. Claim USDC on Base
      const baseMessageTransmitter = '0xAD09780d193884d503182aD4588450C416D6F9D4';
      const receiveTx = await writeContractAsync({
        address: baseMessageTransmitter,
        abi: [{
          "inputs": [
            { "internalType": "bytes", "name": "message", "type": "bytes" },
            { "internalType": "bytes", "name": "attestation", "type": "bytes" }
          ],
          "name": "receiveMessage",
          "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        functionName: 'receiveMessage',
        args: [messageBytes, attestation]
      });
      
      setTxHashes(prev => [...prev, receiveTx]);
      
      // Wait for receiveMessage to mine
      // Since we switched networks, publicClient might still point to Arc, so we use a small delay instead of waitForTransactionReceipt to be safe
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      setActiveStep(4); // Ready to approve LI.FI
      const baseMainnetUSDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      
      // Approve LI.FI to spend USDC
      const approveTx = await writeContractAsync({
        address: baseMainnetUSDC,
        abi: erc20Abi,
        functionName: 'approve',
        args: [lifiLeg.transactionRequest.to as `0x${string}`, parseUnits(amount, 6)]
      });
      
      setTxHashes(prev => [...prev, approveTx]);
      setActiveStep(5); // Ready to sign LI.FI
      
      // Give the network a few seconds to mine the approval
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      const lifiTx = await sendTransactionAsync({
        to: lifiLeg.transactionRequest.to as `0x${string}`,
        data: lifiLeg.transactionRequest.data as `0x${string}`,
        value: BigInt(lifiLeg.transactionRequest.value || 0),
      });
      
      setTxHashes(prev => [...prev, lifiTx]);
      setActiveStep(6); 
      
    } catch (err) {
      console.error(err);
      setActiveStep(0);
    }
  };

  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-emerald-500/30 overflow-hidden relative font-sans">
      
      {/* Wallet Modal */}
      <AnimatePresence>
        {isWalletModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsWalletModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0A0A0B] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-400" />
              <h2 className="text-xl font-bold tracking-tight mb-4">Connect Wallet</h2>
              <div className="flex flex-col gap-2">
                {connectors.map((connector) => (
                  <button 
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all"
                  >
                    <span className="font-semibold text-white/90">{connector.name}</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </button>
                ))}
                {connectors.length === 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    No web3 wallet detected. Please install MetaMask, Rabby, or Coinbase Wallet.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 pt-8 pb-24 relative z-10">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-between items-center mb-24"
        >
          <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <Zap className="text-emerald-400" />
            <span>Fluid<span className="text-white/40">Bridge</span></span>
          </div>

          <div className="flex items-center gap-3">
            {!mounted ? null : isConnected ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-4 pr-1 py-1 backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <span className="text-sm font-medium tracking-wide text-white/80 font-mono">
                    {address?.slice(0,6)}...{address?.slice(-4)}
                  </span>
                </div>
                <button 
                  onClick={() => disconnect()}
                  className="bg-white/10 hover:bg-white/20 transition-colors rounded-full px-4 py-1.5 text-xs font-semibold"
                >
                  Disconnect
                </button>
              </motion.div>
            ) : (
              <button 
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-white text-black hover:bg-emerald-400 transition-colors rounded-full px-6 py-2.5 text-sm font-bold tracking-tight shadow-lg"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </motion.header>

        {/* Hero */}
        <div className="text-center mb-16 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-extrabold tracking-tighter"
          >
            Zero friction.<br/>
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Infinite liquidity.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/50 text-lg md:text-xl max-w-lg mx-auto font-medium"
          >
            Bridge assets seamlessly across any chain in seconds using CCTP and intelligent aggregation.
          </motion.p>
        </div>

        {/* Swap Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md mx-auto relative group"
        >
          {/* Animated border glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/20 to-blue-500/20 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-[#0A0A0B]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden">
            
            {/* Input Section */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all focus-within:bg-white/10 focus-within:border-white/20">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                  Pay on Arc Mainnet
                </label>
                {isConnected && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span>Balance: {usdcBalance !== undefined ? (Number(usdcBalance) / 1e6).toFixed(2) : '0.00'}</span>
                    <button 
                      onClick={() => setAmount(usdcBalance ? (Number(usdcBalance) / 1e6).toString() : '0')}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <input 
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-transparent text-4xl font-bold tracking-tighter outline-none placeholder-white/20"
                  placeholder="0.00"
                />
                <span className="text-xl font-bold text-white/80 pr-2">USDC</span>
              </div>
            </div>

            {/* Separator / Swap Icon */}
            <div className="relative h-4 flex justify-center items-center my-2">
              <div className="absolute w-full h-[1px] bg-white/5" />
              <div className="bg-[#0A0A0B] border border-white/10 p-2 rounded-full relative z-10 text-white/40 group-hover:text-emerald-400 group-hover:rotate-180 transition-all duration-500">
                <ArrowDown size={16} />
              </div>
            </div>

            {/* Output Section */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all focus-within:bg-white/10 focus-within:border-white/20">
              <label className="text-xs font-semibold text-white/40 tracking-wider uppercase flex items-center justify-between mb-2">
                <span>Receive on</span>
                <div className="flex gap-2">
                  <select 
                    className="bg-[#0A0A0B] text-white border border-white/10 rounded-md px-2 py-1 outline-none text-xs"
                    value={destIndex}
                    onChange={(e) => {
                      setDestIndex(Number(e.target.value));
                      setDestTokenIndex(0);
                    }}
                  >
                    {SUPPORTED_DESTINATIONS.map((dest, i) => (
                      <option key={dest.id} value={i}>{dest.name}</option>
                    ))}
                  </select>
                  <select 
                    className="bg-[#0A0A0B] text-white border border-white/10 rounded-md px-2 py-1 outline-none text-xs"
                    value={destTokenIndex}
                    onChange={(e) => setDestTokenIndex(Number(e.target.value))}
                  >
                    {SUPPORTED_DESTINATIONS[destIndex].tokens.map((token, i) => (
                      <option key={token.symbol} value={i}>{token.symbol}</option>
                    ))}
                  </select>
                </div>
              </label>
              
              <div className="flex flex-col gap-2">
                <div className="mt-1 text-4xl font-bold tracking-tighter text-emerald-400 flex items-center justify-between">
                  <span>
                    {quote && quote.legs && quote.legs[1] && quote.legs[1].expectedOutputAmount ? 
                      (Number(quote.legs[1].expectedOutputAmount || 0) / Math.pow(10, quote.legs[1].toTokenDecimals || 18)).toFixed(4) 
                      : "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quote details */}
            <AnimatePresence>
              {quote && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 space-y-3 overflow-hidden"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/60 font-medium">Estimated Time</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Activity size={14} /> ~{quote.estimatedTotalTimeSeconds}s
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/60 font-medium">Routing</span>
                      <span className="font-mono text-xs text-white/80 bg-white/10 px-2 py-1 rounded-md">
                        Arc → Base → {SUPPORTED_DESTINATIONS[destIndex].name} ({quote.legs[1]?.toTokenSymbol || SUPPORTED_DESTINATIONS[destIndex].tokens[destTokenIndex].symbol})
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <div className="mt-6">
              {!mounted ? (
                <button 
                  disabled
                  className="w-full py-4 bg-white/5 text-white/50 rounded-xl font-bold tracking-tight"
                >
                  Loading...
                </button>
              ) : !isConnected ? (
                <button 
                  onClick={() => setIsWalletModalOpen(true)}
                  className="w-full py-4 bg-white/10 hover:bg-emerald-400 text-white hover:text-black rounded-xl font-bold tracking-tight transition-colors"
                >
                  Connect to Swap
                </button>
              ) : !quote ? (
                <button
                  onClick={handleGetQuote}
                  disabled={isLoadingQuote || !amount}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-50 disabled:bg-white/10 disabled:text-white/50 rounded-xl font-bold tracking-tight transition-colors flex items-center justify-center gap-2"
                >
                  {isLoadingQuote ? <Loader2 className="animate-spin" size={18} /> : null}
                  {isLoadingQuote ? "Finding best route..." : "Review Route"}
                </button>
              ) : (
                <button
                  onClick={handleExecute}
                  disabled={activeStep > 0}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold tracking-tight transition-all flex items-center justify-center gap-2",
                    activeStep > 0 ? "bg-white/10 text-white/50" : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  )}
                >
                  {activeStep > 0 && activeStep < 6 ? <Loader2 className="animate-spin text-emerald-500" size={18} /> : null}
                  {activeStep === 0 ? "Confirm Bridge" : 
                   activeStep === 1 ? "Approve CCTP..." :
                   activeStep === 2 ? "Sign CCTP Burn..." : 
                   activeStep === 3 ? "Waiting for Circle Attestation (~12m)..." : 
                   activeStep === 3.5 ? "Claim USDC on Base..." : 
                   activeStep === 4 ? "Approve LI.FI Bridge..." : 
                   activeStep === 5 ? "Sign LI.FI Bridge..." : "Transfer Complete"}
                </button>
              )}
            </div>

            {/* Transaction Hashes */}
            <AnimatePresence>
              {txHashes.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 pt-4 border-t border-white/10 space-y-2"
                >
                  {txHashes.map((hash, i) => (
                    <div key={hash} className="flex items-center gap-2 text-xs font-mono text-emerald-400/80 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/50">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Leg {i+1}: {hash.slice(0,8)}...{hash.slice(-6)}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </main>
  );
}
