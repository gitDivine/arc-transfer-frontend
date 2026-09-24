async function checkQuote() {
  const url = 'https://li.quest/v1/quote?fromChain=5042&toChain=10&fromToken=USDC&toToken=USDC&fromAmount=1000000&fromAddress=0x863D20694E1E74A96a149fA21BeFe13FbBF529c6';
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log('Failed:', await res.text());
      return;
    }
    const data = await res.json();
    console.log("Success! toToken address resolved to:", data.action.toToken.address);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
checkQuote();
