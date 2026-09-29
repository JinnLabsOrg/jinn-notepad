# jinn-notepad

A framework & inventory agnostic notepad for FiveM, written fully in JavaScript with a vanilla HTML/CSS/JS UI. Players can type a memo, draw on a lined page, sign it, save it, edit it, or clear it. Saved memos become an inventory item (or, optionally, a note left on the floor for others to pick up).

- Frameworks: `qb`, `qbx`, `esx` (auto-detected)
- Inventories: `ox_inventory`, `qb-inventory`, `ps-inventory`, `lj-inventory`, `qs-inventory`, `origen_inventory`, `codem-inventory` (auto-detected, and extendable)
- UI: ruled paper, typed text, free-hand drawing, signature line, save / edit / clear / close

---

## Installation

1. Drop the `jinn-notepad` folder into your `resources` directory.
2. Add the two items to your inventory:
   - `ox_inventory` -> copy from `items/ox_inventory.lua` into `ox_inventory/data/items.lua`
   - `qb / ps / lj` -> copy the qb block from `items/qb_qs_shared.lua` into `qb-core/shared/items.lua`
   - `qs-inventory` -> copy the qs block from `items/qb_qs_shared.lua` into `qs-inventory/shared/items.lua`
3. Add item images named `jinn_pad.png` and `jinn_memo.png` to your inventory's images folder.
4. Add `ensure jinn-notepad` to your `server.cfg` (after your framework and inventory).
5. Restart the server. The console prints the detected framework and inventory on boot.

---

## Configuration (`config.js`)

All settings live on the global `JinnCfg` object.

| Key | Default | Description |
| --- | --- | --- |
| `JinnCfg.Framework` | `'auto'` | `'auto'`, `'qb'`, `'qbx'`, `'esx'` |
| `JinnCfg.Inventory` | `'auto'` | `'auto'` or a specific inventory name |
| `JinnCfg.Items.blank` | `'jinn_pad'` | Blank pad item used to write a new memo |
| `JinnCfg.Items.written` | `'jinn_memo'` | Written memo item that opens saved content |
| `JinnCfg.EnableCommand` | `true` | Turns the open command on/off |
| `JinnCfg.Command` | `'notepad'` | Command name to open a blank pad |
| `JinnCfg.LeaveOnFloor` | `false` | If `true`, saving drops a pickup-able note instead of giving an item |
| `JinnCfg.CollectRange` | `1.5` | Pickup distance (meters) for floor memos |
| `JinnCfg.Webhook` | `''` | Discord webhook for activity logging (empty = off) |
| `JinnCfg.Scene` | table | Writing animation dict/clip and props |
| `JinnCfg.Text` | table | Notification strings |

> Privacy note: enabling `JinnCfg.Webhook` posts memo text to Discord.

---

## Adding a custom inventory

1. Add a detection entry in `bridge/shared.js` -> `JINN_INVENTORIES`:
   ```js
   { tag: 'my-inventory', resource: 'my-inventory' },
   ```
2. Add a handler block in `bridge/server.js` that:
   - registers the usable items for `JINN_BLANK` and `JINN_WRITTEN`, calling `globalThis.jinnHandleUse(source, meta)`
   - defines `globalThis.jinnGrantMemo = (source, data) => { /* add jinn_memo with metadata */ }`

The `meta` object passed to `jinnHandleUse` should contain `{ slot, itemName, text, drawing, signature }` when available.

---

## Exports

### Client exports

#### `IsPadOpen()`
Returns `true` while the notepad UI is open.

```lua
-- Lua
if exports['jinn-notepad']:IsPadOpen() then
    print('pad is open')
end
```
```js
// JavaScript
if (exports['jinn-notepad'].IsPadOpen()) {
    console.log('pad is open');
}
```

#### `ShowPad(data, force)`
Opens the notepad on the local player.

| Field | Type | Description |
| --- | --- | --- |
| `data.pages` | array | Multi-page content: `[{ html, drawing }, ...]` (preferred) |
| `data.html` | string | Single-page rich HTML (used if `pages` is omitted) |
| `data.text` | string | Single-page plain text (legacy; converted to HTML) |
| `data.drawing` | string | Single-page drawing JSON (used if `pages` is omitted) |
| `data.signature` | string | Saved signer name; a non-empty value marks the memo as signed |
| `data.readOnly` | boolean | Opens in view mode (pencil unlocks editing) |
| `data.slot` | number | Inventory slot reference (optional) |
| `force` | boolean | Open even if a pad is already open |

```lua
-- Lua
exports['jinn-notepad']:ShowPad({
    pages = {
        { html = '<div>Page one of the report.</div>', drawing = '' },
        { html = '<div>Page two with more detail.</div>', drawing = '' }
    },
    signature = 'Officer R. Singh', -- already signed
    readOnly = true
}, true)
```
```js
// JavaScript
exports['jinn-notepad'].ShowPad({
    pages: [{ html: '<div>Page one of the report.</div>', drawing: '' }],
    signature: 'Officer R. Singh',
    readOnly: true
}, true);
```

