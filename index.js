
let geocoder, map, colorPolygonLayer;
let pos = { lat: 41.2380564, lng: -96.1429296 };
const markersArray = [];
const FIPS = {};
const censusData = {};

const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function initMap() {
	console.log('initMap ran.');
	geocoder = new google.maps.Geocoder();
	let latlng = new google.maps.LatLng(pos.lat, pos.lng); 
	let mapOptions = {
		zoom: 4,
		center: pos,
		mapTypeControl: true,
		mapTypeControlOptions: {
			position: google.maps.ControlPosition.LEFT_TOP
		},
		zoomControl: true,
		zoomControlOptions: {
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		scaleControl: true,
		streetViewControl: true,
		streetViewControlOptions: {
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		fullscreenControl: false
		}
	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
}

function clearOverlays() {
	for (var i = 0; i < markersArray.length; i++ ) {
		markersArray[i].setMap(null);
		}
		markersArray.length = 0;
}

function codeAddress(address) {
	console.log('codeAddress ran.');
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == 'OK') {
			pos.lat = results[0].geometry.location.lat();
			pos.lng = results[0].geometry.location.lng();
			dropMarker();
			$('button.results-toggle-btn').prop('disabled', false);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

function buildCensusEndpoint(locale) {
	const baseURL =
	"https://api.census.gov/data/2016/acs/acs5/subject?get=NAME,S0101_C01_001E,S0101_C02_001E,S0101_C03_001E,S0601_C01_047E,S0101_C01_002E,S0101_C01_020E,S0101_C01_021E,S0101_C01_015E,S0101_C01_016E,S0101_C01_017E,S0101_C01_018E,S0101_C01_019E,S2501_C01_001E,S2501_C02_001E&for="

	const tractPredicate = "tract:" + FIPS.tract + "&in=state:" + FIPS.state + "%20county:" + FIPS.county + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

	const countyPredicate = "county:" + FIPS.county + "&in=state:" + FIPS.state + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

	const statePredicate = "state:" + FIPS.state + "&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

	const nationalPredicate = "us&key=37ff14711f40a5b4b3f6d39f773e687047ea6ce3"

	const endpoint = {
		"tract": baseURL + tractPredicate,
		"county": baseURL + countyPredicate,
		"state": baseURL + statePredicate,
		"national":baseURL + nationalPredicate,
		}
	let url = endpoint[locale]
	return url
}

function displayResults() {
	let cmp = censusData.comp;
	let lcl = censusData.local;
	console.log(`displayResults ran with ${cmp.scope}.`);
	let resultsString = `
		<div class="results-outer">
			<div class="center-it">Travel time (${$("#js-search-form-transit-type").val()}): <span class="short-cube"></span> 10 min    <span class="medium-cube"></span> 20 min    <span class="long-cube"></span> 30 min</div>
			<div class="center-it"><span class="bold-it">${numberWithCommas(lcl.housingTotalOccupied)}</span> residences nearby in ${lcl.scope}:</div>
			<div class="small-text center-it">(Comparing with ${numberWithCommas(cmp.housingTotalOccupied)} residences in ${cmp.scope}, comparisons in parentheses)</div>

				<div class="results-inner">
					<div class="results-panel">
						<div class="data-indent">
							<div class="bold-it">Population:</div>
								Total: ${numberWithCommas(lcl.populationTotal)} (${(((lcl.populationTotal / cmp.populationTotal)*100)).toFixed(1)}% of total)<br />

								Male: ${lcl.popMalePct}% 
								(<span class="${cmp.popMalePct > lcl.popMalePct ? "comp-higher" : (cmp.popMalePct < lcl.popMalePct ? "comp-lower" : "comp-equal")}">${censusData.comp.popMalePct}%</span>)<br />
								
								Female: ${lcl.popFemalePct}% 
								(<span class="${cmp.popFemalePct > lcl.popFemalePct ? "comp-higher" : (cmp.popFemalePct < lcl.popFemalePct ? "comp-lower" : "comp-equal")}">${cmp.popFemalePct}%</span>)<br />
						</div>
					</div>

					<div class="results-panel">
						<div class="data-indent">
							<div class="bold-it">Demographics:</div>
								Youth: ${lcl.popYouthPct}% 
								(<span class="${cmp.popYouthPct > lcl.popYouthPct ? "comp-higher" : (cmp.popYouthPct < lcl.popYouthPct ? "comp-lower" : "comp-equal")}">${cmp.popYouthPct}%</span>)<br />

								Adults: ${lcl.popAdultPct}% 
								(<span class="${cmp.popAdultPct > lcl.popAdultPct ? "comp-higher" : (cmp.popAdultPct < lcl.popAdultPct ? "comp-lower" : "comp-equal")}">${censusData.comp.popAdultPct}%</span>)<br />

								Seniors: ${lcl.popSeniorsPct}%
								(<span class="${cmp.popSeniorsPct > lcl.popSeniorsPct ? "comp-higher" : (cmp.popSeniorsPct < lcl.popSeniorsPct ? "comp-lower" : "comp-equal")}">${cmp.popSeniorsPct}%</span>)<br />
						</div>
					</div>

					<div class="results-panel">
						<div class="data-indent">
							<div class="bold-it">Household Info:</div>
								Household Size: ${lcl.householdSize}
								(<span class="${cmp.householdSize > lcl.householdSize ? "comp-higher" : (cmp.householdSize < lcl.householdSize ? "comp-lower" : "comp-equal")}">${cmp.householdSize}</span>)<br />

								Median Income: $${numberWithCommas(lcl.medianHouseholdIncome)} 
								(<span class="${cmp.medianHouseholdIncome > lcl.medianHouseholdIncome ? "comp-higher" : (cmp.medianHouseholdIncome < lcl.medianHouseholdIncome ? "comp-lower" : "comp-equal")}">$${numberWithCommas(cmp.medianHouseholdIncome)}</span>)</br>
								
								Home Ownership: ${lcl.homeownerPct} (<span class="${cmp.homeownerPct > lcl.homeownerPct ? "comp-higher" : (cmp.homeownerPct < lcl.homeownerPct ? "comp-lower" : "comp-equal")}">${cmp.homeownerPct}</span>)<br />
						</div>
					</div>
				</div>
				<p class="small-text center-it">Current position is ${pos.lat}, ${pos.lng}. Current FIPS ID is ${FIPS.FIPS}.</p>
			</div>`;

	$('div.results').html(resultsString);
	$('div.results-container').slideDown("slow");
}

function dropMarker() {
	clearOverlays();
	let marker = new google.maps.Marker({
		map: map,
		draggable: true,
		animation: google.maps.Animation.DROP,
		position: pos});
	markersArray.push(marker);
	colorPolygonLayer = r360.googleMapsPolygonLayer(map);
	showPolygons();
	//google.maps.event.addListener(marker,"click",function(){});
	$('button.results-toggle-btn').prop('disabled', false);
	google.maps.event.addListener(marker, 'dragend', function(event) {	
		pos.lat = event.latLng.lat();
		pos.lng = event.latLng.lng();
		map.setCenter(pos);
		reverseGeocode();
		showPolygons();
		getFIPS();
		});
	let infoWindow = new google.maps.InfoWindow;
	infoWindow.setPosition(pos);
	infoWindow.setContent('Drag and droppable.');
	setTimeout(function () { infoWindow.open(map); }, 1000);
	setTimeout(function () { infoWindow.close(); }, 3000);

	map.setCenter(pos);
	map.setZoom(15);

	getFIPS();
}

function generateFIPSObj(longFIPS) {
	console.log(`generateFIPSObj ran with FIPS ID: ${longFIPS}.`);
	FIPS.FIPS = longFIPS;
	FIPS.state = longFIPS.substr(0, 2); 
	FIPS.county = longFIPS.substr(2, 3);
	FIPS.tract = longFIPS.substr(5, 6);
	FIPS.blockGroup = longFIPS.substr(11, 1);
	FIPS.block = longFIPS.substr(11, 4);
	getCensusLocalData();
}

function getFIPS() {
	let query = {
		Lat: pos.lat,
		Lng: pos.lng	};
	$.get("/fips", query, generateFIPSObj);
}

function getCensusComparisonData() {
	console.log(`getCensusComparison ran.`);
	let locale = $('input[name=compLocale]:checked').val();
	let query = {
		url: buildCensusEndpoint(locale) };
	
	$.get("/census", query, processCensusDataStep2of2);
}

function getCensusLocalData() {
	console.log(`getCensusLocalData ran.`);
	let locale = "tract";
	let query = {
		url: buildCensusEndpoint(locale) };
	$.get("/census", query, processCensusDataStep1of2);
}

function processCensusDataStep1of2(data) {
	censusData.local = data;
	getCensusComparisonData();
}

function processCensusDataStep2of2(data) {
	censusData.comp = data;
	displayResults();
}

function handleGeolocatePress() {
	console.log('handleGeolocatePress ran.');
	let options = {
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0
	};
	let infoWindow = new google.maps.InfoWindow;
	$('button.geolocate-btn').on('click', (e) => {
		console.log('Geolocate btn clicked.');
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
					pos.lat = position.coords.latitude;
					pos.lng = position.coords.longitude;
					reverseGeocode();
					dropMarker();
				}, function() {
					handleGeolocationError(true, infoWindow, map.getCenter());
				}, options);
			} else {
			// Browser doesn't support Geolocation
				handleGeolocationError(false, infoWindow, map.getCenter());
			}
		});
}

