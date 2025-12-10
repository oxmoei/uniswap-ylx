import type { BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps } from 'react'
import { useCallback } from 'react'
// biome-ignore lint/style/noRestrictedImports: wagmi hooks needed for chain switching
import { useAccount, useSwitchChain } from 'wagmi'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { useChainId } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/hooks/useChainId'
import { useHideTokenSelector } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/hooks/useHideTokenSelector'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

export function SwapTokenSelector({
  isModalOpen,
  focusHook,
}: {
  isModalOpen: boolean
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
}): JSX.Element | null {
  const { selectingCurrencyField, input, output } = useSwapFormStore((s) => ({
    selectingCurrencyField: s.selectingCurrencyField,
    input: s.input,
    output: s.output,
  }))

  const wallet = useWallet()
  const activeEVMAccountAddress = wallet.evmAccount?.address
  const activeSVMAccountAddress = wallet.svmAccount?.address
  const chainId = useChainId()
  const { chainId: currentChainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  const handleHideTokenSelector = useHideTokenSelector()
  const onSelectCurrency = useOnSelectCurrency({ onSelect: handleHideTokenSelector })

  // 处理网络切换：当用户在 TokenSelector 中切换网络时，同步切换钱包网络
  const handleSelectChain = useCallback(
    async (newChainId: UniverseChainId | null) => {
      if (!newChainId || !isConnected) {
        return
      }

      // 如果已经是目标网络，无需切换
      if (currentChainId === newChainId) {
        return
      }

      try {
        // 切换钱包网络
        await switchChain({ chainId: newChainId as number })
      } catch (error) {
        // 用户拒绝或切换失败，静默处理
        console.warn('[SwapTokenSelector] Failed to switch chain:', error)
      }
    },
    [currentChainId, isConnected, switchChain],
  )

  if (!isModalOpen) {
    // `TokenSelectorModal` already returns `null` when `isModalOpen` is `false
    // We're adding this extra check, here, to satisfy typescript
    return null
  }

  if (!selectingCurrencyField) {
    throw new Error('TokenSelector rendered without `selectingCurrencyField`')
  }

  return (
    <TokenSelectorModal
      isModalOpen={isModalOpen}
      evmAddress={activeEVMAccountAddress}
      svmAddress={activeSVMAccountAddress}
      chainId={chainId}
      input={input}
      output={output}
      currencyField={selectingCurrencyField}
      flow={TokenSelectorFlow.Swap}
      variation={
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.SwapInput
          : TokenSelectorVariation.SwapOutput
      }
      focusHook={focusHook}
      onClose={handleHideTokenSelector}
      onSelectCurrency={onSelectCurrency}
      onSelectChain={handleSelectChain}
    />
  )
}
