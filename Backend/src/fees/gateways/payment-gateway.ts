export interface CreateOrderInput {
  amount: number;
  currency: string;
  reference: string;
  studentName?: string;
}
export interface CreateOrderResult {
  gatewayRef: string;
  checkoutUrl?: string;
  clientPayload?: Record<string, unknown>;
}
export interface VerifiedPayment {
  gatewayRef: string;
  success: boolean;
  amount?: number;
}
export interface RefundInput {
  gatewayRef: string;
  amount: number;
  currency: string;
  reason?: string;
}
export interface RefundResult {
  refundGatewayRef: string;
  success: boolean;
  status: string;
}

/**
 * Payment gateway abstraction (Razorpay / Stripe / PayU …). Implementations create hosted-checkout orders and
 * verify signed webhooks. Card data never touches this backend; only order references and results do.
 */
export interface PaymentGateway {
  readonly name: string;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  /** Verify the webhook signature/body and return the normalised result; throw if the signature is invalid. */
  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<VerifiedPayment>;
  /** Optional refund call to payment provider */
  refund?(input: RefundInput): Promise<RefundResult>;
}
export const PAYMENT_GATEWAYS = Symbol('PAYMENT_GATEWAYS');
