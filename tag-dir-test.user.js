// ==UserScript==
// @name        TAG Dir Probe (temporary test)
// @namespace   rfs.tampermonkey.test
// @version     1.2
// @description TEMPORARY test: (1) GM_download tag — VERIFIED OK; (2) blob slash — not supported; (3) GM_download with real video URL from page + tag — does it save to Download/<tag>/?
// @match       https://twitter.com/*
// @match       https://x.com/*
// @license     GPL-3.0
// @grant       GM_download
// @grant       GM_xmlhttpRequest
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

    // ---- Probe 1: GM_download tag (per session) ----
    if (typeof GM_download === 'function') {
        (function probeTag() {
            const KEY = 'ujs_tag_probe_v2';
            let fired = false;
            try { fired = !!sessionStorage.getItem(KEY); } catch (_) {}
            if (fired) return;
            try { sessionStorage.setItem(KEY, 'fired'); } catch (_) {}
            console.log('[tagprobe] firing GM_download url=http://127.0.0.1:8123/probe.bin tag=作者测试 ...');
            try {
                GM_download({
                    url: 'http://127.0.0.1:8123/probe.bin',
                    name: 'tagprobe.bin',
                    tag: '作者测试',
                    saveAs: false,
                    timeout: 5000,
                    onload() { console.log('[tagprobe] onload fired'); },
                    onerror(e) { console.warn('[tagprobe] onerror fired', e); }
                });
            } catch (e) { console.warn('[tagprobe] threw', e); }
        })();
    }

    // ---- Probe 3: GM_download with the REAL video URL + tag ----
    // Tries to find the video URL from the page, then downloads with tag.
    // If the native downloader succeeds, the file lands in Download/真实视频测试/.
    (function probeRealVideoDownload() {
        const KEY = 'ujs_real_video_probe_v2';
        let fired = false;
        try { fired = !!sessionStorage.getItem(KEY); } catch (_) {}
        if (fired) { console.log('[realprobe] already fired, skip'); return; }
        try { sessionStorage.setItem(KEY, 'fired'); } catch (_) {}

        // Get tweet ID from URL
        const m = window.location.pathname.match(/\/status\/(\d+)/);
        if (!m) { console.log('[realprobe] not on tweet page, skip'); return; }
        const tweetId = m[1];

        // Call the Twitter API using the same guest auth token as the main script
        const GUEST_TOKEN = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
        const QUERY_ID = 'zAz9764BcLZOJ0JU2wrd1A';

        const variables = {
            tweetId: tweetId,
            withCommunity: false,
            includePromotedContent: false,
            withVoice: false
        };
        const features = {
            creator_subscriptions_tweet_preview_api_enabled: true,
            premium_content_api_read_enabled: false,
            communities_web_enable_tweet_community_results_fetch: true,
            c9s_tweet_anatomy_moderator_badge_enabled: true,
            responsive_web_grok_analyze_button_fetch_trends_enabled: false,
            responsive_web_grok_analyze_post_followups_enabled: false,
            responsive_web_jetfuel_frame: false,
            responsive_web_grok_share_attachment_enabled: true,
            articles_preview_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            view_counts_everywhere_api_enabled: true,
            longform_notetweets_consumption_enabled: true,
            responsive_web_twitter_article_tweet_consumption_enabled: true,
            tweet_awards_web_tipping_enabled: false,
            responsive_web_grok_show_grok_translated_post: false,
            responsive_web_grok_analysis_button_from_backend: false,
            creator_subscriptions_quote_tweet_preview_enabled: false,
            freedom_of_speech_not_reach_fetch_enabled: true,
            standardized_nudges_misinfo: true,
            tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
            longform_notetweets_rich_text_read_enabled: true,
            longform_notetweets_inline_media_enabled: true,
            profile_label_improvements_pcf_label_in_post_enabled: true,
            rweb_tipjar_consumption_enabled: true,
            verified_phone_label_enabled: false,
            responsive_web_grok_image_annotation_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            responsive_web_graphql_timeline_navigation_enabled: true,
            responsive_web_enhance_cards_enabled: false
        };
        const fieldToggles = {
            withArticleRichContentState: true,
            withArticlePlainText: false,
            withGrokAnalyze: false,
            withDisallowedReplyControls: false
        };

        const urlObj = new URL('https://x.com/i/api/graphql/' + QUERY_ID + '/TweetResultByRestId');
        urlObj.searchParams.set('variables', JSON.stringify(variables));
        urlObj.searchParams.set('features', JSON.stringify(features));
        urlObj.searchParams.set('fieldToggles', JSON.stringify(fieldToggles));
        const apiUrl = urlObj.toString();

        // Get CSRF token from cookies
        let csrfToken = '';
        try {
            const match = document.cookie.match(/\bct0=([^;]+)/);
            if (match) csrfToken = match[1];
        } catch (_) {}
        console.log('[realprobe] tweetId=' + tweetId + ' csrf=' + (csrfToken ? 'found' : 'missing'));

        // Use the page's fetch (which has cookies)
        fetch(apiUrl, {
            headers: {
                'authorization': GUEST_TOKEN,
                'x-csrf-token': csrfToken,
                'content-type': 'application/json',
                'x-twitter-auth-type': 'OAuth2Session',
                'x-twitter-active-user': 'yes'
            }
        }).then(r => {
            if (!r.ok) { console.warn('[realprobe] API returned ' + r.status); throw new Error('API ' + r.status); }
            console.log('[realprobe] API OK, parsing...');
            return r.json();
        }).then(json => {
            // Navigate the response to find the video URL
            try {
                const entries = json?.data?.tweetResult?.result?.legacy?.extended_entities?.media || [];
                for (const entry of entries) {
                    if (entry.type === 'video' || entry.type === 'animated_gif') {
                        const variants = entry.video_info?.variants || [];
                        // Find the best video URL (highest bitrate)
                        let best = null;
                        let bestBitrate = 0;
                        for (const v of variants) {
                            if (v.content_type === 'video/mp4' && v.bitrate > bestBitrate) {
                                best = v.url;
                                bestBitrate = v.bitrate;
                            }
                        }
                        if (best) {
                            console.log('[realprobe] found video URL:', best);
                            doDownload(best);
                            return;
                        }
                    }
                }
                // Try download_url from the API response format used by the main script
                const media = json?.data?.tweetResult?.result?.legacy?.extended_entities?.media;
                if (media && media.length > 0) {
                    console.log('[realprobe] media found, checking variants...');
                    console.log('[realprobe] media[0] keys:', Object.keys(media[0]));
                    if (media[0].video_info) {
                        console.log('[realprobe] video_info variants:', media[0].video_info.variants?.length);
                    }
                }
                console.warn('[realprobe] no video URL in response');
                console.log('[realprobe] response snippet:', JSON.stringify(json).slice(0, 500));
            } catch (e) {
                console.warn('[realprobe] parse error:', e.message);
            }
        }).catch(err => {
            console.warn('[realprobe] fetch error:', err.message);
        });

        function doDownload(url) {
            if (typeof GM_download !== 'function') return;
            console.log('[realprobe] firing GM_download tag=真实视频测试 name=真实视频探针.mp4 with headers Referer ...');
            try {
                const r = GM_download({
                    url: url,
                    name: '真实视频探针.mp4',
                    tag: '真实视频测试',
                    saveAs: false,
                    timeout: 120000,
                    headers: { Referer: location.origin + '/' },
                    onload() { console.log('[realprobe] onload fired'); },
                    onerror(e) { console.warn('[realprobe] onerror fired', e); }
                });
                console.log('[realprobe] GM_download returned', r);
            } catch (e) {
                console.warn('[realprobe] GM_download threw', e);
            }
        }
    })();

    // ---- Probe 2: blob <a download> with '/' (keep for reference) ----
    (function probeBlobSlash() {
        const KEY = 'ujs_blob_probe_v2';
        let fired = false;
        try { fired = !!sessionStorage.getItem(KEY); } catch (_) {}
        if (fired) return;
        try { sessionStorage.setItem(KEY, 'fired'); } catch (_) {}
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
        } catch (e) { console.warn('[blobprobe] threw', e); }
    })();
})();