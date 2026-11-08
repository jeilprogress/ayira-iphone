import { useState, useEffect, useRef, useCallback, Component, type ErrorInfo, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import IosIcon from './IosIcon'
import LockScreen from './LockScreen'
import StoryMedia from './StoryMedia'
import { MessageCircle, Phone, Images, Camera, NotebookPen, CalendarDays, Settings, Clock3, Calculator, Compass, ContactRound, ListTodo, Music2, CloudSun, Folder, MapPinned, Mail, Wifi, BatteryFull, Signal, ChevronLeft, ChevronRight, Search, Plus, MoreHorizontal, Video, Mic, PhoneCall, Star, Delete, X, Volume2, VolumeX, Sun, Bluetooth, Plane, Moon, Flashlight, Timer, LockKeyhole, CircleUserRound, Info, Share2, Heart, Trash2, Check, Play, Pause, RotateCcw, Globe, ArrowUpRight, Grid2X2, SquarePen, Bell, BellOff, CheckCircle2, AlarmClock, ChevronDown, Image as ImageIcon, Navigation, Copy, CameraOff, ExternalLink, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { contacts, seedChats, defaultNotes, defaultReminders, uid, clockTime, shortTime, dateLabel, dateISO, scriptedReply, type AppId, type Screen, type ChatMessage, type Contact, type Note, type CalEvent, type Reminder, type SavedPhoto } from './data'

type Local<T> = [T, (value: T | ((old: T) => T)) => void]
function useLocal<T>(key: string, initial: T): Local<T> {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(`ayira-phone-v1:${key}`); return raw ? (key === 'chats' ? normalizeChats(JSON.parse(raw)) as unknown as T : JSON.parse(raw) as T) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(`ayira-phone-v1:${key}`, JSON.stringify(value)) } catch { /* storage unavailable */ } }, [key, value])
  return [value, setValue]
}
const appList: {id: AppId; title: string; icon: LucideIcon; color: string; text?: string}[] = [
  { id: 'messages', title: 'Messages', icon: MessageCircle, color: 'linear-gradient(155deg,#5eee6c,#10b630)' },
  { id: 'calendar', title: 'Calendar', icon: CalendarDays, color: '#fff', text: '#ed3131' },
  { id: 'photos', title: 'Photos', icon: Images, color: '#fff', text: '#ea598b' },
  { id: 'camera', title: 'Camera', icon: Camera, color: 'linear-gradient(#e8e9ed,#adb0ba)', text: '#242830' },
  { id: 'mail', title: 'Mail', icon: Mail, color: 'linear-gradient(150deg,#50b7fb,#087af0)' },
  { id: 'clock', title: 'Clock', icon: Clock3, color: '#202020' },
  { id: 'maps', title: 'Maps', icon: MapPinned, color: 'linear-gradient(145deg,#89cf95,#f4f2e4 56%,#56b8e6)', text: '#278ad2' },
  { id: 'weather', title: 'Weather', icon: CloudSun, color: 'linear-gradient(#3ea5ff,#67b9ff)' },
  { id: 'notes', title: 'Notes', icon: NotebookPen, color: 'linear-gradient(#ffda4f 0 30%,#ffffff 30% 100%)', text: '#5f6570' },
  { id: 'reminders', title: 'Reminders', icon: ListTodo, color: '#fff', text: '#5f89e2' },
  { id: 'files', title: 'Files', icon: Folder, color: '#f5f6fd', text: '#428cf4' },
  { id: 'settings', title: 'Settings', icon: Settings, color: 'linear-gradient(#a4abb9,#606a7b)' },
  { id: 'music', title: 'Music', icon: Music2, color: '#fff', text: '#f13459' },
  { id: 'calculator', title: 'Calculator', icon: Calculator, color: '#222222' },
  { id: 'contacts', title: 'Contacts', icon: ContactRound, color: '#b8bdcc' },
  { id: 'safari', title: 'Safari', icon: Compass, color: '#f6f9ff', text: '#2296ed' },
  { id: 'phone', title: 'Phone', icon: Phone, color: 'linear-gradient(135deg,#72e875,#16c139)' },
]
const appInfo = Object.fromEntries(appList.map(a => [a.id, a])) as Record<AppId, typeof appList[number]>
function normalizeChats(raw: unknown): Record<string, ChatMessage[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return structuredClone(seedChats)
  const result: Record<string, ChatMessage[]> = {}
  for (const person of contacts) {
    const entries = (raw as Record<string, unknown>)[person.id]
    result[person.id] = Array.isArray(entries)
      ? entries.filter((m): m is ChatMessage => !!m && typeof m === 'object' && typeof m.text === 'string' && (m.from === 'me' || m.from === 'them')).map(m => ({id:String(m.id||uid()),from:m.from,text:m.text,time:String(m.time||shortTime())}))
      : [...(seedChats[person.id]||[])]
  }
  return result
}
function ScreenRenderer({render}:{render:()=>ReactNode}) {return <>{render()}</>}
class AppFailureBoundary extends Component<{children:ReactNode},{broken:boolean}> {
  state={broken:false}
  static getDerivedStateFromError(){return {broken:true}}
  componentDidCatch(error: Error, info: ErrorInfo){console.error('Ayira iPhone screen error:',error,info)}
  render(){return this.state.broken ? <div className="app-recovery"><h2>Couldn't open this screen</h2><p>Your messages and notes are still saved. Try returning to the Home Screen.</p><button onClick={()=>{this.setState({broken:false});window.dispatchEvent(new Event('ayira:home'))}}>Go Home</button></div> : this.props.children}
}

let audioCtx: AudioContext | null = null
function tone(type: 'tap' | 'send' | 'receive' | 'lock') {
  try {
    audioCtx = audioCtx ?? new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    const sound = (freq: number, at: number, dur: number, amp: number) => {
      const osc = audioCtx!.createOscillator(), gain = audioCtx!.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      const t = audioCtx!.currentTime + at
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(amp, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain).connect(audioCtx!.destination); osc.start(t); osc.stop(t + dur + 0.02)
    }
    if (type === 'receive') { sound(932,0,.2,.085); sound(1175,.13,.31,.08) }
    if (type === 'send') sound(780,0,.13,.035)
    if (type === 'tap') sound(740,0,.038,.012)
    if (type === 'lock') { sound(600,0,.07,.025); sound(420,.075,.10,.025) }
  } catch { /* Browsers may block sound */ }
}
function Avatar({person, size = 48}: {person: Contact; size?: number}) {
  return <div className="avatar" style={{width:size,height:size,background:`linear-gradient(145deg, ${person.color}, ${person.color}b9)`,fontSize:size*.40}} aria-label={`${person.name} profile photo`}>{person.initials}{person.id==='baby'&&<StoryMedia name="baby" className="story-avatar-photo" alt="Baby (Matt)"/>}</div>
}
function Header({title, back, right, eyebrow}: {title: string; back?: () => void; right?: ReactNode; eyebrow?: string}) {
  return <div className="app-header"><div className="header-top"><button className="back-link" onClick={back} aria-label="Back">{back && <><ChevronLeft size={24} strokeWidth={2.2}/><span>Back</span></>}</button><div className="header-right">{right}</div></div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1></div>
}
function IconButton({children,onClick,aria}: {children: ReactNode;onClick:()=>void;aria:string}) { return <button type="button" className="icon-action" onClick={onClick} aria-label={aria}>{children}</button> }
function Placeholder({icon: Icon, title, description}: {icon:LucideIcon;title:string;description:string}) {return <div className="empty-state"><Icon size={41} strokeWidth={1.4}/><strong>{title}</strong><span>{description}</span></div>}

function Messages({chats,setChats,play,onContact,initialSelected=null}: {chats:Record<string,ChatMessage[]>;setChats:Local<Record<string,ChatMessage[]>>[1];play:(s:'tap'|'send'|'receive')=>void;onContact:(id:string)=>void;initialSelected?:string|null}) {
  const [selected,setSelected] = useState<string | null>(initialSelected)
  const [search,setSearch] = useState('')
  const [draft,setDraft] = useState('')
  const [filter,setFilter] = useState<'all'|'unread'>('all')
  const [typing,setTyping] = useState<string | null>(null)
  const [compose,setCompose] = useState(false)
  const [showDetails,setShowDetails] = useState(false)
  const [unread,setUnread] = useLocal<string[]>('unread', [])
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { const scrollPane=end.current?.closest('.thread-messages'); if(scrollPane)scrollPane.scrollTop=scrollPane.scrollHeight }, [selected, chats, typing])
  const openChat = (id:string) => {play('tap');setSelected(id);setDraft('');setCompose(false);setUnread(old=>old.filter(x=>x!==id))}
  const sendMessage=()=>{
    const value=draft.trim();if(!value||!selected||value.length>2500)return
    play('send');setDraft('');const now=shortTime()
    setChats(old=>{const safe=normalizeChats(old);return {...safe,[selected]:[...(safe[selected]||[]),{id:uid(),from:'me',text:value,time:now}]}})
    if(selected==='baby') {
      setTyping('baby')
      const reply=scriptedReply(value,(chats.baby||[]).length)
      window.setTimeout(()=>{setChats(old=>{const safe=normalizeChats(old);return {...safe,baby:[...(safe.baby||[]),{id:uid(),from:'them',text:reply,time:shortTime()}]}});setTyping(old=>old==='baby'?null:old);play('receive')},1250+Math.min(1800,value.length*27))
    }
  }
  if(selected){const p=contacts.find(x=>x.id===selected) || contacts[0],items=Array.isArray(chats[selected])?chats[selected]:[];return <div className="messages-thread app-page ios5-message-thread">
    <div className="thread-header"><button onClick={()=>{setSelected(null);setShowDetails(false)}} className="thread-back"><ChevronLeft size={28}/><span className="thread-count">{contacts.length}</span></button><button className="thread-person" onClick={()=>setShowDetails(true)}><Avatar person={p} size={37}/><span>{p.name} <ChevronRight size={12}/></span></button><button className="thread-video" onClick={()=>setShowDetails(true)} aria-label="Contact information"><Video size={24}/></button></div>
    <div className="thread-messages scroll-area" aria-label={`Conversation with ${p.name}`}><div className="chat-date-separator">iMessage <span>· End-to-end encrypted</span></div>{items.map((it,idx)=><div className={`message-row ${it.from==='me'?'sent':'received'}`} key={it.id}>{it.from==='them' && idx>0 && items[idx-1].from==='me' ? <span className="bubble-space"/>:null}<div className="message-bubble">{it.text}</div></div>)}{typing===selected&&<div className="message-row received"><div className="message-bubble typing-dots"><span/><span/><span/></div></div>}<div className="message-delivered">{typing===selected?'':items[items.length-1]?.from==='me'?'Delivered':''}</div><div ref={end}/></div>
    <div className="composer-wrap"><button className="circle-plus" onClick={()=>setShowDetails(true)} aria-label="More options"><Plus size={22}/></button><div className="composer"><input value={draft} maxLength={2500} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendMessage()}}} placeholder="iMessage" aria-label="Type a message"/><button className={draft.trim()?'send-active':'send-inactive'} onClick={sendMessage} aria-label="Send message"><ArrowUpRightIcon/></button></div><button className="composer-mic" onClick={()=>setShowDetails(true)} aria-label="Audio messaging"><Mic size={21}/></button></div>
    {showDetails&&<div className="modal-shade" onClick={()=>setShowDetails(false)}><div className="contact-sheet" onClick={e=>e.stopPropagation()}><div className="sheet-grabber"/><button className="sheet-close" onClick={()=>setShowDetails(false)}><X size={18}/></button><Avatar person={p} size={76}/><h2>{p.name}</h2><p>{p.fullName}</p><div className="sheet-actions"><button onClick={()=>{setShowDetails(false);onContact(p.id)}}><Info size={22}/>info</button><button onClick={()=>setShowDetails(false)}><Phone size={22}/>audio</button><button onClick={()=>setShowDetails(false)}><Video size={22}/>video</button></div><p className="sheet-note">{p.id==='baby'?'Mathine Vale · Baby 🤍':'More contact details coming soon.'}</p></div></div>}
  </div>}
  const sorted=contacts.filter(c=>(filter==='all'||unread.includes(c.id))&&((c.name+' '+c.fullName+' '+((Array.isArray(chats[c.id])?chats[c.id]:[]).at(-1)?.text||'')).toLowerCase().includes(search.toLowerCase())))
  const pinned=sorted.slice(0,6)
  return <div className="app-page ios5-messages-list scroll-area">
    <div className="ios5-messages-nav"><button onClick={()=>setUnread(contacts.map(c=>c.id))}>Edit</button><strong>Messages</strong><button onClick={()=>setFilter(v=>v==='all'?'unread':'all')} aria-label="Filter messages"><SlidersHorizontal size={22}/></button></div>
    <div className="ios5-messages-pinned">{pinned.map(c=><button onClick={()=>openChat(c.id)} key={c.id}><Avatar person={c} size={64}/>{unread.includes(c.id)&&<i className="ios5-pin-unread"/>}<span>{c.name}</span></button>)}</div>
    <div className="ios5-conversation-list">{sorted.map(c=>{const items=Array.isArray(chats[c.id])?chats[c.id]:[];const last=items.at(-1);return <button className="ios5-conversation-row" key={c.id} onClick={()=>openChat(c.id)}><Avatar person={c} size={46}/><div><strong>{c.name}</strong><span>{last?.from==='me'?'You: ':''}{last?.text||'Start a conversation'}</span></div><time>{last?.time||'Yesterday'}</time><ChevronRight size={16}/>{unread.includes(c.id)&&<i className="ios5-row-unread"/>}</button>})}{!sorted.length&&<div className="ios5-no-messages">No Conversations</div>}</div>
    <div className="ios5-message-search-bar"><label><Search size={19}/><input placeholder="Search" aria-label="Search messages" value={search} onChange={e=>setSearch(e.target.value)}/><Mic size={18}/></label><button onClick={()=>setCompose(true)} aria-label="New message"><SquarePen size={23}/></button></div>
    {compose&&<div className="modal-shade" onClick={()=>setCompose(false)}><div className="compose-sheet" onClick={e=>e.stopPropagation()}><div className="sheet-grabber"/><div className="compose-title"><button onClick={()=>setCompose(false)}>Cancel</button><strong>New Message</strong><span/></div><p>To: <span>Select a contact</span></p>{contacts.map(c=><button className="contact-pick" key={c.id} onClick={()=>openChat(c.id)}><Avatar person={c} size={36}/><span>{c.name}</span><ChevronRight size={18}/></button>)}</div></div>}
  </div>
}
function ArrowUpRightIcon(){return <span className="send-arrow">↑</span>}

