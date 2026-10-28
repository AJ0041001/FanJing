'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
fs.copyFileSync(path.join(root,'miniprogram/lib/core.js'),path.join(root,'cloudfunctions/matchaApi/core.js'));
console.log('Shared core copied to cloudfunctions/matchaApi/core.js');
