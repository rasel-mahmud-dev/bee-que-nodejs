


const Queue = require('bull');

const audioQueue = new Queue('audioQueue transcodinsg', 'redis://127.0.0.1:6379');

audioQueue.getJobCounts().then(a=>{
    console.log(a)
})


audioQueue.process(function (job, done) {
    // transcode audio asynchronously and report progress
    // job.progress(42);


    console.log(job)

    // done(null)
    // or give an error if error

    done(new Error('error transcoding'));

});

audioQueue.on("waiting", (a)=>{
    console.log( "edf")
})


audioQueue.on("active", (a)=>{
    console.log( "edf")
})


audioQueue.on("failed", (a)=>{
    console.log(a.data, "failed")
    // audioQueue.add(a.data );
})

audioQueue.getJobs().then(r => {
    let items = r.map(rr=>rr.data)
    console.log(items.length)
})


//
// function askUser() {
//     rl.question('Press T to trigger \n', (answer) => {
//         audioQueue.add({ audio: 'data ' + Date.now()  });
//         askUser();
//     });
// }
//
// askUser()

setInterval(()=>{
    // audioQueue.add({ audio: 'data ' + Date.now()  });
}, 1000)