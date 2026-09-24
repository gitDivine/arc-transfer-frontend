const { createPublicClient, http, parseAbi } = require('viem');

const base = createPublicClient({
  transport: http('https://mainnet.base.org')
});

const abi = parseAbi([
  'function localDomain() returns (uint32)',
  'function version() returns (uint32)'
]);

async function check() {
  try {
     const addr1 = '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64';
     const addr2 = '0xAD09780d193884d503182aD4588450C416D6F9D4';

     console.log("Checking", addr1);
     try {
       const v1 = await base.readContract({ address: addr1, abi, functionName: 'localDomain' });
       console.log("addr1 domain:", v1);
     } catch(e) { console.log("addr1 failed"); }

     console.log("Checking", addr2);
     try {
       const v2 = await base.readContract({ address: addr2, abi, functionName: 'localDomain' });
       console.log("addr2 domain:", v2);
     } catch(e) { console.log("addr2 failed"); }

  } catch(e) {
     console.log("Error:", e.message);
  }
}

check();
