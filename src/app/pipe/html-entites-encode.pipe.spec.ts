import { HtmlEntitiesEncodePipe } from './html-entities-encode.pipe';

describe('HtmlEntitiesEncodePipe', () => {
  let pipe: HtmlEntitiesEncodePipe;

  beforeEach(() => {
    pipe = new HtmlEntitiesEncodePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should encode angle brackets so raw HTML tags are not preserved (XSS mitigation)', () => {
    const malicious = '<script>alert(1)</script><img src=x onerror=alert(1)>';
    const out = pipe.transform(malicious);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;');
    expect(out).toContain('&gt;');
  });

  it('should encode double quotes for attribute injection contexts', () => {
    expect(pipe.transform('say "hello"')).toContain('&quot;');
  });

  it('should replace newlines with <br> via replaceEndOfLine', () => {
    const out = pipe.transform('line1\nline2');
    expect(out).toContain('<br>');
    expect(out).toContain('line1');
    expect(out).toContain('line2');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(pipe.transform('  abc  ')).toBe('abc');
  });

  it('should coerce non-string input to string before encoding', () => {
    expect(pipe.transform(123 as any)).toBe('123');
  });
});
