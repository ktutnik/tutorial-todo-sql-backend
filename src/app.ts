import Koa from "koa";
import Plumier, { Configuration, WebApiFacility } from "plumier";
import { JwtAuthFacility } from "@plumier/jwt"
import { UserActivityFacility } from "./module/user-activity";

export function createApp(config?: Partial<Configuration>): Promise<Koa> {
    return new Plumier()
        .set(config || {})
        .set(new WebApiFacility())
        .set(new JwtAuthFacility({ secret: process.env.JWT_SECRET }))
        .set(new UserActivityFacility())
        .initialize()
}
