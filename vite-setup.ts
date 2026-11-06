import '@testing-library/jest-dom/vitest'

// jsdom has no layout, so it leaves out scrollIntoView; Select calls it when a menu opens.
Element.prototype.scrollIntoView ??= () => {}
