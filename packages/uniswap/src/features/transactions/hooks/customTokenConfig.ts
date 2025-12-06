import { Currency } from '@uniswap/sdk-core'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * 自定义代币信息配置
 */
export interface CustomTokenInfo {
  /** 代币价格（USD，每单位） */
  priceUSD?: number
  /** 代币 Logo URL */
  logoURI?: string
  /** 代币名称 */
  name?: string
  /** 代币符号 */
  symbol?: string
}

/**
 * 自定义代币配置映射
 * Key: currencyId (chainId:address)
 * Value: 自定义代币信息
 */
const customTokenConfigs: Map<string, CustomTokenInfo> = new Map()

/**
 * 设置自定义代币信息
 * @param currency 代币
 * @param info 自定义信息
 */
export function setCustomTokenInfo(currency: Currency, info: CustomTokenInfo): void {
  const id = currencyId(currency)
  if (!id) {
    console.warn('[setCustomTokenInfo] 无法生成 currencyId:', currency)
    return
  }
  customTokenConfigs.set(id.toLowerCase(), info)
  console.log('[setCustomTokenInfo] 设置自定义代币信息:', { currencyId: id, info })
}

/**
 * 获取自定义代币信息
 * @param currency 代币
 * @returns 自定义信息，如果不存在则返回 undefined
 */
export function getCustomTokenInfo(currency?: Currency): CustomTokenInfo | undefined {
  if (!currency) {
    return undefined
  }

  const id = currencyId(currency)
  if (!id) {
    return undefined
  }
  return customTokenConfigs.get(id.toLowerCase())
}

/**
 * 获取代币价格（仅使用自定义配置）
 * @param currency 代币
 * @returns 代币价格（USD），如果未设置自定义价格则返回 undefined
 */
export function getTokenPrice(currency?: Currency): number | undefined {
  if (!currency) {
    return undefined
  }

  // 检查自定义配置
  const customInfo = getCustomTokenInfo(currency)
  if (customInfo?.priceUSD !== undefined && customInfo.priceUSD > 0) {
    console.log('[getTokenPrice] 使用自定义价格:', {
      symbol: currency.symbol,
      price: customInfo.priceUSD,
    })
    return customInfo.priceUSD
  }

  return undefined
}

/**
 * 清除所有自定义代币配置
 */
export function clearCustomTokenConfigs(): void {
  customTokenConfigs.clear()
  console.log('[clearCustomTokenConfigs] 已清除所有自定义代币配置')
}

/**
 * 批量设置自定义代币信息
 * @param configs 代币配置数组
 */
export function setCustomTokenConfigs(
  configs: Array<{ currency: Currency; info: CustomTokenInfo }>
): void {
  configs.forEach(({ currency, info }) => {
    setCustomTokenInfo(currency, info)
  })
}

