async function check() {
  const res = await fetch('https://li.quest/v1/chains');
  const data = await res.json();
  const arcChain = data.chains.find(c => c.id === 5042 || c.name.toLowerCase().includes('arc'));
  console.log(arcChain ? `Found Arc: ${arcChain.name} (ID: ${arcChain.id})` : 'Arc not found in LI.FI chains');
}
check();
