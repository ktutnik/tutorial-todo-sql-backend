import Koa from "koa"
import req from "supertest"

import { createApp } from "../src/app"
import { db } from "../src/model/db"
import { createTodo, createUser } from "./helper"


/*
Method	        Route	                    Authorize To
GET	            /	                        public
POST	        /auth/login	                public
POST	        /api/v1/todos	            Authenticated
GET	            /api/v1/todos/:id	        Authenticated
PUT DELETE	    /api/v1/todos/:id	        Admin or Owner
GET	            /api/v1/todos?offset&limit	Authenticated
POST	        /api/v1/users	            public
PUT DELETE GET	/api/v1/users/:id	        Admin or Owner
GET	            /api/v1/users?offset&limit	Admin
*/


describe("Todos Authorization", () => {

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

    it("Should authorize / to public", async () => {
        await req(koa.callback())
            .get("/")
            .expect(200)
    })

    it("Should authorize /auth/login to public", async () => {
        await req(koa.callback())
            .post("/auth/login")
            .send({ email: "admin@todo.app", password: "123456" })
            .expect(200)
    })

    it("Should authorize POST /api/v1/todos to authenticated user", async () => {
        await req(koa.callback())
            .post("/api/v1/todos")
            .set("Authorization", `Bearer ${user.token}`)
            .send({ todo: "Lorem ipsum dolor sit" })
            .expect(200)
        await req(koa.callback())
            .post("/api/v1/todos")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ todo: "Lorem ipsum dolor sit" })
            .expect(200)
        await req(koa.callback())
            .post("/api/v1/todos")
            .send({ todo: "Lorem ipsum dolor sit" })
            .expect(403)
    })

    it("Should authorize GET /api/v1/todos/:id to authenticated user", async () => {
        const id = await createTodo(user.id)
        await req(koa.callback())
            .get(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        await req(koa.callback())
            .get(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .expect(200)
        await req(koa.callback())
            .get(`/api/v1/todos/${id}`)
            .expect(403)
    })

    it("Should authorize PUT /api/v1/todos/:id to admin or owner", async () => {
        const id = await createTodo(user.id)
        const otherUser = await createUser("User")
        await req(koa.callback())
            .put(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${user.token}`)
            .send({todo: "Lorem ipsum dolor sit amet"})
            .expect(200) //owner OK
        await req(koa.callback())
            .put(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .send({todo: "Lorem ipsum dolor sit amet"})
            .expect(200) //admin OK
        await req(koa.callback())
            .put(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${otherUser.token}`)
            .send({todo: "Lorem ipsum dolor sit amet"})
            .expect(401) //other user UNAUTHORIZED
        await req(koa.callback())
            .put(`/api/v1/todos/${id}`)
            .send({todo: "Lorem ipsum dolor sit amet"})
            .expect(403) //non login user FORBIDDEN
    })

    it("Should authorize DELETE /api/v1/todos/:id to admin or owner", async () => {
        const id = await createTodo(user.id)
        const otherUser = await createUser("User")
        await req(koa.callback())
            .delete(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200) //owner OK
        await req(koa.callback())
            .delete(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${admin.token}`)
            .expect(200) //admin OK
        await req(koa.callback())
            .delete(`/api/v1/todos/${id}`)
            .set("Authorization", `Bearer ${otherUser.token}`)
            .expect(401) //other user UNAUTHORIZED
        await req(koa.callback())
            .delete(`/api/v1/todos/${id}`)
            .expect(403) //non login user FORBIDDEN
    })
})