function jinnOpenPad(data, force) {
    if (JinnState.open && !force) return;
    data = data || {};

    JinnState.open = true;
    JinnState.activeSlot = (data.slot !== undefined) ? data.slot : null;

    SetNuiFocus(true, true);
    SendNUIMessage({
        action: 'open',
        payload: {
            pages: Array.isArray(data.pages) ? data.pages : null,
            text: data.text || '',
            drawing: data.drawing || '',
            signature: data.signature || '',
            signerName: jinnSignerName(),
            font: data.font || null,
            readOnly: data.readOnly === true,
        },
    });

    jinnPlayScene();
}

function jinnClosePad() {
    if (!JinnState.open) return;
    JinnState.open = false;
    JinnState.activeSlot = null;
    SetNuiFocus(false, false);
    SendNUIMessage({ action: 'close' });
}


RegisterNuiCallback('jinnDismiss', (_data, cb) => {
    jinnClosePad();
    cb('ok');
});

RegisterNuiCallback('jinnStore', (data, cb) => {
    const slot = JinnState.activeSlot;
    emitNet('jinn-notepad:server:store', {
        slot: slot,
        pages: Array.isArray(data.pages) ? data.pages : [],
        signature: data.signed === true ? jinnSignerName() : '',
    });
    jinnClosePad();
    cb('ok');
});


onNet('jinn-notepad:client:show', (data, force) => {
    jinnOpenPad(data, force);
});


if (JinnCfg.EnableCommand && JinnCfg.Command) {
    RegisterCommand(JinnCfg.Command, () => {
        jinnOpenPad({ text: '', readOnly: false }, false);
    }, false);
}

on('onResourceStop', (res) => {
    if (res === GetCurrentResourceName() && JinnState.open) {
        jinnClosePad();
    }
});


exports('IsPadOpen', () => JinnState.open === true);

exports('ShowPad', (data, force) => {
    jinnOpenPad(data, force);
});

exports('HidePad', () => {
    jinnClosePad();
});


onNet('jinn-notepad:client:notify', (message) => {
    BeginTextCommandThefeedPost('STRING');
    AddTextComponentSubstringPlayerName(message);
    EndTextCommandThefeedPostTicker(false, true);
});
