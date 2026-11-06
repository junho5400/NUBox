import '@testing-library/jest-dom/vitest'

// jsdom has no layout, so it leaves out scrollIntoView; Select calls it when a menu opens.
Element.prototype.scrollIntoView ??= () => {}

// jsdom has <dialog> but not showModal/close; Dialog uses them to open and close.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false
  this.dispatchEvent(new Event('close'))
}
