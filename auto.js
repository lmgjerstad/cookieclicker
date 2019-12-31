// ==UserScript==
// @name         CookieAuto
// @namespace    http://orteil.dashnet.org/cookieclicker/
// @version      0.1
// @description  A simple to use yet advanced Cookie Clicker automation addon
// @author       Lance Gjerstad, Adrian Gjerstad
// @match        http://orteil.dashnet.org/cookieclicker/
// @grant        none
// ==/UserScript==

var CookieAuto = {};

(function() {
    'use strict';

    function q(cssSelector) {
        return document.querySelectorAll(cssSelector);
    }

    if (typeof window.CookieAuto === "undefined") {
        var CookieAuto = {
            UpgradeVars : {
                adds : {
                    "Thousand fingers" : 0.1,
                    "Million fingers" : 0.5,
                    "Billion fingers" : 5,
                    "Trillion fingers" : 50,
                    "Quadrillion fingers" : 500,
                    "Quintillion fingers" : 5000,
                    "Sextillion fingers" : 50000,
                    "Septillion fingers" : 500000,
                    "Octillion fingers" : 5000000
                },
                kittens : {
                    "Kitten helpers" : 0.1,
                    "Kitten workers" : 0.125,
                    "Kitten engineers" : 0.15,
                    "Kitten overseers" : 0.175,
                    "Kitten managers" : 0.2,
                    "Kitten accountants" : 0.2,
                    "Kitten specialists" : 0.2,
                    "Kitten experts" : 0.2
                },
                grandmas : {
                    'Farmer grandmas' : 2,
                    'Worker grandmas' : 2,
                    'Miner grandmas' : 2,
                    'Cosmic grandmas' : 2,
                    'Transmuted grandmas' : 2,
                    'Altered grandmas' : 2,
                    'Grandmas\' grandmas' : 2,
                    'Antigrandmas' : 2,
                    'Rainbow grandmas' : 2,
                    'Banker grandmas' : 2,
                    'Priestess grandmas' : 2,
                    'Witch grandmas' : 2
                },
                mouse : {
                    'Plastic mouse' : 0.2,
                    'Iron mouse' : 0.2,
                    'Titanium mouse' : 0.2,
                    'Adamantium mouse' : 0.2,
                    'Unobtainium mouse' : 0.2,
                    'Eludium mouse' : 0.2,
                    'Wishalloy mouse' : 0.2,
                    'Fantasteel mouse' : 0.2,
                    'Nevercrack mouse' : 0.2
                },
                prestige : {
                    'Heavenly chip secret' : 0.05,
                    'Heavenly cookie stand' : 0.20,
                    'Heavenly bakery' : 0.25,
                    'Heavenly confectionery' : 0.25,
                    'Heavenly key' : 0.25
                },
                other : {
                    "Bingo center/Research facility" : function () {
                        return Game.Objects.Grandma.storedTotalCps * Game.globalCpsMult * 3
                    },
                    "A crumbly egg" : function () {
                        return Infinity;
                    }
                }
            },
            roi : function(o) {
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
                    } else if (o.name == "Reinforced index finger" || o.name == "Carpal tunnel prevention cream" || o.name == "Ambidextrous" ) {
                        // Cursor upgrades that are otherwise indeterminate
                        cps = Game.Objects.Cursor.storedTotalCps * Game.globalCpsMult;
                    } else if (this.UpgradeVars.adds.hasOwnProperty(o.name)) {
                        // cursors gain x for each non-cursor building owned
                        let cursors = Game.Objects.Cursor.amount;
                        let otherBuildings = Game.BuildingsOwned - cursors;
                        cps = cursors * otherBuildings * this.UpgradeVars.adds[o.name] * Game.globalCpsMult;
                    } else if (this.UpgradeVars.kittens.hasOwnProperty(o.name)) {
                        // Kittens cps is based on how much milk there is.
                        let mult = 1;
                        if (Game.Has("Santa's milk and cookies")) mult *= 1.05;
                        if (Game.hasAura("Breath of milk")) mult *= 1.05;
                        cps = Game.milkProgress * this.UpgradeVars.kittens[o.name] * mult * Game.cookiesPs;
                    } else if (this.UpgradeVars.grandmas.hasOwnProperty(o.name)) {
                        // Grandmas twice as efficient, building gains 1% per grandma
                        // TODO: Account for 1% per grandma
                        cps = Game.Objects.Grandma.storedTotalCps * Game.globalCpsMult;
                    } else if (this.UpgradeVars.mouse.hasOwnProperty(o.name)) {
                        // clicking gains 1% of cps
                        // TODO: Account for whether autoclicking is on or not
                        cps = Game.cookiesPs * 0.2;
                    } else if (this.UpgradeVars.prestige.hasOwnProperty(o.name)) {
                        // Unlock prestige potential
                        cps = Game.prestige * 0.01 * Game.heavenlyPower * this.UpgradeVars.prestige[o.name] * Game.cookiesPs;
                    } else if (this.UpgradeVars.other.hasOwnProperty(o.name)) {
                        // Other stuff, determine by function
                        cps = this.UpgradeVars.other[o.name]();
                    }
                } else if (o.constructor === Game.Object) {
                    // It's a building
                    cps = o.storedCps * Game.globalCpsMult;
                }
                if (cps !== undefined) {
                    return o.getPrice() / cps;
                }
                return undefined;
            },
            ttl : function (goal) {
                let cookiesNeeded;
                if (typeof(goal) == "object") {
                    cookiesNeeded = this.target(goal);
                } else {
                    cookiesNeeded = goal;
                }
                let cookiesRemaining = cookiesNeeded - Game.cookies;
                if (cookiesRemaining < 0) return 0;
                return cookiesRemaining / Game.cookiesPs;
            },
            shoppingList : [],
            validShoppingListItem : function (o) {
                if (o.constructor == Game.Object) {
                    return true;
                }
                if (o.constructor == Game.Upgrade) {
                    return !o.bought;
                }
            },
            pruneShoppingList : function () {
                this.shoppingList = this.shoppingList.filter(this.validShoppingListItem);
            },
            nextOnShoppingList : function () {
                this.pruneShoppingList();
                let buffer = [];
                for (let o of this.shoppingList) {
                    if (o.constructor == Game.Upgrade) {
                        // Is upgrade 60 seconds or less out
                        if (Game.cookies + (Game.cookiesPs*60) >= o.getPrice()) {
                            buffer.push(o);
                        }
                    } else if (!o.locked) {
                        if (Game.cookies + (Game.cookiesPs*60) >= o.getPrice()) {
                            buffer.push(o);
                        }
                    }
                }

                if (buffer.length == 0) return;

                buffer.sort(function(a,b){return a.getPrice()-b.getPrice();});
                return buffer[0];
            },
            bestBuy : function () {
                let o, min_roi, me, my_roi;
                if (this.control.buyBuildings) {
                    for (let me of Object.values(Game.Objects)) {
                        my_roi = this.roi(me);
                        if (my_roi == undefined) continue;
                        if (this.control.considerTTL) {
                            my_roi += this.ttl(me);
                        }
                        if (o === undefined || my_roi < min_roi) {
                            o = me;
                            min_roi = my_roi;
                        }
                    }
                }
                if (this.control.buyUpgrades) {
                    for (let me of Game.UpgradesInStore) {
                        if (me.bought) continue;
                        my_roi = this.roi(me);
                        if (my_roi == undefined) continue;
                        if (this.control.considerTTL) {
                            my_roi += this.ttl(me);
                        }
                        if (o === undefined || my_roi < min_roi) {
                            o = me;
                            min_roi = my_roi;
                        }
                    }
                }

                return o;
            },
            buyBest : function () {
                let done = false;
                let itemsPurchased = false;
                while (!done) {
                    this.maybeUpgradeDragon();
                    this.maybeUpgradeSanta();
                    let o = this.nextOnShoppingList();
                    let onShoppingList = o !== undefined;
                    if (o === undefined) {
                        o = this.bestBuy();
                    }
                    if (o === undefined) {
                        return;
                    }
                    let price = o.getPrice();
                    // Re-written as Game.cookies > this.getMultiplier()*Game.cookiesPs + price
                    if (((Game.cookies - price) / Game.cookiesPs) > this.getMultiplier()) {
                        console.log('buying ' + o.name);
                        if (o.constructor == Game.Object) {
                            o.buy(1);
                        } else {
                            o.buy();
                        }
                        itemsPurchased = true;
                        if (onShoppingList) {
                            for (let i = 0; i < this.shoppingList.length; ++i) {
                                if (o === this.shoppingList[i]) {
                                    this.shoppingList.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    } else {
                        if (itemsPurchased) {
                            console.log('next ' + o.name + ' => ' + this.format(this.target(o)));
                        }
                        done = true;
                    }
                }

                Game.UpdateMenu();
            },
            popShimmers : function () {
                for (let shimmer of Game.shimmers.reverse()) {
                    if (shimmer.wrath) {
                        if (this.control.popWrathCookies) shimmer.pop();
                    } else if (shimmer.type == "golden") {
                        if (this.control.popGoldenCookies) shimmer.pop();
                    } else {
                        if (this.control.popReindeer) shimmer.pop();
                    }
                }
                if (this.control.popWrinklers) {
                    for (let wrinkler of Game.wrinklers) {
                        if (wrinkler.close == 1) {
                            if (this.control.wrinklerThreshold <= wrinkler.sucked) {
                                wrinkler.hp = 0;
                            }
                        }
                    }
                }
            },
            maybeUpgradeDragon : function () {
                if (this.control.upgradeDragon && Game.Has("A crumbly egg")) {
                    Game.UpgradeDragon();
                }
            },
            maybeUpgradeSanta : function () {
                if (this.control.upgradeSanta && Game.Has("A festive hat")) {
                    Game.UpgradeSanta();
                }
            },
            pledge : function () {
                if (!this.control.maintainPledge) return;
                let p = Game.Upgrades["Elder Pledge"];
                if (p.unlocked && !p.bought) {
                    p.buy();
                }
            },
            getMultiplier : function () {
                if (!this.control.reserve) return 0;
                let mult = 1;
                let date = new Date();
                date.setTime(Date.now() - Game.startDate);
                if (date.getTime() < 2 * 60 * 60 * 1000) {
                    mult = 0;
                }
                if (Game.Upgrades["Get lucky"].bought) {
                    mult *= 7;
                }

                var i, name;

                for (let name of Game.goldenCookieChoices) {
                    if (Game.hasBuff(name)) {
                        mult /= Game.buffs[name].multCpS;
                    }
                }

                for (let buffs of Object.values(Game.goldenCookieBuildingBuffs)) {
                    for (let name of buffs) {
                        if (Game.hasBuff(name)) {
                            mult /= Game.buffs[name].multCpS;
                        }
                    }
                }

                let wrinklerCount = 0;
                for (let wrinkler of Game.wrinklers) {
                    if (wrinkler.close) {
                        ++wrinklerCount;
                    }
                }
                mult /= (1 - (wrinklerCount / 20));

                return mult;
            },
            toggleBuilding : function() {
                this.control.buyBuildings = !this.control.buyBuildings;
                localStorage.setItem("buyscript_buyBuildings", this.control.buyBuildings);
            },
            toggleUpgrade : function() {
                this.control.buyUpgrades = !this.control.buyUpgrades;
                localStorage.setItem("buyscript_buyUpgrades", this.control.buyUpgrades);
            },
            toggleAutoclicker : function() {
                this.control.autoclick = !this.control.autoclick;
                localStorage.setItem("buyscript_autoclick", this.control.autoclick);
            },
            toggleDragon : function() {
                this.control.upgradeDragon = !this.control.upgradeDragon;
                localStorage.setItem("buyscript_upgradeDragon", this.control.upgradeDragon);
            },
            toggleSanta : function() {
                this.control.upgradeSanta = !this.control.upgradeSanta;
                localStorage.setItem("buyscript_upgradeSanta", this.control.upgradeSanta);
            },
            control : {
                considerTTL : (localStorage.getItem("buyscript_considerTTL")||"true")=="true",
                buyBuildings : (localStorage.getItem("buyscript_buyBuildings")||"true")=="true",
                buyUpgrades : (localStorage.getItem("buyscript_buyUpgrades")||"true")=="true",
                popGoldenCookies : (localStorage.getItem("buyscript_popGoldenCookies")||"true")=="true",
                popWrathCookies : (localStorage.getItem("buyscript_popWrathCookies")||"true")=="true",
                popReindeer : (localStorage.getItem("buyscript_popReindeer")||"true")=="true",
                popWrinklers : (localStorage.getItem("buyscript_popWrinklers")||"true")=="true",
                wrinklerThreshold : parseInt(localStorage.getItem("buyscript_wrinklerThreshold")||"0"),
                maintainPledge : (localStorage.getItem("buyscript_maintainPledge")||"true")=="true",
                reserve : (localStorage.getItem("buyscript_reserve")||"true")=="true",
                autoclick : (localStorage.getItem("buyscript_autoclick")||"false")=="true",
                upgradeDragon : (localStorage.getItem("buyscript_upgradeDragon")||"false")=="true",
                upgradeSanta : (localStorage.getItem("buyscript_upgradeSanta")||"false")=="true",
                autoReset : (localStorage.getItem("buyscript_autoReset")||"false")=="true"
            },
            target : function (o) {
                let goal = o;
                if (goal === undefined) goal = this.bestBuy();
                return Game.cookiesPs * this.getMultiplier() + goal.getPrice();
            },
            format : function(num) {
                return numberFormatters[1](num);
            },
            loop : function () {
                if (CookieAuto.control.autoReset && CookieAuto.control.autoReset > Game.resets) {
                    if (Game.OnAscend) {
                        Game.Reincarnate(true);
                        CookieAuto.initShoppingList();
                    } else if (Game.AscendTimer > 0) {
                    } else {
                        let prestige = Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned));
                        if (prestige > Game.prestige) {
                            Game.Ascend(true);
                        }
                    }
                }

                CookieAuto.buyBest();
                CookieAuto.popShimmers();
                CookieAuto.pledge();
                CookieAuto.update();
            },
            init : function () {
                this.refreshU();

                if (localStorage.getItem('buyscript_shoppingList') === null) {
                    this.initShoppingList();
                } else this.loadShoppingList();

                this.shoppingListSortMode = this.sorting.price;

                this.buyBest();
                this.interval = setInterval(this.loop, 500);
                this.update();
            },
            refreshU : function () {
                this.u = [...Game.UpgradesByPool[""]];
                function addToU(v) {
                    CookieAuto.u.push(v);
                }
                Game.UpgradesByPool["tech"].forEach(addToU);
                this.u.sort(function(a,b){return a.id-b.id});
            },
            addToShoppingList : function (obj) {
                CookieAuto.shoppingList.push(obj);
            },
            addToShoppingListByName : function (name) {
                CookieAuto.shoppingList.push(Game.Upgrades[name]);
            },
            noChocolateEgg (name) {
                return name != "Chocolate egg";
            },
            initShoppingList : function () {
                this.shoppingList = [];
                Game.UpgradesByPool["tech"].forEach(this.addToShoppingList);
                Game.santaDrops.forEach(this.addToShoppingListByName);
                Game.easterEggs.filter(this.noChocolateEgg).forEach(this.addToShoppingListByName);
                [
                    "A festive hat",
                    "Lucky day",
                    "Serendipity",
                    "Get lucky",
                    "Sacrificial rolling pins",
                    "Santa's dominion",
                    "A crumbly egg"
                ].forEach(this.addToShoppingListByName);
                this.saveShoppingList();
            },
            update : function () {
                if (this.control.autoclick && !this.autoclicker) {
                    this.autoclicker = setInterval(Game.ClickCookie, 20);
                }
                if (!this.control.autoclick && this.autoclicker) {
                    clearInterval(this.autoclicker);
                    this.autoclicker = 0;
                }
            },
            toggleInShoppingList : function(me) {
                let found = false;
                for (let o in this.shoppingList) {
                    if (this.shoppingList[o] === me) {
                        this.shoppingList.splice(o, 1);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    this.shoppingList.push(me);
                }

                Game.UpdateMenu();
            },
            inShoppingList : function(me) {
                for (let o in this.shoppingList) {
                    if (this.shoppingList[o].name == me.name) {
                        return true;
                    }
                }
                return false;
            },
            saveShoppingList : function() {
                let res = '';
                this.refreshU();
                for (let o of this.u) {
                    if (this.inShoppingList(o)) res += '1'
                    else res += '0'
                }
                res = utf8_to_b64(res);
                localStorage.setItem('buyscript_shoppingList', res);
                Game.Notify('CookieAuto shopping list saved', '', [21, 7], 1, 1);
            },
            loadShoppingList : function() {
                let bf = b64_to_utf8(localStorage.getItem('buyscript_shoppingList'));
                this.shoppingList = [];
                this.refreshU();
                for (let bit in bf) {
                    if (bf[bit] == '1') {
                        this.shoppingList.push(this.u[bit]);
                    }
                }
            },
            u : null,
            sorting : {
                a2z : [function (a,b) {
                    let a_=String(a.name),b_=String(b.name);
                    while (a_[0] == b_[0] && a_ !== undefined && b_ !== undefined) {
                        a_ = a_.substr(1);
                        b_ = b_.substr(1);
                    }

                    if (a_ === "" || a_ === undefined) {
                        if (b_ === "" || b_ === undefined) {
                            // The strings are the same
                            return 0;
                        }
                        // a is shorter than b
                        return -1;
                    }
                    if (b_ === "" || b_ === undefined) {
                        // b is shorter than a
                        return 1
                    }

                    return a_.charCodeAt(0)-b_.charCodeAt(0);
                }, "A to Z"],
                z2a : [function (a,b) {
                    let a_=String(a.name),b_=String(b.name);
                    while (a_[0] == b_[0] && a_ !== undefined && b_ !== undefined) {
                        a_ = a_.substr(1);
                        b_ = b_.substr(1);
                    }

                    if (a_ === "" || a_ === undefined) {
                        if (b_ === "" || b_ === undefined) {
                            // The strings are the same
                            return 0;
                        }
                        // a is shorter than b
                        return 1;
                    }
                    if (b_ === "" || b_ === undefined) {
                        // b is shorter than a
                        return -1
                    }

                    return b_.charCodeAt(0)-a_.charCodeAt(0);
                }, "Z to A"],
                price : [function (a,b) {
                    return a.getPrice()-b.getPrice();
                }, "Price"],
                revPrice : [function (a,b) {
                    return b.getPrice()-a.getPrice();
                }, "Reverse Price"],
                __algos__ : ["a2z", "z2a", "price", "revPrice"]
            },
            shoppingListSortMode : null,
            generateIconTableData : function() {
                this.refreshU();
                let u = this.u.copyWithin();
                u.sort(this.shoppingListSortMode[0]);
                let res = '';
                for (let o of u) {
                    if (o.bought) continue;
                    let x = o.icon[0]*-48;
                    let y = o.icon[1]*-48;
                    res += '<div class="icon" onclick="CookieAuto.toggleInShoppingList(Game.UpgradesById['+o.id+']);CookieAuto.saveShoppingList();" onmouseout="Game.setOnCrate(0);Game.tooltip.shouldHide=1;" onmouseover="if (!Game.mouseDown) {Game.setOnCrate(this);Game.tooltip.dynamic=1;Game.tooltip.draw(this,function(){return function(){return Game.crateTooltip(Game.UpgradesById['+o.id+'],\'shoppingListSelector\');}();},\'\');Game.tooltip.wobble();}" style="padding:0; cursor:pointer; background-position:'+x+'px '+y+'px; float:left; opacity:'+(this.inShoppingList(o)?'1':'0.2')+';"></div>';
                }
                return res;
            }
        }

        // HACK: Overwriting the Game.UpdateMenu function probably shouldn't be something that is done, but this is the only fix I could find

        let countdown = null;
        countdown = setInterval(function() {
            if(Game.externalDataLoaded) {
                console.debug("starting cookieauto");
                CookieAuto.init.call(CookieAuto);
                setInterval(function(){CookieAuto.saveShoppingList.call(CookieAuto)}, 60000);

                Game.prefs.buyscript_abbuild = CookieAuto.control.buyBuildings?1:0;
                Game.prefs.buyscript_abup = CookieAuto.control.buyUpgrades?1:0;
                Game.prefs.buyscript_abac = CookieAuto.control.autoclick?1:0;

                Game.prefs.buyscript_santaup = CookieAuto.control.upgradeSanta?1:0;
                Game.prefs.buyscript_dragonup = CookieAuto.control.upgradeDragon?1:0;

                Game.UpdateMenu=function() {
                    var str='';
                    if (Game.onMenu!='')
                    {
                        str+='<div class="close menuClose" '+Game.clickStr+'="Game.ShowMenu();">x</div>';
                        //str+='<div style="position:absolute;top:8px;right:8px;cursor:pointer;font-size:16px;" '+Game.clickStr+'="Game.ShowMenu();">X</div>';
                    }
                    if (Game.onMenu=='prefs')
                    {
                        str+='<div class="section">Options</div>'+
                            '<div class="subsection">'+
                            '<div class="title">General</div>'+
                            '<div class="listing"><a class="option" '+Game.clickStr+'="Game.toSave=true;PlaySound(\'snd/tick.mp3\');CookieAuto.saveShoppingList();">Save</a><label>Save manually (the game autosaves every 60 seconds; shortcut : ctrl+S)</label></div>'+
                            '<div class="listing"><a class="option" '+Game.clickStr+'="Game.ExportSave();PlaySound(\'snd/tick.mp3\');">Export save</a><a class="option" '+Game.clickStr+'="Game.ImportSave();PlaySound(\'snd/tick.mp3\');">Import save</a><label>You can use this to backup your save or to transfer it to another computer (shortcut for import : ctrl+O)</label></div>'+
                            '<div class="listing"><a class="option" '+Game.clickStr+'="Game.FileSave();PlaySound(\'snd/tick.mp3\');">Save to file</a><a class="option" style="position:relative;"><input id="FileLoadInput" type="file" style="cursor:pointer;opacity:0;position:absolute;left:0px;top:0px;width:100%;height:100%;" onchange="Game.FileLoad(event);" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');"/>Load from file</a><label>Use this to keep backups on your computer</label></div>'+

                            '<div class="listing"><a class="option warning" '+Game.clickStr+'="Game.HardReset();PlaySound(\'snd/tick.mp3\');">Wipe save</a><label>Delete all your progress, including your achievements</label></div>'+
                            '<div class="title">Settings</div>'+
                            '<div class="listing">'+
                            Game.WriteSlider('volumeSlider','Volume','[$]%',function(){return Game.volume;},'Game.setVolume(Math.round(l(\'volumeSlider\').value));l(\'volumeSliderRightText\').innerHTML=Game.volume+\'%\';')+'<br>'+
                            Game.WriteButton('fancy','fancyButton','Fancy graphics ON','Fancy graphics OFF','Game.ToggleFancy();')+'<label>(visual improvements; disabling may improve performance)</label><br>'+
                            Game.WriteButton('filters','filtersButton','CSS filters ON','CSS filters OFF','Game.ToggleFilters();')+'<label>(cutting-edge visual improvements; disabling may improve performance)</label><br>'+
                            Game.WriteButton('particles','particlesButton','Particles ON','Particles OFF')+'<label>(cookies falling down, etc; disabling may improve performance)</label><br>'+
                            Game.WriteButton('numbers','numbersButton','Numbers ON','Numbers OFF')+'<label>(numbers that pop up when clicking the cookie)</label><br>'+
                            Game.WriteButton('milk','milkButton','Milk ON','Milk OFF')+'<label>(only appears with enough achievements)</label><br>'+
                            Game.WriteButton('cursors','cursorsButton','Cursors ON','Cursors OFF')+'<label>(visual display of your cursors)</label><br>'+
                            Game.WriteButton('wobbly','wobblyButton','Wobbly cookie ON','Wobbly cookie OFF')+'<label>(your cookie will react when you click it)</label><br>'+
                            Game.WriteButton('cookiesound','cookiesoundButton','Alt cookie sound ON','Alt cookie sound OFF')+'<label>(how your cookie sounds when you click on it)</label><br>'+
                            Game.WriteButton('crates','cratesButton','Icon crates ON','Icon crates OFF')+'<label>(display boxes around upgrades and achievements in stats)</label><br>'+
                            Game.WriteButton('monospace','monospaceButton','Alt font ON','Alt font OFF')+'<label>(your cookies are displayed using a monospace font)</label><br>'+
                            Game.WriteButton('format','formatButton','Short numbers OFF','Short numbers ON','BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;',1)+'<label>(shorten big numbers)</label><br>'+
                            Game.WriteButton('notifs','notifsButton','Fast notes ON','Fast notes OFF')+'<label>(notifications disappear much faster)</label><br>'+
                            //Game.WriteButton('autoupdate','autoupdateButton','Offline mode OFF','Offline mode ON',0,1)+'<label>(disables update notifications)</label><br>'+
                            Game.WriteButton('warn','warnButton','Closing warning ON','Closing warning OFF')+'<label>(the game will ask you to confirm when you close the window)</label><br>'+
                            Game.WriteButton('focus','focusButton','Defocus OFF','Defocus ON',0,1)+'<label>(the game will be less resource-intensive when out of focus)</label><br>'+
                            Game.WriteButton('extraButtons','extraButtonsButton','Extra buttons ON','Extra buttons OFF','Game.ToggleExtraButtons();')+'<label>(add Mute buttons on buildings)</label><br>'+
                            Game.WriteButton('askLumps','askLumpsButton','Lump confirmation ON','Lump confirmation OFF')+'<label>(the game will ask you to confirm before spending sugar lumps)</label><br>'+
                            Game.WriteButton('customGrandmas','customGrandmasButton','Custom grandmas ON','Custom grandmas OFF')+'<label>(some grandmas will be named after Patreon supporters)</label><br>'+
                            Game.WriteButton('timeout','timeoutButton','Sleep mode timeout ON','Sleep mode timeout OFF')+'<label>(on slower computers, the game will put itself in sleep mode when it\'s inactive and starts to lag out; offline CpS production kicks in during sleep mode)</label><br>'+
                            '</div>'+
                            '<div class="title">CookieAuto</div>'+
                            '<div class="listing">'+
                            Game.WriteButton('buyscript_abbuild','buyscript_abbuild','Building autobuyers ON','Building autobuyers OFF','CookieAuto.toggleBuilding();')+'<label>(Enable/disable the building autobuyers)</label><br>'+
                            Game.WriteButton('buyscript_abup','buyscript_abup','Upgrade autobuyers ON','Upgrade autobuyers OFF','CookieAuto.toggleUpgrade();')+'<label>(Enable/disable the upgrade autobuyers)</label><br>'+
                            Game.WriteButton('buyscript_abac','buyscript_abac','Autoclicker ON','Autoclicker OFF','CookieAuto.toggleAutoclicker();')+'<label>(Enable/disable the autoclicker)</label><br>'+
                            (Game.Has('A crumbly egg')?Game.WriteButton('buyscript_dragonup','buyscript_dragonup','Dragon upgrades ON','Dragon upgrades OFF','CookieAuto.toggleDragon();')+'<label>(Enable/disable automatic dragon upgrades)</label><br>':'')+
                            (Game.Has('A festive hat')?Game.WriteButton('buyscript_santaup','buyscript_santaup','Santa upgrades ON','Santa upgrades OFF','CookieAuto.toggleSanta();')+'<label>(Enable/disable automatic santa upgrades)</label><br>':'')+
                            CookieAuto.generateIconTableData()+
                            '</div>'+
                            //'<div class="listing">'+Game.WriteButton('autosave','autosaveButton','Autosave ON','Autosave OFF')+'</div>'+
                            '<div style="padding-bottom:128px;"></div>'+
                            '</div>'
                        ;
                    }
                    else if (Game.onMenu=='main')
                    {
                        str+=
                            '<div class="listing">This isn\'t really finished</div>'+
                            '<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'prefs\');">Menu</a></div>'+
                            '<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'stats\');">Stats</a></div>'+
                            '<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'log\');">Updates</a></div>'+
                            '<div class="listing"><a class="option big title" '+Game.clickStr+'="">Quit</a></div>'+
                            '<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(Game.onMenu);">Resume</a></div>';
                    }
                    else if (Game.onMenu=='log')
                    {
                        str+=replaceAll('[bakeryName]',Game.bakeryName,Game.updateLog);
                    }
                    else if (Game.onMenu=='stats')
                    {
                        var buildingsOwned=0;
                        buildingsOwned=Game.BuildingsOwned;
                        var upgrades='';
                        var cookieUpgrades='';
                        var hiddenUpgrades='';
                        var prestigeUpgrades='';
                        var upgradesTotal=0;
                        var upgradesOwned=0;
                        var prestigeUpgradesTotal=0;
                        var prestigeUpgradesOwned=0;

                        var list=[];
                        for (var i in Game.Upgrades)//sort the upgrades
                        {
                            list.push(Game.Upgrades[i]);
                        }
                        var sortMap=function(a,b)
                        {
                            if (a.order>b.order) return 1;
                            else if (a.order<b.order) return -1;
                            else return 0;
                        }
                        list.sort(sortMap);
                        for (var i in list)
                        {
                            var str2='';
                            var me=list[i];

                            str2+=Game.crate(me,'stats');

                            if (me.bought)
                            {
                                if (Game.CountsAsUpgradeOwned(me.pool)) upgradesOwned++;
                                else if (me.pool=='prestige') prestigeUpgradesOwned++;
                            }

                            if (me.pool=='' || me.pool=='cookie' || me.pool=='tech') upgradesTotal++;
                            if (me.pool=='debug') hiddenUpgrades+=str2;
                            else if (me.pool=='prestige') {prestigeUpgrades+=str2;prestigeUpgradesTotal++;}
                            else if (me.pool=='cookie') cookieUpgrades+=str2;
                            else if (me.pool!='toggle' && me.pool!='unused') upgrades+=str2;
                        }
                        var achievements=[];
                        var achievementsOwned=0;
                        var achievementsOwnedOther=0;
                        var achievementsTotal=0;

                        var list=[];
                        for (var i in Game.Achievements)//sort the achievements
                        {
                            list.push(Game.Achievements[i]);
                        }
                        var sortMap=function(a,b)
                        {
                            if (a.order>b.order) return 1;
                            else if (a.order<b.order) return -1;
                            else return 0;
                        }
                        list.sort(sortMap);


                        for (var i in list)
                        {
                            var me=list[i];
                            //if (me.pool=='normal' || me.won>0) achievementsTotal++;
                            if (Game.CountsAsAchievementOwned(me.pool)) achievementsTotal++;
                            var pool=me.pool;
                            if (!achievements[pool]) achievements[pool]='';
                            achievements[pool]+=Game.crate(me,'stats');

                            if (me.won)
                            {
                                if (Game.CountsAsAchievementOwned(me.pool)) achievementsOwned++;
                                else achievementsOwnedOther++;
                            }
                        }

                        var achievementsStr='';
                        var pools={
                            'dungeon':'<b>Dungeon achievements</b> <small>(Not technically achievable yet.)</small>',
                            'shadow':'<b>Shadow achievements</b> <small>(These are feats that are either unfair or difficult to attain. They do not give milk.)</small>'
                        };
                        for (var i in achievements)
                        {
                            if (achievements[i]!='')
                            {
                                if (pools[i]) achievementsStr+='<div class="listing">'+pools[i]+'</div>';
                                achievementsStr+='<div class="listing crateBox">'+achievements[i]+'</div>';
                            }
                        }

                        var milkStr='';
                        for (var i=0;i<Game.Milks.length;i++)
                        {
                            if (Game.milkProgress>=i)
                            {
                                var milk=Game.Milks[i];
                                milkStr+='<div '+Game.getTooltip(
                                    '<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px;padding-bottom:96px;"><h3 style="margin:6px 32px 0px 32px;">'+milk.name+'</h3><div style="opacity:0.75;font-size:9px;">('+(i==0?'starter milk':('for '+Beautify(i*25)+' achievements'))+')</div><div class="line"></div><div style="width:100%;height:96px;position:absolute;left:0px;bottom:0px;background:url(img/'+milk.pic+'.png);"></div></div>'
                                    ,'top')+' style="background:url(img/icons.png) '+(-milk.icon[0]*48)+'px '+(-milk.icon[1]*48)+'px;margin:2px 0px;" class="trophy"></div>';
                            }
                        }
                        milkStr+='<div style="clear:both;"></div>';

                        var santaStr='';
                        var frames=15;
                        if (Game.Has('A festive hat'))
                        {
                            for (var i=0;i<=Game.santaLevel;i++)
                            {
                                santaStr+='<div '+Game.getTooltip(
                                    '<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;"><div style="width:96px;height:96px;margin:4px auto;background:url(img/santa.png) '+(-i*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div><div class="line"></div><h3>'+Game.santaLevels[i]+'</h3></div>'
                                    ,'top')+' style="background:url(img/santa.png) '+(-i*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
                            }
                            santaStr+='<div style="clear:both;"></div>';
                        }
                        var dragonStr='';
                        var frames=9;
                        var mainLevels=[0,4,8,22,23,24];
                        if (Game.Has('A crumbly egg'))
                        {
                            for (var i=0;i<=mainLevels.length;i++)
                            {
                                if (Game.dragonLevel>=mainLevels[i])
                                {
                                    var level=Game.dragonLevels[mainLevels[i]];
                                    dragonStr+='<div '+Game.getTooltip(
                                        //'<div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*96)+'px 0px;"></div><div class="line"></div><div style="min-width:200px;text-align:center;margin-bottom:6px;">'+level.name+'</div>'
                                        '<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;"><div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div><div class="line"></div><h3>'+level.name+'</h3></div>'
                                        ,'top')+' style="background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
                                }
                            }
                            dragonStr+='<div style="clear:both;"></div>';
                        }
                        var ascensionModeStr='';
                        var icon=Game.ascensionModes[Game.ascensionMode].icon;
                        if (Game.resets>0) ascensionModeStr='<span style="cursor:pointer;" '+Game.getTooltip(
                            '<div style="min-width:200px;text-align:center;font-size:11px;">'+Game.ascensionModes[Game.ascensionMode].desc+'</div>'
                            ,'top')+'><div class="icon" style="display:inline-block;float:none;transform:scale(0.5);margin:-24px -16px -19px -8px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div>'+Game.ascensionModes[Game.ascensionMode].name+'</span>';

                        var milkName=Game.Milk.name;

                        var researchStr=Game.sayTime(Game.researchT,-1);
                        var pledgeStr=Game.sayTime(Game.pledgeT,-1);
                        var wrathStr='';
                        if (Game.elderWrath==1) wrathStr='awoken';
                        else if (Game.elderWrath==2) wrathStr='displeased';
                        else if (Game.elderWrath==3) wrathStr='angered';
                        else if (Game.elderWrath==0 && Game.pledges>0) wrathStr='appeased';

                        var date=new Date();
                        date.setTime(Date.now()-Game.startDate);
                        var timeInSeconds=date.getTime()/1000;
                        var startDate=Game.sayTime(timeInSeconds*Game.fps,-1);
                        date.setTime(Date.now()-Game.fullDate);
                        var fullDate=Game.sayTime(date.getTime()/1000*Game.fps,-1);
                        if (!Game.fullDate || !fullDate || fullDate.length<1) fullDate='a long while';
                        /*date.setTime(new Date().getTime()-Game.lastDate);
				var lastDate=Game.sayTime(date.getTime()/1000*Game.fps,2);*/

                        var heavenlyMult=Game.GetHeavenlyMultiplier();

                        var seasonStr=Game.sayTime(Game.seasonT,-1);

                        let nextBuy=(CookieAuto.nextOnShoppingList()!==undefined?CookieAuto.nextOnShoppingList():CookieAuto.bestBuy());
                        let nextBuyIcon = (nextBuy instanceof Game.Upgrade?[nextBuy.icon[0]*-48, nextBuy.icon[1]*-48]:[(nextBuy.iconColumn)*-48, 0]);
                        let nextBuyType = (nextBuy instanceof Game.Object?'[owned : '+nextBuy.amount+']':(nextBuy instanceof Game.Upgrade?(nextBuy.pool!==''?'<span style="color:blue;">['+nextBuy.pool.substr(0,1).toUpperCase() + nextBuy.pool.substr(1)+']</span>':'[Upgrade]'):'<ERR>'))+'';
                        let price = nextBuy.getPrice();

                        str+='<div class="section">Statistics</div>'+
                            '<div class="subsection">'+
                            '<div class="title">General</div>'+
                            '<div class="listing"><b>Cookies in bank :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookies)+'</div></div>'+
                            '<div class="listing"><b>Cookies baked (this ascension) :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned)+'</div></div>'+
                            '<div class="listing"><b>Cookies baked (all time) :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+
                            (Game.cookiesReset>0?'<div class="listing"><b>Cookies forfeited by ascending :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesReset)+'</div></div>':'')+
                            (Game.resets?('<div class="listing"><b>Legacy started :</b> '+(fullDate==''?'just now':(fullDate+' ago'))+', with '+Beautify(Game.resets)+' ascension'+(Game.resets==1?'':'s')+'</div>'):'')+
                            '<div class="listing"><b>Run started :</b> '+(startDate==''?'just now':(startDate+' ago'))+'</div>'+
                            '<div class="listing"><b>Buildings owned :</b> '+Beautify(buildingsOwned)+'</div>'+
                            '<div class="listing"><b>Cookies per second :</b> '+Beautify(Game.cookiesPs,1)+' <small>'+
                            '(multiplier : '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'+
                            (Game.cpsSucked>0?' <span class="warning">(withered : '+Beautify(Math.round(Game.cpsSucked*100),1)+'%)</span>':'')+
                            '</small></div>'+
                            '<div class="listing"><b>Cookies per click :</b> '+Beautify(Game.computedMouseCps,1)+'</div>'+
                            '<div class="listing"><b>Cookie clicks :</b> '+Beautify(Game.cookieClicks)+'</div>'+
                            '<div class="listing"><b>Hand-made cookies :</b> '+Beautify(Game.handmadeCookies)+'</div>'+
                            '<div class="listing"><b>Golden cookie clicks :</b> '+Beautify(Game.goldenClicksLocal)+' <small>(all time : '+Beautify(Game.goldenClicks)+')</small></div>'+//' <span class="hidden">(<b>Missed golden cookies :</b> '+Beautify(Game.missedGoldenClicks)+')</span></div>'+
                            '<br><div class="listing"><b>Running version :</b> '+Game.version+'</div>'+

                            ((researchStr!='' || wrathStr!='' || pledgeStr!='' || santaStr!='' || dragonStr!='' || Game.season!='' || ascensionModeStr!='' || Game.canLumps())?(
                            '</div><div class="subsection">'+
                            '<div class="title">Special</div>'+
                            (ascensionModeStr!=''?'<div class="listing"><b>Challenge mode :</b>'+ascensionModeStr+'</div>':'')+
                            (Game.season!=''?'<div class="listing"><b>Seasonal event :</b> '+Game.seasons[Game.season].name+
                             (seasonStr!=''?' <small>('+seasonStr+' remaining)</small>':'')+
                             '</div>':'')+
                            (Game.season=='fools'?
                             '<div class="listing"><b>Money made from selling cookies :</b> $'+Beautify(Game.cookiesEarned*0.08,2)+'</div>'+
                             (Game.Objects['Portal'].amount>0?'<div class="listing"><b>TV show seasons produced :</b> '+Beautify(Math.floor((timeInSeconds/60/60)*(Game.Objects['Portal'].amount*0.13)+1))+'</div>':'')
                             :'')+
                            (researchStr!=''?'<div class="listing"><b>Research :</b> '+researchStr+' remaining</div>':'')+
                            (wrathStr!=''?'<div class="listing"><b>Grandmatriarchs status :</b> '+wrathStr+'</div>':'')+
                            (pledgeStr!=''?'<div class="listing"><b>Pledge :</b> '+pledgeStr+' remaining</div>':'')+
                            (Game.wrinklersPopped>0?'<div class="listing"><b>Wrinklers popped :</b> '+Beautify(Game.wrinklersPopped)+'</div>':'')+
                            ((Game.canLumps() && Game.lumpsTotal>-1)?'<div class="listing"><b>Sugar lumps harvested :</b> <div class="price lump plain">'+Beautify(Game.lumpsTotal)+'</div></div>':'')+
                            //(Game.cookiesSucked>0?'<div class="listing warning"><b>Withered :</b> '+Beautify(Game.cookiesSucked)+' cookies</div>':'')+
                            (Game.reindeerClicked>0?'<div class="listing"><b>Reindeer found :</b> '+Beautify(Game.reindeerClicked)+'</div>':'')+
                            (santaStr!=''?'<div class="listing"><b>Santa stages unlocked :</b></div><div>'+santaStr+'</div>':'')+
                            (dragonStr!=''?'<div class="listing"><b>Dragon training :</b></div><div>'+dragonStr+'</div>':'')+
                            ''
                        ):'')+
                            ((Game.prestige>0 || prestigeUpgrades!='')?(
                            '</div><div class="subsection">'+
                            '<div class="title">Prestige</div>'+
                            '<div class="listing"><div class="icon" style="float:left;background-position:'+(-19*48)+'px '+(-7*48)+'px;"></div>'+
                            '<div style="margin-top:8px;"><span class="title" style="font-size:22px;">Prestige level : '+Beautify(Game.prestige)+'</span> at '+Beautify(heavenlyMult*100,1)+'% of its potential <b>(+'+Beautify(parseFloat(Game.prestige)*Game.heavenlyPower*heavenlyMult,1)+'% CpS)</b><br>Heavenly chips : <b>'+Beautify(Game.heavenlyChips)+'</b></div>'+
                            '</div>'+
                            (prestigeUpgrades!=''?(
                                '<div class="listing" style="clear:left;"><b>Prestige upgrades unlocked :</b> '+prestigeUpgradesOwned+'/'+prestigeUpgradesTotal+' ('+Math.floor((prestigeUpgradesOwned/prestigeUpgradesTotal)*100)+'%)</div>'+
                                '<div class="listing crateBox">'+prestigeUpgrades+'</div>'):'')+
                            ''):'')+

                            '</div><div class="subsection">'+
                            '<div class="title">Upgrades</div>'+
                            (hiddenUpgrades!=''?('<div class="listing"><b>Debug</b></div>'+
                                                 '<div class="listing crateBox">'+hiddenUpgrades+'</div>'):'')+
                            '<div class="listing"><b>Upgrades unlocked :</b> '+upgradesOwned+'/'+upgradesTotal+' ('+Math.floor((upgradesOwned/upgradesTotal)*100)+'%)</div>'+
                            '<div class="listing crateBox">'+upgrades+'</div>'+
                            (cookieUpgrades!=''?('<div class="listing"><b>Cookies</b></div>'+
                                                 '<div class="listing crateBox">'+cookieUpgrades+'</div>'):'')+
                            '</div><div class="subsection">'+
                            '<div class="title">CookieAuto</div>'+
                            '<div class="listing">'+
                            '<b>Buying Next :</b>'+
                            '<div class="framed" style="width: 50%; margin: 0 auto; padding-bottom: 8px;"><div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;background-position: '+nextBuyIcon[0]+'px '+nextBuyIcon[1]+'px;"></div><div class="price plain" style="float:right;">'+Beautify(nextBuy.getPrice())+'</div><div class="name">'+nextBuy.name+'</div><small>'+nextBuyType+'</small><div class="price" style="float:right;color:gold;">'+Beautify(CookieAuto.getMultiplier()*Game.cookiesPs + price)+'</div></div>'+
                            '</div>'+
                            '</div><div class="subsection">'+
                            '<div class="title">Achievements</div>'+
                            '<div class="listing"><b>Achievements unlocked :</b> '+achievementsOwned+'/'+achievementsTotal+' ('+Math.floor((achievementsOwned/achievementsTotal)*100)+'%)'+(achievementsOwnedOther>0?('<span style="font-weight:bold;font-size:10px;color:#70a;"> (+'+achievementsOwnedOther+')</span>'):'')+'</div>'+
                            (Game.cookiesMultByType['kittens']>1?('<div class="listing"><b>Kitten multiplier :</b> '+Beautify((Game.cookiesMultByType['kittens'])*100)+'%</div>'):'')+
                            '<div class="listing"><b>Milk :</b> '+milkName+'</div>'+
                            (milkStr!=''?'<div class="listing"><b>Milk flavors unlocked :</b></div><div>'+milkStr+'</div>':'')+
                            '<div class="listing"><small style="opacity:0.75;">(Milk is gained with each achievement. It can unlock unique upgrades over time.)</small></div>'+
                            achievementsStr+
                            '</div>'+
                            '<div style="padding-bottom:128px;"></div>'
                        ;
                    }
                    //str='<div id="selectionKeeper" class="selectable">'+str+'</div>';
                    q('#menu')[0].innerHTML=str;

                    Game.lastOnMenu = Game.onMenu;
                    /*AddEvent(l('selectionKeeper'),'mouseup',function(e){
				console.log('selection:',window.getSelection());
			});*/
                }

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

                Game.HardReset=function(bypass) {
                    if (!bypass)
                    {
                        Game.Prompt('<h3>Wipe save</h3><div class="block">Do you REALLY want to wipe your save?<br><small>You will lose your progress, your achievements, and your heavenly chips!</small></div>',[['Yes!','Game.ClosePrompt();Game.HardReset(1);'],'No']);
                    }
                    else if (bypass==1)
                    {
                        Game.Prompt('<h3>Wipe save</h3><div class="block">Whoah now, are you really, <b><i>REALLY</i></b> sure you want to go through with this?<br><small>Don\'t say we didn\'t warn you!</small></div>',[['Do it!','Game.ClosePrompt();Game.HardReset(2);'],'No']);
                    }
                    else
                    {
                        for (var i in Game.AchievementsById)
                        {
                            var me=Game.AchievementsById[i];
                            me.won=0;
                        }
                        for (var i in Game.ObjectsById)
                        {
                            var me=Game.ObjectsById[i];
                            me.level=0;
                        }

                        Game.AchievementsOwned=0;
                        Game.goldenClicks=0;
                        Game.missedGoldenClicks=0;
                        Game.Reset(1);
                        Game.resets=0;
                        Game.fullDate=parseInt(Date.now());
                        Game.bakeryName=Game.GetBakeryName();
                        Game.bakeryNameRefresh();
                        Game.cookiesReset=0;
                        Game.prestige=0;
                        Game.heavenlyChips=0;
                        Game.heavenlyChipsSpent=0;
                        Game.heavenlyCookies=0;
                        Game.permanentUpgrades=[-1,-1,-1,-1,-1];
                        Game.ascensionMode=0;
                        Game.lumps=-1;
                        Game.lumpsTotal=-1;
                        Game.lumpT=Date.now();
                        Game.lumpRefill=0;
                        Game.removeClass('lumpsOn');

                        localStorage.removeItem('buyscript_considerTTL');
                        localStorage.removeItem('buyscript_buyBuildings');
                        localStorage.removeItem('buyscript_buyUpgrades');
                        localStorage.removeItem('buyscript_popGoldenCookies');
                        localStorage.removeItem('buyscript_popWrathCookies');
                        localStorage.removeItem('buyscript_popReindeer');
                        localStorage.removeItem('buyscript_popWrinklers');
                        localStorage.removeItem('buyscript_wrinkerThreshold');
                        localStorage.removeItem('buyscript_maintainPledge');
                        localStorage.removeItem('buyscript_reserve');
                        localStorage.removeItem('buyscript_autoclick');
                        localStorage.removeItem('buyscript_upgradeDragon');
                        localStorage.removeItem('buyscript_upgradeSanta');
                        localStorage.removeItem('buyscript_autoReset');
                        localStorage.removeItem('buyscript_shoppingList');

                        CookieAuto.loadShoppingList();
                        Game.prefs.buyscript_abbuild = 1;
                        Game.prefs.buyscript_abup = 1;
                        Game.prefs.buyscript_abac = 0;

                        Game.prefs.buyscript_santaup = 0;
                        Game.prefs.buyscript_dragonup = 0;
                    }
                }

                window.CookieAuto = CookieAuto;

                clearInterval(countdown);
            }
        }, 20);
    }
})();
