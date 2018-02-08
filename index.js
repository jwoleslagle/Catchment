
let geocoder, map, colorPolygonLayer;
let pos = {
	lat: 41.2380564,
	lng: -96.1429296
};
let markersArray = [];
let FIPS = {};

function initMap() {
	console.log('initMap ran.');
	geocoder = new google.maps.Geocoder();
	let latlng = new google.maps.LatLng(pos.lat, pos.lng); 
	let mapOptions = {
		zoom: 4,
		center: pos
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
			$('button.clear-markers-btn').prop('disabled', false);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

function displayResults() {
	let resultsString = `
		<p>Current position is ${pos.lat}, ${pos.lng}.<br />
		Current FIPS ID is ${FIPS.FIPS}.</p>
		`;
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
	$('button.clear-markers-btn').prop('disabled', false);
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
	infoWindow.setContent('Closest location found.');
	setTimeout(function () { infoWindow.open(map); }, 1000);
	setTimeout(function () { infoWindow.close(); }, 3000);

	map.setCenter(pos);
	map.setZoom(15);

	getFIPS();
}

function generateFIPSObj(longFIPS) {
	console.log(`generateFIPSObj ran with FIPS ID: ${longFIPS}.`);
	FIPS.FIPS = longFIPS;
	FIPS.stateFIPS = longFIPS.substr(0, 2); 
	FIPS.countyFIPS = longFIPS.substr(2, 3);
	FIPS.tract = longFIPS.substr(5, 6);
	FIPS.blockGroup = longFIPS.substr(11, 1);
	FIPS.block = longFIPS.substr(11, 4);
	console.log(FIPS);
	displayResults();
}

function getFIPS() {
	let basicFIPS = '';
	let query = {
		Lat: pos.lat,
		Lng: pos.lng	};
	$.get("/api", query, generateFIPSObj);
}

function handleClearMarkersPress() {
	$('button.clear-markers-btn').on('click', (e) => {
		console.log('Clear markers button pressed.');
		clearOverlays();
	});
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
					handleLocationError(true, infoWindow, map.getCenter());
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

function watchAdvOptionsDropdown() {
	console.log('watchAdvOptionsDropdown ran.');
	$('button.dropdown-btn').on('click', (e) => {
			console.log('Dropdown btn clicked.');
			$('div.advanced-options').slideToggle();
	});
}

function renderStartPage() {
	initMap();
	watchAdvOptionsDropdown();
	$('button.clear-markers-btn').prop('disabled', true);
	handleSearchSubmit();
	handleGeolocatePress();
	handleClearMarkersPress();
}

function showPolygons() {
	console.log('showPolygons ran.');
	let travelOptions = r360.travelOptions();
	travelOptions.setServiceKey("9R3ACENBBE1POU85N7PVMSR");
	travelOptions.setServiceUrl("https://service.route360.net/northamerica/");
	travelOptions.addSource({ lat: pos.lat, lng: pos.lng });
	travelOptions.setTravelTimes([600, 1200, 1800]);
	travelOptions.setTravelType("car");
	travelOptions.setDate("20150706");
	travelOptions.setTime("39000");

	// call the service
	r360.PolygonService.getTravelTimePolygons(travelOptions,
		function(polygons) {
			colorPolygonLayer.update(polygons);
		},
		function(status, message) {
			console.log("The route360 API is not available - double check your configuration options.");
		}
	);
}

console.log('App started.');
$(renderStartPage);

// Code parking lot
