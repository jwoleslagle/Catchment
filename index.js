let geocoder, map, colorPolygonLayer;
let pos = { lat: 41.2380564, lng: -96.1429296 };
let markersArray = [];
let placeMarkersArray = [];
const FIPS = {};
const censusData = {};
const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

////////////////////////////
//// MAP LAYER FUNCTIONS
////////////////////////////

//InitMap creates the base layer of the Google Map and positions the controls
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

//Clears all markers (position and places) from map. Fix this to reset travel times overlay.
function clearOverlays() {
	while(markersArray.length) { markersArray.pop().setMap(null); }
	while(placeMarkersArray.length) { placeMarkersArray.pop().setMap(null); }
}

//Removes only place markers - needed for draggable position marker
function clearPlaceMarkers() {
	while(placeMarkersArray.length) { placeMarkersArray.pop().setMap(null); }
}

////////////////////////////
//// LOCATION FINDING FUNCTIONS
////////////////////////////

//converts coordinates to street address
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

//Determines an approximate street address for coordinates and displays it in the search field.
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

////////////////////////////
//// CENSUS DATA FUNCTIONS
////////////////////////////

//Gets FIPS ID from server based on coordinates provided.
function getFIPS() {
	let query = {
		Lat: pos.lat,
		Lng: pos.lng	};
	$.get("/fips", query, generateFIPSObj);
}

//Deconstructs Census FIPS ID for use in queries
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

//Adds appropriate predicate to census endpoint based on user's choice for data comparison
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

//Gets tract level census data from Census API. This is the smallest area possible for AC5 subject tables)
function getCensusLocalData() {
	console.log(`getCensusLocalData ran.`);
	let locale = "tract";
	let query = {
		url: buildCensusEndpoint(locale) };
	$.get("/census", query, processCensusDataStep1of2);
}

//A ping-pong function which helps build the census results object. This is required for state control from getCensusLocalData.
function processCensusDataStep1of2(data) {
	censusData.local = data;
	getCensusComparisonData();
}

//Gets comparison data from Census API based on user preferences
function getCensusComparisonData() {
	console.log(`getCensusComparison ran.`);
	let locale = $('input[name=compLocale]:checked').val();
	let query = {
		url: buildCensusEndpoint(locale) };
	
	$.get("/census", query, processCensusDataStep2of2);
}

//A ping-pong function which helps build the census results object. This is required for state control from getCensusComparisonData.
function processCensusDataStep2of2(data) {
	censusData.comp = data;
	displayResults();
}

////////////////////////////
//// MAP MARKER AND OVERLAY FUNCTIONS
////////////////////////////

//Drops position marker (not places markers) on map and informs user that marker is draggable.
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
	dropPlacesMarkers();
	//google.maps.event.addListener(marker,"click",function(){});
	$('button.results-toggle-btn').prop('disabled', false);
	google.maps.event.addListener(marker, 'dragend', function(event) {	
		pos.lat = event.latLng.lat();
		pos.lng = event.latLng.lng();
		map.setCenter(pos);
		reverseGeocode();
		clearPlaceMarkers();
		showPolygons();
		dropPlacesMarkers();
		getFIPS();
		});
	let infoWindow = new google.maps.InfoWindow;
	infoWindow.setPosition(pos);
	infoWindow.setContent('Drag and droppable.');
	setTimeout(function () { infoWindow.open(map); }, 1000);
	setTimeout(function () { infoWindow.close(); }, 2000);

	map.setCenter(pos);
	map.setZoom(15);

	getFIPS();
}

//triggers a set of Google Maps API functions that drop places on map based on type of user's input
function dropPlacesMarkers() {
	let placesInfoWindow = new google.maps.InfoWindow();
	let service = new google.maps.places.PlacesService(map);
	let type = $('input[name=showPlace]:checked').val();
	service.nearbySearch({
		location: pos,
		radius: 1500,
		type: [type]
	}, placesCallback);
}

//callback required for Google Places API call
function placesCallback(results, status) {
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		for (let i = 0; i < results.length; i++) {
		createPlaceMarker(results[i]);
		}
	}
}

//Puts place marker on map
function createPlaceMarker(place) {
	let placeLoc = place.geometry.location;
	let placeMarker = new google.maps.Marker({
		map: map,
		position: place.geometry.location,
		draggable: false,
		animation: google.maps.Animation.DROP,
		 icon: {
			path: google.maps.SymbolPath.CIRCLE,
			fillColor: '#00F',
			fillOpacity: 0.6,
			strokeColor: '#00A',
			strokeOpacity: 0.9,
			strokeWeight: 1,
			scale: 7
		}
	});
	placeMarkersArray.push(placeMarker);	
	let placesInfoWindow = new google.maps.InfoWindow();
	google.maps.event.addListener(placeMarker, 'click', function() {
		placesInfoWindow.setContent(place.name);
		placesInfoWindow.open(map, this);
	});
}

