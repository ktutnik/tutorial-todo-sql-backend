import bcrypt from "bcrypt"
import { authorize, route } from "plumier"

import { db } from "../../../model/db"
import { User } from "../../../model/domain"


function ownerOrAdmin() {
    return authorize.custom(async info => {
        const { role, user, parameters } = info
        return role.some(x => x === "Admin") || parameters[0] === user.userId
    }, "Admin|Owner")
}

export class UsersController {

    @authorize.public()
    @route.post("")
    async save(data: User) {
        const password = await bcrypt.hash(data.password, 10)
        return db("User").insert({ ...data, password, role: "User" })
    }

    @authorize.role("Admin")
    @route.get("")
    list(offset: number, limit: number) {
        return db("User").where({ deleted: 0 })
            .offset(offset).limit(limit)
            .orderBy("createdAt", "desc")
    }

    @ownerOrAdmin()
    @route.get(":id")
    get(id: number) {
        return db("User").where({ id }).first()
    }

    @ownerOrAdmin()
    @route.put(":id")
    async modify(id: number, data: User) {
        const password = await bcrypt.hash(data.password, 10)
        return db("User").update({ ...data, password }).where({ id })
    }

    @ownerOrAdmin()
    @route.delete(":id")
    delete(id: number) {
        return db("User").update({ deleted: 1 }).where({ id })
    }
}