// ==UserScript==
// @name         Cookie Clicker Ultimate Cheat Menu
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Mod Menü mit Drag & Drop, Auto-Clicker, Cookies & Dev-Tools
// @author       Deine KI
// @match        https://orteil.dashnet.org/cookieclicker/*
// @match        http://orteil.dashnet.org/cookieclicker/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

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

        // Gespeicherte Position laden oder Default
        const savedLeft = localStorage.getItem('cc_menu_left') || '20px';
        const savedTop = localStorage.getItem('cc_menu_top') || '60px';

        const style = document.createElement('style');
        style.textContent = `
            #cc-cheat-menu {
                position: fixed;
                top: ${savedTop};
                left: ${savedLeft};
                width: 260px;
                background: rgba(20, 20, 25, 0.96);
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
                cursor: grab;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #cc-cheat-header:active {
                cursor: grabbing;
            }
            .cc-header-btns {
                display: flex;
                gap: 4px;
            }
            .cc-top-btn {
                background: #111;
                color: #d4af37;
                border: none;
                border-radius: 4px;
                padding: 2px 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 11px;
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

        const menu = document.createElement('div');
        menu.id = 'cc-cheat-menu';
        menu.innerHTML = `
            <div id="cc-cheat-header">
                <span>🍪 Cookie Mod Menü</span>
                <div class="cc-header-btns">
                    <button id="cc-cheat-toggle" class="cc-top-btn">−</button>
                </div>
            </div>
            <div id="cc-cheat-body">
                <div class="cc-section-title">Automatisierung</div>
                <button id="btn-autoclick" class="cc-btn">🖱️ Auto-Clicker: AUS</button>
                <button id="btn-autogolden" class="cc-btn">✨ Auto-Golden Cookies: AUS</button>

                <div class="cc-section-title">Cookies & Lump-Cheats</div>
                <div class="cc-row">
                    <input type="number" id="input-cookies" class="cc-input" placeholder="Menge...">
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

        // Einklappen-Logik
        const toggleBtn = document.getElementById('cc-cheat-toggle');
        const bodyEl = document.getElementById('cc-cheat-body');
        toggleBtn.addEventListener('click', () => {
            isMinimized = !isMinimized;
            bodyEl.style.display = isMinimized ? 'none' : 'flex';
            toggleBtn.textContent = isMinimized ? '+' : '−';
        });

        // Perfekte Drag & Drop Logik (überall greifbar auf dem Header)
        const header = document.getElementById('cc-cheat-header');
        let isDragging = false, startX = 0, startY = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX - menu.offsetLeft;
            startY = e.clientY - menu.offsetTop;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            
            menu.style.left = newX + 'px';
            menu.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // Position speichern
                localStorage.setItem('cc_menu_left', menu.style.left);
                localStorage.setItem('cc_menu_top', menu.style.top);
            }
        });

        // Event Listeners für die Cheats
        let btnAutoClick = document.getElementById('btn-autoclick');
        btnAutoClick.addEventListener('click', () => {
            if (autoClickInterval) {
                clearInterval(autoClickInterval);
                autoClickInterval = null;
                btnAutoClick.textContent = '🖱️ Auto-Clicker: AUS';
                btnAutoClick.classList.remove('active');
            } else {
                autoClickInterval = setInterval(() => Game.ClickCookie(), 10);
                btnAutoClick.textContent = '🖱️ Auto-Clicker: AN (100/s)';
                btnAutoClick.classList.add('active');
            }
        });

        let btnAutoGolden = document.getElementById('btn-autogolden');
        btnAutoGolden.addEventListener('click', () => {
            if (autoGoldenInterval) {
                clearInterval(autoGoldenInterval);
                autoGoldenInterval = null;
                        btnAutoGolden.textContent = '✨ Auto-Golden Cookies: AUS';
                btnAutoGolden.classList.remove('active');
            } else {
                autoGoldenInterval = setInterval(() => {
                    Game.shimmers.forEach(s => s.pop());
                }, 200);
                btnAutoGolden.textContent = '✨ Auto-Golden Cookies: AN';
                btnAutoGolden.classList.add('active');
            }
        });

        document.getElementById('btn-add-cookies').addEventListener('click', () => {
            const val = parseFloat(document.getElementById('input-cookies').value);
            if (!isNaN(val) && val > 0) Game.Earn(val);
        });

        document.getElementById('btn-x10-cookies').addEventListener('click', () => {
            if (Game.cookies > 0) Game.Earn(Game.cookies * 9);
            else Game.Earn(1000);
        });

        document.getElementById('btn-inf-cookies').addEventListener('click', () => {
            Game.cookies = Infinity;
            Game.cookiesEarned = Infinity;
        });

        document.getElementById('btn-add-lumps').addEventListener('click', () => Game.gainLumps(100));
        document.getElementById('btn-spawn-golden').addEventListener('click', () => new Game.shimmer('golden'));
        document.getElementById('btn-unlock-all').addEventListener('click', () => Game.SetAllUpgrades(1));
        document.getElementById('btn-ruin-fun').addEventListener('click', () => Game.RuinTheFun());
        document.getElementById('btn-dev-menu').addEventListener('click', () => Game.OpenSesame());
    }
})();
