const amqp = require("amqplib/callback_api");
const dotenv = require("dotenv").config();
const { Telegraf } = require('telegraf')

const bot = new Telegraf(`${process.env.POLICE_BOT_TOKEN}`);
const url = `amqp://guest:guest@${process.env.IP}:5672`;

let chatId = null;
let userName = null;

const listenForMessages = () => {
    amqp.connect(url, (connectionError, connection) => {
        if (connectionError)
            throw connectionError;

        connection.createChannel((channelError, channel) => {
            if (channelError)
                throw channelError;

            const policeTerminalQueue = "notify/police/terminal";
            channel.assertQueue(policeTerminalQueue, {durable: false});

            console.log("Waiting for consuming messages...");

            channel.consume(policeTerminalQueue, (msg) => {
                console.log("Received alert: " + msg.content.toString());

                bot.telegram.sendMessage(chatId, msg.content.toString());
            });
        });
    });
}

bot.start((ctx) => {
    console.log("The bot has been started");

    chatId = ctx.update.message.chat.id;
    userName = ctx.update.message.chat.first_name;
    ctx.reply(`Hi ${userName}!\nI'm ImThePoliceBot, I'm waiting for any kind of problem!`)
        .then(() => {
            ctx.reply(`Pay attention to not stop me if you want me to work properly!\n`);

            listenForMessages();
        });
});

bot.launch().then(() => console.log("The police bot is running..."));