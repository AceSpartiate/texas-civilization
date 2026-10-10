import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createClassroom} from '../server/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createClassroom({seed:'children-dialogue-proof',playerCount:5}),port=await app.listen(0,'127.0.0.1');let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const proof=await page.evaluate(async()=>{
 const {loadArt,drawClip}=await import('/art.js'),{entityClip}=await import('/motion.js');await loadArt({sheets:['children-dialogue']});const root=document.createElement('section');root.id='children-proof';root.style.cssText='position:fixed;left:15px;top:15px;width:1020px;padding:15px;background:#dedbb4;z-index:999999';root.innerHTML='<h2>Children in conversation — speech poses, listening front/back</h2>';document.body.append(root);const canvas=document.createElement('canvas');canvas.width=1020;canvas.height=750;root.append(canvas);const ctx=canvas.getContext('2d'),widths=[],selected=[];
 const people=[{id:'g',kind:'person',band:'child',sex:'female'},{id:'b',kind:'person',band:'child',sex:'male'},{id:'t',kind:'person',band:'small',sex:'female'}];people.forEach((person,row)=>{const height=row===2?130:180,y=225+row*240;for(let col=0;col<4;col++){const pose=entityClip({...person,...(col<2?{speaking:true}:{facing:col===2?'s':'n'})});selected.push(pose.id);widths.push(drawClip(ctx,pose.id,125+col*255,y,height,{timeMs:col===1?500:0}));}});return{widths,selected};
 });assert.ok(proof.widths.every(w=>w>0));assert.deepEqual(proof.selected,['girl-speak','girl-speak','girl-listen-s','girl-listen-n','boy-speak','boy-speak','boy-listen-s','boy-listen-n','smallchild-speak','smallchild-speak','smallchild-listen-s','smallchild-listen-n']);assert.deepEqual(errors,[]);await page.locator('#children-proof').screenshot({path:'docs/evidence/children-dialogue-art.png'});writeFileSync('docs/evidence/children-dialogue-art.json',JSON.stringify({verdict:'PASS',...proof,errors},null,2));console.log('PASS: twelve age-specific conversation poses render through production selection and art loader.');
}finally{await browser?.close();await app.close();}
