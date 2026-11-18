// ==UserScript==
// @name         Subway Surfers Mobile Trainer
// @namespace    http://tampermonkey.net/
// @version      1.1
// @match        https://*.poki.com/*
// @match        https://*.crazygames.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Schwebenden Button für den Handy-Bildschirm erstellen
    const btn = document.createElement('button');
    btn.innerHTML = '🪙 Hack Versuchen';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
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
        try {
            console.log("--- Subway Surfers: localStorage Check ---");
            let modified = false;
            
            // Alle Einträge im LocalStorage durchgehen
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i);
                let val = localStorage.getItem(key);
                console.log(key, val);
                
                // Versuchen, JSON-gespeicherte Daten zu finden und anzupassen
                try {
                    let parsed = JSON.parse(val);
                    if (parsed && typeof parsed === 'object') {
                        let changed = false;
                        for (let prop in parsed) {
                            let pLower = prop.toLowerCase();
                            if (pLower.includes('coin') || pLower.includes('key') || pLower.includes('score') || pLower.includes('money')) {
                                parsed[prop] = 999999;
                                changed = true;
                                modified = true;
                                console.log(`Wert geändert für Property: ${prop}`);
                            }
                        }
                        if (changed) {
                            localStorage.setItem(key, JSON.stringify(parsed));
                        }
                    }
                } catch(e) {
                    // Kein JSON, normaler String
                }
            }

            if (modified) {
                alert('Erfolg! Werte im Speicher angepasst. Lade das Spiel neu.');
            } else {
                alert('Keine passenden Schlüssel gefunden. Das Spiel nutzt evtl. einen anderen Speicherpfad.');
            }
        } catch (err) {
            alert('Fehler beim Ausführen: ' + err.message);
        }
    };

    document.body.appendChild(btn);
})();
