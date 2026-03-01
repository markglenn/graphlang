// Lints CSS files for valid use of GraphLang data-gl-* attributes

export interface CSSLintError {
  file: string;
  line: number;
  message: string;
  selector: string;
}

export function lintCSS(cssSource: string, filename: string): CSSLintError[] {
  throw new Error('not implemented');
}
