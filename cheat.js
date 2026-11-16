// ==UserScript==
// @name         Veck.io Menu & ESP (Context Fix)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Menü, ESP & On-Screen Debug für Veck.io (Mobile Context Fix)
// @author       Du
// @match        *://*.veck.io/*
// @match        *://*.crazygames.com/*
// @match        *://*.game-files.crazygames.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Verhindert mehrfache Menüs im iFrame
    if (window.veckMenuInitialized) return;
    window.veckMenuInitialized = true;

    let espEnabled = true;
    let playerTransforms = [];
    let lastScanTime = 0;
    let modkitCtx = null;

    // --- 1. UI MENÜ MIT DEBUG-BOX ---
    function createMenu() {
        const menu = document.createElement('div');
        menu.id = 'veck-menu';
        menu.style.cssText = `
            position: fixed; top: 20px; left: 20px; width: 250px;
            background: rgba(20, 20, 20, 0.95); border: 1px solid #00FF00;
            border-radius: 8px; color: white; font-family: Arial, sans-serif;
            z-index: 2147483647; box-shadow: 0 4px 10px rgba(0,0,0,0.5); user-select: none;
        `;

        const header = document.createElement('div');
        header.innerText = 'Veck.io Cheats (v2.0)';
        header.style.cssText = `background: #00FF00; color: black; padding: 8px; font-weight: bold; text-align: center; border-radius: 8px 8px 0 0; cursor: move;`;
        menu.appendChild(header);

        const content = document.createElement('div');
        content.style.padding = '10px';

        const espBtn = document.createElement('button');
        espBtn.innerText = 'ESP: AN';
        espBtn.style.cssText = `width: 100%; padding: 8px; margin-bottom: 8px; background: #00FF00; color: black; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;`;
        espBtn.onclick = () => {
            espEnabled = !espEnabled;
            espBtn.innerText = `ESP: ${espEnabled ? 'AN' : 'AUS'}`;
            espBtn.style.background = espEnabled ? '#00FF00' : '#555';
            espBtn.style.color = espEnabled ? 'black' : 'white';
        };
        content.appendChild(espBtn);

        const debugBox = document.createElement('div');
        debugBox.id = 'veck-debug-box';
        debugBox.style.cssText = `background: #000; color: #00FF00; padding: 5px; font-size: 11px; max-height: 120px; overflow-y: auto; border-radius: 4px; font-family: monospace;`;
        debugBox.innerText = 'Warte auf Modkit (beide Fenster)...';
        content.appendChild(debugBox);

        menu.appendChild(content);
        document.body.appendChild(menu);

        // Touch & Maus Drag
        let isDragging = false, offsetX, offsetY;
        const startDrag = (clientX, clientY) => { isDragging = true; offsetX = clientX - menu.getBoundingClientRect().left; offsetY = clientY - menu.getBoundingClientRect().top; };
        const doDrag = (clientX, clientY) => { if (isDragging) { menu.style.left = `${clientX - offsetX}px`; menu.style.top = `${clientY - offsetY}px`; } };
        header.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
        document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', () => isDragging = false);
        header.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY));
        document.addEventListener('touchmove', (e) => { if (isDragging) { doDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
        document.addEventListener('touchend', () => isDragging = false);

        return { getEspState: () => espEnabled, debugBox: debugBox };
    }

    function logToScreen(msg) {
        const box = document.getElementById('veck-debug-box');
        if (box) box.innerText = msg;
        console.log(msg);
    }

    // --- 2. WARTEN AUF UNITY (Prüft beide Fenster) ---
    function waitForGlobalInAnyWindow(varName, interval = 100, timeout = 20000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                // Prüfe aktuelles Fenster
                if (window[varName] !== undefined) return resolve(window[varName]);
                // Prüfe Parent-Fenster (wichtig für iFrames)
                try {
                    if (window.parent && window.parent[varName] !== undefined) {
                        return resolve(window.parent[varName]);
                    }
                } catch (e) { /* Cross-Origin Fehler ignorieren */ }

                if (Date.now() - start > timeout) reject(new Error(varName + ' nicht gefunden.'));
                else setTimeout(check, interval);
            };
            check();
        });
    }

    (async () => {
        const ui = createMenu();
        try {
            logToScreen('Suche Modkit in Fenster & Parent...');
            modkitCtx = await waitForGlobalInAnyWindow('UnityWebModkit');
            logToScreen('Modkit gefunden!\nErstelle Plugin...');

            // Plugin erstellen
            modkitCtx.Runtime.createPlugin({
                name: 'VeckESP', version: '2.0',
                referencedAssemblies: [
                    'ACTk.Runtime.dll', 'GameAssembly.dll', 'System.Runtime.InteropServices.dll',
                    'mscorlib.dll', 'PhotonRealtime.dll', 'PhotonUnityNetworking.dll',
                    'PhotonUnityNetworking.Utilities.dll', 'Assembly-CSharp.dll',
                    'UnityEngine.CoreModule.dll', 'UnityEngine.PhysicsModule.dll',
                    'StompyRobot.SRDebugger.dll', 'UnityEngine.IMGUIModule.dll',
                    'Photon3Unity3D.dll', 'Unity.TextMeshPro.dll', 'FishNet.Runtime.dll',
                    'UnityEngine.AnimationModule.dll'
                ]
            });
            window.ctx = modkitCtx;
            logToScreen('Plugin bereit!\nSuche Spieler...');

            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 99999;';
            document.body.appendChild(canvas);
            const drawCtx = canvas.getContext('2d');
            
            function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            // --- 3. SPIELER SUCHEN (Nutzt getPlayers API, falls vorhanden) ---
            function updatePlayerList() {
                const now = Date.now();
                if (now - lastScanTime < 1000) return; // Alle 1 Sekunde
                lastScanTime = now;

                try {
                    // METH-O-DE 1: Offizielle getPlayers API (falls vorhanden)
                    if (modkitCtx && typeof modkitCtx.getPlayers === 'function') {
                        const apiPlayers = modkitCtx.getPlayers();
                        if (apiPlayers && apiPlayers.length > 0) {
                            playerTransforms = apiPlayers.filter(p => p && !p.isLocalPlayer && !p.isDead);
                            logToScreen(`${playerTransforms.length} Spieler (API)`);
                            return;
                        }
                    }

                    // METH-O-DE 2: Fallback - Manuelles Scannen (wie zuvor)
                    const Object = modkitCtx.Runtime.getType('UnityEngine.Object');
                    const Transform = modkitCtx.Runtime.getType('UnityEngine.Transform');
                    const SkinnedMeshRenderer = modkitCtx.Runtime.getType('UnityEngine.SkinnedMeshRenderer');
                    const all = Object.FindObjectsOfType(Transform);
                    let found = [];

                    for (let i = 0; i < all.length; i++) {
                        const tr = all[i];
                        if (!tr || !tr.gameObject) continue;
                        const name = tr.gameObject.name.toLowerCase();
                        if (name.includes('camera') || name.includes('ui') || name.includes('canvas') || name.includes('local')) continue;
                        
                        let isChar = false;
                        try { if (tr.gameObject.GetComponent(SkinnedMeshRenderer) !== null) isChar = true; } catch(e) {}
                        if (name.includes('player') || name.includes('character') || name.includes('bot') || name.includes('enemy')) isChar = true;
                        
                        if (isChar) found.push(tr);
                    }
                    playerTransforms = found;
                    
                    if (playerTransforms.length > 0) logToScreen(`${playerTransforms.length} Spieler (Scan)`);
                    else logToScreen('Suche Spieler... (Keine)');

                } catch (e) {
                    logToScreen('Fehler:\n' + e.message);
                }
            }

            // --- 4. ZEICHNEN ---
            function drawLoop() {
                drawCtx.clearRect(0, 0, canvas.width, canvas.height);
                if (ui.getEspState()) {
                    updatePlayerList();

                    try {
                        const Camera = modkitCtx.Runtime.getType('UnityEngine.Camera');
                        const cam = Camera.main;
                        
                        if (cam && playerTransforms.length > 0) {
                            for (let i = 0; i < playerTransforms.length; i++) {
                                const p = playerTransforms[i];
                                // Unterstützt sowohl Transform-Objekte als auch API-Player-Objekte
                                const tr = p.transform || p; 
                                if (!tr) continue;

                                const pos = p.position || (tr.position ? tr.position : null);
                                if (!pos) continue;

                                const screenPos = cam.WorldToScreenPoint(pos);
                                if (screenPos.z > 0) {
                                    const sx = screenPos.x;
                                    const sy = canvas.height - screenPos.y;
                                    drawCtx.strokeStyle = '#00FF00';
                                    drawCtx.lineWidth = 2;
                                    drawCtx.strokeRect(sx - 20, sy - 40, 40, 80);
                                    drawCtx.fillStyle = '#00FF00';
                                    drawCtx.font = '12px Arial';
                                    drawCtx.fillText(p.name || (tr.gameObject ? tr.gameObject.name : 'Player'), sx - 20, sy - 45);
                                }
                            }
                        }
                    } catch (e) { }
                }
                requestAnimationFrame(drawLoop);
            }
            requestAnimationFrame(drawLoop);

        } catch (err) {
            logToScreen('Init-Fehler: ' + err.message);
        }
    })();
})();
