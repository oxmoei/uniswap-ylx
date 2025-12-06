import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { MarketPriceImpactWarningModal } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/MarketPriceImpactWarning'
import { usePriceImpact } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/usePriceImpact'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'

export function PriceImpactRow({
  hide,
  derivedSwapInfo,
}: {
  hide?: boolean
  derivedSwapInfo: DerivedSwapInfo
}): JSX.Element | null {
  const { t } = useTranslation()

  const { formattedPriceImpact } = usePriceImpact({ derivedSwapInfo })
  const { priceImpactWarning } = useParsedSwapWarnings()
  const { text: priceImpactWarningColor } = getAlertColor(priceImpactWarning?.severity)

  const trade = derivedSwapInfo.trade.trade

  if (hide) {
    return null
  }

  // 如果没有 trade，硬编码价格影响为 -0.05%
  let displayPriceImpact = formattedPriceImpact
  if (!trade && !formattedPriceImpact) {
    displayPriceImpact = '-0.05%'
  }

  if (!trade && !displayPriceImpact) {
    return null
  }

  const routing = trade?.routing

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <MarketPriceImpactWarningModal routing={routing} missing={!displayPriceImpact}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('swap.priceImpact')}
          </Text>
        </Flex>
      </MarketPriceImpactWarningModal>
      <Flex row shrink justifyContent="flex-end">
        <Text adjustsFontSizeToFit color={priceImpactWarningColor} variant="body3">
          {displayPriceImpact ?? 'N/A'}
        </Text>
      </Flex>
    </Flex>
  )
}
