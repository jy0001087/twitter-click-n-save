// ==UserScript==
// @name        TAG Dir Probe (temporary test)
// @namespace   rfs.tampermonkey.test
// @version     1.0
// @description TEMPORARY test: does X Browser (XMonkey) GM_download `tag` create Download/<tag>/ subfolder? REMOVE AFTER VERIFICATION.
// @match       https://twitter.com/*
// @match       https://x.com/*
// @license     GPL-3.0
// @grant       GM_download
// @run-at      document-idle
// @updateURL   https://raw.githubusercontent.com/jy0001087/twitter-click-n-save/main/tag-dir-test.user.js
// @downloadURL https://raw.githubusercontent.com/jy0001087/twitter-click-n-save/main/tag-dir-test.user.js
// ==/UserScript==

(function () {
    'use strict';

    // One-shot per browser session (restart X Browser to re-fire).
    const KEY = 'ujs_tag_probe_v2';

    try {
        if (typeof GM_info === 'object') {
            console.log('[tagprobe] handler=' + GM_info.scriptHandler + ' version=' + GM_info.version);
        }
    } catch (_) {}

    if (!/Android/i.test(navigator.userAgent)) {
        console.log('[tagprobe] not Android, skip');
        return;
    }
    if (typeof GM_download !== 'function') {
        console.warn('[tagprobe] GM_download unavailable');
        return;
    }

    let fired = false;
    try { fired = !!sessionStorage.getItem(KEY); } catch (_) {}
    if (fired) { console.log('[tagprobe] already fired this session, skip'); return; }
    try { sessionStorage.setItem(KEY, 'fired'); } catch (_) {}

    console.log('[tagprobe] firing GM_download url=http://127.0.0.1:8123/probe.bin tag=作者测试 name=tagprobe.bin ...');
    try {
        const r = GM_download({
            url: 'http://127.0.0.1:8123/probe.bin',
            name: 'tagprobe.bin',
            tag: '作者测试',
            saveAs: false,
            timeout: 5000,
            onload() { console.log('[tagprobe] onload fired'); },
            onerror(e) { console.warn('[tagprobe] onerror fired', e); }
        });
        console.log('[tagprobe] GM_download returned', r);
    } catch (e) {
        console.warn('[tagprobe] GM_download threw', e);
    }
})();
