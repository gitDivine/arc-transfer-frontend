async function checkQuote() {
  const url = 'https://li.quest/v1/quote?fromChain=5042&toChain=8453&fromToken=0x3600000000000000000000000000000000000000&toToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&fromAmount=1000000&fromAddress=0x863D20694E1E74A96a149fA21BeFe13FbBF529c6';
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log('Failed:', await res.text());
      return;
    }
    const data = await res.json();
    console.log("Success! Tool used:", data.tool);
    console.log("Estimated time:", data.estimate.executionDuration, "seconds");
  } catch(e) {
    console.log("Error:", e.message);
  }
}
checkQuote();
