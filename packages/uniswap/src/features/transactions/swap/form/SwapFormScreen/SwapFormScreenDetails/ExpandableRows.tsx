import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Accordion, Flex, Text } from 'ui/src'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/MaxSlippageRow'
import { PriceImpactRow } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/PriceImpactRow'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

export function ExpandableRows(): JSX.Element | null {
  const { t } = useTranslation()
  const { gasFee, gasFeeBreakdown } = useSwapTxStore((s) => {
    if (isUniswapX(s)) {
      return {
        gasFee: s.gasFee,
        gasFeeBreakdown: s.gasFeeBreakdown,
      }
    }

    return {
      gasFee: s.gasFee,
      gasFeeBreakdown: undefined,
    }
  })

  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const { priceImpactWarning } = useParsedSwapWarnings()
  const showPriceImpactWarning = Boolean(priceImpactWarning)

  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const autoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)

  const { chainId, trade, currencies } = derivedSwapInfo

  const swapFeeUsdFromTrade = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)
  const feeOnTransferProps = useFeeOnTransferAmounts(derivedSwapInfo)

  // 即使没有 trade，也显示详细信息
  const hasTrade = !!trade.trade
  const inputCurrency = currencies.input?.currency
  const outputCurrency = currencies.output?.currency

  // 如果没有 trade，使用默认值
  const routingType = trade.trade?.routing ?? TradingApi.Routing.CLASSIC
  const swapFee = trade.trade?.swapFee
  const indicative = trade.trade?.indicative ?? false

  // 如果没有 trade 且没有 swapFeeUsd，基于输出金额计算默认的 0.25% 费用
  const swapFeeUsd = useMemo(() => {
    if (swapFeeUsdFromTrade !== undefined) {
      return swapFeeUsdFromTrade
    }
    // 如果没有 swapFeeUsd，基于输出金额计算 0.25% 的费用
    const outputAmountUSD = derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]
    if (outputAmountUSD) {
      return parseFloat(outputAmountUSD.toExact()) * 0.0025 // 0.25%
    }
    return undefined
  }, [swapFeeUsdFromTrade, derivedSwapInfo.currencyAmountsUSDValue])

  return (
    <Accordion.HeightAnimator animation="fast" mt="$spacing8">
      <Accordion.Content animation="fast" p="$none" exitStyle={{ opacity: 0 }}>
        <TransactionDetails
          showExpandedChildren
          routingType={routingType}
          chainId={chainId}
          gasFee={gasFee}
          swapFee={swapFee}
          swapFeeUsd={swapFeeUsd}
          indicative={indicative}
          feeOnTransferProps={feeOnTransferProps}
          showGasFeeError={false}
          showSeparatorToggle={false}
          outputCurrency={outputCurrency}
          transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
          uniswapXGasBreakdown={gasFeeBreakdown}
          RoutingInfo={
            hasTrade ? (
              <RoutingInfo trade={trade.trade} gasFee={gasFee} chainId={chainId} />
            ) : (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$neutral2" variant="body3">
                  {t('swap.details.orderRouting')}
                </Text>
                <Text color="$neutral1" variant="body3">
                  Uniswap API
                </Text>
              </Flex>
            )
          }
          RateInfo={
            showPriceImpactWarning ? (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$neutral2" variant="body3">
                  {t('swap.details.rate')}
                </Text>
                <Flex row shrink justifyContent="flex-end">
                  <SwapRateRatio trade={trade.trade ?? undefined} derivedSwapInfo={derivedSwapInfo} />
                </Flex>
              </Flex>
            ) : undefined
          }
        >
          {/* Price impact row is hidden if a price impact warning is already being shown in the expando toggle row. */}
          <PriceImpactRow derivedSwapInfo={derivedSwapInfo} hide={showPriceImpactWarning} />
          {/* 只有在有 trade 且不是桥接交易时才显示滑点上限 */}
          {hasTrade && routingType !== TradingApi.Routing.BRIDGE && (
            <MaxSlippageRow
              acceptedDerivedSwapInfo={derivedSwapInfo}
              autoSlippageTolerance={autoSlippageTolerance}
              customSlippageTolerance={customSlippageTolerance}
            />
          )}
          {/* 如果没有 trade，显示简化的滑点信息 */}
          {!hasTrade && (
            <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
              <Flex row shrink alignItems="center" gap="$spacing4">
                <Text color="$neutral2" numberOfLines={3} variant="body3">
                  {t('swap.details.slippage')}
                </Text>
              </Flex>
              <Flex centered row gap="$spacing8">
                {!customSlippageTolerance && (
                  <Flex centered backgroundColor="$surface3" borderRadius="$roundedFull" px="$spacing4" py="$spacing2">
                    <Text color="$neutral2" variant="buttonLabel3">
                      {t('swap.settings.slippage.control.auto')}
                    </Text>
                  </Flex>
                )}
                <Text color="$neutral1" variant="body3">
                  {autoSlippageTolerance
                    ? `${(autoSlippageTolerance * 100).toFixed(1)}%`
                    : customSlippageTolerance
                      ? `${(customSlippageTolerance * 100).toFixed(1)}%`
                      : '2.5%'}
                </Text>
              </Flex>
            </Flex>
          )}
        </TransactionDetails>
      </Accordion.Content>
    </Accordion.HeightAnimator>
  )
}
