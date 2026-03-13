// Foundry Agent Chat Infrastructure
// Extends the existing TNREvents resource group with Foundry Agent resources
// Uses the existing managed identity (tnr-events-identity) for all auth

metadata name = 'TNR Events Chat - Foundry Infrastructure'
metadata description = 'AI Foundry agent project with managed identity, connected to existing AI Services and Search'
metadata version = '1.0.0'

// ── Parameters ───────────────────────────────────────────────

param location string = resourceGroup().location
param environment string = 'dev'

// Existing resource references
param aiServicesName string = 'tnr-events-ai'
param managedIdentityName string = 'tnr-events-identity'
param searchServiceName string = 'tnr-events-ai-search-eastus'
param storageAccountName string = 'tnreventsstorage'

// New resources
param agentProjectName string = 'tnr-events-chat'

// Set to true if you have Owner/User Access Administrator role
param deployRbac bool = false

param tags object = {
  environment: environment
  project: 'tnr-events-chat'
  managedBy: 'Infrastructure-as-Code'
  compliance: 'ManagedIdentityOnly'
}

// ── Existing Resource References ─────────────────────────────

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: managedIdentityName
}

resource aiServices 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = {
  name: aiServicesName
}

resource searchService 'Microsoft.Search/searchServices@2024-06-01-preview' existing = {
  name: searchServiceName
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

// ── Foundry Project ──────────────────────────────────────────
// Creates a new project under the existing AI Services account.
// The project uses the user-assigned managed identity for all
// agent operations (model inference, search, storage).

resource agentProject 'Microsoft.CognitiveServices/accounts/projects@2025-04-01-preview' = {
  parent: aiServices
  name: agentProjectName
  location: location
  tags: union(tags, { service: 'FoundryAgent' })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {}
}

// ── RBAC: Managed Identity → AI Services ─────────────────────
// Cognitive Services User = full data-plane access for agent operations
// Only deployed when deployRbac=true (requires Owner/User Access Administrator)

var cognitiveServicesUserRoleId = 'a97b65f3-24c7-4388-baec-2e87135dc908'
var cognitiveServicesOpenAIUserRoleId = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
var searchIndexDataReaderRoleId = '1407120a-92aa-4202-b7e9-c0e197c71c8f'
var searchIndexDataContributorRoleId = '8ebe5a00-799e-43f5-93ac-243d3dce84a7'
var searchServiceContributorRoleId = '7ca78c08-252a-4471-8644-bb5ff32d4ba0'
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

// AI Services: Cognitive Services User
resource aiCognitiveServicesUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: aiServices
  name: guid(aiServices.id, managedIdentity.id, cognitiveServicesUserRoleId, agentProjectName)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cognitiveServicesUserRoleId)
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// AI Services: Cognitive Services OpenAI User (model inference)
resource aiOpenAIUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: aiServices
  name: guid(aiServices.id, managedIdentity.id, cognitiveServicesOpenAIUserRoleId, agentProjectName)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cognitiveServicesOpenAIUserRoleId)
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── RBAC: Managed Identity → AI Search ───────────────────────

// Search: Index Data Reader (query grounding data)
resource searchIndexReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: searchService
  name: guid(searchService.id, managedIdentity.id, searchIndexDataReaderRoleId, agentProjectName)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', searchIndexDataReaderRoleId)
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Search: Index Data Contributor (create/update indexes for RAG)
resource searchIndexContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: searchService
  name: guid(searchService.id, managedIdentity.id, searchIndexDataContributorRoleId, agentProjectName)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', searchIndexDataContributorRoleId)
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Search: Service Contributor (manage search service configuration)
resource searchServiceContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: searchService
  name: guid(searchService.id, managedIdentity.id, searchServiceContributorRoleId, agentProjectName)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', searchServiceContributorRoleId)
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── RBAC: Managed Identity → Storage ─────────────────────────

// Storage: Blob Data Contributor (agent file storage, vector store uploads)
resource storageBlobContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: storageAccount
  name: guid(storageAccount.id, managedIdentity.id, storageBlobDataContributorRoleId, agentProjectName)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── RBAC: AI Services System Identity → Search ───────────────
// The AI Services account's system-assigned identity needs access to
// Search so the Foundry agent can perform grounding queries.

resource aiServicesSearchReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: searchService
  name: guid(searchService.id, aiServices.id, searchIndexDataReaderRoleId, 'ai-services-system')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', searchIndexDataReaderRoleId)
    principalId: aiServices.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource aiServicesSearchContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbac) {
  scope: searchService
  name: guid(searchService.id, aiServices.id, searchIndexDataContributorRoleId, 'ai-services-system')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', searchIndexDataContributorRoleId)
    principalId: aiServices.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Outputs ──────────────────────────────────────────────────

output foundryEndpoint string = 'https://${aiServicesName}.services.ai.azure.com/api/projects/${agentProjectName}'
output aiServicesEndpoint string = aiServices.properties.endpoint
output modelInferenceEndpoint string = 'https://${aiServicesName}.services.ai.azure.com/'
output searchEndpoint string = 'https://${searchServiceName}.search.windows.net'
output managedIdentityClientId string = managedIdentity.properties.clientId
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output projectName string = agentProject.name
