export interface User {
  id: string;
  email: string;
  name: string;
  date_of_birth: string;
  membership_tier: "none" | "silver" | "gold" | "platinum";
  state: string;
}
