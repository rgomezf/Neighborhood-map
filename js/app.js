// Initialize Model
var placeData = [
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
            name: 'Castle Island Park',
            street: '2010 William J Day Blvd',
            city: 'Boston, MA',
            description: 'Castle Island is located on Day Boulevard in South Boston on the shore of Boston Harbor. It has been the site of a fortification since 1634.',
            img: 'img/Castle-min.jpg',
            lat: 42.337500000000006, 
            lng: -71.01055555555556
        }
];

// Binding the model
function initMap() {
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

	// Initialize Google Maps
  	self.map = new google.maps.Map(document.getElementById('map'), {
        	center: {lat: 42.33, lng: -71.02},
            zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
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
	var context = this;
	var display = arrayInput;
    
	// Take out old markers from the map
	for (var j = 0, k = this.markers.length; j < k; j++) {
		this.markers[j].setMap(null);
	}

	// Create new marker for each place in array and push to markers array
  	for (var i = 0, len = display.length; i < len; i++){

		var location = {lat: display[i].lat(), lng: display[i].lng()};
		var marker = new google.maps.Marker({
				position: location,
				map: this.map,
				icon: 'img/iconDefault.png'
			});
		this.markers.push(marker);

		//render in the map
		this.markers[i].setMap(this.map);

		//Get information from Foursquare 
        this.infoPlace(display[i].name());

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

// Hide/Show the sidebar on user click
ViewModel.prototype.hideShowSidebar = function(value) {	
	if (value === null && typeof value === "object") 
	 this.hideShow(true);
	else this.hideShow(value);

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
        type: 'jsonp',
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
                address = address = result.location.address + '. ' +
                		result.location.city + ', ' +
                		result.location.state+ '. ' +
                		result.location.country;    

            var formattedResult = {
                name: result.name,
                link: result.url,                
                checkinsCount: result.stats.checkinsCount,
                description: result.description,
                address: address
            };                     
            //console.log(formattedResult);            
            self.foursquareResults.push(formattedResult);           

            // Preparing the content of the infowindo
			html = '<div class="info-content">' +
				   '<img src="' + place.img() + '">' +				   
				   '<h3>' + self.foursquareResults()[0].name + '</h3>' +
				   '<h4> Website: </h4> <p>' + self.foursquareResults()[0].link + '</p>' +
				   '<h4> checkinsCount: </h4> <p>' + self.foursquareResults()[0].checkinsCount + '</p>' +				   
				   '<h4> Address: </h4><p>' + self.foursquareResults()[0].address + '</p></div>';   
			self.infowindow.setContent(html);	          }        
    })
    .fail(function(){
        self.foursquareResults([]);
        alert('There was an error from foursquare');
    });	
	
};

ViewModel.prototype.infoPlace = function(place) {
};

// Initialize Knockout View Model
// ko.applyBindings(new ViewModel());
// Foursquare ID: TFRNPMAZSVO544LSS0YZCPKSGSNXBQZIL0JLGVXNQBX25MYW
// 4Square Secret: BW5JMW0MSFGPZ4AHHFGVVZZZBXR5P5CB3LTYPYHKGFPFRNZJ
