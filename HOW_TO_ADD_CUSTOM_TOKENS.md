# 如何添加自定义代币

本文档说明如何向 Uniswap 应用添加自定义 ERC20 代币。

## 方法一：通过预设代币列表添加（推荐）

### 步骤

1. 打开文件：`packages/uniswap/src/features/tokens/presetCustomTokens.ts`

2. 在 `PRESET_CUSTOM_TOKENS` 数组中添加新的代币对象：

```typescript
export const PRESET_CUSTOM_TOKENS: CustomToken[] = [
  // 现有代币...
  
  // 添加新代币
  {
    chainId: UniverseChainId.Bnb, // 或 UniverseChainId.Mainnet, UniverseChainId.Polygon 等
    address: '0x你的代币合约地址',
    symbol: 'TOKEN',
    name: 'Token Name',
    decimals: 18,
    logoURI: 'https://example.com/logo.png', // 可选
    priceUSD: 1.5, // 可选
  },
]
```

3. 保存文件，重新部署应用

4. 应用启动时会自动将预设代币添加到 localStorage

### 完整示例

```typescript
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const PRESET_CUSTOM_TOKENS: CustomToken[] = [
  // BNB Chain 代币示例
  {
    chainId: UniverseChainId.Bnb, // 56
    address: '0xbfb4681A90F1584f0DB8688553C8f882C4484444',
    symbol: '马到成功',
    name: '马到成功',
    decimals: 18,
    logoURI: 'https://static.cx.metamask.io/api/v1/tokenIcons/56/0xde6e12bdb2062dc48b409f0086219464a0c317a0.png',
    priceUSD: 1.5,
  },
  
  // Ethereum 主网代币示例
  {
    chainId: UniverseChainId.Mainnet, // 1
    address: '0x1234567890123456789012345678901234567890',
    symbol: 'MYTOKEN',
    name: 'My Custom Token',
    decimals: 18,
    logoURI: 'https://example.com/my-token-logo.png',
    priceUSD: 0.5,
  },
  
  // Polygon 代币示例（不提供价格，系统会自动获取）
  {
    chainId: UniverseChainId.Polygon, // 137
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    symbol: 'POLY',
    name: 'Polygon Token',
    decimals: 18,
    // logoURI 和 priceUSD 都是可选的
  },
]
```

## 方法二：通过代码动态添加

### 在组件或函数中调用

```typescript
import { addCustomToken } from 'uniswap/src/features/tokens/customTokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// 添加代币
const success = addCustomToken({
  chainId: UniverseChainId.Bnb,
  address: '0xbfb4681A90F1584f0DB8688553C8f882C4484444',
  symbol: '马到成功',
  name: '马到成功',
  decimals: 18,
  logoURI: 'https://static.cx.metamask.io/api/v1/tokenIcons/56/0xde6e12bdb2062dc48b409f0086219464a0c317a0.png',
  priceUSD: 1.5,
})

if (success) {
  console.log('代币添加成功')
} else {
  console.log('代币已存在')
}
```

### 在浏览器控制台中添加

打开浏览器开发者工具（F12），在控制台中执行：

```javascript
// 导入函数（需要先确保应用已加载）
import('uniswap/src/features/tokens/customTokens').then(({ addCustomToken }) => {
  const success = addCustomToken({
    chainId: 56, // BNB Chain
    address: '0xbfb4681A90F1584f0DB8688553C8f882C4484444',
    symbol: '马到成功',
    name: '马到成功',
    decimals: 18,
    logoURI: 'https://static.cx.metamask.io/api/v1/tokenIcons/56/0xde6e12bdb2062dc48b409f0086219464a0c317a0.png',
    priceUSD: 1.5,
  })
  
  console.log(success ? '添加成功' : '代币已存在')
})
```

## 支持的链ID

常用的链ID（UniverseChainId）：

| 链名称 | UniverseChainId | 数值 |
|--------|----------------|------|
| Ethereum 主网 | `UniverseChainId.Mainnet` | 1 |
| BNB Chain | `UniverseChainId.Bnb` | 56 |
| Polygon | `UniverseChainId.Polygon` | 137 |
| Arbitrum | `UniverseChainId.ArbitrumOne` | 42161 |
| Base | `UniverseChainId.Base` | 8453 |
| Optimism | `UniverseChainId.Optimism` | 10 |
| Avalanche | `UniverseChainId.Avalanche` | 43114 |
| ZkSync | `UniverseChainId.Zksync` | 324 |

