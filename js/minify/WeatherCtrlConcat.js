// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var starter = angular.module('starter', ['ionic', 'ngCordova']);


starter.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }

        // GOOGLE ANALYTICS

    /*
        $cordovaGoogleAnalytics.startTrackerWithId('UA-59584237-1');  
    */
    });
});

starter.config(function($stateProvider) {
    $stateProvider
        .state('index', {
            url: '/',
            templateUrl: 'index.html'
        })
        .state('Definir_un_trajet', {
            url: '/templates',
            templateUrl: 'Definir_un_trajet.html'
        });
});

var app = angular.module('app', ['ionic', 'ngCordova']);

function WeatherCtrl($scope, $http, $ionicLoading, $compile, $cordovaGoogleAnalytics, $cordovaGeolocation) {

    var FORECASTIO_KEY, posOptions;
    FORECASTIO_KEY = '1706cc9340ee8e2c6c2fecd7b9dc5a1c';		//~ Clé forecast pour se connecter à l'API
    posOptions = {timeout: 10000, enableHighAccuracy: false};
    
    //~ En cas de problème (non connexion à internet, soucis avec les serveurs de forecast.io ou Google,...
    function httpError(response) {
        $ionicLoading.hide();
        alert('Impossible de récupérer les informations');
    }

    //~ On récupère la réponse des serveurs de forecast.io et on cache l'îcone de loading
    function httpSuccessSearchWeather(response) {
        $scope.weather = response;
        $ionicLoading.hide();
    }

    //~ On envoie une requête aux serveurs de forecast.io pour qu'ils nous renvoient la météo aux coordonnées récupérées
    function httpSuccessGetCoordonates(response) {
        $scope.coordonates = response;
        var url = "https://api.forecast.io/forecast/" + FORECASTIO_KEY + "/" + $scope.coordonates.results[0].geometry.location.lat + "," + $scope.coordonates.results[0].geometry.location.lng + "?units=si";
        $http.get(url).success(httpSuccessSearchWeather).error(httpError);
    }

    //~ Fonction pour récupérer les prévisions météo à des coordonnées en se connectant à l'API forecast.io 	
    $scope.searchWeather = function (address) {
        document.addEventListener("deviceready", function () {
            function waitForAnalytics() {
                if (typeof analytics !== 'undefined') {
                    $cordovaGoogleAnalytics.trackEvent('city', 'click', 'Adresse Saisie');
                } else {
                    setTimeout(function () {
                        waitForAnalytics();
                    }, 250);
                }
            }
            waitForAnalytics();
        }, false);
        //~ On affiche un gif de loading
        $scope.loading = $ionicLoading.show({
            template: 'Récupération des données météorologiques...',
            showBackdrop: false
        });
        //~ On récupère les coordonnées
        var urlbis = "http://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&language=fr&&sensor=false";
        $http.get(urlbis).success(httpSuccessGetCoordonates).error(httpError);
    };


    //~ On récupère l'adresse fournie par les serveurs de Google 
    function httpSuccessGeolocateSuccess(response) {
        $scope.coordonates = response;
        $scope.city = response.results[0].formatted_address;
        // On affiche la valeur obtenue par géolocalisation
        if ($scope.city) {
            document.getElementById('city').value = $scope.city;
        }
        $ionicLoading.hide();
    }
    
    //~ On récupère les coordonnées dans une variable à part pour pouvoir afficher l'adresse du lieu où l'on est
    function httpSuccessGeolocate(response) {
        $scope.weather = response;
        navigator.geolocation.getCurrentPosition(function (position) {
            $http.get("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude + "&sensor=false").success(httpSuccessGeolocateSuccess).error(httpError);
        });
    }

/*
    var posOptions = {timeout: 10000, enableHighAccuracy: false};
*/
    $scope.geolocate = function () {
        $scope.loading = $ionicLoading.show({
            template: 'Récupération des données météorologiques...',
            showBackdrop: false
        });
        $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function (position) {
                $http.get("https://api.forecast.io/forecast/" + FORECASTIO_KEY + "/" + position.coords.latitude + "," + position.coords.longitude + "?units=si").success(httpSuccessGeolocate).error(httpError);
            }, function (err) {
                alert("Erreur : impossible de vous géolocaliser");
                $ionicLoading.hide();
            });
    };






    //~ Fonction permettant de suggérer des résultats au moment de l'entrée de la ville en input
    $scope.initializeAutocomplete = function (id) {
        var addresse_a_completer, autocomplete, options;
        addresse_a_completer = document.getElementById(id);
        if (addresse_a_completer) {
            // On restreint l'autocomplétion à la France
            options = { componentRestrictions: {country: 'fr'} };
            autocomplete = new google.maps.places.Autocomplete(addresse_a_completer, options);
            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                var place = this.getPlace();
                if (place.address_components) {
                    $scope.address_autocomplete = place.address_components[0].short_name + ' ' + place.address_components[1].short_name + ' ' + place.address_components[2].short_name;
                }
            });
        }
    };



    $scope.initializeAutocomplete("city"); // On initialise l'autocomplétion

    $scope.Math = Math;		//Importation du module Math pour arrondir les températures

      //~ Initialisations des variables servant à définir la date actuelle   
/*    var d = new Date();
    var heure_actuelle = d.getHours();
    var minute_actuelle = d.getMinutes();
    $scope.heure_actuelle = heure_actuelle.toString()+"h";
    $scope.minute_actuelle = minute_actuelle.toString()+"min";*/


    //~ GOOGLE ANALYTICS

    document.addEventListener("deviceready", function () {
        function waitForAnalytics() {
            if (typeof analytics !== 'undefined') {
                $cordovaGoogleAnalytics.startTrackerWithId('UA-59584237-1');
                $cordovaGoogleAnalytics.trackView('Prévision Météo');
            } else {
                setTimeout(function () {
                    waitForAnalytics();
                }, 250);
            }
        }
        waitForAnalytics();
    }, false);


/*  var options = {
    date: new Date(),
    mode: 'date', // or 'time'
    minDate: new Date() - 10000,
    allowOldDates: true,
    allowFutureDates: false,
    doneButtonLabel: 'DONE',
    doneButtonColor: '#F2F3F4',
    cancelButtonLabel: 'CANCEL',
    cancelButtonColor: '#000000'
  };

  document.addEventListener("deviceready", function () {

    $cordovaDatePicker.show(options).then(function(date){
    });

  }, false);*/
}

WeatherCtrl.$inject = ['$scope', '$http', '$ionicLoading', '$compile', '$cordovaGoogleAnalytics', '$cordovaGeolocation'];

app.controller('WeatherCtrl', WeatherCtrl);
