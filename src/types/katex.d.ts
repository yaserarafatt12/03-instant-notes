declare module 'katex' {
  export interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    strict?: boolean | string;
    trust?: boolean;
  }

  const katex: {
    renderToString(tex: string, options?: KatexOptions): string;
    render(tex: string, element: HTMLElement, options?: KatexOptions): void;
  };

  export default katex;
}
