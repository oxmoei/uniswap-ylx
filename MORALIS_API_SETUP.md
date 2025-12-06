# Moralis API 配置指南

## 1. 获取 Moralis API 密钥

### 步骤 1: 注册 Moralis 账号

1. 访问 [Moralis 官网](https://moralis.io/)
2. 点击 "Sign Up" 注册账号
3. 完成邮箱验证

### 步骤 2: 创建 API 密钥

1. 登录 Moralis 控制台：https://admin.moralis.io/
2. 进入 **Settings** → **API Keys**
3. 点击 **Create API Key** 或使用现有的 API Key
4. 复制你的 API Key（格式类似：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 步骤 3: 获取备用 API 密钥（推荐）

为了确保服务的稳定性，建议配置两个 API 密钥：
- **主密钥（Primary）**：用于主要请求
- **备用密钥（Fallback）**：当主密钥失败时自动切换

你可以：
- 使用同一个账号创建多个 API Key
- 或者使用另一个 Moralis 账号的 API Key 作为备用

## 2. 配置 .env.local 文件

### 步骤 1: 创建或编辑 .env.local 文件

在项目根目录（`/home/star/tools/🌐静态网页/uniswap/`）创建或编辑 `.env.local` 文件。

### 步骤 2: 添加环境变量

在 `.env.local` 文件中添加以下内容：

```bash
# Moralis API 配置
# 主 API 密钥（必需）
NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY=your_primary_api_key_here

# 备用 API 密钥（推荐，用于主密钥失败时自动切换）
NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY=your_fallback_api_key_here

# Moralis API 基础 URL（可选，默认值：https://deep-index.moralis.io/api/v2.2）
NEXT_PUBLIC_MORALIS_BASE_URL=https://deep-index.moralis.io/api/v2.2
```

### 步骤 3: 替换 API 密钥

将 `your_primary_api_key_here` 和 `your_fallback_api_key_here` 替换为你实际的 Moralis API 密钥。

**完整示例：**

```bash
# Moralis API 配置
NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjEyMzQ1Njc4OTAiLCJvcmdhbml6YXRpb25JZCI6IjEyMzQ1Njc4OTAiLCJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidHlwZUlkIjoiMTIzNDU2Nzg5MCIsInR5cGUiOiJwcm9qZWN0IiwiaWF0IjoxNjAwMDAwMDAwfQ.example
NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjEyMzQ1Njc4OTAiLCJvcmdhbml6YXRpb25JZCI6IjEyMzQ1Njc4OTAiLCJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidHlwZUlkIjoiMTIzNDU2Nzg5MCIsInR5cGUiOiJwcm9qZWN0IiwiaWF0IjoxNjAwMDAwMDAwfQ.backup
NEXT_PUBLIC_MORALIS_BASE_URL=https://deep-index.moralis.io/api/v2.2
```

## 3. 验证配置

### 检查文件位置

确保 `.env.local` 文件位于项目根目录：

```
/home/star/tools/🌐静态网页/uniswap/
├── .env.local          ← 在这里
├── package.json
├── apps/
├── packages/
└── ...
```

### 检查环境变量

在代码中，环境变量应该以 `NEXT_PUBLIC_` 开头，这样它们才能在客户端代码中访问。

### 重启开发服务器

配置完成后，需要重启开发服务器才能生效：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
bun web start
# 或
npm run dev
```

## 4. 测试配置

### 方法 1: 检查控制台日志

启动应用后，打开浏览器控制台，查看是否有以下日志：

- ✅ 成功：`[fetchWalletERC20Tokens] 获取代币列表成功`
- ❌ 失败：`Moralis API 密钥未配置` 或 `Primary API failed`

### 方法 2: 测试 API 连接

你可以在浏览器控制台手动测试：

```javascript
// 检查环境变量是否加载
console.log('Primary API Key:', process.env.NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY ? '已配置' : '未配置')
console.log('Fallback API Key:', process.env.NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY ? '已配置' : '未配置')
```

## 5. 常见问题

### 问题 1: 环境变量未生效

**解决方案：**
- 确保文件名为 `.env.local`（注意前面的点）
- 确保文件在项目根目录
- 重启开发服务器
- 清除浏览器缓存

### 问题 2: API 密钥无效

**解决方案：**
- 检查 API 密钥是否正确复制（没有多余的空格）
- 确认 API 密钥在 Moralis 控制台中处于激活状态
- 检查 API 密钥的权限和配额

### 问题 3: 只配置了主密钥，没有备用密钥

**解决方案：**
- 可以只配置主密钥，但建议配置备用密钥以提高稳定性
- 如果只配置主密钥，将 `NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY` 留空或删除该行

### 问题 4: API 请求失败

**可能原因：**
- API 密钥配额已用完
- 网络连接问题
- Moralis 服务暂时不可用

**解决方案：**
- 检查 Moralis 控制台中的 API 使用情况
- 检查网络连接
- 稍后重试

## 6. 安全注意事项

⚠️ **重要：**

1. **不要将 `.env.local` 文件提交到 Git**
   - 确保 `.env.local` 在 `.gitignore` 文件中
   - 不要将 API 密钥分享给他人

2. **使用环境变量而不是硬编码**
   - 永远不要在代码中直接写入 API 密钥
   - 使用环境变量来管理敏感信息

3. **定期轮换 API 密钥**
   - 定期更新 API 密钥以提高安全性
   - 如果密钥泄露，立即在 Moralis 控制台中撤销

## 7. 示例 .env.local 文件

完整的 `.env.local` 文件示例：

```bash
# ============================================
# Moralis API 配置
# ============================================

# 主 API 密钥（必需）
# 从 https://admin.moralis.io/ 获取
NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY=your_primary_api_key_here

# 备用 API 密钥（推荐）
# 当主密钥失败时自动切换
NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY=your_fallback_api_key_here

# Moralis API 基础 URL（可选）
# 默认值：https://deep-index.moralis.io/api/v2.2
# 通常不需要修改
NEXT_PUBLIC_MORALIS_BASE_URL=https://deep-index.moralis.io/api/v2.2

# ============================================
# 其他环境变量（如果有）
# ============================================
# NEXT_PUBLIC_OTHER_VAR=value
```

## 8. 获取帮助

如果遇到问题：

1. **检查 Moralis 文档**：https://docs.moralis.io/
2. **查看 Moralis 控制台**：https://admin.moralis.io/
3. **联系 Moralis 支持**：通过 Moralis 控制台提交工单

## 9. 快速检查清单

配置前请确认：

- [ ] 已注册 Moralis 账号
- [ ] 已获取 API 密钥
- [ ] 已创建 `.env.local` 文件
- [ ] 已添加所有必需的环境变量
- [ ] 已替换占位符为实际 API 密钥
- [ ] 已重启开发服务器
- [ ] 已测试 API 连接

完成以上步骤后，Moralis API 配置就完成了！

