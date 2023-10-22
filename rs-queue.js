const {EventEmitter} = require("events")
const redis = require("redis");

const client = redis.createClient({
    url: "redis://127.0.0.1:6379"
});

class RsQueue extends EventEmitter {
    option = {
        queueName: ""
    }

    constructor(props) {
        super(props)
        this.queue = {
            active: [],
            done: {},
            jobs: {},
            error: {}
        }


        if (props?.queueName) {
            this.option.queueName = props.queueName
        }

        this.connectRedis()


    }

    async connectRedis() {
        await client.connect()
        this.client = client

        if (this.queue.active.length) {
            this.interval(this.queue.active)
        }

    }

    intervalId = 0;

    async createJob(job) {
        this.queue.jobs[job.id] = JSON.stringify(job)
        this.queue.active.push(job.id)
        this.emit("data", this.queue.jobs[job.id])
        this.queueProcess(this.queue.jobs)
    }

    slats() {
        const doneCount = Object.keys(this.queue.done).length;
        const pendingCount = Object.keys(this.queue.jobs).length;
        const errorCount = Object.keys(this.queue.error).length;

        // Define colors using ANSI escape codes
        const green = "\x1b[32m";
        const yellow = "\x1b[33m";
        const red = "\x1b[31m";
        const reset = "\x1b[0m";

        console.log(`
   ${green}Done: ${doneCount}${reset}
   ${yellow}Jobs: ${pendingCount}${reset}
   ${red}Error: ${errorCount}${reset}
    `);
    }

    interval() {
        clearInterval(this.intervalId);
        this.intervalId = setTimeout(() => {
            this.queueProcess(this.queue.jobs)
        }, 2000)
    }

    queueProcess(jobs) {
        let firstTask = this.queue.active[0]
        this.emit("process", jobs[firstTask], function (isDone) {
            if (isDone) {
                let doneJob = jobs[firstTask]
                this.queue.done[firstTask] = doneJob
                delete jobs[firstTask]
                this.queue.active.shift()
            } else {
                this.queue.active.shift()
                this.queue.active.push(firstTask)
                this.interval(this.queue.active)
            }

            this.emit("done", this.queue)

        }.bind(this))
    }
}

let queue = new RsQueue({queueName: "test"})

queue.on("data", function (data) {
    console.log(data)
})

queue.on("process", function (data, done) {
    console.log("currently processing: " + Date.now(), data)
    done(false)
})

queue.on("done", function (data) {
    console.log("Done job", data)
})

queue.slats()

function createTask(name, id) {
    queue.createJob({
        id: id,
        data: name
    })
}

async function makeTransaction(name) {
    const id = name + "--" + Date.now();
    if (false) {
        // create transaction ...
        insertInDatabase(name, id)
    } else {
        createTask(name, id)
    }
}

function insertInDatabase(data, taskId) {
    return new Promise(async (resolve, reject) => {
        try {
            // let Repo = manager.getRepository("Task")
            // let a = await Repo.save({
            //     job_id: taskId,
            //     title: data,
            // })
            //
            // console.log(a)
            resolve(true)
        } catch (ex) {
            console.log(ex)
        }

    })
}

const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askUser() {
    rl.question('Press Job name \n', (answer) => {
        makeTransaction(answer)
        askUser();
    });
}

askUser()
