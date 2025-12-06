import { useMemo, useState } from 'react'
import { Price } from '@uniswap/sdk-core'
import { Flex, Text, TouchableArea } from 'ui/src'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { calculateRateLine, getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'

type SwapRateRatioProps = {
  trade: Trade | IndicativeTrade | undefined | null
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  styling?: 'primary' | 'secondary'
  initialInverse?: boolean
  justifyContent?: 'flex-end' | 'flex-start'
}
export function SwapRateRatio({
  trade,
  derivedSwapInfo,
  styling = 'primary',
  initialInverse = false,
  justifyContent = 'flex-start',
}: SwapRateRatioProps): JSX.Element | null {
  const priceUXEnabled = usePriceUXEnabled()
  const formatter = useLocalizationContext()
  const [showInverseRate, setShowInverseRate] = useState(initialInverse)

  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(derivedSwapInfo, priceUXEnabled)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)
  const usdAmountIn = useUSDCValue(inputCurrencyAmount)

  // 计算汇率的价值（USD）
  const latestFiatPriceFormatted = useMemo(() => {
    if (trade) {
      return calculateRateLine({
        usdAmountOut,
        outputCurrencyAmount,
        trade,
        showInverseRate,
        formatter,
      })
    }
    
    // 如果没有 trade，基于输入和输出的 USD 价值计算
    // 显示 1 个输出代币的 USD 价值
    if (usdAmountOut && outputCurrencyAmount) {
      const outputValue = parseFloat(usdAmountOut.toExact())
      const outputAmount = parseFloat(outputCurrencyAmount.toExact())
      if (outputAmount > 0) {
        const pricePerOutput = outputValue / outputAmount
        return formatter.convertFiatAmountFormatted(pricePerOutput, NumberType.FiatTokenPrice)
      }
    }
    
    return undefined
  }, [trade, usdAmountOut, usdAmountIn, outputCurrencyAmount, inputCurrencyAmount, showInverseRate, formatter])

  // 如果没有 trade，尝试基于 currencyAmounts 计算兑换率
  let latestRate: string | null = null
  if (trade) {
    latestRate = getRateToDisplay({ formatter, trade, showInverseRate })
  } else {
    // 基于 currencyAmounts 计算兑换率
    // 汇率应显示为"1输出代币符号=***输入代币符号"
    const inputAmount = derivedSwapInfo.currencyAmounts[CurrencyField.INPUT]
    const outputAmount = derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT]
    
    if (inputAmount && outputAmount && inputAmount.greaterThan(0) && outputAmount.greaterThan(0)) {
      try {
        // 计算 1 个输出代币 = 多少个输入代币
        // Price 的构造是: baseCurrency/quoteCurrency = baseAmount/quoteAmount
        // 我们想要: 1 output = xxx input，所以应该是 output/input
        const price = new Price(outputAmount.currency, inputAmount.currency, outputAmount.quotient, inputAmount.quotient)
        
        const formattedPrice = formatter.formatNumberOrString({
          value: price.toSignificant(),
          type: NumberType.SwapPrice,
        })
        
        const outputSymbol = getSymbolDisplayText(outputAmount.currency.symbol)
        const inputSymbol = getSymbolDisplayText(inputAmount.currency.symbol)
        latestRate = `1 ${outputSymbol} = ${formattedPrice} ${inputSymbol}`
      } catch (error) {
        // 如果计算失败，不显示兑换率
        console.warn('[SwapRateRatio] 无法计算兑换率:', error)
      }
    }
  }
  
  const rateAmountUSD = latestFiatPriceFormatted
  const isPrimary = styling === 'primary'

  // 如果没有 trade 也没有有效的 currencyAmounts，不显示
  if (!trade && !latestRate) {
    return null
  }

  return (
    <TouchableArea
      group
      flexDirection="row"
      justifyContent={justifyContent}
      flexGrow={1}
      onPress={() => setShowInverseRate(!showInverseRate)}
    >
      <Flex row width="max-content">
        <Text
          adjustsFontSizeToFit
          $group-hover={{ color: isPrimary ? '$neutral1Hovered' : '$neutral2Hovered' }}
          color={isPrimary ? '$neutral1' : '$neutral2'}
          numberOfLines={1}
          variant="body3"
        >
          {latestRate}
        </Text>
        <Text
          $group-hover={{ color: isPrimary ? '$neutral1Hovered' : '$neutral3Hovered' }}
          color={isPrimary ? '$neutral2' : '$neutral3'}
          variant="body3"
        >
          {rateAmountUSD && ` (${rateAmountUSD})`}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