// Draws polygon travel times layer on base map.
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

////////////////////////////
//// EVENT WATCHER FUNCTIONS
////////////////////////////

//Gets somewhat accurate coordinates for user from browser. Browser handles consent.
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

//Experimenting with the best way to handle geolocation errors, usually due to older browsers.
function handleGeolocationError(browserHasGeolocation, infoWindow, pos) {
	infoWindow.setPosition(pos);
	infoWindow.setContent(browserHasGeolocation ?
												'Error: The Geolocation service failed.' :
												'Error: Your browser doesn\'t support geolocation.');
	infoWindow.open(map);
}

//Sends user-provided address to codeAddress to get geo coordinates, needed to get FIPS and census data.
function handleSearchSubmit() {
	console.log('handleSearch ran.');
	$('#js-search-form').submit(function(e) {
		e.preventDefault();
		console.log('handleSearch submit clicked.');
		const submitLocation = $('.js-location-entry').val();
		let coords = codeAddress(submitLocation);
	});
}

//Shows and hides the census data container.
function watchResultsToggle() {
	console.log('watchResultsToggle ran.');
	$('button.results-toggle-btn').on('click', (e) => {
			console.log('Results toggle btn clicked.');
			$('div.results-container').slideToggle();
	});
}

//Shows and hides the options container.
function watchOptionsToggle() {
	console.log('watchOptionsDropdown ran.');
	$('button.options-toggle-btn').on('click', (e) => {
			console.log('Options toggle btn clicked.');
			$('div.options-container').slideToggle();			$("div.options-container").css("display", "flex");

	});
}

////////////////////////////
//// DISPLAY FUNCTIONS
////////////////////////////

