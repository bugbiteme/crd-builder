import { useState, useCallback } from 'react'

function Tooltip({ text }) {
  const [pos, setPos] = useState(null)

  const onEnter = useCallback(e => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }, [])

  return (
    <span
      className="field-desc"
      onMouseEnter={onEnter}
      onMouseLeave={() => setPos(null)}
    >
      ⓘ
      {pos && (
        <span
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y - 8,
            transform: 'translate(-50%, -100%)',
            background: '#111827',
            color: '#f9fafb',
            padding: '5px 9px',
            borderRadius: '5px',
            fontSize: '0.6875rem',
            lineHeight: '1.45',
            maxWidth: '260px',
            whiteSpace: 'normal',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

function PrimitiveField({ schema, value, onChange, placeholder }) {
  if (schema.enum) {
    return (
      <select className="select-input" value={value ?? ''} onChange={e => onChange(e.target.value || undefined)}>
        <option value="">-- select --</option>
        {schema.enum.map(opt => (
          <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
        ))}
      </select>
    )
  }

  if (schema.type === 'boolean') {
    return (
      <select className="select-input" value={value === undefined ? '' : String(value)} onChange={e => {
        if (e.target.value === '') onChange(undefined)
        else onChange(e.target.value === 'true')
      }}>
        <option value="">-- select --</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    )
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      <input
        type="number"
        className="text-input"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    )
  }

  return (
    <input
      type="text"
      className="text-input"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value || undefined)}
    />
  )
}

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
      <button className="btn-add" onClick={() => {
        const key = `key${entries.length + 1}`
        onChange({ ...value, [key]: '' })
      }}>+ Add entry</button>
    </div>
  )
}

function ArrayField({ schema, value = [], onChange, depth, showOptional }) {
  const itemSchema = schema.items || { type: 'string' }
  const isObjectItems = itemSchema.type === 'object' || itemSchema.properties

  const addItem = () => onChange([...value, isObjectItems ? {} : ''])
  const removeItem = i => onChange(value.filter((_, idx) => idx !== i))
  const updateItem = (i, v) => {
    const updated = [...value]
    updated[i] = v
    onChange(updated)
  }

  return (
    <div className="array-field">
      {value.map((item, i) => (
        <div key={i} className="array-item">
          <div className="array-item-content">
            <FieldRenderer
              schema={itemSchema}
              value={item}
              onChange={v => updateItem(i, v)}
              depth={depth}
              showOptional={showOptional}
            />
          </div>
          <button className="btn-remove" onClick={() => removeItem(i)}>−</button>
        </div>
      ))}
      <button className="btn-add" onClick={addItem}>+ Add item</button>
    </div>
  )
}

function ObjectField({ fieldName, schema, value = {}, onChange, depth, showOptional, isRequired, startExpanded }) {
  const [expanded, setExpanded] = useState(startExpanded ?? (isRequired || depth <= 1))
  const properties = schema.properties || {}
  const requiredFields = schema.required || []

  const visibleProps = Object.entries(properties).filter(([name]) => {
    if (showOptional) return true
    return requiredFields.includes(name)
  })

  if (visibleProps.length === 0 && !showOptional) return null

  return (
    <div className={`object-field depth-${depth}`}>
      {fieldName && (
        <button className="object-toggle" onClick={() => setExpanded(e => !e)}>
          <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
          <span className="toggle-label">{fieldName}</span>
          {isRequired && <span className="required-star">*</span>}
        </button>
      )}
      {expanded && (
        <div className={fieldName ? 'object-body' : ''}>
          {visibleProps.map(([name, propSchema]) => {
            const req = requiredFields.includes(name)
            return (
              <FieldRow
                key={name}
                name={name}
                schema={propSchema}
                value={value[name]}
                onChange={v => {
                  if (v === undefined) {
                    const { [name]: _, ...rest } = value
                    onChange(rest)
                  } else {
                    onChange({ ...value, [name]: v })
                  }
                }}
                isRequired={req}
                depth={depth + 1}
                showOptional={showOptional}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function FieldRow({ name, schema, value, onChange, isRequired, depth, showOptional }) {
  const isObject = (schema.type === 'object' || schema.properties) && !schema.additionalProperties
  const isArray = schema.type === 'array'

  if (isObject && schema.properties) {
    return (
      <ObjectField
        fieldName={name}
        schema={schema}
        value={value || {}}
        onChange={onChange}
        depth={depth}
        showOptional={showOptional}
        isRequired={isRequired}
      />
    )
  }

  return (
    <div className="field-row">
      <label className="field-label">
        {name}
        {isRequired && <span className="required-star">*</span>}
        {schema.description && <Tooltip text={schema.description} />}
      </label>
      <div className="field-input">
        <FieldRenderer
          schema={schema}
          value={value}
          onChange={onChange}
          depth={depth}
          showOptional={showOptional}
          isArray={isArray}
        />
      </div>
    </div>
  )
}

export default function FieldRenderer({ schema, value, onChange, depth = 0, showOptional, isArray }) {
  if (!schema) return null

  const isObj = schema.type === 'object' || schema.properties
  const isArr = schema.type === 'array' || isArray

  if (isArr) {
    return (
      <ArrayField
        schema={schema}
        value={value}
        onChange={onChange}
        depth={depth}
        showOptional={showOptional}
      />
    )
  }

  if (isObj && schema.additionalProperties) {
    return <KeyValueEditor value={value || {}} onChange={onChange} />
  }

  if (isObj && schema.properties) {
    return (
      <ObjectField
        schema={schema}
        value={value || {}}
        onChange={onChange}
        depth={depth}
        showOptional={showOptional}
        startExpanded={true}
      />
    )
  }

  if (schema['x-kubernetes-preserve-unknown-fields'] || (!schema.type && !schema.properties)) {
    return (
      <textarea
        className="text-input raw-yaml"
        rows={3}
        placeholder="(raw YAML)"
        value={value ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : ''}
        onChange={e => {
          try {
            onChange(e.target.value ? JSON.parse(e.target.value) : undefined)
          } catch {
            onChange(e.target.value || undefined)
          }
        }}
      />
    )
  }

  return <PrimitiveField schema={schema} value={value} onChange={onChange} />
}

export { FieldRow, ObjectField }
