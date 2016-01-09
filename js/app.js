// Initialize Model
var placeData = [
        {
            name: 'Fenway Park',            
            street: '4 Yawkey Way',
            city: 'Boston, MA',
            description: 'Historic, small-capacity ballpark, home of the Red Sox & occasional big-name concert venue.',
            img: 'img/Fenway.png',
            lat: 42.34638888888889,
            lng: -71.0975
        },
        {
            name: 'Old North Church',
            street: '193 Salem St.',
            city: 'Boston, MA',
            description: "Hallowed 18th-century church & launch point for Paul Revere's revolutionary ride, with tours & more",
            img: 'img/Church.png',
            lat: 42.36611111111111, 
            lng: -71.05445555555555
        },
        {
            name: 'Symphony Hall',
            street: '301 Massachusetts Avenue',
            city: 'Boston, MA',
            description: ' Designed by McKim, Mead and White, it was built in 1900 for the Boston Symphony Orchestra, which continues to make the hall its home. The hall was designated a U.S. National Historic Landmark in 1999. It was then noted that "Symphony Hall remains, acoustically, among the top three concert halls in the world ... and is considered the finest in the United States.',
            img: 'img/Garden.png',
            lat: 42.342594444444444,
            lng:-71.08580555555555
        },
        {
            name: 'Museum of Fine Arts',            
            street: '465 Huntington Ave',
            city: 'Boston, MA',
            description: 'Neoclassical & modern wings house a vast collection from ancient Egyptian to contemporary American. ',
            img: 'img/Museum.png',
            lat: 42.3394567,
            lng:  -71.09414279999999
        },
        {
            name: 'Castle Island Park',
            street: '2010 William J Day Blvd',
            city: 'Boston, MA',
            description: 'Castle Island is located on Day Boulevard in South Boston on the shore of Boston Harbor. It has been the site of a fortification since 1634.',
            img: 'img/Castle.jpg',
            lat: 42.337500000000006, 
            lng: -71.01055555555556
        }
];

// Constructor for Place
var Place = function(data) {
	this.name = data.name;
	this.lat = data.lat;
	this.lng = data.lng;
	this.img = data.img;		
	this.description = data.description;
	this.addrs = ko.computed(function() {
        return data.street + ", " + data.city;
    }, this);
};

// Initialize ViewModel
var ViewModel = function() {
	var self = this;

	// Set location list observable array from PlaceData
	this.locList = ko.observableArray([]);
	// Get value from search field.
	this.search = ko.observable('');

	// Make place object from each item in location list then push to observable array.
	placeData.forEach(function(item){
		this.locList.push(new Place(item));
	}, this);

	// Initial current location to be the first one.
	this.currentPlace = ko.observable(this.locList()[0]);

	// Functions invoked when user clicked an item in the list.
	this.setPlace = function(clickedPlace) {

		// Set current location to which user clicked.
		self.currentPlace(clickedPlace);

		// Find index of the clicked location 
		var index = self.results().indexOf(clickedPlace);

		// Prepare content for Google Maps infowindow
		self.updateContent(clickedPlace);

		// Activate the selected marker to change icon.
		self.activateMarker(self.markers[index], self, self.infowindow)();

	};

    // Filter location name with value from search field.
	this.results = ko.computed(function() {
	    var searchTerm = self.search().toLowerCase();
	    if (!searchTerm) {
	        return self.locList();
	    } else {
	        return ko.utils.arrayFilter(self.locList(), function(item) {
	        	// return true if found the typed keyword, false if not found.
            	return item.name.toLowerCase().indexOf(searchTerm) !== -1;
	        });
	    }
	});

	// Initialize Google Maps
  	this.map = new google.maps.Map(document.getElementById('map'), {
        	center: {lat: 42.33, lng: -71.02},
            zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
        });

  	// Initialize markers
	this.markers = [];

	// Initialize infowindow
	this.infowindow = new google.maps.InfoWindow({
		maxWidth: 330
	});

	// Render all markers with data from the data model.
	this.createMarkers(self.locList());

	// Subscribe to changed in search field.
  	this.results.subscribe(function(){
		self.createMarkers(self.results());
  	});

  	// when the user clicks in a non-marker area icons return to defaults
  	// and close de infowindow
	google.maps.event.addListener(self.map, 'click', function(event) {

		// return defaults icons.
		self.defaultIcons();

		// Every click close all indowindows.
	    self.infowindow.close();
	});

};

// Method for render all markers.
ViewModel.prototype.createMarkers = function(arrayInput) {

	var infowindow = this.infowindow;
	var context = this;
	var display = arrayInput;
    
	// Take out old markers from the map
	for (var j = 0; j < this.markers.length; j++) {
		this.markers[j].setMap(null);
	}

	// Create new marker for each place in array and push to markers array
  	for (var i = 0, len = display.length; i < len; i++){

		var location = {lat: display[i].lat, lng: display[i].lng};
		var marker = new google.maps.Marker({
				position: location,
				map: this.map,
				icon: 'img/iconDefault.png'
			});
		this.markers.push(marker);

		//render in the map
		this.markers[i].setMap(this.map);

		// add event listener for click event to the newly created marker
		marker.addListener('click', this.activateMarker(marker, context, infowindow, i));
  	}
};

// Set all marker icons back to default icons.
ViewModel.prototype.defaultIcons = function() {
	var markers = this.markers;
	for (var i = 0; i < markers.length; i++) {
		markers[i].setIcon('img/iconDefault.png');
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

		// Open targeted infowindow and change its icon.
		infowindow.open(context.map, marker);
		marker.setIcon('img/iconActive.png');
	};
};

// Change the content of infowindow
ViewModel.prototype.updateContent = function(place){
	var html = '<div class="info-content">' +
		'<h3>' + place.name + '</h3>' +
		'<h4>' + place.addrs() + '</h4>' +
		'<img src="' + place.img + '">' +		
		'<p>' + place.description + '</p>' + '</div>';

	this.infowindow.setContent(html);
};

// Initialize Knockout View Model
ko.applyBindings(new ViewModel());
