import { Invocation, ActionResult, DefaultFacility, PlumierApplication, Middleware, Class } from "plumier";
import { Context } from "koa";
import { Audit, AuditAction, User } from "../model/domain";
import { db } from "../model/db";


// --------------------------------------------------------------------- //
// ------------------------------- HELPER ------------------------------ //
// --------------------------------------------------------------------- //

const CensorshipMap = new Map<Class, (x: any) => any>([
    [User, (x: User) => (<User>{ ...x, password: "*****", email: "*****" })]
])

const AuditActionMap = new Map<string, AuditAction>([
    ["get", "Read"],
    ["post", "Add"],
    ["put", "Modify"],
    ["delete", "Delete"]
])

function censor(context: Context) {
    const parameters = context.parameters || []
    const types = context.route!.action.parameters.map(x => x.type)
    return parameters.map((x, i) => {
        const fn = CensorshipMap.get(types[i])
        return fn ? fn(x) : x;
    })
}

function createAudit(context: Context, status: "Success" | "Error") {
    const { route, state, method } = context
    const controller = route!.controller.name
    const resource = controller.substr(0, controller.lastIndexOf("Controller"))
    const data = JSON.stringify(censor(context))
    return new Audit(state.userId, resource, AuditActionMap.get(method.toLowerCase()) || "Unknown", status, data)
}

// --------------------------------------------------------------------- //
// ----------------------------- MIDDLEWARE ---------------------------- //
// --------------------------------------------------------------------- //

export class UserActivityMiddleware implements Middleware {
    async execute(next: Readonly<Invocation>): Promise<ActionResult> {
        if (next.context.route && next.context.state.user) {
            try {
                const result = await next.proceed()
                await db("Audit").insert(createAudit(next.context, "Success"))
                return result
            }
            catch (e) {
                await db("Audit").insert(createAudit(next.context, "Error"))
                throw e;
            }
        }
        else return next.proceed()
    }
}

// --------------------------------------------------------------------- //
// ------------------------------ FACILITY ----------------------------- //
// --------------------------------------------------------------------- //

export class UserActivityFacility extends DefaultFacility {
    setup(app: Readonly<PlumierApplication>): void {
        app.use(new UserActivityMiddleware())
    }
}