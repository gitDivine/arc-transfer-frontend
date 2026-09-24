const { createPublicClient, http, parseAbi } = require('viem');

const arbitrum = createPublicClient({
  transport: http('https://arb1.arbitrum.io/rpc')
});
const base = createPublicClient({
  transport: http('https://mainnet.base.org')
});

const abi = parseAbi(['function localMessageTransmitter() returns (address)']);
const messengerAbi = parseAbi(['function messageTransmitter() returns (address)']);

async function check() {
  try {
     const arbTokenMessenger = '0x19330d10D9Cc8751218eaf51E8885D058642E08A'; // Arbitrum CCTP TokenMessenger
     const baseTokenMessenger = '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962'; // Base CCTP TokenMessenger

     const arbTransmitter = await arbitrum.readContract({
       address: arbTokenMessenger, abi: messengerAbi, functionName: 'messageTransmitter'
     }).catch(() => arbitrum.readContract({
       address: arbTokenMessenger, abi, functionName: 'localMessageTransmitter'
     }));
     
     console.log("Arbitrum Transmitter:", arbTransmitter);

     const baseTransmitter = await base.readContract({
       address: baseTokenMessenger, abi: messengerAbi, functionName: 'messageTransmitter'
     }).catch(() => base.readContract({
       address: baseTokenMessenger, abi, functionName: 'localMessageTransmitter'
     }));
     console.log("Base Transmitter:", baseTransmitter);

  } catch(e) {
     console.log("Error:", e.message);
  }
}

check();
