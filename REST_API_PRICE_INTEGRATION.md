# REST API 价格集成说明

## 概述

已成功将 REST API 价格获取集成到自动兑换计算中。现在系统优先使用 Data API Service (REST API) 来获取代币价格，而不是依赖已禁用的 Trading API 或 GraphQL API。

## 实现内容

### 1. 新增 Hook: `useTokenPriceFromRest`

**文件**: `packages/uniswap/src/features/transactions/hooks/useTokenPriceFromRest.ts`

**功能**: 从 REST API 获取代币的 USD 价格（每单位代币的 USD 价格）

**工作原理**:
1. 使用 `useRestTokenBalanceMainParts` 获取代币的总 USD 价值
2. 使用 `useRestTokenBalanceQuantityParts` 获取代币的数量
3. 计算价格：`价格 = 总价值 / 数量`

**使用限制**:
- 需要用户连接钱包
- 只能获取钱包中已有的代币价格
- 如果钱包中没有某个代币，可能无法获取其价格

### 2. 修改 `useDerivedSwapInfo`

**文件**: `packages/uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useDerivedSwapInfo.ts`

**主要变更**:
1. 导入 `useTokenPriceFromRest` hook
2. 使用 REST API 价格作为主要价格源
3. 保留从交易路由提取价格作为备用方案
4. 稳定币价格直接设为 1 USD

**价格获取优先级**:
1. **优先**: REST API 价格 (`useTokenPriceFromRest`)
2. **备用**: 稳定币价格（如果是稳定币，直接返回 1）
3. **最后**: 从交易路由提取价格（如果 `displayableTrade` 存在）

## 工作流程

```
用户输入代币数量
  ↓
useDerivedSwapInfo
  ↓
useTokenPriceFromRest (输入代币) → REST API → 输入代币价格
useTokenPriceFromRest (输出代币) → REST API → 输出代币价格
  ↓
如果 REST API 无法获取价格:
  - 检查是否为稳定币 → 返回 1
  - 尝试从交易路由提取价格
  ↓
计算基于 USD 价值的输出金额
  ↓
显示自动换算结果
```

## 使用场景

### ✅ 可以工作的场景

1. **用户已连接钱包**:
   - 如果钱包中有输入/输出代币，可以获取价格
   - 自动兑换功能可以正常工作

2. **稳定币交易**:
   - 稳定币价格直接设为 1 USD
   - 无需 REST API 查询

3. **钱包中有代币余额**:
   - REST API 会返回代币的总价值和数量
   - 可以计算每单位代币的价格

### ⚠️ 可能无法工作的场景

1. **用户未连接钱包**:
   - REST API 需要钱包地址才能查询
   - 可能无法获取价格

2. **钱包中没有代币**:
   - 如果钱包中没有某个代币，REST API 可能不会返回该代币的数据
   - 无法计算价格

3. **新代币或冷门代币**:
   - 如果代币不在 REST API 的数据库中，可能无法获取价格

## 调试信息

代码中添加了 `console.log` 来帮助调试价格获取过程：

- `使用 REST API 获取输入代币价格`
- `使用 REST API 获取输出代币价格`
- `输入代币是稳定币，价格为 1 USD`
- `输出代币是稳定币，价格为 1 USD`
- `从交易路由提取输入代币价格`
- `通过交易比例计算输入代币价格`

## 未来改进

如果需要支持没有钱包地址的情况，可以考虑：

1. **使用代币列表 API**:
   - 查询所有代币的价格，而不仅仅是钱包中的代币
   - 可能需要额外的 API 端点

2. **缓存价格数据**:
   - 缓存已获取的价格，减少 API 调用
   - 提高性能

3. **多价格源回退**:
   - REST API → 交易路由 → 链上价格 → 第三方 API
   - 确保在各种情况下都能获取价格

## 总结

✅ **已完成**: 基于 REST API 的自动兑换计算已实现
✅ **优先级**: REST API 价格 > 稳定币价格 > 交易路由价格
⚠️ **限制**: 需要用户连接钱包，且钱包中需要有代币余额

