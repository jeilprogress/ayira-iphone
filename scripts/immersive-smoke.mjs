import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'], {stdio:'inherit'})
let browser
try {
  let ready=false
  for(let i=0;i<50;i++){
    try{const r=await fetch('http://127.0.0.1:4173/');if(r.ok){ready=true;break}}catch{}
    await new Promise(done=>setTimeout(done,250))
  }
  assert.ok(ready,'Preview server should start')
  browser=await chromium.launch({headless:true})
  const page=await browser.newPage({viewport:{width:1440,height:960}})
  const errors=[]
  page.on('pageerror',err=>errors.push(err.message))
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'})
  assert.ok(await page.locator('.ios6-lock .story-wallpaper-image').evaluate(x=>x instanceof HTMLImageElement&&x.naturalWidth>0),'Wallpaper must load')
  await page.locator('.lock-swipe-label').click()
  await page.keyboard.type('0215',{delay:60})
  await page.waitForSelector('.home-screen')
  assert.ok(await page.locator('.home-screen .story-wallpaper-image').evaluate(x=>x instanceof HTMLImageElement&&x.naturalWidth>0),'Home wallpaper must load')
  await page.locator('.home-app').filter({hasText:'Notes'}).first().click()
  await page.locator('.note-item').first().click()
  assert.equal(await page.locator('textarea').count(),0,'Notes cannot be edited')
  assert.ok(await page.locator('.notes-toolbar button').count()>0,'Notes editor icons stay visible')
  assert.equal(await page.locator('.notes-toolbar button:not([disabled])').count(),0,'All Notes editing icons are disabled')
  await page.locator('.home-indicator').click()
  await page.locator('.dock button[aria-label="Safari"]').click()
  await page.locator('.ios6-safari-address').click()
  assert.equal(await page.locator('.ios6-safari-history-list button').count(),6,'Six searches should appear')
  await page.locator('.ios6-safari-history-list button').nth(3).click()
  assert.ok(await page.locator('.ios6-google-query').getByText('Fox plushies').isVisible(),'Saved search should open')
  await page.locator('.home-indicator').click()
  await page.locator('.home-app').filter({hasText:'Calendar'}).first().click()
  assert.ok(await page.getByRole('heading',{name:'March 2019'}).isVisible(),'Calendar must open in March 2019')
  assert.ok(await page.getByText("Her birthday, give her the gift (or don't).",{exact:true}).isVisible(),'Birthday note must appear')
  await page.locator('.home-indicator').click()
  await page.locator('.home-app').filter({hasText:'Weather'}).first().click()
  assert.ok(await page.locator('.ios6-weather-hero').getByText('Sunny').isVisible(),'Sunny weather appears')
  assert.ok(await page.locator('.ios6-weather-hero').getByText('Subic, Olongapo').isVisible(),'Subic location appears')
  await page.locator('.home-indicator').click()
  await page.locator('.dock button[aria-label="Messages"]').click()
  await page.locator('.ios5-conversation-row').filter({hasText:'Baby'}).first().click()
  await page.getByRole('textbox',{name:'Type a message'}).fill('hi baby')
  await page.getByRole('button',{name:'Send message'}).click()
  await page.getByText('Hi, baby. What’s up?',{exact:true}).waitFor({timeout:8500})
  assert.ok(await page.locator('.messages-thread').isVisible(),'Messaging remains usable')
  await page.locator('.home-indicator').click()
  await page.locator('.dock button[aria-label="Phone"]').click()
  await page.locator('.ios5-recent-row').first().click()
  assert.ok(await page.locator('.ios5-call-controls').isVisible(),'Call screen controls appear')
  await page.getByRole('button',{name:'End call'}).click()
  assert.equal(errors.length,0,'No unexpected browser errors: '+errors.join('; '))
  console.log('PASS: lock screen, Notes, Safari history, March calendar, sunny weather, messages and call screen')
} finally {
  if(browser) await browser.close()
  server.kill('SIGTERM')
}
