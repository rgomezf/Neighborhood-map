// Initialize Model
var placeData = [
{
	name: 'Castle Island Park',
	street: '2010 William J Day Blvd',
	city: 'Boston, MA',
	description: 'Castle Island is located on Day Boulevard in South Boston on the shore of Boston Harbor. It has been the site of a fortification since 1634.',
	img: 'img/Castle-min.jpg',
	lat: 42.337500000000006,
	lng: -71.01055555555556
},
{
	name: 'Fenway Park',
	street: '4 Yawkey Way',
	city: 'Boston, MA',
	description: 'Historic, small-capacity ballpark, home of the Red Sox & occasional big-name concert venue.',
	img: 'img/Fenway-min.png',
	lat: 42.34638888888889,
	lng: -71.0975
},
{
	name: 'Museum of Fine Arts',
	street: '465 Huntington Ave',
	city: 'Boston, MA',
	description: 'Neoclassical & modern wings house a vast collection from ancient Egyptian to contemporary American. ',
	img: 'img/Museum-min.png',
	lat: 42.3394567,
	lng:  -71.09414279999999
},
{
	name: 'Old North Church',
	street: '193 Salem St.',
	city: 'Boston, MA',
	description: "Hallowed 18th-century church & launch point for Paul Revere's revolutionary ride, with tours & more",
	img: 'img/Church-min.png',
	lat: 42.36611111111111,
	lng: -71.05445555555555
},
{
	name: 'Symphony Hall',
	street: '301 Massachusetts Avenue',
	city: 'Boston, MA',
	description: ' Designed by McKim, Mead and White, it was built in 1900 for the Boston Symphony Orchestra, which continues to make the hall its home. The hall was designated a U.S. National Historic Landmark in 1999. It was then noted that "Symphony Hall remains, acoustically, among the top three concert halls in the world ... and is considered the finest in the United States.',
	img: 'img/Garden-min.png',
	lat: 42.342594444444444,
	lng:-71.08580555555555
}
];

// Binding the model
function initMap() {
	'use strict';
	ko.applyBindings(new ViewModel());
}

// Constructor for Place
var Place = function(data) {
	this.name = ko.observable(data.name);
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.img = ko.observable(data.img);
	this.addrs = ko.computed(function() {
        return data.street + ", " + data.city;
    }, this);
    this.link = ko.observable();
    this.checkinsCount = ko.observable();
    this.address = ko.observable();
};

// Display an Error Message if the Google API Couldn't load
function errorHandler() {
    "use strict";
    document.getElementById('map').innerHTML = "<h2>Something happened while loading the Map.</h2>";
}
// Initialize ViewModel
var ViewModel = function() {
	var self = this;

	// Set location list observable array from PlaceData
	self.locList = ko.observableArray([]);
	// Get value from search field.
	self.search = ko.observable('');

	// Make place object from each item in location list then push to observable array.
	placeData.forEach(function(item){
		self.locList.push(new Place(item));
	}, self);

	// Initial current location to be the first one.
	self.currentPlace = ko.observable(this.locList()[0]);

	// Initial status of the sidebar
	self.hideShow = ko.observable(true);

	// Initialize Google Maps
  	self.map = new google.maps.Map(document.getElementById('map'), {
        	center: {lat: 42.33, lng: -71.02},
            zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
        });

	// Functions invoked when user clicked an item in the list.
	self.setPlace = function(clickedPlace) {

		// Set current location to which user clicked.
		self.currentPlace(clickedPlace);

		// Find index of the clicked location
		var index = self.results().indexOf(clickedPlace);

		// Prepare content for Google Maps infowindow
		self.updateContent(clickedPlace);

		// Hide the sidebar
		self.hideShowSidebar(false);

		// Activate the selected marker to change icon.
		self.activateMarker(self.markers[index], self, self.infowindow)();

	};

    // Filter location name with value from search field.
	self.results = ko.computed(function() {
	    var searchTerm = self.search().toLowerCase();
	    if (!searchTerm) {
	        return self.locList();
	    } else {
	        return ko.utils.arrayFilter(self.locList(), function(item) {
	        	// return true if found the typed keyword, false if not found.
            	return item.name().toLowerCase().indexOf(searchTerm) !== -1;
	        });
	    }
	});

  	// Initialize markers
	self.markers = [];

	// Initialize foursquare
	self.foursquareResults = ko.observableArray([]);

	// Initialize infowindow
	self.infowindow = new google.maps.InfoWindow({
		maxWidth: 330
	});

	// Render all markers with data from the data model.
	self.createMarkers(self.locList());

	// Subscribe to changed in search field.
  	self.results.subscribe(function(){
		self.createMarkers(self.results());
  	});

  	// when the user clicks in a non-marker area icons return to defaults
  	// and close de infowindow
	google.maps.event.addListener(self.map, 'click', function(event) {

		// return defaults icons.
		self.defaultIcons();

		// Every click close all indowindows.
	    self.infowindow.close();

	    // show the sidebar
	    self.hideShowSidebar(true);
	});

    // when the user close the infowindow icons return to defaults
	google.maps.event.addListener(self.infowindow,'closeclick',function(){
     // return defaults icons.
		self.defaultIcons();
		self.hideShowSidebar(true);
    });
};

