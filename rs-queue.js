const {EventEmitter} = require("events")
const redis = require("redis");

const client = redis.createClient({
    url: "redis://127.0.0.1:6379"
});

class RsQueue extends EventEmitter {
    option = {
        jobsKey: "rq:jobs", queueKey: "rq:queue", doneKey: "rq:done", queue: "rq:queue"
    }

    constructor(queueName) {
        super(queueName)
        this.state = {
            done: {}, queue: [], jobs: {}, error: {}
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
            await client.lTrim(this.option.queueKey, 1, 0)

            let jobKeys = Object.keys(this.state.jobs);

            for (let jobKey of jobKeys) {
                await client.lPush(this.option.queueKey, jobKey)
                this.state.queue.push(jobKey)
            }

            let listLen = await client.lLen(this.option.queueKey)
            if (listLen) {
                this.interval(this.state.queue)
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

            if (!this.state.queue.includes(job.id)) {
                await client.lPush(this.option.queueKey, job.id)
                this.state.queue.push(job.id)
            }

            this.emit("data", this.state.jobs[job.id])
            this.queueProcess()
        } catch (ex) {
            console.log(ex?.message)
        }
    }

    slats() {
        const doneCount = Object.keys(this.state.done).length;
        const pendingCount = Object.keys(this.state.jobs).length;
        const errorCount = Object.keys(this.state.error).length;

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
        try {
            clearInterval(this.intervalId);
            this.intervalId = setTimeout(async () => {
                await this.queueProcess(this.state.jobs)
            }, 3000)
        } catch (ex) {
            console.log(ex?.message)
        }
    }

    async queueProcess() {
        try {
            const jobs = this.state.jobs;

            let firstTask = await client.lPop(this.option.queueKey)

            this.emit("process", jobs[firstTask], async function (isDone) {
                if (isDone) {
                    delete this.state.jobs[firstTask]
                    await client.hDel(this.option.jobsKey, firstTask)
                    await client.lPush(this.option.doneKey, firstTask)
                    this.state.done[firstTask] = jobs[firstTask]

                } else {
                    await client.rPush(this.option.queueKey, firstTask)
                    this.interval()
                }

                this.emit("done", this.state)

            }.bind(this))
        } catch (ex) {
            console.log(ex?.message)
        }
    }
}

let queue = new RsQueue("test")

queue.on("data", function (data) {
    console.log(data)
})

queue.on("process", function (data, done) {
    console.log("currently processing: " + Date.now(), data)
    done(false)
})

queue.on("done", function (data) {
    // console.log("Done job", data)
})

queue.slats()

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
