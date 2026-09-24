const { createPublicClient, http } = require('viem');

const client = createPublicClient({
  transport: http('https://rpc.mainnet.arc.io')
});

async function main() {
  const balance = await client.getBalance({
    address: '0x863D20694E1E74A96a149fA21BeFe13FbBF529c6'
  });
  console.log("Native Gas Balance:", balance.toString());
}

main();
