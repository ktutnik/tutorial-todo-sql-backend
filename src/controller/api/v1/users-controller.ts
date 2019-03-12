import bcrypt from "bcrypt"
import { authorize, HttpStatusError, middleware, route } from "plumier"

import { db } from "../../../model/db"
import { LoginUser, User } from "../../../model/domain"


function ownerOrAdmin() {
    return middleware.use({
        execute: async invocation => {
            const { state, parameters } = invocation.context
            //if no user then proceed. 
            //this condition applied to public route POST /api/v1/users
            if(!state.user) return invocation.proceed()
            const loginUser: LoginUser = state.user;
            const id: number = parameters![0];
            const reqUser: User = await db("User").where({ id }).first()
            if (loginUser.role === "Admin" || reqUser && reqUser.id === loginUser.userId)
                return invocation.proceed()
            else
                throw new HttpStatusError(401, "Unauthorized")
        }
    })
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