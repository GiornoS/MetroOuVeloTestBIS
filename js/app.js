// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])


.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})


/*angular.module('carte', ['ionic'])
.controller('MapCtrl', function($scope, $ionicLoading, $compile) {
	
	function initialize() {
		var paris = new google.maps.LatLng(48.85834,2.33752);
		var mapOptions = {
			center: paris,
			zoom: 11,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		var map = new google.maps.Map(document.getElementById("map"), mapOptions);
		$scope.map = map;
	}
	
	ionic.Platform.ready(initialize);
	
	var marker;	//Variable pour avoir un seul marqueur
	$scope.centerOnMe = function() {
		if(!$scope.map) {
			return;
		}
		$scope.loading = $ionicLoading.show({
			content: 'Getting current location...',
			showBackdrop: false
		});
		navigator.geolocation.getCurrentPosition(function(pos) {
			
			$scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
			$scope.map.setZoom(15);
			$scope.loading.hide();
			
			var posit = new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
			
			if (!marker){
				marker = new google.maps.Marker({
					position: posit,
					map: $scope.map,
					title: 'You are here'
				});
			}else{
				marker.setMap(null);
				marker = new google.maps.Marker({
					position: posit,
    	     		map: $scope.map,
    	     		title: 'You are here'
    	     	});
  	     	}
		}, function(error) {
     		alert('Unable to get location: ' + error.message);
     		$scope.loading.hide();
     	},{
     		timeout: 15000
     	});
   };
});
*/

/*var app = angular.module('app', ['ionic'])

app.factory('GeolocationService', function($window, $q, $rootScope){
	var geolocation = $window.navigator.geolocation;
	return {
		getCurrentPosition : function(onSuccess, onError){
			geolocation.getCurrentPosition(function(position){
				$rootScope.$apply(function(){
					onSuccess(position);
				})
			}, function(){
				$rootScope.$apply(function(){
					onError();
				})				
			})
			return true;	
		}
	}
})
*/
