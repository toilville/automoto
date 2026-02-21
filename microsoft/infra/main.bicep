@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Location for resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param resourceSuffix string = uniqueString(resourceGroup().id)

@description('Container image tag')
param imageTag string = 'latest'

@description('Container registry name (optional)')
param containerRegistry string = ''

@description('Deploy Foundry-related resources')
param deployFoundry bool = true

var appName = 'msstarter-${environment}-${resourceSuffix}'
var appServicePlanName = 'asp-${appName}'
var appInsightsName = 'ai-${appName}'

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: environment == 'prod' ? 'P1v3' : 'B1'
    tier: environment == 'prod' ? 'PremiumV3' : 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: empty(containerRegistry)
        ? 'DOCKER|microsoft/generic-agent-starter:${imageTag}'
        : 'DOCKER|${containerRegistry}.azurecr.io/generic-agent-starter:${imageTag}'
      appSettings: [
        {
          name: 'APP_INSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
  }
}

module foundry './foundry.bicep' = if (deployFoundry) {
  name: 'foundryDeployment'
  params: {
    location: location
    namePrefix: appName
  }
}

output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output foundryProjectEndpoint string = deployFoundry ? foundry!.outputs.projectEndpoint : ''
