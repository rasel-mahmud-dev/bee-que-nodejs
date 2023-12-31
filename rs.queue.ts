import {EventEmitter} from "events";
import redis from "redis";


interface RsQueueOptions {
    jobsKey: string;
    queueKey: string;
    doneKey: string;
    retryDelay?: number;
    redisUrl?: string;
}


class RsQueue extends EventEmitter {

    private option: RsQueueOptions = {
        jobsKey: "rq:jobs",
        queueKey: "rq:queue",
        doneKey: "rq:done",
        retryDelay: 100,
        redisUrl: "",
    };


    private intervalId: NodeJS.Timeout | undefined;

    private state = {
        done: {} as Record<string, string>,
        queue: [] as string[],
        jobs: {} as Record<string, string>,
    };

    private client: any | undefined;

    constructor(queueName: string, options: Partial<RsQueueOptions>) {
        super()
        this.state = {
            done: {},
            queue: [],
            jobs: {}
        }

        if (options) {
            this.option.retryDelay = options.retryDelay
            if (options.redisUrl) this.option.redisUrl = options.redisUrl
        }

        if (queueName) {
            this.option.jobsKey = `rq:${queueName}:jobs`
            this.option.queueKey = `rq:${queueName}:queue`
            this.option.doneKey = `rq:${queueName}:done`
        }

        this.connectRedis()
    }

    async connectRedis() {
        try {
            this.client = redis.createClient({
                url: this.option.redisUrl ?? "redis://127.0.0.1:6379"
            });

            await this.client.connect()
            this.state.jobs = await this.client.hGetAll(this.option.jobsKey);
            let jobKeys = Object.keys(this.state.jobs);
            this.state.queue = jobKeys
            if (this.state.queue.length) {
                this.interval()
            }
            this.emit("ready")
        } catch (ex: any) {
            console.log(ex?.message)
        }
    }

    public async createJob(jobId: string, value: any) {
        try {
            const jobValueStr = JSON.stringify(value)
            await this.client.hSet(this.option.jobsKey, {
                [jobId]: jobValueStr
            })

            this.state.jobs[jobId] = jobValueStr
            this.state.queue.push(jobId)
            this.emit("new", jobId, value)
            await this.queueProcess()

        } catch (ex: any) {
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
        } catch (ex: any) {
            console.log(ex?.message)
        }
    }

    async queueProcess() {
        try {
            const jobs = this.state.jobs;
            let queueTask = this.state.queue[0]
            if (!queueTask) return clearInterval(this.intervalId)
            const jobValue = JSON.parse(jobs[queueTask])

            this.emit("processing", queueTask, jobValue, async (isDone: boolean) => {
                if (isDone) {
                    delete this.state.jobs[queueTask]
                    await this.client.hDel(this.option.jobsKey, queueTask)
                    await this.client.lPush(this.option.doneKey, queueTask)
                    this.state.done[queueTask] = jobs[queueTask]
                    this.state.queue.shift()
                    this.emit("done", queueTask, jobValue)
                } else {
                    this.state.queue.shift()
                    this.state.queue.push(queueTask)
                    this.emit("fail", queueTask, jobValue)
                }

                if (this.state.queue?.length) {
                    this.interval()
                }

            })
        } catch (ex: any) {
            console.log(ex?.message)
        }
    }
}

export default RsQueue
