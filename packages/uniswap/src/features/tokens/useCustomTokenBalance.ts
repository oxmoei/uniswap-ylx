import { useQuery } from '@tanstack/react-query'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { UniverseChainId, RPCType } from 'uniswap/src/features/chains/types'
import { usePublicClient } from 'wagmi'
import { formatUnits, createPublicClient, http, type PublicClient } from 'viem'
import { erc20Abi } from 'viem'
import type { CustomToken } from './customTokens'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { customTokenToUniswapToken } from './customTokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

/**
 * 使用viem获取自定义代币余额
 */
export function useCustomTokenBalance(
  customToken: CustomToken | null,
  enabled: boolean = true
) {
  const { evmAccount } = useWallet()
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ['custom-token-balance', customToken?.chainId, customToken?.address, evmAccount?.address],
    queryFn: async () => {
      if (!customToken || !evmAccount?.address) {
        return null
      }

      try {
        // 获取链信息以创建publicClient
        const chainInfo = getChainInfo(customToken.chainId)
        if (!chainInfo) {
          return null
        }

        // 获取RPC URL（优先使用私有RPC，否则使用公共RPC）
        const rpcUrls = chainInfo.rpcUrls?.[RPCType.Private]?.http || chainInfo.rpcUrls?.[RPCType.Public]?.http
        if (!rpcUrls || rpcUrls.length === 0) {
          return null
        }

        // 创建publicClient（如果当前链不匹配）
        let client: PublicClient
        if (publicClient?.chain?.id === customToken.chainId && publicClient) {
          client = publicClient as PublicClient
        } else {
          client = createPublicClient({
            chain: chainInfo as any, // UniverseChainInfo extends WagmiChain
            transport: http(rpcUrls[0]),
          }) as PublicClient
        }

        // 使用viem读取ERC20余额
        const balance = await client.readContract({
          address: customToken.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [evmAccount.address as `0x${string}`],
        })

        // 转换为Uniswap格式
        const token = customTokenToUniswapToken(customToken)
        const balanceString = formatUnits(balance, customToken.decimals)
        
        const currencyAmount = getCurrencyAmount({
          value: balanceString,
          valueType: ValueType.Exact,
          currency: token,
        })

        return {
          balance: currencyAmount,
          rawBalance: balance,
          balanceString,
        }
      } catch (error) {
        console.error('[useCustomTokenBalance] Failed to fetch balance:', error)
        return null
      }
    },
    enabled: enabled && !!customToken && !!evmAccount?.address,
    staleTime: 10 * 1000, // 10秒
    gcTime: 1 * 60 * 1000, // 1分钟
    retry: 1,
  })
}

/**
 * 批量获取多个自定义代币的余额
 */
export function useCustomTokenBalances(
  customTokens: CustomToken[],
  chainId?: UniverseChainId,
  enabled: boolean = true
) {
  const { evmAccount } = useWallet()
  const publicClient = usePublicClient()

  // 过滤出指定链的代币
  const tokensForChain = chainId
    ? customTokens.filter((t) => t.chainId === chainId)
    : customTokens

  return useQuery({
    queryKey: ['custom-token-balances', tokensForChain.map((t) => `${t.chainId}-${t.address}`).join(','), evmAccount?.address],
    queryFn: async () => {
      if (!evmAccount?.address || tokensForChain.length === 0) {
        return []
      }

      const publicClients = new Map<number, PublicClient>()

      const balances = await Promise.all(
        tokensForChain.map(async (customToken) => {
          try {
            let client = publicClients.get(customToken.chainId)
            if (!client) {
              // 获取链信息以创建publicClient
              const chainInfo = getChainInfo(customToken.chainId)
              if (!chainInfo) {
                return null
              }

              // 获取RPC URL（优先使用私有RPC，否则使用公共RPC）
              const rpcUrls = chainInfo.rpcUrls?.[RPCType.Private]?.http || chainInfo.rpcUrls?.[RPCType.Public]?.http
              if (!rpcUrls || rpcUrls.length === 0) {
                return null
              }

              // 如果当前链匹配，使用现有的publicClient，否则创建新的
              if (publicClient?.chain?.id === customToken.chainId && publicClient) {
                client = publicClient as PublicClient
              } else {
                client = createPublicClient({
                  chain: chainInfo as any, // UniverseChainInfo extends WagmiChain
                  transport: http(rpcUrls[0]),
                }) as PublicClient
              }

              if (!client) {
                return null
              }
              publicClients.set(customToken.chainId, client)
            }

            const balance = await client.readContract({
              address: customToken.address as `0x${string}`,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [evmAccount.address as `0x${string}`],
            })

            const token = customTokenToUniswapToken(customToken)
            const balanceString = formatUnits(balance, customToken.decimals)
            
            const currencyAmount = getCurrencyAmount({
              value: balanceString,
              valueType: ValueType.Exact,
              currency: token,
            })

            // 确保 currencyAmount 是有效的
            if (!currencyAmount || typeof currencyAmount.toExact !== 'function') {
              console.warn(`[useCustomTokenBalances] Failed to create currency amount for ${customToken.symbol}`)
              return null
            }

            return {
              customToken,
              token,
              balance: currencyAmount,
              rawBalance: balance,
              balanceString,
            }
          } catch (error) {
            console.error(`[useCustomTokenBalances] Failed to fetch balance for ${customToken.symbol}:`, error)
            return null
          }
        })
      )

      return balances.filter((b): b is NonNullable<typeof b> => b !== null)
    },
    enabled: enabled && !!evmAccount?.address && tokensForChain.length > 0,
    staleTime: 10 * 1000, // 10秒
    gcTime: 1 * 60 * 1000, // 1分钟
    retry: 1,
  })
}

