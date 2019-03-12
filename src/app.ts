import Koa from "koa";
import Plumier, { Configuration, WebApiFacility, JwtAuthFacility } from "plumier";

export function createApp(config?: Partial<Configuration>): Promise<Koa> {
    return new Plumier()
        .set(config || {})
        .set(new WebApiFacility())
        .set(new JwtAuthFacility({ secret: process.env.JWT_SECRET }))
        .initialize()
}
