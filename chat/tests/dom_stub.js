// Minimal DOM shim -- just enough for the real chat/index.html script to load
// and run without a browser. Not a full DOM implementation; only implements
// what this specific script actually touches.

function makeElement() {
  const listeners = {};
  const el = {
    value: "",
    style: {},
    disabled: false,
    className: "",
    textContent: "",
    innerHTML: "",
    children: [],
    classList: {
      toggle(cls, on) { /* no-op, sufficient for our tests */ },
      add() {}, remove() {},
    },
    addEventListener(evt, fn) { listeners[evt] = listeners[evt] || []; listeners[evt].push(fn); },
    appendChild(child) { el.children.push(child); return child; },
    remove() {},
    querySelectorAll() { return []; },
    scrollHeight: 0,
    scrollTop: 0,
    focus() {}, select() {},
  };
  return el;
}

const elementsById = {};
function getOrCreate(id) {
  if (!elementsById[id]) elementsById[id] = makeElement();
  return elementsById[id];
}

global.document = {
  getElementById: (id) => getOrCreate(id),
  createElement: () => makeElement(),
  querySelectorAll: () => [],
  execCommand: () => true,
  body: makeElement(),
};

global.navigator = { clipboard: null };
global.window = global;

module.exports = { elementsById, getOrCreate };
