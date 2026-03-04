import type { User } from "../entities/user";

export async function get_tax_rate(input: {
  user: User;
}): Promise<{ tax_rate: number }> {
  // Would call external tax API using user's state
  const rates: Record<string, number> = {
    CA: 0.0875,
    NY: 0.08,
    TX: 0.0625,
    OR: 0.0,
    WA: 0.065,
  };
  return { tax_rate: rates[input.user.state] ?? 0.07 };
}
