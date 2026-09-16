import { MarkedPipe } from './marked.pipe';

describe('MarkedPipe', () => {
  let pipe: MarkedPipe;

  beforeEach(() => {
    pipe = new MarkedPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should render markdown bold as HTML strong', () => {
    const html = pipe.transform('Hello **world**') as string;
    expect(html).toMatch(/<strong>world<\/strong>|<b>world<\/b>/);
  });

  it('should not leave raw script tags in output (HTML tokens escaped)', () => {
    const html = pipe.transform('<script>alert(1)</script>') as string;
    expect(html.toLowerCase()).not.toContain('<script>');
    expect(html).toContain('&lt;');
  });

  it('should not emit javascript: links as clickable href', () => {
    const html = pipe.transform('[clickme](javascript:alert(1))') as string;
    expect(html).not.toMatch(/href=["']javascript:/i);
  });

  it('should add rel noopener on http links', () => {
    const html = pipe.transform('[x](https://example.com)') as string;
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('should treat escaped newlines as real newlines (GFM breaks)', () => {
    const html = pipe.transform('a\\nb') as string;
    expect(html).toMatch(/<br\s*\/?>/i);
  });

  it('should coerce null to empty string', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
