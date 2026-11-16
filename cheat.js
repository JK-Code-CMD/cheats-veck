// ==UserScript==
// @name         Veck.io Menu & ESP (Mobile Fix)
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Menü, ESP & On-Screen Debug für Veck.io (Mobile)
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

    let espEnabled = true;
    let playerTransforms = []; // Hier speichern wir die gefundenen Spieler
    let lastScanTime = 0;

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
        header.innerText = 'Veck.io Cheats (Mobile)';
        header.style.cssText = `
            background: #00FF00; color: black; padding: 8px;
            font-weight: bold; text-align: center; border-radius: 8px 8px 0 0; cursor: move;
        `;
        menu.appendChild(header);

        const content = document.createElement('div');
        content.style.padding = '10px';

        // ESP Toggle Button
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

        // Debug Box (zeigt Text direkt im Menü an)
        const debugBox = document.createElement('div');
        debugBox.id = 'veck-debug-box';
        debugBox.style.cssText = `
            background: #000; color: #00FF00; padding: 5px; font-size: 11px;
            max-height: 100px; overflow-y: auto; border-radius: 4px; font-family: monospace;
        `;
        debugBox.innerText = 'Warte auf Spiel...';
        content.appendChild(debugBox);

        menu.appendChild(content);
        document.body.appendChild(menu);

        // Drag & Drop (Touch & Maus)
        let isDragging = false, offsetX, offsetY;
        const startDrag = (clientX, clientY) => {
            isDragging = true;
            offsetX = clientX - menu.getBoundingClientRect().left;
            offsetY = clientY - menu.getBoundingClientRect().top;
        };
        const doDrag = (clientX, clientY) => {
            if (isDragging) {
                menu.style.left = `${clientX - offsetX}px`;
                menu.style.top = `${clientY - offsetY}px`;
            }
        };

        header.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
        document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', () => isDragging = false);
        header.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY));
        document.addEventListener('touchmove', (e) => { if (isDragging) { doDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
        document.addEventListener('touchend', () => isDragging = false);

        return { getEspState: () => espEnabled, debugBox: debugBox };
    }

    // Funktion zum Schreiben in die Debug-Box im Menü
    function logToScreen(msg) {
        const box = document.getElementById('veck-debug-box');
        if (box) {
            box.innerText = msg;
        }
        console.log(msg);
    }

    // --- 2. WARTEN AUF UNITY & START ---
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
            logToScreen('Modkit gefunden. Lade Spiel...');
            
            const ctx = UnityWebModkit.Runtime.createPlugin({
                name: 'VeckESP', version: '1.9',
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
            
            function resizeCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            // --- 3. SPIELER SUCHEN (Alle 2 Sekunden) ---
            function scanForPlayers() {
                const now = Date.now();
                if (now - lastScanTime < 2000) return; // Nur alle 2 Sekunden scannen (Performance!)
                lastScanTime = now;

                try {
                    const Object = UnityWebModkit.Runtime.getType('UnityEngine.Object');
                    const Transform = UnityWebModkit.Runtime.getType('UnityEngine.Transform');
                    const SkinnedMeshRenderer = UnityWebModkit.Runtime.getType('UnityEngine.SkinnedMeshRenderer');

                    const allTransforms = Object.FindObjectsOfType(Transform);
                    let found = [];

                    for (let i = 0; i < allTransforms.length; i++) {
                        const tr = allTransforms[i];
                        if (!tr || !tr.gameObject) continue;
                        
                        const name = tr.gameObject.name.toLowerCase();
                        
                        // Filter: Ignoriere Kamera, UI, etc.
                        if (name.includes('camera') || name.includes('ui') || name.includes('canvas') || name.includes('local')) continue;

                        // Erkennung 1: Hat das Objekt einen 3D-Körper (SkinnedMeshRenderer)?
                        let isCharacter = false;
                        try {
                            const renderer = tr.gameObject.GetComponent(SkinnedMeshRenderer);
                            if (renderer !== null) isCharacter = true;
                        } catch(e) {}

                        // Erkennung 2: Name enthält typische Wörter
                        if (name.includes('player') || name.includes('character') || name.includes('bot') || name.includes('enemy')) {
                            isCharacter = true;
                        }

                        if (isCharacter) {
                            found.push(tr);
                        }
                    }

                    playerTransforms = found;
                    
                    if (playerTransforms.length > 0) {
                        logToScreen(`${playerTransforms.length} Spieler gefunden!\nLetzter: ${playerTransforms[playerTransforms.length-1].gameObject.name}`);
                    } else {
                        logToScreen('Suche Spieler... (Keine gefunden)');
                    }

                } catch (e) {
                    logToScreen('Fehler beim Scannen:\n' + e.message);
                }
            }

            // --- 4. ZEICHNEN (Jeden Frame) ---
            function drawLoop() {
                drawCtx.clearRect(0, 0, canvas.width, canvas.height);
                
                if (ui.getEspState() && window.ctx) {
                    scanForPlayers(); // Prüft selbst, ob es Zeit für einen neuen Scan ist

                    try {
                        const Camera = UnityWebModkit.Runtime.getType('UnityEngine.Camera');
                        const cam = Camera.main;
                        
                        if (cam && playerTransforms.length > 0) {
                            for (let i = 0; i < playerTransforms.length; i++) {
                                const tr = playerTransforms[i];
                                if (tr && tr.gameObject) {
                                    const screenPos = cam.WorldToScreenPoint(tr.position);
                                    
                                    if (screenPos.z > 0) {
                                        const sx = screenPos.x;
                                        const sy = canvas.height - screenPos.y;
                                        
                                        drawCtx.strokeStyle = '#00FF00';
                                        drawCtx.lineWidth = 2;
                                        drawCtx.strokeRect(sx - 20, sy - 40, 40, 80);
                                        
                                        drawCtx.fillStyle = '#00FF00';
                                        drawCtx.font = '12px Arial';
                                        drawCtx.fillText(tr.gameObject.name, sx - 20, sy - 45);
                                    }
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
