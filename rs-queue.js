const {EventEmitter} = require("events")
const redis = require("redis");

const client = redis.createClient({
    url: "redis://127.0.0.1:6379"
});

class RsQueue extends EventEmitter {
    option = {
        jobsKey: "rq:jobs",
        queueKey: "rq:queue",
        doneKey: "rq:done",
        queue: "rq:queue",
        retryDelay: 1000
    }

    constructor(queueName, options) {
        super(queueName)
        this.state = {
            done: {},
            queue: [],
            jobs: {}
        }

        if (options) {
            this.option.retryDelay = options.retryDelay
        }

        if (queueName) {
            this.option.jobsKey = `rq:${queueName}:jobs`
            this.option.queueKey = `rq:${queueName}:queue`
            this.option.doneKey = `rq:${queueName}:done`
            this.option.queueName = queueName.queueName
        }

        this.connectRedis()
    }

    async connectRedis() {
        try {
            await client.connect()
            this.client = client
            this.state.jobs = await client.hGetAll(this.option.jobsKey);
            let jobKeys = Object.keys(this.state.jobs);
            this.state.queue = jobKeys
            if (this.state.queue.length) {
                this.interval()
            }
        } catch (ex) {
            console.log(ex?.message)
        }
    }

    intervalId = 0;

    async createJob(job) {
        try {
            await client.hSet(this.option.jobsKey, {
                [job.id]: JSON.stringify(job)
            })

            this.state.jobs[job.id] = JSON.stringify(job)
            this.state.queue.push(job.id)
            this.emit("data", this.state.jobs[job.id])
            this.queueProcess()

        } catch (ex) {
            console.log(ex?.message)
        }
    }

    slats() {
        const doneCount = Object.keys(this.state.done).length;
        const pendingCount = Object.keys(this.state.jobs).length;

        const green = "\x1b[32m";
        const yellow = "\x1b[33m";
        const reset = "\x1b[0m";

        console.log(`
   ${green}Done: ${doneCount}${reset}
   ${yellow}Jobs: ${pendingCount}${reset}
    `);
    }

    interval() {
        try {
            clearInterval(this.intervalId);
            this.intervalId = setTimeout(async () => {
                await this.queueProcess()
            }, this.option.retryDelay)
        } catch (ex) {
            console.log(ex?.message)
        }
    }

    async queueProcess() {
        try {
            const jobs = this.state.jobs;
            let queueTask = this.state.queue[0]
            if (!queueTask) return clearInterval(this.intervalId)
            const jobValue = JSON.parse(jobs[queueTask])
            this.emit("processing", jobValue, async function (isDone) {
                if (isDone) {
                    delete this.state.jobs[queueTask]
                    await client.hDel(this.option.jobsKey, queueTask)
                    await client.lPush(this.option.doneKey, queueTask)
                    this.state.done[queueTask] = jobs[queueTask]
                    this.state.queue.shift()
                    this.emit("done", this.state)
                } else {
                    this.state.queue.shift()
                    this.state.queue.push(queueTask)
                }

                if (this.state.queue?.length) {
                    this.interval()
                }

            }.bind(this))
        } catch (ex) {
            console.log(ex?.message)
        }
    }
}


let queue = new RsQueue("test", {
    retryDelay: 500,
})

queue.on("data", function (data) {
    console.log(data)
})

queue.on("processing", async function (data, done) {
    console.log("currently processing: ", data)
    await sleep(1000)
    done(false)
})

queue.on("done", function (data) {
    queue.slats()
})


function createTask(name, id) {
    queue.createJob({
        id: id, data: name
    })
}

async function makeTransaction(name) {
    const id = name + "--";
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
const sleep = require("./sleep");

const rl = readline.createInterface({
    input: process.stdin, output: process.stdout
});

function askUser() {
    rl.question('Press Job name \n', (answer) => {
        makeTransaction(answer)
        askUser();
    });
}

askUser()
