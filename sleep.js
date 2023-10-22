function sleep(time = 1000){
    return new Promise((r, j)=>{
        setTimeout(()=>r(), time)
    })
}

module.exports = sleep

