globalThis.JinnLink = globalThis.JinnLink || {};

function jinnResourceLive(resource) {
    const state = GetResourceState(resource);
    return state === 'started' || state === 'starting';
}

const JINN_FRAMEWORKS = [
    { tag: 'qbx', resource: 'qbx_core' },
    { tag: 'qb', resource: 'qb-core' },
    { tag: 'esx', resource: 'es_extended' },
];

const JINN_INVENTORIES = [
    { tag: 'ox_inventory', resource: 'ox_inventory' },
    { tag: 'origen_inventory', resource: 'origen_inventory' },
    { tag: 'codem-inventory', resource: 'codem-inventory' },
    { tag: 'qs-inventory', resource: 'qs-inventory' },
    { tag: 'ps-inventory', resource: 'ps-inventory' },
    { tag: 'lj-inventory', resource: 'lj-inventory' },
    { tag: 'qb-inventory', resource: 'qb-inventory' },
];

function jinnPick(list, chosen) {
    if (chosen && chosen !== 'auto') {
        return chosen;
    }
    for (const entry of list) {
        if (jinnResourceLive(entry.resource)) {
            return entry.tag;
        }
    }
    return null;
}

JinnLink.Framework = jinnPick(JINN_FRAMEWORKS, JinnCfg.Framework);
JinnLink.Inventory = jinnPick(JINN_INVENTORIES, JinnCfg.Inventory);

setTimeout(() => {
    if (!JinnLink.Framework) {
        console.log('^1[jinn-notepad]^7 No supported framework detected. Set JinnCfg.Framework manually.');
    } else {
        console.log(`^2[jinn-notepad]^7 Framework: ^5${JinnLink.Framework}^7`);
    }
    if (!JinnLink.Inventory) {
        console.log('^1[jinn-notepad]^7 No supported inventory detected. Set JinnCfg.Inventory manually.');
    } else {
        console.log(`^2[jinn-notepad]^7 Inventory: ^5${JinnLink.Inventory}^7`);
    }
}, 1000);
