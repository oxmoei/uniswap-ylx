import { type ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-web'
import { provideDeviceIdService } from '@universe/api/src/provideDeviceIdService'
import { provideSessionStorage } from '@universe/api/src/provideSessionStorage'
import { isWebApp } from 'utilities/src/platform'

interface SessionTransportOptions {
  getSessionId?: () => Promise<string | null>
  getDeviceId?: () => Promise<string | null>
  getBaseUrl: () => string
  getHeaders?: () => object
  options?: Partial<ConnectTransportOptions>
}

/**
 * Creates a Connect transport that includes session and device headers.
 *
 * This is the most basic transport util. Use this if you have a new use case for a transport.
 * (For example, a TestTransport that doesn't use the Session storage)
 * Otherwise, you can use the getTransport util.
 */
function createTransport(ctx: SessionTransportOptions): ReturnType<typeof createConnectTransport> {
  const { getSessionId, getDeviceId, getBaseUrl, getHeaders, options } = ctx

  // Get initial baseUrl for ConnectRPC (required at creation time)
  // We'll override it dynamically in the interceptor to ensure proxy detection works at runtime
  const initialBaseUrl = getBaseUrl()

  const transportOptions: ConnectTransportOptions = {
    // Use a placeholder that will be overridden in the interceptor
    // ConnectRPC requires a valid URL at creation time, so we use current origin or a fallback
    baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://app.uniswap.org',
    interceptors: [
      (next) => async (request) => {
        // Dynamically get the current baseUrl at request time
        // This ensures proxy detection works correctly even if window was not available at module load time
        const currentBaseUrl = getBaseUrl()
        
        // Override the request URL to use the current baseUrl
        if (request.url) {
          try {
            const requestUrl = new URL(request.url)
            const servicePath = requestUrl.pathname + requestUrl.search
            
            // If currentBaseUrl is a relative path, prepend current origin
            if (currentBaseUrl.startsWith('/')) {
              const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://app.uniswap.org'
              // ConnectRPC appends service path to baseUrl, so we need to extract just the service path
              // The service path typically starts after the baseUrl
              // If the path already includes the baseUrl, use it as-is; otherwise, prepend baseUrl
              if (servicePath.startsWith(currentBaseUrl)) {
                request.url = currentOrigin + servicePath
              } else {
                // Extract service path (remove the placeholder base if present)
                const cleanPath = servicePath.replace(/^\/[^/]+/, '')
                request.url = currentOrigin + currentBaseUrl + cleanPath
              }
            } else {
              // Absolute URL - use it directly
              const baseUrlObj = new URL(currentBaseUrl)
              // Extract service path and append to new baseUrl
              const cleanPath = servicePath.replace(/^\/[^/]+/, '')
              request.url = baseUrlObj.origin + baseUrlObj.pathname + cleanPath
            }
          } catch (error) {
            // If URL parsing fails, try simpler replacement
            if (typeof window !== 'undefined' && currentBaseUrl.startsWith('/')) {
              const currentOrigin = window.location.origin
              // Try to extract service path from request URL
              const match = request.url.match(/\/([^/]+\/[^?]+)(\?.*)?$/)
              if (match) {
                request.url = currentOrigin + currentBaseUrl + '/' + match[1] + (match[2] || '')
              }
            }
          }
        }

        // Add session ID header for mobile/extension
        // Web uses cookies automatically
        if (!isWebApp) {
          const [sessionId, deviceId] = await Promise.all([getSessionId?.(), getDeviceId?.()])
          if (sessionId) {
            request.header.set('X-Session-ID', sessionId)
          }
          if (deviceId) {
            request.header.set('X-Device-ID', deviceId)
          }
        }

        const extraHeaders = getHeaders?.()
        if (extraHeaders) {
          Object.entries(extraHeaders).forEach(([key, value]) => {
            request.header.set(key, value)
          })
        }

        return next(request)
      },
    ],
    ...options,
  }

  return createConnectTransport(transportOptions)
}

/**
 * Configures a Connect transport that uses the primary Session storage.
 */
function getTransport(ctx: {
  getBaseUrl: () => string
  getHeaders?: () => object
  options?: Partial<ConnectTransportOptions>
}): ReturnType<typeof createConnectTransport> {
  return createTransport({
    getBaseUrl: ctx.getBaseUrl,
    async getSessionId() {
      if (isWebApp) {
        return null
      }
      return provideSessionStorage()
        .get()
        .then((session) => session?.sessionId ?? null)
    },
    async getDeviceId() {
      if (isWebApp) {
        return null
      }
      return provideDeviceIdService().getDeviceId()
    },
    getHeaders: ctx.getHeaders,
    options: ctx.options,
  })
}

export { getTransport }
