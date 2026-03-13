using './main.bicep'

param location = 'eastus'
param environment = 'dev'

// Existing resources in tnr-events-rg
param aiServicesName = 'tnr-events-ai'
param managedIdentityName = 'tnr-events-identity'
param searchServiceName = 'tnr-events-ai-search-eastus'
param storageAccountName = 'tnreventsstorage'

// New Foundry project
param agentProjectName = 'tnr-events-chat'

// sc-vpd332776 has Owner at subscription level — deploy RBAC assignments
param deployRbac = true

param tags = {
  environment: 'dev'
  project: 'tnr-events-chat'
  managedBy: 'Infrastructure-as-Code'
  compliance: 'ManagedIdentityOnly'
}
