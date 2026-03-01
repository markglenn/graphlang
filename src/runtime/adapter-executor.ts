export interface AdapterCallResult {
  success: boolean;
  output: unknown;
  error?: string;
}

export async function executeAdapterAction(
  adapterName: string,
  actionName: string,
  input: Record<string, unknown>
): Promise<AdapterCallResult> {
  throw new Error('not implemented');
}
