const express = require('express')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const app = express()
app.use(express.json({ limit: '10mb' }))

const CRDS_DIR = path.join(__dirname, '..', 'crds')
const MANIFESTS_DIR = path.join(__dirname, '..', 'manifests')

if (!fs.existsSync(MANIFESTS_DIR)) {
  fs.mkdirSync(MANIFESTS_DIR, { recursive: true })
}

const schemaCache = new Map()

function extractSchemaFromCrd(crd) {
  const spec = crd.spec
  const kind = spec.names.kind
  const group = spec.group
  const scope = spec.scope

  const versions = spec.versions || []
  const version = versions.find(v => v.storage) || versions[0]
  const versionName = version?.name || 'v1'
  const apiVersion = `${group}/${versionName}`

  const openAPIV3Schema = version?.schema?.openAPIV3Schema || {}
  const specSchema = openAPIV3Schema.properties?.spec || { type: 'object', properties: {} }

  return { kind, group, apiVersion, scope, versionName, specSchema }
}

app.get('/api/crds', (req, res) => {
  try {
    const files = fs.readdirSync(CRDS_DIR)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    res.json(files)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/crds/:filename', (req, res) => {
  const filename = req.params.filename
  if (schemaCache.has(filename)) {
    return res.json(schemaCache.get(filename))
  }
  try {
    const filepath = path.join(CRDS_DIR, filename)
    const content = fs.readFileSync(filepath, 'utf8')
    const crd = yaml.load(content)
    const schema = extractSchemaFromCrd(crd)
    schemaCache.set(filename, schema)
    res.json(schema)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/manifests', (req, res) => {
  const { filename, content } = req.body
  if (!filename || !content) {
    return res.status(400).json({ error: 'filename and content required' })
  }
  const safe = path.basename(filename)
  const filepath = path.join(MANIFESTS_DIR, safe)
  try {
    fs.writeFileSync(filepath, content, 'utf8')
    res.json({ path: `manifests/${safe}` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Serve built frontend in production
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
