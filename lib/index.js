"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sinon_1 = require("sinon");
require("./types/sinon-mongo");
var sinon_mongo_1 = require("./sinon-mongo");
(0, sinon_mongo_1.install)(sinon_1.default);
