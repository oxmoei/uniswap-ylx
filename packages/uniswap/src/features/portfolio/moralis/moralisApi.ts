import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Moralis API 配置
 * 支持 Vite 和 Next.js 环境变量格式
 * 
 * 重要说明：
 * 1. 在 Vite 项目中，环境变量在构建时会被注入到 import.meta.env 和 process.env 中
 * 2. Vite 默认只处理 VITE_ 前缀的环境变量，但项目已配置 envPrefix: [] 以处理所有环境变量
 * 3. 在 Vercel 部署时，建议使用 VITE_ 前缀的环境变量（如 VITE_MORALIS_PRIMARY_API_KEY）
 * 4. 如果使用 NEXT_PUBLIC_ 前缀，Vite 也会处理（因为 envPrefix: []），但建议统一使用 VITE_ 前缀
 */
export function getEnvVar(key: string): string {
  // Method 1: Try import.meta.env (Vite standard)
  // Vite injects environment variables into import.meta.env at build time
  try {
    // @ts-expect-error - import.meta.env is available in Vite runtime
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-expect-error - import.meta.env is available in Vite runtime
      const viteEnv = import.meta.env
      // Directly read environment variable (Vite injects all env vars here)
      if (viteEnv[key]) {
        const value = viteEnv[key] as string
        if (value && value !== 'undefined' && value !== 'null') {
          return value
        }
      }
    }
  } catch (error) {
    // import.meta not available, fall through
  }
  
  // Method 2: Try process.env (Vite injects env vars here via define in vite.config.mts)
  // vite.config.mts define config injects all env vars into process.env.${key}
  try {
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[key]
      if (value && value !== 'undefined' && value !== 'null') {
        return value
      }
    }
  } catch (error) {
    // process.env not available
  }
  
  // Method 3: Try window.__NEXT_DATA__.env (Next.js/Vercel may inject this)
  if (typeof window !== 'undefined') {
    try {
      const nextData = (window as any).__NEXT_DATA__
      if (nextData?.env && nextData.env[key]) {
        const value = nextData.env[key]
        if (value && value !== 'undefined' && value !== 'null') {
          return value
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  return ''
}


const MORALIS_BASE_URL = 
  getEnvVar('VITE_MORALIS_BASE_URL') || 
  getEnvVar('NEXT_PUBLIC_MORALIS_BASE_URL') || 
  'https://deep-index.moralis.io/api/v2.2'
const PRIMARY_API_KEY = 
  getEnvVar('VITE_MORALIS_PRIMARY_API_KEY') || 
  getEnvVar('NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY') || 
  ''
const FALLBACK_API_KEY = 
  getEnvVar('VITE_MORALIS_FALLBACK_API_KEY') || 
  getEnvVar('NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY') || 
  ''

/**
 * Diagnostic function to check environment variable configuration
 * This helps identify configuration issues in production
 */
export function diagnoseEnvironmentConfig(): void {
  if (typeof window === 'undefined') {
    return // Only run in browser
  }

  const hasPrimaryVite = !!getEnvVar('VITE_MORALIS_PRIMARY_API_KEY')
  const hasPrimaryNext = !!getEnvVar('NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY')
  const hasFallbackVite = !!getEnvVar('VITE_MORALIS_FALLBACK_API_KEY')
  const hasFallbackNext = !!getEnvVar('NEXT_PUBLIC_MORALIS_FALLBACK_API_KEY')
  const hasApiKey = hasPrimaryVite || hasPrimaryNext || hasFallbackVite || hasFallbackNext

  const hasImportMeta = typeof import.meta !== 'undefined' && !!(import.meta as any).env
  const hasProcessEnv = typeof process !== 'undefined' && !!process.env
  const hasNextData = typeof window !== 'undefined' && !!(window as any).__NEXT_DATA__?.env

  const allEnvKeys: string[] = []
  try {
    if (hasProcessEnv) {
      Object.keys(process.env).forEach((key) => {
        if (key.includes('MORALIS') || key.includes('WALLET_CONNECT')) {
          allEnvKeys.push(key)
        }
      })
    }
  } catch {
    // Ignore errors
  }

  const diagnosticInfo = {
    hasPrimaryVite,
    hasPrimaryNext,
    hasFallbackVite,
    hasFallbackNext,
    hasApiKey,
    hasImportMeta,
    hasProcessEnv,
    hasNextData,
    allEnvKeys,
    moralisBaseUrl: MORALIS_BASE_URL,
  }

  // Get detailed environment variable values (partially masked for security)
  const getMaskedValue = (value: string | undefined): string => {
    if (!value) return 'undefined'
    if (value.length <= 8) return '***'
    return value.substring(0, 4) + '***' + value.substring(value.length - 4)
  }

  // Check WalletConnect Project ID using getEnvVar for consistency
  const walletConnectReact = getEnvVar('REACT_APP_WALLET_CONNECT_PROJECT_ID')
  const walletConnectVite = getEnvVar('VITE_WALLET_CONNECT_PROJECT_ID')
  const hasWalletConnect = !!(walletConnectReact || walletConnectVite)

  // Get actual values from different sources for debugging
  let importMetaValues: Record<string, string> = {}
  let processEnvValues: Record<string, string> = {}
  let nextDataValues: Record<string, string> = {}

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteEnv = (import.meta as any).env
      const keysToCheck = [
        'VITE_MORALIS_PRIMARY_API_KEY',
        'NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY',
        'VITE_WALLET_CONNECT_PROJECT_ID',
        'REACT_APP_WALLET_CONNECT_PROJECT_ID',
      ]
      keysToCheck.forEach((key) => {
        if (viteEnv[key]) {
          importMetaValues[key] = getMaskedValue(viteEnv[key] as string)
        }
      })
    }
  } catch {
    // Ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      const keysToCheck = [
        'VITE_MORALIS_PRIMARY_API_KEY',
        'NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY',
        'VITE_WALLET_CONNECT_PROJECT_ID',
        'REACT_APP_WALLET_CONNECT_PROJECT_ID',
      ]
      keysToCheck.forEach((key) => {
        if (process.env[key]) {
          processEnvValues[key] = getMaskedValue(process.env[key])
        }
      })
    }
  } catch {
    // Ignore
  }

  try {
    if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env) {
      const nextEnv = (window as any).__NEXT_DATA__.env
      Object.keys(nextEnv).forEach((key) => {
        if (key.includes('MORALIS') || key.includes('WALLET_CONNECT')) {
          nextDataValues[key] = getMaskedValue(nextEnv[key])
        }
      })
    }
  } catch {
    // Ignore
  }

  // Log diagnostic info to console for debugging
  console.group('[Diagnostic] Environment Configuration')
  console.log('Moralis API Configuration:', {
    hasApiKey,
    hasPrimaryVite,
    hasPrimaryNext,
    hasFallbackVite,
    hasFallbackNext,
    baseUrl: MORALIS_BASE_URL,
    primaryKeyValue: hasPrimaryVite || hasPrimaryNext ? getMaskedValue(PRIMARY_API_KEY) : 'not found',
  })
  console.log('Environment Variable Sources:', {
    hasImportMeta,
    hasProcessEnv,
    hasNextData,
    availableKeys: allEnvKeys,
  })
  console.log('Environment Variable Values (masked):', {
    'import.meta.env': importMetaValues,
    'process.env': processEnvValues,
    'window.__NEXT_DATA__.env': nextDataValues,
  })
  
  if (!hasApiKey) {
    console.error(
      '❌ Moralis API keys are not configured! ' +
      'Please set VITE_MORALIS_PRIMARY_API_KEY or NEXT_PUBLIC_MORALIS_PRIMARY_API_KEY in Vercel environment variables. ' +
      'This will prevent token lists from loading.'
    )
  }
  
  console.log('WalletConnect Configuration:', {
    hasWalletConnect,
    hasWalletConnectReact: !!walletConnectReact,
    hasWalletConnectVite: !!walletConnectVite,
    walletConnectValue: hasWalletConnect ? getMaskedValue(walletConnectReact || walletConnectVite) : 'not found',
  })
  
  if (!hasWalletConnect) {
    console.error(
      '❌ WalletConnect Project ID is not configured! ' +
      'Please set REACT_APP_WALLET_CONNECT_PROJECT_ID or VITE_WALLET_CONNECT_PROJECT_ID in Vercel environment variables. ' +
      'This may prevent the application from loading correctly.'
    )
  }

  // Additional troubleshooting tips
  if (!hasApiKey || !hasWalletConnect) {
    console.group('🔧 Troubleshooting Tips:')
    console.log('1. Check Vercel Environment Variables:')
    console.log('   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
    console.log('   - Ensure variables are set for "Production" environment')
    console.log('   - Variable names are case-sensitive')
    console.log('2. After adding/updating environment variables:')
    console.log('   - You MUST redeploy the application for changes to take effect')
    console.log('   - Go to Vercel Dashboard → Deployments → Click "Redeploy"')
    console.log('3. Verify build logs:')
    console.log('   - Check Vercel build logs for environment variable injection')
    console.log('   - Look for "ENV_LOADED" messages in build output')
    console.groupEnd()
  }
  
  console.groupEnd()

  // Store diagnostic info for potential error reporting
  if (typeof window !== 'undefined') {
    ;(window as any).__UNISWAP_DIAGNOSTIC__ = diagnosticInfo
  }
}

