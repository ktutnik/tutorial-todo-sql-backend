import * as Knex from "knex";
import { baseTable } from "./v1.0.0";

export async function up(knex: Knex): Promise<any> {
    return knex.transaction(trx => {
        return trx.schema
            .createTable("Audit", t => {
                baseTable(t, trx)
                t.bigInteger("userId").unsigned().references("id").inTable("User")
                t.string("resource")
                t.string("action")
                t.string("status")
                t.string("data")
            })
    })
};

export async function down(knex: Knex): Promise<any> {
    return knex.transaction(trx => {
        return trx.schema
            .dropTable("Audit")
    })
};
