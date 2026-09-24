const { createPublicClient, http, parseUnits, parseAbi } = require('viem');

const client = createPublicClient({
  transport: http('https://rpc.mainnet.arc.io')
});

const abi = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)'
]);

async function main() {
  try {
    const { request } = await client.simulateContract({
      address: '0x3600000000000000000000000000000000000000',
      abi,
      functionName: 'approve',
      args: ['0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', parseUnits('1', 6)],
      account: '0x863D20694E1E74A96a149fA21BeFe13FbBF529c6' // User's address from screenshot
    });
    console.log("Simulation successful!", request);
  } catch (err) {
    console.error("Simulation failed:", err.message);
  }
}

main();
