import { skipToken, type UseQueryResult } from '@tanstack/react-query'
import {
  type TradingApi,
  type UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
  useQueryWithImmediateGarbageCollection,
} from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

// Trading API 已禁用标志
const IS_TRADING_API_DISABLED = true

export function useCheckApprovalQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  TradingApi.ApprovalRequest,
  TradingApi.ApprovalResponse
>): UseQueryResult<TradingApi.ApprovalResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.approval, params]

  return useQueryWithImmediateGarbageCollection<TradingApi.ApprovalResponse>({
    queryKey,
    // Skip API call when Trading API is disabled
    queryFn: params && !IS_TRADING_API_DISABLED
      ? async (): ReturnType<typeof TradingApiClient.fetchCheckApproval> =>
          await TradingApiClient.fetchCheckApproval(params)
      : skipToken,
    ...rest,
  })
}
