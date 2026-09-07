declare module 'next/server' {
  export class NextRequest extends Request {
    readonly nextUrl: URL;
  }

  export class NextResponse extends Response {
    static json<T = any>(body: T, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static next(init?: ResponseInit): NextResponse;
  }
}
