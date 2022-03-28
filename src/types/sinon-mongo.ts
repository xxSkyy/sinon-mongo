import { Collection, Db, MongoClient } from "mongodb"
import Sinon from "sinon"
import * as Stream from "stream"

export type SinonMongo = {
  mongoClient: (databases?: SMDatabases, methodStubs?: any) => StubMongoClient
  db: (collections?: SMCollections, methodStubs?: any) => Db
  collection: (methodStubs?: any) => Collection<Document>
  documentArray: (result?: any) => {
    limit?: any
    skip?: any
    sort?: any
    toArray: () => Promise<any>
  }
  documentStream: (result?: SMDocumentStream) => SMReadableStream
}

// interface SinonExtended extends SinonStatic {
//   mongo: SinonMongo
// }

declare module "sinon" {
  export interface SinonApi {
    mongo: SinonMongo
  }
}

export type SMReadableStream = Stream.Readable & {
  stream: Stream.Readable
}

type StubbedInstance = Sinon.SinonStubbedInstance<MongoClient>
export type StubMongoClient = Omit<
  StubbedInstance,
  "connect" | "startSession"
> & {
  startSession(): {
    withTransaction(transactionFunction: Function)
    endSession()
  }
  connect: Sinon.SinonStub<any[], any>
}

export type SMDatabases = {
  [key: string]: string
}

export type SMCollections =
  | string
  | {
      [key: string]: {
        [key: string]: string
      }
    }

type SMDocumentStreamItem = {
  [key: string]: string
}
export type SMDocumentStream = SMDocumentStreamItem[] | SMDocumentStreamItem
