#!/usr/bin/env node
const fs = require('fs');
const yaml = require('js-yaml');

if (process.argv.length !== 4) {
  process.stderr.write('usage: yt <yaml-file> <key>\n');
  process.exit(1);
}

let raw;
try {
  raw = fs.readFileSync(process.argv[2], 'utf8');
} catch (e) {
  process.stderr.write(e.message + '\n');
  process.exit(1);
}

let data;
try {
  data = yaml.load(raw);
} catch (e) {
  process.stderr.write(e.message + '\n');
  process.exit(2);
}

const key = process.argv[3];
if (data === null || data === undefined || typeof data !== 'object' || !(key in data)) {
  console.log('absent');
} else {
  console.log(data[key]);
}
