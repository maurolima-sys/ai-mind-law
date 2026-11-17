import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import { ReadableStream, WritableStream, TransformStream, ByteLengthQueuingStrategy, CountQueuingStrategy } from "node:stream/web";

// Streams API polyfill — required by @tanstack/start-client-core in jsdom
Object.assign(globalThis, { ReadableStream, WritableStream, TransformStream, ByteLengthQueuingStrategy, CountQueuingStrategy });

expect.extend(matchers);

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
