import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, HeightAnimator, Text } from 'ui/src'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { EstimatedSwapTime } from 'uniswap/src/features/transactions/swap/components/EstimatedBridgeTime'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/MaxSlippageRow'
import { PriceImpactRow } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/PriceImpactRow'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { AcceptNewQuoteRow } from 'uniswap/src/features/transactions/swap/review/SwapDetails/AcceptNewQuoteRow'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isBridge, isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import type {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isMobileApp, isMobileWeb } from 'utilities/src/platform'

interface SwapDetailsProps {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  tokenWarningProps: TokenWarningProps
  tokenWarningChecked?: boolean
  gasFallbackUsed?: boolean
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  newTradeRequiresAcceptance: boolean
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
  setTokenWarningChecked?: (checked: boolean) => void
  txSimulationErrors?: TradingApi.TransactionFailureReason[]
  includesDelegation?: boolean
}

export function SwapDetails({
  acceptedDerivedSwapInfo,
  autoSlippageTolerance,
  customSlippageTolerance,
  derivedSwapInfo,
  feeOnTransferProps,
  tokenWarningProps,
  tokenWarningChecked,
  gasFee,
  uniswapXGasBreakdown,
  newTradeRequiresAcceptance,
  warning,
  onAcceptTrade,
  onShowWarning,
  setTokenWarningChecked,
  txSimulationErrors,
  includesDelegation,
}: SwapDetailsProps): JSX.Element {
  const priceUxEnabled = usePriceUXEnabled()
  const { t } = useTranslation()

  const isBridgeTrade = derivedSwapInfo.trade.trade && isBridge(derivedSwapInfo.trade.trade)
  const routing = derivedSwapInfo.trade.trade?.routing ?? TradingApi.Routing.CLASSIC

  const trade = derivedSwapInfo.trade.trade ?? derivedSwapInfo.trade.indicativeTrade
  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade

  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)

  const showUnichainPoweredMessage = useIsUnichainFlashblocksEnabled(derivedSwapInfo.chainId)

  // 即使没有 trade，也允许显示详细信息
  const hasTrade = !!trade
  const hasAcceptedTrade = !!acceptedTrade

  const estimatedSwapTime: number | undefined = useMemo(() => {
    const tradeQuote = derivedSwapInfo.trade.trade?.quote
    if (!tradeQuote) {
      return undefined
    }

    if (isChained(tradeQuote)) {
      // TODO: SWAP-458 - Add proper typings when available.
      return 'timeEstimateMs' in tradeQuote.quote ? (tradeQuote.quote.timeEstimateMs as number) : undefined
    }
    if (isBridge(tradeQuote)) {
      return tradeQuote.quote.estimatedFillTimeMs
    }

    return undefined
  }, [derivedSwapInfo.trade.trade?.quote])

  // 获取输入和输出代币信息
  const inputCurrency = derivedSwapInfo.currencies.input?.currency
  const outputCurrency = derivedSwapInfo.currencies.output?.currency

  // 如果没有 trade，计算默认的费用（0.25%）
  const defaultSwapFeeUsd = useMemo(() => {
    if (swapFeeUsd !== undefined) {
      return swapFeeUsd
    }
    // 如果没有 swapFeeUsd，基于输出金额计算 0.25% 的费用
    const outputAmount = derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT]
    const outputAmountUSD = derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]
    if (outputAmountUSD) {
      return parseFloat(outputAmountUSD.toExact()) * 0.0025 // 0.25%
    }
    return undefined
  }, [swapFeeUsd, derivedSwapInfo.currencyAmounts, derivedSwapInfo.currencyAmountsUSDValue])

  return (
    <HeightAnimator animationDisabled={isMobileApp || isMobileWeb}>
      <TransactionDetails
        banner={
          hasAcceptedTrade && newTradeRequiresAcceptance && (
            <AcceptNewQuoteRow
              acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
              derivedSwapInfo={derivedSwapInfo}
              onAcceptTrade={onAcceptTrade}
            />
          )
        }
        chainId={derivedSwapInfo.chainId}
        feeOnTransferProps={feeOnTransferProps}
        tokenWarningProps={tokenWarningProps}
        tokenWarningChecked={tokenWarningChecked}
        setTokenWarningChecked={setTokenWarningChecked}
        gasFee={gasFee}
        swapFee={hasAcceptedTrade ? acceptedTrade.swapFee : undefined}
        swapFeeUsd={defaultSwapFeeUsd}
        indicative={hasAcceptedTrade ? acceptedTrade.indicative : false}
        outputCurrency={outputCurrency}
        showExpandedChildren={!!customSlippageTolerance}
        showSeparatorToggle={true}
        showNetworkLogo={!showUnichainPoweredMessage}
        showWarning={warning && !newTradeRequiresAcceptance}
        transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
        uniswapXGasBreakdown={uniswapXGasBreakdown}
        warning={warning}
        estimatedSwapTime={estimatedSwapTime}
        routingType={routing}
        txSimulationErrors={txSimulationErrors}
        amountUserWillReceive={derivedSwapInfo.outputAmountUserWillReceive ?? undefined}
        includesDelegation={includesDelegation}
        onShowWarning={onShowWarning}
        RoutingInfo={
          hasAcceptedTrade && !acceptedTrade.indicative ? (
            <RoutingInfo trade={acceptedTrade} gasFee={gasFee} chainId={acceptedTrade.inputAmount.currency.chainId} />
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
      >
        {hasTrade && (
          <Flex row alignItems="center" justifyContent="space-between">
            <Text color="$neutral2" variant="body3">
              {t('swap.details.rate')}
            </Text>
            <SwapRateRatio trade={trade} derivedSwapInfo={acceptedDerivedSwapInfo} justifyContent="flex-end" />
          </Flex>
        )}
        {hasTrade && <EstimatedSwapTime showIfLongerThanCutoff={false} timeMs={estimatedSwapTime} />}
        {/* 价格影响 - 即使没有 trade 也显示（基于价格计算） */}
        <PriceImpactRow derivedSwapInfo={acceptedDerivedSwapInfo} hide={false} />
        {/* 滑点上限 */}
        {hasAcceptedTrade && isBridgeTrade === false ? (
          <MaxSlippageRow
            acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
            autoSlippageTolerance={autoSlippageTolerance}
            customSlippageTolerance={customSlippageTolerance}
          />
        ) : (
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
    </HeightAnimator>
  )
}
