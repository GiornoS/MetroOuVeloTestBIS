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


    });
    
});


var carte = angular.module('carte', ['ionic', 'ngCordova', 'google.places']);


function DirectionCtrl($scope, $http, $ionicLoading, $compile, $cordovaGoogleAnalytics, $ionicModal, $cordovaDatePicker, $timeout) {

    
   
    
    
    
    /*** DECLARATION DES VARIABLES UTILISEES PAR LE PROGRAMME ***/
    
    /** 
    *** @Date d : Date, permet de récupérer la date actuelle (si l'utilisateur ne choisit pas d'heure, l'heure actuelle est utilisée)
    *** @String FORECASTIO_KEY : API key pour récupérer les prévisions météorologiques à une date et un endroit donnés
    *** @ heureARegarder : 
    *** @int millisecondes_unix : heure choisi sous la forme d'un temps UNIX (nombre de secondes écoulées depuis un certain jour en 1970). Utile pour déterminer le trajet à un       ***                           instant donné
    *** @String monthFormatted : mois actuel mis sous le format MM
    *** @String DayFormatted : jour actuel mis sous le format JJ
    *** @String HourFormatted : heure actuelle mise sous le format HH
    *** @DirectionRenderer : Objet google permettant d'afficher le trajet calculé sur la map
    *** @boolean mapToReload : permet de rafraichir la map une fois que le modal est caché
    *** @Marker marker : Objet google pour n'avoir qu'un seul marker sur la map
    *** @Array<Marker> markersPlacesDispo : Regroupe tous les markers associés aux stations de Vélib avec le nombre de places dispo
    *** @Array<Marker> markersVelibDispo : Regroupe tous les markers associés aux stations de Vélib avec le nombre de vélibs dispo
    *** @LatLng LatLng : 
    *** @int i : variable incrémentielle utilisée dans chaque boucle for() {}
    *** @String VelibKey : API key pour se connecter aux services Vélibs et récupérer les données sur chaque station
    *** @String velibMarker : adresse de l'URL des markers de vélibs utilisés si l'accès à l'API Vélib n'est pas possible
    *** @MarkerClusterer MarkerClustererVlb : Permet de regrouper tous les Markers de Vélibs et former des clusters plus rapides à afficher et plus élégants à voir
    *** @MarkerClusterer MarkerClustererPlc : Permet de regrouper tous les Markers de Places et former des clusters plus rapides à afficher et plus élégants à voir
    *** @JSONObject MCOtionsPlc : Options pour le MarkerClustererPlc
    *** @JSONObject MCOtionsVlb : Options pour le MarkerClustererVlb
    *** @JSONObject ClusterStylesPlc : Styles des Clusters de Places affichés
    *** @JSONObject ClusterStylesVlb : Styles des Clusters de Vélibs affichés
    *** @String heure_choisie : heure choisie par l'utilisateur. S'il n'en a pas choisie, est égale à l'heure actuelle
    *** @String minute_choisie : minute choisie par l'utilisateur. S'il n'en a pas choisie, est égale à la minute actuelle
    *** @Boolean dateHasBeenPicked : permet de savoir si l'utilisateur a choisi une date ou non. Si non, la date utilisée sera l'actuelle
    *** @int areMarkersDisplayed : permet de savoir quels marqueurs afficher lorsque l'utilisateur appuie sur le bouton pour afficher les markers (affiche successivement les                                        Vélibs dispo, les places dispo, et rien)
    *** @String $scope.sizeMap : permet de changer la taille de la arte affichée pour s'adapter en fonction de l'affichage ou non du modal
    *** 
    **/
    
    // On charge les markers des stations de vélib au démarrage. On créé 2 listes de markers : une avec le nb de places restantes pour poser son vélo, et une avec le nb de vélibs libres/
    // Les MarkerClusterer permettent de regrouper les markers proches ensemble afin d'éviter une surdensité de markers
    var d, FORECASTIO_KEY, heureARegarder, millisecondes_unix, monthFormatted, DayFormatted, HourFormatted, directionsDisplay, mapToReload, marker, markersPlacesDispo, markersVelibDispo, LatLng, i, VelibKey, velibMarker, MarkerClustererPlc, MarkerClustererVlb, MCOptionsVlb, MCOptionsPlc, ClusterStylesPlc, ClusterStylesVlb, heure_choisie, minute_choisie, dateHasBeenPicked, areMarkersDisplayed;
    
    FORECASTIO_KEY = '1706cc9340ee8e2c6c2fecd7b9dc5a1c'; // API key pour récuperer les données météorologiques d'un endroit à un instant donné
    directionsDisplay = new google.maps.DirectionsRenderer(); // Google Object pour afficher le trajet sur la carte
    velibMarker = "res/img/velib.png"; // Adresse de l'icône utilisée pour afficher des stations vélibs dans le cas où il serait impossible de se connecter à l'API vélibs
    markersPlacesDispo = []; // Markers de places dispo
    markersVelibDispo = []; // Markers de Vélibs dispo
    VelibKey = 'a23a36fd28a2875bf3183ae15335cc8120992f52'; // API key pour accéder aux données sur les stations vélibs
    areMarkersDisplayed = 0; // Permeyt de savoir quels markers l'utilisateur veut voir
    $scope.sizeMap = 'big'; // Au départ la carte prend tout l'écran
    
    /*** FONCTION APPELEE EN CAS D'ERREUR (non fonctionnement de l'API Météo, non connexion à Internet,...) LORS DE L'APPEL DE LA FONCTION $scope.searchWeather ***/
    
    /** 
    *** @return alert("Erreur")
    **/
    
    function httpError(response) {
        $ionicLoading.hide();
        alert('Impossible de récupérer les informations. Veuillez vérifier votre connexion internet.');
    }
    
    /*** FONCTION RECUPERANT LES PREVISIONS METEOS A DES COORDONNEES PRECISES A UN INSTANT DONNE ***/
    
    /** 
    *** @param  address : sous la forme d'un objet LatLng de Google
    ***
    *** @return  $scope.weather : les prédictions à la destination voulue au moment voulu
    *** @return  $scope.recommandation : "Prenez le vélo !" ou "Prenez le métro !"
    **/
    
    
    $scope.searchWeather = function (LatLngCityEnd) {
        
        // On affiche un gif de loading
        $scope.loading = $ionicLoading.show({
            template: 'Récupération des données météorologiques...',
            showBackdrop: false
        });

        // On met la date au bon format : AAAA-MM-JJThh-mm-ss. Pour cela on rajoute éventuellement des 0
        if (d.getMonth() < 10) {
            monthFormatted = "0" + d.getMonth();
        } else {
            monthFormatted = d.getMonth();
        }
        if (d.getDate() < 10) {
            DayFormatted = "0" + d.getDate();
        } else {
            DayFormatted = d.getDate();
        }
        var dateForecast, url;
        dateForecast = d.getFullYear() + "-" + monthFormatted + "-" + DayFormatted  + "T" + $scope.heure_choisie + ":00:00";
        // On récupère la station vélib la plus proche !
      //  $scope.stationVelibPlusProche(LatLngCityEnd);
        url = "https://api.forecast.io/forecast/" + FORECASTIO_KEY + "/" + LatLngCityEnd.lat() + "," + LatLngCityEnd.lng() + "," + dateForecast + "?units=si";
        $http.get(url).success(function (response) {
            
            //~ On récupère la réponse des serveurs de forecast.io et on cache l'îcone de loading. Affiche aussi la carte de recommandation
            // On garde la réponse dans une variable éventuellement utile pour la page index
            $scope.weather = response;
            $scope.show_card_recommandation = true;
            if (response.hourly.data[0].icon === "rain") {
                $scope.recommandation = "Prenez donc le MÉTRO !";
            } else {
                $scope.recommandation = "Prenez donc le VÉLO !";
            }
            // On le remet une deuxième fois pour corriger un bug sur Android 4.4 et sup
            //$scope.stationVelibPlusProche(LatLngCityEnd);
            $ionicLoading.hide();
        }).error(httpError);
    };


    /*  PARTIE UTILE POUR LA CARTE  */
    
    
    
    /*** ENSEMBLE DES FONCTIONS UTILISEES POUR L'AFFICHAGE ET LE DESAFFICHAGE DU MODAL PRESENTANT LES ETAPES DU TRAJET DEFINI PAR L'UTILISATEUR ***/
    
    /**
    *** @function $scope.openModal() : affiche le modal. Change la taille de la Map pour l'adapter à la place restante sur l'écran. Augmente le zoom. Affiche le Panel de                                                directions étape par étape
    *** @function $scope.closeModal() : ferme le modal. Une fois le modal détruit, change la taille de la map pour qu'elle reprenne tout l'écran, et réaffiche la carte de                                               recommandation
    *** @function $scope.reloadMap() : reload la carte une fois le modal fermé
    **/
    
    $ionicModal.fromTemplateUrl('my-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
    });

    /** $scope.openModal()
    *** 
    *** @return boolean $scope.show_card_recommandation : permet de cacher la carte de recommandation une fois le modal affiché
    *** @return String $scope.sizeMap : permet d'adapter la taille de la map affichée à la place restante sur l'écran
    **/
    
    $scope.openModal = function () {
        $scope.modal.show();
        // On cache la recommandation pour éviter de géner
        $scope.show_card_recommandation = false;
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

    /** $scope.closeModal()
    **/
    
    $scope.closeModal = function () {
        $scope.modal.hide();
    };
    
    // Quand le modal est fermé on réaffiche la carte en version grand écran
    $scope.$on('modal.hidden', function () {
        // On réaffiche la map version grand écran
        $scope.sizeMap = 'big';
        // On réaffiche la recommandation
        $scope.show_card_recommandation = true;
        

    });

    $scope.$on('$destroy', function () {
        // On réaffiche la map version grand écran
        google.maps.event.trigger($scope.map, 'resize');
        $scope.modal.remove();
    });
    
    /** $scope.reloadMap()
    **/
    
    $scope.reloadMap = function () {
        if (mapToReload) {
            google.maps.event.trigger($scope.map, 'resize');
            mapToReload = false;
        }
    };

    /*** FONCTION D'INITIALISATION DE LA CARTE ***/
    /**
    *** @return Map $scope.map : Google object représentant une carte
    **/
    
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
    


    


    /*** FONCTION PERMETTANT L'APPEL A L'API POUR RECUPERER LES DONNEES SUR TOUTES LES STATIONS VELIB ***/
    
    /** 
    *** @return Array<Marker> markersPlacesDispo : tous les markers avec le nombre de places dispo pour chaque station
    *** @return Array<Marker> markersVelibsDispo : tous les markers avec le nombre de vélibs dispo pour chaque station
    **/
    
    $scope.loadMarkers = function () {
        // On affiche une loading icon
        $scope.loading = $ionicLoading.show({
            template: 'Mise à jour des stations vélibs...',
            showBackdrop: false
        });
        $http.get('https://api.jcdecaux.com/vls/v1/stations?contract=Paris&apiKey=' + VelibKey).success(function (response) {

            // Styles des Clusters
            ClusterStylesPlc = [
                {
                    textSize: 1,
                    textColor: 'white',
                    url: 'res/markers_clusters/VelibGrey.png',
                    height: 50,
                    width: 50,
                    anchorText: [3, 1]
                }
            ];
            ClusterStylesVlb = [
                {
                    textSize: 1,
                    textColor: 'white',
                    url: 'res/markers_clusters/VelibPurple.png',
                    height: 50,
                    width: 50,
                    anchorText: [3, 1]
                }
            ];
            // Options pour les Marker Clusterer : 
            // minimumClusterSize : Il faut 4 stations minimum pour faire un cluster
            // gridSize : Augmente la taille du carré sur lequel le cluster va chercher les stations à rassembler
            MCOptionsPlc = {minimumClusterSize: 4, gridSize: 90, styles: ClusterStylesPlc};
            MCOptionsVlb = {minimumClusterSize: 4, gridSize: 90, styles: ClusterStylesVlb};
            // On créé les Markers Clusterer utiles par la suite
            MarkerClustererPlc = new MarkerClusterer($scope.map, markersPlacesDispo, MCOptionsPlc);
            MarkerClustererVlb = new MarkerClusterer($scope.map, markersVelibDispo, MCOptionsVlb);

            // Pour chacune des stations on créé un marker avec le nb de places ou de vélibs disponibles
            for (i = 0; i < response.length; i += 1) {
                LatLng = new google.maps.LatLng(response[i].position.lat, response[i].position.lng);
                var markerPlcDisp, markerVlbDisp;
                // Si le nombre de places/vélibs dispo est inférieur à 4, on affiche une icône rouge, sinon une icône violette (vélib) ou grise (place)
                if (response[i].available_bike_stands < 4) {
                    markerPlcDisp = new google.maps.Marker({
                        position: LatLng,
                        icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + response[i].available_bike_stands + "|ff0000|ffffff",
                        clickable: true
                    });
                } else {
                    markerPlcDisp = new google.maps.Marker({
                        position: LatLng,
                        icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + response[i].available_bike_stands + "|a99faa|ffffff",
                        clickable: true
                    });
                }
                if (response[i].available_bikes < 4) {
                    markerVlbDisp = new google.maps.Marker({
                        position: LatLng,
                        icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + response[i].available_bikes + "|ff0000|ffffff",
                        clickable: true
                    });
                } else {
                    markerVlbDisp = new google.maps.Marker({
                        position: LatLng,
                        icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + response[i].available_bikes + "|be65c6|ffffff",
                        clickable: true
                    });
                }

                // Quand on clique sur un marker, la map glisse et se centre sur lui
                google.maps.event.addListener(markerPlcDisp, "click", function (evenement) {
                    $scope.map.panTo(evenement.latLng);
                });
                google.maps.event.addListener(markerVlbDisp, "click", function (evenement) {
                    $scope.map.panTo(evenement.latLng);
                });
                markersPlacesDispo.push(markerPlcDisp);
                markersVelibDispo.push(markerVlbDisp);
            }
            $ionicLoading.hide();

        }).error(function (reponse) {
            // Si on ne parvient pas à récupérer pas les infos, on affiche les données statiques stockées en local
            $http.get("res/data/Paris.json").success(function (response) {
                for (i = 0; i < response.length; i += 1) {
                    LatLng = new google.maps.LatLng(response[i].latitude, response[i].longitude);
                    var marker = new google.maps.Marker({
                        position: LatLng,
                        icon: velibMarker,
                        clickable: true
                    });
                    google.maps.event.addListener(marker, "click", function (evenement) {
                        $scope.map.panTo(evenement.latLng);
                    });
                    // Dans ce cas les 2 types de markers sont les mêmes
                    markersPlacesDispo.push(marker);
                    markersVelibDispo.push(marker);
                }
                $ionicLoading.hide();
            });
        });
    };
    $scope.loadMarkers();


    
   

    // On initialise
    ionic.Platform.ready(initialize);

    /*** FONCTION PERMETTANT DE CENTRER LA MAP SUR L'UTILISATEUR ET DE RECUPERER L'ADRESSE DE SA LOCALISATION ***/
    
    /**
    *** @return String $scope.address_autocomplete1 : adresse utilisée comme point de départ pour calculer le trajet
    *** @return String $scope.city_start : adresse qui va s'afficher dans la card "Définir un trajet" pour montrer à l'utilisateur qu'on a bien sa géolocalisation commme adresse                                            de départ
    **/
    
    $scope.centerOnMe = function () {
        // On désaffiche la carte montrant les données d'un précédent trajet
        $scope.show_donnees_du_trajet = false;
        // On désaffiche la recommandation
        $scope.show_card_recommandation = false;
        // Si la carte n'est pas définie, aucun sens
        if (!$scope.map) {
            return;
        }
        // On affiche une loading icon
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
                $scope.city_start = response.results[0].formatted_address;
                
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


    /*** FONCTION PERMETTANT D'AFFICHER OU DE DESAFFICHER LA CARD "DEFINIR UN TRAJET" ***/
    
    /**
    *** @return boolean $scope.show_card_definir_un_trajet : permet de savoir s'il faut afficher ou désafficher la card "Définir un trajet"
    *** @return boolean $scope.show_card_recommandation : cache la arte de recommandation si l'utilisateur veut calculer un autre trajet
    **/
    
    $scope.showCard = function () {
        if ($scope.show_card_definir_un_trajet === true) {
            $scope.show_card_definir_un_trajet = false;
        } else {
            $scope.show_card_definir_un_trajet = true;
            $scope.show_card_recommandation = false;
            // On reset le temps
            $scope.setTime();
            // On affiche la bonne adresse (par exemple si l'utilisateur a réappuyé sur le bouton de géolocalisation entre temps)
            if ($scope.city_start) {
                document.getElementById('city_start').value = $scope.city_start;
            }
        }
    };
    
    
 
    
    //~ Initialisations des variables servant à définir la date actuelle   
    
    /*** FONCTION PERMETTANT DE RESET L'HEURE AFFICHEE SUR LA CARD "DEFINIR UN TRAJET" A L'HEURE ACTUELLE ***/
    
    /**
    *** @return String $scope.minute_choisie : retourne la minute choisie (ou actuelle) au format mm
    *** @return String $scope.heure_choisie : retourne l'heure choisie (ou actuelle) au format hh
    **/
    
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
    
    /*** FONCTION PERMETTANT D'AFFICHER OU DE DESAFFICHER LA CARD PRESENTANT LES DONNEES DU TRAJET ***/
    
    /**
    *** @return boolean $scope.show_card_trajet : permet de dire à la page html d'afficher ou non la card avec les données du trajet
    **/
    
    $scope.showTrajet = function () {
        if ($scope.show_card_trajet === true) {
            $scope.show_card_trajet = false;
        } else {
            $scope.show_card_trajet = true;
        }
    };
    
    
    /*** FONCTION PERMETTANT DE CALCULER UN TRAJET A UN INSTANT DONNE ***/
    
    /**
    *** @param String city_start : ville de départ retrounée par l'Autocomplete
    *** @param String city_end : ville d'arrivée retrounée par l'Autocomplete
    *** @param String minute_choisie : minute choisie par l'utilisateur ou minute actuelle
    *** @param String heure_choisie : huere choisie par l'utlisateur ou heure actuelle
    ***
    *** @return JSONObject $scope.donnees_du_trajet : données du trajet permettat d'afficher la distance à parcourir et le temps prévu pour ce trajet
    *** @return boolean $scope.show_donnees_du_trajet : affiche la carte avec les données du trajet
    **/
    $scope.calculate = function (city_start, city_end, minute_choisie, heure_choisie) {
        $scope.donneesVelibPlusProchechargees = false;
        var address_autocomplete1, address_autocomplete2;
        if ($scope.address_autocomplete1 !== $scope.city_start) {
            $scope.address_autocomplete1 = null;
        }
        if ($scope.address_autocomplete1) {
            address_autocomplete1 = $scope.address_autocomplete1;
        } else {
            address_autocomplete1 = city_start.address_components[0].short_name + ' ' + city_start.address_components[1].short_name + ' ' + city_start.address_components[2].short_name;
            $scope.city_start = city_start.formatted_address;
        }
        if (address_autocomplete1 && city_end) {
            
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
            address_autocomplete2 = city_end.address_components[0].short_name + ' ' + city_end.address_components[1].short_name + ' ' + city_end.address_components[2].short_name;
            $http.get("http://maps.googleapis.com/maps/api/geocode/json?address=" + address_autocomplete1 + "&language=fr&&sensor=false").success(function (response) {
                $scope.city_startLatLng = response.results[0].formatted_address;
            }).error(function (response) {
                alert("Impossible de récupérer la géolocalisation");
            });
            $http.get("http://maps.googleapis.com/maps/api/geocode/json?address=" + address_autocomplete2 + "&language=fr&&sensor=false").success(function (response) {
                $scope.city_end = response.results[0].formatted_address;
            }).error(function (response) {
                alert("Impossible de récupérer la géolocalisation");
            });
            // Distinction de cas selon que l'utilisateur a choisi une heure et une minute, ou non. Si non, on définit la minute ou l'heure choisie par l'heure ou la minute actuelle
            var jour, mois, annee, heure_choisie_bis, minute_choisie_bis, date_complete, request, directionsService;
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
                origin        : address_autocomplete1,
                destination   : address_autocomplete2,
                transitOptions: {
                    departureTime: new Date(millisecondes_unix)
                },
                travelMode    : google.maps.DirectionsTravelMode.BICYCLING, // Mode de conduite
                unitSystem    : google.maps.UnitSystem.METRIC
            };
            directionsService = new google.maps.DirectionsService(); // Service de calcul d'itinéraire

            directionsService.route(request, function (response, status) { // Envoie de la requête pour calculer le parcours
                if (status === google.maps.DirectionsStatus.OK) {
                    
                    directionsDisplay.setDirections(response); // Trace l'itinéraire sur la carte et les différentes étapes du parcours
                    
                    $scope.donnees_du_trajet = response; //permet de récupérer la durée et la distance
                    // On affiche le footer avec la distance et la durée
                    $scope.show_donnees_du_trajet = true;
                    $scope.showCard(); //on cache la carte de défintion d'itinéraire
                    // On cherche la station de vélib la plus proche
                    $scope.stationVelibPlusProche(response.routes[0].legs[0].end_location);

          
               

                    // On cherche la météo pour afficher la recommandation
                    $timeout(function () {
                        $ionicLoading.hide();
                        $scope.searchWeather(response.routes[0].legs[0].end_location);
                    }, 1000);
                    

                }
            });
        }
    };


    /*** DONCTION PERMETTANT D'UTILISER L'AUTOCOMPLETION POUR PROPOSER DES CHOIX A l4UTILISATUER ENTRANT UNE ADRESSE ***/
    
    /**
    *** @param id1 : id de la balise HTML d'où il faut récupérer la city_start et proposer l'autocomplétion
    *** @param id2 : id de la balise HTML d'où il faut récupérer la city_end et proposer l'autocomplétion
    ***
    *** @return String $scope.address_autocomplete1 : Adresse de départ complétée choisie par l'utilisateur
    *** @return String $scope.address_autocomplete2 : Adresse d'arrivée complétée choisie par l'utilisateur
    **/
/*    $scope.initializeAutocomplete = function (id1, id2) {
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

    // Dès le lancement de l'application, on initialise l'autocomplétion
    $scope.initializeAutocomplete("city_start", "city_end");*/

    /*** FONCTION PERMETTANT A L'UTILISATEUR DE CHOISIR UNE HEURE DE DEPART ***/
    
    /**
    *** @return JSONObject scope.datePicked : date choisie par l'utilisateur
    *** @return String $scope.minute_choisie : minute choisie par l'utilisateur
    *** @return String $scope.heure_choisie : heure choisie par l'utilisateur
    **/
    
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
    

    
    /*** FONCTION PERMETTANT D'AFFICHER LES MARKERS DEMANDES PAR L'UTILISATEUR ***/
    
    $scope.displayVelibStations = function () {
        if (areMarkersDisplayed === 0) {
            MarkerClustererVlb.addMarkers(markersVelibDispo);
            areMarkersDisplayed = 1;
        } else if (areMarkersDisplayed === 1) {
            MarkerClustererVlb.clearMarkers();
            MarkerClustererPlc.addMarkers(markersPlacesDispo);
            areMarkersDisplayed = 2;
        } else {
            MarkerClustererPlc.clearMarkers();
            areMarkersDisplayed = 0;
        }
         
  
    };
    

    /*** FONCTION PERMETTANT DE DETERMINER LA STATION VELIB LA PLUS PROCHE DE LA DESTINATION ET CALCUL DE LA DISTANCE LES SEPARANT ***/
    
    /**
    *** @param LatLng address : Googe Object pcorrespondant à la position de l'adresse d'arrivée
    ***
    *** @return JSONObject $scope.donneesVelibPlusProche : contient toutes les infos utiles pour connaître le trajet à pied entre la station vélib la plus proche de la                                                                      destination et la destination elle-même
    **/
    
    $scope.stationVelibPlusProche = function (address) {
        // Calcul d'un minimum, on calcule la distance géodésique, donc approximative entre chaque station et la destination, on garde le minimum de ces distances, qui, on le suppose, va aussi être le minimum de la distance à pied
        var distanceMini, stationPlusProche, distanceTemp, stationLatLng, request, directionsService, stationLatLngPlusProche;
        // On initialise la station la plus proche comme étant la première de la liste
        stationPlusProche = markersVelibDispo[0];
        stationLatLng = new google.maps.LatLng(markersVelibDispo[0].position.lat(), markersVelibDispo[0].position.lng());
        distanceMini = google.maps.geometry.spherical.computeDistanceBetween(address, stationLatLng);
        // Boucle for de calcul de minimum
        for (i = 1; i < markersVelibDispo.length; i += 1) {
            stationLatLng = new google.maps.LatLng(markersVelibDispo[i].position.lat(), markersVelibDispo[i].position.lng());
            distanceTemp = google.maps.geometry.spherical.computeDistanceBetween(address, stationLatLng);
            // Si la distance calculée est plus petite, on la garde comme minimum
            if (distanceTemp < distanceMini) {
                distanceMini = distanceTemp;
                stationPlusProche = markersVelibDispo[i];
            }
        }
        // Une fois qu'on a trouvé la distance minimum, on envoie une requête à l'API Google Direction afin de déterminer la véritable distance à pied entre la station de vélib la plus proche et la destination voulue
        stationLatLngPlusProche = new google.maps.LatLng(stationPlusProche.position.lat(), stationPlusProche.position.lng());
        request = {
            origin        : stationLatLngPlusProche,
            destination   : address,
            travelMode    : google.maps.DirectionsTravelMode.WALKING, // Mode de conduite
            unitSystem    : google.maps.UnitSystem.METRIC
        };
        directionsService = new google.maps.DirectionsService(); // Service de calcul d'itinéraire

        directionsService.route(request, function (response, status) {
            // On sauvegarde les données du trajet à pied pour les afficher dans a page (on affiche la distance et la durée)
            $scope.donneesVelibPlusProche = response.routes[0].legs[0];
            $scope.donneesVelibPlusProchechargees = true;
        });
        
    };


    /***  GOOGLE ANALYTICS  ***/
    document.addEventListener("deviceready", function () {
        function waitForAnalytics() {
            if (typeof analytics !== 'undefined') {
                $cordovaGoogleAnalytics.startTrackerWithId('UA-59584237-1');
                $cordovaGoogleAnalytics.trackView('Définir un trajet');
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