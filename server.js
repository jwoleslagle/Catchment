const express = require("express")
const axios = require("axios")

const server = express()

server.use(express.static("."))

server.get("/api", (req, res) => {
  // Example query: http://data.fcc.gov/api/block/find?format=json&latitude=41.2380564&longitude=-96.1429296&showall=true
  console.log('Server request ran.')
  const params = req.query
  const url =
    "http://data.fcc.gov/api/block/find?format=json&latitude=" +
    params.Lat +
    "&longitude=" +
    params.Lng +
    "&showall=true"
  axios(url)
    .then(apiRes => {
      console.log(apiRes.data.Block.FIPS)
      res.json(apiRes.data.Block.FIPS)
    })
    .catch(error => {
      console.log(error)
    })
})

server.get("/ac5_tract", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B01001_001E,B01001_002E,B01001_026E,B25001_001E,B20002_001E,B25003_002E&for=tract:" + params.tract + "$in=state:" + params.stateCode + "%20county:" + params.county + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

    axios
    .get(url)
    .then(apiRes => {
      const results = censusResultToObj(apiRes.data)    
      res.json(results)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

server.get("/ac5_county", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B01001_001E,B01001_002E,B01001_026E,B25001_001E,B20002_001E,B25003_002E&for=county:" + params.county + "$in=state:" + params.stateCode + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

    axios
    .get(url)
    .then(apiRes => {
      const results = censusResultToObj(apiRes.data)    
      res.json(results)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

server.get("/ac5_state", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B01001_001E,B01001_002E,B01001_026E,B25001_001E,B20002_001E,B25003_002E&for=state:" + params.stateCode + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

    axios
    .get(url)
    .then(apiRes => {
      const results = censusResultToObj(apiRes.data)    
      res.json(results)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

server.get("/ac5_national", (req, res) => {
  const url =
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B01001_001E,B01001_002E,B01001_026E,B25001_001E,B20002_001E,B25003_002E&for=us&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

  axios
    .get(url)
    .then(apiRes => {
      const results = censusResultToObj(apiRes.data)    
      res.json(results)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT}`)
})

function censusResultToObj(data) {
  // Loop through results, using [0] as header for [1]
  let obj = {}
  for(let i=0; i < data[0].length;i++){
    let header = data[0][i]
    let val = data[1][i]
    header = censusHeaderLookup(header);
    obj[`${header}`] = val
  }

  //Get homeowner percentage
  obj.homeownerPercentage = (obj.ownerOccupiedHousingUnits / obj.totalHousingUnits * 100).toFixed(2) + '%'
  //Get male / female percentage
  obj.MalePercentage = (obj.totalMalePopulation / obj.totalPopulation * 100).toFixed(2) + '%'
  obj.FemalePercentage = (obj.totalFemalePopulation / obj.totalPopulation * 100).toFixed(2) + '%'

  //return resulting obj
  return obj
}

function censusHeaderLookup(hdr) {
  switch(hdr) {
    case 'NAME':
      return 'Scope'
      break
    case 'B01001_001E':
      return 'totalPopulation'
      break
    case 'B01001_002E':
      return 'totalMalePopulation'
      break
    case 'B01001_026E':
      return 'totalFemalePopulation'
      break
    case 'B25001_001E':
      return 'totalHousingUnits'
      break
    case 'B20002_001E':
      return 'medianIncome'
      break
    case 'B25003_002E':
      return 'ownerOccupiedHousingUnits'
      break
    default:
      return hdr
  }
}