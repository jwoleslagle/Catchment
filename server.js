const express = require("express")
const axios = require("axios")

const server = express()

server.use(express.static("."))

server.get("/api", (req, res) => {
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
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B00001_001E,B00002_001E,B20002_001E,B25012_002E&for=tract:" + params.tract + "$in=state:" + params.stateCode + "%20county:" + params.county + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

  axios
    .get(url)
    .then(apiRes => {
      let tractResult = {
        totalPop: apiRes.data.B00001_001E,
        totalHousingUnits: apiRes.data.B00002_001E,
        medianIncome: apiRes.data.B20002_001E,
        ownerOccupiedHousingUnits: apiRes.data.B25012_002E
      }
      res.json(tractResult)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

server.get("/ac5_county", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B00001_001E,B00002_001E,B20002_001E,B25012_002E&for=county:" + params.county + "$in=state:" + params.stateCode + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

  axios
    .get(url)
    .then(data => {
      let countyResult = {
        totalPop: data.B00001_001E,
        totalHousingUnits: data.B00002_001E,
        medianIncome: data.B20002_001E,
        ownerOccupiedHousingUnits: data.B25012_002E
      }
      res.json(countyResult)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

server.get("/ac5_state", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B00001_001E,B00002_001E,B20002_001E,B25012_002E&for=state:" + params.stateCode + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

  axios
    .get(url)
    .then(data => {
      let stateResult = {
        totalPop: data.B00001_001E,
        totalHousingUnits: data.B00002_001E,
        medianIncome: data.B20002_001E,
        ownerOccupiedHousingUnits: data.B25012_002E
      }
      res.json(countyResult)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

server.get("/ac5_national", (req, res) => {
  const url =
    "https://api.census.gov/data/2016/acs/acs5?get=NAME,B00001_001E,B00002_001E,B20002_001E,B25012_002E&for=us&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

  axios
    .get(url)
    .then(apiRes => {
      let nationalResult = {
        totalPop: apiRes.data.B00001_001E,
        totalHousingUnits: apiRes.data.B00002_001E,
        medianIncome: apiRes.data.B20002_001E,
        ownerOccupiedHousingUnits: apiRes.data.B25012_002E
      }
      console.log(nationalResult)
      res.json(nationalResult)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT}`)
})
