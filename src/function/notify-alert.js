var amqp = require('amqplib');

const url = "amqp://guest:guest@192.168.1.164:5672";
const userQueue = "notify/user";
const key = "security"

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

    amqp.connect(url).then(function(conn) {
        return conn.createChannel().then(function(ch) {
            var ok = ch.assertExchange(userQueue, 'topic', {durable: false});
            return ok.then(function() {
                ch.publish(userQueue, key, Buffer.from(alert));
                console.log(`Sent ${alert} on ${userQueue}/${key}`);
                return ch.close();
            });
        }).finally(function() { conn.close();  })
    }).catch(console.log);

    context.callback(alert);
};