'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'web'),port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
function openBrowser(){if(process.argv.includes('--open')&&process.platform==='win32')require('node:child_process').execFile('cmd.exe',['/d','/c','start','','http://127.0.0.1:'+port],{windowsHide:true},()=>{});}
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
  let target;try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);target=pathname==='/core.js'?path.join(__dirname,'miniprogram','lib','core.js'):path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(pathname!=='/core.js'&&target!==root&&!target.startsWith(root+path.sep))throw new Error('path');}catch(e){res.writeHead(400);return res.end('Bad request');}
  fs.readFile(target,(err,buffer)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:buffer);});
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port '+port+' is occupied. Set PORT to another local port.':e.message);if(e.code==='EADDRINUSE')openBrowser();process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{console.log('Fanjing Matcha preview: http://127.0.0.1:'+port);openBrowser();});
