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

var carte = angular.module('carte', ['ionic', 'ngCordova']);

function DirectionCtrl($scope, $http, $ionicLoading, $compile, $cordovaGoogleAnalytics, $ionicModal, $cordovaDatePicker, $timeout) {

    // Au départ la carte prend tout l'écran
    $scope.sizeMap = 'big';
    // directionsDisplay va permettre d'afficher le trajet sur la carte, mapToReload permet de recharger la map une fois que le modal est caché, et le marker permet de n'avoir qu'un seul marker sur la carte
    var directionsDisplay, mapToReload, marker;
    directionsDisplay = new google.maps.DirectionsRenderer();

    // Modal d'affichage de l'itinéraire
    $ionicModal.fromTemplateUrl('my-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function () {
        $scope.modal.show();
        // On affiche une carte plus petite pour coller avec le modal qui occupe la moitié de l'écran. Timeout pour éviter que la carte se recalibre avant que le modal ne soit affiché
        $timeout(function () {
            $scope.sizeMap = 'small';
        }, 400);
        // On centre la carte sur le point de départ
        $scope.map.setCenter($scope.donnees_du_trajet.routes[0].legs[0].steps[0].start_location);
        // On zoom sur les étapes
        $scope.map.setZoom(16);
        // On affiche la paneau avec les informations sur les étapes du trajet
        directionsDisplay.setPanel(document.getElementById('PanelTrajet'));
        // On recharge la carte à cause d'un bug lorsqu'on cache le modèle
        mapToReload = true;
    };

    $scope.closeModal = function () {
        $scope.modal.hide();
    };
    
    // Quand le modal est fermé on réaffiche la carte en version grand écran
    $scope.$on('modal.hidden', function () {
        // On réaffiche la map version grand écran
        $scope.sizeMap = 'big';
        

    });

    $scope.$on('$destroy', function () {
        // On réaffiche la map version grand écran
        google.maps.event.trigger($scope.map, 'resize');
        $scope.modal.remove();
    });
    
    $scope.reloadMap = function () {
        if (mapToReload) {
            google.maps.event.trigger($scope.map, 'resize');
            mapToReload = false;
        }
    };
    
    function initialize() {
        var paris, mapOptions, map;
        paris = new google.maps.LatLng(48.85834, 2.33752);
        mapOptions = {
            center: paris,
            zoom: 11,
            panControl : false,
            zoomControl : false,
            mapTypeControl : true,
            mapTypeControlOptions: {
                position : google.maps.ControlPosition.RIGHT_BOTTOM
            },
            scaleControl : false,
            streetViewControl : false,
            overviewMapControl : true,
            rotateControl : true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map"), mapOptions);
        directionsDisplay.setMap(map);
        $scope.map = map;
    }

    ionic.Platform.ready(initialize);

    $scope.centerOnMe = function () {
        $scope.show_donnees_du_trajet = false;
        if (!$scope.map) {
            return;
        }
        $scope.loading = $ionicLoading.show({
            template: 'Recherche de la position en cours...',
            showBackdrop: false
        });
        navigator.geolocation.getCurrentPosition(function (pos) {

            $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            $scope.map.setZoom(15);
            $ionicLoading.hide();

            var posit = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

            if (!marker) {
                marker = new google.maps.Marker({
                    position: posit,
                    map: $scope.map,
                    title: 'You are here'
                });
            } else {
                marker.setMap(null);
                marker = new google.maps.Marker({
                    position: posit,
                    map: $scope.map,
                    title: 'You are here'
                });
            }
            $http.get("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + pos.coords.latitude + "," + pos.coords.longitude + "&sensor=false").success(function (response) {
                // On affiche la ville de départ dans le formulaire
                $scope.address_autocomplete1 = response.results[0].formatted_address;
                $scope.city_start = angular.copy($scope.address_autocomplete1);
/*
                $scope.address_autocomplete1 = response.results[0].formatted_address;
*/
            }).error(function (response) {
                alert("Impossible de récupérer la géolocalisation");
            });
        }, function (error) {
            alert('Unable to get location: ' + error.message);
            $ionicLoading.hide();
        }, {
            timeout: 15000
        });
    };


    //~ Fonction permettant d'affcher et de désafficher la carte de définition du trajet
    $scope.showCard = function () {
        if ($scope.show_card_definir_un_trajet === true) {
            $scope.show_card_definir_un_trajet = false;
        } else {
            $scope.show_card_definir_un_trajet = true;
            // On reset le temps
            $scope.setTime();
            // On affiche la bonne adresse (par exemple si l'utilisateur a réappuyé sur le bouton de géolocalisation entre temps)
            if ($scope.city_start) {
                document.getElementById('city_start').value = $scope.city_start;
            }
        }
    };
    
    //~ Initialisations des variables servant à définir la date actuelle   
    var d, heure_choisie, minute_choisie, dateHasBeenPicked;
    
    // Fonction qui va servir à reset l'heure à l'heure actuelle
    $scope.setTime = function () {
        d = new Date();
        heure_choisie = d.getHours();
        minute_choisie = d.getMinutes();
        $scope.heure_choisie = heure_choisie.toString();/* + "h"*/
        $scope.minute_choisie = minute_choisie.toString();/* + "min"*/

        // On ajoute un 0 pour que ça affiche 01:02 et non 1:2
        if (minute_choisie < 10) {
            $scope.minute_choisie = "0" + $scope.minute_choisie;
        }
        if (heure_choisie < 10) {
            $scope.heure_choisie = "0" + $scope.heure_choisie;
        }
        
        // On veut que l'heure utilisée soit celle reset
        dateHasBeenPicked = false;
    };
    
    // On affiche l'heure actuelle au lancement de l'application
    $scope.setTime();
    
    $scope.showTrajet = function () {
        if ($scope.show_card_trajet === true) {
            $scope.show_card_trajet = false;
        } else {
            $scope.show_card_trajet = true;
        }
    };
    

    
    //~ Fonction permettant de calculer un trajet à une heure donnée
    $scope.calculate = function (city_start, city_end, minute_choisie, heure_choisie) {
        if (city_start && city_end) {
            document.addEventListener("deviceready", function () {
                function waitForAnalytics() {
                    if (typeof analytics !== 'undefined') {
                        $cordovaGoogleAnalytics.trackEvent('city_end', 'click', 'Adresse Saisie');
                    } else {
                        setTimeout(function () {
                            waitForAnalytics();
                        }, 250);
                    }
                }
                waitForAnalytics();
            }, false);
            $scope.loading = $ionicLoading.show({
                template: 'Calcul du trajet en cours...',
                showBackdrop: false
            });
            $http.get("http://maps.googleapis.com/maps/api/geocode/json?address=" + city_start + "&language=fr&&sensor=false").success(function (response) {
                $scope.city_start = response.results[0].formatted_address;
            }).error(function (response) {
                alert("Impossible de récupérer la géolocalisation");
            });
            $http.get("http://maps.googleapis.com/maps/api/geocode/json?address=" + city_end + "&language=fr&&sensor=false").success(function (response) {
                $scope.city_end = response.results[0].formatted_address;
            }).error(function (response) {
                alert("Impossible de récupérer la géolocalisation");
            });
            // Distinction de cas selon que l'utilisateur a choisi une heure et une minute, ou non. Si non, on définit la minute ou l'heure choisie par l'heure ou la minute actuelle
            var jour, mois, annee, heure_choisie_bis, minute_choisie_bis, date_complete, request, directionsService, millisecondes_unix;
            jour = d.getDate().toString();
            mois = d.getMonth().toString();
            annee = d.getFullYear().toString();
            if (dateHasBeenPicked) {
                // On récupère le jour, le mois et l'année aux quels on va ajouter l'heue et la minute choisie pour le trajet, afin de convertir le tout en millisecondes depuis le 1er Janvier 1970. On enlève le "min" et le "h" pour la minute et pour l'heure choisie
                millisecondes_unix = Date.parse($scope.datePicked);
            } else {
                heure_choisie_bis = heure_choisie;
                minute_choisie_bis = minute_choisie;
                date_complete = mois + "/" + jour + "/" + annee + " " + heure_choisie_bis + ":" + minute_choisie_bis;
                millisecondes_unix = Date.parse(date_complete);
            }

            request = {
                origin        : city_start,
                destination   : city_end,
                transitOptions: {
                    departureTime: new Date(millisecondes_unix)
                },
                travelMode    : google.maps.DirectionsTravelMode.BICYCLING, // Mode de conduite
                unitSystem    : google.maps.UnitSystem.METRIC
            };
            directionsService = new google.maps.DirectionsService(); // Service de calcul d'itinéraire

            directionsService.route(request, function (response, status) { // Envoie de la requête pour calculer le parcours
                if (status === google.maps.DirectionsStatus.OK) {
                    $ionicLoading.hide();
                    directionsDisplay.setDirections(response); // Trace l'itinéraire sur la carte et les différentes étapes du parcours
                    
                    $scope.donnees_du_trajet = response; //permet de récupérer la durée et la distance
                    // On affiche le footer avec la distance et la durée
                    $scope.show_donnees_du_trajet = true;
                    $scope.showCard(); //on cache la carte de défintion d'itinéraire
                }
            });
        }
    };


    //~ Fonction permettant de proposer l'autocomplétion. PB CEPENDANT : SI L'UTILISATEUR N'UTILISE PAS L'AUTOCOMPLÉTION, MARCHE PAS !!
    $scope.initializeAutocomplete = function (id1, id2) {
        var addresse_a_completer1, addresse_a_completer2, autocomplete1, autocomplete2, place1, place2, address_autocomplete1, address_autocomplete2, optionsAutocomplete;
        addresse_a_completer1 = document.getElementById(id1);
        addresse_a_completer2 = document.getElementById(id2);
        if (addresse_a_completer1 && addresse_a_completer2) {
            // On restreint l'autocomplétion à la France
            optionsAutocomplete = {
                componentRestrictions: {country: 'fr'}
            };
            autocomplete1 = new google.maps.places.Autocomplete(addresse_a_completer1, optionsAutocomplete);
            autocomplete2 = new google.maps.places.Autocomplete(addresse_a_completer2, optionsAutocomplete);
            google.maps.event.addListener(autocomplete1, 'place_changed', function () {
                place1 = this.getPlace();
                if (place1.address_components) {
                    $scope.address_autocomplete1 = place1.address_components[0].short_name + ' ' + place1.address_components[1].short_name + ' ' + place1.address_components[2].short_name;
                }
            });
            google.maps.event.addListener(autocomplete2, 'place_changed', function () {
                place2 = this.getPlace();
                if (place2.address_components) {
                    $scope.address_autocomplete2 = place2.address_components[0].short_name + ' ' + place2.address_components[1].short_name + ' ' + place2.address_components[2].short_name;
                }
            });
        }
    };


    $scope.initializeAutocomplete("city_start", "city_end"); // On lance l'autocomplétion dès le lancement de l'application

    $scope.openDatePicker = function () {
        var options = {
            date: new Date(),
            mode: 'time',
            minDate: new Date(),
            allowOldDates: false,
            allowFutureDates: true,
            doneButtonLabel: 'Annuler',
            doneButtonColor: '#F2F3F4',
            cancelButtonLabel: 'Régler',
            cancelButtonColor: '#000000'
        };

        document.addEventListener("deviceready", function () {
            $cordovaDatePicker.show(options).then(function (date) {
                $scope.datePicked = date;
                // La fonction calculate prend la date donnée par le datePicker
                dateHasBeenPicked = true;
                // On affiche l'heure choisie sur le bouton
                $scope.heure_choisie = $scope.datePicked.getHours();
                $scope.minute_choisie = $scope.datePicked.getMinutes();
                
                // On ajoute un 0 pour que ça affiche 01:02 et non 1:2
                if (minute_choisie < 10) {
                    $scope.minute_choisie = "0" + $scope.minute_choisie;
                }
                if (heure_choisie < 10) {
                    $scope.heure_choisie = "0" + $scope.heure_choisie;
                }
            });
        }, false);
    };
    



    //Google Analytics
    document.addEventListener("deviceready", function () {
        function waitForAnalytics() {
            if (typeof analytics !== 'undefined') {
                $cordovaGoogleAnalytics.trackView('Définition du trajet');
            } else {
                setTimeout(function () {
                    waitForAnalytics();
                }, 250);
            }
        }
        waitForAnalytics();
    }, false);

}

DirectionCtrl.$inject = ['$scope', '$http', '$ionicLoading', '$compile', '$cordovaGoogleAnalytics', '$ionicModal', '$cordovaDatePicker', '$timeout'];

carte.controller('DirectionCtrl', DirectionCtrl);