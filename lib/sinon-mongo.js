"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = void 0;
var Stream = require("stream");
var mongodb_1 = require("mongodb");
var install = function (sinon) {
    // Helpers to create stubs of MongoClient, Db and Collection
    var mongoClient = function (databases, methodStubs) {
        var dbGetterStub = sinon.stub();
        dbGetterStub.returns(sinonMongo.db());
        if (databases) {
            Object.getOwnPropertyNames(databases).forEach(function (dbName) {
                return dbGetterStub.withArgs(dbName).returns(databases[dbName]);
            });
        }
        var stubMongoClient = sinon.createStubInstance(mongodb_1.MongoClient, Object.assign({
            db: dbGetterStub,
        }, methodStubs));
        stubMongoClient.connect = sinon.stub().resolves(stubMongoClient);
        stubMongoClient.startSession = function () { return ({
            withTransaction: function (f) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, f()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); },
        }); };
        return stubMongoClient;
    };
    var db = function (collections, methodStubs) {
        var collectionGetterStub = sinon.stub();
        collectionGetterStub.returns(sinonMongo.collection());
        if (collections) {
            Object.getOwnPropertyNames(collections).forEach(function (collName) {
                return collectionGetterStub.withArgs(collName).returns(collections[collName]);
            });
        }
        return sinon.createStubInstance(mongodb_1.Db, Object.assign({
            collection: collectionGetterStub,
        }, methodStubs));
    };
    var collection = function (methodStubs) {
        return sinon.createStubInstance(mongodb_1.Collection, methodStubs);
    };
    // Helpers to create array/stream results for collection operations
    var documentArray = function (result) {
        if (!result)
            result = [];
        if (result.constructor !== Array)
            result = [result];
        return {
            limit: sinon.stub().returnsThis(),
            skip: sinon.stub().returnsThis(),
            sort: sinon.stub().returnsThis(),
            toArray: function () { return Promise.resolve(result); },
        };
    };
    var documentStream = function (result) {
        if (!result)
            result = [];
        if (!Array.isArray(result))
            result = [result];
        var readableStream = new Stream.Readable({ objectMode: true });
        result.forEach(function (item) { return readableStream.push(item); });
        readableStream.push(null);
        // mimick mongo API for collection methods. By default methods return a stream but it also has an explicit stream() method
        /// @ts-ignore
        readableStream.stream = function () { return readableStream; };
        return readableStream;
    };
    var sinonMongo = {
        mongoClient: mongoClient,
        db: db,
        collection: collection,
        documentArray: documentArray,
        documentStream: documentStream,
    };
    sinon.mongo = (sinon === null || sinon === void 0 ? void 0 : sinon.mongo) || sinonMongo;
};
exports.install = install;
