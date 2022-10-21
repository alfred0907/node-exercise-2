const yargs = require('yargs')
const csvjson = require('csvjson')
const fs = require('fs')

class Bio {
  constructor(name, sex, age, height, weight) {
    this.name = name
    this.sex = sex
    this.age = age
    this.height = height
    this.weight = weight
  }
}

const createBio = (bioStats, newBio) => {
  if (bioStats.has(newBio.name)) {
    throw new Error(`Name "${newBio.name}" already exists`)
  }
  bioStats.set(newBio.name, newBio)
  return bioStats
}

const readBio = (bioStats, findName) => {
  if (bioStats.has(findName)) {
    return new Bio(...Object.values(bioStats.get(findName)))
  }
  return null
}

const updateBio = (bioStats, newBio) => {
  if (!bioStats.has(newBio.name)) {
    throw new Error(`Name "${newBio.name}" doesn't exists`)
  }
  bioStats.set(newBio.name, newBio)
  return bioStats
}

const deleteBio = (bioStats, findName) => {
  if (!bioStats.has(findName)) {
    throw new Error(`Name "${findName}" doesn't exists`)
  }
  bioStats.delete(findName)
  return bioStats
}

const readCSVFile = (filePath) => csvjson.toObject(fs.readFileSync(filePath, { encoding: 'utf-8' }), {
  delimiter: ',',
  quote: '"',
})

const writeCSVFile = (filePath, bioArr) => {
  fs.writeFileSync(filePath, csvjson.toCSV(bioArr, {
    delimiter: ',\t\t',
    quote: '"',
    headers: 'key',
  }), { encoding: 'utf-8' })
  return true
}

const in2cm = (inch) => inch * 2.54

const lbs2kg = (lbs) => lbs / 2.205

const args = yargs.options({
  c: {
    type: 'boolean',
    description: 'Create/Add new bio',
  },
  r: {
    type: 'boolean',
    description: 'Read/View an existing bio',
  },
  u: {
    type: 'boolean',
    description: 'Update an existing bio',
  },
  d: {
    type: 'boolean',
    description: 'Delete an existing bio',
  },
  name: {
    type: 'string',
    description: 'Add name value',
    require: true,
    coerce: (name) => name[0].toUpperCase() + name.substr(1).toLowerCase(),
  },
  sex: {
    type: 'string',
    description: 'Only "f", "F", "m" and "M" will be accepted.',
    choices: ['f', 'F', 'm', 'M'],
    coerce: (sex) => sex.toUpperCase(),
  },
  age: {
    type: 'number',
    description: 'Will only accept age >= to 18.',
  },
  height: {
    type: 'number',
    description: 'Add height value in inches',
  },
  weight: {
    type: 'number',
    description: 'Add weight value in pounds.',
  },
}).check((argv) => {
  const crudOperationCount = Object.keys(argv).filter((element) => 'crud'.includes(element)).length
  const firstArg = Object.keys(argv)[1]

  if (!'crud'.includes(firstArg)) {
    throw new Error('Invalid first argument. Expected: -c, -r, -u, -d')
  }
  if ((firstArg === 'c' || firstArg === 'u') && (argv.name === undefined || argv.sex === undefined
    || argv.age === undefined || argv.height === undefined || argv.weight === undefined)) {
    throw new Error('All fields must be specified: "name", "sex", "age", "height", "weight"')
  }
  if (argv.age !== undefined && Number.isNaN(argv.age)) {
    throw new Error('Age must be a number type')
  } else if (argv.age < 18) {
    throw new Error('Will only accept age greater than or equal to 18')
  }
  if (argv.height !== undefined && Number.isNaN(argv.height)) {
    throw new Error('Height must be a number')
  }
  if (argv.weight !== undefined && Number.isNaN(argv.weight)) {
    throw new Error('Weight must be a number')
  }
  if (crudOperationCount !== 1) {
    throw new Error('Only accepts one from these arguments [c, r, u, d]')
  }
  return true
}).argv
const filePath = 'biostats.csv'
const crudOperation = Object.keys(args)[1]
const bioStats = new Map(readCSVFile(filePath).map((bioData) => [bioData.name, bioData]))

try {
  switch (crudOperation) {
    case 'c': {
      const newBio = new Bio(args.name, args.sex, args.age, args.height, args.weight)
      console.log(writeCSVFile(filePath, [...createBio(bioStats, newBio).values()]) ? 'Created successfully' : 'Failed saving file')
      break
    }
    case 'r': {
      const bio = readBio(bioStats, args.name)
      if (!bio) {
        throw new Error(`Name "${args.name}" doesn't exists`)
      }
      console.log(`Name: ${bio.name}`)
      console.log(`Sex: ${bio.sex === 'M' ? 'Male' : 'Female'}`)
      console.log(`Age: ${bio.age}`)
      console.log(`Height(in|cm): ${bio.height}in | ${in2cm(bio.height).toFixed(2)}cm`)
      console.log(`Weight(lbs|kg): ${bio.weight}lbs | ${lbs2kg(bio.weight).toFixed(2)}kg`)
      break
    }
    case 'u': {
      const newBio = new Bio(args.name, args.sex, args.age, args.height, args.weight)
      console.log(writeCSVFile(filePath, [...updateBio(bioStats, newBio).values()]) ? 'Updated successfully' : 'Failed saving file')
      break
    }
    case 'd': {
      console.log(writeCSVFile(filePath, [...deleteBio(bioStats, args.name).values()]) ? 'Deleted successfully' : 'Failed saving file')
      break
    }
    default: break
  }
} catch (error) {
  console.log(error.message)
}
