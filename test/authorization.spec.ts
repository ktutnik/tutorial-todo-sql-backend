import req from "supertest"
import { createApp } from "../src/app";

describe("Authorization", () => {
    describe("TodosController", async () => {
        const koa = await createApp()
        req(koa.callback())
            .get("/")
    })
})