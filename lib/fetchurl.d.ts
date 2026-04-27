declare module '@/lib/fetchurl.mjs' {
  export const FETCH_URL_MAX_CHARS: number
  export function runFetchUrlTool(input: { url: string }): Promise<
    | { ok: true; text: string }
    | { ok: false; code: string; message: string }
  >
  export function validatePublicHttpUrl(
    raw: string,
  ):
    | { ok: true; href: string }
    | { ok: false; code: string; message: string }
  export function truncateText(text: string, max: number): string
}
