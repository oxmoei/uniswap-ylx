# 错误日志分析报告

## 错误类型分类

### 1. 网络连接错误

#### 1.1 `net::ERR_CONNECTION_CLOSED`
**原因：**
- 服务器主动关闭连接
- 网络中断或超时
- 防火墙/代理阻止连接
- API服务暂时不可用

**常见来源：**
- Moralis API (`https://deep-index.moralis.io/api/v2.2`)
- GraphQL API
- REST API (`@universe/api`)
- RPC节点 (Quiknode, Infura, BlastAPI等)
- 通知服务

**解决方案：**
1. 检查网络连接稳定性
2. 验证API密钥是否有效
3. 添加重试机制和错误处理
4. 使用请求超时设置
5. 实现优雅降级（fallback）

#### 1.2 `Failed to fetch`
**原因：**
- 网络请求失败（通用错误）
- CORS策略阻止
- 请求超时
- 服务器返回错误状态码

**常见来源：**
- 所有外部API调用
- 跨域请求

**解决方案：**
1. 添加错误边界处理
2. 实现请求重试逻辑
3. 检查CSP配置
4. 验证API端点可访问性

#### 1.3 `ERR_TIMED_OUT`
**原因：**
- 请求超时（超过设定的时间限制）
- 服务器响应慢
- 网络延迟高

**解决方案：**
1. 增加超时时间（对于关键请求）
2. 实现请求取消机制
3. 使用请求队列限制并发
4. 添加超时重试逻辑

### 2. Content Security Policy (CSP) 违规

**错误示例：**
```
Connecting to 'https://bscrpc.com/' violates the following Content Security Policy directive: "connect-src ..."
```

**原因：**
- 浏览器安全策略阻止连接到未授权的URL
- CSP配置不完整或过时

**常见来源：**
- RPC节点URL
- 外部API端点
- WebSocket连接

**解决方案：**
1. 更新CSP配置，添加允许的域名
2. 使用代理服务器转发请求
3. 检查并更新 `next.config.js` 或相关配置文件中的CSP设置

### 3. CORS 错误

**错误示例：**
```
Access to fetch at 'https://trading-api-labs.interface.gateway.uniswap.org/v1/wallet/check_delegation' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**原因：**
- API服务器未设置正确的CORS头
- 开发环境（localhost）与生产环境域名不匹配

**解决方案：**
1. 在开发环境中使用代理
2. 联系API提供方配置CORS
3. 对于已禁用的API（如Trading API），确保完全跳过请求

### 4. 控制台日志过多

**问题：**
代码中存在大量 `console.log`, `console.warn`, `console.error` 调用，在开发环境中产生大量输出。

**当前日志来源：**
- `useTokenPriceFromRest.ts`: 查找缓存、价格获取日志
- `useTokenPriceFromMoralis.ts`: API调用日志
- `useDerivedSwapInfo.ts`: 价格计算、USD价值换算日志
- `SwapRateRatio.tsx`: 兑换率计算警告
- `TransactionAmountsReview.tsx`: 错误日志
- `SwapReviewScreen.tsx`: 调试日志

**解决方案：**
1. 使用环境变量控制日志级别
2. 将开发日志降级为 `console.debug`
3. 实现日志过滤机制
4. 移除不必要的日志语句

## 优化建议

### 1. 错误处理优化

#### 1.1 添加全局错误处理
```typescript
// 创建全局错误处理器
window.addEventListener('unhandledrejection', (event) => {
  // 过滤已知的网络错误，避免日志噪音
  if (event.reason?.message?.includes('Failed to fetch') || 
      event.reason?.message?.includes('ERR_CONNECTION_CLOSED')) {
    // 静默处理已知的网络错误
    return
  }
  // 记录其他错误
  console.error('Unhandled promise rejection:', event.reason)
})
```

#### 1.2 实现请求重试机制
```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10秒超时
      })
      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // 指数退避
    }
  }
  throw new Error('Max retries exceeded')
}
```

### 2. 日志优化

#### 2.1 创建日志工具
```typescript
// utils/logger.ts
const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL || 'warn'

export const logger = {
  debug: (...args: any[]) => {
    if (LOG_LEVEL === 'debug') console.debug(...args)
  },
  info: (...args: any[]) => {
    if (['debug', 'info'].includes(LOG_LEVEL)) console.info(...args)
  },
  warn: (...args: any[]) => {
    if (['debug', 'info', 'warn'].includes(LOG_LEVEL)) console.warn(...args)
  },
  error: (...args: any[]) => {
    console.error(...args) // 错误始终记录
  },
}
```

#### 2.2 替换现有日志
将所有 `console.log` 替换为 `logger.debug`，`console.warn` 替换为条件日志。

### 3. API调用优化

#### 3.1 添加请求去重
使用 React Query 的 `staleTime` 和 `cacheTime` 减少重复请求。

#### 3.2 实现请求取消
```typescript
useQuery({
  queryKey: ['tokenPrice', chainId, address],
  queryFn: async ({ signal }) => {
    const response = await fetch(url, { signal })
    return response.json()
  },
})
```

### 4. CSP配置更新

检查并更新 `next.config.js` 或相关配置文件：
```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      connect-src 'self' 
        https://deep-index.moralis.io 
        https://*.uniswap.org 
        https://*.gateway.uniswap.org
        https://*.quiknode.pro
        https://*.infura.io
        https://*.blastapi.io
        https://bscrpc.com
        https://bsc-dataseed2.ninicoin.io
        wss://*.walletconnect.org
        ;`
  }
]
```

## 优先级建议

### 高优先级
1. ✅ **已处理**: Trading API禁用时的错误日志（通过 `IS_TRADING_API_DISABLED` 标志）
2. 🔄 **进行中**: 减少控制台日志噪音（部分已完成，需继续优化）
3. ⚠️ **待处理**: 添加网络错误的重试机制
4. ⚠️ **待处理**: 更新CSP配置以允许必要的RPC节点

### 中优先级
1. 实现全局错误处理
2. 优化Moralis API的错误处理（已有部分实现）
3. 添加请求超时和取消机制

### 低优先级
1. 实现日志级别控制
2. 添加错误监控和报告（如Sentry）
3. 优化React Query缓存策略

## 已知问题

1. **Moralis API密钥**: 如果未配置或无效，会产生大量错误日志
2. **RPC节点连接**: 某些RPC节点可能不稳定，导致频繁的连接错误
3. **开发环境**: localhost环境下的CORS和CSP限制更严格

## 测试建议

1. 在无网络环境下测试应用的降级行为
2. 模拟API失败场景，验证错误处理
3. 检查控制台日志在开发和生产环境中的表现
4. 验证CSP配置不会阻止正常功能

