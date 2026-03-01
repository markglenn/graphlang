// Compiles projection/component definitions into client-side JavaScript bundles

export interface ClientBundle {
  projection: string;
  code: string;
  sourceMap?: string;
}

export async function compileClientBundle(projection: string, graphDir: string): Promise<ClientBundle> {
  throw new Error('not implemented');
}
