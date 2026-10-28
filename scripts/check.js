'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let count=0,bindings=0;
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name==='node_modules'||entry.name==='exports')continue;const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(full.endsWith('.js')){cp.execFileSync(process.execPath,['--check',full],{stdio:'pipe'});count++;}else if(full.endsWith('.json'))JSON.parse(fs.readFileSync(full,'utf8'));}}
visit(root);
const app=JSON.parse(fs.readFileSync(path.join(root,'miniprogram/app.json'),'utf8'));
for(const page of app.pages){
  for(const ext of ['.js','.wxml'])assert.ok(fs.existsSync(path.join(root,'miniprogram',page+ext)),page+ext+' missing');
  const wxml=fs.readFileSync(path.join(root,'miniprogram',page+'.wxml'),'utf8');
  for(const match of wxml.matchAll(/\{\{([\s\S]*?)\}\}/g)){new Function('return ('+match[1]+');');bindings++;}
  const allowed=new Set(['view','text','button','input','textarea','picker','image','block','canvas']),stack=[];
  for(const match of wxml.matchAll(/<(\/?)([\w:-]+)((?:[^"'<>]|"[^"]*"|'[^']*')*)>/g)){
    const name=match[2];assert.ok(allowed.has(name),'Unsupported native component '+name+' in '+page);
    if(match[1])assert.equal(stack.pop(),name,'Unbalanced WXML in '+page);
    else if(!match[0].endsWith('/>'))stack.push(name);
  }
  assert.equal(stack.length,0,'Unclosed WXML tags in '+page);
}
for(const tab of app.tabBar.list)for(const key of ['iconPath','selectedIconPath'])assert.ok(fs.existsSync(path.join(root,'miniprogram',tab[key])),'Missing tab icon');
assert.equal(fs.readFileSync(path.join(root,'miniprogram/lib/core.js'),'utf8'),fs.readFileSync(path.join(root,'cloudfunctions/matchaApi/core.js'),'utf8'),'Cloud shared core must match. Run npm run prepare:cloud');
console.log('Syntax and project structure OK: '+count+' JavaScript files, '+app.pages.length+' native pages, '+bindings+' WXML expressions. This is not a WeChat compiler check.');
