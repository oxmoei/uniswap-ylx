# Moralis API 集成

这个模块使用 Moralis API 来获取钱包的 ERC20 代币列表、余额、logo 和价格。

## 功能特性

- ✅ 获取钱包的所有 ERC20 代币
- ✅ 自动获取代币价格（只展示有价格的代币）
- ✅ 获取代币 logo
- ✅ 计算代币的 USD 价值
- ✅ 支持主备 API 密钥切换
- ✅ 支持多个链（Ethereum、Polygon、Arbitrum、Base、Optimism 等）

## 环境变量配置

在项目根目录的 `.env.local` 文件中添加以下环境变量：

```bash
# Moralis API 配置
NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY=your_primary_api_key_here
NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY=your_fallback_api_key_here
NEXT_PUBLIC_MORALIS_BASE_URL=https://deep-index.moralis.io/api/v2.2  # 可选，默认值
```

## 使用方法

### 1. 在组件中使用

```typescript
import { useMoralisTokenList } from 'uniswap/src/features/portfolio/moralis/useMoralisTokenList'

function MyComponent() {
  const { data, error, isLoading, refetch } = useMoralisTokenList(chainId)

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <div>
      {data?.map((token) => (
        <div key={token.token.address}>
          <img src={token.logoURI || ''} alt={token.token.symbol} />
          <span>{token.token.symbol}</span>
          <span>余额: {token.balance.toExact()}</span>
          <span>价格: ${token.priceUSD}</span>
          <span>价值: ${token.valueUSD}</span>
        </div>
      ))}
    </div>
  )
}
```

### 2. 在 TokenSelector 中使用

`usePortfolioTokenOptions` hook 已经自动使用 Moralis API 来获取"你的代币"列表。

## API 说明

### `fetchWalletERC20Tokens(address, chainId)`

获取钱包的 ERC20 代币列表（只返回有价格的代币）。

**参数：**
- `address`: 钱包地址
- `chainId`: 链 ID

**返回：**
- `Promise<MoralisTokenInfo[]>`: 代币信息数组，已按价值降序排序

### `useMoralisTokenList(chainId?)`

React Hook，用于获取代币列表。

**参数：**
- `chainId`: 可选的链 ID，如果不提供则使用默认链

**返回：**
- `data`: 代币余额数组
- `error`: 错误信息
- `isLoading`: 加载状态
- `refetch`: 重新获取函数

## 支持的链

- Ethereum (1)
- Polygon (137)
- BNB Chain (56)
- Arbitrum (42161)
- Base (8453)
- Optimism (10)
- Avalanche (43114)
- Zksync (324)
- Unichain (130)
- Blast (81457)
- Monad (143)
- Sepolia (11155111)

## 注意事项

1. **只展示有价格的代币**：系统会自动过滤掉没有价格数据的代币
2. **API 密钥**：需要配置主备两个 API 密钥，如果主密钥失败会自动切换到备用密钥
3. **价格获取**：每个代币都会单独请求价格，如果价格获取失败，该代币会被过滤掉
4. **缓存**：数据会缓存 30 秒，避免频繁请求

## 错误处理

- 如果 API 密钥未配置，会抛出错误
- 如果链不支持，会抛出错误
- 如果代币价格获取失败，该代币会被静默过滤（不显示错误）
- 如果所有 API 密钥都失败，会抛出错误

## 参考

实现参考了 `/home/star/tools/🌐静态网页/7702-MM-scavenger` 项目中的 `AssetChecker.tsx` 组件。

