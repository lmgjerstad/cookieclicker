// ==UserScript==
// @name         CookieAuto
// @version      0.1.0-i
// @namespace    https://github.com/lmgjerstad/cookieclicker
// @updateURL    https://raw.githubusercontent.com/lmgjerstad/cookieclicker/master/auto.js
// @description  Automate your cookies!
// @homepage     https://lmgjerstad.github.io/cookieclicker/
// @supportURL   https://github.com/lmgjerstad/cookieclicker/issues
// @author       Lance Gjerstad, Adrian Gjerstad
// @match        http*://orteil.dashnet.org/cookieclicker/
// @grant        none
// ==/UserScript==

var CookieAuto = {};

(() => {
    'use strict';

    let Game = window.Game;
    let settings = (() => {
        let serialized = localStorage.getItem('cookie_auto');
        let settings;
        if (serialized) {
            return JSON.parse(serialized);
        } else {
            // TODO: Delete this branch once everyone has run this code once
            let get_def = (name, def) => {
                let val = localStorage.getItem(name);
                if (val === null) {
                    return def;
                }
                localStorage.removeItem(name);
                return JSON.parse(val);
            };
            settings = {
                considerTTL : get_def('buyscript_considerTTL', true),
                buyBuildings : get_def('buyscript_buyBuildings', true),
                buyUpgrades : get_def('buyscript_buyUpgrades', true),
                popGoldenCookies : get_def('buyscript_popGoldenCookies', true),
                popWrathCookies: get_def('buyscript_popWrathCookies', true),
                popReindeer : get_def('buyscript_popReindeer', true),
                popWrinklers : get_def('buyscript_popWrinklers', true),
                wrinklerThreshold : get_def('buyscript_wrinklerThreshold', 0),
                maintainPledge : get_def('buyscript_maintainPledge', true),
                reserve : get_def('buyscript_reserve', false),
                autoclick : get_def('buyscript_autoclick', false),
                upgradeDragon : get_def('buyscript_upgradeDragon', false),
                upgradeSanta : get_def('buyscript_upgradeSanta', false),
                autoReset : get_def('buyscript_autoReset', false),
            };
            localStorage.setItem('cookie_auto', JSON.stringify(settings));
            return settings;
        }
    })();

    let saveSettings = () => localStorage.setItem('cookie_auto', JSON.stringify(settings));

    let q = css_selector => document.querySelectorAll(css_selector);

    let log_ = [];

    let icons = {
        santa : [18, 9],
        dragon : [21, 12]
    };

    let updateUiLog = function () {
        if (log_.length > 25) {
            log_.shift();
        }

        let lelem = q('#calog')[0];

        // HACK: This is not ideal
        let str = '';

        for (let log of log_) {
            str += '<div style="border-bottom: 1px solid #333; padding: 8px;overflow: auto;"><div class="icon" style="float: left; margin-left: -8px; margin-top: -8px;background-position:'+log[0]+';"></div><div class="name" style="margin: auto 0;">'+log[1]+'</div><small>'+log[2]+'</small></div>'
        }

        let setscroll = lelem.scrollTop+240>lelem.scrollHeight;

        lelem.innerHTML = str;

        if (setscroll) lelem.scrollTop = lelem.scrollHeight;
    }

    let log = function (ico, text, small) {
        log_.push([(ico[0]*-48)+'px '+(ico[1]*-48)+'px', text, small]);
        updateUiLog();
    }

    let logPurchase = function (o) {
        if (o instanceof Game.Object) {
            // Buildings
            log([o.iconColumn,0], 'New '+o.name.toLowerCase()+'', '[owned : '+o.amount+']');
        } else if (o instanceof Game.Upgrade) {
            // Obviously an upgrade
            log(o.icon, '"'+o.name+'"', '['+(o.pool==''?'Upgrade':o.pool.substr(0,1).toUpperCase()+o.pool.substr(1))+']');
        }
    }

    let roi = (() => {
        // cursor upgrades
        let cursor_cps = () => Game.Objects.Cursor.storedTotalCps * Game.globalCpsMult;

        // cursors gain mult for each non-cursor building owned
        let finger_cps = multiplier => () => {
            let cursors = Game.Objects.Cursor.amount;
            let otherBuildings = Game.BuildingsOwned - cursors;
            return cursors * otherBuildings * multiplier * Game.globalCpsMult;
        }
        // Kittens cps is based on how much milk there is.
        let kitten_cps = multiplier => () => {
            let mult = 1;
            if (Game.Has("Santa's milk and cookies")) mult *= 1.05;
            if (Game.hasAura("Breath of milk")) mult *= 1.05;
            return Game.milkProgress * multiplier * mult * Game.cookiesPs;
        }
        // Grandmas twice as efficient, building gains 1% per grandma
        // TODO: Account for 1% per grandma
        let grandma_cps = () => Game.Objects.Grandma.storedTotalCps * Game.globalCpsMult;

        // clicking gains 1% of cps
        // TODO: Account for whether autoclicking is on or not
        let mouse_cps = () => Game.cookiesPs * 0.2;

        // Unlock prestige potential
        let prestige_cps = multiplier => () => Game.prestige * 0.01 * Game.heavenlyPower * multiplier * Game.cookiesPs;

        let custom_cps = {
            "Reinforced index finger" : cursor_cps,
            "Carpal tunnel prevention cream" : cursor_cps,
            "Ambidextrous" : cursor_cps,
            "Thousand fingers" : finger_cps(0.1),
            "Million fingers" : finger_cps(0.5),
            "Billion fingers" : finger_cps(5),
            "Trillion fingers" : finger_cps(50),
            "Quadrillion fingers" : finger_cps(500),
            "Quintillion fingers" : finger_cps(5000),
            "Sextillion fingers" : finger_cps(50000),
            "Septillion fingers" : finger_cps(500000),
            "Octillion fingers" : finger_cps(5000000),
            "Kitten helpers" : kitten_cps(0.1),
            "Kitten workers" : kitten_cps(0.125),
            "Kitten engineers" : kitten_cps(0.15),
            "Kitten overseers" : kitten_cps(0.175),
            "Kitten managers" : kitten_cps(0.2),
            "Kitten accountants" : kitten_cps(0.2),
            "Kitten specialists" : kitten_cps(0.2),
            "Kitten experts" : kitten_cps(0.2),
            'Farmer grandmas' : grandma_cps,
            'Worker grandmas' : grandma_cps,
            'Miner grandmas' : grandma_cps,
            'Cosmic grandmas' : grandma_cps,
            'Transmuted grandmas' : grandma_cps,
            'Altered grandmas' : grandma_cps,
            'Grandmas\' grandmas' : grandma_cps,
            'Antigrandmas' : grandma_cps,
            'Rainbow grandmas' : grandma_cps,
            'Banker grandmas' : grandma_cps,
            'Priestess grandmas' : grandma_cps,
            'Witch grandmas' : grandma_cps,
            'Plastic mouse' : mouse_cps,
            'Iron mouse' : mouse_cps,
            'Titanium mouse' : mouse_cps,
            'Adamantium mouse' : mouse_cps,
            'Unobtainium mouse' : mouse_cps,
            'Eludium mouse' : mouse_cps,
            'Wishalloy mouse' : mouse_cps,
            'Fantasteel mouse' : mouse_cps,
            'Nevercrack mouse' : mouse_cps,
            'Heavenly chip secret' : prestige_cps(0.05),
            'Heavenly cookie stand' : prestige_cps(0.20),
            'Heavenly bakery' : prestige_cps(0.25),
            'Heavenly confectionery' : prestige_cps(0.25),
            'Heavenly key' : prestige_cps(0.25),
            "Bingo center/Research facility" : () => Game.Objects.Grandma.storedTotalCps * Game.globalCpsMult * 3,
            "A crumbly egg" : () => Infinity,
        }
        return o => {
            let cps;
            if (o.constructor === Game.Upgrade) {
                if (o.tier && o.buildingTie) {
                    // Upgrade is tied to a building type and will double output of that building.
                    cps = o.buildingTie.storedTotalCps * Game.globalCpsMult;
                } else if (o.pool == "cookie") {
                    // Cookies increase 1% per power.
                    if (typeof(o.power) == "function") {
                        cps = Game.cookiesPs * o.power() / 100;
                    } else {
                        cps = Game.cookiesPs * o.power / 100;
                    }
                } else if (o.hasOwnProperty("buildingTie1")) {
                    // Upgrades affecting multiple buildings.  5% for first building, 0.1% for second.
                    cps = o.buildingTie1.storedTotalCps * Game.globalCpsMult * 0.05 + o.buildingTie2.storedTotalCps * Game.globalCpsMult * 0.001;
                } else if (custom_cps.hasOwnProperty(o.name)) {
                    cps = custom_cps[o.name]();
                }
            } else if (o.constructor === Game.Object) {
                // It's a building
                cps = o.storedCps * Game.globalCpsMult;
            }
            if (cps !== undefined) {
                return o.getPrice() / cps;
            }
            return undefined;
        };
    })();

    /**
     * Lucky is maximized when 15% of the cookies in the bank are at
     * least 15 minutes worth of production.  This effect also stacks with
     * "frenzy"
     */
    let getLuckyReserve = () => {
        // Skip if reservation not set.
        if (!settings.reserve) {
            return 0;
        }

        // If We're less than 2 hours into a run, don't bother.
        let date = new Date();
        date.setTime(Date.now() - Game.startDate);
        if (date.getTime() < 2 * 60 * 60 * 1000) {
            return 0;
        }

        // Start with 6000, since 15% of 6000 seconds is 15 minutes
        let seconds = 6000;
        let cps = Game.cookiesPs;

        // If get lucky is owned, it then the frenzy stack is possible.
        if (Game.Upgrades["Get lucky"].bought) {
            cps *= 7;
        }

        // Ignore any temporary buffs, they don't stack anyway.
        cps = Object.values(Game.buffs).map(x => x.multCpS).reduce((a,b) => a / b, cps);

        // The calculation of CpS doesn't account for wrinklers, so we drop
        // them from the CpS
        cps /= (1 - (Game.wrinklers.filter(x => x.close).length / 20));

        return seconds * cps;
    };

    /**
     * Calculate how many cookies we need before purchasing an object.
     *
     * @param {!Object} goal The object to be purchased.
     * @return Number of cookies needed before purchase.
     */
    let target = goal => getLuckyReserve() + goal.getPrice();


    /**
     * Calculate how long it will take to reach a certain goal.
     *
     * @param {!Object|number} goal The object to be purchased.
     * @return Number of seconds before there will be enough cookies.
     */
    let ttl = goal => {
        let cookiesNeeded;
        if (typeof(goal) == "object") {
            cookiesNeeded = target(goal);
        } else {
            cookiesNeeded = goal;
        }
        let cookiesRemaining = cookiesNeeded - Game.cookies;
        if (cookiesRemaining <= 0) return 0;
        return cookiesRemaining / Game.cookiesPs;
    };

    let shoppingList = new Map();

    let initShoppingList = () => {
        (() => {
            if (settings.hasOwnProperty('shoppingList')) {
                return;
            }
            let bf = b64_to_utf8(localStorage.getItem('buyscript_shoppingList'));
            if (bf) {
                localStorage.removeItem('buyscript_shoppingList');
                let items = [];
                let u = Game.UpgradesByPool[''].concat(Game.UpgradesByPool.tech)
                                               .sort((a,b) => a.id - b.id);
                for (let bit in bf) {
                    if (bf[bit] == '1') {
                        items.push(u[bit]);
                    }
                }
                settings.shoppingList = items.map(x => x.name);
                localStorage.setItem('cookie_auto', JSON.stringify(settings));
                return;
            }
            settings.shoppingList = Game.UpgradesByPool.tech.map(x => x.name)
                                        .concat(Game.santaDrops)
                                        .concat(Game.easterEggs.filter(x => x != "Chocolate egg"))
                                        .concat([
                                            "A festive hat",
                                            "Lucky day",
                                            "Serendipity",
                                            "Get lucky",
                                            "Sacrificial rolling pins",
                                            "Santa's dominion",
                                            "A crumbly egg",
                                        ])
            localStorage.setItem('cookie_auto', JSON.stringify(settings));
        })();
        settings.shoppingList.forEach(x => shoppingList.set(x, Game.Upgrades[x]));
    };

    let nextOnShoppingList = () => {
        let max_price = Game.cookiesPs*60 + Game.cookies;
        let order = (a,b) => a.getPrice() - b.getPrice();
        return Array.from(shoppingList.values())
                    .filter(x => x.getPrice() < max_price)
                    .filter(x => x.unlocked && !x.bought)
                    .sort(order)[0]
    };

    let inShoppingList = me => shoppingList.has(me.name);

    let toggleInShoppingList = me => {
        if (!shoppingList.delete(me.name)) {
            shoppingList.set(me.name, me);
        }
        settings.shoppingList = Array.from(shoppingList.keys());

        q('#shlst'+me.id)[0].style.opacity = inShoppingList(me)?'1':'0.2';
    };

    let bestBuy = () => {
        let objects = [];
        if (settings.buyBuildings) {
            objects = objects.concat(Object.values(Game.Objects));
        }
        if (settings.buyUpgrades) {
            objects = objects.concat(
                Object.values(Game.UpgradesInStore).filter(x => !x.bought));
        }
        objects = objects.map(x => [x, roi(x)]).filter(x => x[1] != undefined);
        if (objects.length == 0) {
            return undefined;
        }
        if (settings.considerTTL) {
            objects = objects.map(x => [x[0], x[1] + ttl(x[0])]);
        }
        let best = objects.reduce((a, b) => a[1] < b[1] ? a : b);
        return best[0];
    };

    let maybeUpgradeDragon = () => {
        if (settings.upgradeDragon && Game.Has("A crumbly egg") && Game.dragonLevels[Game.dragonLevel].cost()) {
            Game.UpgradeDragon();
            log(icons.dragon, 'A dragon upgrade has been purchased.', '[level : '+Game.dragonLevel+']');
        }
    };

    let maybeUpgradeSanta = () => {
        if (settings.upgradeSanta && Game.Has("A festive hat") &&
            Game.santaLevel < Game.santaLevels.length - 1 &&
            Game.cookies>Math.pow(Game.santaLevel+1,Game.santaLevel+1)) {
            Game.UpgradeSanta();
            log(icons.santa, 'A santa upgrade has been purchased.', '[level : '+Game.santaLevel+']');
        }
    };

    let format = num => numberFormatters[1](num);

    let buyBest = () => {
        let done = false;
        let itemsPurchased = false;
        while (!done) {
            maybeUpgradeDragon();
            maybeUpgradeSanta();
            let o = nextOnShoppingList() || bestBuy();
            if (o === undefined) {
                return;
            }
            let price = o.getPrice();
            if (Game.cookies > getLuckyReserve() + price) {
                console.log('buying ' + o.name);
                if (o.constructor == Game.Object) {
                    o.buy(1);
                } else {
                    o.buy();
                }
                logPurchase(o);
                itemsPurchased = true;
            } else {
                if (itemsPurchased) {
                    console.log('next ' + o.name + ' => ' + format(target(o)));
                }
                done = true;
            }
        }

        Game.UpdateMenu();
    };

    let popShimmers = () => {
        for (let shimmer of Game.shimmers.reverse()) {
            if (shimmer.wrath) {
                if (settings.popWrathCookies) shimmer.pop();
            } else if (shimmer.type == "golden") {
                if (settings.popGoldenCookies) shimmer.pop();
            } else {
                if (settings.popReindeer) shimmer.pop();
            }
        }
        if (settings.popWrinklers) {
            for (let wrinkler of Game.wrinklers) {
                if (wrinkler.close == 1) {
                    if (settings.wrinklerThreshold <= wrinkler.sucked) {
                        wrinkler.hp = 0;
                    }
                }
            }
        }
    };

    let pledge = () => {
        if (!settings.maintainPledge) return;
        let p = Game.Upgrades["Elder Pledge"];
        if (p.unlocked && !p.bought) {
            p.buy();
        }
    };

    let toggleSetting = name => {
        settings[name] = !settings[name];
        saveSettings();
    };

    if (typeof window.CookieAuto === "undefined") {
        var CookieAuto = {
            roi : roi,
            ttl : ttl,
            bestBuy : bestBuy,
            buyBest : buyBest,
            popShimmers : popShimmers,
            maybeUpgradeDragon : maybeUpgradeDragon,
            maybeUpgradeSanta : maybeUpgradeSanta,
            pledge : pledge,
            getLuckyReserve : getLuckyReserve,
            nextOnShoppingList : nextOnShoppingList,
            toggleBuilding : function() {
                settings.buyBuildings = !settings.buyBuildings;
                saveSettings();
            },
            toggleUpgrade : function() {
                settings.buyUpgrades = !settings.buyUpgrades;
                saveSettings();
            },
            toggleAutoclicker : function() {
                settings.autoclick = !settings.autoclick;
                saveSettings();
            },
            toggleReserve : function() {
                settings.reserve = !settings.reserve;
                saveSettings();
            },
            toggleTTL : function() {
                settings.considerTTL = !settings.considerTTL;
                saveSettings();
            },
            toggleGoldenCookies : function() {
                settings.popGoldenCookies = !settings.popGoldenCookies;
                saveSettings();
            },
            toggleWrathCookies : function() {
                settings.popWrathCookies = !settings.popWrathCookies;
                saveSettings();
            },
            toggleReindeer : function() {
                settings.popReindeer = !settings.popReindeer;
                saveSettings();
            },
            toggleWrinklers : function() {
                settings.popWrinklers = !settings.popWrinklers;
                saveSettings();
            },
            togglePledge : function() {
                settings.maintainPledge = !settings.maintainPledge;
                saveSettings();
            },
            toggleDragon : function() {
                settings.upgradeDragon = !settings.upgradeDragon;
                saveSettings();
            },
            toggleSanta : function() {
                settings.upgradeSanta = !settings.upgradeSanta;
                saveSettings();
            },
            control : settings,
            target : target,
            format : format,
            prevTarget : null,
            updateGoalValue : function () {
                if (this.ui.showing) {
                    let nextBuy=(nextOnShoppingList()!==undefined?nextOnShoppingList():CookieAuto.bestBuy());
                    let isNext = nextBuy!==undefined;
                    let nextBuyIcon,nextBuyType,price;
                    if (isNext) {
                        nextBuyIcon = (nextBuy instanceof Game.Upgrade?[nextBuy.icon[0]*-48, nextBuy.icon[1]*-48]:[(nextBuy.iconColumn)*-48, 0]);
                        nextBuyType = (nextBuy instanceof Game.Object?'[owned : '+nextBuy.amount+']':(nextBuy instanceof Game.Upgrade?(nextBuy.pool!==''?'['+nextBuy.pool.substr(0,1).toUpperCase() + nextBuy.pool.substr(1)+']':'[Upgrade]'):'<ERR>'))+'';

                        price = nextBuy.getPrice();
                    }

                    let bnelems = q('#buyingNext')[0].children;

                    bnelems[0].style.backgroundPosition = nextBuyIcon[0]+'px '+nextBuyIcon[1]+'px';
                    bnelems[1].innerText = Beautify(nextBuy.getPrice());
                    bnelems[2].innerText = nextBuy.name;
                    bnelems[3].innerText = nextBuyType
                    bnelems[4].innerText = Beautify(target(nextBuy));
                    bnelems[5].children[0].style.right = (100-((Game.cookies/(CookieAuto.getLuckyReserve() + price+1))*100)) + '%';
                }
            },
            loop : function () {
                if (settings.autoReset && settings.autoReset > Game.resets) {
                    if (Game.OnAscend) {
                        Game.Reincarnate(true);
                    } else if (Game.AscendTimer > 0) {
                    } else {
                        let prestige = Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned));
                        if (prestige > Game.prestige) {
                            Game.Ascend(true);
                        }
                    }
                }

                CookieAuto.updateGoalValue();

                this.prevTarget = (nextOnShoppingList()!==undefined?nextOnShoppingList():CookieAuto.bestBuy());

                CookieAuto.buyBest();
                CookieAuto.popShimmers();
                CookieAuto.pledge();
                CookieAuto.update();
            },
            init : function () {
                initShoppingList();

                this.shoppingListSortMode = this.sorting.price;

                this.ui.init();

                q('#prefsButton')[0].onclick = () => {if(this.ui.showing)this.ui.showMenu()};
                q('#statsButton')[0].onclick = () => {if(this.ui.showing)this.ui.showMenu()};
                q('#logButton')[0].onclick = () => {if(this.ui.showing)this.ui.showMenu()};

                this.buyBest();
                this.interval = setInterval(this.loop, 500);
                this.update();
            },
            update : function () {
                if (settings.autoclick && !this.autoclicker) {
                    this.autoclicker = setInterval(Game.ClickCookie, 20);
                }
                if (!settings.autoclick && this.autoclicker) {
                    clearInterval(this.autoclicker);
                    this.autoclicker = 0;
                }
            },
            toggleInShoppingList: toggleInShoppingList,
            sorting : {
                a2z : [(a,b) => a.name.localeCompare(b.name), "A to Z"],
                z2a : [(a,b) => b.name.localeCompare(a.name), "Z to A"],
                price : [(a,b) => a.getPrice() - b.getPrice(), "Price"],
                revPrice : [(a,b) => b.getPrice() - a.getPrice(), "Reverse Price"],
                __algos__ : ["a2z", "z2a", "price", "revPrice"]
            },
            shoppingListSortMode : null,
            generateIconTableData : function() {
                let u = Game.UpgradesByPool[''].concat(Game.UpgradesByPool.tech)
                                               .sort(this.shoppingListSortMode[0]);
                let res = '';
                for (let o of u) {
                    let x = o.icon[0]*-48;
                    let y = o.icon[1]*-48;
                    res += '<div id="shlst'+o.id+'" class="icon" onclick="CookieAuto.toggleInShoppingList(Game.UpgradesById['+o.id+']);" onmouseout="Game.setOnCrate(0);Game.tooltip.shouldHide=1;" onmouseover="if (!Game.mouseDown) {Game.setOnCrate(this);Game.tooltip.dynamic=1;Game.tooltip.draw(this,function(){return function(){return Game.crateTooltip(Game.UpgradesById['+o.id+'],\'shoppingListSelector\');}();},\'\');Game.tooltip.wobble();}" style="padding:0; cursor:pointer; background-position:'+x+'px '+y+'px; float:left; opacity:'+(inShoppingList(o)?'1':'0.2')+';"></div>';
                }
                return res;
            },

            ui : {
                showing : false,
                menuelem : null,
                init : function () {
                    this.menuelem = document.createElement('div');
                    this.menuelem.style.position = "absolute";
                    this.menuelem.style.left = "calc(30% + 16px)";
                    this.menuelem.style.top = "144px";
                    this.menuelem.style.width = "calc(70vw - 348px)";
                    this.menuelem.style.height = "calc(100vh - 144px)";
                    this.menuelem.style.wordWrap = "break-word";
                    this.menuelem.style.zIndex = "10";
                    this.menuelem.style.background = "#000 url(img/darkNoise.jpg)";
                    this.menuelem.style.overflow = "auto";
                    this.menuelem.style.display = "none";

                    document.body.appendChild(this.menuelem);

                    Game.prefs.buyscript_abbuild = settings.buyBuildings?1:0;
                    Game.prefs.buyscript_abup = settings.buyUpgrades?1:0;
                    Game.prefs.buyscript_abac = settings.autoclick?1:0;
                    Game.prefs.buyscript_reserve = settings.reserve?1:0;
                    Game.prefs.buyscript_cttl = settings.considerTTL?1:0;
                    Game.prefs.buyscript_pgc = settings.popGoldenCookies?1:0;
                    Game.prefs.buyscript_pwc = settings.popWrathCookies?1:0;
                    Game.prefs.buyscript_rein = settings.popReindeer?1:0;
                    Game.prefs.buyscript_wrnk = settings.popWrinklers?1:0;
                    Game.prefs.buyscript_pledge = settings.maintainPledge?1:0;

                    Game.prefs.buyscript_santaup = settings.upgradeSanta?1:0;
                    Game.prefs.buyscript_dragonup = settings.upgradeDragon?1:0;

                    this.populateMenu();
                },
                showMenu : function () {
                    this.showing = !this.showing;
                    if (this.showing) {
                        Game.onMenu = "";
                        Game.ShowMenu();
                    }
                    this.menuelem.style.display = (this.showing?"block":"none");
                },
                populateMenu : function () {
                    let str = '';

                    str += '<div class="close menuClose" onclick="CookieAuto.ui.showMenu();">x</div>'+
                           '<div class="section">CookieAuto Interface</div>'+
                           '<div class="subsection">'+
                           '<div class="title">General</div>'+
                           '<div class="listing">'+
                           Game.WriteButton('buyscript_abbuild','buyscript_abbuild','Building autobuyers ON','Building autobuyers OFF','CookieAuto.toggleBuilding();')+'<label>(Enable/disable the building autobuyers)</label><br>'+
                           Game.WriteButton('buyscript_abup','buyscript_abup','Upgrade autobuyers ON','Upgrade autobuyers OFF','CookieAuto.toggleUpgrade();')+'<label>(Enable/disable the upgrade autobuyers)</label><br>'+
                           Game.WriteButton('buyscript_abac','buyscript_abac','Autoclicker ON','Autoclicker OFF','CookieAuto.toggleAutoclicker();')+'<label>(Enable/disable the autoclicker)</label><br>'+
                           Game.WriteButton('buyscript_reserve','buyscript_reserve','Reserve ON','Reserve OFF','CookieAuto.toggleReserve();')+'<label>(Reserve cookies for after a purchase)</label><br>'+
                           Game.WriteButton('buyscript_cttl','buyscript_cttl','Consider Time-To-Buy ON','Consider Time-To-Buy OFF','CookieAuto.toggleTTL();')+'<label>(Take the amount of time it takes to purchase something into consideration)</label><br>'+
                           Game.WriteButton('buyscript_pgc','buyscript_pgc','Golden Cookies ON','Golden Cookies OFF','CookieAuto.toggleGoldenCookies();')+'<label>(Click all golden cookies automatically)</label><br>'+
                           Game.WriteButton('buyscript_pwc','buyscript_pwc','Wrath Cookies ON','Wrath Cookies OFF','CookieAuto.toggleWrathCookies();')+'<label>(Click all wrath cookies automatically)</label><br>'+
                           Game.WriteButton('buyscript_rein','buyscript_rein','Reindeer ON','Reindeer OFF','CookieAuto.toggleReindeer();')+'<label>(Click reindeer automatically)</label><br>'+
                           Game.WriteButton('buyscript_wrnk','buyscript_wrnk','Wrinklers ON','Wrinklers OFF','CookieAuto.toggleWrinklers();')+'<label>(Click wrinklers automatically)</label><br>'+
                           Game.WriteButton('buyscript_pledge','buyscript_pledge','Maintain Elder Pledge ON','Maintain Elder Pledge OFF','CookieAuto.togglePledge();')+'<label>(Maintain the elder pledge upgrade)</label><br>'+
                           Game.WriteButton('buyscript_dragonup','buyscript_dragonup','Dragon upgrades ON','Dragon upgrades OFF','CookieAuto.toggleDragon();')+'<label>(Enable/disable automatic dragon upgrades)</label><br>'+
                           Game.WriteButton('buyscript_santaup','buyscript_santaup','Santa upgrades ON','Santa upgrades OFF','CookieAuto.toggleSanta();')+'<label>(Enable/disable automatic santa upgrades)</label><br>'+
                           '</div>'+
                           '</div>'+

                           '<div class="subsection">'+
                           '<div class="title">Buying Next</div>'+
                           '<div class="listing">'+
                           '</div>'+
                           '<div id="buyingNext" class="framed" style="width: 70%; margin: 0 auto; padding-bottom: 8px;">'+
                           '<div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;background-position:-1200px -336px;"></div>'+
                           '<div class="price plain" style="float:right;">&infin;</div>'+
                           '<div class="name">Rainbow cookie</div>'+
                           '<small>[Absolutely nothing]</small>'+
                           '<div class="price" style="float:right;color:gold;line-height:18px;vertical-align:middle;">&infin; &times; &infin;</div>'+
                           '<div class="meterContainer smallFramed" style="margin-top: 10px;"><div class="meter filling" style="right:0;transition:right 0.5s;"></div></div>'+
                           '</div>'+
                           '</div>'+

                           '<div class="subsection">'+
                           '<div class="title">Log</div>'+
                           '<div class="listing">'+
                           '<div class="framed" id="calog" style="width:70%;height:200px;overflow:auto;margin:0 auto;"></div>'+
                           '</div>'+
                           '</div>'+

                           '<div class="subsection">'+
                           '<div class="title">Shopping List</div>'+
                           '<div class="listing" style="overflow:auto;">'+
                           // TODO: Insert search bar and filters here
                           CookieAuto.generateIconTableData()+
                           '</div>'+
                           '</div>'+
                           '</div>'

                    this.menuelem.innerHTML = str;
                }
            }
        }

        let menuBG = document.createElement('div');
        menuBG.style.position = "absolute";
        menuBG.style.left = "calc(30vw - 57px)";
        menuBG.style.bottom = "51px";
        menuBG.style.zIndex = "10001";
        menuBG.style.width = "48px";
        menuBG.style.height = "48px";
        menuBG.style.background = "#000 url(img/darkNoise.jpg)";

        let menuButton = document.createElement('div');
        menuButton.className = "icon";
        menuButton.style.backgroundPosition = "-1536px 0px";
        menuButton.style.position = "absolute";
        menuButton.style.left = "calc(30vw - 64px)";
        menuButton.style.bottom = "48px";
        menuButton.style.zIndex = "10002";
        menuButton.style.border = "3px solid #fff";
        menuButton.style.borderColor = "#ece2b6 #875526 #733726 #dfbc9a";
        menuButton.style.cursor = "pointer";
        menuButton.onclick = () => CookieAuto.ui.showMenu();

        // HACK: Overwriting the Game.UpdateMenu function probably shouldn't be something that is done, but this is the only fix I could find

        let countdown = null;
        countdown = setInterval(function() {
            if(Game.externalDataLoaded) {
                console.debug("starting cookieauto");
                document.body.appendChild(menuBG);
                document.body.appendChild(menuButton);
                Game.attachTooltip(menuButton,'<div style="padding:8px;width:250px;text-align:center;">CookieAuto Interface<br><small>ᵇʸ Lance Gjerstad, Adrian Gjerstad</small></div>','this');
                CookieAuto.init();

                Game.crateTooltip=function(me,context) {
                    var tags=[];
                    let mysterious=0;
                    var neuromancy=0;
                    var price='';
                    if (context=='stats' && (Game.Has('Neuromancy') || (Game.sesame && me.pool=='debug'))) neuromancy=1;

                    if (me.type=='upgrade')
                    {
                        if (me.pool=='prestige') tags.push('Heavenly','#efa438');
                        else if (me.pool=='tech') tags.push('Tech','#36a4ff');
                        else if (me.pool=='cookie') tags.push('Cookie',0);
                        else if (me.pool=='debug') tags.push('Debug','#00c462');
                        else if (me.pool=='toggle') tags.push('Switch',0);
                        else tags.push('Upgrade',0);

                        if (me.tier!=0 && Game.Has('Label printer')) tags.push('Tier : '+Game.Tiers[me.tier].name,Game.Tiers[me.tier].color);
                        if (me.name=='Label printer' && Game.Has('Label printer')) tags.push('Tier : Self-referential','#ff00ea');

                        if (me.isVaulted()) tags.push('Vaulted','#4e7566');

                        if (me.bought>0)
                        {
                            if (me.pool=='tech') tags.push('Researched',0);
                            else if (me.kitten) tags.push('Purrchased',0);
                            else tags.push('Purchased',0);
                        }

                        if (me.lasting && me.unlocked) tags.push('Unlocked forever','#f2ff87');

                        if (neuromancy && me.bought==0) tags.push('Click to learn!','#00c462');
                        else if (neuromancy && me.bought>0) tags.push('Click to unlearn!','#00c462');

                        var canBuy=(context=='store'?me.canBuy():true);
                        var cost=me.getPrice();
                        if (me.priceLumps>0) cost=me.priceLumps;

                        if (me.priceLumps==0 && cost==0) price='';
                        else
                        {
                            price='<div style="float:right;text-align:right;"><span class="price'+
                                (me.priceLumps>0?(' lump'):'')+
                                (me.pool=='prestige'?((me.bought || Game.heavenlyChips>=cost)?' heavenly':' heavenly disabled'):'')+
                                (context=='store'?(canBuy?'':' disabled'):'')+
                                '"'+
                                (context=='shoppingListSelector'?' style="color: white;"':'')+
                                '>'+Beautify(Math.round(cost))+'</span>'+((me.pool!='prestige' && me.priceLumps==0)?Game.costDetails(cost):'')+'</div>';
                        }
                    }
                    else if (me.type=='achievement')
                    {
                        if (me.pool=='shadow') tags.push('Shadow Achievement','#9700cf');
                        else tags.push('Achievement',0);
                        if (me.won>0) tags.push('Unlocked',0);
                        else {tags.push('Locked',0);mysterious=1;}

                        if (neuromancy && me.won==0) tags.push('Click to win!','#00c462');
                        else if (neuromancy && me.won>0) tags.push('Click to lose!','#00c462');
                    }

                    var tagsStr='';
                    for (var i=0;i<tags.length;i+=2)
                    {
                        if (i%2==0) tagsStr+=' <div class="tag" style="color:'+(tags[i+1]==0?'#fff':tags[i+1])+';">['+tags[i]+']</div>';
                    }
                    tagsStr=tagsStr.substring(1);

                    var icon=me.icon;
                    if (mysterious) icon=[0,7];

                    if (me.iconFunction) icon=me.iconFunction();


                    var tip='';
                    if (context=='store')
                    {
                        if (me.pool!='toggle' && me.pool!='tech')
                        {
                            if (Game.Has('Inspired checklist'))
                            {
                                if (me.isVaulted()) tip='Upgrade is vaulted and will not be auto-purchased.<br>Click to purchase. Shift-click to unvault.';
                                else tip='Click to purchase. Shift-click to vault.';
                                if (Game.keys[16]) tip+='<br>(You are holding Shift.)';
                                else tip+='<br>(You are not holding Shift.)';
                            }
                            else tip='Click to purchase.';
                        }
                        else if (me.pool=='toggle' && me.choicesFunction) tip='Click to open selector.';
                        else if (me.pool=='toggle') tip='Click to toggle.';
                        else if (me.pool=='tech') tip='Click to research.';
                    } else if (context=='shoppingListSelector') {
                        tip='Click to toggle in shopping list.'
                    }

                    var desc=me.desc;
                    if (me.descFunc) desc=me.descFunc();
                    if (me.bought && context=='store' && me.displayFuncWhenOwned) desc=me.displayFuncWhenOwned()+'<div class="line"></div>'+desc;
                    if (me.unlockAt)
                    {
                        if (me.unlockAt.require)
                        {
                            var it=Game.Upgrades[me.unlockAt.require];
                            desc='<div style="font-size:80%;text-align:center;">From <div class="icon" style="vertical-align:middle;display:inline-block;'+(it.icon[2]?'background-image:url('+it.icon[2]+');':'')+'background-position:'+(-it.icon[0]*48)+'px '+(-it.icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> '+it.name+'</div><div class="line"></div>'+desc;
                        }
                        /*else if (me.unlockAt.season)
				{
					var it=Game.seasons[me.unlockAt.season];
					desc='<div style="font-size:80%;text-align:center;">From <div class="icon" style="vertical-align:middle;display:inline-block;'+(Game.Upgrades[it.trigger].icon[2]?'background-image:url('+Game.Upgrades[it.trigger].icon[2]+');':'')+'background-position:'+(-Game.Upgrades[it.trigger].icon[0]*48)+'px '+(-Game.Upgrades[it.trigger].icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> '+it.name+'</div><div class="line"></div>'+desc;
				}*/
                        else if (me.unlockAt.text)
                        {
                            var it=Game.Upgrades[me.unlockAt.require];
                            desc='<div style="font-size:80%;text-align:center;">From <b>'+text+'</b></div><div class="line"></div>'+desc;
                        }
                    }

                    return '<div style="padding:8px 4px;min-width:350px;">'+
                        '<div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div>'+
                        (me.bought && context=='store'?'':price)+
                        '<div class="name">'+(mysterious?'???':me.name)+'</div>'+
                        tagsStr+
                        '<div class="line"></div><div class="description">'+(mysterious?'???':desc)+'</div></div>'+
                        (tip!=''?('<div class="line"></div><div style="font-size:10px;font-weight:bold;color:#999;text-align:center;padding-bottom:4px;line-height:100%;">'+tip+'</div>'):'')+
                        (Game.sesame?('<div style="font-size:9px;">Id : '+me.id+' | Order : '+Math.floor(me.order)+(me.tier?' | Tier : '+me.tier:'')+'</div>'):'');
                }

                window.CookieAuto = CookieAuto;

                clearInterval(countdown);
            }
        }, 20);
    }
})();
