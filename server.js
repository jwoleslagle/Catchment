const express = require("express")
const axios = require("axios")

const server = express()

server.use(express.static("."))

server.get("/api", (req, res) => {
  const params = req.query
  const url =
    "http://data.fcc.gov/api/block/find?format=json&latitude=" +
    params.Lat +
    "&longitude=" +
    params.Lng +
    "&showall=true"
  debugger
  axios(url)
    .then(apiRes => {
      res.json(apiRes.data.Block.FIPS)
    })
    .catch(error => {
      console.log(error)
    })
})

server.get("/census", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5?key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

  axios
    .get(url)
    .then(data => {
      res.json(data.data.dataset)
    })
    .catch(err => {
      debugger
      res.json({ error: err })
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT}`)
})