#### `HidePad()`
Closes the notepad if it is open.

```lua
exports['jinn-notepad']:HidePad()
```

### Server export

#### `OpenPadFor(source, data, force)`
Pushes a notepad onto a specific player from the server. `data` and `force` match `ShowPad`.

```lua
-- Lua
exports['jinn-notepad']:OpenPadFor(src, {
    text = 'Server-pushed memo',
    signature = 'Dispatch'
}, true)
```
```js
// JavaScript
exports['jinn-notepad'].OpenPadFor(src, {
    text: 'Server-pushed memo',
    signature: 'Dispatch'
}, true);
```

---

## Net events

These are used internally but can be triggered if you know what you are doing.

| Event | Direction | Args | Purpose |
| --- | --- | --- | --- |
| `jinn-notepad:client:show` | server -> client | `(data, force)` | Open the pad on a client |
| `jinn-notepad:client:notify` | server -> client | `(message)` | Show a feed notification |
| `jinn-notepad:server:store` | client -> server | `({ slot, pages, signature })` | Save a written memo |
| `jinn-notepad:floor:add` | server -> client | `(id, data)` | Register a floor memo |
| `jinn-notepad:floor:remove` | server -> client | `(id)` | Remove a floor memo |
| `jinn-notepad:floor:collect` | client -> server | `(id)` | Collect a floor memo |
| `jinn-notepad:floor:sync` | client -> server | `()` | Request existing floor memos |

Example (server pushes a pad via event instead of export):
```lua
TriggerClientEvent('jinn-notepad:client:show', src, {
    text = 'Read this carefully.',
    signature = 'Admin',
    readOnly = true
}, true)
```

---

## Drawing JSON format

Each page stores its drawing as a JSON string:

```json
{
  "strokes": [
    {
      "color": "#161616",
      "width": 2.2,
      "points": [ { "x": 83.7, "y": 296.8 }, { "x": 85.2, "y": 295.2 } ]
    }
  ],
  "width": 460,
  "height": 620
}
```

Points are stored relative to a `width` x `height` canvas and are scaled automatically when the memo is reopened, so resolution changes do not distort the drawing.

A saved memo's metadata looks like:

```js
{
  pages: [
    { html: '<div>Page one <span style="font-weight:700">bold</span> text</div>', drawing: '{"strokes":[...],"width":460,"height":620}' },
    { html: '<div>Page two text</div>', drawing: '...' }
  ],
  signature: 'Officer R. Singh' // empty string when not signed
}
```

Page text is stored as rich HTML. It is sanitised on both save and load to a
small whitelist (`b, i, u, span, font, div, p, em, strong, br` and the
`font-family / font-size / font-weight / font-style / text-decoration` styles),
so stored content cannot inject scripts or markup when rendered for other
players.

---

## Pages, signature & emojis

- Pages: each page is a separate sheet. Use the left sidebar to switch pages, the `+` button to add a page, and `-` to delete the current one (up to 20). The page scrolls internally if you write past the bottom, and the ruled lines scroll with the text so it always stays aligned.
- Signature: the `SIGN HERE` button is opt-in. The signer's name only appears after it is clicked, and clicking again clears it. On a read-only/unsigned memo nothing is shown there.
- Emojis: the smiley toolbar button opens a picker that inserts an emoji at the cursor.
- Fonts & text: the pink `Aa` button opens a panel. Select some text first (double-click a word or drag to highlight), then pick a font, step the size up/down, or toggle bold/italic to format just that selection. Different parts of the same memo can use different fonts and sizes.
- Closing panels: clicking anywhere outside the font/emoji panel closes it (Esc also closes an open panel before closing the notepad).

---

## UI controls

| Button | Action |
| --- | --- |
| Trash | Clears the current page's text and drawing |
| Save (check) | Saves the whole memo and closes |
| Pencil | Toggles draw mode; first press also unlocks a read-only memo for editing |
| Aa | Pink button — opens the font panel; formatting applies to the selected text |
| Smiley | Opens the emoji picker (inserts at the cursor) |
| Close (X) | Closes without saving (also `ESC`) |
| Left sidebar | Themed mini page chips — click a page to jump to it; `+` / `-` add or delete pages |
| SIGN HERE | Signs the memo with your name (click again to clear) |
| Tab | Inserts an indent (does not move focus) |

---

## How it works

1. Using `jinn_pad` (or `/jinnpad`) opens a blank, editable pad.
2. The player types, optionally draws (pencil), then presses save.
3. The server stores the content as metadata on a `jinn_memo` item handed to the player — or, if `JinnCfg.LeaveOnFloor` is on, leaves a memo on the floor for anyone nearby to collect.
4. Using a `jinn_memo` reopens it in view mode; the pencil unlocks editing so it can be changed and re-saved.

---

## License

You are free to use and modify this resource for your server. This is an independent implementation; do not copy code from other notepad resources into it.
