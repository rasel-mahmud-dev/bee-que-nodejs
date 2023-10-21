const redis = require('redis');


async function main() {
    try{
        const client = redis.createClient({
            url: "redis://127.0.0.1:6379"
        });


        const article = {
            id: '123456',
            name: 'Using Redis Pub/Sub with Node.js',
            blog: 'Logrocket Blog',
        };

        await client.connect();

        client.set("name", Date.now())
        let result = await client.get("name")

        console.log(result)


        await client.publish('article', JSON.stringify(article));
        //
        // await subscriber.subscribe('article', (message) => {
        //     console.log(message); // 'message'
        // });
        //


        // Consumer
        const subscriber = redis.createClient({
            url: "redis://127.0.0.1:6379"
        });
        subscriber.subscribe("article");
        console.log('Waiting for messages...');
        subscriber.on('article', (channel, message) => {
            console.log(`Received: ${message}`);
        });



    } catch (ex){
        console.log(ex)
    }
}

main()

