import '@testing-library/jest-dom';

// Mock scrollTo for all elements, as JSDOM doesn't support it
Object.defineProperty(Element.prototype, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock the unsupported requestAnimationFrame as well
vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
  cb(0);
  return 0;
}));
