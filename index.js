
let geocoder, map, colorPolygonLayer;
let pos = {
	lat: 41.2380564,
	lng: -96.1429296
};
let markersArray = [];
let FIPS = {};

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

function displayResults(censusData) {
	console.log(`displayResults ran with ${censusData.tract.scope}.`);
	let resultsString = `
		<div class="results-outer">
			<div class="center-it">Travel time: <span class="short-cube"></span> 10 min    <span class="medium-cube"></span> 20 min    <span class="long-cube"></span> 30 min</div>
			<div class="center-it">${censusData.tract.housingTotalOccupied} residences nearby in ${censusData.tract.scope}:</div>
				<div class="results-inner">
					<div class="results-panel">
						<div class="data-indent">
							<div class="bold-it">Population:</div>
								Total: ${numberWithCommas(censusData.tract.populationTotal)}<br />
								Male: ${censusData.tract.popMalePct}%<br />
								Female: ${censusData.tract.popFemalePct}%<br />
						</div>
					</div>

					<div class="results-panel">
						<div class="data-indent">
							<div class="bold-it">Demographics:</div>
								Youth: ${censusData.tract.popYouthPct}%<br />
								Adults: ${censusData.tract.popAdultPct}%<br />
								Seniors: ${censusData.tract.popSeniorsPct}%<br />
						</div>
					</div>

					<div class="results-panel">
						<div class="data-indent">
							<div class="bold-it">Household Info:</div>
								Household Size: ${censusData.tract.householdSize}<br />
								Median Income: $${numberWithCommas(censusData.tract.medianHouseholdIncome)}</br>
								Home Ownership: ${censusData.tract.homeownerPct} %</br>
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
	infoWindow.setContent('Drag and drop me!');
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
	console.log(FIPS);
	getCensusTract(FIPS);
}

function getFIPS() {
	let query = {
		Lat: pos.lat,
		Lng: pos.lng	};
	$.get("/fips", query, generateFIPSObj);
}

function getCensusTract(fips) {
	console.log(`getCensusTract ran with ${fips.tract}.`);
	let query = {
		tract: fips.tract,
		county: fips.county,
		state: fips.state	};
	$.get("/ac5_tract", query, displayResults);
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

// Code parking lot

