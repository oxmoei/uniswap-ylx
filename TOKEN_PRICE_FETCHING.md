# 当前代币价值获取方式说明

## 概述

当前代码中，代币价值（USD价格）的获取有**两种不同的路径**：

1. **代币选择器/钱包余额显示**: 通过 **Data API Service (REST API)** 获取
2. **交易报价计算**: 通过 **交易路由（Trade Routes）** 获取（已禁用）

## 路径 1: Data API Service (REST API) - ✅ 仍在使用

**用途**: 代币选择器、钱包余额显示、代币列表中的 USD 价值

**位置**: 
- `packages/uniswap/src/data/rest/getPortfolio.ts`
- `packages/uniswap/src/features/dataApi/balances/balancesRest.ts`

**流程**:
```
usePortfolioTokenOptions
  ↓
usePortfolioBalancesForAddressById
  ↓
usePortfolioBalances
  ↓
usePortfolioData (REST API)
  ↓
portfolioClient.getPortfolio() (DataApiService)
  ↓
REST API 返回 balance.valueUsd
  ↓
convertRestBalanceToPortfolioBalance
  ↓
balanceUSD (TokenOption.balanceUSD)
  ↓
代币选择器中显示 USD 价值
```

**关键代码**:
- `getPortfolio.ts` 第 105 行: `await portfolioClient.getPortfolio(transformedInput)`
- `balancesRest.ts` 第 159 行: `const { valueUsd } = balance`
- `balancesRest.ts` 第 199 行: `balanceUSD: valueUsd`

**API 端点**: Data API Service (REST API)
- 基础 URL: `uniswapUrls.dataApiServiceUrl`
- 服务: `DataApiService.getPortfolio`
- 状态: ✅ **仍在工作**，这就是为什么您能在代币选择器中看到价格

## 路径 2: 交易路由价格提取 - ❌ 已禁用

## 价格获取路径

### 路径 1: `useDerivedSwapInfo` 中的价格提取

**文件**: `packages/uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useDerivedSwapInfo.ts`

**流程**:
```
useTrade (获取交易报价)
  ↓
trade.trade 或 trade.indicativeTrade (交易对象)
  ↓
displayableTrade.routes[0].midPrice 或 displayableTrade.executionPrice (价格对象)
  ↓
通过稳定币（USDC/USDT）换算成 USD 价格
  ↓
inputTokenPriceUSD / outputTokenPriceUSD
```

**关键代码位置**:
- 第 123-184 行: `inputTokenPriceUSD` 的计算
- 第 186-251 行: `outputTokenPriceUSD` 的计算

**价格提取逻辑**:
1. 从 `displayableTrade` 中获取价格对象：
   - 如果是经典交易（`isClassic`），使用 `routes[0].midPrice`
   - 否则使用 `executionPrice`
2. 检查价格是否相对于稳定币：
   - 如果是，直接计算 USD 价值
   - 如果不是，通过交易输入输出比例计算

### 路径 2: `useUSDCPrice` Hook

**文件**: `packages/uniswap/src/features/transactions/hooks/useUSDCPrice.ts`

**流程**:
```
useUSDCPrice(currency)
  ↓
useTrade (获取代币与稳定币的交易报价)
  ↓
trade.routes[0].midPrice (价格对象)
  ↓
Price<Currency, Stablecoin> (代币相对于稳定币的价格)
```

**关键代码位置**:
- 第 29-82 行: `useUSDCPrice` 函数
- 第 50-56 行: 调用 `useTrade` 获取代币与稳定币的报价
- 第 75-80 行: 从 `trade.routes[0].midPrice` 提取价格

**使用场景**:
- `useUSDCValue`: 计算代币数量的 USD 价值
- `useUSDCValueWithStatus`: 计算 USD 价值并返回加载状态
- 多个组件中使用，如 `SwapRateRatio`, `TransactionAmountsReview` 等

## 当前状态总结

### ✅ 仍在使用: Data API Service (REST API)

**功能**: 代币选择器、钱包余额显示中的 USD 价值

**状态**: ✅ **正常工作**

**原因**: Data API Service 是独立的 REST API，不依赖 Trading API 或 GraphQL API

### ❌ 已禁用: 交易路由价格提取

**功能**: 交易报价计算、基于 USD 的自动换算

**状态**: ❌ **无法工作**

**原因**: 由于 Trading API 已被禁用，`useTrade` hook 现在会返回 `null`：

1. **`getEVMTradeRepository`** 返回空响应：
   - `disabledFetchQuote()` 返回 `{ quote: null, routing: { type: 'classic' }, requestId: '' }`
   - `disabledFetchIndicativeQuote()` 同样返回空响应

