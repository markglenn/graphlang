export async function charge_payment(input: {
  discounted_total: number;
  tax_amount: number;
  shipping_cost: number;
  payment_token: string;
}): Promise<
  | { ok: true; charge_id: string; total: number }
  | { ok: false; error: string }
> {
  const total =
    Math.round(
      (input.discounted_total + input.tax_amount + input.shipping_cost) * 100,
    ) / 100;

  // Would call payment processor
  throw new Error("not implemented — requires payment provider");
}
