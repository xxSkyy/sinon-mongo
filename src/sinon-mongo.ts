import * as Stream from "stream"
import { MongoClient, Db, Collection } from "mongodb"
import {
  SinonMongo,
  SMCollections,
  SMDatabases,
  SMDocumentStream,
  SMReadableStream,
  StubMongoClient,
} from "./types/sinon-mongo"
import Sinon, { SinonStatic } from "sinon"

const install = (sinon: SinonStatic) => {
  // Helpers to create stubs of MongoClient, Db and Collection
  const mongoClient = (
    databases?: SMDatabases,
    methodStubs?
  ): StubMongoClient => {
    const dbGetterStub = sinon.stub()
    dbGetterStub.returns(sinonMongo.db())
    if (databases) {
      Object.getOwnPropertyNames(databases).forEach((dbName) =>
        dbGetterStub.withArgs(dbName).returns(databases[dbName])
      )
    }

    let stubMongoClient: StubMongoClient = sinon.createStubInstance(
      MongoClient,
      Object.assign(
        {
          db: dbGetterStub,
        },
        methodStubs
      )
    )

    stubMongoClient.connect = sinon.stub().resolves(stubMongoClient)

    stubMongoClient.startSession = () => ({
      withTransaction: async (f) => await f(),
      endSession: () => {},
    })

    return stubMongoClient
  }

  const db = (collections?: SMCollections, methodStubs?): Db => {
    const collectionGetterStub = sinon.stub()
    collectionGetterStub.returns(sinonMongo.collection())
    if (collections) {
      Object.getOwnPropertyNames(collections).forEach((collName) =>
        collectionGetterStub.withArgs(collName).returns(collections[collName])
      )
    }
    return sinon.createStubInstance(
      Db,
      Object.assign(
        {
          collection: collectionGetterStub,
        },
        methodStubs
      )
    )
  }

  /// @ts-ignore It's fine, same as in mongodb
  const collection = (methodStubs?): Collection<Document> =>
    sinon.createStubInstance(Collection, methodStubs)

  // Helpers to create array/stream results for collection operations
  const documentArray = (result?) => {
    if (!result) result = []
    if (result.constructor !== Array) result = [result]

    return {
      limit: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      sort: sinon.stub().returnsThis(),
      toArray: () => Promise.resolve(result),
    }
  }

  const documentStream = (result?: SMDocumentStream): SMReadableStream => {
    if (!result) result = []
    if (!Array.isArray(result)) result = [result]

    const readableStream = new Stream.Readable({ objectMode: true })
    result.forEach((item) => readableStream.push(item))
    readableStream.push(null)

    readableStream

    // mimick mongo API for collection methods. By default methods return a stream but it also has an explicit stream() method
    // TODO: Ignore for now, later will check it
    /// @ts-ignore
    readableStream.stream = () => readableStream
    /// @ts-ignore
    return readableStream
  }

  const sinonMongo: SinonMongo = {
    mongoClient,
    db,
    collection,
    documentArray,
    documentStream,
  }

  sinon.mongo = sinon?.mongo || sinonMongo
}

export { install }
