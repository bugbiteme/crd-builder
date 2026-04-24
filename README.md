# crd-builder

Dynamically generate a user-friendly form from Kubernetes CustomResourceDefinition (CRD) YAML files to build k8s manifests.

## Running locally

**Requirements:** Node.js 20.19+ or 22.12+, npm

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dev server (Vite, port 3000) proxies `/api` requests to the Express backend on port 3001. Both start together with `npm run dev`.

## Running with Podman

**Requirements:** Podman 4+

Build the image:

```bash
podman build -t crd-builder .
```

Run it, mounting your local `crds/` and `manifests/` directories so you can add CRDs and retrieve generated manifests without rebuilding:

```bash
podman run -p 3001:3001 \
  -v ./crds:/app/crds:Z \
  -v ./manifests:/app/manifests:Z \
  crd-builder
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

The `:Z` flag sets the correct SELinux label on the bind mounts, required on RHEL/Fedora hosts. Omit it on macOS or other non-SELinux systems.

To deploy on OpenShift, push the image to your registry and apply a `Deployment` + `Service` + `Route`. The image is already non-root and OpenShift-compatible (arbitrary UID, GID 0 group writes).

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
   - Hover the **ⓘ** icon on any field to see its description
3. **Preview YAML** in the right panel — updates live as you type. Drag the divider between the form and preview to resize either panel.
4. **Copy** the YAML to clipboard or click **Create** to write the manifest to `manifests/`.

Generated files are saved as `manifests/<kind>-<name>.yaml` (e.g. `manifests/destinationrule-my-rule.yaml`).

## Project structure

```
crd-builder/
├── crds/          CRD YAML files (input)
├── manifests/     Generated manifest files (output)
├── server/        Express API server (port 3001)
├── src/           React 19 frontend (Vite 8, port 3000)
├── Dockerfile
└── package.json
```
