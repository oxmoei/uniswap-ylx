# DEX 开发指南：基于 Uniswap 前端项目开发自己的 DEX

本文档说明如何使用 Uniswap 前端项目开发自己的去中心化交易所（DEX）。

## 📋 目录

1. [项目架构概览](#项目架构概览)
2. [必需的后端服务](#必需的后端服务)
3. [配置替换](#配置替换)
4. [智能合约要求](#智能合约要求)
5. [实施步骤](#实施步骤)
6. [可选功能](#可选功能)

---

## 🏗️ 项目架构概览

Uniswap 是一个**纯前端项目**，依赖以下外部服务：

- **Entry Gateway API** - 会话管理、用户认证
- **Trading API** - 交易报价、订单管理
- **GraphQL API** - 代币数据、池数据、交易历史
- **Routing API** - 交易路由计算
- **智能合约** - Uniswap V2/V3/V4 协议合约

---

## 🔧 必需的后端服务

### 1. Entry Gateway API（会话服务）

**核心功能：**

会话服务是用户与后端交互的基础，主要负责：

1. **会话初始化和管理**
   - 为每个用户/设备创建唯一会话 ID
   - 管理会话生命周期（创建、升级、删除）
   - 在 Web 端通过 Cookie 自动管理，移动端/扩展通过 Header 传递

2. **设备标识管理**
   - 生成和管理设备 ID（Device ID）
   - 用于追踪用户设备和防止滥用
   - 存储在本地存储中，持久化保存

3. **机器人防护（Bot Protection）**
   - 实现挑战-响应机制（Challenge-Response）
   - 支持多种挑战类型：
     - **Turnstile**：Cloudflare 的验证服务
     - **Hashcash**：工作量证明验证
   - 防止自动化脚本和机器人攻击

4. **会话升级机制**
   - 初始会话可能处于"受限"状态
   - 通过完成挑战来"升级"会话，获得完整权限
   - 支持自动升级和手动升级两种模式

5. **请求认证**
   - 所有后端 API 请求自动携带会话信息：
     - Web 端：通过 Cookie（`x-session-id`）
     - 移动端/扩展：通过 Header（`X-Session-ID`、`X-Device-ID`）
   - 后端通过会话 ID 识别用户并应用访问控制

**工作流程：**

```
1. 应用启动
   ↓
2. 调用 InitSession
   ↓
3. 后端返回：
   - sessionId（如果不需要挑战）
   - needChallenge: true（如果需要验证）
   ↓
4. 如果需要挑战：
   - 请求挑战（requestChallenge）
   - 解决挑战（Turnstile/Hashcash）
   - 升级会话（upgradeSession）
   ↓
5. 会话建立完成
   ↓
6. 后续所有 API 请求自动携带会话信息
```

**需要实现的 gRPC-Web 接口：**

```protobuf
service SessionService {
  // 初始化会话
  rpc InitSession(InitSessionRequest) returns (InitSessionResponse);
  
  // 请求挑战（用于机器人防护）
  rpc Challenge(ChallengeRequest) returns (ChallengeResponse);
  
  // 验证挑战并升级会话
  rpc Verify(VerifyRequest) returns (VerifyResponse);
}
```

**请求/响应示例：**

**InitSession 请求：**
- 可能包含设备 ID（首次访问）
- 可能包含现有会话 ID（续期）

**InitSession 响应：**
```typescript
{
  sessionId?: string,        // 会话 ID（如果不需要挑战）
  needChallenge: boolean,    // 是否需要完成挑战
  extra: Record<string, string>  // 额外信息
}
```

**Challenge 响应：**
```typescript
{
  challengeId: string,        // 挑战 ID
  challengeType: ChallengeType,  // TURNSTILE 或 HASHCASH
  extra: Record<string, string>  // 挑战相关数据（如 Turnstile site key）
}
```

**实际用途：**

1. **用户追踪和分析**
   - 追踪用户行为（不依赖钱包地址）
   - 分析用户使用模式
   - 统计活跃用户数

2. **访问控制**
   - 限制未认证用户的访问
   - 实施速率限制（Rate Limiting）
   - 防止 API 滥用

3. **安全防护**
   - 防止机器人攻击
   - 防止 DDoS 攻击
   - 检测异常行为

4. **个性化服务**
   - 基于会话提供个性化内容
   - 保存用户偏好设置
   - 跨设备同步（如果实现）

**配置位置：**
- `packages/api/src/getEntryGatewayUrl.ts` - API 端点配置
- `packages/api/src/clients/base/urls.ts` - URL 常量
- `packages/api/src/provideSessionService.web.ts` - Web 端实现
- `packages/sessions/src/` - 会话服务核心逻辑
- `apps/web/vite/entry-gateway-proxy.ts` - 开发代理配置

**环境变量：**
```bash
# 直接指定后端 URL
ENTRY_GATEWAY_API_URL_OVERRIDE=https://your-backend.com

# 或使用 Vite 代理（开发环境）
VITE_ENABLE_ENTRY_GATEWAY_PROXY=true
VITE_BACKEND_URL=https://your-backend.com

# 禁用会话服务（不推荐，但可用于测试）
# 需要在代码中设置 getIsSessionServiceEnabled() 返回 false
```

**最小化实现建议：**

如果不想实现完整的机器人防护，可以：

1. **简化版本**：
   - 只实现 `InitSession`，始终返回 `sessionId`
   - 设置 `needChallenge: false`
   - 跳过挑战相关接口

2. **使用 Cookie 管理**：
   - Web 端通过 HTTP Cookie 自动管理会话
   - 移动端/扩展通过 Header 传递会话 ID

3. **设备 ID 生成**：
   - 客户端生成 UUID 作为设备 ID
   - 存储在本地存储中
   - 首次访问时发送给后端

**注意事项：**

- 会话服务是**可选的**，可以通过配置禁用
- 如果禁用，其他 API 可能无法正常工作（取决于后端实现）
- 建议至少实现基本的会话管理，用于用户追踪和访问控制

---

### 💰 关于费用和是否必须使用

#### 1. Entry Gateway API 需要付费吗？

**答案：不需要付费，但需要自己实现。**

- Uniswap 的 Entry Gateway API 是**私有服务**，不对外提供
- 如果你要开发自己的 DEX，需要**自己搭建**这个服务
- 不存在"付费使用 Uniswap 的 Entry Gateway API"的情况
- 你需要自己实现 gRPC-Web 服务，部署在自己的服务器上

**成本考虑：**
- 服务器成本（自托管或云服务）
- 开发时间成本（实现服务逻辑）
- 维护成本（监控、更新等）

#### 2. 是否可以不使用会话服务？

**答案：可以完全禁用。**

会话服务是**完全可选的**，可以通过以下方式禁用：

**方法 1：环境变量（推荐）**

在 `.env.development` 或 `.env.production` 中：

```bash
# 禁用会话服务
ENABLE_SESSION_SERVICE=false
```

或者直接不设置这个环境变量（默认为 `false`）。

**方法 2：修改代码配置**

如果使用功能开关（Feature Flag），可以通过 Statsig 等配置服务禁用。

**禁用后的行为：**

当禁用会话服务时：
- 会使用 `createNoopSessionService()`（空操作服务）
- 所有会话相关方法返回默认值，**不会实际调用后端**
- `InitSession` 返回 `{ needChallenge: false, extra: {} }`
- 不会发送任何网络请求到 Entry Gateway

**代码位置：**
- `packages/gating/src/getIsSessionServiceEnabled.ts` - 判断是否启用
- `packages/config/src/getConfig.web.ts` - 读取环境变量
- `packages/sessions/src/session-service/createNoopSessionService.ts` - 空操作实现

#### 3. 禁用会话服务的影响

**可能的影响：**

1. **其他后端服务可能无法工作**
   - 如果 Trading API、GraphQL API 等依赖会话 ID 进行认证
   - 这些服务可能会返回 401 Unauthorized 错误
   - **解决方案**：修改后端服务，使其不依赖会话认证

2. **用户追踪功能缺失**
   - 无法追踪用户行为（不依赖钱包地址）
   - 无法进行用户分析
   - **影响**：主要是分析功能，不影响核心交易功能

3. **安全防护缺失**
   - 无法进行机器人防护
   - 无法实施速率限制（基于会话）
   - **影响**：可能面临更多自动化攻击

4. **访问控制缺失**
   - 无法基于会话进行访问控制
   - 无法限制未认证用户的访问
   - **影响**：需要其他方式实现访问控制

#### 4. 最小化实现建议

如果你不想实现完整的会话服务，可以考虑：

**选项 A：完全禁用（最简单）**
```bash
# .env.development
ENABLE_SESSION_SERVICE=false
```

**选项 B：实现最小化版本**
- 只实现 `InitSession`，始终返回成功
- 不实现挑战机制
- 不实现会话升级
- 仅用于生成会话 ID（如果需要）

**选项 C：使用简单的 Cookie 认证**
- 后端通过 HTTP Cookie 管理会话
- 前端自动携带 Cookie
- 不需要额外的 gRPC-Web 服务

#### 5. 实际使用建议

**对于开发自己的 DEX：**

1. **初期开发阶段**：
   - 建议禁用会话服务，专注于核心功能
   - 使用环境变量 `ENABLE_SESSION_SERVICE=false`

2. **生产环境**：
   - 如果其他后端服务不依赖会话，可以继续禁用
   - 如果需要用户追踪或安全防护，建议实现简化版本
   - 如果后端服务依赖会话，必须实现（至少是最小化版本）

3. **替代方案**：
   - 使用钱包地址作为用户标识
   - 使用 JWT Token 进行认证
   - 使用 IP 地址进行速率限制

**总结：**
- ✅ **可以完全禁用**会话服务
- ✅ **不需要付费**（需要自己实现）
- ⚠️ **可能影响**其他后端服务的正常工作
- 💡 **建议**：根据你的后端架构决定是否实现

---

### 2. Trading API（交易 API）

**功能：**
- 交易报价（Quote）
- 订单创建和管理
- 委托检查（Delegation）
- 可交换代币列表

**需要实现的端点：**
- `POST /v1/quote` - 获取交易报价
- `POST /v1/wallet/check_delegation` - 检查钱包委托
- `GET /v1/swappable_tokens` - 获取可交换代币列表
- `POST /v1/orders` - 创建订单
- `GET /v1/orders/{orderId}` - 查询订单状态

**配置位置：**
- `packages/api/src/clients/trading/`
- 使用 OpenAPI 规范生成客户端代码

**环境变量：**
```bash
REACT_APP_TRADING_API_URL_OVERRIDE=your-trading-api-url
```

---

### 3. GraphQL API（数据服务）

**功能：**
- 代币信息和价格
- 流动性池数据
- 交易历史
- NFT 数据
- 用户余额

**需要实现的查询：**
- `Token` - 代币详情
- `TokenProject` - 代币项目信息
- `Pool` - 池数据
- `Transaction` - 交易历史
- `Portfolio` - 用户投资组合

**配置位置：**
- `packages/api/src/clients/graphql/`
- GraphQL schema 定义在 `packages/api/src/clients/graphql/schema.graphql`

**环境变量：**
```bash
REACT_APP_AWS_API_ENDPOINT=your-graphql-endpoint
```

---

### 4. Routing API（路由服务）

**功能：**
- 计算最优交易路径
- 支持多种路由策略（Classic、UniswapX）
- 价格估算

**需要实现的端点：**
- `POST /quote` - 获取路由报价

**配置位置：**
- `apps/web/src/state/routing/slice.ts`
- 使用 `REACT_APP_UNISWAP_GATEWAY_DNS` 环境变量

**环境变量：**
```bash
REACT_APP_UNISWAP_GATEWAY_DNS=your-routing-api-url
```

---

## ⚙️ 配置替换

### 1. 环境变量配置

创建 `.env.development` 和 `.env.production` 文件：

```bash
# 后端服务端点
REACT_APP_AWS_API_ENDPOINT=https://your-graphql-api.com
REACT_APP_UNISWAP_GATEWAY_DNS=https://your-routing-api.com
REACT_APP_TRADING_API_URL_OVERRIDE=https://your-trading-api.com
ENTRY_GATEWAY_API_URL_OVERRIDE=https://your-entry-gateway.com

# 启用代理（本地开发）
VITE_ENABLE_ENTRY_GATEWAY_PROXY=true
VITE_BACKEND_URL=https://your-entry-gateway.com

# 其他配置
REACT_APP_STAGING=false
REACT_APP_ANALYTICS_ENABLED=false
```

### 2. 修改 API 客户端配置

**文件：`packages/api/src/clients/base/urls.ts`**

```typescript
// 替换 Cloudflare 前缀和域名
export function getCloudflareApiBaseUrl(flow?: TrafficFlows): string {
  return `https://your-api-domain.com/${flow || ''}`
}

// 替换 Entry Gateway URL
export const DEV_ENTRY_GATEWAY_API_BASE_URL = 'https://your-dev-api.com'
export const STAGING_ENTRY_GATEWAY_API_BASE_URL = 'https://your-staging-api.com'
export const PROD_ENTRY_GATEWAY_API_BASE_URL = 'https://your-prod-api.com'
```

### 3. 品牌定制

**替换品牌名称和链接：**
- `apps/web/src/utils/env.ts` - 域名检查
- `apps/web/src/utils/openDownloadApp.ts` - 应用下载链接
- 所有包含 "uniswap" 的字符串和 URL

**替换 Logo 和图标：**
- `apps/web/public/` - 静态资源
- `apps/web/src/components/` - Logo 组件

---

## 🔐 智能合约要求

### 必需合约

1. **Uniswap V2/V3 核心合约**
   - Factory 合约
   - Router 合约
   - Pool 合约

2. **Universal Router**（可选但推荐）
   - 统一路由合约，支持多种交易类型

3. **Permit2**（可选）
   - 代币授权管理

4. **UniswapX**（可选）
   - 链下订单系统

### 合约地址配置

查找并替换所有合约地址配置：
- `packages/uniswap/src/constants/addresses.ts`
- `packages/uniswap/src/constants/chains.ts`

---

## 📝 实施步骤

### 阶段 1：基础设置

1. **克隆并安装依赖**
   ```bash
   git clone <your-fork>
   cd uniswap
   bun install
   ```

2. **创建环境变量文件**
   ```bash
   cp .env.example .env.development
   # 编辑 .env.development 填入你的后端地址
   ```

3. **修改品牌信息**
   - 替换所有 "Uniswap" 文本
   - 替换 Logo 和图标
   - 更新域名检查逻辑

### 阶段 2：后端服务集成

1. **实现 Entry Gateway API**
   - 创建 gRPC-Web 服务
   - 实现会话管理
   - 配置代理或直接连接

2. **实现 Trading API**
   - 创建 REST API
   - 实现报价、订单等端点
   - 更新 OpenAPI schema 并重新生成客户端

3. **实现 GraphQL API**
   - 创建 GraphQL 服务
   - 实现数据查询
   - 更新 schema 并重新生成类型

4. **实现 Routing API**
   - 创建路由计算服务
   - 实现报价端点
   - 集成智能合约调用

### 阶段 3：智能合约部署

1. **部署核心合约**
   - Factory
   - Router
   - Pools

2. **更新合约地址**
   - 在配置文件中更新所有合约地址

3. **测试集成**
   - 测试代币交换
   - 测试流动性添加/移除
   - 测试路由计算

### 阶段 4：测试和优化

1. **功能测试**
   - 所有交易流程
   - 钱包连接
   - 数据加载

2. **性能优化**
   - API 响应时间
   - 前端加载速度
   - 缓存策略

---

## 🎯 可选功能

### 1. Cloudflare Workers（边缘函数）

**用途：**
- SEO meta tag 注入
- 动态图片生成

**是否需要：**
- 如果不需要 SEO 优化，可以禁用
- 已在开发模式禁用（见 `vite.config.mts`）

### 2. 分析服务

**当前使用：**
- Amplitude
- Datadog

**替换：**
- `apps/web/src/tracing/amplitude.ts`
- `apps/web/src/tracing/datadog.ts`

### 3. 通知服务

**当前使用：**
- Uniswap Notification Service

**替换：**
- `packages/notifications/`
- `apps/web/src/notification-service/`

---

## 🚀 快速开始（最小化配置）

如果你只想快速测试前端，可以：

1. **禁用后端依赖**
   - 修改代码跳过 API 调用
   - 使用模拟数据

2. **使用公共 RPC**
   - 配置公共以太坊 RPC 节点
   - 直接与链上合约交互（如果合约已部署）

3. **最小化后端**
   - 只实现 Routing API（用于报价）
   - 使用链上数据替代 GraphQL API

---

## 📚 相关资源

- [Uniswap V2 文档](https://docs.uniswap.org/contracts/v2/overview)
- [Uniswap V3 文档](https://docs.uniswap.org/contracts/v3/overview)
- [GraphQL 文档](https://graphql.org/learn/)
- [gRPC-Web 文档](https://github.com/grpc/grpc-web)

---

## ⚠️ 注意事项

1. **许可证**：Uniswap 前端项目使用 GPL-3.0 许可证，确保遵守许可证要求

2. **安全性**：
   - 所有 API 端点需要适当的认证和授权
   - 实现 CORS 策略
   - 验证所有用户输入

3. **性能**：
   - 实现适当的缓存策略
   - 优化 API 响应时间
   - 考虑使用 CDN

4. **测试**：
   - 在测试网络上充分测试
   - 进行安全审计
   - 实现监控和日志

---

## 🆘 常见问题

**Q: 我可以只使用前端，不实现后端吗？**
A: 部分功能可以，但交易报价、订单管理等核心功能需要后端支持。

**Q: 必须使用 Uniswap 合约吗？**
A: 不一定，但需要修改大量代码来适配其他 DEX 协议。

**Q: 如何替换品牌？**
A: 全局搜索 "uniswap" 和 "Uniswap"，替换为你的品牌名称。

**Q: 需要多少后端开发工作？**
A: 取决于你的需求。最小化配置需要实现 Routing API，完整功能需要实现所有四个后端服务。

---

## 📞 获取帮助

如果遇到问题：
1. 查看项目文档和代码注释
2. 检查环境变量配置
3. 查看浏览器控制台错误
4. 检查网络请求是否成功

---

**最后更新：** 2024年

