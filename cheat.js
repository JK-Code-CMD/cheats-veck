// ==UserScript==
// @name         Veck.io ESP (Others Method)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  ESP basierend auf der Methode funktionierender Skripte
// @author       Du
// @match        *://*.veck.io/*
// @match        *://*buildnow-gg.game-files.crazygames.com/unity/unity2020/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (window.veckMenuInitialized) return;
    window.veckMenuInitialized = true;

    let espEnabled = true;
    let playerList = [];

    // --- 1. MENÜ ---
    function createMenu() {
        const menu = document.createElement('div');
        menu.id = 'veck-menu';
        menu.style.cssText = `
            position: fixed; top: 20px; left: 20px; width: 260px;
            background: rgba(20, 20, 20, 0.95); border: 1px solid #00FF00;
            border-radius: 8px; color: white; font-family: Arial, sans-serif;
            z-index: 2147483647; box-shadow: 0 4px 10px rgba(0,0,0,0.5); user-select: none;
        `;

        const header = document.createElement('div');
        header.innerText = 'Veck.io ESP (v2.1)';
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
        debugBox.id = 'veck-debug';
        debugBox.style.cssText = `background: #000; color: #00FF00; padding: 5px; font-size: 11px; max-height: 100px; overflow-y: auto; border-radius: 4px; font-family: monospace;`;
        debugBox.innerText = 'Warte auf Unity...';
        content.appendChild(debugBox);

        menu.appendChild(content);
        document.body.appendChild(menu);

        // Drag & Drop
        let isDragging = false, offsetX, offsetY;
        const startDrag = (x, y) => { isDragging = true; offsetX = x - menu.getBoundingClientRect().left; offsetY = y - menu.getBoundingClientRect().top; };
        const doDrag = (x, y) => { if (isDragging) { menu.style.left = `${x - offsetX}px`; menu.style.top = `${y - offsetY}px`; } };
        header.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
        document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', () => isDragging = false);
        header.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY));
        document.addEventListener('touchmove', (e) => { if (isDragging) { doDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
        document.addEventListener('touchend', () => isDragging = false);

        return { getEspState: () => espEnabled, debugBox: debugBox };
    }

    function logToScreen(msg) {
        const box = document.getElementById('veck-debug');
        if (box) box.innerText = msg;
        console.log(msg);
    }

    // --- 2. WARTEN AUF UNITY ---
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

    // --- 3. HAUPTPROGRAMM ---
    (async () => {
        const ui = createMenu();
        try {
            logToScreen('Warte auf UnityWebModkit...');
            await waitForGlobal('UnityWebModkit');
            logToScreen('Modkit gefunden!\nErstelle Plugin...');

            const ctx = UnityWebModkit.Runtime.createPlugin({
                name: 'VeckESP', version: '2.1',
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
            logToScreen('Plugin bereit!');

            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 99999;';
            document.body.appendChild(canvas);
            const drawCtx = canvas.getContext('2d');
            const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
            window.addEventListener('resize', resize);
            resize();

            let lastUpdate = 0;

            function drawLoop() {
                drawCtx.clearRect(0, 0, canvas.width, canvas.height);
                if (!ui.getEspState()) { requestAnimationFrame(drawLoop); return; }

                const now = Date.now();
                if (now - lastUpdate > 100) {
                    lastUpdate = now;
                    try {
                        // Spieler über die offizielle API abrufen
                        playerList = (typeof UnityWebModkit.getPlayers === 'function') 
                            ? UnityWebModkit.getPlayers() 
                            : [];
                        
                        const validPlayers = playerList.filter(p => p && !p.isLocalPlayer && !p.isDead);
                        logToScreen(`${validPlayers.length} Spieler gefunden`);
                    } catch (e) {
                        logToScreen('Fehler: ' + e.message);
                    }
                }

                try {
                    const Camera = UnityWebModkit.Runtime.getType('UnityEngine.Camera');
                    const cam = Camera.main;
                    
                    if (cam && playerList.length > 0) {
                        for (const p of playerList) {
                            if (!p || p.isLocalPlayer || p.isDead) continue;
                            
                            const pos = p.position || p.screenPosition;
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
                                drawCtx.fillText(p.name || 'Player', sx - 20, sy - 45);
                            }
                        }
                    }
                } catch (e) { }
                requestAnimationFrame(drawLoop);
            }
            requestAnimationFrame(drawLoop);

        } catch (err) {
            logToScreen('Init-Fehler: ' + err.message);
        }
    })();
})();
