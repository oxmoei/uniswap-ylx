import { type DiscriminatedQuoteResponse, type TradingApi, type TradingApiClient } from '@universe/api'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import { type Logger } from 'utilities/src/logger/logger'

// Minimal parameters needed for indicative quotes
export interface IndicativeQuoteRequest {
  type: TradingApi.TradeType
  amount: string
  tokenInChainId: number
  tokenOutChainId: number
  tokenIn: string
  tokenOut: string
  swapper: string
}

// Type for the indicative quote fetcher function
export type FetchIndicativeQuote = (params: IndicativeQuoteRequest) => Promise<DiscriminatedQuoteResponse>

export interface TradeRepository {
  fetchQuote: TradingApiClient['fetchQuote']
  fetchIndicativeQuote: FetchIndicativeQuote
}

export function createTradeRepository(ctx: {
  fetchQuote: TradingApiClient['fetchQuote']
  fetchIndicativeQuote: FetchIndicativeQuote
  logger?: Logger
  isTradingApiDisabled?: boolean
}): TradeRepository {
  const isDisabled = ctx.isTradingApiDisabled ?? false

  return {
    fetchQuote: async ({ isUSDQuote, ...params }): Promise<DiscriminatedQuoteResponse> => {
      // Skip logging when Trading API is disabled to reduce noise
      if (!isDisabled) {
        logSwapQuoteFetch({ chainId: params.tokenInChainId, isUSDQuote })
      }

      // Skip latency logging for USD quotes or when API is disabled
      const startTime = ctx.logger && !isUSDQuote && !isDisabled ? Date.now() : undefined

      const result = await ctx.fetchQuote(params)

      // Log if API returned an empty quote response
      // Skip error logging if Trading API is disabled (indicated by empty requestId)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checking for empty quote outside type expectations
      if (ctx.logger && !result.quote && result.requestId !== '') {
        ctx.logger.error(new Error('Unexpected empty Trading API response'), {
          tags: { file: 'tradeRepository', function: 'fetchQuote' },
          extra: {
            params,
            routing: result.routing,
            requestId: result.requestId,
          },
        })
      }

      // Log latency when not a USD quote and API is enabled
      if (startTime && ctx.logger && !isDisabled) {
        // keep the log name details the same for historical reasons
        ctx.logger.info('useTrade', 'useTrade', 'Quote Latency', {
          quoteLatency: Date.now() - startTime,
          chainIdIn: params.tokenInChainId,
          chainIdOut: params.tokenOutChainId,
          isBridging: isBridging(params.tokenInChainId, params.tokenOutChainId),
        })
      }

      return result
    },
    fetchIndicativeQuote: async (params): Promise<DiscriminatedQuoteResponse> => {
      // Skip logging when Trading API is disabled to reduce noise
      if (!isDisabled) {
        logSwapQuoteFetch({ chainId: params.tokenInChainId, isQuickRoute: true })
      }

      const startTime = ctx.logger && !isDisabled ? Date.now() : undefined

      const result = await ctx.fetchIndicativeQuote(params)

      // log latency for indicative quotes when API is enabled
      if (startTime && ctx.logger && !isDisabled) {
        ctx.logger.info('tradeRepository', 'fetchIndicativeQuote', 'Indicative Quote Latency', {
          quoteLatency: Date.now() - startTime,
          chainIdIn: params.tokenInChainId,
          chainIdOut: params.tokenOutChainId,
          isBridging: isBridging(params.tokenInChainId, params.tokenOutChainId),
        })
      }

      return result
    },
  }
}

function isBridging(tokenInChainId?: number, tokenOutChainId?: number): boolean {
  return Boolean(tokenInChainId && tokenOutChainId && tokenInChainId !== tokenOutChainId)
}
