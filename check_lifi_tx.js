async function checkQuote() {
  const url = 'https://li.quest/v1/quote?fromChain=5042&toChain=1151111081099710&fromToken=0x3600000000000000000000000000000000000000&toToken=11111111111111111111111111111111&fromAmount=10000000&fromAddress=0x863D20694E1E74A96a149fA21BeFe13FbBF529c6&toAddress=2v96NsnZWxNJwiyMXSTLkJtzq6LmkSrF8KjnvAURF8Bi';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("transactionRequest:", data.transactionRequest);
    console.log("action:", data.action);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
checkQuote();
