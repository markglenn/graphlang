// Bundles CSS files using PostCSS

export interface CSSBundle {
  css: string;
  sourceMap?: string;
}

export async function bundleCSS(entryPoints: string[], outFile: string): Promise<CSSBundle> {
  throw new Error('not implemented');
}
