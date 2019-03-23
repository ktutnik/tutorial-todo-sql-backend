import Koa from "koa"
import req from "supertest"

import { createApp } from "../src/app"
import { db } from "../src/model/db"
import { createRandomUser, createUser } from "./helper"


/*
Method	        Route	                    Authorize To
POST	        /api/v1/users	            public
PUT DELETE GET	/api/v1/users/:id	        Admin or Owner
GET	            /api/v1/users?offset&limit	Admin
*/

describe("Users Authorization", () => {

    let koa: Koa
    let admin: { token: string, id: number }
    let user: { token: string, id: number }
    beforeAll(async () => {
        koa = await createApp({ mode: "production" })
        admin = await createUser("Admin")
        user = await createUser("User")
    }, 100000)

    afterAll(async () => {
        db.destroy()
    })

    it("Should authorize POST /api/v1/users to public", async () => {
        await req(koa.callback())
            .post("/api/v1/users")
            .send(await createRandomUser())
            .expect(200)
    })

    it("Should authorize GET /api/v1/users/:id to admin or owner", async () => {
        const owner = await createUser("User")
        const otherUser = await createUser("User")
        await req(koa.callback())
            .get(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${owner.token}`)
            .expect(200)
        await req(koa.callback())
            .get(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .expect(200)
        await req(koa.callback())
            .get(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${otherUser.token}`)
            .expect(401)
        await req(koa.callback())
            .get(`/api/v1/users/${owner.id}`)
            .expect(403)
    })

    it("Should authorize PUT /api/v1/users/:id to admin or owner", async () => {
        const owner = await createUser("User")
        const otherUser = await createUser("User")
        await req(koa.callback())
            .put(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send(await createRandomUser())
            .expect(200) //owner OK
        await req(koa.callback())
            .put(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .send(await createRandomUser())
            .expect(200) //admin OK
        await req(koa.callback())
            .put(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${otherUser.token}`)
            .send(await createRandomUser())
            .expect(401) //other user UNAUTHORIZED
        await req(koa.callback())
            .put(`/api/v1/users/${owner.id}`)
            .send(await createRandomUser())
            .expect(403) //non login user FORBIDDEN
    })

    it("Should authorize DELETE /api/v1/users/:id to admin or owner", async () => {
        const owner = await createUser("User")
        const otherUser = await createUser("User")
        await req(koa.callback())
            .delete(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${owner.token}`)
            .expect(200) //owner OK
        await req(koa.callback())
            .delete(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .expect(200) //admin OK
        await req(koa.callback())
            .delete(`/api/v1/users/${owner.id}`)
            .set("Authorization", `Bearer ${otherUser.token}`)
            .expect(401) //other user UNAUTHORIZED
        await req(koa.callback())
            .delete(`/api/v1/users/${owner.id}`)
            .expect(403) //non login user FORBIDDEN
    })
})