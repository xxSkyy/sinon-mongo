"use strict";
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
    sinon.mongo = sinon.mongo || sinonMongo;
};
exports.install = install;
