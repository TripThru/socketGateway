function MapToolsError(error) {
  this.error = error;
  Error.captureStackTrace(this, MapToolsError);
}
MapToolsError.prototype = Object.create(Error.prototype);
MapToolsError.prototype.constructor = MapToolsError;

function Location(lat, lng) {
  this.lat = lat;
  this.lng = lng;
  this.id = this.lat + ',' + this.lng;
}

function MapTools() {
  
}

MapTools.prototype.isInside = function(location, coverage) {
  var distance = getDistance(coverage.center, location);
  return distance < coverage.radius;
};

var getDistance = function(location1, location2) {
  var lat1 = degreesToRadians(location1.lat);
  var lng1 = degreesToRadians(location1.lng);
  var lat2 = degreesToRadians(location2.lat);
  var lng2 = degreesToRadians(location2.lng);
  var dlon = lng2 - lng1;
  var dlat = lat2 - lat1;
  var a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) *
    Math.pow(Math.sin(dlon / 2), 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = 3961 * c;
  return d;
};

var degreesToRadians = function(angle) {
  return Math.PI * angle / 180;
};

module.exports.MapTools = new MapTools();
module.exports.Location = Location;