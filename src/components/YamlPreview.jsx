import { useState } from 'react'

export default function YamlPreview({ yaml, onCreate, isValid, filename }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="yaml-preview-panel">
      <div className="preview-header">
        <h3 className="section-title">YAML Preview</h3>
        <div className="preview-actions">
          <button className="btn-secondary" onClick={handleCopy} disabled={!yaml}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="yaml-code-block">
        {yaml ? (
          <pre className="yaml-pre">{yaml}</pre>
        ) : (
          <p className="hint">Select a CRD and fill the form to preview YAML.</p>
        )}
      </div>

      <div className="preview-footer">
        {filename && (
          <span className="filename-hint">→ manifests/{filename}</span>
        )}
        <button
          className="btn-primary"
          onClick={onCreate}
          disabled={!isValid}
          title={!isValid ? 'Fill all required fields first' : `Create manifests/${filename}`}
        >
          Create
        </button>
      </div>
    </div>
  )
}
