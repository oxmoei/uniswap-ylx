// Trading API 已禁用 - 不再使用 TradingApiClient
// import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  createTradeRepository,
  type TradeRepository,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeRepository'
import { logger } from 'utilities/src/logger/logger'
import type { DiscriminatedQuoteResponse } from '@universe/api'

/**
 * Repositories
 *
 * This is where we _create_ instances of repositories that are used in services/hooks/etc.
 *
 * List of repositories:
 * - Trade Repository (formerly Quote Repository)
 */

/**
 * 禁用 Trading API 的存根函数
 * 返回空响应，不进行任何网络请求
 */
async function disabledFetchQuote(): Promise<DiscriminatedQuoteResponse> {
  // Trading API 已禁用，返回空响应
  return {
    quote: null,
    routing: { type: 'classic' },
    requestId: '',
  } as DiscriminatedQuoteResponse
}

async function disabledFetchIndicativeQuote(): Promise<DiscriminatedQuoteResponse> {
  // Trading API 已禁用，返回空响应
  return {
    quote: null,
    routing: { type: 'classic' },
    requestId: '',
  } as DiscriminatedQuoteResponse
}

/**
 * Trade Repository
 *
 * @returns A trade repository that can be used to fetch quotes from the trading API.
 * 
 * 注意：Trading API 已被禁用，此仓库现在返回空响应。
 * 如需获取交易报价，请实现自己的链上价格获取逻辑。
 */
export function getEVMTradeRepository(): TradeRepository {
  return createTradeRepository({
    fetchQuote: disabledFetchQuote,
    fetchIndicativeQuote: disabledFetchIndicativeQuote,
    logger,
    isTradingApiDisabled: true, // 标记 Trading API 已禁用，用于优化日志输出
  })
}
