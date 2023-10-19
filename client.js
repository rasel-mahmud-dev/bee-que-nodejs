const net = require('net');
const readline = require("readline");

const port = 12348;
const host = '127.0.0.1';


let isConnecting = false;
let client;

function connect() {
    client = new net.Socket();
    if (!isConnecting) {
        isConnecting = true;

        client.on('data', function (data) {
            const message = data.toString().trim();
            console.log(message)
        });
        client.on('close', function () {
            console.log('Connection closed. Reconnecting...', Date.now());
            isConnecting = false;
        });
        client.on('error', function (error) {
            console.log('Connection closed. Reconnecting...', Date.now());
            isConnecting = false;
            setTimeout(connect, 2000);
        })


        client.on('connect', function () {
            isConnecting = true;
            console.log('Client successfully connected.');
            client.write("TRIGGER");
            askUser()
        });

        client.connect({port, host});
    }
}

connect()

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askUser() {
    rl.question('Press T to trigger \n', (answer) => {
        if (answer.toLowerCase() === "t") {
            client?.write("TRIGGER");
        }
        askUser();
    });
}