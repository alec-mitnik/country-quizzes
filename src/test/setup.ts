import '@testing-library/jest-dom';
import "../styles.css"; // Apply global styles to all tests

// happy-dom doesn't fully implement OffscreenCanvas — canvas-confetti
// runs feature detection on import that calls getContext('2d'), which
// returns null and crashes. Stub it with just enough to survive.
vi.stubGlobal('OffscreenCanvas', class {
  getContext() {
    return {
      fillRect: vi.fn(),
    };
  }
  transferToImageBitmap() {
    return {};
  }
});

// No longer needed with happy-dom
/*
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
*/
