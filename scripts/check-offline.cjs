'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=path.resolve(__dirname,'../../梵净抹茶_离线演示.html'),html=fs.readFileSync(file,'utf8');
const scripts=Array.from(html.matchAll(/<script>\s*([\s\S]*?)<\/script>/gi),m=>m[1]);
assert.equal(scripts.length,2,'Expected inline core and application scripts');
assert.ok(!/<script\b[^>]*\bsrc\s*=|<link\b[^>]*rel="stylesheet"|@import\b/i.test(html),'External resources must be embedded');
assert.ok(!html.includes('chatgpt.site'),'Hosted URL must not be required by the offline file');
scripts.forEach((s,i)=>new vm.Script(s,{filename:'offline-inline-'+i+'.js'}));
function host(blocked){
  const memory=new Map(),elements=new Map();
  const storage={getItem(k){if(blocked)throw Object.assign(new Error('Blocked'),{name:'SecurityError'});return memory.get(k)||null;},setItem(k,v){if(blocked)throw Object.assign(new Error('Blocked'),{name:'SecurityError'});memory.set(k,v);}};
  const element=key=>{if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},isConnected:true,focus(){}});return elements.get(key);};
  const ctx={console,localStorage:storage,setTimeout(){return 1;},clearTimeout(){},document:{querySelector:element,addEventListener(){},body:{classList:{add(){},remove(){}}}},addEventListener(){}};
  ctx.window=ctx;vm.createContext(ctx);scripts.forEach(s=>vm.runInContext(s,ctx));return{ctx,elements,memory};
}
for(const blocked of [false,true]){
  const h=host(blocked);
  assert.ok(h.elements.get('#app').innerHTML.includes('张秀英'));
  vm.runInContext("commit('acceptOrder',{orderId:'order-1',gardenId:'garden-1',amount:120});commit('addHarvest',{gardenId:'garden-1',date:M.today(),amount:80,grade:'一级鲜叶',orderId:'order-1'});render();",h.ctx);
  assert.equal(vm.runInContext('M.summary(state).pendingDelivery',h.ctx),40);
  assert.equal(vm.runInContext('M.summary(state).monthAmount',h.ctx),80);
  assert.equal(vm.runInContext('storageReady',h.ctx),!blocked);
  assert.equal(vm.runInContext("M.forecast(state,'garden-1').forecast.length",h.ctx),3);
  vm.runInContext("commit('login',{userId:'factory-1'});",h.ctx);
  assert.equal(vm.runInContext('M.gardens(state).length',h.ctx),3);
  const bootSource="const next=M.action(M.seed(),'login',{userId:'farmer-1'});persist(next);state=next;";
  vm.runInContext(bootSource,h.ctx);assert.equal(vm.runInContext('M.summary(state).monthAmount',h.ctx),0);
}
console.log('Single HTML checks passed: 2 inline scripts, no external asset dependencies, initial render, orders, partial delivery, forecasts, identity switching and reset.');
console.log('Checked both persistent storage and a browser host that rejects localStorage.');
