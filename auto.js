if (typeof CookieAuto === "undefined") {
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
      for (let o of this.shoppingList) {
        if (o.constructor == Game.Upgrade) {
          if (o.unlocked) {
            return o;
          }
        } else if (!o.locked) {
          return o;
        }
      }
      return undefined;
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
      let mult = 6000;
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
    control : {
      considerTTL : true,
      buyBuildings : true,
      buyUpgrades : true,
      popGoldenCookies : true,
      popWrathCookies : true,
      popReindeer : true,
      popWrinklers : true,
      wrinklerThreshold : 0,
      maintainPledge : true,
      reserve : true,
      autoclick : false,
      upgradeDragon : false,
      upgradeSanta : false,
      autoReset : false,
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
      this.initShoppingList();
      this.buyBest();
      this.interval = setInterval(this.loop, 500);
      this.update();
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
    },
    update : function () {
      if (this.control.autoclick && !this.autoclicker) {
        this.autoclicker = setInterval(Game.ClickCookie, 20);
      }
      if (!this.control.autoclick && this.autoclicker) {
        clearInterval(this.autoclicker);
        this.autoclicker = 0;
      }
    }
  }
  
  CookieAuto.init();
}
