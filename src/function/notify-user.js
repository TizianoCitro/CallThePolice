var amqp = require('amqplib');

const url = "amqp://guest:guest@192.168.1.164:5672";
const userTerminalQueue = "notify/user/terminal";

function notifyUser(alert) {
    amqp.connect(url).then(function(conn) {
        return conn.createChannel().then(function(ch) {
            var ok = ch.assertQueue(userTerminalQueue, {durable: false});
            return ok.then(function(_qok) {
                ch.sendToQueue(userTerminalQueue, Buffer.from(alert));
                console.log(`Sent ${alert} on ${userTerminalQueue}`);
                return ch.close();
            });
        }).finally(function() { conn.close(); });
    }).catch(console.warn);
}

function bin2string(array) {
    var result = "";
    for(var i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

exports.handler = function(context, event) {
    var parsedEvent = JSON.parse(JSON.stringify(event));
    var alert = bin2string(parsedEvent.body.data);

    context.callback(alert);

    notifyUser(alert);
};