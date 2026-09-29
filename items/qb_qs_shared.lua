-- For qb-inventory / ps-inventory / lj-inventory:
--   paste into qb-core/shared/items.lua

jinn_pad = {
    name = 'jinn_pad',
    label = 'Notepad',
    weight = 100,
    type = 'item',
    image = 'jinn_pad.png',
    unique = true,
    useable = true,
    shouldClose = true,
    combinable = nil,
    description = 'A blank pad. Use it to jot down a memo.'
},
jinn_memo = {
    name = 'jinn_memo',
    label = 'Memo',
    weight = 10,
    type = 'item',
    image = 'jinn_memo.png',
    unique = true,
    useable = true,
    shouldClose = true,
    combinable = nil,
    description = 'A written memo.'
},

----------------------------------------------------------------------
-- For qs-inventory: paste into qs-inventory/shared/items.lua
----------------------------------------------------------------------

['jinn_pad'] = {
    ['name'] = 'jinn_pad',
    ['label'] = 'Notepad',
    ['weight'] = 100,
    ['type'] = 'item',
    ['image'] = 'jinn_pad.png',
    ['unique'] = true,
    ['useable'] = true,
    ['shouldClose'] = true,
    ['combinable'] = nil,
    ['description'] = 'A blank pad. Use it to jot down a memo.'
},
['jinn_memo'] = {
    ['name'] = 'jinn_memo',
    ['label'] = 'Memo',
    ['weight'] = 10,
    ['type'] = 'item',
    ['image'] = 'jinn_memo.png',
    ['unique'] = true,
    ['useable'] = true,
    ['shouldClose'] = true,
    ['combinable'] = nil,
    ['description'] = 'A written memo.'
},
