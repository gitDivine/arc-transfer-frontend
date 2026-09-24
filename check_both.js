const { createPublicClient, http, parseAbi } = require('viem');
const base = createPublicClient({ transport: http('https://mainnet.base.org') });

const abi = parseAbi([
  'function localMessageTransmitter() returns (address)',
  'function messageTransmitter() returns (address)'
]);

async function check() {
  const addr = '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962';
  try {
     const v1 = await base.readContract({ address: addr, abi, functionName: 'localMessageTransmitter' });
     console.log("localMessageTransmitter:", v1);
  } catch(e) { console.log("local fail"); }
  try {
     const v2 = await base.readContract({ address: addr, abi, functionName: 'messageTransmitter' });
     console.log("messageTransmitter:", v2);
  } catch(e) { console.log("msg fail"); }
}

check();
