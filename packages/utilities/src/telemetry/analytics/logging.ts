import { isNonTestDev } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
// biome-ignore lint/style/noRestrictedImports: Platform-specific implementation needs internal types
import { UserPropertyValue } from 'utilities/src/telemetry/analytics/analytics'

interface ErrorLoggers {
  init(err: unknown): void
  setAllowAnalytics(allow: boolean): void
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void
  flushEvents(): void
  setUserProperty(property: string, value: UserPropertyValue): void
}

// 频繁事件列表，这些事件会被降级为 debug 级别以减少日志噪音
const FREQUENT_EVENTS = [
  'Notification Received',
  'Balances Report',
  'Balances Report Per Chain',
  'Swap Quote Fetch',
] as const

export function generateAnalyticsLoggers(fileName: string): ErrorLoggers {
  return {
    init(error: unknown): void {
      logger.error(error, { tags: { file: fileName, function: 'init' } })
    },
    sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
      if (isNonTestDev) {
        // 对于频繁事件，使用 debug 级别而不是 info 级别，以减少控制台噪音
        const isFrequentEvent = FREQUENT_EVENTS.some((event) => eventName.includes(event))
        if (isFrequentEvent) {
          // 使用 debug 级别，或者完全跳过日志（根据需求选择）
          // logger.debug('analytics', 'sendEvent', `[Event: ${eventName}]`, eventProperties ?? {})
          // 或者完全跳过这些频繁事件的日志
          return
        }
        logger.info('analytics', 'sendEvent', `[Event: ${eventName}]`, eventProperties ?? {})
      }
    },
    setAllowAnalytics(allow: boolean): void {
      if (isNonTestDev) {
        logger.info('analytics', 'setAnonymous', `user allows analytics: ${allow}`)
      }
    },
    flushEvents(): void {
      if (isNonTestDev) {
        logger.info('analytics', 'flushEvents', 'flushing analytics events')
      }
    },
    setUserProperty(property: string, value: UserPropertyValue): void {
      if (isNonTestDev) {
        logger.info('analytics', 'setUserProperty', `[Property: ${property}]: ${value}`)
      }
    },
  }
}
