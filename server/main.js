

const jinnFloor = {};
let jinnFloorSeq = 0;

const JINN_MAX_PAGES = 20;

function jinnSanitizePages(pages) {
    if (!Array.isArray(pages)) return [];
    return pages.slice(0, JINN_MAX_PAGES).map((p) => ({
        html: String((p && p.html) || '').slice(0, 30000),
        drawing: String((p && p.drawing) || '').slice(0, 200000),
    }));
}

// Keep only the expected font fields and clamp the size.
function jinnSanitizeFont(font) {
    if (!font || typeof font !== 'object') return null;
    let size = parseInt(font.size, 10);
    if (isNaN(size)) size = 19;
    size = Math.max(14, Math.min(30, size));
    return {
        family: String(font.family || '').slice(0, 120),
        size: size,
        bold: font.bold === true,
        italic: font.italic === true,
    };
}

globalThis.jinnHandleUse = (source, meta) => {
    meta = meta || {};
    const isWritten = meta.itemName === JinnCfg.Items.written;

    emitNet('jinn-notepad:client:show', source, {
        slot: meta.slot,
        pages: Array.isArray(meta.pages) ? meta.pages : null,
        text: meta.text || '',
        drawing: meta.drawing || '',
        signature: meta.signature || '',
        font: (meta.font && typeof meta.font === 'object') ? meta.font : null,
        readOnly: isWritten,
    }, false);
};

function jinnNotify(source, message) {
    emitNet('jinn-notepad:client:notify', source, message);
}

function jinnLog(source, action, payload) {
    if (!JinnCfg.Webhook || JinnCfg.Webhook === '') return;
    const title = `[${source}] ${GetPlayerName(source)} - ${action}`;
    const body = JSON.stringify({
        username: 'Jinn Notepad',
        embeds: [{
            title: title,
            color: 3066993,
            description: '```' + JSON.stringify(payload).slice(0, 1500) + '```',
            footer: { text: new Date().toUTCString() },
        }],
    });
    PerformHttpRequest(JinnCfg.Webhook, () => {}, 'POST', body, {
        'Content-Type': 'application/json',
    });
}

onNet('jinn-notepad:server:store', (data) => {
    const source = globalThis.source;
    if (!data || typeof data !== 'object') return;

    const memo = {
        pages: jinnSanitizePages(data.pages),
        signature: String(data.signature || '').slice(0, 64),
        font: jinnSanitizeFont(data.font),
    };
    if (!memo.pages.length) memo.pages = [{ html: '', drawing: '' }];

    if (JinnCfg.LeaveOnFloor) {
        const ped = GetPlayerPed(source);
        const raw = GetEntityCoords(ped);
        const pos = Array.isArray(raw)
            ? { x: raw[0], y: raw[1], z: raw[2] }
            : { x: raw.x, y: raw.y, z: raw.z };
        const id = ++jinnFloorSeq;
        jinnFloor[id] = Object.assign({}, memo, { coords: pos });
        emitNet('jinn-notepad:floor:add', -1, id, jinnFloor[id]);
        jinnNotify(source, JinnCfg.Text.memo_left);
        jinnLog(source, 'left memo', { pages: memo.pages.length, signature: memo.signature });
        return;
    }

    if (typeof globalThis.jinnGrantMemo === 'function') {
        globalThis.jinnGrantMemo(source, memo);
        jinnNotify(source, JinnCfg.Text.memo_handed);
        jinnLog(source, 'wrote memo', { pages: memo.pages.length, signature: memo.signature });
    } else {
        console.log('^1[jinn-notepad]^7 No inventory handler ready to hand out the memo.');
    }
});

onNet('jinn-notepad:floor:collect', (id) => {
    const source = globalThis.source;
    const memo = jinnFloor[id];
    if (!memo) return;
    delete jinnFloor[id];
    emitNet('jinn-notepad:floor:remove', -1, id);

    if (typeof globalThis.jinnGrantMemo === 'function') {
        globalThis.jinnGrantMemo(source, {
            pages: memo.pages,
            signature: memo.signature,
            font: memo.font,
        });
    }
    jinnNotify(source, JinnCfg.Text.memo_collected);
    jinnLog(source, 'collected memo', { signature: memo.signature });
});

onNet('jinn-notepad:floor:sync', () => {
    const source = globalThis.source;
    for (const id of Object.keys(jinnFloor)) {
        emitNet('jinn-notepad:floor:add', source, id, jinnFloor[id]);
    }
});

exports('OpenPadFor', (source, data, force) => {
    emitNet('jinn-notepad:client:show', source, data || {}, force === true);
});
