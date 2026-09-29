-- Paste into ox_inventory/data/items.lua

['jinn_pad'] = {
    label = 'Notepad',
    weight = 100,
    stack = false,
    close = true,
    description = 'A blank pad. Use it to jot down a memo.',
    client = {
        image = 'jinn_pad.png',
    },
    server = {
        export = 'jinn-notepad.usePadItem',
    }
},

['jinn_memo'] = {
    label = 'Memo',
    weight = 10,
    stack = false,
    close = true,
    description = 'A written memo.',
    client = {
        image = 'jinn_memo.png',
    },
    server = {
        export = 'jinn-notepad.usePadItem',
    }
},
