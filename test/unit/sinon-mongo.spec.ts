const sinon = require("sinon")
const expect = require("chai").expect
const should = require("chai").should()
const { MongoClient, Db, Collection } = require("mongodb")
const { install } = require("../../src/sinon-mongo")
import { $orMatch } from "../../src/helpers"

describe("sinon-mongo", () => {
  before(() => {
    install(sinon)
  })

  const getFunctionsToStub = function (proto) {
    return Object.getOwnPropertyNames(proto).filter((p) => {
      try {
        return typeof proto[p] === "function" && p !== "constructor"
      } catch (e) {
        return false
      }
    })
  }

  describe("$orMatch helper tests", async () => {
    it("single object matching", async () => {
      const mockUsers = sinon.mongo.collection()

      mockUsers.findOne
        .withArgs(
          $orMatch([{ username: "user" }, { email: "user@example.com" }])
        )
        .resolves("first")

      mockUsers.findOne
        .withArgs(
          $orMatch([
            { username: "foo" },
            { email: "bar@example.com" },
            { name: "George" },
          ])
        )
        .resolves("second")

      const mockDb = sinon.mongo.db({
        users: mockUsers,
      })

      let query: any = {
        $or: [{ username: "user" }, { email: "foundation@example.com" }],
      }

      let result = await mockDb.collection("users").findOne(query)

      result.should.equal("first")

      // Should find first
      query = {
        $or: [{ username: "foo" }],
      }

      result = await mockDb.collection("users").findOne(query)

      result.should.equal("second")

      // Should find second
      query = {
        $or: [{ name: "George" }],
      }

      result = await mockDb.collection("users").findOne(query)

      result.should.equal("second")

      // Should not find any
      query = {
        $or: [{ name: "NotExist" }],
      }

      result = await mockDb.collection("users").findOne(query)

      should.not.exist(result)
    })

    it("nested objects matching", async () => {
      const mockUsers = sinon.mongo.collection()

      mockUsers.findOne
        .withArgs(
          $orMatch([
            { username: "user", balance: { locked: false, amount: 100 } },
            { email: "user@email.com" },
          ])
        )
        .resolves("first")

      const mockDb = sinon.mongo.db({
        users: mockUsers,
      })

      let query: any = {
        $or: [
          { username: "user", balance: { locked: true, amount: 400 } },
          { username: "user", balance: { locked: false, amount: 100 } },
        ],
      }

      let result = await mockDb.collection("users").findOne(query)

      result.should.equal("first")

      query = {
        $or: [
          { email: "user@email.com" },
          { username: "user", balance: { locked: false, amount: 500 } },
        ],
      }

      result = await mockDb.collection("users").findOne(query)

      result.should.equal("first")

      query = {
        $or: [
          { email: "notexist@email.com" },
          { username: "user", balance: { locked: false, amount: 500 } },
        ],
      }

      result = await mockDb.collection("users").findOne(query)

      should.not.exist(result)
    })
  })

  describe("when stubbing MongoClient", () => {
    let mockMongoClient
    beforeEach(() => {
      mockMongoClient = sinon.mongo.mongoClient()
    })

    getFunctionsToStub(MongoClient.prototype).forEach((methodName) => {
      if (methodName === "startSession") {
        it(`provides a proper basic functionality for ${methodName} method`, () => {
          expect(mockMongoClient[methodName]).to.be.a("function")
          expect(mockMongoClient[methodName]().withTransaction).to.be.a(
            "function"
          )

          let wasCalled = false
          const session = mockMongoClient[methodName]()
          session.withTransaction(async () => {
            wasCalled = true
          })

          expect(session.endSession).to.be.a("function")

          expect(wasCalled).to.be.true
        })

        return
      }

      it(`provides a sinon stub for the ${methodName} method`, () => {
        expect(mockMongoClient[methodName]).to.be.a("function")
        expect(mockMongoClient[methodName].withArgs).to.be.a("function")
      })
    })

    it("stubs the connect method by default to return the mock mongoClient", () => {
      // Arrange
      const functionUsingMongoClient = (mongoClient) => {
        return mongoClient.connect()
      }

      // Act
      return (
        functionUsingMongoClient(mockMongoClient)
          // Assert
          .then((result) => {
            expect(result).to.be.equal(mockMongoClient)
          })
      )
    })

    it("stubs the db method by default providing a stub equivalent to sinon.mongo.db", () => {
      // Arrange
      const functionUsingMongoClient = (mongoClient) => {
        return mongoClient
          .connect()
          .then(() => mongoClient.db("someOtherDbName"))
      }

      // Act
      return (
        functionUsingMongoClient(mockMongoClient)
          // Assert
          .then((result) => {
            expect(result.collection).to.be.a("function")
            expect(result.collection.withArgs).to.be.a("function")
            expect(result.collection("foo").find).to.be.a("function")
            expect(result.collection("foo").find.withArgs).to.be.a("function")
          })
      )
    })

    it("accepts a map of database stubs to be auto wired to the db() method", () => {
      // Arrange
      const mockDefaultDb = { the: "default database" }
      const mockReportingDb = { the: "reporting database" }
      const mockMongoClient = sinon.mongo.mongoClient({
        default: mockDefaultDb,
        reporting: mockReportingDb,
      })

      // Act
      // Assert
      expect(mockMongoClient.db("default")).to.be.equal(mockDefaultDb)
      expect(mockMongoClient.db("reporting")).to.be.equal(mockReportingDb)
    })

    it("its behaviour can be further customised after initialization", () => {
      // Arrange
      mockMongoClient.db.withArgs("myDb").returns({ my: "mock object" })
      const functionUsingMongoClient = (mongoClient) => {
        return mongoClient.connect().then(() => mongoClient.db("myDb"))
      }

      // Act
      return (
        functionUsingMongoClient(mockMongoClient)
          // Assert
          .then((result) => expect(result).to.be.eql({ my: "mock object" }))
      )
    })
  })

  describe("when stubbing a Db", () => {
    getFunctionsToStub(Db.prototype).forEach((methodName) => {
      it(`provides a sinon stub for the ${methodName} method`, () => {
        const mockDb = sinon.mongo.db()
        expect(mockDb[methodName]).to.be.a("function")
        expect(mockDb[methodName].withArgs).to.be.a("function")
      })
    })

    it("provides a default stub for the collection method that returns a stub equivalent to sinon.mongo.collection", () => {
      // Arrange
      const mockDb = sinon.mongo.db()

      // Act
      const result = mockDb.collection("myCollection")

      // Assert
      expect(result.find).to.be.a("function")
      expect(result.find.withArgs).to.be.a("function")
    })

    it("accepts a map of collections stub to be auto wired to the collection() method", () => {
      // Arrange
      const mockCustomersCollection = { the: "customers collection" }
      const mockOrganizationsCollection = { the: "organizations collection" }
      const mockDb = sinon.mongo.db({
        customers: mockCustomersCollection,
        organizations: mockOrganizationsCollection,
      })

      // Act
      // Assert
      expect(mockDb.collection("customers")).to.be.equal(
        mockCustomersCollection
      )
      expect(mockDb.collection("organizations")).to.be.equal(
        mockOrganizationsCollection
      )
    })

    it("each of the method stubs can be further customised after initialization", () => {
      // Arrange
      const mockDb = sinon.mongo.db({
        customers: { the: "mock customer collection" },
      })
      mockDb.collection
        .withArgs("myCollection")
        .returns({ my: "mock collection" })

      // Act
      // Assert
      expect(mockDb.collection("myCollection")).to.be.eql({
        my: "mock collection",
      })
    })
  })

  describe("when stubbing a collection", () => {
    let mockCollection

    beforeEach(() => {
      mockCollection = sinon.mongo.collection()
    })

    getFunctionsToStub(Collection.prototype).forEach((methodName) => {
      it(`provides a sinon stub for the ${methodName} method`, () => {
        expect(mockCollection[methodName]).to.be.a("function")
        expect(mockCollection[methodName].withArgs).to.be.a("function")
      })
    })

    it("method stubs can be directly provided", () => {
      // Arrange
      mockCollection = sinon.mongo.collection({
        findOne: sinon
          .stub()
          .withArgs({ name: "mockName" })
          .resolves({ my: "mock object" }),
      })

      // Act
      mockCollection
        .findOne({ name: "mockName" })

        // Assert
        .then((result) => expect(result).to.be.eql({ my: "mock object" }))
    })

    it("each of the method stubs can be further customised after initialization", () => {
      // Arrange
      mockCollection.findOne
        .withArgs({ name: "mockName" })
        .resolves({ my: "mock object" })

      // Act
      mockCollection
        .findOne({ name: "mockName" })

        // Assert
        .then((result) => expect(result).to.be.eql({ my: "mock object" }))
    })
  })

  describe("when stubbing collection operations", () => {
    describe("that return a promise with a single document", () => {
      const functionUsingCollection = (collection) => {
        return collection.findOne({ name: "foo" }, { email: 1, name: 1 })
      }

      it("can stub the method to resolve with empty response", () => {
        // Arrange
        const mockCollection = {
          findOne: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .resolves(),
        }

        // Act
        return (
          functionUsingCollection(mockCollection)
            // Assert
            .then((result) => expect(result).to.be.undefined)
        )
      })

      it("can stub the method to resolve with a single document", () => {
        // Arrange
        const mockCollection = {
          findOne: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .resolves({ a: "mock document" }),
        }

        // Act
        return (
          functionUsingCollection(mockCollection)
            // Assert
            .then((result) => expect(result).to.be.eql({ a: "mock document" }))
        )
      })
    })

    describe("that use toArray() to return a promise with multiple documents", () => {
      const functionUsingCollection = (collection) => {
        return collection.find({ name: "foo" }, { email: 1, name: 1 }).toArray()
      }

      it("can use the documentArray to return an empty array", () => {
        // Arrange
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(sinon.mongo.documentArray()),
        }

        // Act
        return (
          functionUsingCollection(mockCollection)
            // Assert
            .then((result) => expect(result).to.be.eql([]))
        )
      })

      it("can use the documentArray to return an array of a single document", () => {
        // Arrange
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(sinon.mongo.documentArray({ a: "mock document" })),
        }

        // Act
        return (
          functionUsingCollection(mockCollection)
            // Assert
            .then((result) => {
              expect(result).to.have.lengthOf(1)
              expect(result).to.be.eql([{ a: "mock document" }])
            })
        )
      })

      it("can use the documentArray to return an array of multiple documents", () => {
        // Arrange
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(
              sinon.mongo.documentArray([
                { the: "first mock document" },
                { the: "second mock document" },
              ])
            ),
        }

        // Act
        return (
          functionUsingCollection(mockCollection)
            // Assert
            .then((result) => {
              expect(result).to.have.lengthOf(2)
              expect(result).to.be.eql([
                { the: "first mock document" },
                { the: "second mock document" },
              ])
            })
        )
      })
    })

    describe("that use sort()", () => {
      it("can use the documentArray to mimic a sort call", () => {
        const data = [
          { the: "first mock document" },
          { the: "second mock document" },
        ]
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(sinon.mongo.documentArray(data)),
        }

        return mockCollection
          .find({ name: "foo" }, { email: 1, name: 1 })
          .sort()
          .toArray()

          .then((result) => {
            expect(result).to.have.lengthOf(2)
            expect(result).to.be.eql([
              { the: "first mock document" },
              { the: "second mock document" },
            ])
          })
      })
    })

    describe("that uses skip() and limit()", () => {
      it("can use the documentArray to mimic paginated results using skip and limit", () => {
        const data = [
          { the: "first mock document" },
          { the: "second mock document" },
        ]
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(sinon.mongo.documentArray(data)),
        }

        return mockCollection
          .find({ name: "foo" }, { email: 1, name: 1 })
          .skip(1)
          .limit(1)
          .toArray()

          .then((result) => {
            expect(result).to.have.lengthOf(2)
            expect(result).to.be.eql([
              { the: "first mock document" },
              { the: "second mock document" },
            ])
          })
      })
    })

    describe("that return streams", () => {
      const functionUsingCollection = (collection) => {
        return collection.find({ name: "foo" }, { email: 1, name: 1 }).stream()
      }

      it("can use the documentStream returning an empty readable stream", (done) => {
        // Arrange
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(sinon.mongo.documentStream()),
        }

        // Act
        const stream = functionUsingCollection(mockCollection)

        // Assert
        const documents = []
        stream.on("data", (d) => documents.push(d))
        stream.on("end", () => {
          expect(documents).to.be.eql([])
          done()
        })
      })

      it("can use the documentStream returning a readable stream with a single document", (done) => {
        // Arrange
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(sinon.mongo.documentStream({ a: "mock document" })),
        }

        // Act
        const stream = functionUsingCollection(mockCollection)

        // Assert
        const documents = []
        stream.on("data", (d) => documents.push(d))
        stream.on("end", () => {
          expect(documents).to.be.eql([{ a: "mock document" }])
          done()
        })
      })

      it("can use the documentStream returning a readable stream with multiple documents", (done) => {
        // Arrange
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(
              sinon.mongo.documentStream([
                { the: "first mock document" },
                { the: "second mock document" },
              ])
            ),
        }

        // Act
        const stream = functionUsingCollection(mockCollection)

        // Assert
        const documents = []
        stream.on("data", (d) => documents.push(d))
        stream.on("end", () => {
          expect(documents).to.have.lengthOf(2)
          expect(documents).to.be.eql([
            { the: "first mock document" },
            { the: "second mock document" },
          ])
          done()
        })
      })
    })

    describe("that return streams without explicitly calling stream()", () => {
      const functionUsingCollection = (collection) => {
        return collection.find({ name: "foo" }, { email: 1, name: 1 })
      }

      it("can use the documentStream returning a readable stream with multiple documents", (done) => {
        // Arrange
        const mockCollection = {
          find: sinon
            .stub()
            .withArgs({ name: "foo" }, { email: 1, name: 1 })
            .returns(
              sinon.mongo.documentStream([
                { the: "first mock document" },
                { the: "second mock document" },
              ])
            ),
        }

        // Act
        const stream = functionUsingCollection(mockCollection)

        // Assert
        const documents = []
        stream.on("data", (d) => documents.push(d))
        stream.on("end", () => {
          expect(documents).to.have.lengthOf(2)
          expect(documents).to.be.eql([
            { the: "first mock document" },
            { the: "second mock document" },
          ])
          done()
        })
      })
    })
  })
})
