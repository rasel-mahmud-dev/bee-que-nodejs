const Queue = require('bee-queue');
const queue = new Queue('example');

const job = queue.createJob({x: 2, y: Date.now()});
job.save();


job.on('succeeded', (result) => {
    console.log(`Received result for job ${job.id}: ${result}`);
});


// Process jobs from many servers
queue.process(function (job, done) {
    console.log(`Processing job ${job.id}`);
    return done(null, job.data.x + job.data.y);
});

