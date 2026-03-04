import type { User } from "../entities/user";

export function apply_member_discount(input: {
  discounted_total: number;
  user: User;
}): { member_discount: number; discounted_total: number } {
  const rates: Record<string, number> = {
    none: 0,
    silver: 0.05,
    gold: 0.1,
    platinum: 0.15,
  };

  const rate = rates[input.user.membership_tier] ?? 0;
  const member_discount =
    Math.round(input.discounted_total * rate * 100) / 100;

  return {
    member_discount,
    discounted_total:
      Math.round((input.discounted_total - member_discount) * 100) / 100,
  };
}
