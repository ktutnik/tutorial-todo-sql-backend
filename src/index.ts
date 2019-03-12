import dotenv from "dotenv"

import { createApp } from "./app"

dotenv.load()

const port = process.env.PORT || 8000;
createApp()
    .then(x => x.listen(port))
    .then(x => console.log(`Server running http://localhost:${port}/`))
    .catch(e => console.error(e))