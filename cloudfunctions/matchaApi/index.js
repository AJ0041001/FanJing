'use strict';
const cloud=require('wx-server-sdk');
const core=require('./core');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
const db=cloud.database();
const COLLECTION='matcha_state',DOCUMENT='demo';
const MUTATIONS=['saveGarden','addFarming','publishOrder','acceptOrder','closeOrder','addHarvest'];
function identity(openid){
  let mappings;try{mappings=JSON.parse(process.env.MATCHA_IDENTITIES||'{}');}catch(e){throw new Error('云函数账号映射格式有误，请联系管理员');}
  const id=mappings[openid];
  if(!id||!core.USERS.some(u=>u.id===id))throw new Error('当前微信账号尚未分配身份，请管理员配置 MATCHA_IDENTITIES');
  return core.USERS.find(u=>u.id===id);
}
function missing(e){return /not exist|not found|does not exist|DATABASE_DOCUMENT_NOT_EXIST/i.test(e.message||e.errMsg||'');}
async function find(ref){try{return (await ref.get()).data;}catch(e){if(missing(e))return null;throw e;}}
async function visible(state,actor){
  const scoped=core.project(Object.assign({},state,{session:{userId:actor.id}}));
  delete scoped._id;scoped.imageUrls={};
  const files=[...new Set(scoped.farming.flatMap(f=>f.photos||[]).filter(p=>p.startsWith('cloud://')))];
  // Only sign images referenced by records this account is authorized to see.
  for(let offset=0;offset<files.length;offset+=50){
    try{
      const result=await cloud.getTempFileURL({fileList:files.slice(offset,offset+50)});
      (result.fileList||[]).forEach(f=>{if(f.tempFileURL)scoped.imageUrls[f.fileID]=f.tempFileURL;});
    }catch(e){console.error('Image URL temporarily unavailable');}
  }
  return scoped;
}
exports.main=async(event)=>{
  try{
    const actor=identity(cloud.getWXContext().OPENID),type=event.type||'snapshot';
    if(type==='login'||type==='logout'||type==='reset')throw new Error('云模式身份由微信账号决定，不能由客户端切换或重置');
    if(type==='snapshot'){
      const state=await find(db.collection(COLLECTION).doc(DOCUMENT));
      if(!state)throw new Error('尚未初始化演示数据，请管理员先调用 bootstrap');
      return{ok:true,state:await visible(state,actor)};
    }
    if(type!=='bootstrap'&&!MUTATIONS.includes(type))throw new Error('不支持的操作');
    if(type==='bootstrap'&&actor.role!=='factory')throw new Error('仅加工厂管理员可初始化');
    if(type==='addFarming'){
      const photos=(event.payload||{}).photos||[];
      const prefix=new RegExp('^cloud://[^/]+/farming/'+actor.id+'/[a-zA-Z0-9.-]+\\.(jpg|png|webp)$');
      if(!Array.isArray(photos)||!photos.every(p=>typeof p==='string'&&prefix.test(p)))throw new Error('请上传当前账号的云存储照片');
    }
    const state=await db.runTransaction(async tx=>{
      const ref=tx.collection(COLLECTION).doc(DOCUMENT),stored=await find(ref);
      let next;
      if(type==='bootstrap'){
        if(stored)throw new Error('演示数据已存在，初始化不会覆盖现有数据');
        next=core.seed();
      }else{
        if(!stored)throw new Error('尚未初始化演示数据');
        next=core.action(Object.assign({},stored,{session:{userId:actor.id}}),type,event.payload||{});
      }
      delete next._id;next.session=null;
      if(Buffer.byteLength(JSON.stringify(next),'utf8')>850000)throw new Error('演示数据量达到上限，请导出归档后再由管理员处理');
      await ref.set({data:next});return next;
    });
    return{ok:true,state:await visible(state,actor)};
  }catch(e){
    console.error('matchaApi operation failed',e.code||e.errCode||'domain');
    const message=e.message||'';
    return{ok:false,error:/[\u4e00-\u9fff]/.test(message)?message:'云服务操作失败，请检查云环境、数据库及函数日志'};
  }
};
