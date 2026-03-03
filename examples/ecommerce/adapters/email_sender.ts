interface SendInput {
  to: string;
  subject: string;
  template: string;
  data: unknown;
}

interface SendOutput {
  message_id: string;
  status: "sent" | "queued" | "failed";
}

export async function send(input: SendInput): Promise<SendOutput> {
  // Adapter implementation — actual SMTP integration goes here.
  // This is the typed boundary; the runtime calls this function
  // with validated inputs matching the adapter contract.
  throw new Error(
    `email_sender.send not configured: would send "${input.subject}" to ${input.to}`,
  );
}
