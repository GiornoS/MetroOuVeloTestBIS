var carte = angular.module('carte', ['ionic', 'ngCordova', 'google.places']);




function DirectionCtrl($scope, $http, $ionicLoading, $compile, $cordovaGoogleAnalytics, $ionicModal, $cordovaDatePicker, $timeout, $cordovaNetwork, $cordovaVibration, $cordovaEmailComposer) {

    'use strict';
   
    
    
    
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
    var d, FORECASTIO_KEY, heureARegarder, millisecondes_unix, monthFormatted, DayFormatted, HourFormatted, directionsDisplayMiddle, directionsDisplayStart, directionsDisplayEnd, mapToReload, marker, markersPlacesDispo, markersVelibDispo, LatLng, i, VelibKey, velibMarker, MarkerClustererPlc, MarkerClustererVlb, MCOptionsVlb, MCOptionsPlc, ClusterStylesPlc, ClusterStylesVlb, heure_choisie, minute_choisie, dateHasBeenPicked, areMarkersDisplayed, headerConfig, directionsService, placesService, distanceStationMetroDestination, distanceStationVelibDestination, mytimeout, counter, email;
    
    FORECASTIO_KEY = '1706cc9340ee8e2c6c2fecd7b9dc5a1c'; // API key pour récuperer les données météorologiques d'un endroit à un instant donné
    directionsDisplayMiddle = new google.maps.DirectionsRenderer(); // Google Object pour afficher le trajet sur la carte
    directionsDisplayMiddle.setOptions({
        polylineOptions : {strokeColor : "#be65c6", strokeOpacity : 0.8, strokeWeight : 4},
        suppressMarkers : true
    });
    directionsDisplayStart = new google.maps.DirectionsRenderer(); // Google Object pour afficher le trajet sur la carte
    directionsDisplayStart.setOptions({
        polylineOptions : {strokeColor : "#2b5fb5", strokeOpacity : 0.8, strokeWeight : 4},
        suppressMarkers : true
    });
    directionsDisplayEnd = new google.maps.DirectionsRenderer(); // Google Object pour afficher le trajet sur la carte
    directionsDisplayEnd.setOptions({
        polylineOptions : {strokeColor : "#2b5fb5", strokeOpacity : 0.8, strokeWeight : 4},
        suppressMarkers : true
    });
    velibMarker = "res/img/velib.png"; // Adresse de l'icône utilisée pour afficher des stations vélibs dans le cas où il serait impossible de se connecter à l'API vélibs
    markersPlacesDispo = []; // Markers de places dispo
    markersVelibDispo = []; // Markers de Vélibs dispo
    VelibKey = 'a23a36fd28a2875bf3183ae15335cc8120992f52'; // API key pour accéder aux données sur les stations vélibs
    areMarkersDisplayed = 0; // Permeyt de savoir quels markers l'utilisateur veut voir
    $scope.sizeMap = 'big'; // Au départ la carte prend tout l'écran
    $scope.Titre_Recommandation = "Métro ou Vélib ?"; // Au départ le titre est Métro ou Veélib ?
    $scope.city_start = "";
    headerConfig = {headers: {'Authorization': 'fef7a3cd-4d7f-4441-92c7-315a94fd48f0'}};
    $scope.showButtonsOnMap = true;
    $scope.disablingValiderButton = 0;
    directionsService = new google.maps.DirectionsService(); // Service de calcul d'itinéraire
    $scope.veloChoisi = true;
    $scope.choixDeTransport = google.maps.DirectionsTravelMode.BICYCLING;
    $scope.markersToErase = [];
    mytimeout = null; // the current timeoutID
    counter = 10;
    $scope.counter = "0:10";
    $scope.showStopwatch = true;
    $scope.showCounter = false;
    email = {
        to: 'metroouvelib@gmail.com',
    /*    attachments: [
          'file://img/logo.png',
          'res://icon.png',
          'base64:icon.png//iVBORw0KGgoAAAANSUhEUg...',
          'file://README.pdf'
        ],*/
        subject: 'Application Métro ou Vélib ?'
    };
    
    
    
    
    $scope.composeEMail = function () {
        document.addEventListener("deviceready", function () {
            $cordovaEmailComposer.isAvailable().then(function () {
                $cordovaEmailComposer.open(email).then(null, function () {
                // L'utilisateur annule l'email
                });
            }, function () {
                $ionicLoading.show({
                    template: "Aucun client EMail n'a été détecté. Veuillez vérifier vos paramètres et votre connexion internet.",
                    duration: 3000
                });
            });
        }, false);
    };
    
    // actual timer method, counts down every second, stops on zero
    $scope.onTimeout = function () {
        if (counter ===  0) {
            $scope.$broadcast('timer-stopped', 0);
            $timeout.cancel(mytimeout);
            return;
        }
        counter -= 1;
        if (counter % 60 < 10) {
            $scope.counter = (counter - counter % 60) / 60 + ":0" + counter % 60;
        } else {
            $scope.counter = (counter - counter % 60) / 60 + ":" + counter % 60;
        }
        
        mytimeout = $timeout($scope.onTimeout, 1000);
    };
 
    $scope.startTimer = function () {
        mytimeout = $timeout($scope.onTimeout, 1000);
    };
 
    // stops and resets the current timer
    $scope.stopTimer = function () {
        $scope.$broadcast('timer-stopped', counter);
        counter = 10;
        $scope.counter = "0:10";
        $timeout.cancel(mytimeout);
    };
 
    // triggered, when the timer stops, you can do something here, maybe show a visual indicator or vibrate the device
    $scope.$on('timer-stopped', function (event, remaining) {
        if (remaining === 0) {
            document.addEventListener("deviceready", function () {
                // Vibre 1000ms
                $cordovaVibration.vibrate(1000);
                remaining = 1; // ?????
            }, false);
/*            navigator.geolocation.getCurrentPosition(function (pos) {
                alert('pos');
                $scope.calculate(pos, $scope.donneesSauvegardees[1], $scope.donneesSauvegardees[2], $scope.donneesSauvegardees[3], true, true);
            }, function (error) {
                $ionicLoading.show({
                    template: "Impossible de récupérer la géolocalisation. Veuillez vérifier vos paramètres et votre connexion.",
                    duration: 2000
                });
            }, {
                timeout: 15000
            });*/
            $scope.centerOnMe();
            $scope.calculate($scope.detailsCityStart, $scope.donneesSauvegardees[1], $scope.donneesSauvegardees[2], $scope.donneesSauvegardees[3], true, true);
            
        }
    });
    
    /*** FONCTION PERMETTANT DE DECLENCHER LE TIMER ***/
    
    /**
    ***
    **/
    
    $scope.timerTrigger = function () {
        $scope.showStopwatch = false;
        $scope.showCounter = true;
        $scope.startTimer();
    };
    
    $scope.timerStopper = function () {
        $scope.stopTimer();
        $scope.showStopwatch = true;
        $scope.showCounter = false;
        
    };
    
    
    /*** FONCTION PERMETTANT A L'UTILISATEUR DE CHOISIR LE MOYEN DE TRANSPORT POUR LE CALCUL DU TRAJET ***/
    
    /**
    ***
    **/
    
    $scope.changeMoyenTransport = function () {
        if ($scope.metroChoisi) {
            $scope.metroChoisi = false;
            $scope.veloChoisi = true;
            $scope.choixDeTransport = google.maps.DirectionsTravelMode.BICYCLING;
            // On recalcule le trajet avec le nouveau moyen de transport
            $scope.calculate($scope.donneesSauvegardees[0], $scope.donneesSauvegardees[1], $scope.donneesSauvegardees[2], $scope.donneesSauvegardees[3], true, false);
        } else {
            $scope.metroChoisi = true;
            $scope.veloChoisi = false;
            $scope.choixDeTransport = google.maps.TravelMode.TRANSIT;
            // On recalcule le trajet avec le nouveau moyen de transport
            $scope.calculate($scope.donneesSauvegardees[0], $scope.donneesSauvegardees[1], $scope.donneesSauvegardees[2], $scope.donneesSauvegardees[3], true, false);
        }
    };

    
    /*** FONCTION PERMETTANT DE DÉCOUPER LE TRAJET À VÉLO EN TRONÇON D'UNE DEMI-HEURE ***/
    
    /**
    ***
    **/
    
/*    function cutThePathAnnexe(j) {
        var currentTimeOfSteps = 0, i = j, numberOfDivision, cutAStep, placeToStop, realCurrentTimeOfSteps = 0, timeToSubstract, distanceInLastStep = 0, indiceOfStopStep = 0, multiplicator;

        // On coupe le trajet en tronçon de 25min
        while ((currentTimeOfSteps < 1500) && (i < $scope.donnees_du_trajet.routes[0].legs[0].steps.length)) {
            currentTimeOfSteps += $scope.donnees_du_trajet.routes[0].legs[0].steps[i].duration.value;
            realCurrentTimeOfSteps += $scope.donnees_du_trajet.routes[0].legs[0].steps[i].duration.value;
            indiceOfStopStep = i; // Dernière étape totalement accomplie prise en compte
            cutAStep = false;
            
            // Si la dernière étape du tronçon est trop longue, on découpe cette étape en 2 (on suppose le temps de trajet et la distance proportionnels), si c'est toujours trop grand, on redécoupe en 2, etc, afin d'aboutir à un temps de trajet entre 1460 et 1520s. On récupère le vrai temps du tronçon ainsi que la distance à parcourir dans la dernière étape avant d'aller trouver une station
            if (currentTimeOfSteps > 1520) {
                cutAStep = true;
                indiceOfStopStep = i - 1; // Dernière étape totalement accomplie, plus une partie de l'étape i va être accomplie
                numberOfDivision = 2;
                timeToSubstract = parseInt($scope.donnees_du_trajet.routes[0].legs[0].steps[i].duration.value, 10);
                distanceInLastStep = parseInt($scope.donnees_du_trajet.routes[0].legs[0].steps[i].distance.value, 10);
                while ((realCurrentTimeOfSteps < 1460) || (realCurrentTimeOfSteps > 1520)) {
                    // Si le temps est trop long on le raccourcit par dichotomie
                    if (realCurrentTimeOfSteps > 1520) {*/
                        //multiplicator = Math.random() * 0.9 + 0.1;
                        /*realCurrentTimeOfSteps = realCurrentTimeOfSteps - $scope.donnees_du_trajet.routes[0].legs[0].steps[i].duration.value + timeToSubstract;*/
                        
  /*                      timeToSubstract = parseInt(timeToSubstract / 2, 10);
                        realCurrentTimeOfSteps = realCurrentTimeOfSteps - timeToSubstract;
                        distanceInLastStep = parseInt(distanceInLastStep / 2, 10);
                        numberOfDivision *= 2;
                        // Si le temps est trop court on l'allonge par dichotomie
                    } else {
                       // multiplicator = Math.random() * 1.9 + 1.1;
                        
                        timeToSubstract = parseInt(timeToSubstract * 1.5, 10);
                        realCurrentTimeOfSteps = realCurrentTimeOfSteps + timeToSubstract;
                        distanceInLastStep = parseInt(distanceInLastStep * 1.5, 10);
                        numberOfDivision /= 1.5;
                    }
                    alert(realCurrentTimeOfSteps);
                }
            }
            i += 1;
        }
        alert("arf 0");
        if (cutAStep) {
            placeToStop = new google.maps.LatLng(($scope.donnees_du_trajet.routes[0].legs[0].steps[indiceOfStopStep].end_location.lat() * (numberOfDivision - 1) + $scope.donnees_du_trajet.routes[0].legs[0].steps[indiceOfStopStep + 1].end_location.lat()) / numberOfDivision, ($scope.donnees_du_trajet.routes[0].legs[0].steps[indiceOfStopStep].end_location.lng() * (numberOfDivision - 1) + $scope.donnees_du_trajet.routes[0].legs[0].steps[indiceOfStopStep + 1].end_location.lng()) / numberOfDivision);
            alert(placeToStop);
        } else {
            
            // Vérifier si c'est déjà un LatLng pas besoin d'en créer un nouveau ! START LOCATION
            placeToStop = new google.maps.LatLng($scope.donnees_du_trajet.routes[0].legs[0].steps[indiceOfStopStep].end_location.lat(), $scope.donnees_du_trajet.routes[0].legs[0].steps[indiceOfStopStep].location.lat());
        }
        
        return {'indiceOfStopStep' : indiceOfStopStep, 'distanceInLastStep' : distanceInLastStep, 'numberOfDivision' : numberOfDivision, 'placeToStop' : placeToStop};
    }*/
    
    
    
    /*** FONCTION PERMETTANT DE COUPER UN CHEMIN EN PLUSIEURS TRONÇONS DE 25MIN ***/
    
    /**
    ***
    **/
    
/*    $scope.cutThePath = function () {
        // Si le trajet n'excède pas 28min, on propose d'effectuer le trajet d'un seul coup
        if ($scope.donnees_du_trajet.routes[0].legs[0].duration.value < 1620) {
            return {'indiceOfStopStep' : $scope.donnees_du_trajet.routes[0].legs[0].steps.length, 'distanceInLastStep' : 0};
        } else {
            

            var j = 0, whereToCut = [], stationsVelibOptimales = [], temp, tempbis;
            while (j < $scope.donnees_du_trajet.routes[0].legs[0].steps.length - 1) {
                alert(j);
                tempbis = cutThePathAnnexe(j);
                whereToCut.push(tempbis);
                j = tempbis.indiceOfStopStep + 1;
            }*/

            //alert(whereToCut);
    /*        for (i = 1; i < whereToCut.length - 2; i += 1) {
                temp = stationVelibPlusProche(whereToCut[i].placeToStop, true);
                stationsVelibOptimales.push(temp);
                stationsVelibOptimales.push(stationVelibPlusProche(temp, true));
            }
            alert(stationsVelibOptimales);*/
  /*      }
    };*/
    




    
    /*** FONCTION PERMETTANT DE CHOISIR LA RECOMMANDATION À AFFICHER ***/
    
    /**
    ***
    **/
    
    function recommend() {
        $scope.show_card_recommandation = true;
        if ($scope.weather.hourly.data[0].icon === "rain" || $scope.weather.hourly.data[0].icon === "snow") {
            $scope.recommandation = "Prenez donc le MÉTRO !";
            $scope.Titre_Recommandation = "Prenez donc le MÉTRO !";
        } else {
            distanceStationMetroDestination = google.maps.geometry.spherical.computeDistanceBetween($scope.transportsStationsProches.geometry.location, $scope.donnees_du_trajet.routes[0].legs[0].end_location);
            distanceStationVelibDestination = google.maps.geometry.spherical.computeDistanceBetween($scope.donneesVelibPlusProche.start_location, $scope.donnees_du_trajet.routes[0].legs[0].end_location);

            if (distanceStationMetroDestination > distanceStationVelibDestination) {
                $scope.recommandation = "Prenez donc le VÉLO !";
                $scope.Titre_Recommandation = "Prenez donc le VÉLO !";
            } else {
                if (distanceStationVelibDestination < 200) {
                    $scope.recommandation = "Prenez donc le VÉLO !";
                    $scope.Titre_Recommandation = "Prenez donc le VÉLO !";
                } else {
                    $scope.recommandation = "Prenez donc le MÉTRO !";
                    $scope.Titre_Recommandation = "Prenez donc le MÉTRO !";
                }
            }

        }
        // On le remet une deuxième fois pour corriger un bug sur Android 4.4 et sup
        $ionicLoading.hide();
        
    }
    
    
    /*** FONCTION PERMETTANT DE VÉRIFIER L'ÉTAT DE LA CONNEXION INTERNET ***/
    
    /**
    ***
    **/
    
    function isPhoneConnected() {
        document.addEventListener("deviceready", function () {
            if ($cordovaNetwork.isOffline()) {
                $ionicLoading.show({
                    template: "L'appareil n'a pas accès à internet ! Veuillez vérifier votre connection avant d'utiliser l'application.",
                    duration: 3000
                });
            }


        }, false);
    }
    
    
    
    /*** FONCTION APPELEE EN CAS D'ERREUR (non fonctionnement de l'API Météo, non connexion à Internet,...) LORS DE L'APPEL DE LA FONCTION $scope.searchWeather ***/
    
    /** 
    *** @return alert("Erreur")
    **/
    
    function httpError(response) {
        $ionicLoading.hide();
        $ionicLoading.show({
            template: "Impossible de récupérer les informations météorologiques. Veuillez vérifier votre connexion.",
            duration: 2000
        });

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
            recommend();
            /*$scope.show_card_recommandation = true;
            if (response.hourly.data[0].icon === "rain") {
                $scope.recommandation = "Prenez donc le MÉTRO !";
                $scope.Titre_Recommandation = "Prenez donc le MÉTRO !";
            } else {
                $scope.recommandation = "Prenez donc le VÉLO !";
                $scope.Titre_Recommandation = "Prenez donc le VÉLO !";

            }
            // On le remet une deuxième fois pour corriger un bug sur Android 4.4 et sup
            //$scope.stationVelibPlusProche(LatLngCityEnd);
            $ionicLoading.hide();*/
        }).error(httpError);
    };


    /*  PARTIE UTILE POUR LA CARTE  */
    
    
    
    /*** ENSEMBLE DES FONCTIONS UTILISEES POUR L'AFFICHAGE ET LE DESAFFICHAGE DU MODAL PRESENTANT LES ETAPES DU TRAJET DEFINI PAR L'UTILISATEUR ***/
    
    /**
    *** @function $scope.openModal() : affiche le modal. Change la taille de la Map pour l'adapter à la place restante sur l'écran. Augmente le zoom. Affiche le Panel de                                                directions étape par étape
    *** @function $scope.closeModal() : ferme le modal. Une fois le modal détruit, change la taille de la map pour qu'elle reprenne tout l'écran, et réaffiche la carte de                                               recommandation
    *** @function $scope.reloadMap() : reload la carte une fois le modal fermé
    **/
    
    $ionicModal.fromTemplateUrl('modal_affichage_trajet.html', {
        id: '1',
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalTrajet = modal;
    });
    
    $ionicModal.fromTemplateUrl('modal_affichage_aide.html', {
        id: '2',
        backdropClickToClose: false,
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalAide = modal;
    });

    /** $scope.openModal()
    *** 
    *** @return boolean $scope.show_card_recommandation : permet de cacher la carte de recommandation une fois le modal affiché
    *** @return String $scope.sizeMap : permet d'adapter la taille de la map affichée à la place restante sur l'écran
    **/
    
    $scope.openModal = function (index) {
        if (index === 1) {
            $scope.modalTrajet.show();
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
            directionsDisplayMiddle.setPanel(document.getElementById('PanelTrajet'));
        // On recharge la carte à cause d'un bug lorsqu'on cache le modèle
            mapToReload = true;
        } else if (index === 2) {
            $scope.modalAide.show();
        }
        

    };

    /** $scope.closeModal()
    **/
    
    $scope.closeModal = function (index) {
        if (index === 1) {
            $scope.modalTrajet.hide();
        } else if (index === 2) {
            $scope.modalAide.hide();
        }
    };
    
    // Quand le modal est fermé on réaffiche la carte en version grand écran
    $scope.$on('modal.hidden', function (event, modal) {
        if (modal.id === '1') {
            // On réaffiche la map version grand écran
            $scope.sizeMap = 'big';
            // On réaffiche la recommandation
            $scope.show_card_recommandation = true;
        }
    });

    $scope.$on('$destroy', function (event, modal) {
        if (modal.id === '1') {
            // On réaffiche la map version grand écran
            google.maps.event.trigger($scope.map, 'resize');
            $scope.modalAide.remove();
            $scope.modalTrajet.remove();
        }

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
        isPhoneConnected();
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
        directionsDisplayStart.setMap(map);
        directionsDisplayMiddle.setMap(map);
        directionsDisplayEnd.setMap(map);
        $scope.map = map;
        
        $scope.placesService = new google.maps.places.PlacesService(map);
        
        // Récupère les réglages enregistrés en local pour les différentes options. Si aucun réglage trouvé (premier lancement), true est par défaut.
        if (localStorage.getItem("prefDecoupageDuTrajet") === null) {
            localStorage.setItem("prefDecoupageDuTrajet", "true");
            $scope.decoupageDuTrajetInit = true;
        } else {
            if (localStorage.getItem("prefDecoupageDuTrajet") === "true") {
                $scope.decoupageDuTrajetInit = true;
            } else {
                $scope.decoupageDuTrajetInit = false;
            }
        }
        
        if (localStorage.getItem("prefGeolocalisation") === null) {
            localStorage.setItem("prefGeolocalisation", "true");
            $scope.geolocalisationInit = true;
        } else {
            if (localStorage.getItem("prefGeolocalisation") === "true") {
                $scope.geolocalisationInit = true;
            } else {
                $scope.geolocalisationInit = false;
            }
        }
       
        // Si l'utilisateur a choisi l'option de géolocalisation au lancement, on le géolocalise
        if ($scope.geolocalisationInit) {
            $scope.centerOnMe();
        }
    
    }

    /*** FONCTION SAUVEGARDANT LA PRÉFÉRENCE DE L4UTILISATEUR QUANT À L'OPTION DE DÉCOUPAGE DU TRAJET ***/
    
    /**
    ***
    **/
    
    $scope.saveSettings = function (Pref, index) {
        // Index === 1 pour la préférence de découpage du trajet
        if (index === 1) {
            if (angular.isDefined(Pref)) {
                if (Pref) {
                    localStorage.setItem("prefDecoupageDuTrajet", "true");
                } else {
                    localStorage.setItem("prefDecoupageDuTrajet", "false");
                }
            } else {
                if ($scope.decoupageDuTrajetInit) {
                    localStorage.setItem("prefDecoupageDuTrajet", "false");
                } else {
                    localStorage.setItem("prefDecoupageDuTrajet", "true");
                }

            }
        // Index === 2 pour la préférence de géolocalisation
        } else if (index === 2) {
            if (angular.isDefined(Pref)) {
                if (Pref) {
                    localStorage.setItem("prefGeolocalisation", "true");
                } else {
                    localStorage.setItem("prefGeolocalisation", "false");
                }
            } else {
                if ($scope.geolocalisationInit) {
                    localStorage.setItem("prefGeolocalisation", "false");
                } else {
                    localStorage.setItem("prefGeolocalisation", "true");
                }

            }
        }

        
    };


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
        isPhoneConnected();
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
            $scope.Titre_Recommandation = "Métro ou Vélib ?"; // On réinitialise le itre à Métro ou Vélib ?
            $http.get("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + pos.coords.latitude + "," + pos.coords.longitude + "&sensor=false").success(function (response) {
                
                var geo = new google.maps.LatLng(response.results[0].geometry.location.lat, response.results[0].geometry.location.lng);
                $scope.city_start = response.results[0].formatted_address;
                $scope.verif_city_start = response.results[0].formatted_address;
                // On affiche la ville de départ dans le formulaire
                $scope.detailsCityStart = {geometry: {location: geo}};
                document.getElementById('city_start').value = response.results[0].formatted_address;
            }).error(function (response) {
                $ionicLoading.show({
                    template: "Impossible de récupérer la géolocalisation. Veuillez vérifier vos paramètres et votre connexion.",
                    duration: 2000
                });
            });
        }, function (error) {
            $ionicLoading.hide();
            $ionicLoading.show({
                template: "Impossible de récupérer la géolocalisation. Veuillez vérifier vos paramètres et votre connexion.",
                duration: 2000
            });
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
        isPhoneConnected();
        if ($scope.show_card_definir_un_trajet === true) {
            $scope.show_card_definir_un_trajet = false;
            $scope.showButtonsOnMap = true;
            if (angular.isDefined($scope.show_donnees_du_trajet)) {
                $scope.show_donnees_du_trajet = true;
            }
        } else {
            $scope.show_card_definir_un_trajet = true;
            $scope.show_card_recommandation = false;
            $scope.showButtonsOnMap = false;
            if (angular.isDefined($scope.show_donnees_du_trajet)) {
                $scope.show_donnees_du_trajet = false;
            }
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
    

    
    /*** FONCTION PERMETTANT DE DETERMINER LA STATION VELIB LA PLUS PROCHE DE LA DESTINATION ET CALCUL DE LA DISTANCE LES SEPARANT ***/
    
    /**
    *** @param LatLng address : Googe Object pcorrespondant à la position de l'adresse d'arrivée
    ***
    *** @return JSONObject $scope.donneesVelibPlusProche : contient toutes les infos utiles pour connaître le trajet à pied entre la station vélib la plus proche de la                                                                      destination et la destination elle-même
    **/
    
    function stationVelibPlusProche(address, isCalculating, deparrivee) {
        // Calcul d'un minimum, on calcule la distance géodésique, donc approximative entre chaque station et la destination, on garde le minimum de ces distances, qui, on le suppose, va aussi être le minimum de la distance à pied
        var distanceMini, stationPlusProche, distanceTemp, stationLatLng, request, stationLatLngPlusProche, stationPlusProcheDepart, stationPlusProcheArrivee;
        // On initialise la station la plus proche comme étant la première de la liste
        stationPlusProche = markersVelibDispo[0];
        stationLatLng = new google.maps.LatLng(markersVelibDispo[0].position.lat(), markersVelibDispo[0].position.lng());
        distanceMini = google.maps.geometry.spherical.computeDistanceBetween(address, stationLatLng);
        // Boucle for de calcul de minimum
        for (i = 1; i < markersVelibDispo.length; i += 1) {
            stationLatLng = new google.maps.LatLng(markersVelibDispo[i].position.lat(), markersVelibDispo[i].position.lng());
            distanceTemp = google.maps.geometry.spherical.computeDistanceBetween(address, stationLatLng);
            // Si la distance calculée est plus petite, on la garde comme minimum. On la veut différente de 0 car cette fonction permettra aussi de déterminer la station élib la plus proche d'une autre station
            if (distanceTemp < distanceMini && distanceTemp !== 0) {
                distanceMini = distanceTemp;
                // Si c'est le départ, c'est le nombre de vélibs dispo qui est intéressant, si c'est l'arrivée, c'est le nb de places dispo qui est utile
                if (deparrivee === "depart") {
                    stationPlusProche = markersVelibDispo[i];
                } else {
                    stationPlusProche = markersPlacesDispo[i];
                }
                
                
            }
        }
        // Une fois qu'on a trouvé la distance minimum, on envoie une requête à l'API Google Direction afin de déterminer la véritable distance à pied entre la station de vélib la plus proche et la destination voulue
        stationLatLngPlusProche = new google.maps.LatLng(stationPlusProche.position.lat(), stationPlusProche.position.lng());
        // On sauvegarde les données du trajet à pied pour les afficher dans la page (on affiche la distance et la durée) si cette fonction n'est pas appelée par la fonction de découpage du trajet
        if (!(isCalculating)) {
            request = {
                origin        : stationLatLngPlusProche,
                destination   : address,
                travelMode    : google.maps.DirectionsTravelMode.WALKING, // Mode de conduite
                unitSystem    : google.maps.UnitSystem.METRIC
            };

            directionsService.route(request, function (response, status) {
                $scope.donneesVelibPlusProche = response.routes[0].legs[0];
            });
                            
        } else { //On calcule des trajets selon que la station est celle de départ ou celle d'arrivée
            if (deparrivee === "depart") {
                request = {
                    origin        : address,
                    destination   : stationLatLngPlusProche,
                    travelMode    : google.maps.DirectionsTravelMode.WALKING, // Mode de conduite
                    unitSystem    : google.maps.UnitSystem.METRIC
                };

                directionsService.route(request, function (response, status) {
                    $scope.donneesVelibPlusProcheDepart = {donneesTrajet : response, station : stationPlusProche};
                });
            } else if (deparrivee === "arrivee") {
                request = {
                    origin        : stationLatLngPlusProche,
                    destination   : address,
                    travelMode    : google.maps.DirectionsTravelMode.WALKING, // Mode de conduite
                    unitSystem    : google.maps.UnitSystem.METRIC
                };

                directionsService.route(request, function (response, status) {
                    $scope.donneesVelibPlusProcheArrivee = {donneesTrajet : response, station : stationPlusProche};
                });
            }
        }

    }
    
    
    
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
    $scope.calculate = function (city_start, city_end, minute_choisie, heure_choisie, isRecalculation, forceToUseGeoloc) {
        isPhoneConnected();
        //On efface les markers utilisés précédemment
        for (i = 0; i < $scope.markersToErase.length; i += 1) {
            $scope.markersToErase[i].setMap(null);
        }
        // Récupère la location de départ voulue (géolocalisation ou adresse entrée)
        var CITYSTART, CITYEND, stationVelibPlusProcheDepart, stationVelibPlusProcheArrivee;
        
        // On vérifie si c'est la géolocalisation qui est utilisée ou non
        if ($scope.verif_city_start === document.getElementById("city_start").value) {
            CITYSTART = $scope.detailsCityStart;
        } else {
            if (city_start.name + ", Paris, France" === document.getElementById("city_start").value || city_start.formatted_address === document.getElementById("city_start").value) {
                CITYSTART = city_start;
                // Permet de remplacer la première entrée du formulaire par sa vraie valeur
                $scope.city_start = city_start.formatted_address;
                if (city_start.address_components[0].short_name === "FR") {
                    $scope.city_start = city_start.name + ", Paris, France";
                }
            }
        }

        if (city_end.formatted_address === document.getElementById("city_end").value) {
            CITYEND = city_end;
        } else {
            if (city_end.name + ", Paris, France" === document.getElementById("city_end").value || city_end.formatted_address === document.getElementById("city_end").value) {
                CITYEND = city_end;
            }
        }
        
        // Permet de sauvegarder les entrées du dernier chemin calculé dans le cas du recalcule lors d'un changement de moyen de transport
        $scope.donneesSauvegardees = [CITYSTART, CITYEND, minute_choisie, heure_choisie];
        
        if (forceToUseGeoloc) {
            CITYSTART = $scope.detailsCityStart;
        }
        if (CITYSTART && CITYEND) {
            stationVelibPlusProche(CITYSTART.geometry.location, true, "depart");
            stationVelibPlusProche(CITYEND.geometry.location, true, "arrivee");
            
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

            // Distinction de cas selon que l'utilisateur a choisi une heure et une minute, ou non. Si non, on définit la minute ou l'heure choisie par l'heure ou la minute actuelle
            var jour, jour_bis, mois, mois_bis, annee, heure_choisie_bis, minute_choisie_bis, date_complete, date_complete_format_navitia, request, requestNearbySearch;
            jour = d.getDate().toString();
            mois = (d.getMonth() + 1).toString();
            annee = d.getFullYear().toString();
            if (dateHasBeenPicked) {
                // On récupère le jour, le mois et l'année aux quels on va ajouter l'heue et la minute choisie pour le trajet, afin de convertir le tout en millisecondes depuis le 1er Janvier 1970. On enlève le "min" et le "h" pour la minute et pour l'heure choisie
                millisecondes_unix = Date.parse($scope.datePicked);
            } else {
                if (mois < 10) {
                    mois_bis = "0" + mois;
                } else {
                    mois_bis = mois;
                }
                if (jour < 10) {
                    jour_bis = "0" + jour;
                } else {
                    jour_bis = jour;
                }
                heure_choisie_bis = heure_choisie;
                minute_choisie_bis = minute_choisie;
                date_complete = mois + "/" + jour + "/" + annee + " " + heure_choisie_bis + ":" + minute_choisie_bis;
                date_complete_format_navitia = annee + mois_bis + jour_bis + "T" + heure_choisie_bis + minute_choisie_bis + "00";
                millisecondes_unix = Date.parse(date_complete);
            }
           /* $http.get("https://api.navitia.io/v1/journeys?from=" + CITYSTART.geometry.location.lng() + ";" + CITYSTART.geometry.location.lat() + "&to=" + city_end.geometry.location.lng() + ";" + city_end.geometry.location.lat() + "&datetime=" + date_complete_format_navitia, headerConfig).success(function (response) {
                //alert(response.journeys[0].sections[response.journeys[0].sections.length - 1]);
            }).error(function (response) {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: "Impossible de récupérer les données des transports en commun.",
                    duration: 1000
                });
                $scope.loading = $ionicLoading.show({
                    template: 'Calcul du trajet en cours...',
                    showBackdrop: false
                });
            });*/
            
            $timeout(function () {
                request = {
                    origin        : $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].end_location,
                    destination   : $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].start_location,
                    transitOptions: {
                        departureTime: new Date(millisecondes_unix)
                    },
                    travelMode    : $scope.choixDeTransport, // Mode de conduite
                    unitSystem    : google.maps.UnitSystem.METRIC
                };
            
            

            

                directionsService.route(request, function (response, status) { // Envoie de la requête pour calculer le parcours
                    if (status === google.maps.DirectionsStatus.OK) {
                        if ($scope.choixDeTransport === google.maps.DirectionsTravelMode.BICYCLING) {
                            // On affiche tous les morceaux du trajet sur la carte
                            directionsDisplayStart.setMap($scope.map);
                            directionsDisplayEnd.setMap($scope.map);
                            
                            if (response.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].distance.value > 1000) {
                                $scope.effectiveDistance = Math.floor((response.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].distance.value) / 100, 3)/10 + " km";
                            } else {
                                $scope.effectiveDistance = response.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].distance.value;
                            }

                            if (response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value > 3600) {
                                $scope.effectiveDuration = (response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value - (response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value) % 3600) / 3600 + " h " + (((response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value) % 3600) - ((response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value) % 3600) % 60) / 60 + " min";
                            } else if (response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value > 60) {
                                $scope.effectiveDuration = (response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value - (response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value) % 60) / 60 + " minutes";
                            } else {
                                $scope.effectiveDuration = response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value + " s";
                            }
                            
                            $scope.donneesEffectivesDuTrajet = {duration : response.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].duration.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].duration.value , distance : response.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].distance.value + $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].distance.value }
                            $scope.donneesVelibPlusProcheArrivee.station.setOptions({visible : true});
                            $scope.donneesVelibPlusProcheArrivee.station.setMap($scope.map);
                            $scope.donneesVelibPlusProcheDepart.station.setOptions({visible : true});
                            $scope.donneesVelibPlusProcheDepart.station.setMap($scope.map);
                            
                            var markerDepart, markerArrivee;
                            markerDepart = new google.maps.Marker({
                                position: $scope.donneesVelibPlusProcheDepart.donneesTrajet.routes[0].legs[0].start_location,
                                map: $scope.map,
                                icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=A|a71212|ffffff"
                            });
                            markerArrivee = new google.maps.Marker({
                                position: $scope.donneesVelibPlusProcheArrivee.donneesTrajet.routes[0].legs[0].end_location,
                                map: $scope.map,
                                icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=B|358137|ffffff"
                            });
                            $scope.markersToErase = [$scope.donneesVelibPlusProcheDepart.station, $scope.donneesVelibPlusProcheArrivee.station, markerDepart, markerArrivee];
                            
                            directionsDisplayStart.setDirections($scope.donneesVelibPlusProcheDepart.donneesTrajet); // Trace l'itinéraire sur la carte et les différentes étapes du parcours                        

                            directionsDisplayEnd.setDirections($scope.donneesVelibPlusProcheArrivee.donneesTrajet); // Trace l'itinéraire sur la carte et les différentes étapes du parcours
                            directionsDisplayMiddle.setDirections(response); // Trace l'itinéraire sur la carte et les différentes étapes du parcours
                        } else {
                            $scope.effectiveDistance = response.routes[0].legs[0].distance.text;
                            $scope.effectiveDuration = response.routes[0].legs[0].duration.text;
                            // On désaffiche les morceux de routes correspondant aux parties à pied
                            directionsDisplayStart.setMap(null);
                            directionsDisplayEnd.setMap(null);
                            directionsDisplayMiddle.setDirections(response); // Trace l'itinéraire sur la carte et les différentes étapes du parcours
                        }
                        $scope.donnees_du_trajet = response; //permet de récupérer la durée et la distance

                        requestNearbySearch = {
                            location : CITYEND.geometry.location,
                            rankBy : google.maps.places.RankBy.DISTANCE,
                            types : ['subway_station']
                        };

                        $scope.placesService.nearbySearch(requestNearbySearch, function (results, status) {
                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                $scope.transportsStationsProches = results[0];
                            }
                        });

                        // On affiche le footer avec la distance et la durée
                        $scope.show_donnees_du_trajet = true;
                        if (!(isRecalculation)) {
                            $scope.showCard(); //on cache la carte de défintion d'itinéraire si ce n'est pas un recalcul

                            // On cherche la station de vélib la plus proche

                            stationVelibPlusProche(response.routes[0].legs[0].end_location, false);






                            // On cherche la météo pour afficher la recommandation
                            $timeout(function () {
                                $ionicLoading.hide();
                                $scope.searchWeather(response.routes[0].legs[0].end_location);
                            }, 1000);
                        } else {
                            $ionicLoading.hide(); // Si c'est un recalcul, il faut juste arrêter de montrer l'icône de chargement
                        }
                        //Si aucun résultat n'a été trouvé (lorsque le mode de transport est transports publics)
                    } else if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
                        $scope.showCard(); //on cache la carte de défintion d'itinéraire si ce n'est pas un recalcul
                        $ionicLoading.hide();
                        $ionicLoading.show({
                            template: "Aucun itinéraire en transports en commun n'a été trouvé.",
                            duration: 3000
                        });
                    }
                });
            }, 500);
        }
    };



    /*** FONCTION PERMETTANT D'UTILISER L'AUTOCOMPLETION POUR PROPOSER DES CHOIX A l4UTILISATUER ENTRANT UNE ADRESSE ***/
    
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

DirectionCtrl.$inject = ['$scope', '$http', '$ionicLoading', '$compile', '$cordovaGoogleAnalytics', '$ionicModal', '$cordovaDatePicker', '$timeout', '$cordovaNetwork', '$cordovaVibration', '$cordovaEmailComposer'];

carte.controller('DirectionCtrl', DirectionCtrl);
