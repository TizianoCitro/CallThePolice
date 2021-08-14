const amqp = require('amqplib');

const url = "amqp://guest:guest@192.168.1.164:5672";
const userQueue = "notify/user";
const key = "security"

function bin2string(array) {
    let result = "";
    for (let i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

function notifyAlert(alert) {
    amqp.connect(url).then(function (connection) {
        return connection.createChannel().then(function (channel) {
            const ok = channel.assertExchange(userQueue, "topic", {durable: false});
            return ok.then(function () {
                channel.publish(userQueue, key, Buffer.from(alert));
                console.log(`Sent ${alert} on ${userQueue}/${key}`);
                return channel.close();
            });
        }).finally(function () {
            connection.close();
        })
    }).catch(console.log);
}

exports.handler = function(context, event) {
    const parsedEvent = JSON.parse(JSON.stringify(event));
    const alert = bin2string(parsedEvent.body.data);

    notifyAlert(alert);

    context.callback(alert);
};