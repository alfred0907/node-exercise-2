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

const createBio = (bioArr, newBio) => {
  const indexFind = bioArr.findIndex(({ name }) => name.toUpperCase() === newBio.name.toUpperCase())
  if (indexFind >= 0) {
    console.log('Name already exist')
    process.exit(1)
  } else if (newBio.name === undefined || newBio.sex === undefined || newBio.age === undefined
      || newBio.height === undefined || newBio.weight === undefined) {
    console.log('All fields must be specified')
    process.exit(1)
  }
  bioArr.unshift(newBio)
  return bioArr
}

const readBio = (bioArr, findName) => {
  const indexFind = bioArr.findIndex(({ name }) => name.toUpperCase() === findName.toUpperCase())
  if (indexFind >= 0) {
    const {
      name, sex, age, height, weight,
    } = bioArr[indexFind]
    return new Bio(name, sex, age, height, weight)
  }
  return null
}

const updateBio = (bioArr, newBio) => {
  const indexFind = bioArr.findIndex(({ name }) => name.toUpperCase() === newBio.name.toUpperCase())
  if (indexFind < 0) {
    console.log('Name doesn\'t exist')
    process.exit(1)
  } else if (newBio.name === undefined || newBio.sex === undefined || newBio.age === undefined
    || newBio.height === undefined || newBio.weight === undefined) {
    console.log('All fields must be specified')
    process.exit(1)
  }
  bioArr.splice(indexFind, 1, newBio)
  return bioArr
}

const deleteBio = (bioArr, findName) => {
  const indexFind = bioArr.findIndex(({ name }) => name.toUpperCase() === findName.toUpperCase())
  if (indexFind < 0) {
    console.log('Name doesn\'t exist')
    process.exit(1)
  }
  bioArr.splice(indexFind, 1)
  return bioArr
}

const readCSVFile = (filePath) => csvjson.toObject(fs.readFileSync(filePath, { encoding: 'utf-8' }, (err) => {
  if (err) {
    console.log(err.message)
    process.exit(1)
  }
}), {
  delimiter: ',',
  quote: '"',
})

const writeCSVFile = (filePath, bioArr) => {
  try {
    fs.writeFileSync(filePath, csvjson.toCSV(bioArr, {
      delimiter: ',\t\t',
      wrap: true,
      quote: "'",
      headers: 'key',
    }))
    return true
  } catch (err) {
    return false
  }
}

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
  },
  sex: {
    type: 'string',
    description: 'Only "f", "F", "m" and "M" will be accepted.',
    choices: ['f', 'F', 'm', 'M'],
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
  console.log(argv.age)
  if (!'crud'.includes(firstArg)) {
    throw new Error('Invalid first argument. Expected: -c, -r, -u, -d')
  }
  if (argv.age !== undefined && !argv.age) {
    throw new Error('Age must be a number type')
  } else if (argv.age < 18) {
    throw new Error('Will only accept age greater than or equal to 18')
  }
  if (argv.height !== undefined && !argv.height) {
    throw new Error('Height must be a number')
  }
  if (argv.weight !== undefined && !argv.weight) {
    throw new Error('Weight must be a number')
  }
  if (crudOperationCount !== 1) {
    throw new Error(`${crudOperationCount === 0 ? 'Requires' : 'Only accepts'} one from these arguments [c, r, u, d]`)
  }
  return true
}).argv
const filePath = 'biostats.csv'
const crudOperation = Object.keys(args)[1]
const newBio = new Bio(args.name, args.sex.toUpperCase(), args.age, args.height, args.weight)
const bioArr = readCSVFile(filePath)
let newBioArr = []
let bio = {}

switch (crudOperation) {
  case 'c': newBio.name = newBio.name[0].toUpperCase() + newBio.name.slice(1).toLowerCase()
    newBioArr = createBio(bioArr, newBio)
    console.log(writeCSVFile(filePath, newBioArr))
    break
  case 'r': bio = readBio(bioArr, args.name)
    if (bio) {
      console.log(`Name: ${bio.name}`)
      console.log(`Sex: ${bio.sex.toLowerCase() === 'm' ? 'Male' : 'Female'}`)
      console.log(`Age: ${bio.age}`)
      console.log(`Height(in|cm): ${bio.height}in | ${bio.height * 2.54}cm`)
      console.log(`Weight(lbs|kg): ${bio.weight}lbs | ${bio.weight / 2.205}kg`)
    } else {
      console.log('Name doesn\'t exist')
    }
    break
  case 'u': newBioArr = updateBio(bioArr, newBio)
    console.log(writeCSVFile(filePath, newBioArr))
    break
  case 'd': newBioArr = deleteBio(bioArr, args.name)
    console.log(writeCSVFile(filePath, newBioArr))
    break
  default: break
}
