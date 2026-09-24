const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Remove the Hub Selector HTML block
const hubBlockStart = content.indexOf('{/* Hub Selector */}');
const unifiedStart = content.indexOf('{/* Unified Transfer UI */}');
if (hubBlockStart !== -1 && unifiedStart !== -1) {
    content = content.substring(0, hubBlockStart) + content.substring(unifiedStart);
}

// 2. Remove the setHubIndex logic from destIndex onChange
const onChangeStart = content.indexOf('const newDestIdx = Number(e.target.value);');
if (onChangeStart !== -1) {
    const onChangeEnd = content.indexOf('}}', onChangeStart);
    content = content.substring(0, onChangeStart) + 'const newDestIdx = Number(e.target.value);\n                      setDestIndex(newDestIdx);\n                      setDestTokenIndex(0);\n                    ' + content.substring(onChangeEnd);
}

fs.writeFileSync('src/app/page.tsx', content);
console.log('Fixed hubIndex errors');
