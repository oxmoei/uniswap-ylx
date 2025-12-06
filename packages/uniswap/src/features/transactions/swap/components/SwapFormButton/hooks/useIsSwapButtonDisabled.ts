import { useActiveAddress, useActiveWallet } from 'uniswap/src/features/accounts/store/hooks'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { useIsShowingWebFORNudge, useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { CurrencyField } from 'uniswap/src/types/currency'

const useIsReviewButtonDisabled = (): boolean => {
  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const { isTradeMissing, hasOutputAmount, chainId } = useSwapFormStoreDerivedSwapInfo((s) => ({
    isTradeMissing: !s.trade.trade,
    // 检查是否有输出金额（可能来自 trade.trade 或 usdValueBasedOutputAmount）
    hasOutputAmount: !!s.currencyAmounts[CurrencyField.OUTPUT]?.greaterThan(0),
    chainId: s.chainId,
  }))

  const activeAccountAddress = useActiveAddress(chainId)
  const isMissingPlatformWallet = useIsMissingPlatformWallet(chainId)

  const { blockingWarning } = useParsedSwapWarnings()
  const { isBlocked: isBlockedAccount, isBlockedLoading: isBlockedAccountLoading } = useIsBlocked(activeAccountAddress)
  const { walletNeedsRestore } = useTransactionModalContext()

  // 如果有输出金额（无论是来自 trade 还是 USD 价值计算），则不禁用按钮
  // 只有当既没有 trade 也没有输出金额时，才禁用按钮
  const isMissingSwapResult = isTradeMissing && !hasOutputAmount

  return (
    !!blockingWarning ||
    isBlockedAccount ||
    isBlockedAccountLoading ||
    walletNeedsRestore ||
    isSubmitting ||
    isMissingSwapResult ||
    isMissingPlatformWallet
  )
}

// TODO(WEB-5090): Simplify logic, deduplicate disabled vs isReviewButtonDisabled
export const useIsSwapButtonDisabled = (): boolean => {
  const isReviewButtonDisabled = useIsReviewButtonDisabled()
  const { swapRedirectCallback } = useTransactionModalContext()

  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)

  const activeWallet = useActiveWallet(chainId)
  const walletCannotSign = activeWallet?.signingCapability === SigningCapability.None

  const isWebFORNudgeEnabled = useIsWebFORNudgeEnabled()
  const isShowingWebFORNudge = useIsShowingWebFORNudge()

  if (isWebFORNudgeEnabled && isShowingWebFORNudge) {
    return true
  } else if (isWebFORNudgeEnabled && !isShowingWebFORNudge) {
    return false
  }
  return (
    // Only disable if the wallet is connected, review button is disabled, wallet is a signable-wallet, and there is no swap redirect callback

    !!activeWallet && // don't disable the button if unconnected because they need to click it to connect
    isReviewButtonDisabled && // the main disabling logic
    !walletCannotSign && // don't disable if wallet is viewonly because wallet app wants to allow clicking so it can pop up a "this wallet is view only"
    !swapRedirectCallback
  ) // never disable the button if there is a callback to click it
}
