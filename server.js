const express = require("express")
const axios = require("axios")

const server = express()

server.use(express.static("."))

server.get("/fips", (req, res) => {
  // Example query: http://data.fcc.gov/api/block/find?format=json&latitude=41.2380564&longitude=-96.1429296&showall=true
  const params = req.query
  const url =
    "http://data.fcc.gov/api/block/find?format=json&latitude=" +
    params.Lat +
    "&longitude=" +
    params.Lng +
    "&showall=true"
  axios(url)
    .then(apiRes => {
      res.json(apiRes.data.Block.FIPS)
    })
    .catch(error => {
      console.log(error)
    })
})

server.get("/ac5_tract", (req, res) => {
	const params = req.query
		//Example URL: "https://api.census.gov/data/2016/acs/acs5/subject?get=NAME,S0101_C01_001E,S0101_C02_001E,S0101_C03_001E,S0601_C01_047E,S0101_C01_002E,S0101_C01_020E,S0101_C01_021E,S0101_C01_015E,S0101_C01_016E,S0101_C01_017E,S0101_C01_018E,S0101_C01_019E,S2501_C01_001E,S2501_C02_001E&for=tract:000100&in=state:01%20county:073&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3
  const url =
		"https://api.census.gov/data/2016/acs/acs5/subject?get=NAME,S0101_C01_001E,S0101_C02_001E,S0101_C03_001E,S0601_C01_047E,S0101_C01_002E,S0101_C01_020E,S0101_C01_021E,S0101_C01_015E,S0101_C01_016E,S0101_C01_017E,S0101_C01_018E,S0101_C01_019E,S2501_C01_001E,S2501_C02_001E&for=tract:" + params.tract + "&in=state:" + params.state + "%20county:" + params.county + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"
  const results = {}
  
  axios
    .get(url)
    .then(apiRes => {
			const data = censusResultToObj(apiRes.data)
      results.tract = data
      debugger
      res.json(results)
    })
    .catch(err => {
      res.json({ error: err })
    })
})

server.get("/ac5_county", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5/subject?get=NAME,S0101_C01_001E,S0101_C02_001E,S0101_C03_001E,S0601_C01_047E,S0101_C01_002E,S0101_C01_020E,S0101_C01_021E,S0101_C01_015E,S0101_C01_016E,S0101_C01_017E,S0101_C01_018E,S0101_C01_019E,S2501_C01_001E,S2501_C02_001E&for=county:" + params.county + "&in=state:" + params.state + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"
  const results = {}
  
  axios
    .get(url)
    .then(apiRes => {
			const data = censusResultToObj(apiRes.data)
			results.county = data 
      res.json(results)
    })
    .catch(err => {
      res.json({ error: err })
  })
})

server.get("/ac5_state", (req, res) => {
  const params = req.query

  const url =
    "https://api.census.gov/data/2016/acs/acs5/subject?get=NAME,S0101_C01_001E,S0101_C02_001E,S0101_C03_001E,S0601_C01_047E,S0101_C01_002E,S0101_C01_020E,S0101_C01_021E,S0101_C01_015E,S0101_C01_016E,S0101_C01_017E,S0101_C01_018E,S0101_C01_019E,S2501_C01_001E,S2501_C02_001E&for=state:" + params.state + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"
  const results = {}

  axios
    .get(url)
    .then(apiRes => {
			const data = censusResultToObj(apiRes.data)
			results.state = data 
      res.json(results)
    })
    .catch(err => {
      res.json({ error: err })
  })
})

server.get("/ac5_national", (req, res) => {
	const url = 
		"https://api.census.gov/data/2016/acs/acs5/subject?get=NAME,S0101_C01_001E,S0101_C02_001E,S0101_C03_001E,S0601_C01_047E,S0101_C01_002E,S0101_C01_020E,S0101_C01_021E,S0101_C01_015E,S0101_C01_016E,S0101_C01_017E,S0101_C01_018E,S0101_C01_019E,S2501_C01_001E,S2501_C02_001E&for=us&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"
	const results = {}

  axios
    .get(url)
    .then(apiRes => {
			const data = censusResultToObj(apiRes.data)
			results.national = data 
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

function censusCalcAndCleanup(obj) {
	  //Calculated properties
		obj.homeownerPct = (obj.housingOwnerOccupied / obj.housingTotalOccupied * 100).toFixed(1)
		obj.householdSize = (obj.populationTotal / obj.housingTotalOccupied).toFixed(1) 
		obj.popMalePct = (obj.populationMale / obj.populationTotal * 100).toFixed(1)
		obj.popFemalePct = (obj.populationFemale / obj.populationTotal * 100).toFixed(1)
		obj.popAdultPct = String((100 - (Number(obj.ageUnder5Years) + Number(obj.age5to14Years) + Number(obj.age15to17Years) + Number(obj.age65to69) + Number(obj.age70to74) + Number(obj.age75to79) + Number(obj.age80to84) + Number(obj.age85orOlder))).toFixed(1))
		obj.popYouthPct = String((Number(obj.ageUnder5Years) + Number(obj.age5to14Years) + Number(obj.age15to17Years)).toFixed(1))
		obj.popSeniorsPct = String((Number(obj.age65to69) + Number(obj.age70to74) + Number(obj.age75to79) + Number(obj.age80to84) + Number(obj.age85orOlder)).toFixed(1))
	
		//Cleanup obj - remove unused properties
		
		delete obj.age65to69
		delete obj.age70to74
		delete obj.age75to79
		delete obj.age80to84
		delete obj.age85orOlder
		delete obj.age15to17Years
		delete obj.age5to14Years
		delete obj.ageUnder5Years
		delete obj.populationFemale
		delete obj.populationMale
		delete obj.housingOwnerOccupied
		delete obj.us
		delete obj.state
		delete obj.county
		delete obj.tract

		return obj
}

function censusResultToObj(data) {
  // Loop through results, using [0] as header for [1]
  let object = {}
  for(let i=0; i < data[0].length;i++){
    let header = data[0][i]
    let val = data[1][i]
    header = censusHeaderLookup(header);
    object[`${header}`] = val
  }

	censusCalcAndCleanup(object)

  //return resulting obj
  return object
}

function censusHeaderLookup(hdr) {
  const censusHdrLiteral = {
    "NAME": "scope",
    "S0101_C01_001E": "populationTotal",
    "S0101_C02_001E": "populationMale",
    "S0101_C03_001E": "populationFemale",
    "S0601_C01_047E": "medianHouseholdIncome",
    "S0101_C01_002E": "ageUnder5Years",
    "S0101_C01_020E": "age5to14Years",
		"S0101_C01_021E": "age15to17Years",
		"S0101_C01_015E": "age65to69",
		"S0101_C01_016E": "age70to74",
		"S0101_C01_017E": "age75to79",
		"S0101_C01_018E": "age80to84",
		"S0101_C01_019E": "age85orOlder",
    "S2501_C01_001E": "housingTotalOccupied",
    "S2501_C02_001E": "housingOwnerOccupied",
    }
    return censusHdrLiteral[hdr] || hdr
  }