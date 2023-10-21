var EntitySchema = require("typeorm").EntitySchema

 const Task = new EntitySchema({
    name: "Task", // Will use table name `post` as default behaviour.
    tableName: "tasks", // Optional: Provide `tableName` property to override the default behaviour for table name.
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        job_id: {
            type: "varchar",
        },
        title: {
            type: "text",
        },
    }
})
module.exports = Task
