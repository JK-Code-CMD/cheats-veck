// ==UserScript==
// @name         Veck.io Menu & ESP (Debug)
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Menü, ESP & Debug für Veck.io
// @author       Du
// @match        *://*.veck.io/*
// @match        *://*.crazygames.com/*
// @match        *://*.game-files.crazygames.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (window.veckMenuInitialized) return;
    window.veckMenuInitialized = true;

    let debugMode = false;

    // --- 1. UI MENÜ ERSTELLEN ---
    function createMenu() {
        const menu = document.createElement('div');
        menu.id = 'veck-menu';
        menu.style.cssText = `
            position: fixed; top: 20px; left: 20px; width: 240px;
            background: rgba(20, 20, 20, 0.95); border: 1px solid #00FF00;
            border-radius: 8px; color: white; font-family: Arial, sans-serif;
            z-index: 2147483647; box-shadow: 0 4px 10px rgba(0,0,0,0.5); user-select: none;
        `;

        const header = document.createElement('div');
        header.innerText = 'Veck.io Cheats';
        header.style.cssText = `
            background: #00FF00; color: black; padding: 8px;
            font-weight: bold; text-align: center;
            border-radius: 8px 8px 0 0; cursor: move;
        `;
        menu.appendChild(header);

        const content = document.createElement('div');
        content.style.padding = '10px';

        // ESP Toggle
        const espBtn = document.createElement('button');
        espBtn.innerText = 'ESP: AN';
        espBtn.style.cssText = `
            width: 100%; padding: 8px; margin-bottom: 8px; background: #00FF00;
            color: black; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;
        `;
        let espEnabled = true;
        espBtn.onclick = () => {
            espEnabled = !espEnabled;
            espBtn.innerText = `ESP: ${espEnabled ? 'AN' : 'AUS'}`;
            espBtn.style.background = espEnabled ? '#00FF00' : '#555';
            espBtn.style.color = espEnabled ? 'black' : 'white';
        };
        content.appendChild(espBtn);

        // Debug Toggle
        const debugBtn = document.createElement('button');
        debugBtn.innerText = 'Debug: AUS (F3)';
        debugBtn.style.cssText = `
            width: 100%; padding: 8px; background: #555; color: white;
            border: none; border-radius: 4px; cursor: pointer; font-weight: bold;
        `;
        debugBtn.onclick = () => {
            debugMode = !debugMode;
            debugBtn.innerText = `Debug: ${debugMode ? 'AN' : 'AUS'}`;
            debugBtn.style.background = debugMode ? '#FFAA00' : '#555';
            if (debugMode) dumpObjectNames();
        };
        content.appendChild(debugBtn);

        menu.appendChild(content);
        document.body.appendChild(menu);

        // Drag & Drop
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', (e) => { isDragging = true; offsetX = e.clientX - menu.getBoundingClientRect().left; offsetY = e.clientY - menu.getBoundingClientRect().top; });
        document.addEventListener('mousemove', (e) => { if (isDragging) { menu.style.left = `${e.clientX - offsetX}px`; menu.style.top = `${e.clientY - offsetY}px`; } });
        document.addEventListener('mouseup', () => { isDragging = false; });

        return { getEspState: () => espEnabled };
    }

    // --- 2. DEBUG FUNKTION ---
    function dumpObjectNames() {
        if (!window.ctx) return console.log("[Debug] Plugin noch nicht bereit.");
        try {
            const Object = UnityWebModkit.Runtime.getType('UnityEngine.Object');
            const GameObject = UnityWebModkit.Runtime.getType('UnityEngine.GameObject');
            const all = Object.FindObjectsOfType(GameObject);
            console.log(`[Debug] ${all.length} GameObjects gefunden:`);
            all.forEach((obj, i) => { if (i < 100) console.log(`  - ${obj.name}`); });
            console.log("[Debug] (Nur die ersten 100 angezeigt)");
        } catch(e) { console.error("[Debug] Fehler:", e); }
    }

    // --- 3. WARTEN AUF UNITY & START ---
    function waitForGlobal(varName, interval = 50, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (window[varName] !== undefined) resolve(window[varName]);
                else if (Date.now() - start > timeout) reject(new Error(varName + ' nicht gefunden.'));
                else setTimeout(check, interval);
            };
            check();
        });
    }

    (async () => {
        const ui = createMenu();
        try {
            await waitForGlobal('UnityWebModkit');
            const ctx = UnityWebModkit.Runtime.createPlugin({
                name: 'VeckESP',
                version: '1.7',
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
            window.ctx = ctx;

            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 99999;';
            document.body.appendChild(canvas);
            const drawCtx = canvas.getContext('2d');
            window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;

            // --- 4. ESP SCHLEIFE (Verbessert) ---
            function espLoop() {
                drawCtx.clearRect(0, 0, canvas.width, canvas.height);
                if (ui.getEspState() && window.ctx) {
                    try {
                        const Camera = UnityWebModkit.Runtime.getType('UnityEngine.Camera');
                        const cam = Camera.main;
                        if (cam) {
                            const Object = UnityWebModkit.Runtime.getType('UnityEngine.Object');
                            const GameObject = UnityWebModkit.Runtime.getType('UnityEngine.GameObject');
                            const all = Object.FindObjectsOfType(GameObject);

                            // Liste möglicher Namen für Spieler-Objekte
                            const keywords = ['player', 'character', 'entity', 'bot', 'avatar', 'enemy', 'target'];

                            for (let i = 0; i < all.length; i++) {
                                const obj = all[i];
                                if (!obj || !obj.name) continue;
                                const lowerName = obj.name.toLowerCase();
                                
                                // Prüfen, ob der Name ein Keyword enthält (außer dem eigenen Spieler)
                                if (keywords.some(k => lowerName.includes(k)) && lowerName !== 'localplayer') {
                                    const transform = obj.transform;
                                    if (transform) {
                                        const screenPos = cam.WorldToScreenPoint(transform.position);
                                        if (screenPos.z > 0) {
                                            const sx = screenPos.x;
                                            const sy = canvas.height - screenPos.y;
                                            drawCtx.strokeStyle = '#00FF00';
                                            drawCtx.lineWidth = 2;
                                            drawCtx.strokeRect(sx - 20, sy - 40, 40, 80);
                                            drawCtx.fillStyle = '#00FF00';
                                            drawCtx.font = '12px Arial';
                                            drawCtx.fillText(obj.name, sx - 20, sy - 45);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) { /* Fehler ignorieren */ }
                }
                requestAnimationFrame(espLoop);
            }
            requestAnimationFrame(espLoop);

        } catch (err) {
            console.error('[Veck] Fehler:', err);
        }
    })();
})();