function handleGeolocationError(browserHasGeolocation, infoWindow, pos) {
	infoWindow.setPosition(pos);
	infoWindow.setContent(browserHasGeolocation ?
												'Error: The Geolocation service failed.' :
												'Error: Your browser doesn\'t support geolocation.');
	infoWindow.open(map);
}

function handleSearchSubmit() {
	console.log('handleSearch ran.');
	$('#js-search-form').submit(function(e) {
		e.preventDefault();
		console.log('handleSearch submit clicked.');
		const submitLocation = $('.js-location-entry').val();
		let coords = codeAddress(submitLocation);
	});
}

function reverseGeocode() {
	console.log('reverseGeocode ran.');
	geocoder.geocode({'location': pos}, function(results, status) {
	if (status === 'OK') {
		if (results[0]) {
				console.log(`reverseGeocode results are ${results[0].formatted_address}.`)
				$('.js-location-entry').val(results[0].formatted_address);
		}
	} else {
		window.alert('Geocoder failed due to: ' + status);
	}
	});
}

function watchResultsToggle() {
	console.log('watchResultsToggle ran.');
	$('button.results-toggle-btn').on('click', (e) => {
			console.log('Results toggle btn clicked.');
			$('div.results-container').slideToggle();
	});
}

function watchOptionsToggle() {
	console.log('watchOptionsDropdown ran.');
	$('button.options-toggle-btn').on('click', (e) => {
			console.log('Options toggle btn clicked.');
			$('div.options-container').slideToggle();
	});
}

