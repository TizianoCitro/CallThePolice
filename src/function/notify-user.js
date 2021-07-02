const amqp = require("amqplib/callback_api");

const url = "amqp://guest:guest@192.168.1.164:5672";

const userTerminalQueue = "notify/user/terminal";

const notifyUser = (alert) => {
    amqp.connect(url, (connectionError, connection) => {
        if (connectionError)
            throw connectionError;

        connection.createChannel((channelError, channel) => {
            if (channelError)
                throw channelError;

            channel.assertQueue(userTerminalQueue, {durable: false});

            channel.sendToQueue(userTerminalQueue, Buffer.from(alert));

            console.log(`Sent ${alert} on ${userTerminalQueue}`);

            channel.close();
        });
    });
}

const binaryToString = (array) => {
    let result = "";
    for (let i = 0; i < array.length; ++i)
        result += (String.fromCharCode(array[i]));

    return result;
}

exports.handler = (context, event) => {
    const parsedEvent = JSON.parse(JSON.stringify(event));
    const alert = binaryToString(parsedEvent.body.data);

    notifyUser(alert);
}