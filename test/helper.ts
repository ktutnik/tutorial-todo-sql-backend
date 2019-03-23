import bcrypt from "bcrypt"
import { sign } from "jsonwebtoken"
import shortid from "shortid"

import { db } from "../src/model/db"
import { LoginUser, Todo, User, UserRole } from "../src/model/domain"


export async function createRandomUser(opt?: Partial<User>) {
    const password = await bcrypt.hash("123456", 10)
    const email = `user-${shortid.generate()}@todo.app`
    return <User>{ email, password, name: "Testing User", ...opt }
}

export async function createUser(role: UserRole) {
    const randomUser = await createRandomUser({role})
    const user = await db("User").insert(randomUser)
    return { token: sign(<LoginUser>{ userId: user[0], role }, process.env.JWT_SECRET), id: user[0] }
}

export async function createTodo(userId: number) {
    const todo = await db("Todo").insert(<Todo>{ todo: "Lorem ipsum", userId })
    return todo[0] as number
}


