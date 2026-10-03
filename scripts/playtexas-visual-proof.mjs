import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve('site/playtexas');
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await fs.mkdir('docs/evidence',{recursive:true});for(const [w,h] of [[1440,900],[1366,768],[1024,600],[480,800]]){await page.setViewportSize({width:w,height:h});await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('#words').waitFor();assert(await page.locator('#words').evaluate(e=>e===document.activeElement));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#go').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));await page.screenshot({path:`docs/evidence/playtexas-${w}.png`,fullPage:true});}await page.locator('#words').fill('zzzz');await page.locator('#go').click();assert(await page.locator('#say').textContent());assert(await page.locator('#words').evaluate(e=>e===document.activeElement));await page.locator('#help summary').click();assert(await page.locator('#help').getAttribute('open')!==null);await page.locator('#words').fill('am');assert(await page.locator('#suggest button').count()>0);await page.locator('#suggest button').first().click();assert((await page.locator('#words').inputValue()).endsWith(' '));assert.deepEqual(errors,[]);console.log('PASS: four viewport layouts, initial focus, errors, help, suggestions; no JavaScript errors.');}finally{await browser.close();server.close();}

