import { authorize, val } from "plumier"
import reflect from "tinspector"

import { uniqueEmail } from "../validator/unique-email-validator"

export type UserRole = "User" | "Admin"
export type AuditAction = "Read" | "Add" | "Modify" | "Delete" | "Unknown"

@reflect.parameterProperties()
export class Domain {
    constructor(
        @authorize.role("Machine")
        public id: number = 0,
        @authorize.role("Machine")
        public createdAt: Date = new Date(),
        @val.optional()
        public deleted:boolean = false
    ) { }
}

@reflect.parameterProperties()
export class User extends Domain {
    constructor(
        @val.email()
        @uniqueEmail()
        public email: string,
        public password: string,
        public name: string,
        @authorize.role("Admin")
        public role: UserRole
    ) { super() }
}

@reflect.parameterProperties()
export class Todo extends Domain {
    constructor(
        public todo: string,
        @authorize.role("Machine")
        public userId:number,
        @val.optional()
        public completed: boolean = false
    ) { super() }
}

@reflect.parameterProperties()
export class LoginUser {
    constructor(
        public userId:number,
        public role: UserRole
    ){}
}

@reflect.parameterProperties()
export class Audit extends Domain {
    constructor(
        public userId:number ,
        public resource:string,
        public action: AuditAction,
        public status: "Success" | "Error",
        public data:string
    ){ super() }
}