2. **`useTrade` 返回 `null`**:
   - `trade.trade` = `null`
   - `trade.indicativeTrade` = `undefined`

3. **价格提取失败**:
   - `displayableTrade` = `null` 或 `undefined`
   - `inputTokenPriceUSD` = `undefined`
   - `outputTokenPriceUSD` = `undefined`
   - `useUSDCPrice` 返回 `{ price: undefined, isLoading: false }`

### 影响的功能

以下功能将无法正常工作：

1. **交易报价中的 USD 价值显示**:
   - 交易界面中代币数量的 USD 价值无法显示
   - `currencyAmountsUSDValue` 为 `null`

2. **基于 USD 的自动换算**:
   - `usdValueBasedOutputAmount` 为 `null`
   - 输入代币后，无法自动计算等值的输出代币数量

3. **交易相关的价格 UI**:
   - 交易比率显示
   - 交易界面中的 USD 价值提示
   - 价格影响警告

## 价格获取的数据流图

```
┌─────────────────────────────────────────────────────────┐
│                   用户输入代币数量                        │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              useDerivedSwapInfo                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  useTrade({ amountSpecified, otherCurrency })    │   │
│  └───────────────┬──────────────────────────────────┘   │
│                  │                                        │
│                  ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  getEVMTradeRepository()                          │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ disabledFetchQuote()                        │ │   │
│  │  │ → 返回空响应 { quote: null }                │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └───────────────┬──────────────────────────────────┘   │
│                  │                                        │
│                  ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  trade.trade = null                              │   │
│  │  trade.indicativeTrade = undefined               │   │
│  └───────────────┬──────────────────────────────────┘   │
│                  │                                        │
│                  ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  displayableTrade = null                          │   │
│  └───────────────┬──────────────────────────────────┘   │
│                  │                                        │
│                  ▼                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  inputTokenPriceUSD = undefined                   │   │
│  │  outputTokenPriceUSD = undefined                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 如何恢复价格获取功能

要恢复价格获取功能，您需要实现自己的价格源。有以下几种方案：

### 方案 1: 实现链上价格获取

修改 `getEVMTradeRepository` 中的 `disabledFetchQuote` 函数，改为从链上获取价格：

```typescript
async function fetchQuoteFromOnChain(params): Promise<DiscriminatedQuoteResponse> {
  // 1. 从链上读取 Uniswap 池子储备量
  // 2. 计算代币价格
  // 3. 构建报价响应
  // 4. 返回 DiscriminatedQuoteResponse
}
```

### 方案 2: 使用第三方价格 API

修改 `disabledFetchQuote` 函数，调用您自己的价格 API：

```typescript
async function fetchQuoteFromCustomAPI(params): Promise<DiscriminatedQuoteResponse> {
  // 1. 调用您的价格 API
  // 2. 获取代币价格
  // 3. 构建报价响应
  // 4. 返回 DiscriminatedQuoteResponse
}
```

### 方案 3: 直接修改价格提取逻辑

在 `useDerivedSwapInfo` 中，不依赖 `useTrade`，直接从您自己的价格源获取价格：

```typescript
const inputTokenPriceUSD = useMemo(() => {
  // 直接从您的价格源获取
  return fetchPriceFromYourSource(currencyIn)
}, [currencyIn])
```

## 总结

### 代币选择器/钱包余额 (✅ 正常工作)
- **价格来源**: Data API Service (REST API)
- **获取方式**: `portfolioClient.getPortfolio()` → `balance.valueUsd` → `balanceUSD`
- **状态**: ✅ **仍在工作**，这就是为什么您能在代币选择器中看到价格

### 交易报价计算 (❌ 已禁用)
- **价格来源**: 交易路由（Trade Routes）
- **获取方式**: `useTrade` → `displayableTrade.routes[0].midPrice` 或 `executionPrice`
- **状态**: ❌ **无法工作**，因为 Trading API 已禁用

### 关键发现

**为什么代币选择器中还能看到价格？**

因为代币选择器使用的是 **Data API Service (REST API)**，而不是 Trading API 或 GraphQL API。这个 API 是独立的，没有被禁用。

**为什么交易界面中无法显示价格？**

因为交易界面使用的是 **Trading API** 来获取交易报价，然后从报价中提取价格。由于 Trading API 已被禁用，交易报价无法获取，因此价格也无法显示。

### 需要实现

如果您想恢复交易界面中的价格显示和基于 USD 的自动换算功能，需要：
1. 实现自己的价格获取逻辑（链上价格、第三方 API 等）
2. 修改 `getEVMTradeRepository` 或 `useDerivedSwapInfo` 以使用新的价格源

