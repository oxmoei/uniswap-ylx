/**
 * 自定义代币配置使用示例
 * 
 * 这个文件展示了如何使用自定义代币配置系统来设置代币的价格、logo等信息
 */

import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  setCustomTokenInfo,
  setCustomTokenConfigs,
  getCustomTokenInfo,
  getTokenPrice,
  clearCustomTokenConfigs,
  type CustomTokenInfo,
} from './customTokenConfig'

// 示例 1: 设置单个代币的自定义信息
export function example1_SetSingleToken() {
  // 创建一个代币实例
  const myToken = new Token(
    UniverseChainId.Mainnet,
    '0x1234567890123456789012345678901234567890',
    18,
    'MYTOKEN',
    'My Custom Token'
  )

  // 设置自定义信息
  setCustomTokenInfo(myToken, {
    priceUSD: 0.5, // 设置价格为 0.5 USD
    logoURI: 'https://example.com/mytoken-logo.png',
    name: 'My Custom Token',
    symbol: 'MYTOKEN',
  })

  // 获取自定义信息
  const info = getCustomTokenInfo(myToken)
  console.log('自定义信息:', info)

  // 获取价格（会优先使用自定义价格）
  const price = getTokenPrice(myToken)
  console.log('代币价格:', price) // 输出: 0.5
}

// 示例 2: 批量设置多个代币
export function example2_BatchSetTokens() {
  const token1 = new Token(
    UniverseChainId.Mainnet,
    '0x1111111111111111111111111111111111111111',
    18,
    'TOKEN1',
    'Token 1'
  )

  const token2 = new Token(
    UniverseChainId.Polygon,
    '0x2222222222222222222222222222222222222222',
    18,
    'TOKEN2',
    'Token 2'
  )

  // 批量设置
  setCustomTokenConfigs([
    {
      currency: token1,
      info: {
        priceUSD: 10,
        logoURI: 'https://example.com/token1.png',
      },
    },
    {
      currency: token2,
      info: {
        priceUSD: 20,
        logoURI: 'https://example.com/token2.png',
      },
    },
  ])
}

// 示例 3: 设置稳定币价格（如果需要）
export function example3_SetStablecoinPrice() {
  // 创建一个 USDC 代币（以太坊主网）
  const usdc = new Token(
    UniverseChainId.Mainnet,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC 地址
    6,
    'USDC',
    'USD Coin'
  )

  // 设置稳定币价格为 1 USD
  setCustomTokenInfo(usdc, {
    priceUSD: 1,
  })

  const price = getTokenPrice(usdc)
  console.log('USDC 价格:', price) // 输出: 1

  // 同样设置 USDT
  const usdt = new Token(
    UniverseChainId.Mainnet,
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT 地址
    6,
    'USDT',
    'Tether USD'
  )

  setCustomTokenInfo(usdt, {
    priceUSD: 1,
  })

  const usdtPrice = getTokenPrice(usdt)
  console.log('USDT 价格:', usdtPrice) // 输出: 1
}

// 示例 4: 清除所有自定义配置
export function example4_ClearConfigs() {
  // 清除所有自定义配置
  clearCustomTokenConfigs()

  // 之后，所有代币价格需要从 API 获取
}

// 示例 5: 在实际应用中使用
export function example6_RealWorldUsage() {
  // 假设你有一个代币列表，需要设置自定义价格和 logo
  const tokens = [
    {
      token: new Token(UniverseChainId.Mainnet, '0x...', 18, 'TOKEN1', 'Token 1'),
      price: 5.5,
      logo: 'https://example.com/token1.png',
    },
    {
      token: new Token(UniverseChainId.Polygon, '0x...', 18, 'TOKEN2', 'Token 2'),
      price: 10.2,
      logo: 'https://example.com/token2.png',
    },
  ]

  // 批量设置
  setCustomTokenConfigs(
    tokens.map(({ token, price, logo }) => ({
      currency: token,
      info: {
        priceUSD: price,
        logoURI: logo,
      },
    }))
  )
}

// 示例 6: 设置多个稳定币价格
export function example6_SetMultipleStablecoins() {
  // 批量设置多个稳定币价格为 1 USD
  const stablecoins = [
    new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
    new Token(UniverseChainId.Mainnet, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
    new Token(UniverseChainId.Polygon, '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 6, 'USDC', 'USD Coin'),
  ]

  setCustomTokenConfigs(
    stablecoins.map((token) => ({
      currency: token,
      info: {
        priceUSD: 1,
      },
    }))
  )
}

