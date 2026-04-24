// The server extracts the schema; this file has helpers for the frontend to work with it.

export function getRequiredFields(schema) {
  return schema?.required || []
}

export function getProperties(schema) {
  return schema?.properties || {}
}

export function isRequired(schema, fieldName) {
  return (schema?.required || []).includes(fieldName)
}
