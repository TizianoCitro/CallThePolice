const amqp = require("amqplib/callback_api");
const dotenv = require("dotenv").config();
const { Telegraf } = require('telegraf')

const bot = new Telegraf(`${process.env.USER_BOT_TOKEN}`);
const url = `amqp://guest:guest@${process.env.IP}:5672`;

let chatId = null;
let userName = null;
let userLocation = null;
let userSensor = null;

const sendMessageToUser = (msg) => {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Call the police",
                        callback_data: "callThePolice",
                    },
                    {
                        text: "It's ok",
                        callback_data: "isOk"
                    }
                ],
            ],
        },
    };

    const alert = JSON.parse(msg.content.toString());
    userSensor = alert.from;
    userLocation = alert.location;

    const message = `Hey ${userName}! I've got an alert from ${userSensor} in your ${userLocation}!`;
    bot.telegram.sendMessage(chatId, message, options);
}

const listenForMessages = () => {
    amqp.connect(url, (connectionError, connection) => {
        if (connectionError) {
            throw connectionError;
        }

        connection.createChannel((channelError, channel) => {
            if (channelError) {
                throw channelError;
            }

            const userTerminalQueue = "notify/user/terminal";
            channel.assertQueue(userTerminalQueue, {durable: false});
            console.log("Waiting for consuming messages...");
            channel.consume(userTerminalQueue, (msg) => {
                console.log("Received alert: " + msg.content.toString());

                sendMessageToUser(msg);
            });
        });
    });
}

bot.start((ctx) => {
    console.log("The bot has been started");
    chatId = ctx.update.message.chat.id;
    userName = ctx.update.message.chat.first_name;
    ctx.reply(`Hi ${userName}!\nI'm CallThePoliceBot, I'm paying attention to your things!`)
        .then(() => {
            ctx.reply(`Pay attention to not stop me if you want me to work properly!\n`);

            listenForMessages();
        });
});

bot.action("callThePolice", (ctx) => {
    amqp.connect(url, (connectionError, connection) => {
        if (connectionError) {
            throw connectionError;
        }

        connection.createChannel((channelError, channel) => {
            if (channelError) {
                throw channelError;
            }

            const policeQueue = "notify/police";
            const key = "security";
            channel.assertExchange(policeQueue, "topic", {durable: false});

            const alert = `The customer ${userName} has got an alert from his ${userSensor} in the ${userLocation}!`;
            channel.publish(policeQueue, key, Buffer.from(alert));
            console.log(`Sent ${alert} on ${policeQueue}/${key}`);
            channel.close();
        });
    });

    ctx.deleteMessage();
    ctx.reply("I've notified the police, rest assured!");
});

bot.action("isOk", (ctx) => {
    ctx.deleteMessage();
    ctx.reply("I'm glad everything is fine!");
});

bot.launch().then(() => console.log("The user bot is running..."));