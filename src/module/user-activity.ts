import { Invocation, ActionResult, DefaultFacility, PlumierApplication, Middleware, Class } from "plumier";
import { Context } from "koa";
import { Audit, AuditAction, User } from "../model/domain";
import { db } from "../model/db";


// --------------------------------------------------------------------- //
// ------------------------------- HELPER ------------------------------ //
// --------------------------------------------------------------------- //

const CensorshipMap = new Map([
    [User, (x: User) => (<User>{ ...x, password: "*****", email: "*****" })]
])


function censor(context: Context) {
    const parameters = context.parameters || []
    const types = context.route!.action.parameters.map(x => x.type)
    return parameters.map((x, i) => {
        const fn = CensorshipMap.get(types[i])
        return fn ? fn(x) : x;
    })
}

const AuditActionMap = new Map([
    ["get", "Read"],
    ["post", "Add"],
    ["put", "Modify"],
    ["delete", "Delete"]
])

function createAudit(context: Context) {
    const { route, state, method } = context
    const controller = route!.controller.name
    const resource = controller.substr(0, controller.lastIndexOf("Controller"))
    return <Audit>{
        userId: state.user.userId,
        resource,
        action: AuditActionMap.get(method.toLowerCase()) || "Unknown",
        data: JSON.stringify(censor(context))
    }
}

// --------------------------------------------------------------------- //
// ----------------------------- MIDDLEWARE ---------------------------- //
// --------------------------------------------------------------------- //

export class UserActivityMiddleware implements Middleware {
    async execute(next: Readonly<Invocation>): Promise<ActionResult> {
        if (next.context.route && next.context.state.user) {
            const audit = createAudit(next.context)
            try {
                const result = await next.proceed()
                await db("Audit").insert(<Audit>{...audit, status: "Success"})
                return result
            }
            catch (e) {
                await db("Audit").insert(<Audit>{...audit, status: "Error"})
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