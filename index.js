let geocoder, map;
let pos = {
	lat: 41.2380564,
	lng: -96.1429296
};
let markersArray = [];
let fips = {};

function initMap() {
	console.log('initMap ran.');
	geocoder = new google.maps.Geocoder();
	let latlng = new google.maps.LatLng(pos.lat, pos.lng); 
	let mapOptions = {
		zoom: 4,
		center: pos
		}
	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
	$('div.advanced-options').hide();
	$('div.results').hide();
}

function clearOverlays() {
  for (var i = 0; i < markersArray.length; i++ ) {
    markersArray[i].setMap(null);
  }
  markersArray.length = 0;
}

function codeAddress(address) {
	console.log('codeAddress ran.');
	let infoWindow = new google.maps.InfoWindow;
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == 'OK') {
			pos.lat = results[0].geometry.location.lat();
			pos.lng = results[0].geometry.location.lng();
			map.setCenter(results[0].geometry.location);
			map.setZoom(16);
			let marker = new google.maps.Marker({
				map: map,
				position: pos});
			markersArray.push(marker);
			google.maps.event.addListener(marker,"click",function(){});
			$('button.clear-markers-btn').prop('disabled', false);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

function generateFIPS() {
	const url = "http://data.fcc.gov/api/block/find?format=json&latitude=" +
    pos.lat + "&longitude=" +  pos.lng + "&showall=true";
		
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
					let marker = new google.maps.Marker({
						map: map,
						draggable: true,
						position: pos});
					markersArray.push(marker);
					google.maps.event.addListener(marker,"click",function(){});
					$('button.clear-markers-btn').prop('disabled', false);
					infoWindow.setPosition(pos);
					infoWindow.setContent('Closest location found.');
					infoWindow.open(map);
					setTimeout(function () { infoWindow.close(); }, 3000);
					map.setCenter(pos);
					map.setZoom(14);
					reverseGeocode();
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
			$('div.advanced-options').toggle();
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

console.log('App started.');
$(renderStartPage);

// Code holding bin

//	infoWindow.setPosition(pos);
//	infoWindow.setContent('Closest location found.');
// 	infoWindow.open(map);
