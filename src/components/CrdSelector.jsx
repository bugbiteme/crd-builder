export default function CrdSelector({ crds, selected, onSelect, loading }) {
  function labelFor(filename) {
    return filename.replace(/\.crd\.(yaml|yml)$/, '').replace(/\.(yaml|yml)$/, '')
  }

  return (
    <div className="crd-selector">
      <label htmlFor="crd-select" className="field-label">
        Select CRD
      </label>
      <select
        id="crd-select"
        value={selected || ''}
        onChange={e => e.target.value && onSelect(e.target.value)}
        className="select-input"
        disabled={loading}
      >
        <option value="">-- Choose a CRD --</option>
        {crds.map(f => (
          <option key={f} value={f}>{labelFor(f)}</option>
        ))}
      </select>
    </div>
  )
}
