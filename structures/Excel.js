const { Client, Collection, Partials, WebhookClient, Options, GatewayIntentBits } = require('discord.js')
const { REST } = require('@discordjs/rest');
const fs = require('fs')
const mongoose = require('mongoose')
const Utils = require('./util')
const { glob } = require('glob')
const { promisify } = require('util')
const { Database } = require('quickmongo')
const { QuickDB } = require('quick.db')
const axios = require('axios')
const pg = require('pg')
const redis = require("redis");
const { TOKEN } = require(`${process.cwd()}/config.json`)
const { ClusterClient, getInfo } = require('discord-hybrid-sharding');
const Sql = require('better-sqlite3')
module.exports = class ExcelPrime extends Client {
    constructor() {
        super({
            intents: 53608447,
            fetchAllMembers: true,
            shards: getInfo().SHARD_LIST,
            shardCount: getInfo().TOTAL_SHARDS,
            allowedMentions: {
                parse: ['users', 'roles'],
                repliedUser: true
            },
            partials: [Partials.Message, Partials.Channel, Partials.Reaction],
            sweepers: {

                messages: {

                    interval: 300,

                    lifetime: 1800
                }

            }

        })

        this.setMaxListeners(Infinity)
        this.cluster = new ClusterClient(this);
        this.config = require(`${process.cwd()}/config.json`)
        this.logger = require('./logger')
        this.commands = new Collection()
        this.categories = fs.readdirSync('./commands/')
        this.emoji = {
            tick: '<:Check:1375899259932508180>',
            cross: '<:crosss:1375899254563799192>',
            dot: '<:Dot:1376280161577734214>',
            process: '<a:Loading:1376282107294515271>',
            disable: '<:crosss:1375899254563799192><:CheckBox:1375899257835491529>',
            enable: '<:CrossBox:1375899437045387314><:Check:1375899259932508180>',
            protect: '<:protect:1376254177780695212>',
            hii: '<:ExcelPrime:1374825534399447090>',
            verification: '<:verification:1376298631115702414>',
            decoy: '<:decoy:1376284476216311978>',
            tracedcolor: '<:tracedColored:1376296232862879854>',
            cases: '<:cases:1376295320601886720>',
            giveaway: '<a:Giveaway:1376296840861057274>'
        }
        this.util = new Utils(this)
        this.color = 0xF9C314
        this.support = `https://discord.gg/excelbot`
        this.cooldowns = new Collection()
        this.snek = require('axios')

        this.ratelimit = new WebhookClient({
            url: 'https://discord.com/api/webhooks/1376330953592668220/xw1eS0tTRKCibhIYdZwvOaW9Iu6VkOz6rUX7ON-nR5rZz1OapBCr2cTB9f-ZK5D2bmL8'
        })
        this.error = new WebhookClient({
            url: 'https://discord.com/api/webhooks/1376330746993704992/77XiJTy49wIswl_J6Y66g7dlifsU6InGXxVuGStov26RB40xtM6TcCY7zofc2BVt7pN8'
        })

        this.on('error', (error) => {
            this.error.send(`\`\`\`js\n${error.stack}\`\`\``)
        })
        process.on('unhandledRejection', (error) => {
            this.error.send(`\`\`\`js\n${error.stack}\`\`\``)
        })
        process.on('uncaughtException', (error) => {
            this.error.send(`\`\`\`js\n${error.stack}\`\`\``)
        })
        process.on('warning', (warn) => {
            this.error.send(`\`\`\`js\n${warn}\`\`\``)
        })
        process.on('uncaughtExceptionMonitor', (err, origin) => {
            this.error.send(`\`\`\`js\n${err},${origin}\`\`\``)
        })
        this.rest.on('rateLimited', (info) => {
            this.ratelimit.send({
                content: `\`\`\`js\nTimeout: ${info.retryAfter},\nLimit: ${info.limit},\nMethod: ${info.method},\nPath: ${info.hash},\nRoute: ${info.route},\nGlobal: ${info.global}\nURL : ${info.url}\nScope : ${info.scope}\nMajorPrameter : ${info.majorParameter} Black\`\`\``
            })
        })
    }


    async initializedata() {
            this.warn = new Sql(`${process.cwd()}/Database/warns.db`);
            this.warn.pragma('journal_mode = WAL');
            this.warn.prepare(`CREATE TABLE IF NOT EXISTS warnings (id INTEGER PRIMARY KEY AUTOINCREMENT,guildId TEXT NOT NULL,userId TEXT NOT NULL,reason TEXT,moderatorId TEXT,timestamp TEXT,warnId TEXT NOT NULL)`).run();
            this.snipe = new Sql(`${process.cwd()}/Database/snipe.db`);
            this.snipe.pragma('journal_mode = WAL');
            this.snipe.prepare(`CREATE TABLE IF NOT EXISTS snipes (id INTEGER PRIMARY KEY AUTOINCREMENT,guildId TEXT NOT NULL,channelId TEXT NOT NULL,content TEXT,author TEXT,timestamp INTEGER,imageUrl TEXT)`).run();
            this.msgs = new Sql(`${process.cwd()}/Database/messages.db`);
            this.msgs.pragma('journal_mode = WAL');
            this.msgs.prepare(`CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guildId TEXT NOT NULL,
                userId TEXT NOT NULL,
                totalMessages INTEGER DEFAULT 0,
                UNIQUE(guildId, userId)
            );`).run();
            this.msgs.prepare(`CREATE TABLE IF NOT EXISTS dailymessages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guildId TEXT NOT NULL,
                userId TEXT NOT NULL,
                date TEXT NOT NULL,
                dailyCount INTEGER DEFAULT 0,
                UNIQUE(guildId, userId, date)
            );`).run();
        
        
            this.livelb = new Sql(`${process.cwd()}/Database/liveleaderboard.db`);
            this.livelb.pragma('journal_mode = WAL');
            this.livelb.prepare(`CREATE TABLE IF NOT EXISTS liveleaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guildId TEXT NOT NULL,
            type TEXT NOT NULL,
            messageId TEXT NOT NULL,
            channelId TEXT NOT NULL,
            UNIQUE(guildId, type)
        );`).run();
        
            this.voice = new Sql(`${process.cwd()}/Database/voice.db`);
            this.voice.pragma('journal_mode = WAL');
            this.voice.prepare(`CREATE TABLE IF NOT EXISTS dailyvoice (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guildId TEXT NOT NULL,
                userId TEXT NOT NULL,
                date TEXT NOT NULL,
                dailyVoiceTime INTEGER DEFAULT 0,
                UNIQUE(guildId, userId, date)
            );`).run();
            
            this.voice.prepare(`CREATE TABLE IF NOT EXISTS voice (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guildId TEXT NOT NULL,
                userId TEXT NOT NULL,
                totalVoiceTime INTEGER DEFAULT 0,
                UNIQUE(guildId, userId)
            );`).run();    
          }

    async initializeMongoose() {
        this.db = new Database(this.config.MONGO_DB)
        this.db.connect()
        this.logger.log(`Connecting to MongoDb...`)
        await mongoose.connect(this.config.MONGO_DB,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        this.logger.log('Mongoose Database Connected', 'ready')
    }
    async loadEvents() {
        fs.readdirSync('./events/').forEach((file) => {
            let eventName = file.split('.')[0]
            require(`${process.cwd()}/events/${file}`)(this)
            this.logger.log(`Updated Event ${eventName}.`, 'event')
        })
    }

    async loadlogs() {
        fs.readdirSync('./logs/').forEach((file) => {
            let logevent = file.split('.')[0]
            require(`${process.cwd()}/logs/${file}`)(this)
            this.logger.log(`Updated Logs ${logevent}.`, 'event')
        })
    }


    async loadMain() {
        const commandFiles = []

        const commandDirectories = fs.readdirSync(`${process.cwd()}/commands`)
        for (const directory of commandDirectories) {
            const files = fs
                .readdirSync(`${process.cwd()}/commands/${directory}`)
                .filter((file) => file.endsWith('.js'))

            for (const file of files) {
                commandFiles.push(
                    `${process.cwd()}/commands/${directory}/${file}`
                )
            }
        }
        commandFiles.map((value) => {
            const file = require(value)
            const splitted = value.split('/')
            const directory = splitted[splitted.length - 2]
            if (file.name) {
                const properties = { directory, ...file }
                this.commands.set(file.name, properties)
            }
        })
        this.logger.log(`Updated ${this.commands.size} Commands.`, 'cmd')
    }
}
