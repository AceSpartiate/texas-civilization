import {createRequire} from 'node:module';import {mkdirSync} from 'node:fs';import assert from 'node:assert/strict';
import {createClassroom} from '../server/app.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({playerCount:5}),port=await app.listen(0,'127.0.0.1'),url=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE&&{executablePath:process.env.BROWSER_EXECUTABLE})});
try{const page=await browser.newPage({viewport:{width:1200,height:820}});
  await page.goto(url+'/landscape-art.js');await page.setContent('<style>body{margin:0;background:#f0e4c7;color:#4c4933;font:18px Georgia}h1{margin:24px}canvas{display:block}</style><h1>Frontier landscape · material studies</h1><canvas width="1200" height="730"></canvas>');
  const result=await page.evaluate(async()=>{const {loadArt}=await import('/art.js');await loadArt({all:true});const {drawWater,drawRoad,drawCrossing,crossingAngle}=await import('/landscape-art.js'),ctx=document.querySelector('canvas').getContext('2d');
    ctx.fillStyle='#98ab72';ctx.fillRect(0,0,1200,730);ctx.fillStyle='#f1e6cb';ctx.font='22px Georgia';
    ctx.fillText('River banks and water',36,38);ctx.fillText('Worn dirt road',650,38);ctx.fillText('Ford · shallows and stones',36,400);ctx.fillText('Timber bridge · explicit bridge sites only',650,400);
    drawWater(ctx,[{x:0,y:180},{x:140,y:170},{x:260,y:240},{x:410,y:220},{x:560,y:120}],86);
    drawRoad(ctx,[{x:650,y:240},{x:790,y:170},{x:950,y:230},{x:1200,y:190}],48);
    drawWater(ctx,[{x:30,y:560},{x:250,y:550},{x:550,y:590}],100);drawCrossing(ctx,250,550,110,Math.PI/2,false);
    drawWater(ctx,[{x:650,y:560},{x:850,y:550},{x:1200,y:590}],100);drawCrossing(ctx,860,552,140,Math.PI/2,true);
    return crossingAngle({x:0,y:0},[{kind:'river',points:[{x:-10,y:0},{x:10,y:0}]}],p=>p);
  });assert.equal(result,Math.PI/2);mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/landscape-materials.png'});console.log('PASS: water, road, ford, bridge material render and crossing orientation.');
}finally{await browser.close();await app.close();}
