#!/usr/bin/env node
const fs = require('fs');
const yaml = require('js-yaml');

if (process.argv.length !== 4) {
  console.error('usage: yt <yaml-file> <key>');
  console.log('ERROR');
  process.exit(0);
}

let data;
try {
  data = yaml.load(fs.readFileSync(process.argv[2], 'utf8'));
} catch (e) {
  console.error(e.message);
  if (e instanceof yaml.YAMLException) {
    console.log('PARSE_ERROR');
  } else {
    console.log('ERROR');
  }
  process.exit(0);
}

const key = process.argv[3];
if (data === null || data === undefined || typeof data !== 'object' || !(key in data)) {
  console.log('absent');
} else {
  console.log(data[key]);
}
