/// <reference types="node" />
import { MongoClient } from "mongodb";
import Sinon from "sinon";
import * as Stream from "stream";
export declare type SinonMongo = {
    mongoClient: (databases?: any, methodStubs?: any) => any;
    db: (collections?: any, methodStubs?: any) => any;
    collection: (methodStubs?: any) => any;
    documentArray: (result?: any) => {
        limit?: any;
        skip?: any;
        sort?: any;
        toArray: () => Promise<any>;
    };
    documentStream: (result?: any) => Stream.Readable;
};
declare module "sinon" {
    interface SinonApi {
        mongo: SinonMongo;
    }
}
declare type StubbedInstance = Sinon.SinonStubbedInstance<MongoClient>;
export declare type StubMongoClient = Omit<StubbedInstance, "connect" | "startSession"> & {
    startSession(): {
        withTransaction(transactionFunction: Function): any;
    };
    connect: Sinon.SinonStub<any[], any>;
};
export declare type SMDatabases = {
    [key: string]: string;
};
export declare type SMCollections = string | {
    [key: string]: {
        [key: string]: string;
    };
};
declare type SMDocumentStreamItem = {
    [key: string]: string;
};
export declare type SMDocumentStream = SMDocumentStreamItem[] | SMDocumentStreamItem;
export {};
//# sourceMappingURL=sinon-mongo.d.ts.map