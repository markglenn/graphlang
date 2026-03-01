// Generates HTML, JS, and CSS output from the compiled graph

export interface CodegenOutput {
  html: Map<string, string>;  // route -> HTML
  js: Map<string, string>;    // projection -> JS bundle
  css: string;                // combined CSS
}

export async function codegen(graphDir: string, outDir: string): Promise<CodegenOutput> {
  throw new Error('not implemented');
}
