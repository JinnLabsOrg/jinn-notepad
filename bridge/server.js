const JINN_BLANK = JinnCfg.Items.blank;     // 'jinn_pad'
const JINN_WRITTEN = JinnCfg.Items.written; // 'jinn_memo'

function jinnSafeMeta(meta) {
    return (meta && typeof meta === 'object') ? meta : {};
}

setTimeout(() => {
    const inv = JinnLink.Inventory;

    if (inv === 'ox_inventory') {
        exports('usePadItem', (event, item, inventory, slot) => {
            if (event !== 'usingItem') return;
            if (item.name !== JINN_BLANK && item.name !== JINN_WRITTEN) return;
            const slotData = exports.ox_inventory.GetSlot(inventory.id, slot);
            const meta = jinnSafeMeta(slotData && slotData.metadata);
            meta.slot = slot;
            meta.itemName = item.name;
            globalThis.jinnHandleUse(inventory.id, meta);
            return false;
        });

        globalThis.jinnGrantMemo = (source, data) => {
            exports.ox_inventory.AddItem(source, JINN_WRITTEN, 1, data);
        };
        globalThis.jinnHasBlank = (source) => {
            return exports.ox_inventory.GetItemCount(source, JINN_BLANK) > 0;
        };
        return;
    }

    if (inv === 'qb-inventory' || inv === 'ps-inventory' || inv === 'lj-inventory') {
        const QBCore = exports['qb-core'].GetCoreObject();
        const qbInv = exports[inv];

        const onUse = (source, item) => {
            const meta = jinnSafeMeta(item.info);
            meta.slot = item.slot;
            meta.itemName = item.name;
            globalThis.jinnHandleUse(source, meta);
        };

        QBCore.Functions.CreateUseableItem(JINN_BLANK, onUse);
        QBCore.Functions.CreateUseableItem(JINN_WRITTEN, onUse);

        globalThis.jinnGrantMemo = (source, data) => {
            qbInv.AddItem(source, JINN_WRITTEN, 1, false, data);
        };
        globalThis.jinnHasBlank = (source) => {
            const player = QBCore.Functions.GetPlayer(source);
            if (!player) return false;
            const has = player.Functions.GetItemByName(JINN_BLANK);
            return has !== null && has !== undefined;
        };
        return;
    }

    if (inv === 'qs-inventory') {
        const qs = exports['qs-inventory'];

        const onUse = (source, item) => {
            const meta = jinnSafeMeta(item.info || item.metadata);
            meta.slot = item.slot;
            meta.itemName = item.name;
            globalThis.jinnHandleUse(source, meta);
        };

        qs.CreateUseableItem(JINN_BLANK, onUse);
        qs.CreateUseableItem(JINN_WRITTEN, onUse);

        globalThis.jinnGrantMemo = (source, data) => {
            qs.AddItem(source, JINN_WRITTEN, 1, false, data);
        };
        globalThis.jinnHasBlank = (source) => {
            return qs.GetItemTotalAmount(source, JINN_BLANK) > 0;
        };
        return;
    }

    if (inv === 'origen_inventory') {
        const origen = exports.origen_inventory;
        const QBCore = exports['qb-core'] ? exports['qb-core'].GetCoreObject() : null;

        const onUse = (source, item) => {
            const meta = jinnSafeMeta(item.info || item.metadata);
            meta.slot = item.slot;
            meta.itemName = item.name;
            globalThis.jinnHandleUse(source, meta);
        };

        if (QBCore) {
            QBCore.Functions.CreateUseableItem(JINN_BLANK, onUse);
            QBCore.Functions.CreateUseableItem(JINN_WRITTEN, onUse);
        }
        globalThis.jinnGrantMemo = (source, data) => {
            origen.addItem(source, JINN_WRITTEN, 1, data);
        };
        globalThis.jinnHasBlank = (source) => {
            return origen.getItemCount(source, JINN_BLANK) > 0;
        };
        return;
    }

    if (inv === 'codem-inventory') {
        const codem = exports['codem-inventory'];
        const QBCore = exports['qb-core'] ? exports['qb-core'].GetCoreObject() : null;

        const onUse = (source, item) => {
            const meta = jinnSafeMeta(item.info || item.metadata);
            meta.slot = item.slot;
            meta.itemName = item.name;
            globalThis.jinnHandleUse(source, meta);
        };

        if (QBCore) {
            QBCore.Functions.CreateUseableItem(JINN_BLANK, onUse);
            QBCore.Functions.CreateUseableItem(JINN_WRITTEN, onUse);
        }
        globalThis.jinnGrantMemo = (source, data) => {
            codem.AddItem(source, JINN_WRITTEN, 1, false, data);
        };
        globalThis.jinnHasBlank = (source) => true;
        return;
    }

    console.log('^1[jinn-notepad]^7 Inventory not supported. Add a handler in bridge/server.js for: ' + inv);
}, 1500);
