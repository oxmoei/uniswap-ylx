# 自定义ERC20代币功能

## 功能概述

已实现自定义ERC20代币管理功能，支持：
- 添加自定义代币（链ID、合约地址、符号、logo、价格等）
- 使用viem获取代币余额
- 余额大于0的代币优先显示在"你的代币"列表中

## 核心文件

### 1. `packages/uniswap/src/features/tokens/customTokens.ts`
自定义代币存储和管理功能：
- `getCustomTokens()`: 获取所有自定义代币
- `addCustomToken(token)`: 添加自定义代币
- `removeCustomToken(chainId, address)`: 删除自定义代币
- `getCustomTokensByChain(chainId)`: 获取指定链的自定义代币

### 2. `packages/uniswap/src/features/tokens/useCustomTokenBalance.ts`
使用viem获取代币余额的hooks：
- `useCustomTokenBalance(customToken)`: 获取单个代币余额
- `useCustomTokenBalances(customTokens, chainId)`: 批量获取代币余额

### 3. `packages/uniswap/src/features/portfolio/moralis/useMoralisTokenList.ts`
已更新，自动合并自定义代币到"你的代币"列表，并按余额排序（余额>0优先）

## 使用方法

### 添加自定义代币

```typescript
import { addCustomToken, type CustomToken } from 'uniswap/src/features/tokens/customTokens'

const customToken: CustomToken = {
  chainId: 1, // Ethereum主网
  address: '0x...', // 代币合约地址
  symbol: 'CUSTOM',
  name: 'Custom Token',
  decimals: 18,
  logoURI: 'https://...', // 可选
  priceUSD: 1.5, // 可选，如果不提供会尝试从Moralis获取
}

const success = addCustomToken(customToken)
if (success) {
  console.log('代币添加成功')
} else {
  console.log('代币已存在')
}
```

### 删除自定义代币

```typescript
import { removeCustomToken } from 'uniswap/src/features/tokens/customTokens'

const success = removeCustomToken(1, '0x...')
if (success) {
  console.log('代币删除成功')
}
```

### 获取自定义代币列表

```typescript
import { getCustomTokens, getCustomTokensByChain } from 'uniswap/src/features/tokens/customTokens'

// 获取所有自定义代币
const allTokens = getCustomTokens()

// 获取指定链的自定义代币
const ethereumTokens = getCustomTokensByChain(1)
```

## 自动功能

### 余额获取
- 自定义代币的余额会自动使用viem从链上获取
- 余额每10秒刷新一次
- 支持多链代币

### 价格获取
- 如果自定义代币没有设置价格，系统会尝试从Moralis API获取
- 价格每5分钟刷新一次

### 列表排序
- 余额大于0的代币会优先显示在"你的代币"列表顶部
- 然后按价值（USD）降序排列

## 数据存储

自定义代币数据存储在浏览器的localStorage中，键名：`uniswap-custom-tokens`

存储格式：
```json
[
  {
    "chainId": 1,
    "address": "0x...",
    "symbol": "CUSTOM",
    "name": "Custom Token",
    "decimals": 18,
    "logoURI": "https://...",
    "priceUSD": 1.5
  }
]
```

## 注意事项

1. **链支持**：目前仅支持EVM链（Ethereum、Polygon、BSC等）
2. **余额获取**：需要钱包已连接才能获取余额
3. **价格获取**：如果Moralis API无法获取价格，代币仍会显示，但价值为0
4. **性能**：大量自定义代币可能会影响加载速度，建议限制数量

## 后续改进

- [ ] 添加UI界面用于管理自定义代币
- [ ] 支持批量导入/导出自定义代币
- [ ] 添加代币验证（检查合约是否有效）
- [ ] 支持从代币列表URL导入

