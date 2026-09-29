globalThis.JinnCfg = globalThis.JinnCfg || {};

// 'auto' will try to detect the running framework automatically.
// You can also force it: 'qb', 'qbx', 'esx'
JinnCfg.Framework = 'auto';

// 'auto' will try to detect the running inventory automatically.
// You can also force it: 'ox_inventory', 'qb-inventory', 'ps-inventory',
// 'lj-inventory', 'qs-inventory', 'origen_inventory', 'codem-inventory'
JinnCfg.Inventory = 'auto';

// The two items this resource uses (unique names to avoid clashes).
// 'jinn_pad'  -> a blank, reusable pad used to write a fresh memo.
// 'jinn_memo' -> a written memo; opens the saved content when used.
JinnCfg.Items = {
    blank: 'jinn_pad',
    written: 'jinn_memo',
};

// Open a blank pad with a command.
// Set EnableCommand to false to turn the command off completely.
JinnCfg.EnableCommand = true;
JinnCfg.Command = 'notepad';

// When true, finishing a memo leaves a pickup-able memo on the floor at the
// player's position instead of (only) handing them a written memo item.
JinnCfg.LeaveOnFloor = false;

// How close (in meters) a player must stand to collect a dropped memo.
JinnCfg.CollectRange = 1.5;

// Discord webhook for activity logging (leave empty to disable).
JinnCfg.Webhook = '';

// Scene animation played while the pad is open.
JinnCfg.Scene = {
    dict: 'missheistdockssetup1clipboard@base',
    clip: 'base',
    padProp: 'prop_notepad_01',
    penProp: 'prop_pencil_01',
};

JinnCfg.Text = {
    memo_handed: 'Handed over a memo',
    memo_left: 'Left a memo on the floor',
    memo_collected: 'Picked the memo up',
    missing_pad: 'You are not carrying a pad',
    collect_hint: 'Press ~INPUT_PICKUP~ to collect the memo',
};