function Photos({photos,setPhotos,openCamera}: {photos:SavedPhoto[];setPhotos:Local<SavedPhoto[]>[1];openCamera:()=>void}) {
  const [chosen,setChosen]=useState<SavedPhoto|null>(null)
  const [favorites,setFavorites]=useLocal<string[]>('photo-favorites',[])
  const [mode,setMode]=useState<'library'|'collections'>('library')
  const isFavorite = chosen ? favorites.includes(chosen.id) : false
  const favorite=()=>{if(!chosen)return;setFavorites(old=>old.includes(chosen.id)?old.filter(x=>x!==chosen.id):[...old,chosen.id])}
  const remove=()=>{if(!chosen)return;setPhotos(old=>old.filter(x=>x.id!==chosen.id));setFavorites(old=>old.filter(x=>x!==chosen.id));setChosen(null)}
  return <div className="app-page photos-app">
    <div className="photos-top"><h1>Photos</h1><div><button aria-label="Switch Photos view" onClick={()=>setMode(mode==='library'?'collections':'library')}><SlidersHorizontal size={21}/></button><button aria-label="Take photo" onClick={openCamera}><Camera size={22}/></button></div></div>
    <div className="photos-scroller scroll-area">
      {mode==='library'?<>
        <div className="photo-section-title">Library <span>{photos.length} {photos.length===1?'Photo':'Photos'}</span></div>
        {photos.length?<div className="photo-grid">{photos.map(p=><button key={p.id} className="photo-tile" onClick={()=>setChosen(p)} aria-label={`Open photo taken ${p.date}`}><img src={p.src} alt={`Captured ${p.date}`}/></button>)}</div>:<div className="photos-native-empty"><Images size={55} strokeWidth={1.15}/><strong>No Photos or Videos</strong><span>No items</span><button onClick={openCamera}>Open Camera</button></div>}
      </>:<div className="collections-native"><h2>Collections</h2><article><div className="coll-symbol"><Images size={29}/></div><div><strong>Recent Days</strong><span>{photos.length} photos saved</span></div></article><article><div className="coll-symbol"><Heart size={29}/></div><div><strong>Favorites</strong><span>{favorites.length} photos</span></div></article><article><div className="coll-symbol"><Grid2X2 size={29}/></div><div><strong>Albums</strong><span>No Shared Albums</span></div></article><article><div className="coll-symbol"><Camera size={29}/></div><div><strong>Recently Saved</strong><span>{photos.length} items</span></div></article></div>}
    </div>
    <div className="photos-tabs"><button className={mode==='library'?'active':''} onClick={()=>setMode('library')}><Images size={20}/>Library</button><button className={mode==='collections'?'active':''} onClick={()=>setMode('collections')}><Grid2X2 size={20}/>Collections</button></div>
    {chosen&&<div className="photo-viewer"><div className="photo-viewer-header"><button onClick={()=>setChosen(null)}><ChevronLeft size={24}/> All Photos</button><span>{chosen.date}</span></div><div className="photo-full"><img src={chosen.src} alt="Selected photograph"/></div><div className="photo-viewer-actions"><IconButton aria="Favorite photo" onClick={favorite}><Heart size={24} fill={isFavorite?'#ff3c67':'none'} color={isFavorite?'#ff3c67':'white'}/></IconButton><IconButton aria="Delete photo" onClick={remove}><Trash2 size={23}/></IconButton><IconButton aria="Close photo" onClick={()=>setChosen(null)}><X size={22}/></IconButton></div></div>}
  </div>
}
function CameraApp({savePhoto}: {savePhoto:(src:string)=>void}) {
  const [status,setStatus]=useState<'loading'|'live'|'denied'>('loading')
  const videoRef=useRef<HTMLVideoElement>(null)
  const streamRef=useRef<MediaStream|null>(null)
  const [facing,setFacing]=useState<'environment'|'user'>('environment')
  const [flash,setFlash]=useState(false)
  const [lastPhoto,setLastPhoto]=useState<string|null>(null)
  useEffect(()=>{let active=true;setStatus('loading'); if(!navigator.mediaDevices?.getUserMedia){setStatus('denied');return}
    navigator.mediaDevices.getUserMedia({video:{facingMode:facing},audio:false}).then(s=>{if(!active){s.getTracks().forEach(t=>t.stop());return}streamRef.current=s; if(videoRef.current){videoRef.current.srcObject=s;void videoRef.current.play().catch(()=>{})}setStatus('live')}).catch(()=>{if(active)setStatus('denied')})
    return ()=>{active=false;streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null}
  },[facing])
  const capture=()=>{const video=videoRef.current;if(status!=='live'||!video||!video.videoWidth)return;const canvas=document.createElement('canvas');const scale=Math.min(1,1200/video.videoWidth);canvas.width=video.videoWidth*scale;canvas.height=video.videoHeight*scale;canvas.getContext('2d')?.drawImage(video,0,0,canvas.width,canvas.height);const src=canvas.toDataURL('image/jpeg',.76);savePhoto(src);setLastPhoto(src)}
  return <div className="app-page camera-app"><div className="camera-tools"><button onClick={()=>setFlash(f=>!f)} aria-label="Flash"><Flashlight size={22} color={flash?'#ffcf39':'white'}/></button><span>PHOTO</span><button aria-label="Camera options"><ChevronDown size={22}/></button></div><div className="viewfinder"><video ref={videoRef} autoPlay playsInline muted style={{display:status==='live'?'block':'none'}}/>{status!=='live'&&<div className="camera-fallback"><CameraOff size={46}/><strong>{status==='loading'?'Opening camera…':'Camera unavailable'}</strong><span>Allow camera access in your browser. A secure HTTPS connection is required on most devices.</span></div>}{flash&&<span className="flash-pill">Flash On</span>}</div><div className="camera-mode">CINEMATIC &nbsp; VIDEO &nbsp; <strong>PHOTO</strong> &nbsp; PORTRAIT</div><div className="camera-controls"><div className="camera-preview">{lastPhoto&&<img src={lastPhoto} alt="Last captured"/>}</div><button className="shutter" onClick={capture} aria-label="Take photo" disabled={status!=='live'}><span/></button><button className="camera-flip" onClick={()=>setFacing(v=>v==='environment'?'user':'environment')} aria-label="Flip camera"><RotateCcw size={25}/></button></div></div>
}
function Notes({notes}: {notes:Note[];setNotes:Local<Note[]>[1]}) {
  const [selected,setSelected]=useState<string|null>(null)
  const [folders,setFolders]=useState(false)
  const [search,setSearch]=useState('')
  const all=Array.isArray(notes)?notes:defaultNotes
  const items=all.filter(n=>(n.title+' '+n.body).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.updated-a.updated)
  const active=all.find(n=>n.id===selected)
  if(active)return <div className="app-page notes-app story-notes-app">
    <div className="notes-edit-header"><button onClick={()=>setSelected(null)}><ChevronLeft size={23}/>Notes</button><button onClick={()=>setSelected(null)}>Done</button></div>
    <div className="note-reading scroll-area">
      <div className="note-date">{new Date(active.updated).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
      <h2>{active.title}</h2>
      {active.body.split('\n').filter((line,i)=>line.trim()&&!(i===0&&line.trim()===active.title)).map((line,i)=><p key={i}>{line}</p>)}
    </div>
    <div className="notes-toolbar story-notes-toolbar">
      <button disabled aria-label="Delete note unavailable"><Trash2 size={22}/></button>
      <button disabled aria-label="Formatting unavailable"><span className="aa">Aa</span></button>
      <span>{all.length} Notes</span>
      <button disabled aria-label="New note unavailable"><SquarePen size={23}/></button>
    </div>
  </div>
  if(folders)return <div className="app-page notes-app story-notes-app">
    <div className="notes-nav"><button onClick={()=>setFolders(false)}><ChevronLeft size={23}/>Notes</button></div>
    <h1>Folders</h1><div className="ios5-folder-label">ON MY IPHONE</div>
    <button className="ios5-folder-row" onClick={()=>setFolders(false)}><Folder size={23} color="#dfa82f" fill="#dfa82f"/><span>Notes</span><small>{all.length}</small><ChevronRight size={18}/></button>
  </div>
  return <div className="app-page notes-app story-notes-app">
    <div className="notes-nav"><button onClick={()=>setFolders(true)}><ChevronLeft size={23}/>Folders</button><button disabled aria-label="New note unavailable"><SquarePen size={23}/></button></div>
    <h1>Notes</h1>
    <label className="search-input"><Search size={18}/><input placeholder="Search" aria-label="Search Notes" value={search} onChange={e=>setSearch(e.target.value)}/></label>
    <div className="notes-list scroll-area">{items.map(n=><button key={n.id} className="note-item" onClick={()=>setSelected(n.id)}>
      <strong>{n.title}</strong><span>{new Date(n.updated).toLocaleDateString('en-US',{month:'short',day:'numeric'})} <em>{n.body.split('\n').slice(1).join(' ').trim().slice(0,70)||' '}</em></span>
    </button>)}{!items.length&&<div className="ios5-no-results">No Notes Found</div>}</div>
    <div className="notes-bottom"><span>{all.length} Notes</span><button disabled aria-label="Create note unavailable"><SquarePen size={23}/></button></div>
  </div>
}

function CalendarApp({events}: {events:CalEvent[];setEvents:Local<CalEvent[]>[1]}){
  const storyMonth=new Date(2019,2,1)
  const [month,setMonth]=useState(storyMonth)
  const [day,setDay]=useState('2019-03-30')
  const cells=Array.from({length:Math.ceil((new Date(month.getFullYear(),month.getMonth()+1,0).getDate()+new Date(month.getFullYear(),month.getMonth(),1).getDay())/7)*7},(_,i)=>{
    const d=i-new Date(month.getFullYear(),month.getMonth(),1).getDay()+1
    return d>=1&&d<=new Date(month.getFullYear(),month.getMonth()+1,0).getDate()?dateISO(new Date(month.getFullYear(),month.getMonth(),d)):''
  })
  const remembered:CalEvent={id:'ayira-2019-03-30',date:'2019-03-30',title:'Her birthday',time:'All-day',color:'#e74942'}
  const all=[remembered,...(Array.isArray(events)?events:[]).filter(e=>e.id!==remembered.id)]
  const visible=all.filter(e=>e.date===day)
  const shift=(n:number)=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+n,1))
  return <div className="app-page calendar-app story-calendar">
    <div className="calendar-nav"><button onClick={()=>{setMonth(storyMonth);setDay('2019-03-30')}}>2019</button><div>
      <IconButton onClick={()=>shift(-1)} aria="Previous month"><ChevronLeft/>
      </IconButton><IconButton onClick={()=>shift(1)} aria="Next month"><ChevronRight/></IconButton>
      <button className="story-calendar-add" disabled aria-label="Add event unavailable"><Plus size={22}/></button>
    </div></div>
    <h1>{month.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h1>
    <div className="weekday-labels">{['S','M','T','W','T','F','S'].map((d,i)=><span key={i}>{d}</span>)}</div>
    <div className="calendar-grid">{cells.map((d,i)=><button key={i} disabled={!d} onClick={()=>setDay(d)} className={(d===day?'chosen ':'')+(d==='2019-03-30'?'has-story-date':'')}>
      <span>{d?Number(d.slice(-2)):''}</span>{all.some(e=>e.date===d)&&<i/>}
    </button>)}</div>
    <div className="calendar-divider"/>
    <h3>{new Date(day+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</h3>
    <div className="calendar-event-list scroll-area">{visible.map(e=><div key={e.id} className="event-row"><span className="event-bar" style={{background:e.color}}/><div>
      <strong>{e.title}</strong><span>{e.time}</span>{e.id===remembered.id&&<p className="story-calendar-note">Her birthday, give her the gift (or don't).</p>}
    </div></div>)}{!visible.length&&<div className="no-events">No Events</div>}</div>
  </div>
}

function ContactsApp({openMessage}:{openMessage:(id:string)=>void}){
  const [selected,setSelected]=useState<Contact|null>(null),[q,setQ]=useState('')
  if(selected)return <div className="app-page contacts-app"><div className="simple-nav"><button onClick={()=>setSelected(null)}><ChevronLeft size={24}/>Contacts</button></div><div className="contact-detail"><Avatar person={selected} size={100}/><h1>{selected.name}</h1><p>{selected.fullName}</p><div className="contact-actions"><button onClick={()=>openMessage(selected.id)}><MessageCircle size={23}/>message</button><button><Phone size={23}/>call</button><button><Video size={23}/>video</button><button><Mail size={23}/>mail</button></div><div className="ios-group"><small>mobile</small><strong>{selected.number}</strong></div><div className="ios-group ios-blue-text">Share Contact</div><div className="ios-group ios-blue-text">Add to Favorites</div></div></div>
  return <div className="app-page contacts-app"><div className="simple-nav"><span>Lists</span><Plus size={22}/></div><h1>Contacts</h1><div className="search-input"><Search size={18}/><input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="contacts-scroll scroll-area"><div className="owner-card"><CircleUserRound size={46}/><div><strong>Ayira Ross</strong><span>My Card</span></div></div>{contacts.filter(c=>`${c.name} ${c.fullName}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name)).map(c=><button className="contact-row" onClick={()=>setSelected(c)} key={c.id}><Avatar person={c} size={37}/><strong>{c.name}</strong><ChevronRight size={17}/></button>)}</div></div>
}
function PhoneApp({openMessage}:{openMessage:(id:string)=>void}){
  const [tab,setTab]=useState<'favorites'|'recents'|'contacts'|'keypad'>('recents')
  const [digits,setDigits]=useState('')
  const [calling,setCalling]=useState(false)
  const [chosen,setChosen]=useState<Contact|null>(null)
  const [muted,setMuted]=useState(false)
  const [speaker,setSpeaker]=useState(false)
  const [callKeypad,setCallKeypad]=useState(false)
  const [callSeconds,setCallSeconds]=useState(0)
  useEffect(()=>{if(!calling)return;const id=window.setInterval(()=>setCallSeconds(n=>n+1),1000);return()=>window.clearInterval(id)},[calling])
  const startCall=(person:Contact|null)=>{setChosen(person);setMuted(false);setSpeaker(false);setCallKeypad(false);setCallSeconds(0);setCalling(true)}
  const formatTime=String(Math.floor(callSeconds/60)).padStart(2,'0')+':'+String(callSeconds%60).padStart(2,'0')
  const numbers=[['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0','+'],['#','']]
  if(calling){
    const controls=[
      {label:'mute',Icon:Mic,active:muted,disabled:false,click:()=>setMuted(v=>!v)},
      {label:'keypad',Icon:Grid2X2,active:false,disabled:false,click:()=>setCallKeypad(true)},
      {label:'audio',Icon:Volume2,active:speaker,disabled:false,click:()=>setSpeaker(v=>!v)},
      {label:'add call',Icon:Plus,active:false,disabled:true,click:()=>{}},
      {label:'FaceTime',Icon:Video,active:false,disabled:true,click:()=>{}},
      {label:'contacts',Icon:ContactRound,active:false,disabled:true,click:()=>{}}
    ]
    return <div className="app-page ios5-call">
      <div className="ios5-call-heading"><h1>{chosen?.name||digits||'Unknown'}</h1><span>{formatTime}</span></div>
      {callKeypad?<><div className="ios5-call-number">{digits}</div><div className="ios5-call-keypad">{numbers.map(([n,letters])=><button key={n} onClick={()=>setDigits(v=>v+n)}><strong>{n}</strong><small>{letters}</small></button>)}</div><button className="ios5-hide-keypad" onClick={()=>setCallKeypad(false)}>Hide Keypad</button></>:<div className="ios5-call-controls">{controls.map(({Icon,label,active,disabled,click})=><button key={label} onClick={click} disabled={disabled} className={'ios5-call-button'+(active?' is-active':'')}><span className="ios5-call-circle"><Icon size={29}/></span><small>{label}</small></button>)}</div>}
      <div className="ios5-call-bottom"><button className="ios5-end-call" onClick={()=>setCalling(false)} aria-label="End call"><Phone size={32} fill="currentColor"/></button><span>Use RTT</span></div>
      
    </div>
  }
  return <div className="app-page ios5-phone">
    <h1>{tab==='recents'?'Recents':tab==='favorites'?'Favorites':tab==='contacts'?'Contacts':'Keypad'}</h1>
    {tab==='keypad'?<div className="ios5-dialer"><div className="ios5-dialer-number">{digits||' '}</div><div className="ios5-dialer-grid">{numbers.map(([n,l])=><button key={n} onClick={()=>setDigits(v=>v+n)}><strong>{n}</strong><small>{l}</small></button>)}</div><div className="ios5-dial-actions"><button onClick={()=>setDigits(v=>v.slice(0,-1))} aria-label="Delete number"><Delete size={21}/></button><button className="ios5-dial-call" onClick={()=>startCall(contacts.find(c=>c.number===digits)||null)} aria-label="Call"><Phone size={26} fill="currentColor"/></button><span/></div></div>:<div className="ios5-phone-list scroll-area">{(tab==='favorites'?contacts.slice(0,2):contacts).map((c,i)=><button key={c.id} onClick={()=>startCall(c)} className="ios5-recent-row"><div><strong>{c.name}</strong><span>{tab==='contacts'?c.number:'mobile'}</span></div><time>{i===0?'Today':'Yesterday'}</time><Info size={18}/></button>)}</div>}
    <div className="ios5-phone-tabs">{([['favorites',Star,'Favorites'],['recents',Clock3,'Recents'],['contacts',ContactRound,'Contacts'],['keypad',Grid2X2,'Keypad']] as const).map(([key,Icon,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}><Icon size={22}/><span>{label}</span></button>)}</div>
  </div>
}
function RemindersApp({items,setItems}:{items:Reminder[];setItems:Local<Reminder[]>[1]}){
  const [draft,setDraft]=useState('');const add=()=>{if(!draft.trim())return;setItems(old=>[...old,{id:uid(),label:draft.trim(),done:false}]);setDraft('')}
  return <div className="app-page reminders-app"><Header title="Reminders"/><div className="reminders-cards"><div className="reminder-card blue"><CalendarDays size={23}/><strong>{items.filter(x=>!x.done).length}</strong><span>Scheduled</span></div><div className="reminder-card gray"><CheckCircle2 size={23}/><strong>{items.filter(x=>x.done).length}</strong><span>Completed</span></div></div><div className="reminder-list-title"><span>●</span> My Reminders</div><div className="reminders-list scroll-area">{items.map(r=><div className="reminder-row" key={r.id}><button className={`check-ring ${r.done?'checked':''}`} onClick={()=>setItems(old=>old.map(x=>x.id===r.id?{...x,done:!x.done}:x))}>{r.done&&<Check size={15}/>}</button><span className={r.done?'done':''}>{r.label}</span><button onClick={()=>setItems(old=>old.filter(x=>x.id!==r.id))}><X size={16}/></button></div>)}</div><div className="new-reminder"><input placeholder="New Reminder" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add()}}/><button onClick={add}><Plus size={20}/></button></div></div>
}
function CalculatorApp(){
  const [display,setDisplay]=useState('0'),[prev,setPrev]=useState<number|null>(null),[op,setOp]=useState<string|null>(null),[fresh,setFresh]=useState(false)
  const press=(v:string)=>{if(/^[0-9.]$/.test(v)){setDisplay(s=>fresh?(v==='.'?'0.':v):v==='.'?(s.includes('.')?s:s+'.'):s==='0'?v:s+v);setFresh(false);return}if(v==='AC'){setDisplay('0');setPrev(null);setOp(null);setFresh(false);return}if(v==='+/-'){setDisplay(s=>String(-Number(s)));return}if(v==='%'){setDisplay(s=>String(Number(s)/100));return}if(['+','−','×','÷'].includes(v)){setPrev(Number(display));setOp(v);setFresh(true);return}if(v==='='&&prev!==null&&op){const b=Number(display),calc=op==='+'?prev+b:op==='−'?prev-b:op==='×'?prev*b:b===0?NaN:prev/b;setDisplay(Number.isFinite(calc)?String(Number(calc.toFixed(8))):'Error');setPrev(null);setOp(null);setFresh(true)}}
  return <div className="app-page calc-app"><div className="calc-top"><Calculator size={17}/> Calculator</div><div className="calc-display">{display}</div><div className="calc-keys">{['AC','+/-','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='].map((x,i)=><button key={i} className={`${['÷','×','−','+','='].includes(x)?'operator':''} ${['AC','+/-','%'].includes(x)?'utility':''} ${x==='0'?'zero':''}`} onClick={()=>press(x)}>{x}</button>)}</div></div>
}
function ClockApp(){
  const [tab,setTab]=useState<'world'|'alarms'|'stopwatch'|'timer'>('world'),[alarms,setAlarms]=useLocal<{time:string;on:boolean}[]>('alarms',[{time:'7:00 AM',on:true},{time:'8:30 AM',on:false}]),[count,setCount]=useState(0),[running,setRunning]=useState(false),[timerSecs,setTimerSecs]=useState(300),[timerOn,setTimerOn]=useState(false),[add,setAdd]=useState(false),[alarmTime,setAlarmTime]=useState('07:00')
  useEffect(()=>{if(!running&&!timerOn)return;const id=window.setInterval(()=>{if(running)setCount(c=>c+1);if(timerOn)setTimerSecs(s=>{if(s<=1){setTimerOn(false);return 0}return s-1})},1000);return()=>window.clearInterval(id)},[running,timerOn])
  const two=(n:number)=>String(n).padStart(2,'0');const formatted=`${two(Math.floor(count/3600))}:${two(Math.floor(count/60)%60)}:${two(count%60)}`
  return <div className="app-page clock-app"><div className="clock-content scroll-area">{tab==='world'?<><Header title="World Clock"/><div className="world-row"><span>Today, +0 HRS<strong>Manila</strong></span><b>{new Date().toLocaleTimeString('en-US',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:false})}</b></div><div className="world-row"><span>Today<strong>New York</strong></span><b>{new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',hour12:false})}</b></div></>:tab==='alarms'?<><div className="clock-small-nav"><span>Alarms</span><button onClick={()=>setAdd(true)}><Plus size={25}/></button></div><h1>Alarms</h1>{alarms.map((a,i)=><div className="alarm-row" key={i}><div><strong>{a.time}</strong><span>Alarm</span></div><button className={`switch ${a.on?'on':''}`} onClick={()=>setAlarms(old=>old.map((v,j)=>j===i?{...v,on:!v.on}:v))}><span/></button></div>)}</>:tab==='stopwatch'?<><div className="stopwatch-display">{formatted}<small>.00</small></div><div className="timer-buttons"><button onClick={()=>setCount(0)}>Reset</button><button className={running?'orange':'green'} onClick={()=>setRunning(r=>!r)}>{running?'Stop':'Start'}</button></div></>:<><h1>Timers</h1><div className="timer-display">{`${two(Math.floor(timerSecs/3600))}:${two(Math.floor(timerSecs/60)%60)}:${two(timerSecs%60)}`}</div><label className="timer-duration">Duration (minutes)<input type="number" min="1" max="180" defaultValue="5" onChange={e=>{if(!timerOn)setTimerSecs(Math.max(1,Number(e.target.value))*60)}} disabled={timerOn}/></label><div className="timer-buttons"><button onClick={()=>{setTimerOn(false);setTimerSecs(300)}}>Cancel</button><button className={timerOn?'orange':'green'} onClick={()=>setTimerOn(t=>!t)}>{timerOn?'Pause':'Start'}</button></div></>}</div><div className="bottom-tabs clock-tabs">{([['world',Globe,'World Clock'],['alarms',AlarmClock,'Alarms'],['stopwatch',Clock3,'Stopwatch'],['timer',Timer,'Timers']] as const).map(([key,Icon,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}><Icon size={23}/>{label}</button>)}</div>{add&&<div className="modal-shade" onClick={()=>setAdd(false)}><div className="small-modal" onClick={e=>e.stopPropagation()}><h2>Add Alarm</h2><input type="time" value={alarmTime} onChange={e=>setAlarmTime(e.target.value)}/><div className="modal-buttons"><button onClick={()=>setAdd(false)}>Cancel</button><button onClick={()=>{const d=new Date(`2000-01-01T${alarmTime}`);setAlarms(old=>[...old,{time:d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),on:true}]);setAdd(false)}}>Save</button></div></div></div>}</div>
}
function SafariApp(){
  const history=[
    'Google Scholar',
    'Review of Related Literature for the time management between the students...',
    'Philipines price hike for gas',
    'Fox plushies',
    'How to handle an anxiety attack?',
    'Anxiety attack triggers'
  ]
  const [active,setActive]=useState<string|null>(null)
  const [historyOpen,setHistoryOpen]=useState(false)
  const openHistory=(item:string)=>{setActive(item);setHistoryOpen(false)}
  const entries=[
    {name:'Google',short:'G',item:history[0]},
    {name:'Scholar',short:'S',item:history[0]},
    {name:'Wikipedia',short:'W',item:history[1]},
    {name:'Images',short:'✿',item:history[3]}
  ]
  return <div className="app-page ios6-safari">
    <div className="ios6-safari-page scroll-area">
      {active===null?<div className="ios6-safari-start">
        <h1>Start Page</h1>
        <h2>Favorites</h2><div className="ios6-safari-favorites">{entries.map((entry,i)=><button key={i} onClick={()=>openHistory(entry.item)}><span>{entry.short}</span><small>{entry.name}</small></button>)}</div>
        <h2>Recently Visited</h2><div className="ios6-safari-recent">{history.slice(0,4).map((item,i)=><button key={i} onClick={()=>openHistory(item)}><span><Clock3 size={19}/></span><strong>{item}</strong><ChevronRight size={16}/></button>)}</div>
      </div>:<div className="ios6-safari-google">
        <div className="ios6-google-logo"><span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span></div>
        <div className="ios6-google-query"><Search size={19}/><span>{active}</span><Mic size={18}/></div>
        <nav><span className="selected">All</span><span>Images</span><span>News</span><span>Books</span></nav>
        <div className="ios6-google-results">
          {active==='Google Scholar'?<>
            <div className="ios6-google-result"><small>scholar.google.com</small><h3>Google Scholar</h3><p>Search across scholarly literature.</p></div>
            <div className="ios6-google-result"><small>scholar.google.com</small><h3>Articles and citations</h3><p>Research papers, journals and academic publications.</p></div>
          </>:<>
            <div className="ios6-google-result"><small>google.com · Search</small><h3>{active}</h3><p>{active.toLowerCase().includes('anxiety')?'Health and wellness · Information and resources':active.toLowerCase().includes('plush')?'Shopping · Images · Products':active.toLowerCase().includes('literature')?'Research · Articles · Academic sources':'News · Information · Articles'}</p></div>
            <div className="ios6-google-result"><small>Related searches</small><h3>{active.toLowerCase().includes('anxiety')?'Stress and anxiety resources':active.toLowerCase().includes('literature')?'Time management and student performance':active.toLowerCase().includes('gas')?'Fuel prices in the Philippines':'Images and articles'}</h3></div>
          </>}
        </div>
      </div>}
    </div>
    <div className="ios6-safari-bottom">
      <button className="ios6-safari-address" onClick={()=>setHistoryOpen(true)} aria-label="Search or enter website name" ><Search size={16}/><span>{active===null?'Search or enter website name':'google.com'}</span><MoreHorizontal size={18}/></button>
      <div className="ios6-safari-controls">
        <button onClick={()=>setActive(null)} aria-label="Back"><ChevronLeft size={23}/></button>
        <button disabled aria-label="Forward unavailable"><ChevronRight size={23}/></button>
        <button disabled aria-label="Share unavailable"><Share2 size={21}/></button>
        <button onClick={()=>setHistoryOpen(true)} aria-label="Show browsing history"><Clock3 size={21}/></button>
        <button onClick={()=>setActive(null)} aria-label="Start page"><Grid2X2 size={21}/></button>
      </div>
    </div>
    {historyOpen&&<div className="ios6-safari-history-shade" onClick={()=>setHistoryOpen(false)}>
      <div className="ios6-safari-history" onClick={e=>e.stopPropagation()}>
        <div className="ios6-safari-history-header"><strong>History</strong><button onClick={()=>setHistoryOpen(false)}>Done</button></div>
        <div className="ios6-safari-history-label">Recently Searched</div>
        <div className="ios6-safari-history-list">{history.map((item,i)=><button key={i} onClick={()=>openHistory(item)}><Clock3 size={18}/><span>{item}</span><ChevronRight size={17}/></button>)}</div>
      </div>
    </div>}
  </div>
}

function SettingsApp({sound,setSound,wall,setWall,brightness,setBrightness}: {sound:boolean;setSound:(v:boolean)=>void;wall:number;setWall:(v:number)=>void;brightness:number;setBrightness:(v:number)=>void}){
  const [detail,setDetail]=useState<string|null>(null),[wifi,setWifi]=useState(true),[bt,setBt]=useState(true)
  if(detail)return <div className="app-page settings-app"><div className="simple-nav"><button onClick={()=>setDetail(null)}><ChevronLeft size={23}/>Settings</button></div><h1>{detail}</h1>{detail==='Wallpaper'?<><p className="settings-caption">Choose Ayira’s wallpaper</p><div className="wallpaper-picker"><button className="wall-sample wallpaper-0" onClick={()=>setWall(0)}>Aurora {wall===0?'✓':''}</button><button className="wall-sample wallpaper-1" onClick={()=>setWall(1)}>Dusk {wall===1?'✓':''}</button><button className="wall-sample wallpaper-2" onClick={()=>setWall(2)}>Lilac {wall===2?'✓':''}</button></div></>:detail==='Sounds & Haptics'?<div className="ios-group setting-row"><span>Interface sounds</span><button className={`switch ${sound?'on':''}`} onClick={()=>setSound(!sound)}><span/></button></div>:detail==='Display & Brightness'?<div className="ios-group"><label>Brightness</label><input className="range" type="range" min="40" max="100" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/></div>:<div className="ios-group setting-row"><span>{detail}</span><span>On</span></div>}</div>
  return <div className="app-page settings-app scroll-area"><Header title="Settings"/><div className="settings-profile"><Avatar person={{id:'me',name:'Ayira Ross',fullName:'Ayira Ross',initials:'AR',color:'#c8b9db',number:''}} size={60}/><div><strong>Ayira Ross</strong><span>Apple Account, iCloud & more</span></div><ChevronRight size={18}/></div><div className="settings-group"><div className="setting-row"><div className="setting-symbol blue"><Wifi size={18}/></div><span>Wi-Fi</span><span className="row-tail">{wifi?'Connected':'Off'}</span><button className={`mini-toggle ${wifi?'on':''}`} onClick={()=>setWifi(!wifi)} aria-label="Toggle Wi-Fi">{wifi?'On':'Off'}</button></div><div className="setting-row"><div className="setting-symbol blue"><Bluetooth size={18}/></div><span>Bluetooth</span><span className="row-tail">{bt?'On':'Off'}</span><button className={`mini-toggle ${bt?'on':''}`} onClick={()=>setBt(!bt)} aria-label="Toggle Bluetooth">{bt?'On':'Off'}</button></div><button className="setting-row" onClick={()=>setDetail('Airplane Mode')}><div className="setting-symbol orange"><Plane size={18}/></div><span>Airplane Mode</span><ChevronRight size={17}/></button></div><div className="settings-group">{([['Sounds & Haptics',Volume2,'pink'],['Display & Brightness',Sun,'blue'],['Wallpaper',Images,'cyan'],['Notifications',Bell,'red'],['Privacy & Security',LockKeyhole,'blue']] as const).map(([label,Icon,color])=><button className="setting-row" key={label} onClick={()=>setDetail(label)}><div className={`setting-symbol ${color}`}><Icon size={18}/></div><span>{label}</span><ChevronRight size={17}/></button>)}</div><div className="settings-group"><button className="setting-row" onClick={()=>setDetail('About This iPhone')}><div className="setting-symbol gray"><Info size={18}/></div><span>General</span><ChevronRight size={17}/></button></div></div>
}
function MusicApp(){
  const songs=[{name:'Something in the Air',artist:'Ayira’s Library'},{name:'Quiet Hours',artist:'Ayira’s Library'},{name:'After Midnight',artist:'Ayira’s Library'},{name:'A Familiar Feeling',artist:'Ayira’s Library'}]
  const [selected,setSelected]=useState(0),[playing,setPlaying]=useState(false),[tab,setTab]=useState<'home'|'library'>('home')
  return <div className="app-page music-app">
    <div className="music-content scroll-area"><h1>Music</h1>
      <div className="music-tabs"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}>Listen Now</button><button className={tab==='library'?'active':''} onClick={()=>setTab('library')}>Library</button></div>
      <h2>{tab==='home'?'Recently Played':'Songs'}</h2>
      <div className="playlist-card"><div className="album-art"><Music2 size={52}/></div><strong>Late Night Drive</strong><span>Ayira Ross</span></div>
      <h3>Up Next</h3>{songs.map((song,i)=><button key={song.name} className="track-row" onClick={()=>{setSelected(i);setPlaying(false)}}><span className="track-art">♫</span><span>{song.name}<small>{song.artist}</small></span>{selected===i?<Check size={18}/>:<MoreHorizontal size={18}/>}</button>)}
    </div>
    <div className="mini-player"><div className="player-album">♫</div><span>{songs[selected].name}<small>{songs[selected].artist}</small></span><button onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Pause':'Play'}>{playing?<Pause size={21}/>:<Play size={21}/>}</button><button onClick={()=>setSelected(i=>(i+1)%songs.length)} aria-label="Next song"><ChevronRight size={23}/></button></div>
  </div>
}

function WeatherApp(){
  const hourly=[['Now','31°'],['10 AM','32°'],['11 AM','33°'],['12 PM','33°'],['1 PM','32°'],['2 PM','31°']]
  const days=[['Sat','☀','33°','26°'],['Sun','☀','32°','26°'],['Mon','⛅','31°','25°'],['Tue','☀','32°','25°'],['Wed','☀','33°','26°']]
  return <div className="app-page weather-app ios6-weather scroll-area">
    <div className="ios6-weather-hero"><span>Subic, Olongapo</span><strong>31°</strong><p>Sunny</p><small>H:33°  L:26°</small></div>
    <section className="ios6-weather-card"><h3>Sunny throughout the day.</h3><div className="ios6-hourly">{hourly.map(([label,temp])=><div key={label}><span>{label}</span><Sun size={23} fill="#ffd45c" color="#ffd45c"/><strong>{temp}</strong></div>)}</div></section>
    <section className="ios6-weather-card"><h3>5-Day Forecast</h3>{days.map(([label,icon,high,low])=><div className="ios6-forecast-row" key={label}><strong>{label}</strong><span>{icon}</span><small>{low}</small><i/><b>{high}</b></div>)}</section>
    <section className="ios6-weather-squares"><div><small>UV INDEX</small><strong>8</strong><span>Very High</span></div><div><small>FEELS LIKE</small><strong>34°</strong><span>Humid</span></div></section>
  </div>
}

function FilesApp(){const [folder,setFolder]=useState<string|null>(null);return <div className="app-page files-app"><div className="simple-nav"><button onClick={()=>setFolder(null)}>{folder?<><ChevronLeft size={23}/>Browse</>:'Browse'}</button><MoreHorizontal size={22}/></div><h1>{folder||'Browse'}</h1><div className="search-input"><Search size={17}/><input placeholder="Search files"/></div>{folder?<Placeholder icon={Folder} title="This folder is empty" description="No Items"/>:<><h3>Locations</h3>{['On My iPhone','iCloud Drive','Recently Deleted'].map(f=><button key={f} className="files-row" onClick={()=>setFolder(f)}><Folder size={28} fill="#2f89ec" color="#2f89ec"/>{f}<ChevronRight size={19}/></button>)}</>}</div>}
function MapsApp(){return <div className="app-page maps-app"><div className="map-canvas"><div className="fake-street s1"/><div className="fake-street s2"/><div className="fake-street s3"/><div className="fake-street s4"/><div className="map-park"/><span className="map-label l1">A quiet corner</span><span className="map-label l2">Subic, Olongapo</span><div className="map-marker"><Navigation size={18} fill="#278af0"/></div></div><div className="maps-sheet"><div className="sheet-grabber"/><h2>Explore Maps</h2><div className="search-input"><Search size={18}/><input placeholder="Search Maps"/></div><p></p><div className="maps-shortcuts"><button><Star size={21}/>Favorites</button><button><MapPinned size={21}/>Places</button></div></div></div>}
function MailApp(){const [opened,setOpened]=useState<number|null>(null);const mail=[{from:'Calendar',subject:'Your week at a glance',preview:'You have a few plans coming up.'},{from:'Photos',subject:'Memories are better together',preview:'A collection of moments you saved.'},{from:'Notes',subject:'A little reminder',preview:'Don’t forget the things that matter.'}];return <div className="app-page mail-app"><div className="simple-nav"><span>Mailboxes</span><SquarePen size={24}/></div>{opened===null?<><h1>Inbox</h1><div className="search-input"><Search size={18}/><input placeholder="Search"/></div>{mail.map((m,i)=><button className="mail-row" key={i} onClick={()=>setOpened(i)}><strong>{m.from}</strong><span>{m.subject}</span><small>{m.preview}</small></button>)}</>:<div className="opened-mail"><button onClick={()=>setOpened(null)}><ChevronLeft size={23}/>Inbox</button><h2>{mail[opened].subject}</h2><div className="mail-sender">From: {mail[opened].from}</div><p>{mail[opened].preview}</p><p></p></div>}</div>}

function ControlCenter({onClose,sound,setSound,brightness,setBrightness,lock}: {onClose:()=>void;sound:boolean;setSound:(v:boolean)=>void;brightness:number;setBrightness:(v:number)=>void;lock:()=>void}){
  const [wifi,setWifi]=useState(true),[bt,setBt]=useState(true),[airplane,setAirplane]=useState(false),[focus,setFocus]=useState(false),[flash,setFlash]=useState(false)
  return <div className="control-center-backdrop" onClick={onClose}><div className="control-center" onClick={e=>e.stopPropagation()}><div className="control-header"><span>{clockTime()}</span><button onClick={onClose}><X size={22}/></button></div><div className="cc-grid"><div className="cc-connectivity"><div className="cc-connect-main"><button className={airplane?'enabled':''} onClick={()=>setAirplane(!airplane)}><Plane size={20}/></button><span>Airplane Mode</span></div><div className="cc-connect-main"><button className={wifi?'enabled':''} onClick={()=>setWifi(!wifi)}><Wifi size={20}/></button><span>Wi-Fi</span></div><div className="cc-connect-main"><button className={bt?'enabled':''} onClick={()=>setBt(!bt)}><Bluetooth size={20}/></button><span>Bluetooth</span></div><div className="cc-connect-main"><button className="enabled"><Signal size={20}/></button><span>Cellular</span></div></div><div className="cc-media"><Music2 size={26}/><span>Not Playing</span><div><button><Play size={21}/></button><button><ChevronRight size={21}/></button></div></div><button className="cc-tile" onClick={()=>setFocus(!focus)}><Moon size={25}/><span>{focus?'Focus On':'Focus'}</span></button><button className="cc-tile" onClick={()=>setSound(!sound)}>{sound?<Volume2 size={25}/>:<VolumeX size={25}/>}<span>{sound?'Sounds On':'Silent'}</span></button><div className="cc-slider"><Sun size={22}/><input aria-label="Brightness" type="range" min="40" max="100" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/></div><div className="cc-tile" onClick={()=>setFlash(!flash)} role="button" tabIndex={0}><Flashlight size={26} color={flash?'#ffd451':'white'}/><span>Flashlight</span></div><button className="cc-tile" onClick={lock}><LockKeyhole size={25}/><span>Lock Screen</span></button></div><div className="control-bottom">Swipe up or tap × to close</div></div></div>
}
function Notifications({close,openMessages}:{close:()=>void;openMessages:()=>void}){return <div className="notification-layer" onClick={close}><div className="notification-panel" onClick={e=>e.stopPropagation()}><button onClick={close}><X size={20}/></button><span>{dateLabel()}</span><h2>Notification Center</h2><button className="notification-item" onClick={()=>{close();openMessages()}}><span className="notif-icon"><MessageCircle size={20}/></span><div><strong>Messages</strong><p>Baby: Text me when you’re free, okay? 🤍</p></div><small>now</small></button><p className="notif-helper">Story notifications will appear here.</p></div></div>}
function Spotlight({close,open}:{close:()=>void;open:(a:AppId)=>void}){const [q,setQ]=useState('');return <div className="spotlight-layer"><div className="spotlight-search"><Search size={20}/><input placeholder="Search" autoFocus value={q} onChange={e=>setQ(e.target.value)}/><button onClick={close}>Cancel</button></div><div className="spotlight-results">{appList.filter(a=>a.title.toLowerCase().includes(q.toLowerCase())).slice(0,8).map(a=><button key={a.id} onClick={()=>{close();open(a.id)}}><AppIcon app={a}/><span>{a.title}</span></button>)}</div><div className="spotlight-hint">Search Ayira’s apps</div></div>}
function AppIcon({app}:{app:typeof appList[number]}){return <div className={`app-icon app-icon-${app.id}`}><IosIcon id={app.id}/></div>}
function Home({open,wall,doSpotlight}:{open:(id:AppId)=>void;wall:number;doSpotlight:()=>void}){
  const [page,setPage] = useState(0)
  const touchStart = useRef<number | null>(null)
  const dock=['phone','safari','messages','music'] as AppId[]
  const firstIds:AppId[]=['calendar','photos','camera','mail','clock','maps','weather','notes'];const pages=[appList.filter(a=>firstIds.includes(a.id)),appList.filter(a=>!firstIds.includes(a.id)&&!dock.includes(a.id))]
  const onPageMove=(x:number)=>{
    if(touchStart.current===null) return
    const dx=x-touchStart.current
    if(Math.abs(dx)>65) setPage(dx<0?1:0)
    touchStart.current=null
  }
  return <div className={`home-screen wallpaper-${wall}`}>
    <StoryMedia name="homescreen" className="story-wallpaper-image" alt=""/>
    <div className="home-scroll" onTouchStart={e=>touchStart.current=e.touches[0].clientX} onTouchEnd={e=>onPageMove(e.changedTouches[0].clientX)}>
      {page===0&&<div className="home-widgets">
        <button className="weather-widget" onClick={()=>open('weather')} aria-label="Open Weather"><CloudSun size={25} fill="#fff2b9"/><span>Subic, Olongapo</span><b>31°</b><small>Sunny</small></button>
        <button className="calendar-widget" onClick={()=>open('calendar')} aria-label="Open Calendar"><small>{'SATURDAY'}</small><b>30</b><span>Her birthday</span></button>
      </div>}
      <div className={`home-grid home-grid-page-${page}`} key={page}>{pages[page].map(a=><button className="home-app" key={a.id} onClick={()=>open(a.id)}><AppIcon app={a}/><span>{a.title}</span></button>)}</div>
    </div>
    <div className="home-pagination" aria-label="Home screen pages"><button className={page===0?'is-current':''} aria-label="First home page" onClick={()=>setPage(0)}/><button className={page===1?'is-current':''} aria-label="Second home page" onClick={()=>setPage(1)}/><button className="home-search-trigger" onClick={doSpotlight} aria-label="Search apps"><Search size={13}/></button></div>
    <div className="dock">{dock.map(id=><button key={id} onClick={()=>open(id)} aria-label={appInfo[id].title}><AppIcon app={appInfo[id]}/></button>)}</div>
  </div>
}
export default function App(){
  const [screen,setScreen]=useState<Screen>('lock'),[requestPasscode,setRequestPasscode]=useState(false),[appOrigin,setAppOrigin]=useState({x:50,y:50}),[wall,setWall]=useLocal<number>('wallpaper',0),[sound,setSound]=useLocal<boolean>('sounds',true),[brightness,setBrightness]=useLocal<number>('brightness',100)
  const [chats,setChats]=useLocal<Record<string,ChatMessage[]>>('chats',seedChats),[notes,setNotes]=useLocal<Note[]>('notes',defaultNotes),[events,setEvents]=useLocal<CalEvent[]>('calendar',[]),[reminders,setReminders]=useLocal<Reminder[]>('reminders',defaultReminders),[photos,setPhotos]=useLocal<SavedPhoto[]>('photos',[])
  const [control,setControl]=useState(false),[notifications,setNotifications]=useState(false),[spotlight,setSpotlight]=useState(false),[contactMessage,setContactMessage]=useState<string|null>(null)
  const [statusTime,setStatusTime]=useState(clockTime());useEffect(()=>{const id=window.setInterval(()=>setStatusTime(clockTime()),10000);return()=>clearInterval(id)},[])
  const gestures=useRef<{x:number;y:number;time:number}|null>(null)
  const play=useCallback((type:'tap'|'send'|'receive'|'lock')=>{if(sound)tone(type)},[sound])
  const open=useCallback((id:AppId)=>{
    play('tap');setContactMessage(null)
    const glass=document.querySelector('.iphone-glass')?.getBoundingClientRect()
    const button=(document.activeElement as HTMLElement | null)?.closest('.home-app, .dock button, .spotlight-results button')?.getBoundingClientRect()
    if(glass&&button)setAppOrigin({x:(button.left+button.width/2-glass.left)/glass.width*100,y:(button.top+button.height/2-glass.top)/glass.height*100})
    else setAppOrigin({x:50,y:72})
    setScreen(id);setSpotlight(false)
  },[play])
  const home=useCallback(()=>{play('tap');setScreen(current=>current==='lock'?'lock':'home');setControl(false);setNotifications(false);setSpotlight(false)},[play])
  const unlock=()=>{play('lock');setRequestPasscode(false);setScreen('home')}
  const lock=()=>{play('lock');setRequestPasscode(false);setScreen('lock');setControl(false)}
  const onPointerDown=(e:ReactPointerEvent<HTMLDivElement>)=>{gestures.current={x:e.clientX,y:e.clientY,time:Date.now()}}
  const onPointerUp=(e:ReactPointerEvent<HTMLDivElement>)=>{const s=gestures.current;gestures.current=null;if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dy)<72||Math.abs(dy)<Math.abs(dx)*1.15)return;const rect=e.currentTarget.getBoundingClientRect(),startY=s.y-rect.y,startX=s.x-rect.x;if(dy<0&&startY>rect.height-110){if(screen==='lock')setRequestPasscode(true);else home()}else if(dy>0&&startY<90&&startX>rect.width*.52){setControl(true)}else if(dy>0&&startY<90){setNotifications(true)}else if(dy>0&&screen==='home'&&startY<rect.height*.65){setSpotlight(true)}}
  useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(control)setControl(false);else if(notifications)setNotifications(false);else if(spotlight)setSpotlight(false);else if(screen!=='lock')home()}if(e.key==='Home' && screen!=='lock')home()};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[control,notifications,spotlight,home,screen])
  useEffect(()=>{const fn=()=>home();window.addEventListener('ayira:home',fn);return()=>window.removeEventListener('ayira:home',fn)},[home])
  const goMessage=(id:string)=>{play('tap');setContactMessage(id);setScreen('messages')}
  const savePhoto=(src:string)=>{setPhotos(old=>[{id:uid(),src,date:new Date().toLocaleString('en-US')},...old].slice(0,18));play('receive')}
  const content=():ReactNode=>{
    if(screen==='lock')return <LockScreen unlock={unlock} wall={wall} sound={sound} play={()=>play('tap')} requested={requestPasscode}/>
    if(screen==='home')return <Home open={open} wall={wall} doSpotlight={()=>setSpotlight(true)}/>
    switch(screen){
      case 'messages':return <Messages key={contactMessage||'messages'} initialSelected={contactMessage} chats={chats} setChats={setChats} play={play} onContact={()=>open('contacts')}/>
      case 'photos':return <Photos photos={photos} setPhotos={setPhotos} openCamera={()=>open('camera')}/>
      case 'camera':return <CameraApp savePhoto={savePhoto}/>
      case 'notes':return <Notes notes={notes} setNotes={setNotes}/>
      case 'calendar':return <CalendarApp events={events} setEvents={setEvents}/>
      case 'contacts':return <ContactsApp openMessage={goMessage}/>
      case 'phone':return <PhoneApp openMessage={goMessage}/>
      case 'reminders':return <RemindersApp items={reminders} setItems={setReminders}/>
      case 'calculator':return <CalculatorApp/>
      case 'clock':return <ClockApp/>
      case 'safari':return <SafariApp/>
      case 'settings':return <SettingsApp sound={sound} setSound={setSound} wall={wall} setWall={setWall} brightness={brightness} setBrightness={setBrightness}/>
      case 'music':return <MusicApp/>
      case 'weather':return <WeatherApp/>
      case 'files':return <FilesApp/>
      case 'maps':return <MapsApp/>
      case 'mail':return <MailApp/>
    }
  }
  return <div className="site-wrap">
    <main className="phone-stage" aria-label="Ayira Ross's interactive iPhone">
      <div className="iphone-frame">
        <div className="iphone-glass" onPointerDown={onPointerDown} onPointerUp={onPointerUp} style={{filter:`brightness(${brightness}%)`}}>
          <div className="statusbar">
            <button onClick={()=>screen==='lock'?setRequestPasscode(true):setNotifications(true)} className={`status-time ${screen==='lock'||screen==='home'?'light':''}`}>{statusTime}</button>
            <button className="dynamic-island" onClick={()=>screen!=='lock'&&setNotifications(true)} aria-label="Dynamic Island"><span/></button>
            <button className={`status-icons ${screen==='lock'||screen==='home'?'light':''}`} onClick={()=>setControl(true)} aria-label="Open Control Center"><Signal size={17} fill="currentColor"/><Wifi size={16} strokeWidth={3}/><BatteryFull size={23} strokeWidth={2.5}/></button>
          </div>
          <AppFailureBoundary>
            <div key={screen} className={`screen-body ${screen==='home'||screen==='lock'?'no-app-bg':'app-animate'}`} style={{transformOrigin:`${appOrigin.x}% ${appOrigin.y}%`}}><ScreenRenderer render={content}/></div>
          </AppFailureBoundary>
          {screen!=='lock'&&<button className={`home-indicator ${screen==='home'||screen==='camera'?'indicator-light':''}`} onClick={home} aria-label="Go Home" title="Go Home"/>}
          {control&&<ControlCenter onClose={()=>setControl(false)} sound={sound} setSound={setSound} brightness={brightness} setBrightness={setBrightness} lock={lock}/>}
          {notifications&&<Notifications close={()=>setNotifications(false)} openMessages={()=>open('messages')}/>}
          {spotlight&&<Spotlight close={()=>setSpotlight(false)} open={open}/>}
        </div>
        <div className="side-button side-volume-one"/><div className="side-button side-volume-two"/>
        <button className="side-button side-power" onClick={lock} aria-label="Lock iPhone" title="Lock iPhone"/>
      </div>
    </main>
  </div>
}
