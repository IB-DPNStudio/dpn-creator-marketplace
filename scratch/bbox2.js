const fs = require('fs');

const svg = fs.readFileSync('public/dpn-logo-stacked.svg', 'utf8');
const paths = svg.match(/M-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g);

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

paths.forEach(p => {
    const coords = p.slice(1).split(',');
    const x = parseFloat(coords[0]);
    const y = parseFloat(coords[1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
});

console.log(`M commands -> minX: ${minX}, maxX: ${maxX}, width: ${maxX - minX}`);
console.log(`M commands -> minY: ${minY}, maxY: ${maxY}, height: ${maxY - minY}`);
