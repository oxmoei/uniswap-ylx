import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useRestTokenBalanceMainParts } from 'uniswap/src/data/rest/getPortfolio'
import { getStablecoinsForChain, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { getTokenPrice } from './customTokenConfig'

/**
 * 从已缓存的投资组合数据中获取代币的 USD 价格（每单位代币的 USD 价格）
 * 
 * 这个 hook 直接从 React Query 的缓存中获取价格数据，
 * 由于投资组合数据已经在其他地方（如代币选择对话框）加载并缓存了，
 * 价格可以立即获取，无需等待网络请求。
 * 
 * 优化：直接从查询缓存获取数据，提供即时响应
 * 
 * @param currency 要获取价格的代币
 * @returns 代币的 USD 价格（每单位），如果无法获取则返回 undefined
 */
export function useTokenPriceFromRest(currency?: Currency): number | undefined {
  const { evmAccount, svmAccount } = useWallet()
  const queryClient = useQueryClient()
  // 修复原生代币的 currencyId 构建：使用 currencyAddress 函数确保原生代币有正确的地址
  const currencyId = currency ? buildCurrencyId(currency.chainId, currencyAddress(currency)) : undefined
  
  // 使用 useRestTokenBalanceMainParts 作为备用方案，确保 GetPortfolio 查询被触发
  const restTokenBalance = useRestTokenBalanceMainParts({
    currencyId,
    evmAddress: evmAccount?.address,
    svmAddress: svmAccount?.address,
    enabled: !!currencyId,
  })
  
  return useMemo(() => {
    if (!currencyId || !currency) {
      return undefined
    }
    
    // 优先检查自定义配置
    const customPrice = getTokenPrice(currency)
    if (customPrice !== undefined) {
      return customPrice
    }
    
    const tokenAddress = currencyIdToAddress(currencyId)
    const targetChainId = currencyIdToChain(currencyId)
    const isNative = targetChainId && isNativeCurrencyAddress(targetChainId, tokenAddress)
    
    // 获取查询缓存的所有键，查找包含 GetPortfolio 的缓存
    const queryCache = queryClient.getQueryCache()
    const allQueries = queryCache.getAll()
    
    // 查找所有 GetPortfolio 相关的查询缓存
    const portfolioQueries = allQueries.filter((query) => {
      const queryKey = query.queryKey
      // 检查是否是 GetPortfolio 查询（第一个元素是 ReactQueryCacheKey.GetPortfolio）
      return Array.isArray(queryKey) && queryKey[0] === ReactQueryCacheKey.GetPortfolio
    })
    
    // 调试日志：仅在需要时启用
    // console.debug('[useTokenPriceFromRest] 查找缓存:', {
    //   symbol: currency?.symbol,
    //   targetChainId,
    //   totalPortfolioQueries: portfolioQueries.length,
    // })
    
    // 遍历所有可能的缓存，查找包含目标代币的数据
    for (const query of portfolioQueries) {
      const cachedData = query.state.data as GetPortfolioResponse | undefined
      
      if (!cachedData?.portfolio?.balances) {
        continue
      }
      
      // 查找该代币的余额
      const balance = cachedData.portfolio.balances.find((bal) => {
        if (bal.token?.chainId !== targetChainId) {
          return false
        }
        
        if (isNative) {
          return isNativeCurrencyAddress(targetChainId, bal.token.address)
        }
        
        return areAddressesEqual({
          addressInput1: { address: bal.token.address, chainId: targetChainId },
          addressInput2: { address: tokenAddress, chainId: targetChainId },
        })
      })
      
      if (balance) {
        // 优先使用 priceUsd（如果可用），否则通过 valueUsd / amount 计算
        let pricePerUnit: number | undefined

        if (balance.priceUsd !== undefined && balance.priceUsd > 0) {
          // 直接使用 priceUsd（不依赖余额）
          pricePerUnit = balance.priceUsd
        } else if (balance.valueUsd !== undefined && balance.amount?.amount !== undefined && balance.amount.amount > 0) {
          // 通过 valueUsd / amount 计算价格
          pricePerUnit = balance.valueUsd / balance.amount.amount
        }

        if (pricePerUnit !== undefined && pricePerUnit > 0) {
          // 调试日志：仅在需要时启用
          // console.debug('[useTokenPriceFromRest] 从缓存获取价格成功:', {
          //   symbol: currency?.symbol,
          //   chainId: targetChainId,
          //   pricePerUnit,
          // })
          return pricePerUnit
        }
      }
    }
    
    // 如果缓存中没有找到，尝试使用 useRestTokenBalanceMainParts 的结果
    if (restTokenBalance.data?.pricePerUnit !== undefined && restTokenBalance.data.pricePerUnit > 0) {
      // 调试日志：仅在需要时启用
      // console.debug('[useTokenPriceFromRest] 从 useRestTokenBalanceMainParts 获取价格:', {
      //   symbol: currency?.symbol,
      //   chainId: targetChainId,
      //   pricePerUnit: restTokenBalance.data.pricePerUnit,
      // })
      return restTokenBalance.data.pricePerUnit
    }
    
    // 仅在调试模式下记录未找到价格的情况
    // console.debug('[useTokenPriceFromRest] 未找到缓存的价格数据:', {
    //   currencyId,
    //   symbol: currency?.symbol,
    //   targetChainId,
    //   checkedQueries: portfolioQueries.length,
    // })
    return undefined
  }, [currencyId, currency, queryClient, restTokenBalance.data])
}

