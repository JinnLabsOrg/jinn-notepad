(function () {
    'use strict';

    const RES = (typeof GetParentResourceName === 'function')
        ? GetParentResourceName()
        : 'jinn-notepad';

    // ---- elements ------------------------------------------------------
    const wrap = document.getElementById('jinn-wrap');
    const stage = document.getElementById('jinn-stage');
    const page = document.getElementById('jinn-page');
    const edit = document.getElementById('jinn-edit');
    const canvas = document.getElementById('jinn-canvas');
    const ctx = canvas.getContext('2d');

    const signBtn = document.getElementById('jinn-sign');
    const signName = document.getElementById('jinn-sign-name');

    const emojiBtn = document.getElementById('jinn-emoji');
    const emojiPanel = document.getElementById('jinn-emoji-panel');

    const fontBtn = document.getElementById('jinn-font');
    const fontPanel = document.getElementById('jinn-font-panel');
    const fontList = document.getElementById('jinn-font-list');
    const sizeVal = document.getElementById('jinn-size-val');
    const sizeUp = document.getElementById('jinn-size-up');
    const sizeDn = document.getElementById('jinn-size-dn');
    const boldBtn = document.getElementById('jinn-bold');
    const italicBtn = document.getElementById('jinn-italic');

    const addBtn = document.getElementById('jinn-addpage');
    const delBtn = document.getElementById('jinn-delpage');
    const sideList = document.getElementById('jinn-side-list');

    const BRUSH_COLOR = '#161616';
    const BRUSH_WIDTH = 2.2;
    const CW = 460;
    const CH = 620;
    const MAX_PAGES = 20;
    const SIZE_MIN = 14;
    const SIZE_MAX = 40;
    const DEFAULT_SIZE = 19;
    canvas.width = CW;
    canvas.height = CH;

    const EMOJIS = ['😀','😁','😂','🤣','😊','😍','😎','😘','🤔','😴','😭','😡','👍','👎','👌','🙏','👏','💪','🔥','⭐','✅','❌','❤️','💔','💯','⚠️','❓','❗','💰','🚗','🔫','💊','🍺','🚬','📞','📌','✏️','📝','🎉','💀'];

    const FONTS = [
        { name: 'Handwriting', stack: "'Segoe Print','Bradley Hand','Comic Sans MS',cursive" },
        { name: 'Marker',      stack: "'Comic Sans MS','Chalkboard SE',cursive" },
        { name: 'Classic Serif', stack: "Georgia,'Times New Roman',serif" },
        { name: 'Clean Sans',  stack: "'Segoe UI',Arial,sans-serif" },
        { name: 'Typewriter',  stack: "Consolas,'Courier New',monospace" },
    ];

    const ALLOWED_TAGS = { B:1, I:1, U:1, BR:1, DIV:1, SPAN:1, FONT:1, P:1, EM:1, STRONG:1 };
    const ALLOWED_STYLE = ['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration'];

    // ---- state ---------------------------------------------------------
    // pages: [{ html: string, strokes: [{color,width,points:[{x,y}]}] }]
    let pages = [newPage()];
    let current = 0;
    let drawing = false;
    let locked = false;
    let signed = false;
    let signerName = '';

    function newPage() { return { html: '', strokes: [] }; }

    function clampSize(n) {
        n = parseInt(n, 10);
        if (isNaN(n)) return DEFAULT_SIZE;
        return Math.max(SIZE_MIN, Math.min(SIZE_MAX, n));
    }

    // ---- NUI bridge ----------------------------------------------------
    function post(name, data) {
        fetch(`https://${RES}/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(data || {}),
        }).catch(() => {});
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function sanitizeHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const out = document.createElement('div');
        (function clean(src, dst) {
            src.childNodes.forEach((node) => {
                if (node.nodeType === 3) {
                    dst.appendChild(document.createTextNode(node.nodeValue));
                    return;
                }
                if (node.nodeType !== 1) return;
                const tag = node.tagName;
                if (ALLOWED_TAGS[tag]) {
                    const el = document.createElement(tag);
                    ALLOWED_STYLE.forEach((p) => {
                        const v = node.style.getPropertyValue(p);
                        if (v) el.style.setProperty(p, v);
                    });
                    if (tag === 'FONT') {
                        const face = node.getAttribute('face');
                        if (face) el.style.fontFamily = face;
                    }
                    dst.appendChild(el);
                    clean(node, el);
                } else {
                    clean(node, dst);
                }
            });
        })(tmp, out);
        return out.innerHTML;
    }

    // ---- canvas --------------------------------------------------------
    function redraw() {
        ctx.clearRect(0, 0, CW, CH);
        for (const s of pages[current].strokes) {
            if (!s.points.length) continue;
            ctx.strokeStyle = s.color || BRUSH_COLOR;
            ctx.lineWidth = s.width || BRUSH_WIDTH;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
            if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1);
            ctx.stroke();
        }
    }

    function pointFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * CW,
            y: ((e.clientY - rect.top) / rect.height) * CH,
        };
    }

    let activeStroke = null;
    canvas.addEventListener('mousedown', (e) => {
        if (!drawing || locked) return;
        activeStroke = { color: BRUSH_COLOR, width: BRUSH_WIDTH, points: [pointFromEvent(e)] };
        pages[current].strokes.push(activeStroke);
        redraw();
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!drawing || !activeStroke || locked) return;
        activeStroke.points.push(pointFromEvent(e));
        redraw();
    });
    window.addEventListener('mouseup', () => { activeStroke = null; });

    // ---- page rendering ------------------------------------------------
    function loadPage(i) {
        edit.innerHTML = pages[i].html || '';
        redraw();
        updateEmpty();
        updateNav();
        updateSign();
    }

    function persist() {
        pages[current].html = edit.innerHTML;
    }

    function updateEmpty() {
        const stripped = edit.innerHTML.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').trim();
        const empty = stripped === '' && edit.textContent.trim() === '';
        edit.classList.toggle('is-empty', empty);
    }

    function updateNav() {
        sideList.innerHTML = '';
        for (let i = 0; i < pages.length; i++) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'jinn-pagechip' + (i === current ? ' active' : '');
            chip.textContent = String(i + 1);
            chip.title = `Page ${i + 1}`;
            chip.addEventListener('click', () => go(i));
            sideList.appendChild(chip);
        }
        delBtn.disabled = pages.length <= 1;
        addBtn.disabled = pages.length >= MAX_PAGES;
        const activeChip = sideList.children[current];
        if (activeChip) activeChip.scrollIntoView({ block: 'nearest' });
    }

    function updateSign() {
        const onLast = current === pages.length - 1;
        signBtn.style.display = onLast ? '' : 'none';
        signBtn.classList.toggle('signed', signed);
        signName.textContent = signed ? signerName : '';
    }

    // ---- editor input (native, no rebuild) -----------------------------
    edit.addEventListener('input', () => {
        if (locked) return;
        persist();
        updateEmpty();
    });

    edit.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (!locked) document.execCommand('insertText', false, '\u00a0\u00a0\u00a0\u00a0');
        }
    });

    // ---- selection formatting (applied to selection, no rebuild) -------
    function selectionInEditor() {
        const sel = window.getSelection();
        return sel && sel.rangeCount > 0 && edit.contains(sel.anchorNode);
    }

    function selectAllEditor() {
        const range = document.createRange();
        range.selectNodeContents(edit);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // Make sure something is selected before formatting. If the user has not
    // highlighted any text, format the whole page so the buttons "just work".
    function ensureSelection() {
        edit.focus();
        const sel = window.getSelection();
        const collapsed = !sel || sel.rangeCount === 0 || sel.isCollapsed || !edit.contains(sel.anchorNode);
        if (collapsed) selectAllEditor();
    }

    function afterFormat() {
        persist();
        updateEmpty();
        updateStyleState();
    }

    function exec(cmd, value) {
        ensureSelection();
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(cmd, false, value);
        afterFormat();
    }

    function currentSize() {
        const sel = window.getSelection();
        let node = sel && sel.anchorNode;
        if (node && node.nodeType === 3) node = node.parentElement;
        if (!node || !edit.contains(node)) return DEFAULT_SIZE;
        return parseInt(window.getComputedStyle(node).fontSize, 10) || DEFAULT_SIZE;
    }

    function applySize(px) {
        ensureSelection();
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('fontSize', false, '7');
        // convert the temporary "size 7" into a real px size on the selection
        edit.querySelectorAll('span[style*="font-size"]').forEach((s) => {
            if (s.style.fontSize === 'xx-large') s.style.fontSize = px + 'px';
        });
        edit.querySelectorAll('font[size="7"]').forEach((f) => {
            f.removeAttribute('size');
            f.style.fontSize = px + 'px';
        });
        afterFormat();
    }

    function normFamily(v) {
        return (v || '').replace(/["']/g, '').split(',')[0].trim().toLowerCase();
    }

    function updateStyleState() {
        if (!selectionInEditor()) return;
        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        sizeVal.textContent = String(currentSize());
        const fam = normFamily(document.queryCommandValue('fontName'));
        Array.from(fontList.children).forEach((b) => {
            b.classList.toggle('active', fam !== '' && normFamily(b.dataset.stack) === fam);
        });
    }

    document.addEventListener('selectionchange', () => {
        if (!locked && selectionInEditor()) updateStyleState();
    });

    boldBtn.addEventListener('click', () => exec('bold'));
    italicBtn.addEventListener('click', () => exec('italic'));
    sizeUp.addEventListener('click', () => applySize(clampSize(currentSize() + 1)));
    sizeDn.addEventListener('click', () => applySize(clampSize(currentSize() - 1)));

    function buildFonts() {
        fontList.innerHTML = '';
        for (const f of FONTS) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'jinn-font-opt';
            b.textContent = f.name;
            b.style.fontFamily = f.stack;
            b.dataset.stack = f.stack;
            b.addEventListener('click', () => exec('fontName', f.stack));
            fontList.appendChild(b);
        }
    }

    // ---- toolbar -------------------------------------------------------
    document.getElementById('jinn-trash').addEventListener('click', () => {
        if (locked) return;
        pages[current].html = '';
        pages[current].strokes = [];
        edit.innerHTML = '';
        updateEmpty();
        redraw();
        edit.focus();
    });

    document.getElementById('jinn-save').addEventListener('click', () => {
        if (locked) return;
        persist();
        post('jinnStore', {
            pages: pages.map((p) => ({
                html: sanitizeHtml(p.html),
                drawing: JSON.stringify({ strokes: p.strokes, width: CW, height: CH }),
            })),
            signed: signed,
        });
        closePad();
    });

    document.getElementById('jinn-pencil').addEventListener('click', (ev) => {
        if (locked) {
            locked = false;
            page.classList.remove('read-only');
            stage.classList.remove('read-only');
            edit.setAttribute('contenteditable', 'true');
            updateSign();
            return;
        }
        drawing = !drawing;
        page.classList.toggle('draw-mode', drawing);
        ev.currentTarget.classList.toggle('active', drawing);
        hidePanels();
    });

    emojiBtn.addEventListener('click', () => {
        if (locked) return;
        fontPanel.classList.add('hidden');
        emojiPanel.classList.toggle('hidden');
        refreshToggles();
    });

    fontBtn.addEventListener('click', () => {
        if (locked) return;
        emojiPanel.classList.add('hidden');
        fontPanel.classList.toggle('hidden');
        refreshToggles();
        if (!fontPanel.classList.contains('hidden')) updateStyleState();
    });

    document.getElementById('jinn-close').addEventListener('click', () => {
        post('jinnDismiss', {});
        closePad();
    });

    // ---- signature -----------------------------------------------------
    signBtn.addEventListener('click', () => {
        if (locked) return;
        signed = !signed;
        updateSign();
    });

    // ---- navigation ----------------------------------------------------
    function go(index) {
        persist();
        current = Math.max(0, Math.min(index, pages.length - 1));
        loadPage(current);
        if (!locked) edit.focus();
    }

    addBtn.addEventListener('click', () => {
        if (locked || pages.length >= MAX_PAGES) return;
        persist();
        pages.push(newPage());
        current = pages.length - 1;
        loadPage(current);
        edit.focus();
    });

    delBtn.addEventListener('click', () => {
        if (locked || pages.length <= 1) return;
        pages.splice(current, 1);
        if (current >= pages.length) current = pages.length - 1;
        loadPage(current);
        edit.focus();
    });

    // ---- emoji ---------------------------------------------------------
    function buildEmojis() {
        emojiPanel.innerHTML = '';
        for (const e of EMOJIS) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'jinn-emo';
            b.textContent = e;
            b.addEventListener('click', () => insertEmoji(e));
            emojiPanel.appendChild(b);
        }
    }

    function insertEmoji(str) {
        if (locked) return;
        edit.focus();
        document.execCommand('insertText', false, str);
        persist();
        updateEmpty();
    }

    // ---- click-away closes panels (does not touch the editor) ----------
    document.addEventListener('mousedown', (e) => {
        if (fontPanel.classList.contains('hidden') && emojiPanel.classList.contains('hidden')) return;
        const inFont = fontPanel.contains(e.target) || fontBtn.contains(e.target);
        const inEmoji = emojiPanel.contains(e.target) || emojiBtn.contains(e.target);
        if (!inFont) fontPanel.classList.add('hidden');
        if (!inEmoji) emojiPanel.classList.add('hidden');
        refreshToggles();
    });

    function hidePanels() {
        emojiPanel.classList.add('hidden');
        fontPanel.classList.add('hidden');
        refreshToggles();
    }

    function refreshToggles() {
        fontBtn.classList.toggle('active', !fontPanel.classList.contains('hidden'));
        emojiBtn.classList.toggle('active', !emojiPanel.classList.contains('hidden'));
    }

    // ---- esc -----------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !wrap.classList.contains('hidden')) {
            if (!fontPanel.classList.contains('hidden') || !emojiPanel.classList.contains('hidden')) {
                hidePanels();
                return;
            }
            post('jinnDismiss', {});
            closePad();
        }
    });

    // ---- open / close --------------------------------------------------
    function htmlFromText(text) {
        return escapeHtml(text || '').replace(/\n/g, '<br>');
    }

    function open(payload) {
        payload = payload || {};
        signerName = payload.signerName || '';
        signed = !!payload.signature;
        if (signed && !signerName) signerName = payload.signature;

        const src = Array.isArray(payload.pages) && payload.pages.length
            ? payload.pages
            : [{ html: payload.html || htmlFromText(payload.text), drawing: payload.drawing || '' }];

        pages = src.map((p) => ({
            html: sanitizeHtml(p.html !== undefined ? p.html : htmlFromText(p.text)),
            strokes: parseStrokes(p.drawing),
        }));
        if (!pages.length) pages = [newPage()];
        current = 0;

        drawing = false;
        page.classList.remove('draw-mode');
        document.getElementById('jinn-pencil').classList.remove('active');
        hidePanels();

        locked = payload.readOnly === true;
        page.classList.toggle('read-only', locked);
        stage.classList.toggle('read-only', locked);
        edit.setAttribute('contenteditable', locked ? 'false' : 'true');

        loadPage(0);

        wrap.classList.remove('hidden');
        if (!locked) edit.focus();
    }

    function parseStrokes(drawing) {
        if (!drawing) return [];
        try {
            const parsed = JSON.parse(drawing);
            const list = parsed.strokes || parsed.lines || [];
            const sx = parsed.width ? CW / parsed.width : 1;
            const sy = parsed.height ? CH / parsed.height : 1;
            return list.map((s) => ({
                color: s.color || s.brushColor || BRUSH_COLOR,
                width: s.width || s.brushRadius || BRUSH_WIDTH,
                points: (s.points || []).map((p) => ({ x: p.x * sx, y: p.y * sy })),
            }));
        } catch (err) {
            return [];
        }
    }

    function closePad() {
        wrap.classList.add('hidden');
        drawing = false;
        page.classList.remove('draw-mode');
        hidePanels();
    }

    // ---- messages ------------------------------------------------------
    window.addEventListener('message', (event) => {
        const data = event.data || {};
        if (data.action === 'open') open(data.payload);
        else if (data.action === 'close') closePad();
    });

    buildEmojis();
    buildFonts();

    // Keep the editor selection alive when clicking the toolbar / panels,
    // so font/size/bold apply to the highlighted text.
    [fontBtn, emojiBtn, fontPanel, emojiPanel].forEach((el) => {
        el.addEventListener('mousedown', (e) => e.preventDefault());
    });
})();