// Method for render all markers.
ViewModel.prototype.createMarkers = function(arrayInput) {

	var infowindow = this.infowindow;
	var self = this;
	var display = arrayInput;
    var k = this.markers.length;
    var len = display.length;

	// Take out old markers from the map
	for (var j = 0; j < k; j++) {
		this.markers[j].setMap(null);
	}

	// Create new marker for each place in array and push to markers array
  	for (var i = 0; i < len; i++){

		var location = {lat: display[i].lat(), lng: display[i].lng()};
		var marker = new google.maps.Marker({
				position: location,
				map: this.map,
				icon: 'img/iconDefault.png'
			});

		this.markers.push(marker);

		//render in the map
		this.markers[i].setMap(this.map);
		this.map.setCenter(location);

		// add event listener for click event to the newly created marker
		marker.addListener('click', this.activateMarker(marker, self, infowindow, i));
  	}

};

// Set all marker icons back to default icons.
ViewModel.prototype.defaultIcons = function() {
	var markers = this.markers;
	var len = markers.length;
	for (var i = 0; i < len; i++) {
		markers[i].setIcon('img/iconDefault.png');
	}
};

// Hide/Show the sidebar on user click
ViewModel.prototype.hideShowSidebar = function(value) {
	if (value === null && typeof value === "object")
	 this.hideShow(true);
	else this.hideShow(value);

};

// move map view so that the point is at the center bottom of the map
ViewModel.prototype.centerMap = function(place, offsetIt) {
	var self = this;
	if (offsetIt !== true) {
	    self.map.setCenter(place.position);
	}
	else {
	    var scale = Math.pow(2, self.map.getZoom());
	    var mapHeight = $(window).height();
	    var projection = self.map.getProjection();
	    var pixPosition = projection.fromLatLngToPoint(place.position);
	    var pixPosNew = new google.maps.Point(
	        pixPosition.x,
	        pixPosition.y - (mapHeight * 0.45 / scale)
	    );
	    var posLatLngNew = projection.fromPointToLatLng(pixPosNew);
	    self.map.setCenter(posLatLngNew);
	}
};
// Set the target marker to change icon and open infowindow
ViewModel.prototype.activateMarker = function(marker, context, infowindow, index) {
	return function() {

		// check if have an index. If have an index mean request come from click on the marker event
		if (!isNaN(index)) {
			var place = context.results()[index];
			context.updateContent(place);
		}
		// closed opened infowindow
		infowindow.close();

		// Icons back to default
		context.defaultIcons();

		// Hide the sidebar
		context.hideShowSidebar(false);

		context.centerMap(marker, true);

		// Open targeted infowindow and change its icon.
		infowindow.open(context.map, marker);
		marker.setIcon('img/iconActive.png');
	};
};

// Change the content of infowindow
ViewModel.prototype.updateContent = function(place){
	var lat = place.lat(),
        lng = place.lng(),
        html = "",
        self = this;

    // Using an Ajax call for the foursquare information
    $.ajax({
        method: 'GET',
        type: 'json',
        url: 'https://api.foursquare.com/v2/venues/search',
        data: {
            ll: lat + ',' + lng,
            client_id: 'TFRNPMAZSVO544LSS0YZCPKSGSNXBQZIL0JLGVXNQBX25MYW',
            client_secret:'BW5JMW0MSFGPZ4AHHFGVVZZZBXR5P5CB3LTYPYHKGFPFRNZJ',
            v: '20151001'
        },
    })
    .done(function(data) {
        self.foursquareResults([]);
        var results = data.response.venues;

        for(var i in results){
            var result = results[i];

            // Preparing the content of the infowindo
			html = '<div class="info-content"> ' +
				   '<img src="' + place.img() + '">';

            var formattedResult = {
                name: result.name,
                url: result.url,
                checkinsCount: result.stats.checkinsCount,
                description: result.description,
                address: result.location.formattedAddress,
                pic: result.bestPhoto
            };
			self.foursquareResults.push(formattedResult);

			/* name */
			if (self.foursquareResults()[0].name !== null && self.foursquareResults()[0].name !== undefined){
				html = html + '<h3>' + self.foursquareResults()[0].name + '</h3>';
			}
			/* Url */
			if (self.foursquareResults()[0].url !== null && self.foursquareResults()[0].url !== undefined){
				html = html + '<h4> Website: </h4> <p>' + self.foursquareResults()[0].url + '</p>';
			}
			/* checks */
			if (self.foursquareResults()[0].checkinsCount !== null && self.foursquareResults()[0].checkinsCount !== undefined){
				html = html + '<h4> CheckinsCount: </h4> <p>' + self.foursquareResults()[0].checkinsCount + '</p>';
			}
			/* Description */
			if (self.foursquareResults()[0].description !== null && self.foursquareResults()[0].description !== undefined){
				html = html + '<h4> Description: </h4> <p>' + self.foursquareResults()[0].description + '</p>';
			}
			/* address */
            if (self.foursquareResults()[0].address !== null && self.foursquareResults()[0].address !== undefined){
                html =  html + '<h4> Address: </h4><p>' + self.foursquareResults()[0].address + '</p></div>';
            }
			self.infowindow.setContent(html);
		}
    })
    .fail(function(){
        self.foursquareResults([]);
        alert('There was an error from Foursquare');
        self.infowindow.close();
        self.hideShowSidebar(true);
        self.defaultIcons();
    });

};

