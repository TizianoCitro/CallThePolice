const amqp = require('amqplib');

const url = "amqp://guest:guest@192.168.1.164:5672";
const userTerminalQueue = "notify/user/terminal";

function bin2string(array) {
    let result = "";
    for (let i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

function notifyUser(alert) {
    amqp.connect(url).then(function(connection) {
        return connection.createChannel().then(function(channel) {
            const ok = channel.assertQueue(userTerminalQueue, {durable: false});
            return ok.then(function(_qok) {
                channel.sendToQueue(userTerminalQueue, Buffer.from(alert));
                console.log(`Sent ${alert} on ${userTerminalQueue}`);
                return channel.close();
            });
        }).finally(function() {
            connection.close();
        });
    }).catch(console.warn);
}

exports.handler = function(context, event) {
    const parsedEvent = JSON.parse(JSON.stringify(event));
    const alert = bin2string(parsedEvent.body.data);

    context.callback(alert);

    notifyUser(alert);
};