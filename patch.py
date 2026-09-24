import re
import sys

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove HUB_CHAINS import
content = content.replace("import { HUB_CHAINS } from '@/config/networks';", "")

# 2. Remove hubIndex state and effect
content = re.sub(r'const \[hubIndex, setHubIndex\] = useState\(0\);\n', '', content)
content = re.sub(r'  // Auto-select optimal hub[\s\S]*?\}, \[destIndex\]\);\n', '', content)

# 3. Replace handleGetQuote
old_get_quote = r'      const fetchQuote = async \(hIndex: number\) => \{[\s\S]*?let data = await fetchQuote\(hubIndex\);\n\n      if \(data\.success && !data\.route\?\.legs\[1\]\?\.error\) \{\n        setQuote\(data\.route\);\n      \} else \{\n        console\.error\("Quote failed entirely:", data\.route\?\.legs\[1\]\?\.error \|\| data\.error\);\n        alert\("Failed to find a viable bridge route\. " \+ \(data\.route\?\.legs\[1\]\?\.error \|\| data\.error\)\);\n      \}'

new_get_quote = '''      const res = await fetch('/api/quote', {
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
      setQuote(data.route);'''

content = re.sub(old_get_quote, new_get_quote, content)

# 4. Replace handleExecute
old_exec = r'const handleExecute = async \(\) => \{[\s\S]*?    \} catch \(err: any\) \{[\s\S]*?setActiveStep\(0\);\n    \}\n  \};'

new_exec = '''const handleExecute = async () => {
    if (!quote || !quote.legs || !quote.legs[0]) return;
    try {
      setActiveStep(1); // Approving
      
      const arcUSDC = '0x3600000000000000000000000000000000000000';
      const leg = quote.legs[0];
      const lifiTxRequest = leg.transactionRequest;

      if (!lifiTxRequest) throw new Error("Invalid quote: no transaction request");

      // 1. Check Allowance for LI.FI contract on Arc Mainnet
      const currentAllowance = await publicClient.readContract({
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
  };'''

content = re.sub(old_exec, new_exec, content)

# 5. Remove Hub Selector
hub_selector = r'<label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1 mb-2 block">\s*ROUTE THROUGH \(HUB\)\s*</label>\s*<div className="relative mb-6">[\s\S]*?</select>\s*</div>'
content = re.sub(hub_selector, '', content)

# 6. Replace routing text
old_routing = r'\{quote\?\.legs\?\.length === 1[\s\S]*?\}'
new_routing = '`Arc → ${SUPPORTED_DESTINATIONS[destIndex].name} (${quote?.legs?.[0]?.toTokenSymbol || SUPPORTED_DESTINATIONS[destIndex].tokens[destTokenIndex].symbol})`'
# be careful to only replace the first occurrence
content = content.replace('''{quote?.legs?.length === 1 
                            ? `Arc → ${HUB_CHAINS[hubIndex].name} (USDC)`
                            : `Arc → ${HUB_CHAINS[hubIndex].name} → ${SUPPORTED_DESTINATIONS[destIndex].name} (${quote?.legs?.[1]?.toTokenSymbol || SUPPORTED_DESTINATIONS[destIndex].tokens[destTokenIndex].symbol})`
                          }''', new_routing)

# 7. Replace activeStep texts
old_steps = r'activeStep === 1 \? "Approve CCTP\.\.\." :[\s\S]*?activeStep === 5 \? "Sign LI\.FI Bridge\.\.\." : ""'
new_steps = 'activeStep === 1 ? "Approve LI.FI..." :\n                   activeStep === 2 ? "Executing Transfer..." : ""'
content = re.sub(old_steps, new_steps, content)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched successfully!")
