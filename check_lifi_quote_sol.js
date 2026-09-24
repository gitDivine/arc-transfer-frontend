async function checkQuote() {
  const url = 'https://li.quest/v1/quote?fromChain=5042&toChain=1151111081099710&fromToken=0x3600000000000000000000000000000000000000&toToken=11111111111111111111111111111111&fromAmount=10000000&fromAddress=0x863D20694E1E74A96a149fA21BeFe13FbBF529c6&toAddress=2v96NsnZWxNJwiyMXSTLkJtzq6LmkSrF8KjnvAURF8Bi';
  
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
