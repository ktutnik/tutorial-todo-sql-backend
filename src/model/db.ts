import knex from "knex"


require("dotenv").config()

export const db = knex({
    client: "mysql2",
    connection: process.env.DB_URI
})