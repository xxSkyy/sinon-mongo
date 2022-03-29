import * as equal from "fast-deep-equal/es6"
import * as sinon from "sinon"

const orMatchFunction = (expectation) => (actual) => {
  let matches = false

  for (const mockData of expectation["$or"]) {
    for (const searchData of actual["$or"]) {
      if (equal(mockData, searchData)) matches = true
    }
  }

  return matches
}

type orMatchInput = {
  [key: string]: any | orMatchInput | orMatchInput[]
}

export const $orMatch = (array: orMatchInput[]) => {
  const orArray = {
    $or: array,
  }

  return sinon.match(orMatchFunction(orArray))
}