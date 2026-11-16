// ==UserScript==
// @name         Veck.io Menu & ESP
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Menü und ESP für Veck.io auf veck.io und crazygames.com
// @author       Du
// @match        *://*.veck.io/*
// @match        *://*.crazygames.com/*
// @match        *://*.game-files.crazygames.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Verhindert, dass das Menü mehrfach erstellt wird, falls das Skript doppelt geladen wird
    if (document.getElementById('veck-menu')) return;

    // --- 1. UI MENÜ ERSTELLEN ---
    function createMenu() {
        const menu = document.createElement('div');
        menu.id = 'veck-menu';
        menu.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 220px;
            background: rgba(20, 20, 20, 0.9);
            border: 1px solid #00FF00;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 999999;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            user-select: none;
        `;

        const header = document.createElement('div');
        header.innerText = 'Veck.io Cheats';
        header.style.cssText = `
            background: #00FF00;
            color: black;
            padding: 8px;
            font-weight: bold;
            text-align: center;
            border-radius: 8px 8px 0 0;
            cursor: move;
        `;
        menu.appendChild(header);

        const content = document.createElement('div');
        content.style.padding = '10px';

        // ESP Toggle
        const espBtn = document.createElement('button');
        espBtn.innerText = 'ESP: AN';
        espBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            background: #00FF00;
            color: black;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        let espEnabled = true;
        espBtn.onclick = () => {
            espEnabled = !espEnabled;
            espBtn.innerText = `ESP: ${espEnabled ? 'AN' : 'AUS'}`;
            espBtn.style.background = espEnabled ? '#00FF00' : '#555';
            espBtn.style.color = espEnabled ? 'black' : 'white';
        };
        content.appendChild(espBtn);

        // Waffen Toggle (Platzhalter)
        const weaponBtn = document.createElement('button');
        weaponBtn.innerText = 'Waffen: AUS';
        weaponBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            background: #555;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        let weaponsEnabled = false;
        weaponBtn.onclick = () => {
            weaponsEnabled = !weaponsEnabled;
            weaponBtn.innerText = `Waffen: ${weaponsEnabled ? 'AN' : 'AUS'}`;
            weaponBtn.style.background = weaponsEnabled ? '#ff4444' : '#555';
        };
        content.appendChild(weaponBtn);

        menu.appendChild(content);
        document.body.appendChild(menu);

        // Drag & Drop Funktionalität
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - menu.getBoundingClientRect().left;
            offsetY = e.clientY - menu.getBoundingClientRect().top;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                menu.style.left = `${e.clientX - offsetX}px`;
                menu.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch-Support für Handys (damit du das Menü auch mit dem Finger verschieben kannst)
        header.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            offsetX = touch.clientX - menu.getBoundingClientRect().left;
            offsetY = touch.clientY - menu.getBoundingClientRect().top;
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                menu.style.left = `${touch.clientX - offsetX}px`;
                menu.style.top = `${touch.clientY - offsetY}px`;
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        return { getEspState: () => espEnabled, getWeaponState: () => weaponsEnabled };
    }

    // --- 2. WARTEN AUF UNITY & START ---
    function waitForGlobal(varName, interval = 50, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (window[varName] !== undefined) {
                    resolve(window[varName]);
                } else if (Date.now() - start > timeout) {
                    reject(new Error(varName + ' wurde nicht gefunden.'));
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    }

    (async () => {
        // Menü erstellen
        const ui = createMenu();
        console.log('[Veck] Menü erstellt. Warte auf Spiel...');

        try {
            await waitForGlobal('UnityWebModkit');
            console.log('[Veck] UnityWebModkit gefunden. Initialisiere...');

            const ctx = UnityWebModkit.Runtime.createPlugin({
                name: 'VeckESP',
                version: '1.6',
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

            // Overlay-Canvas für ESP
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

            // --- 3. ESP SCHLEIFE ---
            function espLoop() {
                drawCtx.clearRect(0, 0, canvas.width, canvas.height);

                if (ui.getEspState() && window.ctx) {
                    try {
                        const Camera = UnityWebModkit.Runtime.getType('UnityEngine.Camera');
                        const cam = Camera.main;
                        
                        if (cam) {
                            const GameObject = UnityWebModkit.Runtime.getType('UnityEngine.GameObject');
                            const Object = UnityWebModkit.Runtime.getType('UnityEngine.Object');
                            
                            const allObjects = Object.FindObjectsOfType(GameObject);
                            
                            for (let i = 0; i < allObjects.length; i++) {
                                const obj = allObjects[i];
                                if (obj && obj.name && obj.name.toLowerCase().includes('player')) {
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
                    } catch (e) { }
                }
                requestAnimationFrame(espLoop);
            }
            requestAnimationFrame(espLoop);
            console.log('[Veck] Erfolgreich gestartet!');

        } catch (err) {
            console.error('[Veck] Initialisierungs-Fehler:', err);
        }
    })();
})();