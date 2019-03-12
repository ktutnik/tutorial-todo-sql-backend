import { HttpStatusError, middleware, route, bind } from "plumier"

import { db } from "../../../model/db"
import { LoginUser, Todo } from "../../../model/domain"

function ownerOrAdmin() {
    return middleware.use({
        execute: async invocation => {
            const { state, parameters } = invocation.context
            const user: LoginUser = state.user;
            //parameters is requested method parameter values
            const id: number = parameters![0];
            const todo: Todo = await db("Todo").where({ id }).first()
            if (user.role === "Admin" || todo && todo.userId === user.userId)
                return invocation.proceed()
            else
                throw new HttpStatusError(401, "Unauthorized")
        }
    })
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