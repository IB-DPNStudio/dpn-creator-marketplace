const fs = require('fs');

const svg = fs.readFileSync('public/dpn-logo-stacked.svg', 'utf8');
const paths = svg.match(/d="([^"]+)"/g).map(p => p.slice(3, -1));

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

paths.forEach(p => {
    const coords = p.match(/-?\d+(?:\.\d+)?/g);
    if (!coords) return;
    for (let i = 0; i < coords.length; i += 2) {
        if (i+1 >= coords.length) break;
        const x = parseFloat(coords[i]);
        const y = parseFloat(coords[i+1]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
});

console.log(`minX: ${minX}, maxX: ${maxX}, width: ${maxX - minX}`);
console.log(`minY: ${minY}, maxY: ${maxY}, height: ${maxY - minY}`);
