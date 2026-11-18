// ==UserScript==
// @name         Cookie Clicker Ultimate Cheat Menu
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Mod Menü für Cookie Clicker (Auto-Clicker, Cookies, Golden Cookies, Dev-Tools)
// @author       Deine KI
// @match        https://orteil.dashnet.org/cookieclicker/*
// @match        http://orteil.dashnet.org/cookieclicker/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Warten, bis das Spiel komplett geladen ist
    const initInterval = setInterval(() => {
        if (typeof Game !== 'undefined' && Game.ready) {
            clearInterval(initInterval);
            createCheatMenu();
        }
    }, 500);

    function createCheatMenu() {
        let autoClickInterval = null;
        let autoGoldenInterval = null;
        let isMinimized = false;

        // Styles für das Menü
        const style = document.createElement('style');
        style.textContent = `
            #cc-cheat-menu {
                position: fixed;
                top: 60px;
                left: 20px;
                width: 260px;
                background: rgba(20, 20, 25, 0.95);
                border: 2px solid #d4af37;
                border-radius: 10px;
                color: #fff;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 13px;
                z-index: 9999999;
                box-shadow: 0 8px 25px rgba(0,0,0,0.8);
                user-select: none;
                overflow: hidden;
            }
            #cc-cheat-header {
                background: linear-gradient(90deg, #b8860b, #d4af37);
                color: #111;
                font-weight: bold;
                padding: 8px 12px;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #cc-cheat-toggle {
                background: #111;
                color: #d4af37;
                border: none;
                border-radius: 4px;
                padding: 2px 7px;
                cursor: pointer;
                font-weight: bold;
            }
            #cc-cheat-body {
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .cc-btn {
                background: #2b2b36;
                color: #fff;
                border: 1px solid #444;
                padding: 7px 10px;
                border-radius: 6px;
                cursor: pointer;
                text-align: left;
                transition: 0.15s;
                font-weight: 500;
            }
            .cc-btn:hover {
                background: #3c3c4c;
                border-color: #d4af37;
            }
            .cc-btn.active {
                background: #1e5631;
                border-color: #4caf50;
                color: #a5d6a7;
            }
            .cc-row {
                display: flex;
                gap: 6px;
            }
            .cc-input {
                width: 100%;
                background: #15151a;
                border: 1px solid #444;
                color: #fff;
                padding: 6px;
                border-radius: 6px;
                box-sizing: border-box;
            }
            .cc-section-title {
                font-size: 11px;
                text-transform: uppercase;
                color: #aaa;
                margin-top: 4px;
                letter-spacing: 0.5px;
            }
        `;
        document.head.appendChild(style);

        // HTML-Struktur des Menüs
        const menu = document.createElement('div');
        menu.id = 'cc-cheat-menu';
        menu.innerHTML = `
            <div id="cc-cheat-header">
                <span>🍪 Cookie Mod Menü</span>
                <button id="cc-cheat-toggle">−</button>
            </div>
            <div id="cc-cheat-body">
                <div class="cc-section-title">Automatisierung</div>
                <button id="btn-autoclick" class="cc-btn">🖱️ Auto-Clicker: AUS</button>
                <button id="btn-autogolden" class="cc-btn">✨ Auto-Golden Cookies: AUS</button>

                <div class="cc-section-title">Cookies & Lump-Cheats</div>
                <div class="cc-row">
                    <input type="number" id="input-cookies" class="cc-input" placeholder="Menge (z.B. 1000000)">
                    <button id="btn-add-cookies" class="cc-btn" style="width: auto;">+Add</button>
                </div>
                <button id="btn-x10-cookies" class="cc-btn">📈 Cookies x10</button>
                <button id="btn-inf-cookies" class="cc-btn">♾️ Unendlich Cookies</button>
                <button id="btn-add-lumps" class="cc-btn">🧊 +100 Sugar Lumps</button>

                <div class="cc-section-title">Events & Unlocks</div>
                <button id="btn-spawn-golden" class="cc-btn">🌟 Golden Cookie spawnen</button>
                <button id="btn-unlock-all" class="cc-btn">🔓 Alle Upgrades freischalten</button>
                <button id="btn-ruin-fun" class="cc-btn">💀 Ruin The Fun (Alles max)</button>
                <button id="btn-dev-menu" class="cc-btn">🛠️ Offizielles Dev-Menü öffnen</button>
            </div>
        `;
        document.body.appendChild(menu);

        // Menü einklappbar machen
        const toggleBtn = document.getElementById('cc-cheat-toggle');
        const bodyEl = document.getElementById('cc-cheat-body');
        toggleBtn.addEventListener('click', () => {
            isMinimized = !isMinimized;
            bodyEl.style.display = isMinimized ? 'none' : 'flex';
            toggleBtn.textContent = isMinimized ? '+' : '−';
        });

        // Menü per Drag & Drop verschiebbar machen
        const header = document.getElementById('cc-cheat-header');
        let isDragging = false, offsetX = 0, offsetY = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target === toggleBtn) return;
            isDragging = true;
            offsetX = e.clientX - menu.offsetLeft;
            offsetY = e.clientY - menu.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            menu.style.left = (e.clientX - offsetX) + 'px';
            menu.style.top = (e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // 1. Auto-Clicker (100 Klicks pro Sekunde)
        const btnAutoClick = document.getElementById('btn-autoclick');
        btnAutoClick.addEventListener('click', () => {
            if (autoClickInterval) {
                clearInterval(autoClickInterval);
                autoClickInterval = null;
                btnAutoClick.textContent = '🖱️ Auto-Clicker: AUS';
                btnAutoClick.classList.remove('active');
            } else {
                autoClickInterval = setInterval(() => {
                    Game.ClickCookie();
                }, 10);
                btnAutoClick.textContent = '🖱️ Auto-Clicker: AN (100/s)';
                btnAutoClick.classList.add('active');
            }
        });

        // 2. Auto-Golden Cookies (klickt automatisch alle Golden Cookies & Rentier-Popups an)
        const btnAutoGolden = document.getElementById('btn-autogolden');
        btnAutoGolden.addEventListener('click', () => {
            if (autoGoldenInterval) {
                clearInterval(autoGoldenInterval);
                autoGoldenInterval = null;
                btnAutoGolden.textContent = '✨ Auto-Golden Cookies: AUS';
                btnAutoGolden.classList.remove('active');
            } else {
                autoGoldenInterval = setInterval(() => {
                    Game.shimmers.forEach(shimmer => shimmer.pop());
                }, 200);
                btnAutoGolden.textContent = '✨ Auto-Golden Cookies: AN';
                btnAutoGolden.classList.add('active');
            }
        });

        // 3. Bestimmte Menge Cookies hinzufügen
        document.getElementById('btn-add-cookies').addEventListener('click', () => {
            const val = parseFloat(document.getElementById('input-cookies').value);
            if (!isNaN(val) && val > 0) {
                Game.Earn(val);
            }
        });

        // 4. Cookies mal 10 nehmen
        document.getElementById('btn-x10-cookies').addEventListener('click', () => {
            if (Game.cookies > 0) {
                Game.Earn(Game.cookies * 9);
            } else {
                Game.Earn(1000);
            }
        });

        // 5. Unendlich Cookies
        document.getElementById('btn-inf-cookies').addEventListener('click', () => {
            Game.cookies = Infinity;
            Game.cookiesEarned = Infinity;
        });

        // 6. +100 Sugar Lumps
        document.getElementById('btn-add-lumps').addEventListener('click', () => {
            Game.gainLumps(100);
        });

        // 7. Golden Cookie sofort spawnen
        document.getElementById('btn-spawn-golden').addEventListener('click', () => {
            new Game.shimmer('golden');
        });

        // 8. Alle Upgrades freischalten
        document.getElementById('btn-unlock-all').addEventListener('click', () => {
            Game.SetAllUpgrades(1);
        });

        // 9. Ruin The Fun (Alles freischalten + riesiger Cookie-Boost)
        document.getElementById('btn-ruin-fun').addEventListener('click', () => {
            Game.RuinTheFun();
        });

        // 10. Offizielles Dev-Menü aktivieren
        document.getElementById('btn-dev-menu').addEventListener('click', () => {
            Game.OpenSesame();
        });
    }
})();
