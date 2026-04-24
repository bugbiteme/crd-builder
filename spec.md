dynamically generate a user friendly form and fields base on a k8s CustomResource (CRD) to generate a k8s yaml manifest

there may be one or CRD in the crDs/ directory in yaml format

read the directory and let the user choose the CRD that they want to create based on what yaml files are discovered in the directory

example

crs contents
- namespace.crd.yaml -> Namespace
- deployment.crd.yaml -> Deployment
- etc...

Create a dynamic form based on these that a user can fill out
List all required fields and have a check box that will display optional fields and if possible a dropdown box for any enumerated or boolean values for required and optional fields. 

Once the form is completed with at least all the required fields. the user can click a button `Create`, wich will create a file in the manifests directory with the name fomat <kind>-<name>.yaml where kind are the CRs such as Namespace, Deployment, Service, etc... and name is the metadata name of the resource.

example: istio-default.yaml

There should also be a preview button that shows the yaml with the current values in the form (when valid and all required fields are populated). the preview should have the ability to let the user copy and paste the yaml code