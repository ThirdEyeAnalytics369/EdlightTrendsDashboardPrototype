import { writeFileSync } from 'fs';
import { generateData } from '../src/data/generateData.js';

const data = generateData();
writeFileSync('./src/data/data.json', JSON.stringify(data, null, 0));
console.log(`Exported ${data.length} rows to src/data/data.json`);
