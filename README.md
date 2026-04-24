# crd-builder

Dynamically generate a user-friendly form from Kubernetes CustomResourceDefinition (CRD) YAML files to build k8s manifests.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Usage

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding CRDs

Drop any CRD YAML file into the `crds/` directory. The app discovers all `.yaml` / `.yml` files in that directory automatically — no restart required after adding new files.

```
crds/
  destinationrule.crd.yaml   → DestinationRule
  istios.crd.yaml            → Istio
  my-custom.crd.yaml         → MyCrd
```

## How it works

1. **Select a CRD** from the dropdown — the form is generated dynamically from the CRD's OpenAPI v3 schema.
2. **Fill in the form** — required fields are shown immediately; check **Show optional fields** to reveal all available fields.
   - Enum values render as dropdowns
   - Boolean fields render as true / false selects
   - Nested objects render as collapsible sections
   - Array fields have add / remove controls
   - Map fields (`additionalProperties`) have a key-value editor
3. **Preview YAML** in the right panel — updates live as you type.
4. **Copy** the YAML to clipboard or click **Create** to write the manifest to `manifests/`.

Generated files are saved as `manifests/<kind>-<name>.yaml` (e.g. `manifests/destinationrule-my-rule.yaml`).

## Project structure

```
crd-builder/
├── crds/          CRD YAML files (input)
├── manifests/     Generated manifest files (output)
├── server/        Express API server (port 3001)
├── src/           React frontend (Vite, port 3000)
└── package.json
```
