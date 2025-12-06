import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Moralis API 配置
 */
const MORALIS_BASE_URL = process.env.NEXT_PUBLIC_MORALIS_BASE_URL || 'https://deep-index.moralis.io/api/v2.2'
const PRIMARY_API_KEY = process.env.NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY || ''
const FALLBACK_API_KEY = process.env.NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY || ''

/**
 * 链ID到Moralis链名称的映射
 */
const CHAIN_NAME_MAP: Record<number, string> = {
  1: 'eth', // Ethereum
  137: 'polygon', // Polygon
  56: 'bsc', // BNB Chain
  42161: 'arbitrum', // Arbitrum
  8453: 'base', // Base
  10: 'optimism', // Optimism
  43114: 'avalanche', // Avalanche
  324: 'zksync', // Zksync
  130: 'unichain', // Unichain
  81457: 'blast', // Blast
  143: 'monad', // Monad
  11155111: 'sepolia', // Sepolia
}

/**
 * 获取Moralis API支持的链名称
 */
export function getChainNameForMoralis(chainId: number): string | null {
  return CHAIN_NAME_MAP[chainId] || null
}

/**
 * Moralis API 返回的代币信息
 */
export interface MoralisTokenInfo {
  token_address: string
  symbol: string
  name: string
  decimals: string | number
  balance: string
  logo?: string | null
  logo_urls?: {
    token_logo_url?: string
    logo_url?: string
  } | null
  thumbnail?: string | null
  usd_price?: number | null
  usd_value?: number | null
}

/**
 * 获取代币价格
 */
export async function fetchTokenPrice(
  tokenAddress: string,
  chainName: string,
  apiKey: string
): Promise<number | null> {
  try {
    const url = `${MORALIS_BASE_URL}/erc20/${tokenAddress}/price?chain=${chainName}`
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': apiKey,
      },
    }

    const response = await fetch(url, options)
    if (!response.ok) {
      // 404 表示代币价格不存在，这是正常情况
      if (response.status === 404) {
        return null
      }
      return null
    }

    const data = await response.json()
    return parseFloat(data.usdPrice || '0')
  } catch (error) {
    // 仅在调试模式下记录错误，避免日志噪音
    // console.debug('[fetchTokenPrice] 获取代币价格失败:', error)
    return null
  }
}

/**
 * 获取钱包的ERC20代币列表
 */
export async function fetchWalletERC20Tokens(
  address: string,
  chainId: number
): Promise<MoralisTokenInfo[]> {
  // 验证API密钥
  if (!PRIMARY_API_KEY && !FALLBACK_API_KEY) {
    throw new Error('Moralis API 密钥未配置')
  }

  const chainName = getChainNameForMoralis(chainId)
  if (!chainName) {
    throw new Error(`不支持的链: ${chainId}`)
  }

  const url = `${MORALIS_BASE_URL}/${address}/erc20?chain=${chainName}&limit=100&exclude_spam=true&exclude_unverified_contracts=true`

  // 尝试使用主API密钥，失败则切换到备用密钥
  let response: Response
  let currentApiKey = PRIMARY_API_KEY

  try {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': PRIMARY_API_KEY,
      },
    }

    response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`Primary API failed: ${response.status}`)
    }
  } catch (error) {
    console.warn('[fetchWalletERC20Tokens] 主API密钥失败，尝试备用密钥:', error)

    if (!FALLBACK_API_KEY) {
      throw new Error('主API密钥失败且未配置备用密钥')
    }

    try {
      const fallbackOptions = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'X-API-Key': FALLBACK_API_KEY,
        },
      }

      response = await fetch(url, fallbackOptions)
      currentApiKey = FALLBACK_API_KEY

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`备用API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
      }
    } catch (fallbackError) {
      console.error('[fetchWalletERC20Tokens] 所有API密钥都失败')
      throw fallbackError
    }
  }

  const data = await response.json()

  // 处理不同的响应格式
  let assets: any[] = []
  if (data.result) {
    assets = data.result
  } else if (Array.isArray(data)) {
    assets = data
  } else if (data.data) {
    assets = data.data
  }

  // 规范化资产数据
  const normalizedAssets = assets.map((asset: any) => {
    let balanceValue = asset.balance || asset.balance_formatted || asset.token_balance || '0'

    // 处理科学计数法
    if (typeof balanceValue === 'string') {
      balanceValue = balanceValue.replace(/\s/g, '')
      if (balanceValue.includes('e') || balanceValue.includes('E')) {
        const num = parseFloat(balanceValue)
        balanceValue = num.toFixed(0)
      }
    }

    const decimals = typeof asset.decimals === 'string' ? parseInt(asset.decimals, 10) : asset.decimals || 18

    // 获取logo
    const logoUrls = asset.logo_urls || {}
    const logo = asset.logo || asset.thumbnail || logoUrls.token_logo_url || logoUrls.logo_url || null

    return {
      token_address: asset.token_address,
      symbol: asset.symbol,
      name: asset.name,
      decimals,
      balance: balanceValue,
      logo,
      logo_urls: logoUrls,
      thumbnail: asset.thumbnail || null,
    }
  })

  // 为每个代币获取价格，只保留有价格的代币
  const assetsWithPrices = await Promise.all(
    normalizedAssets.map(async (asset) => {
      // 跳过零余额的代币
      if (parseFloat(asset.balance) === 0) {
        return null
      }

      try {
        const price = await fetchTokenPrice(asset.token_address, chainName, currentApiKey)
        if (price !== null && price > 0) {
          const balanceNumber = parseFloat(asset.balance) / Math.pow(10, asset.decimals)
          const usdValue = balanceNumber * price

          return {
            ...asset,
            usd_price: price,
            usd_value: usdValue,
          }
        }
      } catch (error) {
        // 仅在调试模式下记录错误，避免日志噪音
        // console.debug(`[fetchWalletERC20Tokens] 获取代币价格失败: ${asset.symbol}`, error)
      }

      // 没有价格的代币返回 null，将被过滤掉
      return null
    })
  )

  // 过滤掉没有价格的代币
  const tokensWithPrices = assetsWithPrices.filter(
    (asset): asset is MoralisTokenInfo => asset !== null
  )

  return tokensWithPrices
}

/**
 * 将Moralis代币信息转换为Uniswap Token对象
 */
export function moralisTokenToUniswapToken(
  tokenInfo: MoralisTokenInfo,
  chainId: UniverseChainId
): Token {
  const decimals = typeof tokenInfo.decimals === 'string' ? parseInt(tokenInfo.decimals, 10) : tokenInfo.decimals

  return new Token(
    chainId,
    tokenInfo.token_address,
    decimals,
    tokenInfo.symbol,
    tokenInfo.name
  )
}

