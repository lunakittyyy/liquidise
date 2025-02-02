// .__  .__             .__    .___.__               
// |  | |__| ________ __|__| __| _/|__| ______ ____  
// |  | |  |/ ____/  |  \  |/ __ | |  |/  ___// __ \ 
// |  |_|  < <_|  |  |  /  / /_/ | |  |\___ \\  ___/ 
// |____/__|\__   |____/|__\____ | |__/____  >\___  >
//             |__|             \/         \/     \/ 
//
// a general purpose headless minecraft bot written in javascript

const mineflayer = require('mineflayer');
const minecraftHawkEye = require('minecrafthawkeye');
const mineflayerViewer = require('prismarine-viewer').mineflayer;
const mineflayerPVP = require('mineflayer-pvp').plugin;
const mineflayerArmorManager = require('mineflayer-armor-manager');
const mineflayerCollectBlock = require('mineflayer-collectblock').plugin;
const mineflayerDashboard = require('mineflayer-dashboard');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalNear, GoalFollow } = require('mineflayer-pathfinder').goals;

let botUsername = "liquidise0";

let mcData;

// settings, the code becomes unreadable from here :3
let rotations = true;
let attackNearbyPlayers = false;
let fightBot = false;
let bowBot = false;

function createNewBot(user) {
    
    const bot = mineflayer.createBot({
        host: "localhost",
        port: 25565,
        auth: "offline",
        username: user,
        checkTimeoutInterval: 2147483646, // This is *awful*, but hack around some upstream bugs related to timeouts https://github.com/PrismarineJS/mineflayer/issues/3292
                                          // This means the bot will take an entire 2 and a half weeks to time out from a server, but thats funny so I don't care - luna
        plugins: [mineflayerDashboard, pathfinder, mineflayerPVP, mineflayerArmorManager, mineflayerCollectBlock],
    });

    bot.on('spawn', () => {

        mcData = require('minecraft-data')(bot.version);
        bot.loadPlugin(minecraftHawkEye);
        global.console.log = bot.dashboard.log;
        global.console.warn = bot.dashboard.log;
        global.console.error = bot.dashboard.log;
        let botMovements = new Movements(bot);
        botMovements.canDig = true;
        botMovements.canOpenDoors = true;
        botMovements.dontMineUnderFallingBlock = true;
        botMovements.allow1by1towers = true;
        botMovements.allowEntityDetection = false;
        botMovements.allowFreeMotion = true;
        botMovements.allowParkour = true;
        botMovements.allowSprinting = true;
        botMovements.maxDropDown = 4;

        botMovements.scafoldingBlocks = [ mcData.itemsByName.stone.id, mcData.itemsByName.oak_planks.id ]

        bot.pathfinder.setMovements(botMovements);

        readyCommands(bot);

        // require('child_process').exec('start http://localhost:8080/'); // OPENING VIEWER - THIS ISNT MALWARE
    })

    bot.on('physicsTick', () => {
        if (attackNearbyPlayers) {
            killauraTick(bot, 3);
        }
        if (fightBot) {
            fightBotTick(bot, 3);
        }
    })

    bot.on("kicked", console.log);
    bot.on("chat", (username, message) => {
        bot.dashboard.log(`${username}: ${message}`);
    });
}

function killauraTick(bot, range) {
    let entity = bot.nearestEntity();
    if (entity !== null) {
        if (entity.type === "player") {
            if (bot.entity.position.distanceTo(entity.position) <= range) {
                let pos = entity.position.offset(0, entity.height, 0);

                if (rotations) {
                    bot.lookAt(pos, true);
                }
                bot.attack(entity);
            }
        }
    }
}

function fightBotTick(bot, range) {
    killauraTick(bot, range);
    let entity = bot.nearestEntity();
    if (entity !== null && entity.type === "player") {
        bot.pathfinder.setGoal(new GoalFollow(entity, range));
    }
}

function readyCommands(bot) {
    bot.dashboard.commands['coords'] = () => {
        console.log("current x: " + bot.entity.position.x);
        console.log("current y: " + bot.entity.position.y);
        console.log("current z: " + bot.entity.position.z);
    }
    bot.dashboard.commands['drop'] = () => {
        if (bot.inventory.items().length === 0) {
            console.log("the bot has no items in it's inventory for it to drop");
            return;
        }
        console.log("successfully dropped " + bot.inventory.items()[0].displayName);
        bot.tossStack(bot.inventory.items()[0]);
    }
    bot.dashboard.commands['navigate'] = (x, y, z) => {
        console.log("navigating");
        bot.pathfinder.setGoal(new GoalNear(x, y, z));
    }
    bot.dashboard.commands['killaura'] = () => {
        attackNearbyPlayers = !attackNearbyPlayers;
        console.log("killaura: " + attackNearbyPlayers);
    }
    bot.dashboard.commands['rotations'] = () => {
        rotations = !rotations;
        console.log("rotations: " + rotations);
    }
    bot.dashboard.commands['fightbot'] = () => {
        fightBot = !fightBot;
        console.log("fightbot: " + fightBot);
    }
    bot.dashboard.commands['bowbot'] = () => {
        bowBot = !bowBot;
        console.log("bowbot: " + bowBot);
        if (bowBot) {
            bot.hawkEye.autoAttack(bot.hawkEye.getPlayer(), 'bow');
        } else {
            bot.hawkEye.stop();
        }
    }
    bot.dashboard.commands['web'] = (port) => {
        mineflayerViewer(bot, {
            viewDistance: 4,
            firstPerson: false,
            port: port
        })
    }
    bot.dashboard.commands['vclip'] = (dist) => {
        bot.entity.position = bot.entity.position.offset(0, parseInt(dist), 0);
    }
}

createNewBot(botUsername);
