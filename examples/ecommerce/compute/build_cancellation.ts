export function build_cancellation(input: {
  reason: string;
  cancelled_at: string;
}): {
  status: { variant: "Cancelled"; reason: string; cancelled_at: string };
} {
  return {
    status: {
      variant: "Cancelled",
      reason: input.reason,
      cancelled_at: input.cancelled_at,
    },
  };
}
