import type { CustomToken } from './customTokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * 预设的自定义代币列表
 * 
 * 这些代币会在应用初始化时自动添加到localStorage中。
 * 如果代币已存在（通过链ID和地址判断），则不会重复添加。
 * 
 * 如何添加新代币：
 * 
 * 1. 在下面的数组中添加新的代币对象
 * 2. 确保提供所有必需字段：chainId, address, symbol, name, decimals
 * 3. 可选字段：logoURI（代币图标URL）, priceUSD（代币价格，如果不提供会尝试从Moralis API获取）
 * 
 * 示例：
 * 
 * ```typescript
 * {
 *   chainId: UniverseChainId.Mainnet,  // 链ID：1 = Ethereum, 56 = BNB Chain, 137 = Polygon 等
 *   address: '0x...',                   // 代币合约地址（必须是小写或混合大小写）
 *   symbol: 'TOKEN',                    // 代币符号（显示在UI中）
 *   name: 'Token Name',                 // 代币全名
 *   decimals: 18,                       // 小数位数（通常是18）
 *   logoURI: 'https://...',             // 可选：代币图标URL
 *   priceUSD: 1.5,                      // 可选：代币价格（USD），如果不提供会尝试从Moralis获取
 * }
 * ```
 * 
 * 支持的链ID（UniverseChainId）：
 * - UniverseChainId.Mainnet (1) - Ethereum主网
 * - UniverseChainId.Bnb (56) - BNB Chain
 * - UniverseChainId.Polygon (137) - Polygon
 * - UniverseChainId.ArbitrumOne (42161) - Arbitrum
 * - UniverseChainId.Base (8453) - Base
 * - UniverseChainId.Optimism (10) - Optimism
 * - UniverseChainId.Avalanche (43114) - Avalanche
 * - 等等...（查看 UniverseChainId 枚举获取完整列表）
 * 
 * 注意事项：
 * - 地址会自动转换为小写进行比较，但建议使用正确的大小写格式
 * - logoURI 可以是任何可访问的图片URL（建议使用 PNG 或 SVG）
 * - priceUSD 如果未提供，系统会尝试从 Moralis API 获取，如果获取失败则显示为 0
 * - 代币添加后，如果钱包中有余额，会自动显示在"你的代币"列表中
 */
export const PRESET_CUSTOM_TOKENS: CustomToken[] = [
  // 示例1：BNB Chain上的代币
  {
    chainId: UniverseChainId.Bnb, // 56 - BNB Chain
    address: '0xbfb4681A90F1584f0DB8688553C8f882C4484444',
    symbol: '1',
    name: '1',
    decimals: 18,
    logoURI: 'https://static.four.meme/market/651c4fd9-01e7-4265-bd6c-be9a1b37a3c716221836807844210141.png',
    priceUSD: 1.5, // 可选：如果未提供，会尝试从Moralis API获取
  },

  // 示例2：Ethereum主网上的代币（注释掉的示例）
  // {
  //   chainId: UniverseChainId.Mainnet, // 1 - Ethereum主网
  //   address: '0x1234567890123456789012345678901234567890',
  //   symbol: 'EXAMPLE',
  //   name: 'Example Token',
  //   decimals: 18,
  //   logoURI: 'https://example.com/token-logo.png', // 可选
  //   priceUSD: 0.5, // 可选
  // },

  // 示例3：Polygon上的代币（注释掉的示例）
  // {
  //   chainId: UniverseChainId.Polygon, // 137 - Polygon
  //   address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  //   symbol: 'POLY',
  //   name: 'Polygon Token',
  //   decimals: 18,
  //   // logoURI 和 priceUSD 都是可选的
  // },
]

/**
 * 初始化预设代币
 * 
 * 在应用启动时自动调用，将 PRESET_CUSTOM_TOKENS 数组中的代币添加到 localStorage。
 * 
 * 工作流程：
 * 1. 检查 localStorage 中是否已存在该代币（通过链ID和地址判断，不区分大小写）
 * 2. 如果不存在，则添加该代币
 * 3. 如果已存在，则跳过（不会重复添加或覆盖）
 * 
 * 调用时机：
 * - 在 apps/web/src/index.tsx 中应用启动时自动调用
 * - 也可以手动调用：import { initializePresetCustomTokens } from 'uniswap/src/features/tokens/presetCustomTokens'
 *                    initializePresetCustomTokens()
 * 
 * 注意事项：
 * - 只在浏览器环境中执行（服务端渲染时跳过）
 * - 使用动态导入避免循环依赖
 * - 如果添加失败，会在控制台输出错误信息，但不会中断应用启动
 */
export function initializePresetCustomTokens(): void {
  if (typeof window === 'undefined') {
    return
  }

  // 使用动态导入避免循环依赖
  import('./customTokens').then(({ getCustomTokens, addCustomToken }) => {
    PRESET_CUSTOM_TOKENS.forEach((token) => {
      try {
        // 获取已存在的自定义代币列表
        const existingTokens = getCustomTokens()
        
        // 检查代币是否已存在（通过链ID和地址判断，地址不区分大小写）
        const exists = existingTokens.some(
          (t) => t.chainId === token.chainId && t.address.toLowerCase() === token.address.toLowerCase()
        )

        if (!exists) {
          // 代币不存在，添加到localStorage
          addCustomToken(token)
          console.log(`[initializePresetCustomTokens] Added preset token: ${token.symbol} (${token.address})`)
        } else {
          // 代币已存在，跳过
          console.log(`[initializePresetCustomTokens] Token already exists: ${token.symbol} (${token.address})`)
        }
      } catch (error) {
        // 添加失败时记录错误，但不中断应用启动
        console.error(`[initializePresetCustomTokens] Failed to add preset token ${token.symbol}:`, error)
      }
    })
  })
}

