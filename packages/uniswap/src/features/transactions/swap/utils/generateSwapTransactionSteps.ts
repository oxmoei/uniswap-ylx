import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { createPermit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { createRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { orderClassicSwapSteps } from 'uniswap/src/features/transactions/swap/steps/classicSteps'
import { createSignUniswapXOrderStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  createSwapTransactionAsyncStep,
  createSwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { orderUniswapXSteps } from 'uniswap/src/features/transactions/swap/steps/uniswapxSteps'
import { isValidSwapTxContext, SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'

export function generateSwapTransactionSteps(txContext: SwapTxAndGasInfo): TransactionStep[] {
  const isValidSwap = isValidSwapTxContext(txContext)

  if (isValidSwap) {
    const { trade, approveTxRequest, revocationTxRequest } = txContext

    const revocation = createRevocationTransactionStep(revocationTxRequest, trade.inputAmount.currency.wrapped)

    if (isClassic(txContext)) {
      const { swapRequestArgs } = txContext

      if (txContext.unsigned) {
        // Unsigned 交易仍然需要 permit 签名，但最终会使用批量交易
        return orderClassicSwapSteps({
          revocation,
          approval: undefined,
          permit: createPermit2SignatureStep(txContext.permit.typedData, trade.inputAmount.currency),
          swap: createSwapTransactionAsyncStep(swapRequestArgs),
        })
      }
      
      // 完全移除单独的 Approve 和 Swap 步骤，强制使用批量交易
      // 确保 txRequests 存在且不为空
      if (!txContext.txRequests || txContext.txRequests.length === 0) {
        // 如果没有 txRequests，返回空数组（这不应该发生，但作为安全措施）
        return []
      }

      // 构建批量交易请求数组
      const batchedTxRequests: ValidatedTransactionRequest[] = []

      // 1. 如果存在 approveTxRequest，首先添加它
      if (approveTxRequest) {
        batchedTxRequests.push(approveTxRequest)
      }

      // 2. 如果存在 permit 交易，也将其包含在批量交易中
      if (txContext.permit && txContext.permit.method === PermitMethod.Transaction) {
        batchedTxRequests.push(txContext.permit.txRequest)
      }

      // 3. 添加所有 Swap 交易请求
      batchedTxRequests.push(...txContext.txRequests)

      // 确保至少有一个交易请求
      if (batchedTxRequests.length === 0) {
        return []
      }

      // 使用批量交易执行所有交易
      return orderClassicSwapSteps({
        permit: undefined,
        swap: createSwapTransactionStepBatched(batchedTxRequests),
      })
    } else if (isUniswapX(txContext)) {
      // UniswapX 使用不同的流程，保留原有逻辑
      return orderUniswapXSteps({
        revocation,
        approval: undefined,
        signOrder: createSignUniswapXOrderStep(txContext.permit.typedData, txContext.trade.quote.quote),
      })
    } else if (isBridge(txContext)) {
      // Bridge 交易也强制使用批量交易
      if (txContext.txRequests && txContext.txRequests.length > 0) {
        // 如果存在 approveTxRequest，将其包含在批量交易中
        const batchedTxRequests = approveTxRequest
          ? [approveTxRequest, ...txContext.txRequests]
          : txContext.txRequests
        return orderClassicSwapSteps({
          permit: undefined,
          swap: createSwapTransactionStepBatched(batchedTxRequests),
        })
      }
    }
  }

  return []
}