// Run diagnostic on module load (in browser only)
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure it runs after other initialization
  setTimeout(() => {
    diagnoseEnvironmentConfig()
  }, 100)
}

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
 * 获取原生代币余额和价格
 */
export async function fetchNativeTokenBalanceAndPrice(
  address: string,
  chainId: number
): Promise<{ balance: string; price: number; usdValue: number } | null> {
  // 验证API密钥
  if (!PRIMARY_API_KEY && !FALLBACK_API_KEY) {
    return null
  }

  const chainName = getChainNameForMoralis(chainId)
  if (!chainName) {
    throw new Error(`不支持的链: ${chainId}`)
  }

  const apiKey = PRIMARY_API_KEY || FALLBACK_API_KEY

  try {
    // 获取原生代币余额
    const balanceUrl = `${MORALIS_BASE_URL}/${address}/balance?chain=${chainName}`
    const balanceResponse = await fetch(balanceUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': apiKey,
      },
    })

    if (!balanceResponse.ok) {
      return null
    }

    const balanceData = await balanceResponse.json()
    const balance = balanceData.balance || '0'

    // 直接使用 API 返回的 USD 价值（如果可用）
    let usdValue = 0
    if (balanceData.usd_value !== undefined && balanceData.usd_value !== null) {
      usdValue = parseFloat(balanceData.usd_value.toString())
    } else if (balanceData.usdValue !== undefined && balanceData.usdValue !== null) {
      usdValue = parseFloat(balanceData.usdValue.toString())
    } else {
      // 如果 API 没有返回价值，则获取价格并计算（后备方案）
      const priceUrl = `${MORALIS_BASE_URL}/native/price?chain=${chainName}`
      const priceResponse = await fetch(priceUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'X-API-Key': apiKey,
        },
      })

      let price = 0
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        price = parseFloat(priceData.usdPrice || '0')
      } else {
      }

      // 计算 USD 价值（后备方案）
      const balanceNumber = parseFloat(balance) / Math.pow(10, 18) // 原生代币通常是 18 位小数
      usdValue = balanceNumber * price
    }

    // 获取价格（用于显示，如果 API 返回了价值，价格可能不需要）
    let price = 0
    if (balanceData.usd_price !== undefined && balanceData.usd_price !== null) {
      price = parseFloat(balanceData.usd_price.toString())
    } else if (balanceData.usdPrice !== undefined && balanceData.usdPrice !== null) {
      // 如果 API 返回了价值但没有价格，尝试从价值反推价格（仅用于显示）
      const balanceNumber = parseFloat(balance) / Math.pow(10, 18)
      if (balanceNumber > 0) {
        price = usdValue / balanceNumber
      }
    } else {
      // 如果 API 没有返回价格，尝试获取（后备方案）
      const priceUrl = `${MORALIS_BASE_URL}/native/price?chain=${chainName}`
      const priceResponse = await fetch(priceUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'X-API-Key': apiKey,
        },
      })

      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        price = parseFloat(priceData.usdPrice || '0')
      }
    }

    return {
      balance,
      price,
      usdValue,
    }
  } catch (error) {
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
    return []
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
      throw new Error(`Primary API failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    if (!FALLBACK_API_KEY) {
      // API密钥缺失或主密钥失败且无备用密钥，返回空数组而不是抛出错误
      return []
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
        // 备用API也失败，返回空数组而不是抛出错误
        return []
      }
    } catch (fallbackError) {
      // 网络错误或其他异常，返回空数组而不是抛出错误
      return []
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

  // 规范化资产数据（保留原始数据以便后续使用）
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
      // 保留原始资产数据以便后续使用 usd_value 和 usd_price
      _originalAsset: asset,
    }
  })

  // 处理代币价格和价值（优先使用 API 返回的值）
  const assetsWithPrices = await Promise.all(
    normalizedAssets.map(async (asset) => {
      // 跳过零余额的代币
      if (parseFloat(asset.balance) === 0) {
        return null
      }

      // 优先使用 API 返回的 usd_value（如果可用）
      let usdValue = 0
      let price = 0
      
      // 检查原始资产数据中是否包含 usd_value 和 usd_price
      const originalAsset = (asset as any)._originalAsset
      
      if (originalAsset?.usd_value !== undefined && originalAsset.usd_value !== null) {
        // 直接使用 API 返回的 usd_value
        usdValue = typeof originalAsset.usd_value === 'number' 
          ? originalAsset.usd_value 
          : parseFloat(originalAsset.usd_value.toString())
      }
      
      if (originalAsset?.usd_price !== undefined && originalAsset.usd_price !== null) {
        // 直接使用 API 返回的 usd_price
        price = typeof originalAsset.usd_price === 'number' 
          ? originalAsset.usd_price 
          : parseFloat(originalAsset.usd_price.toString())
      }

      // 如果 API 没有返回价值，则获取价格并计算（后备方案）
      if (usdValue === 0 || price === 0) {
        try {
          const fetchedPrice = await fetchTokenPrice(asset.token_address, chainName, currentApiKey)
          if (fetchedPrice !== null && fetchedPrice > 0) {
            price = fetchedPrice
            // 如果 API 没有返回价值，则通过价格和余额计算
            if (usdValue === 0) {
              const balanceNumber = parseFloat(asset.balance) / Math.pow(10, asset.decimals)
              usdValue = balanceNumber * price
            }
          }
        } catch (error) {
          // 仅在调试模式下记录错误，避免日志噪音
          // console.debug(`[fetchWalletERC20Tokens] 获取代币价格失败: ${asset.symbol}`, error)
        }
      }

      // 只返回有价值的代币
      if (usdValue > 0) {
        const { _originalAsset, ...assetWithoutOriginal } = asset as any
        return {
          ...assetWithoutOriginal,
          usd_price: price,
          usd_value: usdValue,
        }
      }

      // 没有价值的代币返回 null，将被过滤掉
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

