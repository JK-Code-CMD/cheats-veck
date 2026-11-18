// ==UserScript==
// @name         Subway Surfers Debugger
// @namespace    http://tampermonkey.net/
// @version      1.2
// @match        https://*.poki.com/*
// @match        https://*.crazygames.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Verhindern, dass der Button doppelt erstellt wird
    if (document.getElementById('ss-hack-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ss-hack-btn';
    btn.innerHTML = '🔍 Speicher anzeigen';
    btn.style.position = 'fixed';
    btn.style.bottom = '80px';
    btn.style.left = '20px';
    btn.style.zIndex = '999999';
    btn.style.padding = '12px 18px';
    btn.style.background = '#ffcc00';
    btn.style.color = '#000';
    btn.style.border = 'none';
    btn.style.borderRadius = '12px';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '14px';
    btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';

    btn.onclick = function() {
        let keysFound = [];
        for (let i = 0; i < localStorage.length; i++) {
            keysFound.push(localStorage.key(i));
        }
        
        if (keysFound.length > 0) {
            alert('Gefundene Keys:\n' + keysFound.join('\n'));
        } else {
            alert('Der localStorage ist komplett leer auf dieser Domain!');
        }
    };

    document.body.appendChild(btn);
})();
