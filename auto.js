adds = {};
adds["Thousand fingers"] = 0.1;
adds["Million fingers"] = 0.5;
adds["Billion fingers"] = 5;
adds["Trillion fingers"] = 50;
adds["Quadrillion fingers"] = 500;
adds["Quintillion fingers"] = 5000;
adds["Sextillion fingers"] = 50000;
adds["Septillion fingers"] = 500000;
adds["Octillion fingers"] = 5000000;

kittens = {};
kittens["Kitten helpers"] = 0.1;
kittens["Kitten workers"] = 0.125;
kittens["Kitten engineers"] = 0.15;
kittens["Kitten overseers"] = 0.175;
kittens["Kitten managers"] = 0.2;
kittens["Kitten accountants"] = 0.2;
kittens["Kitten specialists"] = 0.2;
kittens["Kitten experts"] = 0.2;

grandmas = {};
grandmas['Farmer grandmas'] = 2;
grandmas['Worker grandmas'] = 2;
grandmas['Miner grandmas'] = 2;
grandmas['Cosmic grandmas'] = 2;
grandmas['Transmuted grandmas'] = 2;
grandmas['Altered grandmas'] = 2;
grandmas['Grandmas\' grandmas'] = 2;
grandmas['Antigrandmas'] = 2;
grandmas['Rainbow grandmas'] = 2;
grandmas['Banker grandmas'] = 2;
grandmas['Priestess grandmas'] = 2;
grandmas['Witch grandmas'] = 2;

mouse = {};
mouse['Plastic mouse'] = 0.2;
mouse['Iron mouse'] = 0.2;
mouse['Titanium mouse'] = 0.2;
mouse['Adamantium mouse'] = 0.2;
mouse['Unobtainium mouse'] = 0.2;
mouse['Eludium mouse'] = 0.2;
mouse['Wishalloy mouse'] = 0.2;
mouse['Fantasteel mouse'] = 0.2;
mouse['Nevercrack mouse'] = 0.2;

prestige = {};
prestige['Heavenly chip secret'] = 0.05;
prestige['Heavenly cookie stand'] = 0.20;
prestige['Heavenly bakery'] = 0.25;
prestige['Heavenly confectionery'] = 0.25;
prestige['Heavenly key'] = 0.25;

function roi(o) {
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
      cps = Game.Objects["Cursor"].storedTotalCps * Game.globalCpsMult;
    } else if (adds.hasOwnProperty(o.name)) {
      var cursors = Game.Objects["Cursor"].amount;
      var otherBuildings = Game.BuildingsOwned - cursors;
      cps = cursors * otherBuildings * adds[o.name] * Game.globalCpsMult;
    } else if (kittens.hasOwnProperty(o.name)) {
      mult = 1;
      if (Game.Has("Santa's milk and cookies")) mult *= 1.05;
      if (Game.hasAura("Breath of milk")) mult *= 1.05;
      cps = Game.milkProgress * kittens[o.name] * mult * Game.cookiesPs;
    } else if (grandmas.hasOwnProperty(o.name)) {
      cps = Game.Objects["Grandma"].storedTotalCps * Game.globalCpsMult;
    } else if (mouse.hasOwnProperty(o.name)) {
      cps = Game.cookiesPs * 0.2;
    } else if (prestige.hasOwnProperty(o.name)) {
      cps = Game.prestige * 0.01 * Game.heavenlyPower * prestige[o.name] * Game.cookiesPs;
    }
  } else if (o.constructor === Game.Object) {
    cps = o.storedCps * Game.globalCpsMult;
  }
  if (cps !== undefined) {
    return o.getPrice() / cps;
  }
  return undefined;
}

function bestBuy() {
  var o;
  for (var i = 0; i < shoppingList.length; ++i) {
    o = shoppingList[i];
    if (o.constructor == Game.Upgrade) {
      if (o.bought) {
        shoppingList.splice(i, 1);
        if (i < shoppingList.length) {
          --i;
        }
      } else if (o.unlocked) {
        return o;
      }
    } else if (!o.locked) {
      return o;
    }
  }
  o = undefined;
  var min_roi, me, my_roi;
  for (var key in Game.Objects) {
    me = Game.Objects[key];
    my_roi = roi(me);
    if (my_roi !== undefined && (o === undefined || my_roi < min_roi)) {
      o = me;
      min_roi = my_roi;
    }
  }
  for (i in Game.UpgradesInStore) {
    me = Game.UpgradesInStore[i];
    my_roi = roi(me);
    if (my_roi !== undefined && (o === undefined || my_roi < min_roi)) {
      o = me;
      min_roi = my_roi;
    }
  }

  return o;
}

function buyBest() {
  if (paused) {
    return;
  }
  var o = bestBuy();
  if (o === undefined) {
    return;
  }
  var price = o.getPrice();
  if (((Game.cookies - price) / Game.cookiesPs) > getMultiplier()) {
    for (var i = 0; i < shoppingList.length; ++i) {
      if ( o === shoppingList[i]) {
        shoppingList.splice(i, 1);
        break;
      }
    }
    console.log('buying ' + o.name);
    o.buy();
  }
}

function popShimmers() {
  for (var i = Game.shimmers.length - 1; i >= 0; --i) {
    console.debug(Game.shimmers[i]);
    cookie = Game.shimmers[i];
    if (!cookie.wrath) {
      cookie.pop();
    }
  }
}

function pledge() {
  p = Game.Upgrades["Elder Pledge"];
  if (p.unlocked && !p.bought) {
    p.buy();
  }
}

function getMultiplier() {
  var mult = 6000;
  var date = new Date();
  date.setTime(Date.now() - Game.startDate);
  if (date.getTime() < 7200000) {
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
}

reserveMultiplier = 6000;
paused = false;
shoppingList = [];
for (var i in Game.UpgradesByPool["tech"]) {
  shoppingList.push(Game.UpgradesByPool["tech"][i]);
}
shoppingList.push(Game.Upgrades["Sacrificial rolling pins"]);
//shoppingList.push(Game.Upgrades["Lucky day"]);
//shoppingList.push(Game.Upgrades["Serendipity"]);
//shoppingList.push(Game.Upgrades["Get lucky"]);

shopper = setInterval(buyBest, 200);
shimmerPopper = setInterval(popShimmers, 500);
pledgeMaintainer = setInterval(pledge, 1000);
