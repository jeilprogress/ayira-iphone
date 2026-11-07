import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const root = resolve('dist')
const port = Number(process.env.PORT || 4173)
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
}
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
    const candidate = resolve(root, '.' + pathname)
    if (candidate !== root && !candidate.startsWith(root + sep)) {
      response.writeHead(403); response.end('Forbidden'); return
    }
    let file = candidate
    try { if (!(await stat(candidate)).isFile()) file = resolve(root, 'index.html') }
    catch { file = resolve(root, 'index.html') }
    const bytes = await readFile(file)
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
    response.end(request.method === 'HEAD' ? undefined : bytes)
  } catch {
    response.writeHead(500); response.end('Internal server error')
  }
}).listen(port, '0.0.0.0', () => console.log(`Ayira's iPhone listening on ${port}`))
