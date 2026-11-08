/// <reference types="vite/client" />
import { useState } from 'react'

/** Story-owned images. Publish photos in public/media using these names.
 * Files are deliberately not hotlinked from third-party screenshot sharing pages.
 */
export type StoryMediaName = 'lockscreen' | 'homescreen' | 'baby'
const files: Record<StoryMediaName, string> = {
  lockscreen: 'media/lockscreen.jpg',
  homescreen: 'media/homescreen.jpg',
  baby: 'media/baby.jpg'
}
export default function StoryMedia({name, className='', alt=''}: {name:StoryMediaName, className?:string, alt?:string}) {
  const [failed,setFailed] = useState(false)
  if (failed) return null
  return <img className={className} src={`${import.meta.env.BASE_URL}${files[name]}`} alt={alt} draggable={false} onError={()=>setFailed(true)} />
}
