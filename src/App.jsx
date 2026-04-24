import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [sidebarWidth, setSidebarWidth] = useState(1040)
  const isResizing = useRef(false)

  const onDividerMouseDown = useCallback(e => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = e => {
      if (!isResizing.current) return
      setSidebarWidth(Math.max(260, Math.min(e.clientX, window.innerWidth - 200)))
    }
    const onMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

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
        <a
          className="header-github"
          href="https://github.com/bugbiteme/crd-builder"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
        >
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
              -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
              .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
              -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27
              c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
              .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
              0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
      </header>

      <div className="app-main">
        <div className="sidebar" style={{ width: sidebarWidth }}>
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

        <div className="resize-divider" onMouseDown={onDividerMouseDown} />

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
