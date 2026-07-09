import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// Dev-only endpoint for the ?capture=1 harness in LocationSlide: receives the
// canvas PNG + camera JSON for each Vision pose and writes them to captures/.
// Never part of the production build.
const capturePlugin = {
  name: 'ldg-capture-endpoint',
  configureServer(server) {
    server.middlewares.use('/__capture', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        return res.end()
      }
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => {
        try {
          const { name, dataUrl, meta } = JSON.parse(body)
          const safe = String(name).replace(/[^a-z0-9_-]/gi, '')
          const dir = path.resolve(server.config.root, 'captures')
          fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, `${safe}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'))
          if (meta) fs.writeFileSync(path.join(dir, `${safe}.json`), JSON.stringify(meta, null, 2))
          res.end('ok')
        } catch (e) {
          res.statusCode = 400
          res.end(String(e))
        }
      })
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  // rebuildCesium bundles Cesium from source so our dynamic import('cesium')
  // becomes a lazy async chunk (loaded only when the Location slide opens),
  // instead of injecting a render-blocking 5.9MB global script on every visit.
  plugins: [react(), cesium({ rebuildCesium: true }), capturePlugin],
})
