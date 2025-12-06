# Uniswap Labs: 前端界面

这是 Uniswap Labs 前端界面的**公开**代码库，包括 Web 应用、钱包移动应用和钱包扩展程序。Uniswap 是一个用于去中心化交换基于以太坊资产的协议。

## 界面

- Web: [app.uniswap.org](https://app.uniswap.org)
- Wallet（移动端 + 扩展程序）: [wallet.uniswap.org](https://wallet.uniswap.org)

## 安装与应用

### Web 应用（桌面端）

```bash
git clone git@github.com:Uniswap/interface.git
cd uniswap
bun install
bun web start
```

### 移动应用（iOS）

```bash
git clone git@github.com:Uniswap/interface.git
cd uniswap
bun install
bun lfg
```

有关每个应用程序或包的详细说明，请查看每个应用程序发布的 README：

- [Web](apps/web/README.md)
- [Mobile](apps/mobile/README.md)
- [Extension](apps/extension/README.md)

## 贡献

有关最佳贡献方式的说明，请查看我们的[贡献指南](CONTRIBUTING.md)！

## 社交媒体 / 联系方式

- X（原 Twitter）: [@Uniswap](https://x.com/Uniswap)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- 邮箱: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.com/invite/uniswap)
- LinkedIn: [Uniswap Labs](https://www.linkedin.com/company/uniswaporg)

## Uniswap 链接

- 网站: [uniswap.org](https://uniswap.org/)
- 文档: [uniswap.org/docs/](https://docs.uniswap.org/)

## 白皮书

- [V4](https://uniswap.org/whitepaper-v4.pdf)
- [V3](https://uniswap.org/whitepaper-v3.pdf)
- [V2](https://uniswap.org/whitepaper.pdf)
- [V1](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)

## 生产与发布流程

Uniswap Labs 在私有代码库中开发所有前端界面。
在每个开发周期结束时：

1. 我们将最新的生产就绪代码发布到此公开代码库。

2. 发布版本会自动标记 — 在[发布标签页](https://github.com/Uniswap/interface/releases)中查看。

**注意**：本地项目目录建议命名为 `uniswap`。

## 🗂 目录结构

| 文件夹      | 内容                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| `apps/`     | 每个独立应用程序的目录。                                      |
| `config/`   | 共享基础设施包和配置。                             |
| `packages/` | 共享代码包，涵盖 UI、共享功能和共享工具。  |
