import knex from "knex"

export const db = knex({
    client: "mysql2",
    connection: process.env.DB_URI
})