//Populates bottom results panel with travel times legend and census info.
function displayResults() {
	//Abbreviate census prefixes for more concise code
	let cmp = censusData.comp;
	let lcl = censusData.local;
	
	//Get ID of place type for better readability (val is used for params)
	let placeType = $('input[name=showPlace]:checked');
	let placeTypeID = placeType.attr('id');

	console.log(`displayResults ran with ${cmp.scope}.`);
	let resultsString = `
		<div class="results-outer">
			<div class="row results-inner">
				<div class="col-4">
					<div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">					
						<a class="nav-link active" id="v-pills-details-tab" data-toggle="pill" href="#v-pills-details" role="tab" aria-controls="v-pills-details" aria-selected="true">Map</a>

						<a class="nav-link" id="v-pills-pop-tab" data-toggle="pill" href="#v-pills-pop" role="tab" aria-controls="v-pills-pop" aria-selected="false">Population</a>

						<a class="nav-link" id="v-pills-demographics-tab" data-toggle="pill" href="#v-pills-demographics" role="tab" aria-controls="v-pills-demographics" aria-selected="false">Demographics</a>
						
						<a class="nav-link" id="v-pills-households-tab" data-toggle="pill" href="#v-pills-households" role="tab" aria-controls="v-pills-households" aria-selected="false">Households</a>
					</div>
				</div>
				<div class="col-8 v-aligner">
					<div class="tab-content" id="v-pills-tabContent">
						<div class="tab-pane fade show active" id="v-pills-details" role="tabpanel" aria-labelledby="v-pills-details-tab">
							<div class="center-it lgnd-bit-container" alt="Describes map overlay and symbols">
								<div class="lgnd-bit">Travel time (${$("#js-search-form-transit-type").val()}):</div><br />
								<div class="lgnd-bit"><span class="swatch swatch-short" alt="Color swatch for shortest travel time"></span> 10 min</div>
								<div class="lgnd-bit"><span class="swatch swatch-medium" alt="Color swatch for medium travel time"></span> 20 min</div>
								<div class="lgnd-bit"><span class="swatch swatch-long"></span> 30 min</div>
								<div class="lgnd-bit"><span class="swatch swatch-circle"></span> ${placeTypeID}</div>
							</div><br />
							<div class="small-text center-it">
								Locale: ${lcl.scope}.<br />
								Coords: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}.<br />
								FIPS ID: ${FIPS.FIPS}.
							</div>
						</div>
						<div class="tab-pane fade" id="v-pills-pop" role="tabpanel" aria-labelledby="v-pills-pop-tab">
							Total: ${numberWithCommas(lcl.populationTotal)} (${(((lcl.populationTotal / cmp.populationTotal)*100)).toFixed(1)}% of ${numberWithCommas(cmp.populationTotal)})<br />

							Male: ${lcl.popMalePct}% 
							(<span class="${cmp.popMalePct > lcl.popMalePct ? "comp-higher" : (cmp.popMalePct < lcl.popMalePct ? "comp-lower" : "comp-equal")}">${censusData.comp.popMalePct}%</span>)<br />
							
							Female: ${lcl.popFemalePct}% 
							(<span class="${cmp.popFemalePct > lcl.popFemalePct ? "comp-higher" : (cmp.popFemalePct < lcl.popFemalePct ? "comp-lower" : "comp-equal")}">${cmp.popFemalePct}%</span>)

							<div class="small-text center-it border-me-above">
								Comparing ${numberWithCommas(lcl.housingTotalOccupied)} residences in <br />${lcl.scope}<br /> with ${numberWithCommas(cmp.housingTotalOccupied)} residences in ${cmp.scope}. <br />Comparisons in parentheses.
							</div>
						</div>
						<div class="tab-pane fade" id="v-pills-demographics" role="tabpanel" aria-labelledby="v-pills-demographics-tab">
							Youth: ${lcl.popYouthPct}% 
							(<span class="${cmp.popYouthPct > lcl.popYouthPct ? "comp-higher" : (cmp.popYouthPct < lcl.popYouthPct ? "comp-lower" : "comp-equal")}">${cmp.popYouthPct}%</span>)<br />

							Adults: ${lcl.popAdultPct}% 
							(<span class="${cmp.popAdultPct > lcl.popAdultPct ? "comp-higher" : (cmp.popAdultPct < lcl.popAdultPct ? "comp-lower" : "comp-equal")}">${censusData.comp.popAdultPct}%</span>)<br />

							Seniors: ${lcl.popSeniorsPct}%
							(<span class="${cmp.popSeniorsPct > lcl.popSeniorsPct ? "comp-higher" : (cmp.popSeniorsPct < lcl.popSeniorsPct ? "comp-lower" : "comp-equal")}">${cmp.popSeniorsPct}%</span>)

							<div class="small-text center-it border-me-above">
								Comparing ${numberWithCommas(lcl.housingTotalOccupied)} residences in <br />${lcl.scope}<br /> with ${numberWithCommas(cmp.housingTotalOccupied)} residences in ${cmp.scope}. <br />Comparisons in parentheses.
							</div>
						</div>
						<div class="tab-pane fade" id="v-pills-households" role="tabpanel" aria-labelledby="v-pills-households-tab">
							Household Size: ${lcl.householdSize}
							(<span class="${cmp.householdSize > lcl.householdSize ? "comp-higher" : (cmp.householdSize < lcl.householdSize ? "comp-lower" : "comp-equal")}">${cmp.householdSize}</span>)<br />

							Income: $${numberWithCommas(lcl.medianHouseholdIncome)} 
							(<span class="${cmp.medianHouseholdIncome > lcl.medianHouseholdIncome ? "comp-higher" : (cmp.medianHouseholdIncome < lcl.medianHouseholdIncome ? "comp-lower" : "comp-equal")}">$${numberWithCommas(cmp.medianHouseholdIncome)}</span>)</br>
							
							Home Ownership: ${lcl.homeownerPct}% (<span class="${cmp.homeownerPct > lcl.homeownerPct ? "comp-higher" : (cmp.homeownerPct < lcl.homeownerPct ? "comp-lower" : "comp-equal")}">${cmp.homeownerPct}%</span>)

							<div class="small-text center-it border-me-above">
								Comparing ${numberWithCommas(lcl.housingTotalOccupied)} residences in <br />${lcl.scope}<br /> with ${numberWithCommas(cmp.housingTotalOccupied)} residences in ${cmp.scope}. <br />Comparisons in parentheses.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>`;

	$('div.results').html(resultsString);
	$('div.results-container').slideDown("slow");
}

////////////////////////////
//// DOCUMENT START FUNCTIONS & CALLBACK
////////////////////////////

//Document ready callback function - powers the page.
function renderStartPage() {
	$('button.results-toggle-btn').prop('disabled', true);
	initMap();
	handleSearchSubmit();
	handleGeolocatePress();
	watchOptionsToggle();
	watchResultsToggle();
}

console.log('App started.');
$(renderStartPage);
