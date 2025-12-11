import { Transport } from '@connectrpc/connect'
import { ConnectTransportOptions } from '@connectrpc/connect-web'
import { getTransport } from '@universe/api'
import { getApiBaseUrlV2 } from 'uniswap/src/constants/urls'
import { BASE_UNISWAP_HEADERS } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import { isMobileApp } from 'utilities/src/platform'

// Helper function to get API base URL dynamically at runtime
// This ensures proxy detection works correctly even if window is not available at module load time
// We call getApiBaseUrlV2() at runtime instead of using the pre-computed uniswapUrls.apiBaseUrlV2
function getDynamicApiBaseUrlV2(): string {
  // Call getApiBaseUrlV2() at runtime to ensure proxy detection works correctly
  // This is important because shouldUseProxy() checks window.location.origin,
  // which may not be available at module load time
  return getApiBaseUrlV2()
}

export const createConnectTransportWithDefaults = (options: Partial<ConnectTransportOptions> = {}): Transport =>
  getTransport({
    getBaseUrl: getDynamicApiBaseUrlV2,
    getHeaders: () => (isMobileApp ? BASE_UNISWAP_HEADERS : {}),
    options,
  })

/**
 * Connectrpc transports for Uniswap REST BE service
 */
export const uniswapGetTransport = createConnectTransportWithDefaults({ useHttpGet: true })
export const uniswapPostTransport = createConnectTransportWithDefaults()

// The string arg to pass to the BE for chainId to get data for all networks
export const ALL_NETWORKS_ARG = 'ALL_NETWORKS'

/**
 * To add a ConnectRPC hook for a new BE client service:
 * 1. Create a new file in the `data/rest` directory with a name matching the service
 * 2. Copy the below template replacing `newService` with the service name
 *   a. The client service, Request, and Response types are imported from the generated client
 *   b. You can use exploreStats as a reference for how to structure the hook
 * export function useNewServiceQuery(
    input?: PartialMessage<NewServiceRequest>,
  ): UseQueryResult<NewServiceResponse, ConnectError> {
    return useQuery(newService, input, { transport: uniswapGetTransport })
  }
 */
