'use client';


import { useState, useEffect } from 'react';
import { useConfig } from 'wagmi';
import { waitForTransactionReceipt, getAccount, readContract } from 'wagmi/actions';
import { useAccount, useWriteContract, useSendTransaction, useSwitchChain, useReadContract, usePublicClient } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Loader2, CheckCircle2, Zap, ArrowDown, Activity } from 'lucide-react';
import { parseUnits, erc20Abi, decodeEventLog, keccak256 } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_DESTINATIONS = [
  { 
    id: 1151111081099710, 
    name: 'Solana', 
    tokens: [
      { symbol: 'SOL', address: '11111111111111111111111111111111' },
      { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },

  { 
    id: 8453, 
    name: 'Base', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },
  { 
    id: 137, 
    name: 'Polygon', 
    tokens: [
      { symbol: 'POL', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },
  { 
    id: 43114, 
    name: 'Avalanche', 
    tokens: [
      { symbol: 'AVAX', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },

  { 
    id: 4663, 
    name: 'Robinhood Chain', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },
  { 
    id: 56, 
    name: 'BNB Chain', 
    tokens: [
      { symbol: 'BNB', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },
  { 
    id: 42161, 
    name: 'Arbitrum', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },
  { 
    id: 10, 
    name: 'Optimism', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  },
  { 
    id: 1, 
    name: 'Ethereum', 
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
      { symbol: 'Custom Token...', address: 'CUSTOM' }
    ]
  }
];

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  
  const [amount, setAmount] = useState('');
  const [destIndex, setDestIndex] = useState(0);
  const [destTokenIndex, setDestTokenIndex] = useState(0);
  
  // Custom Token Support
  const [customCA, setCustomCA] = useState('');
  const [customTokenMeta, setCustomTokenMeta] = useState<{name: string, symbol: string, decimals: number} | null>(null);

  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [networkSearch, setNetworkSearch] = useState('');


  const [destinations, setDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);

  useEffect(() => {
    fetch('https://li.quest/v1/chains?chainTypes=EVM,SVM')
      .then(r => r.json())
      .then(d => {
        if (!d.chains) return;
        const topIds = [1, 8453, 42161, 10, 1151111081099710, 137, 56, 43114];
        let lifiChains = d.chains
          .filter((c: any) => c.id !== 5042)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            logoURI: c.logoURI,
            tokens: [
              { symbol: c.nativeToken.symbol, address: '0x0000000000000000000000000000000000000000' },
              { symbol: 'USDC', address: 'USDC' },
              { symbol: 'USDT', address: 'USDT' },
              { symbol: 'Custom Token...', address: 'CUSTOM' }
            ]
          }));
        
        // Sort top chains first
        lifiChains.sort((a: any, b: any) => {
          const aIdx = topIds.indexOf(a.id);
          const bIdx = topIds.indexOf(b.id);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setDestinations(lifiChains);
      })
      .catch(console.error);
  }, []);

  // Unified Transfer Support
  const [isSelfSwap, setIsSelfSwap] = useState(true);
  const [customDestAddress, setCustomDestAddress] = useState('');

    const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  const [activeStep, setActiveStep] = useState<number>(0);
  const [txHashes, setTxHashes] = useState<{hash: string, url: string}[]>([]);

  const getExplorerUrl = (chainId: number, hash: string) => {
    if (chainId === 5042) return `https://explorer.arc.io/tx/${hash}`;
    if (chainId === 8453) return `https://basescan.org/tx/${hash}`;
    if (chainId === 42161) return `https://arbiscan.io/tx/${hash}`;
    return `https://etherscan.io/tx/${hash}`;
  };


  
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const config = useConfig();

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




  useEffect(() => {
    if (destinations[destIndex].tokens[destTokenIndex].address !== 'CUSTOM' || !customCA || customCA.length < 32) {
      setCustomTokenMeta(null);
      return;
    }

    const fetchMeta = async () => {
      try {
        if (destinations[destIndex].name === 'Solana') {
          const { Connection, PublicKey } = await import('@solana/web3.js');
          const connection = new Connection("https://api.mainnet-beta.solana.com");
          const mint = new PublicKey(customCA);
          const info = await connection.getParsedAccountInfo(mint);
          if (info.value?.data && 'parsed' in info.value.data) {
            const data = info.value.data.parsed.info;
            setCustomTokenMeta({
              name: "Solana Token",
              symbol: "SPL",
              decimals: data.decimals
            });
          }
        } else {
          const { createPublicClient, http, erc20Abi } = await import('viem');
          // For now just use public rpc based on chain id, ideally we'd map it
          const rpcs: Record<number, string> = {
            8453: 'https://mainnet.base.org',
            137: 'https://polygon-rpc.com',
            43114: 'https://api.avax.network/ext/bc/C/rpc',
            56: 'https://bsc-dataseed.binance.org',
            42161: 'https://arb1.arbitrum.io/rpc',
            10: 'https://mainnet.optimism.io',
            1: 'https://eth.llamarpc.com'
          };
          const rpc = rpcs[destinations[destIndex].id];
          if (!rpc) return;

          const client = createPublicClient({ transport: http(rpc) });
          
          const [name, symbol, decimals] = await Promise.all([
            client.readContract({ address: customCA as `0x${string}`, abi: erc20Abi, functionName: 'name' }),
            client.readContract({ address: customCA as `0x${string}`, abi: erc20Abi, functionName: 'symbol' }),
            client.readContract({ address: customCA as `0x${string}`, abi: erc20Abi, functionName: 'decimals' })
          ]);
          setCustomTokenMeta({ name: name as string, symbol: symbol as string, decimals: decimals as number });
        }
      } catch (e) {
        console.error(e);
        setCustomTokenMeta(null);
      }
    };
    fetchMeta();
  }, [customCA, destIndex, destTokenIndex]);

  const handleGetQuote = async () => {

    if (!address) return;
    setIsLoadingQuote(true);
    setQuote(null);
    try {
      const dest = destinations[destIndex];
      
      const isSolanaDest = dest.name.toLowerCase() === 'solana';
      let targetDestAddress = customDestAddress;
      
      if (isSelfSwap) {
        if (isSolanaDest) {
          const solWallet = wallets.find(w => w.walletClientType === 'phantom' || w.walletClientType === 'solflare' || (w as any).chainType === 'solana');
          targetDestAddress = solWallet?.address || '';
          if (!targetDestAddress) {
             throw new Error("No Solana wallet connected. Please link a Solana wallet in Privy or use 'Send to another address'.");
          }
        } else {
          targetDestAddress = address || '';
        }
      }

      if (!targetDestAddress) {
        throw new Error("Please enter a destination address");
      }
      
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          userAddress: address,
          destinationAddress: targetDestAddress,
          destinationChainId: dest.id,
          destinationTokenAddress: dest.tokens[destTokenIndex].address === 'CUSTOM' ? customCA : dest.tokens[destTokenIndex].address
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuote(data.route);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to get quote");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleExecute = async () => {
    if (!quote || !quote.legs || !quote.legs[0]) return;
    try {
      setActiveStep(1); // Approving
      
      const arcUSDC = '0x3600000000000000000000000000000000000000';
      const leg = quote.legs[0];
      const lifiTxRequest = leg.transactionRequest;

      if (!lifiTxRequest) throw new Error("Invalid quote: no transaction request");

      // 1. Check Allowance for LI.FI contract on Arc Mainnet
      
      const account = getAccount(config);
      if (account.chainId !== 5042) {
         console.log("Switching chain to 5042...");
         await switchChainAsync({ chainId: 5042 });
      }

      const currentAllowance = await readContract(config, {
        address: arcUSDC as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, lifiTxRequest.to as `0x${string}`],
        chainId: 5042
      });

      const requiredAmount = BigInt(lifiTxRequest.value || '0') > 0n ? 0n : BigInt(quote.totalAmountIn);

      if ((currentAllowance as bigint) < requiredAmount) {
        console.log("Approving LI.FI contract...");
        const approveTx = await writeContractAsync({
          address: arcUSDC as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [lifiTxRequest.to as `0x${string}`, requiredAmount],
          chainId: 5042
        });
        setTxHashes(prev => [...prev, { hash: approveTx, url: getExplorerUrl(5042, approveTx) }]);
        await waitForTransactionReceipt(config, { hash: approveTx });
      }

      setActiveStep(2); // Sending Tx

      // 2. Send LI.FI transaction
      const execTx = await sendTransactionAsync({
        to: lifiTxRequest.to,
        data: lifiTxRequest.data,
        value: BigInt(lifiTxRequest.value || '0'),
        chainId: 5042
      });

      setTxHashes(prev => [...prev, { hash: execTx, url: getExplorerUrl(5042, execTx) }]);
      await waitForTransactionReceipt(config, { hash: execTx });

      setActiveStep(6); // Done
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Execution failed');
      setActiveStep(0);
    }
  };

  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-emerald-500/30 overflow-hidden relative font-sans">
      


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
            {!ready ? null : authenticated ? (
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
                  onClick={() => logout()}
                  className="bg-white/10 hover:bg-white/20 transition-colors rounded-full px-4 py-1.5 text-xs font-semibold"
                >
                  Disconnect
                </button>
              </motion.div>
            ) : (
              <button 
                onClick={() => login()}
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

            
            {/* Unified Transfer UI */}
            <div className={cn("border rounded-2xl p-4 mt-2 transition-all", !isSelfSwap ? "bg-red-500/5 border-red-500/20" : "bg-white/5 border-white/5")}>
              <div className="flex gap-4 mb-3">
                <button 
                  onClick={() => setIsSelfSwap(true)}
                  className={`text-sm font-semibold pb-1 border-b-2 transition-all ${isSelfSwap ? 'border-emerald-400 text-emerald-400' : 'border-transparent hover:text-white text-white/50'}`}
                >
                  Transfer to my wallet
                </button>
                <button 
                  onClick={() => setIsSelfSwap(false)}
                  className={`text-sm font-semibold pb-1 border-b-2 transition-all ${!isSelfSwap ? 'border-red-400 text-red-400' : 'border-transparent hover:text-white text-white/50'}`}
                >
                  Send to another address
                </button>
              </div>
              {!isSelfSwap && (
                <input
                  type="text"
                  placeholder="Destination Address (0x...)"
                  value={customDestAddress}
                  onChange={(e) => setCustomDestAddress(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-red-500/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 transition-colors placeholder-white/20"
                />
              )}
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
                      const newDestIdx = Number(e.target.value);
                      setDestIndex(newDestIdx);
                      setDestTokenIndex(0);
                    }}
                  >
                    {destinations.map((dest, i) => (
                      <option key={dest.id} value={i}>{dest.name}</option>
                    ))}
                  </select>
                  <select 
                    className="bg-[#0A0A0B] text-white border border-white/10 rounded-md px-2 py-1 outline-none text-xs"
                    value={destTokenIndex}
                    onChange={(e) => setDestTokenIndex(Number(e.target.value))}
                  >
                    {destinations[destIndex].tokens.map((token, i) => (
                      <option key={token.symbol} value={i}>{token.symbol}</option>
                    ))}
                  </select>
                </div>
              </label>
              
              {destinations[destIndex].tokens[destTokenIndex].address === 'CUSTOM' && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Custom Token Contract Address (0x... or Base58)"
                    value={customCA}
                    onChange={(e) => setCustomCA(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-emerald-500/30 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors placeholder-white/20"
                  />
                  {customTokenMeta && (
                    <div className="text-xs text-emerald-400 mt-1 pl-2 font-mono">
                      Found: {customTokenMeta.name} ({customTokenMeta.symbol}) - {customTokenMeta.decimals} decimals
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                  <div className="mt-1 text-4xl font-bold tracking-tighter text-emerald-400 flex items-center justify-between">
                    <span>
                      {quote && quote.legs && quote.legs.length > 0 ? (
                        quote.legs.length === 1 ? 
                          amount || "0.00" :
                        quote.legs[1] && quote.legs[1].expectedOutputAmount ? 
                          (Number(quote.legs[1].expectedOutputAmount || 0) / Math.pow(10, quote.legs[1].toTokenDecimals || 18)).toFixed(4) :
                          "0.00"
                      ) : "0.00"}
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
                          `Arc → ${destinations[destIndex].name} (${quote?.legs?.[0]?.toTokenSymbol || destinations[destIndex].tokens[destTokenIndex].symbol})`
                        </span>
                      </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <div className="mt-6">
              {!ready ? (
                <button 
                  disabled
                  className="w-full py-4 bg-white/5 text-white/50 rounded-xl font-bold tracking-tight"
                >
                  Loading...
                </button>
              ) : !authenticated ? (
                <button 
                  onClick={() => login()}
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
              ) : activeStep === 6 ? (
                <div className="flex flex-col gap-3">
                  <div className="w-full py-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold tracking-tight flex items-center justify-center gap-2">
                    <span className="text-xl">✓</span> Transfer Successful!
                  </div>
                  <button
                    onClick={() => {
                      setQuote(null);
                      setActiveStep(0);
                      setTxHashes([]);
                      setAmount('');
                    }}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold tracking-tight transition-all flex items-center justify-center gap-2"
                  >
                    Make Another Transfer
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleExecute}
                  disabled={activeStep > 0 && activeStep < 6}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold tracking-tight transition-all flex items-center justify-center gap-2",
                    activeStep > 0 && activeStep < 6 ? "bg-white/10 text-white/50" : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  )}
                >
                  {activeStep > 0 && activeStep < 6 ? <Loader2 className="animate-spin text-emerald-500" size={18} /> : null}
                  {activeStep === 0 ? "Confirm Bridge" : 
                   activeStep === 1 ? "Approve LI.FI..." :
                   activeStep === 2 ? "Executing Transfer..." : ""}
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
                  {txHashes.map((tx, i) => (
                  <a key={tx.hash} href={tx.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-mono text-emerald-400/80 hover:text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/50 transition-colors">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Leg {i+1}: {tx.hash.slice(0,8)}...{tx.hash.slice(-6)}</span>
                  </a>
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
