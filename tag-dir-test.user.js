// ==UserScript==
// @name        TAG Dir Probe (temporary test)
// @namespace   rfs.tampermonkey.test
// @version     1.1
// @description TEMPORARY test: (1) GM_download `tag` creates Download/<tag>/ — VERIFIED OK; (2) blob <a download> with '/' in name — does X Browser mkdir? REMOVE AFTER VERIFICATION.
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

    try {
        if (typeof GM_info === 'object') {
            console.log('[tagprobe] handler=' + GM_info.scriptHandler + ' version=' + GM_info.version);
        }
    } catch (_) {}

    if (!/Android/i.test(navigator.userAgent)) {
        console.log('[tagprobe] not Android, skip');
        return;
    }

    // ---- Probe 1: GM_download tag (verified, keep once per session) ----
    if (typeof GM_download === 'function') {
        const KEY1 = 'ujs_tag_probe_v2';
        let fired = false;
        try { fired = !!sessionStorage.getItem(KEY1); } catch (_) {}
        if (!fired) {
            try { sessionStorage.setItem(KEY1, 'fired'); } catch (_) {}
            console.log('[tagprobe] firing GM_download url=http://127.0.0.1:8123/probe.bin tag=作者测试 ...');
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
        }
    }

    // ---- Probe 2: blob <a download> with '/' in name -> does X Browser mkdir? ----
    const KEY2 = 'ujs_blob_probe_v2';
    let bfired = false;
    try { bfired = !!sessionStorage.getItem(KEY2); } catch (_) {}
    if (bfired) {
        console.log('[blobprobe] already fired this session, skip');
    } else {
        try { sessionStorage.setItem(KEY2, 'fired'); } catch (_) {}
        console.log('[blobprobe] creating blob and clicking <a download="作者测试blob/作者测试blob文件.mp4"> ...');
        try {
            const blob = new Blob([new Uint8Array(256 * 1024)], { type: 'video/mp4' });
            const u = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = u;
            a.download = '作者测试blob/作者测试blob文件.mp4';
            a.style.display = 'none';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            console.log('[blobprobe] clicked');
            setTimeout(() => {
                try { document.body.removeChild(a); } catch (_) {}
                try { URL.revokeObjectURL(u); } catch (_) {}
            }, 60000);
        } catch (e) {
            console.warn('[blobprobe] threw', e);
        }
    }
})();
