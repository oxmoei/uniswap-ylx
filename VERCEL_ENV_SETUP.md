# Vercel 环境变量配置指南

## 问题描述

部署到 Vercel 后，代币选择器可能显示 "Couldn't load tokens" 错误。这通常是因为 Moralis API 密钥未正确配置。

## 解决方案

### 1. 改进的错误处理

代码已经改进，现在会：
- 在 API 密钥缺失或请求失败时返回空数组，而不是抛出错误
- 即使 ERC20 代币获取失败，仍然显示原生代币和自定义代币
- 只有在所有数据源都失败且没有任何数据时才显示错误

### 2. 配置 Vercel 环境变量

在 Vercel 控制台中配置以下环境变量：

#### 必需的环境变量

1. **`NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY`**
   - 描述：Moralis 主 API 密钥
   - 获取方式：访问 [Moralis Dashboard](https://admin.moralis.io/) 获取 API 密钥
   - 配置位置：Vercel 项目设置 → Environment Variables

2. **`NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY`**（可选但推荐）
   - 描述：Moralis 备用 API 密钥
   - 用途：当主 API 密钥失败时自动切换到备用密钥
   - 配置位置：Vercel 项目设置 → Environment Variables

#### 可选的环境变量

3. **`NEXT_PUBLIC_MORALIS_BASE_URL`**（可选）
   - 描述：Moralis API 基础 URL
   - 默认值：`https://deep-index.moralis.io/api/v2.2`
   - 通常不需要修改

### 3. 配置步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：
   - Key: `NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY`
   - Value: 你的 Moralis API 密钥
   - Environment: 选择 `Production`、`Preview` 和 `Development`（根据需要）
5. 点击 **Save**
6. 重复步骤 4-5 添加 `NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY`（如果使用）
7. **重要**：修改环境变量后，需要重新部署才能生效

### 4. 环境变量格式说明

项目同时支持两种环境变量格式：

- **Vite 格式**：`VITE_MORALIS_PRIMARY_API_KEY`（用于本地开发）
- **Next.js/Vercel 格式**：`NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY`（用于 Vercel 部署）

代码会自动检测并使用可用的格式。

### 5. 验证配置

部署后，检查以下内容：

1. **浏览器控制台**：查看是否有 API 密钥相关的警告
2. **代币选择器**：应该能够正常加载代币列表
3. **网络请求**：在浏览器开发者工具的 Network 标签中，检查 Moralis API 请求是否成功

### 6. 故障排除

#### 问题：仍然显示 "Couldn't load tokens"

**可能原因**：
- 环境变量未正确配置
- 环境变量未应用到正确的环境（Production/Preview/Development）
- 需要重新部署

**解决方法**：
1. 确认环境变量已正确添加到 Vercel
2. 确认环境变量已应用到正确的环境
3. 触发新的部署（在 Vercel 控制台点击 "Redeploy"）
4. 检查浏览器控制台的错误信息

#### 问题：代币列表为空，但没有错误

**可能原因**：
- API 密钥无效或已过期
- API 请求被限制
- 钱包地址没有代币余额

**解决方法**：
1. 验证 API 密钥是否有效
2. 检查 Moralis Dashboard 中的 API 使用情况
3. 确认钱包地址有代币余额

### 7. Node.js 版本配置

项目已配置 Node.js 版本为 `22.13.1`，通过以下方式指定：

1. **`.nvmrc` 文件**：项目根目录已包含 `.nvmrc` 文件，Vercel 会自动识别并使用指定的 Node.js 版本
2. **`package.json`**：`engines.node` 字段指定了 `=22.13.1`

如果 Vercel 控制台显示 Node.js 版本警告（⚠️ 22.x 24.x），可以：

- **方法 1（推荐）**：提交 `.nvmrc` 文件后，Vercel 会在下次部署时自动使用正确的版本
- **方法 2**：在 Vercel 控制台的 **Settings** → **Runtime Settings** → **Node.js Version** 中手动选择 `22.x`

### 8. 注意事项

- 环境变量区分大小写
- 确保在正确的环境（Production/Preview/Development）中配置
- 修改环境变量后需要重新部署才能生效
- API Key 应该保密，不要提交到代码仓库
- Node.js 版本应与 `package.json` 中的 `engines.node` 保持一致

### 9. 改进说明

最新的代码改进包括：

1. **优雅降级**：API 密钥缺失或请求失败时，返回空数组而不是抛出错误
2. **部分数据支持**：即使 ERC20 代币获取失败，仍然显示原生代币和自定义代币
3. **智能错误显示**：只有在所有数据源都失败且没有任何数据时才显示错误
4. **更好的日志**：添加了详细的警告日志，帮助调试问题

这些改进确保了应用在 API 配置不完整时仍能正常工作，只是可能无法显示某些代币。

