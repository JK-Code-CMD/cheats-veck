// ==UserScript==
// @name         Veck.io ESP
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  ESP für Veck.io mit Canvas-Overlay
// @author       Du
// @match        *://*.veck.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Warten auf die Unity WebGL Umgebung
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
        try {
            await waitForGlobal('UnityWebModkit');
            console.log('[ESP] UnityWebModkit gefunden. Initialisiere...');

            // 2. Plugin erstellen
            const ctx = UnityWebModkit.Runtime.createPlugin({
                name: 'VeckESP',
                version: '1.3',
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

            // 3. Overlay-Canvas für das Zeichnen erstellen
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none'; // Klicks durchlassen
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);
            const drawCtx = canvas.getContext('2d');

            function resizeCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            const esp = { enabled: true, players: [] };

            // 4. Die ESP-Schleife (Jeden Frame ausführen)
            function espLoop() {
                // Bildschirm leeren
                drawCtx.clearRect(0, 0, canvas.width, canvas.height);

                if (esp.enabled && window.ctx) {
                    try {
                        const Camera = UnityWebModkit.Runtime.getType('UnityEngine.Camera');
                        const cam = Camera.main;
                        
                        if (cam) {
                            // Beispiel: Hier holst du dir die echten Spieler aus dem Spiel
                            // esp.players = ... (muss noch an das Spiel angepasst werden)
                            
                            for (const player of esp.players) {
                                if (!player || !player.transform) continue;
                                
                                const screenPos = cam.WorldToScreenPoint(player.transform.position);
                                
                                if (screenPos.z > 0) {
                                    const sx = screenPos.x;
                                    const sy = canvas.height - screenPos.y; // Y invertieren

                                    // Zeichne ein grünes Kästchen
                                    drawCtx.strokeStyle = '#00FF00';
                                    drawCtx.lineWidth = 2;
                                    drawCtx.strokeRect(sx - 20, sy - 20, 40, 40);
                                    
                                    // Zeichne den Namen (optional)
                                    drawCtx.fillStyle = '#00FF00';
                                    drawCtx.font = '14px Arial';
                                    drawCtx.fillText('Spieler', sx - 20, sy - 25);
                                }
                            }
                        }
                    } catch (e) {
                        // Fehler nur ausgeben, wenn wirklich was kaputt ist, um die Konsole nicht zu spammen
                        if (!esp.hasErrored) {
                            console.error('[ESP] Fehler in der Schleife:', e);
                            esp.hasErrored = true;
                        }
                    }
                }
                requestAnimationFrame(espLoop);
            }

            // Start der Schleife
            requestAnimationFrame(espLoop);
            console.log('[ESP] Erfolgreich gestartet!');

        } catch (err) {
            console.error('[ESP] Initialisierungs-Fehler:', err);
        }
    })();
})();