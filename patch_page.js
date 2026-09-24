const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Remove HUB_CHAINS import
content = content.replace("import { HUB_CHAINS } from '@/config/networks';", "");

// Remove hubIndex state and effect
content = content.replace(/const \[hubIndex, setHubIndex\] = useState\(0\);\n/, "");
content = content.replace(/\/\/ Auto-select optimal hub[\s\S]*?\}, \[destIndex\]\);\n/, "");

// Replace handleGetQuote body
const handleGetQuoteRegex = /const handleGetQuote = async \(\) => \{[\s\S]*?(?=const handleExecute = async \(\) => \{)/;
const newHandleGetQuote = `const handleGetQuote = async () => {
    if (!address) return;
    setIsLoadingQuote(true);
    setQuote(null);
    try {
      const dest = SUPPORTED_DESTINATIONS[destIndex];
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
      alert(err.message || 'Failed to get quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  `;
content = content.replace(handleGetQuoteRegex, newHandleGetQuote);

// Replace handleExecute body
const handleExecuteRegex = /const handleExecute = async \(\) => \{[\s\S]*?(?=return \(\n)/;
const newHandleExecute = `const handleExecute = async () => {
    if (!quote || !quote.legs || !quote.legs[0]) return;
    try {
      setActiveStep(1); // Approving
      
      const arcUSDC = '0x3600000000000000000000000000000000000000';
      const leg = quote.legs[0];
      const lifiTxRequest = leg.transactionRequest;

      if (!lifiTxRequest) throw new Error("Invalid quote: no transaction request");

      // 1. Check Allowance for LI.FI contract on Arc Mainnet
      const currentAllowance = await publicClient.readContract({
        address: arcUSDC as \`0x\${string}\`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as \`0x\${string}\`, lifiTxRequest.to as \`0x\${string}\`],
        chainId: 5042
      });

      const requiredAmount = BigInt(lifiTxRequest.value || '0') > 0n ? 0n : BigInt(quote.totalAmountIn);

      if ((currentAllowance as bigint) < requiredAmount) {
        console.log("Approving LI.FI contract...");
        const approveTx = await writeContractAsync({
          address: arcUSDC as \`0x\${string}\`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [lifiTxRequest.to as \`0x\${string}\`, requiredAmount],
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

  `;
content = content.replace(handleExecuteRegex, newHandleExecute);

// UI Replacements
// Remove Hub Selector
const hubSelectorRegex = /<label className="text-xs font-bold text-white\/40 uppercase tracking-widest pl-1 mb-2 block">[\s\S]*?<\/div>[\s\S]*?<\/label>/;
content = content.replace(hubSelectorRegex, "");

// Replace active steps text
content = content.replace(/activeStep === 1 \? "Approve CCTP\.\.\." :/, 'activeStep === 1 ? "Approve LI.FI..." :');
content = content.replace(/activeStep === 2 \? "Sign CCTP Burn\.\.\." :[\s\S]*?activeStep === 5 \? "Sign LI\.FI Bridge\.\.\." : ""\}/, 'activeStep === 2 ? "Executing Transfer..." : ""}');

// Replace routing text
content = content.replace(/\{quote\?\.legs\?\.length === 1[\s\S]*?\}\}/, '`Arc → ${SUPPORTED_DESTINATIONS[destIndex].name} (${quote?.legs?.[0]?.toTokenSymbol || SUPPORTED_DESTINATIONS[destIndex].tokens[destTokenIndex].symbol})`}');

fs.writeFileSync(pagePath, content);
console.log("Patched page.tsx successfully!");
