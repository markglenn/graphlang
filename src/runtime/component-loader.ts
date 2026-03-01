export interface LoadedComponent {
  name: string;
  render: (props: Record<string, unknown>) => string;
}

export async function loadComponent(name: string, sourcePath: string): Promise<LoadedComponent> {
  throw new Error('not implemented');
}
