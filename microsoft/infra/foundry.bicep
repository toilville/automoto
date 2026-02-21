@description('Location for Foundry resources')
param location string

@description('Name prefix')
param namePrefix string

resource aiServices 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: '${namePrefix}-ai'
  location: location
  kind: 'AIServices'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: toLower(replace('${namePrefix}-ai', '-', ''))
    publicNetworkAccess: 'Enabled'
  }
}

output aiServicesName string = aiServices.name
output projectEndpoint string = 'https://${aiServices.name}.cognitiveservices.azure.com/'
