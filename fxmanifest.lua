fx_version 'cerulean'
game 'gta5'

name 'jinn-notepad'
author 'jinn'
description 'A framework & inventory agnostic notepad with text, drawing and signature support (JS)'
version '1.0.0'

shared_scripts {
    'config.js',
    'bridge/shared.js'
}

client_scripts {
    'bridge/client.js',
    'client/main.js'
}

server_scripts {
    'bridge/server.js',
    'server/main.js'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js'
}
