'use strict';
// Contract tests with an in-memory SDK double. These do not contact WeChat CloudBase.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const M=require('../miniprogram/lib/core');
function fixture(initial){
  let stored=initial?M.clone(initial):null,actor='admin-openid',queue=Promise.resolve();const signed=[];
  const ref={async get(){if(!stored)throw new Error('document does not exist');return{data:M.clone(stored)};},async set({data}){stored=M.clone(data);}};
  const tx={collection:()=>({doc:()=>ref})};
  const db={collection:tx.collection,runTransaction(fn){const result=queue.then(()=>fn(tx));queue=result.catch(()=>{});return result;}};
  const sdk={DYNAMIC_CURRENT_ENV:'mock',init(){},database:()=>db,getWXContext:()=>({OPENID:actor}),async getTempFileURL({fileList}){signed.push(...fileList);return{fileList:fileList.map(fileID=>({fileID,tempFileURL:'https://example.invalid/image'}))};}};
  const exports={};
  const mappings={'admin-openid':'factory-1','farmer1-openid':'farmer-1','farmer2-openid':'farmer-2'};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cloudfunctions/matchaApi/index.js'),'utf8'),{require:name=>name==='wx-server-sdk'?sdk:name==='./core'?M:null,exports,Buffer,process:{env:{MATCHA_IDENTITIES:JSON.stringify(mappings)}},console:{error(){}}});
  return{call:(openid,type,payload)=>{actor=openid;return exports.main({type,payload});},stored:()=>stored,signed};
}
test('cloud rejects an unmapped account before returning data',async()=>{const f=fixture(M.seed()),r=await f.call('unknown','snapshot');assert.equal(r.ok,false);assert.match(r.error,/尚未分配/);});
test('cloud bootstrap requires factory and refuses overwriting data',async()=>{const f=fixture();assert.equal((await f.call('farmer1-openid','bootstrap')).ok,false);assert.equal((await f.call('admin-openid','bootstrap')).ok,true);assert.equal(f.stored().session,null);const again=await f.call('admin-openid','bootstrap');assert.equal(again.ok,false);assert.match(again.error,/已存在/);});
test('cloud projects records by server account and ignores client role spoofing',async()=>{const f=fixture(M.seed()),r=await f.call('farmer1-openid','snapshot');assert.equal(r.state.gardens.length,1);assert.equal(r.state.session.userId,'farmer-1');const spoof=await f.call('farmer1-openid','publishOrder',{userId:'factory-1',role:'factory'});assert.equal(spoof.ok,false);assert.equal((await f.call('farmer1-openid','login',{userId:'factory-1'})).ok,false);});
test('cloud transactions prevent aggregate overbooking across accounts',async()=>{const f=fixture(M.seed());const [a,b]=await Promise.all([f.call('farmer1-openid','acceptOrder',{orderId:'order-1',gardenId:'garden-1',amount:1600}),f.call('farmer2-openid','acceptOrder',{orderId:'order-1',gardenId:'garden-2',amount:600})]);assert.equal(a.ok,true);assert.equal(b.ok,false);assert.equal(M.remaining(f.stored().orders[0]),400);assert.equal(f.stored().session,null);});
test('cloud rejects cross-account photo references and signs only visible records',async()=>{const s=M.seed();s.farming[0].photos=['cloud://env.test/farming/farmer-1/own.jpg'];s.farming[1].photos=['cloud://env.test/farming/farmer-2/other.jpg'];const f=fixture(s);const bad=await f.call('farmer1-openid','addFarming',{gardenId:'garden-1',date:M.today(),type:'巡园',note:'test',photos:s.farming[1].photos});assert.equal(bad.ok,false);const r=await f.call('farmer1-openid','snapshot');assert.equal(r.ok,true);assert.deepEqual(f.signed,['cloud://env.test/farming/farmer-1/own.jpg']);});
