import { useState } from 'react'
import { FieldRow } from './FieldRenderer'

function KeyValueEditor({ value = {}, onChange }) {
  const entries = Object.entries(value)
  return (
    <div className="kv-editor">
      {entries.map(([k, v], i) => (
        <div key={i} className="kv-row">
          <input
            className="text-input kv-key"
            value={k}
            placeholder="key"
            onChange={e => {
              const updated = {}
              for (const [ek, ev] of Object.entries(value)) {
                updated[ek === k ? e.target.value : ek] = ev
              }
              onChange(updated)
            }}
          />
          <span className="kv-sep">:</span>
          <input
            className="text-input kv-val"
            value={v}
            placeholder="value"
            onChange={e => onChange({ ...value, [k]: e.target.value })}
          />
          <button className="btn-remove" onClick={() => {
            const { [k]: _, ...rest } = value
            onChange(rest)
          }}>−</button>
        </div>
      ))}
      <button className="btn-add" onClick={() => onChange({ ...value, [`key${entries.length + 1}`]: '' })}>
        + Add entry
      </button>
    </div>
  )
}

function MetadataSection({ schema, values, onChange }) {
  const isNamespaced = schema.scope === 'Namespaced'
  const meta = values.metadata || {}
  const set = (key, val) => onChange({ ...values, metadata: { ...meta, [key]: val || undefined } })

  return (
    <div className="form-section">
      <h3 className="section-title">Metadata</h3>
      <div className="field-row">
        <label className="field-label">
          name<span className="required-star">*</span>
        </label>
        <div className="field-input">
          <input
            type="text"
            className="text-input"
            value={meta.name || ''}
            placeholder="resource-name"
            onChange={e => set('name', e.target.value)}
          />
        </div>
      </div>
      {isNamespaced && (
        <div className="field-row">
          <label className="field-label">namespace</label>
          <div className="field-input">
            <input
              type="text"
              className="text-input"
              value={meta.namespace || ''}
              placeholder="default"
              onChange={e => set('namespace', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function LabelsSection({ values, onChange }) {
  const meta = values.metadata || {}
  const setMeta = key => val =>
    onChange({ ...values, metadata: { ...meta, [key]: Object.keys(val).length ? val : undefined } })

  return (
    <>
      <div className="field-row" style={{ marginTop: '0.75rem' }}>
        <label className="field-label">labels</label>
        <div className="field-input">
          <KeyValueEditor value={meta.labels || {}} onChange={setMeta('labels')} />
        </div>
      </div>
      <div className="field-row">
        <label className="field-label">annotations</label>
        <div className="field-input">
          <KeyValueEditor value={meta.annotations || {}} onChange={setMeta('annotations')} />
        </div>
      </div>
    </>
  )
}

export default function DynamicForm({ schema, values, onChange }) {
  const [showOptional, setShowOptional] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  const specSchema = schema.specSchema || { properties: {}, required: [] }
  const properties = specSchema.properties || {}
  const requiredFields = specSchema.required || []

  const specValues = values.spec || {}
  const setSpec = (key, val) => {
    if (val === undefined) {
      const { [key]: _, ...rest } = specValues
      onChange({ ...values, spec: rest })
    } else {
      onChange({ ...values, spec: { ...specValues, [key]: val } })
    }
  }

  const requiredProps = Object.entries(properties).filter(([n]) => requiredFields.includes(n))
  const optionalProps = Object.entries(properties).filter(([n]) => !requiredFields.includes(n))

  return (
    <div className="dynamic-form">
      <MetadataSection schema={schema} values={values} onChange={onChange} />

      <div className="form-section">
        <div className="section-header">
          <h3 className="section-title">Spec</h3>
          <label className="toggle-label-inline">
            <input
              type="checkbox"
              checked={showOptional}
              onChange={e => setShowOptional(e.target.checked)}
            />
            Show optional fields
          </label>
        </div>

        {requiredProps.length === 0 && !showOptional && (
          <p className="hint">No required spec fields. Enable "Show optional fields" to see all.</p>
        )}

        {requiredProps.map(([name, propSchema]) => (
          <FieldRow
            key={name}
            name={name}
            schema={propSchema}
            value={specValues[name]}
            onChange={v => setSpec(name, v)}
            isRequired={true}
            depth={1}
            showOptional={showOptional}
          />
        ))}

        {showOptional && optionalProps.map(([name, propSchema]) => (
          <FieldRow
            key={name}
            name={name}
            schema={propSchema}
            value={specValues[name]}
            onChange={v => setSpec(name, v)}
            isRequired={false}
            depth={1}
            showOptional={showOptional}
          />
        ))}
      </div>

      <div className="form-section collapsible-section">
        <button className="link-btn" onClick={() => setShowLabels(v => !v)}>
          {showLabels ? '▼' : '▶'} Labels &amp; Annotations
          <span className="optional-badge">optional</span>
        </button>
        {showLabels && <LabelsSection values={values} onChange={onChange} />}
      </div>
    </div>
  )
}
