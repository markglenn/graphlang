import type { User } from "../entities/user";

export function verify_age(input: {
  user: User;
}): { ok: true } | { ok: false; error: string } {
  const dob = new Date(input.user.date_of_birth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const had_birthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  const actual_age = had_birthday ? age : age - 1;

  if (actual_age < 21) {
    return { ok: false, error: "Must be 21 or older to purchase wine" };
  }
  return { ok: true };
}
