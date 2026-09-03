// mammoth ships without TypeScript types — minimal shim for the one function we use.
declare module 'mammoth' {
  export function extractRawText(input: { buffer: Buffer } | { path: string }): Promise<{
    value: string
    messages: unknown[]
  }>
}
