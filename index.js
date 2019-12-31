//Iniziallizzazione moduli
require('dotenv').config()
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
var request = require("request");
var cheerio = require("cheerio");
const liveGames = require("./src/livegames");
const nba = require("./src/nba");
const fs = require("fs");
var express = require("express");
const path = require("path");
var app = express();
const colors = require('colors');

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";

//Creiamo il bot
const bot = new Telegraf("994732934:AAG1UQWTXTrQRJYLbVR1S0AWDYvrtnNBHZY")

//bot.use(Telegraf.log());
//Variabili globali
var buttons;
const defaultUrl = "http://nba4live.xyz/";
const dashboardUrl =
    "http://13.93.24.203:8080";

var gamesScheduled = new Array();
let rawdata = fs.readFileSync("./public/data/stadium.json");
let stadiumData = JSON.parse(rawdata);
var checker = false;
var currentDate;

bot.command("start", ctx => {
    logInfo(ctx, 'command');
    return ctx.replyWithPhoto(
        { source: "./public/img/logo.jpg" },
        Extra.load({
            caption:
                "Welcome in the Nba Stream Bot\nClick on Live games to start watching the best nba games right now and for FREE"
        })
            .markdown()
            .markup(m =>
                m.inlineKeyboard([
                    m.callbackButton("🔥 Live Games", "liveGames"),
                    m.callbackButton("📞 Scheduled Games", "scheduled"),
                    m.urlButton("Web View", dashboardUrl)
                ],
                    { columns: 2 })
            )
    );
});

bot.action("scheduled", async ctx => {
    gamesScheduled = [];
    logInfo(ctx, 'action');
    nba.fetchScheduledgames(2019).then(data => {
        sendScheduledGames(ctx, data);
    });
});

bot.action("liveGames", async ctx => {
    logInfo(ctx, 'action');
    gamesScheduled = [];
    liveGames(defaultUrl).then(data => {
        sendLiveGames(ctx, data);
    });
});

bot.action(/^id:/, async ctx => {
    logInfo(ctx, 'action');
    var action = ctx.update.callback_query.data;
    var idRequestedGame = action.split("id:")[1];
    try {
        if (idRequestedGame == "null") {
            await ctx.answerCbQuery("Retry later");
        } else {
            await ctx.editMessageCaption(
                `${gamesScheduled[idRequestedGame].homeTeam}<b> VS </b>${gamesScheduled[idRequestedGame].awayTeam}\nPlaying at <b>${stadiumData[gamesScheduled[idRequestedGame].homeTeam].name}</b>\nStarting At <b>${gamesScheduled[idRequestedGame].hour} UTC</b>`,
                Extra.HTML().markup(m =>
                    m.inlineKeyboard(
                        [
                            Markup.callbackButton(
                                "Home team Stream",
                                `watch:${idRequestedGame},0`
                            ),
                            Markup.callbackButton(
                                "Away Team Stream",
                                `watch:${idRequestedGame},1`
                            ),
                            Markup.callbackButton("Go back", "go:live")
                        ],
                        { columns: 2 }
                    )
                )
            );
            await ctx.answerCbQuery("Loading Stream");
        }
    } catch (error) { }
});

bot.action(/^prog:/, async ctx => {
    logInfo(ctx, 'action');
    var action = ctx.update.callback_query.data;
    var idRequestedGame = action.split("prog:")[1];
    try {
        var idRequestedGame = action.split("prog:")[1];
        if (idRequestedGame == "null") {
            ctx.answerCbQuery("Retry later");
        } else {
            ctx.editMessageCaption(
                `${gamesScheduled[idRequestedGame].homeTeam}<b> VS </b>${gamesScheduled[idRequestedGame].awayTeam}\nPlaying at <b>${stadiumData[gamesScheduled[idRequestedGame].homeTeam].name}</b>\nStarting At <b>${gamesScheduled[idRequestedGame].hour} UTC</b>`,
                Extra.HTML().markup(m =>
                    m.inlineKeyboard([Markup.callbackButton("Go back", "go:scheduled")], {
                        columns: 2
                    })
                )
            );
            ctx.answerCbQuery("Scheduled Live");
        }
    } catch (error) { }
});

bot.action(/^watch:/, async ctx => {
    logInfo(ctx, 'action');
    var action = ctx.update.callback_query.data;
    var actionRaw = action.split("watch:")[1];
    var idRequestedGame = actionRaw.split(",")[0];
    var watchSelection = actionRaw.split(",")[1];
    if (idRequestedGame == "null") {
        await ctx.answerCbQuery(
            "There's been an error loading the stream.Retry later"
        );
    } else {
        var urlChosenGame =
            watchSelection == 0
                ? gamesScheduled[idRequestedGame].urlHomeTeam
                : gamesScheduled[idRequestedGame].urlAwayTeam;
        request(urlChosenGame, function (error, response, body) {
            const $ = cheerio.load(body);
            var results = $("body");
            var streamLink = results
                .find("iframe")
                .eq(1)
                .first()
                .attr("src");
            ctx.answerCbQuery("Streams loaded");
            ctx.editMessageCaption(
                `You have choose to watch the game under ${
                watchSelection == 0
                    ? gamesScheduled[idRequestedGame].homeTeam
                    : gamesScheduled[idRequestedGame].awayTeam
                } Streams\nGood watch`,
                Extra.HTML().markup(m =>
                    m.inlineKeyboard(
                        [
                            Markup.urlButton("Watch the game", streamLink),
                            Markup.callbackButton("Go back", "go:live")
                        ],
                        { columns: 2 }
                    )
                )
            );
        });
    }
});