查看完整列表：`packages/uniswap/src/features/chains/types.ts`

## 字段说明

### 必需字段

- **chainId**: 链ID（使用 `UniverseChainId` 枚举）
- **address**: 代币合约地址（0x开头的十六进制地址）
- **symbol**: 代币符号（显示在UI中，例如：ETH, USDC）
- **name**: 代币全名
- **decimals**: 小数位数（通常是18，USDC是6）

### 可选字段

- **logoURI**: 代币图标URL（建议使用 PNG 或 SVG，尺寸建议 256x256）
- **priceUSD**: 代币价格（USD）
  - 如果不提供，系统会尝试从 Moralis API 获取
  - 如果获取失败，价值会显示为 0

## 获取代币信息

### 1. 代币合约地址
- 从代币项目的官方网站或白皮书获取
- 从区块链浏览器（如 Etherscan, BscScan）获取

### 2. 代币符号和名称
- 通常可以从代币合约的 `symbol()` 和 `name()` 函数获取
- 或从代币项目的文档获取

### 3. 小数位数
- 大多数 ERC20 代币使用 18 位小数
- USDC、USDT 等稳定币通常使用 6 位小数
- 可以通过区块链浏览器查看代币的 `decimals()` 函数返回值

### 4. Logo URL
- 可以使用 MetaMask 的图标服务：`https://static.cx.metamask.io/api/v1/tokenIcons/{chainId}/{address}.png`
- 或使用代币项目的官方图标URL
- 或使用 CoinGecko/CoinMarketCap 的图标API

### 5. 价格
- 如果不提供，系统会自动从 Moralis API 获取
- 也可以手动设置价格（如果 Moralis 无法获取）

## 验证代币是否添加成功

1. 打开浏览器开发者工具（F12）
2. 在控制台中执行：

```javascript
// 获取所有自定义代币
import('uniswap/src/features/tokens/customTokens').then(({ getCustomTokens }) => {
  const tokens = getCustomTokens()
  console.log('自定义代币列表：', tokens)
})

// 获取指定链的代币
import('uniswap/src/features/tokens/customTokens').then(({ getCustomTokensByChain }) => {
  const bnbTokens = getCustomTokensByChain(56) // BNB Chain
  console.log('BNB Chain 自定义代币：', bnbTokens)
})
```

3. 检查 localStorage：
   - 打开开发者工具 → Application → Local Storage
   - 查找键名：`uniswap-custom-tokens`
   - 查看存储的代币数据

## 删除代币

```typescript
import { removeCustomToken } from 'uniswap/src/features/tokens/customTokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const success = removeCustomToken(
  UniverseChainId.Bnb,
  '0xbfb4681A90F1584f0DB8688553C8f882C4484444'
)

if (success) {
  console.log('代币删除成功')
} else {
  console.log('代币不存在')
}
```

## 常见问题

### Q: 代币添加后没有显示在"你的代币"列表中？
A: 
1. 确保钱包已连接
2. 确保钱包地址在正确的链上
3. 如果代币余额为0，可能不会显示（取决于排序逻辑）
4. 检查浏览器控制台是否有错误信息

### Q: 如何更新代币信息（如价格、logo）？
A: 
1. 删除旧代币：`removeCustomToken(chainId, address)`
2. 添加新代币：`addCustomToken(newTokenInfo)`

### Q: 代币价格显示为0？
A: 
1. 检查是否提供了 `priceUSD` 字段
2. 如果没有提供，系统会尝试从 Moralis API 获取
3. 如果 Moralis API 无法获取价格，会显示为 0
4. 可以手动设置 `priceUSD` 字段

### Q: 支持哪些链？
A: 支持所有 EVM 兼容链，包括但不限于：
- Ethereum 主网及测试网
- BNB Chain
- Polygon
- Arbitrum
- Base
- Optimism
- Avalanche
- 等等

## 相关文件

- `packages/uniswap/src/features/tokens/customTokens.ts` - 核心功能
- `packages/uniswap/src/features/tokens/presetCustomTokens.ts` - 预设代币列表
- `packages/uniswap/src/features/tokens/useCustomTokenBalance.ts` - 余额获取
- `packages/uniswap/src/features/portfolio/moralis/useMoralisTokenList.ts` - 代币列表集成

