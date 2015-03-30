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
