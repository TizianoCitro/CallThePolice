# CallThePolice

## Introduction

The project aims to simulate a Smart Home Security System, which whenever detects something out of the ordinary notifies the user on a terminal of his/her preference. When the user receives the notification, he/she can choose between notifying the police station about what's happening or, if it's a false alarm, to ignore the notification.

For the purpose of demonstrating the project, the terminals, of both user and police, are being simulated by using Telegram bots: `CallThePoliceBot` and `ImThePoliceBot` respectively. Meanwhile, the sensor sending data is being simulated by using the function `notifyAlert`.

## Architecture

The project is composed by three functions:

- `NotifyAlert`: sends notification of an alert to the `notify/user` queue with routing key `security`.
- `NotifyUser`: receives and processes notification of an alert sent to the `notify/user` queue for the routing key `security` and sends the notification to the user terminal by communicating it to the `notify/user/terminal` queue.
- `NotifyPolice`: receives and processes notification of an alert sent to the `notify/police` queue for the routing key `security` and sends the notification to the user terminal by communicating it to the `notify/police/terminal` queue.

And two bots:

- `CallThePolice`: simulates the terminal where the user has decided to receive notifications sent by sensors at home. Whenever receives a message on the `notify/user/terminal` queue, it sends a message to the simulated terminal letting the user choosing between notifying the police or do nothing, in case of a false alarm.
- `ImThePolice`: simulates the terminal where the police receives notifications from the users who use the Smart Home Security Service. Whenever a message is sent to the `notify/police/terminal` queue, it sends a message to the simulated police terminal.

All of that is achieved by using `RabbitMQ`, `Nuclio` and `Docker`.

### RabbitMQ

RabbitMQ supports multiple messaging protocols and can be deployed to meet high-scale and high-availability requirements.

The used protocol is `AMQP` and the library used to interact with it is [AMQP](https://github.com/squaremo/amqp.node) .

To start a `RabbitMQ` instance with Docker:

```sh
$ docker run -p 9000:15672  -p 1883:1883 -p 5672:5672  cyrilix/rabbitmq-mqtt 
```

Then, browse to http://localhost:9000, and login using `guest` as username and `guest` as password, in order to access to the RabbitMQ console.

### Nuclio

Nuclio is High-Performance Serverless event and data processing platform.

To start a `Nuclio` instance with Docker:

```sh
$ docker run -p 8070:8070 -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp nuclio/dashboard:stable-amd64
```
Then, browse to http://localhost:8070 to access to Nuclio dashboard.

### Docker

Docker is a tool designed to make it easier to create, deploy, and run applications by using containers. Containers allow developers to package up an application with all of the parts it needs, such as libraries and other dependencies, and ship it all out as one package. Thanks to the container, the application will run on any other Linux machine regardless of any customized settings.

Unlike when using virtual machines, Docker containers use the same Linux kernel as the system that they're running on, which results in a significant performance boost.

Docker is used in the architecture to deploy the function in an application container and each of the functions is a Docker container that is listening on a socket port and can be invoked by any of the configurable triggers.

## How to use

The project uses `Node.js` extensively, so it is required to have it installed. `npm` and `Docker` are also required.

### Starting RabbitMQ

To start running the project, start Docker and then open yor terminal and type the following command to start an instance of RabbitMQ on Docker:

```sh
$ docker run -p 9000:15672  -p 1883:1883 -p 5672:5672  cyrilix/rabbitmq-mqtt 
```

### Starting Nuclio

Then, open a second terminal and type the following command to start an instance of Nuclio on Docker:

```sh
$ docker run -p 8070:8070 -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp nuclio/dashboard:stable-amd64
```

After your Nuclio instance has been successfully started, browse to http://localhost:8070 to access to Nuclio dashboard.
Follow these steps:

- Create a new project named `CallThePolice`
- Click on `Create Function` and then on `Import` to upload `notifyAlert`, `notifyUser` and `notifyPolice` functions by using `notify-alert.yaml`, `notify-user.yaml` and `notify-police.yaml` files respectively. You can find the files in `./yaml-function` folder.

### Creating Telegram bots

Now, you need to simulate the user and police terminals by creating Telegram bots. To do so, open Telegram and search for `BotFather`.

Follow these steps to create the bot CallThePolice:

- Type `/newBot`
- Specify `CallThePoliceBot` as a name for your bot
- Choose a unique id by following BotFather instruction
- Copy the token it gives to you and paste it in the `.env` file for the constant `USER_BOT_TOKEN`

Now, you have to create the bot ImThePolice and to do so you have to repeat what you did just few moments ago:

- Type `/newBot` in BotFather chat
- Specify `ImThePoliceBot` as a name for your bot
- Choose a unique id by following BotFather instruction
- Copy the token it gives to you and paste it in the `.env` file for the constant `POLICE_BOT_TOKEN`

### Install dependencies

Open the terminal and, from the root of the project folder, type:

```sh
$ npm install
```

### Running Telegram bots

Open another terminal window and type: 

```sh
$ cd src/bot/
```

And now you can run the two bots:

```sh
$ node call-the-police-bot.js
```

```sh
$ node im-the-police-bot.js
```

After you have successfully run the two bots, go to Telegram and type `/start` in both the chat of your previously created bots.  

## Try it

Open a tool for making HTTP requests, such as Postman, and make a POST request to the URL that Nuclio provides to you for the `notifyAlert` function by sending the following body as example:

```c
{
    "from": "Your beautiful camera",
    "location": "Your beautiful garden"
}
```

## Demo

Let's see now a short demo of the project.

![Demo](https://github.com/TizianoCitro/CallThePolice/blob/master/demo/Demo.gif)
