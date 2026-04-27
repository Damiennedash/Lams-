export type PaymentOperator = 'MOOV' | 'YAS'

export interface PaymentRequest {
  operator: PaymentOperator
  phone: string
  amount: number
  orderId: string
  customerName: string
}

export interface PaymentResponse {
  success: boolean
  reference?: string
  message: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
}

export async function initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
  if (req.operator === 'MOOV') {
    return initiateMoovPayment(req)
  }
  return initiateYasPayment(req)
}

async function initiateMoovPayment(req: PaymentRequest): Promise<PaymentResponse> {
  try {
    const apiUrl = process.env.MOOV_API_URL
    const apiKey = process.env.MOOV_API_KEY
    const merchantId = process.env.MOOV_MERCHANT_ID

    if (!apiUrl || !apiKey || !merchantId) {
      return simulatePayment(req)
    }

    const response = await fetch(`${apiUrl}/v1/payment/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Merchant-Id': merchantId,
      },
      body: JSON.stringify({
        phone: req.phone,
        amount: req.amount,
        currency: 'XOF',
        reference: req.orderId,
        description: `Commande LAMS #${req.orderId.slice(-8).toUpperCase()}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      }),
    })

    const data = await response.json()
    if (response.ok) {
      return {
        success: true,
        reference: data.reference || data.transaction_id,
        message: 'Demande de paiement envoyée. Veuillez confirmer sur votre téléphone.',
        status: 'PENDING',
      }
    }
    return { success: false, message: data.message || 'Erreur de paiement Moov', status: 'FAILED' }
  } catch {
    return simulatePayment(req)
  }
}

async function initiateYasPayment(req: PaymentRequest): Promise<PaymentResponse> {
  try {
    const apiUrl = process.env.YAS_API_URL
    const apiKey = process.env.YAS_API_KEY
    const merchantId = process.env.YAS_MERCHANT_ID

    if (!apiUrl || !apiKey || !merchantId) {
      return simulatePayment(req)
    }

    const response = await fetch(`${apiUrl}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'X-Merchant-Id': merchantId,
      },
      body: JSON.stringify({
        msisdn: req.phone,
        amount: req.amount,
        currency: 'XOF',
        order_id: req.orderId,
        description: `Commande LAMS #${req.orderId.slice(-8).toUpperCase()}`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      }),
    })

    const data = await response.json()
    if (response.ok) {
      return {
        success: true,
        reference: data.payment_ref || data.ref,
        message: 'Demande de paiement envoyée. Veuillez confirmer sur votre téléphone.',
        status: 'PENDING',
      }
    }
    return { success: false, message: data.message || 'Erreur de paiement Yas', status: 'FAILED' }
  } catch {
    return simulatePayment(req)
  }
}

function simulatePayment(req: PaymentRequest): PaymentResponse {
  const ref = `SIM-${Date.now()}-${req.orderId.slice(-6).toUpperCase()}`
  return {
    success: true,
    reference: ref,
    message: `Paiement simulé via ${req.operator}. En production, le client recevrait une invite sur son téléphone.`,
    status: 'PENDING',
  }
}
