import * as sinon from "sinon"
import "./types/sinon-mongo"
import { install } from "./sinon-mongo"
import { $orMatch } from "./helpers"

export { $orMatch }

install(sinon)
