import { Token, CurrencyAmount, Currency } from '@uniswap/sdk-core'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  fetchWalletERC20Tokens,
  moralisTokenToUniswapToken,
  type MoralisTokenInfo,
} from './moralisApi'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { useRestTokenBalanceMainParts, useRestTokenBalanceQuantityParts, useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

/**
 * 使用Moralis API获取的代币余额信息
 */
export interface MoralisTokenBalance {
  token: Currency
  balance: CurrencyAmount<Currency>
  priceUSD: number
  valueUSD: number
  logoURI?: string | null
}

/**
 * 使用Moralis API获取钱包的ERC20代币列表（只包含有价格的代币）
 * 同时包含原生代币，使用 REST API 获取价格
 */
export function useMoralisTokenList(chainId?: UniverseChainId) {
  const { evmAccount, svmAccount } = useWallet()
  const { defaultChainId } = useEnabledChains()
  const targetChainId = chainId || defaultChainId

  // 获取原生代币的 currencyId
  const nativeCurrencyId = useMemo(() => {
    if (!targetChainId) return undefined
    return buildNativeCurrencyId(targetChainId)
  }, [targetChainId])

  // 使用 REST API 获取原生代币的价格
  const nativeTokenBalance = useRestTokenBalanceMainParts({
    currencyId: nativeCurrencyId,
    evmAddress: evmAccount?.address,
    svmAddress: svmAccount?.address,
    enabled: !!nativeCurrencyId && (!!evmAccount?.address || !!svmAccount?.address),
  })

  // 使用 REST API 获取原生代币的余额
  const nativeTokenQuantity = useRestTokenBalanceQuantityParts({
    currencyId: nativeCurrencyId,
    evmAddress: evmAccount?.address,
    svmAddress: svmAccount?.address,
    enabled: !!nativeCurrencyId && (!!evmAccount?.address || !!svmAccount?.address),
  })

  // 使用 REST API 获取原生代币的完整信息（包括 logoUrl）
  const { chains: chainIds } = useEnabledChains()
  const { data: portfolioData } = useGetPortfolioQuery({
    input: {
      evmAddress: evmAccount?.address,
      svmAddress: svmAccount?.address,
      chainIds,
    },
    enabled: !!nativeCurrencyId && (!!evmAccount?.address || !!svmAccount?.address),
    select: (data) => {
      if (!data?.portfolio?.balances || !nativeCurrencyId) {
        return undefined
      }

      const tokenAddress = currencyIdToAddress(nativeCurrencyId)
      const chainId = currencyIdToChain(nativeCurrencyId)
      const isNative = chainId && isNativeCurrencyAddress(chainId, tokenAddress)

      // 查找原生代币的余额信息
      const balance = data.portfolio.balances.find((bal) => {
        if (bal.token?.chainId !== chainId) {
          return false
        }

        if (isNative) {
          return isNativeCurrencyAddress(chainId, bal.token.address)
        }

        return areAddressesEqual({
          addressInput1: { address: bal.token.address, chainId },
          addressInput2: { address: tokenAddress, chainId },
        })
      })

      return balance?.token?.metadata?.logoUrl
    },
  })

  const { data: erc20Tokens, error, isLoading, refetch } = useQuery<MoralisTokenBalance[]>({
    queryKey: ['moralis-token-list', evmAccount?.address, targetChainId],
    queryFn: async () => {
      if (!evmAccount?.address || !targetChainId) {
        return []
      }

      try {
        const tokenInfos = await fetchWalletERC20Tokens(evmAccount.address, targetChainId)

        // 转换为Uniswap格式
        const tokenBalances: MoralisTokenBalance[] = tokenInfos
          .map((tokenInfo) => {
            const token = moralisTokenToUniswapToken(tokenInfo, targetChainId)
            const balance = getCurrencyAmount({
              value: tokenInfo.balance,
              valueType: ValueType.Raw,
              currency: token,
            })

            // 确保 balance 是有效的 CurrencyAmount
            if (!balance) {
              console.warn('[useMoralisTokenList] 无法创建 balance:', { tokenInfo, token })
              return null
            }

            return {
              token,
              balance,
              priceUSD: tokenInfo.usd_price || 0,
              valueUSD: tokenInfo.usd_value || 0,
              logoURI: tokenInfo.logo || tokenInfo.thumbnail || null,
            }
          })
          .filter((balance): balance is MoralisTokenBalance => balance !== null)

        return tokenBalances
      } catch (error) {
        console.error('[useMoralisTokenList] 获取代币列表失败:', error)
        throw error
      }
    },
    enabled: !!evmAccount?.address && !!targetChainId,
    staleTime: 30 * 1000, // 30秒
    gcTime: 5 * 60 * 1000, // 5分钟
    retry: 1,
  })

  // 合并 ERC20 代币和原生代币
  const allTokens = useMemo(() => {
    const tokens: MoralisTokenBalance[] = []

    // 添加原生代币（如果有价格）
    if (
      targetChainId &&
      nativeTokenBalance.data?.pricePerUnit &&
      nativeTokenBalance.data.pricePerUnit > 0 &&
      nativeTokenQuantity.data?.quantity !== undefined
    ) {
      const nativeCurrency = nativeOnChain(targetChainId)
      const nativeBalanceAmount = nativeTokenQuantity.data.quantity

      const nativeBalance = getCurrencyAmount({
        value: nativeBalanceAmount.toString(),
        valueType: ValueType.Exact,
        currency: nativeCurrency,
      })

      if (nativeBalance) {
        const valueUSD = nativeBalanceAmount * nativeTokenBalance.data.pricePerUnit
        // 使用 REST API 返回的 logoUrl（如果可用），否则使用链信息的 logo
        const nativeLogoURI = portfolioData || null
        
        tokens.push({
          token: nativeCurrency,
          balance: nativeBalance,
          priceUSD: nativeTokenBalance.data.pricePerUnit,
          valueUSD,
          logoURI: nativeLogoURI,
        })
      }
    }

    // 添加 ERC20 代币
    if (erc20Tokens) {
      tokens.push(...erc20Tokens)
    }

    return tokens
  }, [targetChainId, nativeTokenBalance.data, nativeTokenQuantity.data, portfolioData, erc20Tokens])

  return {
    data: allTokens,
    error: error || nativeTokenBalance.error || nativeTokenQuantity.error,
    isLoading: isLoading || nativeTokenBalance.isLoading || nativeTokenQuantity.isLoading,
    refetch: () => {
      refetch()
      nativeTokenBalance.refetch()
      nativeTokenQuantity.refetch()
    },
  }
}

