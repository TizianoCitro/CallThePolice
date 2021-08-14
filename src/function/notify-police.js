const amqp = require('amqplib');
const aws = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');

const url = "amqp://guest:guest@192.168.1.164:5672";
const policeQueue = "notify/police/terminal";
const table = "PoliceReport";

aws.config.update({
    region: "us-east-1",
    endpoint: "http://192.168.1.164:8000",
    accessKeyId: "YOUR_KEY",
    secretAccessKey: "YOUR_SECRET"
});

const dynamoDB = new aws.DynamoDB();
const documentClient = new aws.DynamoDB.DocumentClient();

function bin2string(array) {
    let result = "";
    for (let i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

function createTableIfNotExists() {
    dynamoDB.listTables({})
        .promise()
        .then((data) => {
            const tableExists = data.TableNames
                .filter(name => {
                    return name === table;
                })
                .length > 0;

            if (tableExists) {
                return Promise.resolve();
            } else {
                const params = {
                    TableName: table,
                    KeySchema: [
                        { AttributeName: "id", KeyType: "HASH"},
                    ],
                    AttributeDefinitions: [
                        { AttributeName: "id", AttributeType: "S" }
                    ],
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 3,
                        WriteCapacityUnits: 3
                    }
                };
                return dynamoDB.createTable(params).promise();
            }
        });
}

function savePoliceReport(alert) {
    const params = {
        TableName: table,
        Item: {
            id: uuidv4().toString(),
            alert
        }
    };

    documentClient.put(params, (err, data) => {
        if (err) {
            console.error(`Unable to add item due to error: ${JSON.stringify(err, null, 2)}`);
        } else {
            console.log(`Added item: ${JSON.stringify(data, null, 2)}`);
        }
    });
}

function notifyPolice(alert) {
    amqp.connect(url).then(function(connection) {
        return connection.createChannel().then(function(channel) {
            const ok = channel.assertQueue(policeQueue, {durable: false});
            return ok.then(function(_qok) {
                channel.sendToQueue(policeQueue, Buffer.from(alert));
                console.log(`Sent ${alert} on ${policeQueue}`);

                savePoliceReport(alert);
                console.log(`Saved ${alert} in ${table}`);

                return channel.close();
            });
        }).finally(function() {
            connection.close();
        });
    }).catch(console.warn);
}

exports.handler = async function(context, event) {
    const parsedEvent = JSON.parse(JSON.stringify(event));
    const alert = bin2string(parsedEvent.body.data);

    await createTableIfNotExists();

    context.callback(alert);

    notifyPolice(alert);
};