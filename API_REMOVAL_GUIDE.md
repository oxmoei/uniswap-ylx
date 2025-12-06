# API 移除指南

本文档说明已移除的 Trading API 和 GraphQL API 依赖，以及当前的价格获取方法。

## 已移除的 API

### 1. Trading API

**位置**: `packages/uniswap/src/data/apiClients/tradingApi/TradingApiClient.ts`

**功能**: 
- 获取交易报价 (`fetchQuote`)
- 获取指示性报价 (`fetchIndicativeQuote`)
- 执行交易 (`fetchSwap`)
- 获取订单 (`fetchOrders`)
- 检查钱包授权 (`checkWalletDelegation`)
- 流动性池操作 (`createLpPosition`, `increaseLpPosition`, `migrateV3ToV4LpPosition`)
- 交易计划管理 (`getExistingPlan`, `updateExistingPlan`, `createNewPlan`, `refreshExistingPlan`)

**移除方式**:
- 在 `packages/uniswap/src/features/repositories.ts` 中，`getEVMTradeRepository()` 现在使用存根函数 `disabledFetchQuote` 和 `disabledFetchIndicativeQuote`，这些函数返回空响应，不进行任何网络请求。

**影响**:
- `useTrade` hook 将无法获取交易报价
- 所有依赖 Trading API 的功能将无法正常工作
- 控制台可能仍会显示 401 错误（如果其他代码路径仍在调用 Trading API）

### 2. GraphQL API (Data API)

**位置**: `packages/uniswap/src/data/apiClients/dataApi/DataApiClient.ts`

**功能**:
- 获取代币现货价格 (`useTokenSpotPrice`)
- 获取代币市场统计数据 (`useTokenMarketStats`)
- 获取代币价格变化 (`useTokenPriceChange`)

**移除方式**:
- 在 `packages/uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData.ts` 中，`useTokenSpotPrice` 现在直接返回 `undefined`，不再调用 GraphQL API。

**影响**:
- 代币价格显示将不可用
- 代币市场统计数据将不可用

## 当前价格获取方法

### 之前的价格获取方法

1. **交易报价价格** (已移除):
   - 通过 `useTrade` -> `useTradeQuery` -> `tradeRepository.fetchQuote` -> `TradingApiClient.fetchQuote`
   - 从 Trading API 获取交易报价，报价中包含 `executionPrice` 或 `routes[0].midPrice`

2. **代币现货价格** (已移除):
   - 通过 `useTokenSpotPrice` -> GraphQL fragments (`useTokenMarketPartsFragment`, `useTokenProjectMarketsPartsFragment`)
   - 从 GraphQL API 获取代币的实时价格

### 当前状态

**所有价格获取方法已被禁用**。以下功能将无法正常工作：

1. **交易报价**: `useTrade` hook 返回的 `trade.trade` 将为 `null`
2. **代币价格**: `useTokenSpotPrice` 返回 `undefined`
3. **USD 价值换算**: `useDerivedSwapInfo` 中的 `inputTokenPriceUSD` 和 `outputTokenPriceUSD` 将为 `undefined`，导致基于 USD 的自动换算无法工作

## 如何实现自己的价格获取

如果您需要实现自己的价格获取逻辑，可以考虑以下方案：

### 方案 1: 链上价格获取

1. **使用 Uniswap V2/V3 池子价格**:
   - 直接从链上读取 Uniswap 池子的储备量
   - 计算代币价格：`price = reserveOut / reserveIn`

2. **使用 Chainlink 价格预言机**:
   - 调用 Chainlink 价格预言机合约获取代币价格

3. **使用其他链上价格源**:
   - 使用其他 DEX 的池子价格
   - 使用聚合价格预言机（如 Uniswap V3 TWAP）

### 方案 2: 第三方价格 API

1. **CoinGecko API**:
   - 免费 API，提供代币价格数据
   - 需要处理 CORS 问题（可能需要代理）

2. **CoinMarketCap API**:
   - 提供代币价格数据
   - 需要 API 密钥

3. **其他价格 API**:
   - 1inch API
   - 0x API

### 方案 3: 修改现有代码

1. **修改 `getEVMTradeRepository`**:
   - 在 `packages/uniswap/src/features/repositories.ts` 中实现自己的 `fetchQuote` 函数
   - 调用您自己的后端 API 或链上合约

2. **修改 `useTokenSpotPrice`**:
   - 在 `packages/uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData.ts` 中实现自己的价格获取逻辑
   - 调用您自己的价格源

## 其他 Trading API 调用

以下文件仍包含 Trading API 调用，但这些调用主要用于交易执行、订单管理等非价格获取功能：

- `packages/uniswap/src/features/transactions/swap/steps/swap.ts` - `TradingApiClient.fetchSwap`
- `packages/uniswap/src/features/transactions/swap/orders.ts` - `TradingApiClient.fetchOrders`
- `packages/uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository.ts` - `TradingApiClient.fetchSwap`, `fetchSwap7702`, `fetchSwap5792`
- `packages/uniswap/src/features/transactions/swap/plan/utils.ts` - 交易计划相关 API
- `packages/uniswap/src/features/transactions/liquidity/steps/migrate.ts` - `TradingApiClient.migrateV3ToV4LpPosition`
- `packages/uniswap/src/features/transactions/liquidity/steps/increasePosition.ts` - `TradingApiClient.createLpPosition`, `increaseLpPosition`

如果您不需要这些功能，可以忽略这些调用。如果需要，您也需要为这些功能实现替代方案。

## 总结

- ✅ Trading API 的价格获取功能已禁用（`fetchQuote`, `fetchIndicativeQuote`）
- ✅ GraphQL API 的价格获取功能已禁用（`useTokenSpotPrice`）
- ⚠️ 其他 Trading API 调用仍然存在，但主要用于非价格获取功能
- ⚠️ 当前所有价格获取方法都不可用，需要实现自己的价格获取逻辑

