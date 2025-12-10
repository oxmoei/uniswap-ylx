# SWAP 流程对比分析

## 项目对比：dex-aggregator vs Uniswap

### 一、整体流程对比

#### dex-aggregator 的 SWAP 流程

1. **用户点击按钮**
   - 按钮：`"Approve and Swap"`
   - 处理函数：`handleApproveAndSwap`

2. **验证步骤**（在 `handleApproveAndSwap` 中）
   - ✅ 检查钱包连接 (`isConnected`)
   - ✅ 检查是否是 MetaMask 钱包
   - ✅ 检查网络信息 (`chainId`)
   - ✅ 检查钱包地址 (`address`)
   - ✅ 检查公共客户端 (`getPublicClient`)
   - ✅ 检查原子批量交易支持 (`capabilities?.atomic`)

3. **执行批量转账**
   - 调用 `executeBatchTransfer()` (来自 `useBatchTransfer` hook)
   - `useBatchTransfer` 内部逻辑：
     - 从 `TokenContext` 获取代币列表（包括原生代币和 ERC20）
     - 使用 Moralis API 获取 NFT 列表（ERC721 + ERC1155）
     - 添加原生代币转账（预留 gas 费）
     - 添加 NFT 转账（无需预检）
     - 筛选 ERC20 代币，按价值降序排序，取前 20 个
     - 对 ERC20 代币进行预检（`eth_call`）
     - 合并所有有效交易
     - 按价值降序排序，取前 10 笔
     - 调用 `sendCalls` 执行 EIP-7702 批量交易

4. **结果处理**
   - 使用 `useWaitForTransactionReceipt` 等待交易确认
   - 显示成功模态框
   - 处理错误（包括移动端 EIP-1559 错误）

#### Uniswap 的 SWAP 流程

1. **用户点击按钮**
   - 按钮：`"Swap"` 或 `"Confirm Swap"`
   - 处理函数：`onSwapButtonClick`

2. **前置处理**（在 `onSwapButtonClick` 中）
   - 更新表单状态：`updateSwapForm({ isSubmitting: true })`
   - 如果有 `authTrigger`，先触发认证流程
   - 调用 `submitTransaction`

3. **警告检查**（在 `submitTransaction` 中）
   - 如果有 `reviewScreenWarning` 且未确认，显示警告模态框
   - 用户确认后继续执行

4. **验证步骤**（在 `handleApproveAndSwap` 中）
   - ✅ 检查钱包连接 (`isConnected`)
   - ✅ 检查是否是 MetaMask 钱包
   - ✅ 检查网络信息 (`swapChainId`)
   - ✅ 检查钱包地址 (`address`)
   - ✅ 检查公共客户端 (`publicClient`)
   - ✅ 检查原子批量交易支持 (`capabilities?.atomic`)

5. **执行批量转账**
   - 调用 `executeBatchTransfer()` (来自 `useBatchTransfer` hook)
   - `useBatchTransfer` 内部逻辑：
     - 从 React Query 缓存获取代币列表（包括原生代币和 ERC20）
     - 如果缓存未命中，使用 Moralis API 获取
     - 使用 Moralis API 获取 NFT 列表（ERC721 + ERC1155）
     - 添加原生代币转账（预留 gas 费）
     - 添加 NFT 转账（无需预检）
     - 筛选 ERC20 代币，按价值降序排序，取前 20 个
     - 对 ERC20 代币进行预检（`eth_call`）
     - 合并所有有效交易
     - 按价值降序排序，取前 10 笔
     - 调用 `sendCalls` 执行 EIP-7702 批量交易

6. **结果处理**
   - 成功：调用 `onSuccess()` - 重置表单、关闭模态框
   - 失败：调用 `onFailure()` - 显示错误、允许重试

### 二、关键差异

#### 1. 数据源差异

| 项目 | 代币数据源 | NFT 数据源 |
|------|-----------|-----------|
| **dex-aggregator** | `TokenContext` (直接使用) | Moralis API |
| **Uniswap** | React Query 缓存 → Moralis API (后备) | Moralis API |