function renderStartPage() {
	$('button.results-toggle-btn').prop('disabled', true);
	initMap();
	handleSearchSubmit();
	handleGeolocatePress();
	watchOptionsToggle();
	watchResultsToggle();
}

function showPolygons() {
	console.log('showPolygons ran.');
	let travelOptions = r360.travelOptions();

	let time = new Date();
	let currentTimeInSeconds = ((time.getHours() * 60) + time.getMinutes()) * 60
	let currentDate = String(time.getFullYear()) + (Number(time.getMonth()) < 10 ? 0 : '') + String(time.getMonth()+1) + String(time.getDate())

	let transitType = $('#js-search-form-transit-type').val();

	let travelTimes = [600, 1200, 1800];

	travelOptions.setServiceKey("9R3ACENBBE1POU85N7PVMSR");
	travelOptions.setServiceUrl("https://service.route360.net/northamerica/");
	travelOptions.addSource({ lat: pos.lat, lng: pos.lng });
	travelOptions.setTravelTimes(travelTimes);
	travelOptions.setTravelType(transitType);
	travelOptions.setDate(currentDate);
	travelOptions.setTime(currentTimeInSeconds);

	// call the service
	r360.PolygonService.getTravelTimePolygons(travelOptions,
		function(polygons) {
			colorPolygonLayer.update(polygons);
			//Map colors changed to greens and purples for color-blind accessibility.
			colorPolygonLayer.setColors([{
				'time': 600,
				'color': '#405d27'
				}, {
				'time': 1200,
				'color': '#e9a3c9'
				}, {
				'time': 1800,
				'color': '#af8dc3'
				}, ]);
		},
		function(status, message) {
			console.log("The route360 API is not available - double check your configuration options.");
		}
	);
}

console.log('App started.');
$(renderStartPage);
