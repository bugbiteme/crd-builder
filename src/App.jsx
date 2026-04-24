import { useState, useEffect } from 'react'
import CrdSelector from './components/CrdSelector'
import DynamicForm from './components/DynamicForm'
import YamlPreview from './components/YamlPreview'
import { generateYaml, isFormValid, getManifestFilename } from './utils/formUtils'

export default function App() {
  const [crds, setCrds] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [schema, setSchema] = useState(null)
  const [formValues, setFormValues] = useState({ metadata: {} })
  const [loadingCrds, setLoadingCrds] = useState(true)
  const [loadingSchema, setLoadingSchema] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetch('/api/crds')
      .then(r => r.json())
      .then(data => {
        setCrds(data)
        setLoadingCrds(false)
      })
      .catch(() => setLoadingCrds(false))
  }, [])

  const handleCrdSelect = async (filename) => {
    setSelectedFile(filename)
    setSchema(null)
    setFormValues({ metadata: {} })
    setLoadingSchema(true)
    try {
      const res = await fetch(`/api/crds/${encodeURIComponent(filename)}`)
      const data = await res.json()
      setSchema(data)
    } finally {
      setLoadingSchema(false)
    }
  }

  const yamlOutput = schema ? generateYaml(schema, formValues) : ''
  const valid = schema ? isFormValid(schema, formValues) : false
  const filename = schema ? getManifestFilename(schema, formValues) : ''

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3500)
  }

  const handleCreate = async () => {
    if (!valid || !schema) return
    try {
      const res = await fetch('/api/manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: yamlOutput }),
      })
      if (res.ok) {
        const data = await res.json()
        showToast('success', `Created ${data.path}`)
      } else {
        const err = await res.json()
        showToast('error', err.error || 'Failed to create manifest')
      }
    } catch (err) {
      showToast('error', err.message)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-logo">⎈</span>
          <h1 className="header-title">CRD Builder</h1>
          {schema && (
            <span className="header-badge">{schema.apiVersion} · {schema.scope}</span>
          )}
        </div>
      </header>

      <div className="app-main">
        <div className="sidebar">
          <div className="sidebar-top">
            {loadingCrds ? (
              <p className="hint">Loading CRDs…</p>
            ) : (
              <CrdSelector crds={crds} selected={selectedFile} onSelect={handleCrdSelect} loading={loadingSchema} />
            )}
          </div>

          {loadingSchema && <p className="hint loading-hint">Loading schema…</p>}

          {schema && !loadingSchema && (
            <DynamicForm
              schema={schema}
              values={formValues}
              onChange={setFormValues}
            />
          )}

          {!schema && !loadingSchema && selectedFile && (
            <p className="hint">Failed to load schema.</p>
          )}

          {!selectedFile && !loadingCrds && crds.length === 0 && (
            <p className="hint">No CRD YAML files found in the <code>crds/</code> directory.</p>
          )}
        </div>

        <div className="preview-area">
          <YamlPreview
            yaml={yamlOutput}
            onCreate={handleCreate}
            isValid={valid}
            filename={filename}
          />
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.text}</div>
      )}
    </div>
  )
}
