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
        }
      }
    },
    roi : function(o) {
      var cps;
      if (o.constructor === Game.Upgrade) {
        if (o.tier && o.buildingTie) {
          cps = o.buildingTie.storedTotalCps * Game.globalCpsMult;
        } else if (o.pool == "cookie") {
          if (typeof(o.power) == "function") {
            cps = Game.cookiesPs * o.power() / 100;
          } else {
            cps = Game.cookiesPs * o.power / 100;
          }
        } else if (o.hasOwnProperty("buildingTie1")) {
          cps = o.buildingTie1.storedTotalCps * Game.globalCpsMult * 0.05 + o.buildingTie2.storedTotalCps * Game.globalCpsMult * 0.001;
        } else if (o.name == "Reinforced index finger" || o.name == "Carpal tunnel prevention cream" || o.name == "Ambidextrous" ) {
          cps = Game.Objects.Cursor.storedTotalCps * Game.globalCpsMult;
        } else if (this.UpgradeVars.adds.hasOwnProperty(o.name)) {
          var cursors = Game.Objects.Cursor.amount;
          var otherBuildings = Game.BuildingsOwned - cursors;
          cps = cursors * otherBuildings * this.UpgradeVars.adds[o.name] * Game.globalCpsMult;
        } else if (this.UpgradeVars.kittens.hasOwnProperty(o.name)) {
          mult = 1;
          if (Game.Has("Santa's milk and cookies")) mult *= 1.05;
          if (Game.hasAura("Breath of milk")) mult *= 1.05;
          cps = Game.milkProgress * this.UpgradeVars.kittens[o.name] * mult * Game.cookiesPs;
        } else if (this.UpgradeVars.grandmas.hasOwnProperty(o.name)) {
          cps = Game.Objects.Grandma.storedTotalCps * Game.globalCpsMult;
        } else if (this.UpgradeVars.mouse.hasOwnProperty(o.name)) {
          cps = Game.cookiesPs * 0.2;
        } else if (this.UpgradeVars.prestige.hasOwnProperty(o.name)) {
          cps = Game.prestige * 0.01 * Game.heavenlyPower * this.UpgradeVars.prestige[o.name] * Game.cookiesPs;
        } else if (this.UpgradeVars.other.hasOwnProperty(o.name)) {
          cps = this.UpgradeVars.other[o.name]();
        }
      } else if (o.constructor === Game.Object) {
        cps = o.storedCps * Game.globalCpsMult;
      }
      if (cps !== undefined) {
        return o.getPrice() / cps;
      }
      return undefined;
    },
    ttl : function (goal) {
      var cookiesNeeded;
      if (typeof(goal) == "object") {
        cookiesNeeded = this.target(goal);
      } else {
        cookiesNeeded = goal;
      }
      var cookiesRemaining = cookiesNeeded - Game.cookies;
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
      var o;
      for (var i in this.shoppingList) {
        o = this.shoppingList[i];
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
      var o, min_roi, me, my_roi;
      if (this.control.buyBuildings) {
        for (var key in Game.Objects) {
          me = Game.Objects[key];
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
        for (i in Game.UpgradesInStore) {
          me = Game.UpgradesInStore[i];
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
      var done = false;
      var itemsPurchased = false;
      var count = 0;
      var o;
      var onShoppingList = false;
      while (!done) {
        o = this.nextOnShoppingList();
        if (o) {
          onShoppingList = true;
        } else {
          o = this.bestBuy();
          onShoppingList = false;
        }
        if (o === undefined) {
          return;
        }
        var price = o.getPrice();
        if (((Game.cookies - price) / Game.cookiesPs) > this.getMultiplier()) {
          console.log('buying ' + o.name);
          if (o.constructor == Game.Object) {
            o.buy(1);
          } else {
            o.buy();
          }
          itemsPurchased = true;
          if (onShoppingList) {
            for (var i = 0; i < onShoppingList.length; ++i) {
              if (o === this.shoppingList[i]) {
                this.shoppingList.splice(i, 1);
                break;
              }
            }
          }
          if (++count > 1000) {
            done = true;
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
      for (var i = Game.shimmers.length - 1; i >= 0; --i) {
        var shimmer = Game.shimmers[i];
        if (shimmer.wrath) {
          if (this.control.popWrathCookies) shimmer.pop();
        } else if (shimmer.type == "golden") {
          if (this.control.popGoldenCookies) shimmer.pop();
        } else {
          if (this.control.popReindeer) shimmer.pop();
        }
      }
      if (this.control.popWrinklers) {
        for (var i in Game.wrinklers) {
          var wrinkler = Game.wrinklers[i];
          if (wrinkler.close == 1) {
            if (this.control.wrinklerThreshold <= wrinkler.sucked) {
              wrinkler.hp = 0;
            }
          }
        }
      }
    },
    pledge : function () {
      if (!this.control.maintainPledge) return;
      var p = Game.Upgrades["Elder Pledge"];
      if (p.unlocked && !p.bought) {
        p.buy();
      }
    },
    getMultiplier : function () {
      if (!this.control.reserve) return 0;
      var mult = 6000;
      var date = new Date();
      date.setTime(Date.now() - Game.startDate);
      if (date.getTime() < 2 * 60 * 60 * 1000) {
        mult = 0;
      }
      if (Game.Upgrades["Get lucky"].bought) {
        mult *= 7;
      }

      var i, name;
  
      for (i = 0; i < Game.goldenCookieChoices.length; ++i) {
        name = Game.goldenCookieChoices[i];
        if (Game.hasBuff(name)) {
          mult /= Game.buffs[name].multCpS;
        }
      }
  
      for (var key in Game.goldenCookieBuildingBuffs) {
        if (Game.goldenCookieBuildingBuffs.hasOwnProperty(key)) {
          for (i = 0; i < Game.goldenCookieBuildingBuffs[key].length; ++i) {
            name = Game.goldenCookieBuildingBuffs[key][i];
            if (Game.hasBuff(name)) {
              mult /= Game.buffs[name].multCpS;
            }
          }
        }
      }

      var wrinklerCount = 0;
      for (i = 0; i < Game.wrinklers.length; ++i) {
        if (Game.wrinklers[i].close) {
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
      maintainPledge : false,
      reserve : true,
      autoclick : false,
    },
    target : function (o) {
      var goal = o;
      if (goal === undefined) goal = this.bestBuy();
      return Game.cookiesPs * this.getMultiplier() + goal.getPrice();
    },
    format : function(num) {
      return numberFormatters[1](num);
    },
    loop : function () {
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
    initShoppingList : function () {
      Game.UpgradesByPool["tech"].forEach(this.addToShoppingList);
      Game.santaDrops.forEach(this.addToShoppingListByName);
      Game.easterEggs.forEach(this.addToShoppingListByName);
      [
        "A festive hat",
        "Lucky day",
        "Serendipity",
        "Get lucky",
        "Sacrificial rolling pins",
        "Santa's dominion"
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
