const amqp = require("amqplib/callback_api");

const url = "amqp://guest:guest@192.168.1.164:5672";

const userQueue = "notify/user";
const key = "security"

const notifyAlert = (alert) => {
    amqp.connect(url, (connectionError, connection) => {
        if (connectionError)
            throw connectionError;

        connection.createChannel((channelError, channel) => {
            if (channelError)
                throw channelError;

            channel.assertExchange(userQueue, "topic", {durable: false});

            channel.publish(userQueue, key, Buffer.from(alert));

            console.log(`Sent ${alert} on ${userQueue}/${key}`);

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

    notifyAlert(alert);

    context.callback(alert);
}