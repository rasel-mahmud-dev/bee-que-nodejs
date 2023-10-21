
// function creatInstance(timeout) {
//     return new DataSource({
//         type: "postgres",
//         host: '192.168.0.7',
//         port: "5432",
//         username: "postgres",
//         password: "sa",
//         database: "scott",
//         entities: [Task],
//         synchronize: true,
//         logging: process.env.ENABLE_DB_LOGGING == '1',
//         connectTimeoutMS: timeout ?? undefined
//     })
// }

// const CentralAppDataSource = creatInstance()
//
//
// CentralAppDataSource.initialize()
//     .then(() => {
//         // here you can start to work with your database
//         console.log('\x1b[32m Connected to central database \x1b[0m')
//     })
//     .catch((error) => console.log(error))
//
// module.exports = {
//     manager: CentralAppDataSource,
//     createInstance: creatInstance
// }