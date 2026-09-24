const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.dependencies['@solana-program/memo'] = '^0.15.0';
pkg.overrides['@solana-program/memo'] = {
  '@solana/kit': '^5.5.1'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
