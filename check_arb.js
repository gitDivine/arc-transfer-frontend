const { createPublicClient, http, parseAbi } = require('viem');
const arbitrum = createPublicClient({ transport: http('https://arb1.arbitrum.io/rpc') });

const abi = parseAbi(['function localDomain() returns (uint32)']);

async function check() {
  const addr1 = '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64';
  try {
     const v1 = await arbitrum.readContract({ address: addr1, abi, functionName: 'localDomain' });
     console.log("addr1 domain:", v1);
  } catch(e) { console.log("addr1 failed", e.message); }
}

check();
