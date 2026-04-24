import yaml from 'js-yaml'

export function cleanValues(val) {
  if (val === null || val === undefined || val === '') return undefined
  if (typeof val !== 'object') return val
  if (Array.isArray(val)) {
    const cleaned = val.map(cleanValues).filter(v => v !== undefined && v !== '')
    return cleaned.length > 0 ? cleaned : undefined
  }
  const result = {}
  for (const [k, v] of Object.entries(val)) {
    const c = cleanValues(v)
    if (c !== undefined) result[k] = c
  }
  return Object.keys(result).length > 0 ? result : undefined
}

export function generateYaml(schema, formValues) {
  const cleanedMeta = cleanValues(formValues.metadata) || {}
  const cleanedSpec = cleanValues(formValues.spec)

  const manifest = {
    apiVersion: schema.apiVersion,
    kind: schema.kind,
    metadata: cleanedMeta,
    ...(cleanedSpec !== undefined ? { spec: cleanedSpec } : {}),
  }

  return yaml.dump(manifest, { noRefs: true, lineWidth: 120, quotingType: '"' })
}

export function isFormValid(schema, formValues) {
  if (!formValues.metadata?.name?.trim()) return false
  const required = schema.specSchema?.required || []
  for (const field of required) {
    const val = formValues.spec?.[field]
    if (val === undefined || val === null || val === '') return false
  }
  return true
}

export function getManifestFilename(schema, formValues) {
  const name = formValues.metadata?.name?.trim() || '<name>'
  const kind = (schema.kind || 'resource').toLowerCase()
  return `${kind}-${name}.yaml`
}
