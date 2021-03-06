import { authorize, bind, route } from "plumier"

import { db } from "../../../model/db"
import { LoginUser, Todo } from "../../../model/domain"

function ownerOrAdmin() {
    return authorize.custom(async ({role, parameters, user}) => {
        const todo: Todo = await db("Todo").where({ id: parameters[0] }).first()
        return role.some(x => x === "Admin") || todo && todo.userId === user.userId
    }, "Admin|Owner")
}

export class TodosController {

    @route.post("")
    save(data: Todo, @bind.user() user: LoginUser) {
        return db("Todo").insert(<Todo>{ ...data, userId: user.userId })
    }

    @route.get("")
    list(offset: number, limit: number) {
        return db("Todo").where({ deleted: 0 })
            .offset(offset).limit(limit)
            .orderBy("createdAt", "desc")
    }

    @route.get(":id")
    get(id: number) {
        return db("Todo").where({ id }).first()
    }

    @ownerOrAdmin()
    @route.put(":id")
    modify(id: number, data: Todo) {
        return db("Todo").update(data).where({ id })
    }

    @ownerOrAdmin()
    @route.delete(":id")
    delete(id: number) {
        return db("Todo").update({ deleted: true }).where({ id })
    }
}