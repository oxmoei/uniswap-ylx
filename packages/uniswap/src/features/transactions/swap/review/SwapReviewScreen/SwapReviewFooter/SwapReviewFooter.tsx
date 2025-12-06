import { memo, useMemo } from 'react'
import { Flex, IconButton, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import { SubmitSwapButton } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useShowInterfaceReviewSteps } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapReviewWarningStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { UnichainPoweredMessage } from 'uniswap/src/features/transactions/TransactionDetails/UnichainPoweredMessage'
import { getShouldDisplayTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard'
import { isWebPlatform } from 'utilities/src/platform'

export const SwapReviewFooter = memo(function SwapReviewFooter(): JSX.Element | null {
  const showInterfaceReviewSteps = useShowInterfaceReviewSteps()
  const { onPrev } = useSwapOnPrevious()
  const { disabled, showPendingUI, warning, onSubmit } = useSwapSubmitButton()
  const isShortMobileDevice = useIsShortMobileDevice()
  const showUnichainPoweredMessage = useSwapReviewTransactionStore((s) => {
    const isUnichain = s.chainId && [UniverseChainId.Unichain, UniverseChainId.UnichainSepolia].includes(s.chainId)
    if (!isUnichain) {
      return false
    }
    const routing = s.derivedSwapInfo.trade.trade?.routing
    return routing !== undefined && !isChained({ routing })
  })

  if (showInterfaceReviewSteps) {
    return null
  }

  return (
    <TransactionModalFooterContainer>
      {showUnichainPoweredMessage && <UnichainPoweredMessage />}
      <Flex row gap="$spacing8">
        {!isWebPlatform && !showPendingUI && (
          <IconButton
            icon={<BackArrow />}
            emphasis="secondary"
            size={isShortMobileDevice ? 'medium' : 'large'}
            onPress={onPrev}
          />
        )}
        <SubmitSwapButton disabled={disabled} showPendingUI={showPendingUI} warning={warning} onSubmit={onSubmit} />
      </Flex>
    </TransactionModalFooterContainer>
  )
})

function useSwapSubmitButton(): {
  disabled: boolean
  showPendingUI: boolean
  warning: Warning | undefined
  onSubmit: () => Promise<void>
} {
  const {
    tokenWarningProps,
    feeOnTransferProps,
    blockingWarning,
    newTradeRequiresAcceptance,
    reviewScreenWarning,
    swapTxContext,
    isWrap,
  } = useSwapReviewTransactionStore((s) => ({
    tokenWarningProps: s.tokenWarningProps,
    feeOnTransferProps: s.feeOnTransferProps,
    blockingWarning: s.blockingWarning,
    newTradeRequiresAcceptance: s.newTradeRequiresAcceptance,
    reviewScreenWarning: s.reviewScreenWarning,
    swapTxContext: s.swapTxContext,
    isWrap: s.isWrap,
  }))

  const tokenWarningChecked = useSwapReviewWarningStore((s) => s.tokenWarningChecked)
  const { isSubmitting, showPendingUI } = useSwapFormStore((s) => ({
    isSubmitting: s.isSubmitting,
    showPendingUI: s.showPendingUI,
  }))
  const onSwapButtonClick = useSwapReviewCallbacksStore((s) => s.onSwapButtonClick)
  const { shouldDisplayTokenWarningCard } = getShouldDisplayTokenWarningCard({
    tokenWarningProps,
    feeOnTransferProps,
  })

  const { derivedSwapInfo } = useSwapReviewTransactionStore((s) => ({
    derivedSwapInfo: s.derivedSwapInfo,
  }))

  const submitButtonDisabled = useMemo(() => {
    const validSwap = isValidSwapTxContext(swapTxContext)
    const isTokenWarningBlocking = shouldDisplayTokenWarningCard && !tokenWarningChecked

    // 如果没有 trade，检查是否有输入和输出金额（基于 USD 价值计算）
    const hasInputAmount = !!derivedSwapInfo.currencyAmounts[CurrencyField.INPUT]?.greaterThan(0)
    const hasOutputAmount = !!derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT]?.greaterThan(0)
    const hasValidAmounts = hasInputAmount && hasOutputAmount

    return (
      (!validSwap && !isWrap && !hasValidAmounts) ||
      !!blockingWarning ||
      newTradeRequiresAcceptance ||
      isSubmitting ||
      isTokenWarningBlocking
    )
  }, [
    swapTxContext,
    isWrap,
    blockingWarning,
    newTradeRequiresAcceptance,
    isSubmitting,
    tokenWarningChecked,
    shouldDisplayTokenWarningCard,
    derivedSwapInfo.currencyAmounts,
  ])

  return {
    disabled: submitButtonDisabled,
    showPendingUI,
    onSubmit: onSwapButtonClick,
    warning: reviewScreenWarning?.warning,
  }
}
