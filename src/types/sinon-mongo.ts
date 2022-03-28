import { MongoClient } from "mongodb"
import Sinon from "sinon"
import * as Stream from "stream"

export type SinonMongo = {
  mongoClient: (databases?: any, methodStubs?: any) => any
  db: (collections?: any, methodStubs?: any) => any
  collection: (methodStubs?: any) => any
  documentArray: (result?: any) => {
    limit?: any
    skip?: any
    sort?: any
    toArray: () => Promise<any>
  }
  documentStream: (result?: any) => Stream.Readable
}

// interface SinonExtended extends SinonStatic {
//   mongo: SinonMongo
// }

declare module "sinon" {
  export interface SinonApi {
    mongo: SinonMongo
  }
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
