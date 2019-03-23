import bcrypt from "bcrypt"
import { sign } from "jsonwebtoken"
import { HttpStatusError, route, authorize } from "plumier"

import { db } from "../model/db"
import { LoginUser, User } from "../model/domain"

export class AuthController {
    @authorize.public()
    @route.post()
    async login(email: string, password: string) {
        const user: User | undefined = await db("User").where({ email, deleted:0 }).first()
        if (user && await bcrypt.compare(password, user.password)) {
            const token = sign(<LoginUser>{ userId: user.id, role: user.role }, process.env.JWT_SECRET)
            return { token }
        }
        else throw new HttpStatusError(403, "Invalid username or password")
    }
}