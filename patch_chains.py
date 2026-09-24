import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Rename const SUPPORTED_DESTINATIONS to DEFAULT_DESTINATIONS
content = content.replace('const SUPPORTED_DESTINATIONS = [', 'const DEFAULT_DESTINATIONS = [')

# 2. Inject useState and useEffect for destinations
state_hook = '''  const [customTokenMeta, setCustomTokenMeta] = useState<{name: string, symbol: string, decimals: number} | null>(null);

  const [destinations, setDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);

  useEffect(() => {
    fetch('https://li.quest/v1/chains')
      .then(r => r.json())
      .then(d => {
        if (!d.chains) return;
        const topIds = [1, 8453, 42161, 10, 1151111081099710, 137, 56, 43114];
        let lifiChains = d.chains
          .filter((c: any) => c.id !== 5042)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            logoURI: c.logoURI,
            tokens: [
              { symbol: c.nativeToken.symbol, address: '0x0000000000000000000000000000000000000000' },
              { symbol: 'USDC', address: 'USDC' },
              { symbol: 'USDT', address: 'USDT' },
              { symbol: 'Custom Token...', address: 'CUSTOM' }
            ]
          }));
        
        // Sort top chains first
        lifiChains.sort((a: any, b: any) => {
          const aIdx = topIds.indexOf(a.id);
          const bIdx = topIds.indexOf(b.id);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setDestinations(lifiChains);
      })
      .catch(console.error);
  }, []);'''

content = re.sub(r'  const \[customTokenMeta, setCustomTokenMeta\] = useState<\{name: string, symbol: string, decimals: number\} \| null>\(null\);', state_hook, content)

# 3. Replace all remaining SUPPORTED_DESTINATIONS with destinations
content = content.replace('SUPPORTED_DESTINATIONS', 'destinations')
# fix the DEFAULT_DESTINATIONS back
content = content.replace('const DEFAULT_destinations', 'const DEFAULT_DESTINATIONS')
content = content.replace('useState<any[]>(DEFAULT_destinations)', 'useState<any[]>(DEFAULT_DESTINATIONS)')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dynamic chains patch applied!")
