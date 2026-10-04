import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'street-visual',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
  const {loadArt,spriteFrame}=await import('/art.js'),{TOWN_LAYOUTS,townPoint}=await import('/town-layouts.js');
  const {drawTownGround,townDrawables}=await import('/town-art.js'),{drawStreets}=await import('/landscape-art.js');
  const {drawGonzalesGround,gonzalesDrawables,GONZALES_BUILDINGS}=await import('/gonzales-art.js');
  const {drawBexarGround,bexarDrawables}=await import('/bexar-art.js'),{BEXAR_LAYOUT}=await import('/bexar-layout.js');
  await loadArt();const sprites=[...Object.values(TOWN_LAYOUTS).flatMap(t=>t.buildings.map(b=>b.sprite)),...GONZALES_BUILDINGS.map(b=>b.sprite),...BEXAR_LAYOUT.buildings.map(b=>b.sprite)];
  await loadArt({sheets:[...new Set(sprites.map(id=>spriteFrame(id)?.sheet).filter(Boolean))]});
  const canvas=document.createElement('canvas');canvas.id='streets-proof';canvas.width=1440;canvas.height=1200;canvas.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.append(canvas);const ctx=canvas.getContext('2d');
  const towns=Object.entries(TOWN_LAYOUTS).map(([id,t])=>({id,name:t.name,points:[...t.streets.flatMap(s=>s.points),...t.buildings].map(p=>townPoint(t,p)),draw:(project,scale)=>{drawTownGround(ctx,t,project,scale);townDrawables(ctx,t,project,scale).sort((a,b)=>a.y-b.y).forEach(d=>d.draw());}}));
  towns.push({id:'gonzales',name:'Gonzales',points:[{x:-.4,y:-.35},{x:.4,y:.4}],draw:(p,s)=>{drawGonzalesGround(ctx,p,s);gonzalesDrawables(ctx,p,s).sort((a,b)=>a.y-b.y).forEach(d=>d.draw());}});
  towns.push({id:'bexar',name:'San Antonio de Béxar',points:[{x:0,y:0},{x:4200,y:3600}],draw:(p,s)=>{drawBexarGround(ctx,p,s);bexarDrawables(ctx,p,s,{alamo:false,bankTrees:false}).sort((a,b)=>a.y-b.y).forEach(d=>d.draw());}});
  for(const [i,t] of towns.entries()){
   const x=i%4*360,y=Math.floor(i/4)*300;ctx.save();ctx.beginPath();ctx.rect(x,y,360,300);ctx.clip();ctx.fillStyle='#8e9e57';ctx.fillRect(x,y,360,300);
   const minX=Math.min(...t.points.map(p=>p.x)),maxX=Math.max(...t.points.map(p=>p.x)),minY=Math.min(...t.points.map(p=>p.y)),maxY=Math.max(...t.points.map(p=>p.y));
   const scale=Math.min(300/(maxX-minX||1),225/(maxY-minY||1)),project=p=>({x:x+180+(p.x-(maxX+minX)/2)*scale,y:y+175+(p.y-(maxY+minY)/2)*scale});
   t.draw(project,scale);ctx.restore();ctx.fillStyle='#efdfbb';ctx.fillRect(x,y,360,28);ctx.fillStyle='#493821';ctx.font='16px Georgia';ctx.fillText(t.name,x+10,y+20);
  }
  let curves=0;const vertices=[];const fake={canvas:{width:500,height:500},globalAlpha:1,save(){},restore(){},beginPath(){},moveTo(x,y){vertices.push([x,y]);},lineTo(x,y){vertices.push([x,y]);},stroke(){},bezierCurveTo(){curves++;}};
  drawStreets(fake,[{points:[{x:20,y:20},{x:200,y:20},{x:200,y:200}],width:3},{points:[{x:100,y:100},{x:200,y:100}],width:3}]);
  return {towns:towns.map(t=>t.id),curves,exactJunction:vertices.some(([x,y])=>x===200&&y===100)};
 });
 assert.equal(proof.curves,0);assert.ok(proof.exactJunction);assert.deepEqual(errors,[]);mkdirSync('docs/evidence',{recursive:true});await page.locator('#streets-proof').screenshot({path:'docs/evidence/town-streets.png'});
 writeFileSync('docs/evidence/town-streets.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log(`PASS: ${proof.towns.length} town views; exact street vertices, no curve overshoot`);
}finally{await browser?.close();await app.close();}