bot.action(/^go:/, async ctx => {
    logInfo(ctx, 'action');
    var action = ctx.update.callback_query.data;
    var actionRaw = action.split("go:")[1];
    if (actionRaw == "live") {
        gamesScheduled = [];
        liveGames(defaultUrl).then(data => {
            sendLiveGames(ctx, data);
        });
    } else if (actionRaw == "scheduled") {
        gamesScheduled = [];
        nba.fetchScheduledgames(2019).then(data => {
            sendScheduledGames(ctx, data);
        });
    } else if (actionRaw == "main") {
        try {
            ctx.answerCbQuery();
            ctx.editMessageCaption(
                "Welcome in the Nba Stream Bot\nClick on Live games to start watching the best nba games right now and for FREE",
                Extra.HTML().markup(m =>
                    m.inlineKeyboard([
                        m.callbackButton("🔥 Live Games", "liveGames"),
                        m.callbackButton("📞 Scheduled Games", "scheduled"),
                        m.urlButton("Web View", dashboardUrl)
                    ],
                        { columns: 2 })
                )
            );
        } catch (error) { }
    }
});


app.use("/", express.static(path.join(__dirname, "public")));
app.use("/api", require("./routes/api").route);

app.listen(server_port, function () {
    console.log("Listening on port " + server_port);
});

function logInfo(ctx, entities) {
    if (entities.match(/^command/)) {
        let date = new Date();
        let idFrom = ctx.update.message.from.id;
        let nameFrom = ctx.update.message.from.username;
        let command = ctx.update.message.text;
        ctx.telegram.sendMessage("@NbaLogChannel",`From: ${idFrom}/${nameFrom} Command:${command}`);
        console.log(`${date.toString()} From: ${idFrom}/${nameFrom} Command:${command}`.blue);
    }
    if (entities.match(/^action/)) {
        let date = new Date();
        let idFrom = ctx.update.callback_query.from.id;
        let nameFrom = ctx.update.callback_query.from.username;
        let action = ctx.update.callback_query.data;
        ctx.telegram.sendMessage("@NbaLogChannel",`From: ${idFrom}/@${nameFrom} Action:${action}`);
        console.log(`${date.toString()} From: ${idFrom}/${nameFrom} Action:${action}`.green);
    }
}

function sendLiveGames(ctx, data) {
    gamesScheduled = data;
    try {
        if (gamesScheduled.length == 0) {
            ctx.editMessageCaption(
                "Sorry no live games right now\nIf you wanna see all the possible lives go to 📞 Scheduled Games",
                Extra.HTML().markup(m =>
                    m.inlineKeyboard(
                        [
                            m.callbackButton("No live games right now", "id:null"),
                            m.callbackButton("Go back", "go:main")
                        ],
                        { columns: 1 }
                    )
                )
            );
        } else {
            var currentDate = new Date();
            buttons = Object.keys(gamesScheduled)
                .filter(function (key) {
                    var hourUTC = gamesScheduled[key].hour.split(":")[0];
                    if (currentDate.getUTCHours() - hourUTC < 4) {
                        return true;
                    } else {
                        return false;
                    }
                    return true;
                })
                .map(function (key) {
                    return Markup.callbackButton(
                        gamesScheduled[key].print(),
                        `id:${key}`
                    );
                });
            buttons.push(Markup.callbackButton("Go Back", `go:main`));
            ctx.editMessageCaption(
                "<b>Live games</b>\nThis result are for games that are playing or they will start really soon\nIf you wanna see all the game go to 📞 Scheduled Games",
                Extra.HTML().markup(m => m.inlineKeyboard(buttons, { columns: 1 }))
            );
        }
    } catch (error) { }
}

function sendScheduledGames(ctx, data) {
    gamesScheduled = data;
    try {
        if (gamesScheduled.length == 0) {
            ctx.editMessageCaption(
                "No scheduled games sorry\nTry again later",
                Extra.HTML().markup(m =>
                    m.inlineKeyboard(
                        [
                            m.callbackButton("No games", "id:null"),
                            m.callbackButton("Go Back", `go:main`)
                        ],
                        { columns: 1 }
                    )
                )
            );
        } else {
            buttons = Object.keys(gamesScheduled).map(function (key) {
                return Markup.callbackButton(
                    gamesScheduled[key].print(),
                    `prog:${key}`
                );
            });
            buttons.push(Markup.callbackButton("Go Back", `go:main`));
            ctx.editMessageCaption(
                "<b>Scheduled live Game</b>\nHere you can find all the games that could possible see in the bot",
                Extra.HTML().markup(m => m.inlineKeyboard(buttons, { columns: 1 }))
            );
        }
    } catch (error) { }
}

bot.launch().then(() => {
    console.log("Bot avviato");
});

setInterval(() => {
    let currentHour = new Date().getUTCHours();
    if (currentHour > 21 && currentHour < 24) {
        liveGames(defaultUrl).then(data => {
            if (data.length != 0 && !checker) {
                checker = true;
                bot.telegram.sendMessage(
                    119307463,
                    `Partite live`,
                    Extra.load().markdown()
                );
            } else {
                if (data.length != 0) {
                    checker = true;
                } else {
                    checker = false;
                }
            }
        });
        currentDate = new Date();
        console.log(
            checker
                ? "New game added at " +
                currentDate.getHours() +
                ":" +
                currentDate.getMinutes()
                : "No new game at " +
                currentDate.getHours() +
                ":" +
                currentDate.getMinutes()
                + "".red);
    }
}, 600000);
