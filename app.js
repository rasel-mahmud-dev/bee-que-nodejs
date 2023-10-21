// const Queue = require('bee-queue');
// const queue = new Queue('example', {
//     prefix: 'bq',
//     stallInterval: 5000,
//     nearTermWindow: 1200000,
//     delayedDebounce: 1000,
//     redis: {
//         host: '127.0.0.1',
//         port: 6379,
//         db: 0,
//         options: {},
//     },
//     isWorker: true,
//     getEvents: true,
//     sendEvents: true,
//     storeJobs: true,
//     ensureScripts: true,
//     activateDelayedJobs: false,
//     removeOnSuccess: false,
//     removeOnFailure: false,
//     redisScanCount: 100,
// });
//
// // const {createInstance, manager} = require("./db")
//
// function isOnline() {
//     return new Promise(async (resolve, reject) => {
//         try {
//             // await createInstance(1000);
//             resolve(true)
//         } catch (ex) {
//             resolve(false)
//         }
//
//     })
// }
//
// function createTask(name, id) {
//     const job = queue.createJob({name: name, id});
//     job.setId(id)
//     job.save();
//
//     job.backoff("fixed", 1000)
//     job.on('succeeded', (result) => {
//         console.log(`Received result for job ${job.id}: ${result}`);
//     });
// }
//
// async function makeTransaction(name) {
//     const id = name + "--" + Date.now();
//     if (false) {
//         // create transaction ...
//         insertInDatabase(name, id)
//     } else {
//         createTask(name, id)
//     }
// }
//
// function insertInDatabase(data, taskId) {
//     return new Promise(async (resolve, reject) => {
//         try{
//             // let Repo = manager.getRepository("Task")
//             // let a = await Repo.save({
//             //     job_id: taskId,
//             //     title: data,
//             // })
//             //
//             // console.log(a)
//             resolve(true)
//         } catch (ex){
//             console.log(ex)
//         }
//
//     })
// }
//
// // Process jobs from many servers
// queue.process(async function (job, done) {
//     console.log(`Processing job ${job.id}`);
//     // let result = await insertInDatabase(job.data)
//     // done(null)
// });
//
//
// const readline = require("readline");
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
//
// function askUser() {
//     rl.question('Press T to trigger \n', (answer) => {
//         makeTransaction(answer)
//         askUser();
//     });
// }
//
// askUser()

