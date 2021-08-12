var amqp = require('amqplib');

const url = "amqp://guest:guest@192.168.1.164:5672";
const policeQueue = "notify/police/terminal";

function notifyPolice(alert) {
    amqp.connect(url).then(function(conn) {
        return conn.createChannel().then(function(ch) {
            var ok = ch.assertQueue(policeQueue, {durable: false});
            return ok.then(function(_qok) {
                ch.sendToQueue(policeQueue, Buffer.from(alert));
                console.log(`Sent ${alert} on ${policeQueue}`);
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

    notifyPolice(alert);
};