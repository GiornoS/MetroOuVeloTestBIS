function WeatherCtrl(a,b,c,d,e,f){function g(){c.hide(),alert("Impossible de récupérer les informations")}function h(b){a.weather=b,c.hide()}function i(c){a.coordonates=c;var d="https://api.forecast.io/forecast/"+l+"/"+a.coordonates.results[0].geometry.location.lat+","+a.coordonates.results[0].geometry.location.lng+"?units=si";b.get(d).success(h).error(g)}function j(b){a.coordonates=b,a.city=b.results[0].formatted_address,a.city&&(document.getElementById("city").value=a.city),c.hide()}function k(c){a.weather=c,navigator.geolocation.getCurrentPosition(function(a){b.get("http://maps.googleapis.com/maps/api/geocode/json?latlng="+a.coords.latitude+","+a.coords.longitude+"&sensor=false").success(j).error(g)})}var l,m;l="1706cc9340ee8e2c6c2fecd7b9dc5a1c",m={timeout:1e4,enableHighAccuracy:!1},a.searchWeather=function(d){document.addEventListener("deviceready",function(){function a(){"undefined"!=typeof analytics?e.trackEvent("city","click","Adresse Saisie"):setTimeout(function(){a()},250)}a()},!1),a.loading=c.show({template:"Récupération des données météorologiques...",showBackdrop:!1});var f="http://maps.googleapis.com/maps/api/geocode/json?address="+d+"&language=fr&&sensor=false";b.get(f).success(i).error(g)},a.geolocate=function(){a.loading=c.show({template:"Récupération des données météorologiques...",showBackdrop:!1}),f.getCurrentPosition(m).then(function(a){b.get("https://api.forecast.io/forecast/"+l+"/"+a.coords.latitude+","+a.coords.longitude+"?units=si").success(k).error(g)},function(){alert("Erreur : impossible de vous géolocaliser"),c.hide()})},a.initializeAutocomplete=function(b){var c,d,e;c=document.getElementById(b),c&&(e={componentRestrictions:{country:"fr"}},d=new google.maps.places.Autocomplete(c,e),google.maps.event.addListener(d,"place_changed",function(){var b=this.getPlace();b.address_components&&(a.address_autocomplete=b.address_components[0].short_name+" "+b.address_components[1].short_name+" "+b.address_components[2].short_name)}))},a.initializeAutocomplete("city"),a.Math=Math,document.addEventListener("deviceready",function(){function a(){"undefined"!=typeof analytics?(e.startTrackerWithId("UA-59584237-1"),e.trackView("Prévision Météo")):setTimeout(function(){a()},250)}a()},!1)}var starter=angular.module("starter",["ionic","ngCordova"]);starter.run(function(a){a.ready(function(){window.cordova&&window.cordova.plugins.Keyboard&&cordova.plugins.Keyboard.hideKeyboardAccessoryBar(!0),window.StatusBar&&StatusBar.styleDefault()})}),starter.config(function(a){a.state("index",{url:"/",templateUrl:"index.html"}).state("Definir_un_trajet",{url:"/templates",templateUrl:"Definir_un_trajet.html"})});var app=angular.module("app",["ionic","ngCordova"]);WeatherCtrl.$inject=["$scope","$http","$ionicLoading","$compile","$cordovaGoogleAnalytics","$cordovaGeolocation"],app.controller("WeatherCtrl",WeatherCtrl);