'use strict';
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'../../sites/fanjing-matcha-online/dist');
const output=path.resolve(__dirname,'../../梵净抹茶_离线演示.html');
let html=fs.readFileSync(path.join(source,'index.html'),'utf8');
let app=fs.readFileSync(path.join(source,'app.js'),'utf8');
const css=fs.readFileSync(path.join(source,'style.css'),'utf8'),core=fs.readFileSync(path.join(source,'core.js'),'utf8');
app=app.replace("KEY = 'fanjing-matcha-v1-online'","KEY = 'fanjing-matcha-v1-offline-file'");
const storageStart=app.indexOf('let storageReady = true;'),storageEnd=app.indexOf('const user=()=>',storageStart);
if(storageStart<0||storageEnd<0)throw new Error('Storage section not found');
app=app.slice(0,storageStart)+`let storageReady=true,volatileSnapshot=null;
function readSaved(){
  if(!storageReady)return volatileSnapshot;
  try{return JSON.parse(localStorage.getItem(KEY)||'null');}
  catch(e){storageReady=false;return volatileSnapshot;}
}
function persist(next){
  if(storageReady){try{localStorage.setItem(KEY,JSON.stringify(next));}
    catch(e){if(e.name==='QuotaExceededError'||e.code===22)throw new Error('浏览器存储空间不足，本次操作未保存。请先导出 JSON 备份，或减少照片数量。');storageReady=false;}}
  volatileSnapshot=M.clone(next);
}
{const saved=readSaved();state=saved&&saved.version===M.VERSION?saved:M.seed();if(!M.user(state))state=M.action(state,'login',{userId:'farmer-1'});try{persist(state);}catch(e){storageReady=false;volatileSnapshot=M.clone(state);}}
function commit(type,payload){
  const saved=readSaved();if(saved&&saved.version===M.VERSION)state=saved;
  const next=M.action(state,type,payload);persist(next);state=next;
}
`+app.slice(storageEnd);
app=app.replace('在线演示 · 当前浏览器保存',"'+(storageReady?'离线演示 · 本机保存':'离线演示 · 临时保存')+'");
app=app.replace('公开演示 · 初始数据均为模拟数据 · 填报仅保存在当前浏览器，各设备独立保存。','单文件离线演示 · 无需联网 · 初始数据为模拟数据 · 各设备独立使用，重要记录请导出备份。');
app=app.replace('本地存储不可用，填报暂不可用。请允许此页面使用本地存储后刷新。','当前浏览器不支持对本地文件持久保存，本次仍可正常填报。关闭或刷新页面前，请到使用说明中导出 JSON 备份。');
app=app.replace('各身份仅用于演示；数据保存在当前浏览器，不与其他访问者共享。','各身份仅用于演示。所有操作在本机执行，不上传数据，也不会与其他人的文件同步。');
app=app.replace('运行与导入说明','离线使用说明');
app=app.replace('导出当前身份可见数据','导出当前身份可见数据');
const helpStart=app.indexOf('function helpPage(){'),helpEnd=app.indexOf('\nfunction openModal',helpStart);
if(helpStart<0||helpEnd<0)throw new Error('Help section not found');
app=app.slice(0,helpStart)+`function helpPage(){return heading('OFFLINE EDITION','一个文件，随时打开。','页面、样式、业务逻辑和预测模型全部包含在这个 HTML 中。')+'<section class="panel help-prose"><h2>怎样打开和分享</h2><p>电脑：将 HTML 文件保存到本机，用 Edge、Chrome、Firefox 或 Safari 等浏览器打开。无需安装 Node.js、Python、微信开发者工具，也无需启动服务器。把同一个 HTML 文件发给其他人，下载后即可各自打开。</p><p style="margin-top:12px">手机：先下载并保存文件，再从文件管理器尝试选择浏览器打开。微信、QQ 等应用的文件预览可能不执行 JavaScript，部分手机也会限制本地 HTML 的打开方式，此时请用电脑浏览器打开。</p><h2>记录怎样保存</h2><p>本文件不联网，也不会把数据上传到服务器。浏览器允许时，填写的数据会保存在当前浏览器。不同设备、不同浏览器和不同文件路径可能使用不同的数据空间。若浏览器禁止持久保存，会显示提示并改用临时内存，仍可填报，但刷新或关闭后数据可能丢失。</p><p style="margin-top:12px">重要记录请导出 JSON 或 CSV 留作备份。当前 JSON 导出是数据备份文件，不是可双击运行的演示页面。把原始 HTML 发给别人，不会自动带上你在浏览器中填写的数据。</p><h2>怎样体验完整业务</h2><ol><li>右上角选择农户身份，查看茶园并记录一次巡园。</li><li>在收购订单中接取 120 kg。</li><li>采收上报 80 kg，并关联该订单，待交付量将变为 40 kg。</li><li>在同一个浏览器切换到加工厂身份，查看接单与交付进度。</li><li>打开产量预测，查看完整月份的历史汇总和未来三个月趋势。</li></ol><h2>演示数据与预测</h2><p>初始茶园、人员、订单和采收量均为模拟数据。GM(1,1) 使用最近 5–8 个连续已结束月份；当月数据不参与拟合。历史拟合误差不等于未来预测准确率。本版用于演示，没有支付、加工厂验收入库或多人同步功能。</p><div class="card-buttons"><button class="button" data-action="identity">切换身份体验</button><button class="button ghost" data-action="export">'+icon('download')+'导出当前身份 JSON</button><button class="button ghost" data-action="reset">'+icon('reset')+'恢复演示数据</button></div></section>';}
`+app.slice(helpEnd);
app=app.replace("localStorage.setItem(KEY,JSON.stringify(next));state=next;selectedGarden='';recordGarden='';page='home';", "persist(next);state=next;selectedGarden='';recordGarden='';page='home';");
// Newer browsers provide createImageBitmap; Image also works for older local-file viewers.
app=app.replace('const bitmap=await createImageBitmap(file);',`const bitmap=typeof createImageBitmap==='function'?await createImageBitmap(file):await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight,image,close(){URL.revokeObjectURL(url);}});image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('照片无法读取，请换一张图片'));};image.src=url;});`);
app=app.replace('ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);','ctx.drawImage(bitmap.image||bitmap,0,0,canvas.width,canvas.height);');
html=html.replace('<title>梵净抹茶 · 在线茶园工作台</title>','<title>梵净抹茶 · 离线演示</title>');
html=html.replace(/<meta name="description"[^>]*>/,'<meta name="description" content="梵净抹茶单文件离线演示：茶园档案、农事打卡、订单采收和产量预测。无需联网。">');
html=html.replace(/<link rel="canonical"[^>]*>/,'');
html=html.replace('<link rel="stylesheet" href="/style.css">','<style>\n'+css+'\n</style>');
html=html.replace('<script src="/core.js" defer></script>','').replace('<script src="/app.js" defer></script>','');
const safeScript=s=>s.replace(/<\/script/gi,'<\\/script');
html=html.replace('</body>','<noscript><p style="padding:24px">此演示需要 JavaScript。请下载本文件后，用电脑浏览器打开；微信文件预览可能无法运行。</p></noscript>\n<script>\n'+safeScript(core)+'\n</script>\n<script>\n'+safeScript(app)+'\n</script>\n</body>');
fs.writeFileSync(output,html,'utf8');
console.log(JSON.stringify({file:output,bytes:Buffer.byteLength(html)}));
