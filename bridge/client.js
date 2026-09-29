globalThis.JinnState = globalThis.JinnState || { open: false };
globalThis.JinnFloorMemos = globalThis.JinnFloorMemos || {};

function jinnVec(c) {
    if (!c) return { x: 0, y: 0, z: 0 };
    if (Array.isArray(c)) return { x: c[0], y: c[1], z: c[2] };
    return { x: c.x, y: c.y, z: c.z };
}

let jinnCore = null;

setTimeout(() => {
    if (JinnLink.Framework === 'qb') {
        jinnCore = exports['qb-core'].GetCoreObject();
    } else if (JinnLink.Framework === 'esx') {
        jinnCore = exports['es_extended'].getSharedObject();
    }
}, 1200);

globalThis.jinnSignerName = function () {
    try {
        if (JinnLink.Framework === 'qbx') {
            const data = exports.qbx_core.GetPlayerData();
            if (data && data.charinfo) {
                return `${data.charinfo.firstname} ${data.charinfo.lastname}`;
            }
        } else if (JinnLink.Framework === 'qb' && jinnCore) {
            const data = jinnCore.Functions.GetPlayerData();
            if (data && data.charinfo) {
                return `${data.charinfo.firstname} ${data.charinfo.lastname}`;
            }
        } else if (JinnLink.Framework === 'esx' && jinnCore) {
            const data = jinnCore.GetPlayerData();
            if (data) {
                if (data.name) return data.name;
                if (data.firstName) return `${data.firstName} ${data.lastName}`;
            }
        }
    } catch (e) {
    }
    return 'Unknown';
};

let jinnSceneProps = { pad: 0, pen: 0 };

globalThis.jinnPlayScene = function () {
    const ped = PlayerPedId();
    const scene = JinnCfg.Scene;

    const boot = setInterval(() => {
        RequestAnimDict(scene.dict);
        if (HasAnimDictLoaded(scene.dict)) {
            clearInterval(boot);
            if (!JinnState.open) return;

            const pos = jinnVec(GetEntityCoords(ped, true));
            jinnSceneProps.pad = CreateObject(GetHashKey(scene.padProp), pos.x, pos.y, pos.z + 0.2, true, true, true);
            jinnSceneProps.pen = CreateObject(GetHashKey(scene.penProp), pos.x, pos.y, pos.z + 0.2, true, true, true);

            AttachEntityToEntity(jinnSceneProps.pad, ped, GetPedBoneIndex(ped, 18905),
                0.1, 0.02, 0.05, 10.0, 0.0, 0.0, true, true, false, true, 1, true);
            AttachEntityToEntity(jinnSceneProps.pen, ped, GetPedBoneIndex(ped, 58866),
                0.12, 0.0, 0.001, -150.0, 0.0, 0.0, true, true, false, true, 1, true);

            TaskPlayAnim(ped, scene.dict, scene.clip, 8.0, 1.0, -1, 49, 0, false, false, false);

            const keep = setInterval(() => {
                if (!JinnState.open) {
                    clearInterval(keep);
                    jinnStopScene(ped);
                    return;
                }
                if (!IsEntityPlayingAnim(ped, scene.dict, scene.clip, 3)) {
                    TaskPlayAnim(ped, scene.dict, scene.clip, 8.0, 1.0, -1, 49, 0, false, false, false);
                }
            }, 250);
        }
    }, 10);
};

function jinnStopScene(ped) {
    ClearPedSecondaryTask(ped);
    if (jinnSceneProps.pad) {
        DetachEntity(jinnSceneProps.pad, true, true);
        DeleteObject(jinnSceneProps.pad);
        jinnSceneProps.pad = 0;
    }
    if (jinnSceneProps.pen) {
        DetachEntity(jinnSceneProps.pen, true, true);
        DeleteObject(jinnSceneProps.pen);
        jinnSceneProps.pen = 0;
    }
}


function jinnDrawSpot(coords) {
    DrawMarker(27, coords.x, coords.y, coords.z - 0.98, 0, 0, 0, 0, 0, 0,
        0.5, 0.5, 0.5, 255, 255, 255, 155, false, false, 2, false, null, null, false);
}

function jinnShowHint() {
    AddTextEntry('jinnCollectHint', JinnCfg.Text.collect_hint);
    DisplayHelpTextThisFrame('jinnCollectHint', false);
}

onNet('jinn-notepad:floor:add', (id, data) => {
    JinnFloorMemos[id] = data;
});
onNet('jinn-notepad:floor:remove', (id) => {
    delete JinnFloorMemos[id];
});

setTick(() => {
    if (!JinnCfg.LeaveOnFloor) return;
    const ids = Object.keys(JinnFloorMemos);
    if (ids.length === 0) return;

    const ped = PlayerPedId();
    const pos = jinnVec(GetEntityCoords(ped, true));
    for (const id of ids) {
        const memo = JinnFloorMemos[id];
        if (!memo || !memo.coords) continue;
        const dx = memo.coords.x - pos.x;
        const dy = memo.coords.y - pos.y;
        const dz = memo.coords.z - pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 6) {
            jinnDrawSpot(memo.coords);
        }
        if (dist < JinnCfg.CollectRange) {
            jinnShowHint();
            if (IsControlJustPressed(0, 38)) {
                emitNet('jinn-notepad:floor:collect', id);
            }
        }
    }
});

on('onClientResourceStart', (res) => {
    if (res === GetCurrentResourceName() && JinnCfg.LeaveOnFloor) {
        setTimeout(() => emitNet('jinn-notepad:floor:sync'), 1500);
    }
});
