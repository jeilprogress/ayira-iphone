export type AppId = 'messages' | 'phone' | 'photos' | 'camera' | 'notes' | 'calendar' | 'settings' | 'clock' | 'calculator' | 'safari' | 'contacts' | 'reminders' | 'music' | 'weather' | 'files' | 'maps' | 'mail'
export type Screen = 'lock' | 'home' | AppId
export type ChatMessage = { id: string; from: 'me' | 'them'; text: string; time: string }
export type Contact = { id: string; name: string; fullName: string; initials: string; color: string; number: string; subtitle?: string }
export type Note = { id: string; title: string; body: string; updated: number }
export type CalEvent = { id: string; date: string; title: string; time: string; color: string }
export type Reminder = { id: string; label: string; done: boolean }
export type SavedPhoto = { id: string; src: string; date: string }

export const contacts: Contact[] = [
  { id: 'baby', name: 'Baby', fullName: 'Mathine Vale', initials: 'M', color: '#dabbb3', number: '+63 900 000 0001', subtitle: 'Mathine Vale' },
  { id: 'solar', name: 'Solar', fullName: 'Solar', initials: 'S', color: '#f0bd77', number: '+63 900 000 0002' },
  { id: 'moon', name: 'Moon', fullName: 'Moon', initials: 'M', color: '#93a8cd', number: '+63 900 000 0003' },
  { id: 'justice', name: 'Justice', fullName: 'Justitia', initials: 'J', color: '#b3a5d6', number: '+63 900 000 0004' },
  { id: 'sai', name: 'Sai', fullName: 'Sairo', initials: 'S', color: '#9fbeaf', number: '+63 900 000 0005' },
  { id: 'cali', name: 'Cali', fullName: 'Calson', initials: 'C', color: '#edb0b9', number: '+63 900 000 0006' },
  { id: 'gale', name: 'Gale', fullName: 'Gale', initials: 'G', color: '#adc8d3', number: '+63 900 000 0007' },
]
const m = (id: string, from: 'me' | 'them', text: string, time: string): ChatMessage => ({ id, from, text, time })
// All sample fictional messages are editable placeholders for the author's canonical story.
export const seedChats: Record<string, ChatMessage[]> = {
  baby: [
    m('b1','them','Have you eaten yet?','9:36 AM'),
    m('b2','me','You ask me that every day.','9:37 AM'),
    m('b3','them','And you still forget every day.','9:37 AM'),
    m('b4','me','I’m eating, baby. Promise.','9:38 AM'),
    m('b5','them','Good. I miss you, by the way.','9:38 AM'),
    m('b6','me','You literally saw me yesterday.','9:39 AM'),
    m('b7','them','That was yesterday.','9:39 AM'),
    m('b8','them','Text me when you’re free, okay? 🤍','9:40 AM')
  ],
  solar: [m('s1','them','Ayi, are you awake?','Yesterday'),m('s2','me','I am now 😭','Yesterday'),m('s3','them','Check the group chat when you can.','Yesterday')],
  moon: [m('mo1','them','You owe me a story.','Tuesday'),m('mo2','me','No I do not 😭','Tuesday'),m('mo3','them','That sounds like a yes.','Tuesday')],
  justice: [m('j1','me','Where are we meeting?','Monday'),m('j2','them','Same place as last time.','Monday'),m('j3','them','Don’t be late!','Monday')],
  sai: [m('sa1','them','Sending you the details later!','Sunday'),m('sa2','me','Thank youuu','Sunday')],
  cali: [m('c1','them','I have something to tell you 👀','Saturday'),m('c2','me','CALI.','Saturday')],
  gale: [m('g1','me','Did you take any pictures?','Friday'),m('g2','them','Yes! I’ll send them later.','Friday')],
}
export const defaultNotes: Note[] = [
  { id: 'n1', title: 'Things to remember', body: 'Things to remember\n\n• Charge my phone\n• Reply to the group chat\n• Don’t forget the little things', updated: Date.now()-86400000 },
  { id: 'n2', title: 'Unsent words', body: 'Unsent words\n\nSome thoughts are easier to write than to say.\n\n[Replace this with Ayira’s story.]', updated: Date.now()-172800000 },
  { id: 'n3', title: 'Little reminders', body: 'Little reminders\n\nThere are still so many good days ahead.', updated: Date.now()-259200000 },
]
export const defaultReminders: Reminder[] = [
  { id: 'r1', label: 'Reply to Solar', done: false },
  { id: 'r2', label: 'Sort photos', done: false },
  { id: 'r3', label: 'Make time for myself', done: true },
]
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
export const clockTime = () => new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: false })
export const shortTime = () => new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' })
export const dateLabel = () => new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric' })
export const dateISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export const scriptedReply = (text: string, count: number) => {
  const q = text.toLowerCase()
  if (/miss|i love|love you|ily/.test(q)) return 'I love you more, baby. 🤍'
  if (/eat|food|hungry|dinner|lunch|breakfast/.test(q)) return 'Make sure you eat something, okay?'
  if (/where|location|are you/.test(q)) return 'I’m just here, baby. Why?'
  if (/sleep|tired|night|rest/.test(q)) return 'Rest first. I’ll be right here when you wake up. 🤍'
  if (/call|facetime/.test(q)) return 'Give me a minute, baby. I’ll call you.'
  if (/hi\b|hello|hey|baby|matt/.test(q)) return 'Hi, baby. What’s up?'
  if (/okay|ok|sure/.test(q)) return 'That’s my girl. 🤍'
  if (/sorry|apolog/.test(q)) return 'Hey, you don’t have to apologize. Talk to me.'
  if (/thank/.test(q)) return 'Anything for you, baby.'
  return ["Tell me about it, baby.", "I’m listening. 🤍", "You have my full attention.", "You know you can tell me anything, right?", "Come here. I miss you."][count % 5]
}
