import type { Order } from "../entities/order";
import type { User } from "../entities/user";

export async function send_order_confirmation(input: {
  order: Order;
  user: User;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Would send confirmation email to user.email
  throw new Error("not implemented — requires email provider");
}
