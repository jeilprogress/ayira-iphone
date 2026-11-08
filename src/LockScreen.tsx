import { useEffect, useState } from 'react'
import { BellOff, Camera, ChevronUp, Flashlight, LockKeyhole, MessageCircle, Delete } from 'lucide-react'
import StoryMedia from './StoryMedia'

const CODE = '0215'
const STORE = 'ayira-phone-v2:passcode-lockout'
type LockRecord = { failed: number; lockedUntil: number; resetOnExpiry: boolean }
const fresh = (): LockRecord => ({ failed: 0, lockedUntil: 0, resetOnExpiry: false })
function loadLock(): LockRecord {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || 'null') as LockRecord | null
    if (!v || typeof v.failed !== 'number' || typeof v.lockedUntil !== 'number') return fresh()
    if (v.resetOnExpiry && Date.now() >= v.lockedUntil) return fresh()
    return {failed: Math.min(8, Math.max(0, v.failed)), lockedUntil: v.lockedUntil, resetOnExpiry: !!v.resetOnExpiry}
  } catch { return fresh() }
}
const timeLeft = (ms: number) => {
  const secs = Math.max(0, Math.ceil(ms / 1000))
  const min = Math.floor(secs / 60), sec = secs % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}
export default function LockScreen({unlock,wall,sound,play,requested}:{unlock:()=>void;wall:number;sound:boolean;play:()=>void;requested:boolean}) {
  const [now,setNow] = useState(Date.now())
  const [passcode,setPasscode] = useState(false)
  const [entry,setEntry] = useState('')
  const [error,setError] = useState('')
  const [shake,setShake] = useState(false)
  const [lock,setLock] = useState<LockRecord>(loadLock)
  useEffect(()=>{if(requested)setPasscode(true)},[requested])
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id) }, [])
  useEffect(() => { try { localStorage.setItem(STORE,JSON.stringify(lock)) } catch { /* private browsing */ } }, [lock])
  useEffect(() => {
    if (lock.lockedUntil && now >= lock.lockedUntil) {
      setLock(prev => prev.resetOnExpiry ? fresh() : {...prev, lockedUntil: 0})
      setError('')
      setEntry('')
    }
  }, [now,lock.lockedUntil])
  const locked = now < lock.lockedUntil
  const remaining = Math.max(0, lock.lockedUntil-now)
  const activate = () => {play();setPasscode(true)}
  const press = (digit: string) => {
    if (locked || shake) return
    play()
    if (digit === 'delete') {setEntry(e=>e.slice(0,-1));setError('');return}
    if (!/^\d$/.test(digit) || entry.length >= 4) return
    const next = entry + digit
    setEntry(next)
    if (next.length !== 4) return
    if (next === CODE) {
      setLock(fresh());setError('');setEntry('');unlock();return
    }
    const failed = lock.failed + 1
    const delay = failed===6?60_000:failed===7?300_000:failed>=8?900_000:0
    setLock({failed,lockedUntil:delay?Date.now()+delay:0,resetOnExpiry:failed>=8})
    setError(delay ? `iPhone Unavailable` : 'Incorrect passcode')
    setShake(true)
    window.setTimeout(()=>{setShake(false);setEntry('')},420)
  }
  useEffect(() => {
    if (!passcode) return
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {e.preventDefault();press(e.key)}
      else if (e.key === 'Backspace') {e.preventDefault();press('delete')}
      else if (e.key === 'Escape') {e.preventDefault();setPasscode(false)}
    }
    window.addEventListener('keydown',onKey)
    return () => window.removeEventListener('keydown',onKey)
  },[passcode,entry,lock,locked,shake])
  const date = new Date(now)
  return <div className={'lock-screen ios-lock ios6-lock wallpaper-'+wall+(passcode?' passcode-active':'')}>
    <StoryMedia name="lockscreen" className="story-wallpaper-image" alt=""/>
    {!passcode ? <>
      <div className="lock-center ios6-lock-clock">
        <LockKeyhole size={15} strokeWidth={2.4}/>
        <div className="lock-date">{date.toLocaleDateString('en-US',{timeZone:'Asia/Manila',weekday:'long',month:'long',day:'numeric'})}</div>
        <div className="lock-time">{date.toLocaleTimeString('en-US',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:false})}</div>
      </div>
      <button className="lock-notif ios6-lock-notification" onClick={activate} aria-label="Open notification and unlock">
        <div className="lock-notif-title"><span><span className="notif-messages-icon"><MessageCircle size={12} fill="white" stroke="white"/></span> MESSAGES</span><span>now</span></div>
        <strong>Baby</strong><p>Text me when you’re free, okay? 🤍</p>
      </button>
      <button className="lock-tap-area" onClick={activate} aria-label="Open passcode keypad"/>
      <div className="lock-bottom ios6-lock-bottom">
        <button onClick={e=>e.stopPropagation()} aria-label="Flashlight"><Flashlight size={23}/></button>
        <button className="lock-swipe-label" onClick={activate} aria-label="Enter passcode"><ChevronUp size={21}/><span>Swipe up to unlock</span></button>
        <button onClick={activate} aria-label="Unlock camera"><Camera size={23}/></button>
      </div>
      {!sound&&<span className="silent-label"><BellOff size={13}/> Silent Mode</span>}
    </> : <div className="passcode-panel ios6-passcode-panel">
      <div className="ios6-passcode-icon"><LockKeyhole size={18} strokeWidth={2}/></div>
      <div className="passcode-prompt ios6-passcode-prompt">
        <h1>{locked?'iPhone Unavailable':'Enter Passcode'}</h1>
        {locked?<p className="ios6-lockout-time">Try again in {timeLeft(remaining)}</p>:<>
          <div className={'passcode-dots'+(shake?' passcode-shake':'')} aria-label={entry.length+' of 4 digits entered'}>
            {[0,1,2,3].map(n=><i key={n} className={n<entry.length?'filled':''}/>)}
          </div>
          <div className="passcode-error" role="status">{error}</div>
        </>}
      </div>
      <div className={'passcode-pad ios6-passcode-pad'+(locked?' is-disabled':'')}>
        {[['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ']].map(([d,letters])=><button key={d} disabled={locked} onClick={()=>press(d)} className="passcode-digit" aria-label={'Digit '+d}><span>{d}</span><small>{letters}</small></button>)}
        <span/>
        <button disabled={locked} className="passcode-digit" onClick={()=>press('0')} aria-label="Digit 0"><span>0</span></button>
        <button disabled={locked} className="passcode-delete" onClick={()=>press('delete')} aria-label="Delete last digit"><Delete size={23}/></button>
      </div>
      <button className="passcode-cancel" onClick={()=>{setPasscode(false);setEntry('');setError('')}}>Cancel</button>
    </div>}
  </div>
}
