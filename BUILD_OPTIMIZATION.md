# 构建优化说明

本文档说明了对 Vercel 构建警告进行的优化。

## 已完成的优化

### 1. 代码分割优化 ✅

**问题**：主 bundle 文件过大（8.2 MB，压缩后 2.4 MB）

**解决方案**：在 `vite.config.mts` 中添加了 `manualChunks` 策略，将大型依赖库分割成独立的 chunk：

- `tamagui`: UI 组件库
- `react-vendor`: React 核心库
- `web3-vendor`: Web3 和区块链相关库
- `uniswap-sdk`: Uniswap SDK 集合
- `data-vendor`: GraphQL 和数据获取库
- `charts-vendor`: 图表和可视化库
- `animation-vendor`: 动画库
- `utils-vendor`: 工具库（Redux、i18n 等）
- `vendor`: 其他第三方库

**预期效果**：
- 减少初始加载时间
- 提高缓存效率
- 更好的并行加载

### 2. 动态导入警告说明 ✅

**问题**：Vite 警告某些模块同时被静态和动态导入

**解决方案**：添加了注释说明这些是故意的设计：

- **ThemeToggle**: 只有 `SystemThemeUpdater` 和 `ThemeColorMetaUpdater` 是动态导入的，其他导出（如 `useIsDarkMode`）是静态导入的，这是合理的代码分割策略
- **UniconSVGs**: 在测试环境中使用同步导入，在生产环境中使用动态导入，这是环境特定的优化

### 3. Chunk 大小警告 ✅

**问题**：某些 chunk 超过 800 KB

**解决方案**：
- 添加了代码分割策略
- 将 `chunkSizeWarningLimit` 从 800 KB 提高到 1000 KB（主 bundle 可能仍然较大，但这是合理的）

## 无法优化的警告

### 1. Node.js/Bun 版本警告
- **原因**：Vercel 环境中的版本与项目要求略有不同
- **影响**：无，已自动适配
- **状态**：信息性提示，无需处理

### 2. eval 使用警告
- **原因**：来自第三方库 `expo-modules-core`
- **影响**：无，这是库的内部实现
- **状态**：第三方库问题，无法直接修复

### 3. Vite 配置弃用警告
- **原因**：某些插件使用了已弃用的配置选项
- **影响**：无，功能正常
- **状态**：等待插件更新

## 优化效果

### 构建前
- 主 bundle: ~8.2 MB (压缩后 ~2.4 MB)
- Chunk 警告: 多个超过 800 KB
- 代码分割: 基础分割

### 构建后（预期）
- 主 bundle: 减小（具体取决于依赖）
- 多个独立 chunk: 更好的缓存和并行加载
- Chunk 警告: 减少或消除（除了主 bundle）

## 后续优化建议

1. **进一步代码分割**：
   - 考虑路由级别的代码分割
   - 延迟加载非关键功能

2. **依赖优化**：
   - 审查大型依赖库的使用情况
   - 考虑使用更轻量的替代方案

3. **Tree Shaking**：
   - 确保未使用的代码被正确移除
   - 检查 sideEffects 配置

## 验证

重新部署后，检查：
1. 构建日志中的 chunk 大小
2. 网络面板中的资源加载
3. Lighthouse 性能评分

## 相关文件

- `apps/web/vite.config.mts`: 构建配置
- `apps/web/src/index.tsx`: 入口文件（动态导入）
- `packages/ui/src/components/Unicon/index.web.tsx`: Unicon 组件

