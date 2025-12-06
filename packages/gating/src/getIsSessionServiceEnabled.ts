import { getConfig } from '@universe/config'
import { FeatureFlags } from '@universe/gating/src/flags'
import { getFeatureFlag } from '@universe/gating/src/hooks'

function getIsSessionServiceEnabled(): boolean {
  // 会话服务已禁用
  return false
  // 原代码（已注释）：
  // return getConfig().enableSessionService || getFeatureFlag(FeatureFlags.SessionsServiceEnabled)
}

export { getIsSessionServiceEnabled }