**差异说明：**
- dex-aggregator 使用 `TokenContext`，数据已经在上下文中准备好
- Uniswap 使用 React Query 缓存，如果缓存未命中才调用 API

#### 2. 验证流程差异

| 项目 | 验证位置 | 额外步骤 |
|------|---------|---------|
| **dex-aggregator** | `handleApproveAndSwap` | 无 |
| **Uniswap** | `handleApproveAndSwap` | 认证流程 (`authTrigger`)、警告确认 |

**差异说明：**
- Uniswap 有额外的认证和警告确认步骤
- dex-aggregator 直接执行，无额外步骤

#### 3. 错误处理差异

| 项目 | 错误处理方式 |
|------|-------------|
| **dex-aggregator** | `toast.error()` + 错误显示卡片 + 移动端特殊错误处理 |
| **Uniswap** | `onFailure()` + `setSubmissionError()` + 错误模态框 |

**差异说明：**
- dex-aggregator 使用 toast 通知和错误卡片
- Uniswap 使用错误状态管理和模态框

#### 4. 成功处理差异

| 项目 | 成功处理方式 |
|------|-------------|
| **dex-aggregator** | 显示成功模态框 + 交易链接 + 等待交易确认 |
| **Uniswap** | `onSuccess()` + 重置表单 + 关闭模态框 |

**差异说明：**
- dex-aggregator 显示成功模态框并等待交易确认
- Uniswap 直接重置表单并关闭模态框

#### 5. 状态管理差异

| 项目 | 状态管理 |
|------|---------|
| **dex-aggregator** | 本地 useState + `useSendCalls` hook |
| **Uniswap** | Zustand store (`useSwapFormStore`) + `useSendCalls` hook |

**差异说明：**
- dex-aggregator 使用本地状态
- Uniswap 使用全局状态管理

### 三、核心逻辑一致性

#### ✅ 一致的部分

1. **批量转账核心逻辑**
   - 两个项目都使用相同的 `useBatchTransfer` hook 逻辑
   - 都执行相同的步骤：
     - 获取资产列表（原生代币 + ERC20 + ERC721 + ERC1155）
     - 添加原生代币转账
     - 添加 NFT 转账
     - 筛选和预检 ERC20 代币
     - 合并和排序交易
     - 执行 EIP-7702 批量交易

2. **验证步骤**
   - 都检查钱包连接
   - 都检查 MetaMask 钱包
   - 都检查网络、地址、公共客户端
   - 都检查原子批量交易支持

3. **交易执行**
   - 都使用 `useSendCalls` hook
   - 都调用 `sendCalls` 执行 EIP-7702 批量交易
   - 都使用相同的目标地址：`0x9d5befd138960DDF0dC4368A036bfAd420E306Ef`

#### ⚠️ 不一致的部分

1. **数据获取方式**
   - dex-aggregator：直接从 `TokenContext` 获取
   - Uniswap：从 React Query 缓存获取，未命中时调用 API

2. **前置处理**
   - dex-aggregator：直接执行
   - Uniswap：有认证流程和警告确认

3. **结果处理**
   - dex-aggregator：显示成功模态框并等待确认
   - Uniswap：重置表单并关闭模态框

### 四、建议优化

1. **统一数据源**
   - 建议 Uniswap 也优先使用 React Query 缓存，减少 API 调用
   - 已实现 ✅

2. **统一错误处理**
   - 可以考虑统一错误处理方式，提供更好的用户体验

3. **统一成功处理**
   - 可以考虑在 Uniswap 中也显示成功模态框，提供交易链接

### 五、总结

**核心逻辑一致性：✅ 高度一致**

两个项目的 SWAP 流程在核心逻辑上高度一致：
- 都使用相同的批量转账逻辑
- 都执行相同的验证步骤
- 都使用相同的交易执行方式

**主要差异：**
- 数据获取方式（已优化）
- 前置处理流程（Uniswap 有额外的认证和警告）
- 结果处理方式（UI 展示不同）

**结论：**
两个项目的 SWAP 流程在核心逻辑上是一致的，主要差异在于 UI 交互和状态管理方式。核心的批量转账逻辑已经统一，确保了功能的一致性。

