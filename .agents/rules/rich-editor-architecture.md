# Rich Editor & Hybrid Block Parser Architectural Guidelines

## 1. Deterministic Block Key Identifiers
- NEVER assign random IDs (`Math.random()`, `Date.now()`, `uuid()`) inside serialization/deserialization loops (`parseTextToBlocks`).
- Always assign deterministic keys (e.g. `t-${lastPrecedingId}-${lineIdx}`) so React preserves component identity across typing and state updates.
- Failing to use stable keys will cause React to remount components on every input, destroying caret position and causing single-letter typing loss.

## 2. Document Parser Newline Preservation
- When splitting raw document text into blocks and text lines, DO NOT blindly execute `trim()` or `.endsWith('\n')`.
- A trailing `\n` at the end of a text section is a valid empty line created by the user pressing `Enter`.
- ONLY strip leading/trailing single newlines if they are direct delimiters adjacent to block directives (`:::subpage`, `:::attachment`, `:::code`, `:::mermaid`, `:::collection`).

## 3. Keyboard Navigation & Caret Focus Retention
- When handling `Enter`, `Tab`, or `Backspace` splits/merges:
  - Calculate target editor indices accurately.
  - Coordinate focus transitions using synchronous ref maps (`textareaRefs`, `cellInputRefs`).
  - Always invoke DOM focus inside `requestAnimationFrame` using `{ preventScroll: true }` to eliminate viewport jumping.
