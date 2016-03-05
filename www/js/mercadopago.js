// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('mercadopagosdk', ['ionic','mercadopagosdk.controllers'])
.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		if(window.StatusBar) {
			StatusBar.styleDefault();
		}
	});
})
.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/card_form')

	var card_form = {
		name: 'card_form',
		url: '/:token',
		templateUrl: 'card_form.html',
		controller: 'CardFormCtrl'
	};

	var payment_result = {
		name: 'payment_result',
		url: '/:product_id/:payment_method_id/:issuer_id/:installments/:token/payment_result',
		templateUrl: 'payment_result.html',
		controller: 'PaymentCtrl'
	};

	$stateProvider
		.state(card_form)
		.state(payment_result)

});

angular.module('mercadopagosdk.controllers', [])
.controller('CardFormCtrl', function($scope, $state, $stateParams, $ionicLoading) {
	Mercadopago.setPublishableKey("444a9ef5-8a6b-429f-abdf-587639155d88");

	$scope.identification_types = [];
	$scope.installments = [];
	$scope.issuers = [];

	$scope.amount = 100;
	$scope.cardNumber = "";
	$scope.cardholderName = "";
	$scope.cardExpirationMonth = "";
	$scope.cardExpirationYear = "";
	$scope.docNumber = "";
	$scope.identification_type = {};
	$scope.securityCode = "";

	$scope.payment_method = {};
	$scope.installment = {};
	$scope.issuer = {};

	$ionicLoading.show({
      template: 'Cargando...',
      noBackdrop: true
    });

    Mercadopago.getIdentificationTypes(function(status, response) {
		$scope.identification_types = response;
		$ionicLoading.hide();
    });

	$scope.cardNumberKeyUp = function(event) {
		if (event.type == "keyup") {
			var bin = getBin();
			if (bin.length == 6) {
				Mercadopago.getPaymentMethod({
					"bin": bin
				}, setPaymentMethodInfo);
			}
		}
	};

	$scope.createToken = function() {
		$ionicLoading.show({
	      template: 'Cargando...',
	      noBackdrop: true
	    });

		var ct = {
			"cardNumber": $scope.cardNumber,
			"cardholderName": $scope.cardholderName,
			"cardExpirationMonth" : $scope.cardExpirationMonth,
			"cardExpirationYear" : $scope.cardExpirationYear,
			"docType": $scope.identification_type.id,
			"docNumber": $scope.docNumber,
			"securityCode": $scope.securityCode
		};

		Mercadopago.createToken(ct, function(status, response) {
			$ionicLoading.hide();
			
			var params = {
				"product_id": "id1",
				"payment_method_id": $scope.payment_method.id, 
				"installments": $scope.installment.installments,
				"token": response.id
			};

			if (typeof $scope.issuer != "undefined") {
				params["issuer_id"] = $scope.issuer.id;
			}
			

			$state.go('payment_result', params);
		});
	};

	function setPaymentMethodInfo(status, response) {
	    if (status == 200) {
			$scope.installments = {};
			$scope.issuers = {};

	    	$scope.payment_method = response[0];

	    	var cardConfiguration = $scope.payment_method.settings;
	    	var length = cardConfiguration[0]["security_code"].length;
			var card_length = cardConfiguration[0]["card_number"].length;
			var location = cardConfiguration[0]["security_code"].card_location;
			var locationString = "frente";
			var bin = getBin();
            var amount = 100.0; // TODO: CHANGE

            if (location == "back") {
				locationString = "dorso";
			}

			// check if the security code (ex: Tarshop) is required
        	for (var index = 0; index < cardConfiguration.length; index++) {
            	if (bin.match(cardConfiguration[index].bin.pattern) != null &&
            	 cardConfiguration[index].security_code.length == 0) {
                	$scope.security_code_required = false;
            	} else {
	                $scope.security_code_required = true;
            	}
        	}

			$scope.security_code_recommended_message = length + " dígitos al " + locationString + " de la tarjeta.";

	        // check if the issuer is necessary to pay
	        var issuerMandatory = false;
	        var additionalInfo = $scope.payment_method.additional_info_needed;

	        for (var i = 0; i < additionalInfo.length; i++) {
	            if (additionalInfo[i] == "issuer_id") {
	                issuerMandatory = true;
	            }
	        };

	        if (issuerMandatory) {
	        	$ionicLoading.show({
			      template: 'Cargando...',
			      noBackdrop: true
			    });
	            Mercadopago.getIssuers($scope.payment_method.id, function(status, issuers) {
					$scope.issuers = issuers;
					$ionicLoading.hide();
	            });
	        } else {
	        	getInstallments();
	        }		
	    }
	};

	function getInstallments(issuer_id) {
		var bin = getBin();
		var body = {
			"bin": bin,
			"amount": $scope.amount
		};

		if (typeof issuer_id != "undefined") {
			body["issuer_id"] = issuer_id;
		}
		Mercadopago.getInstallments(body, setInstallmentInfo);
	};

	function setInstallmentInfo(status, response) {
		$scope.installments = response[0].payer_costs;
	};

	$scope.hasIssuers = function() {
		return $scope.issuers.length > 0;
	};

	$scope.hasInstallments = function() {
		return $scope.installments.length > 0;
	};

    $scope.selectedIssuer = function() {
    	getInstallments($scope.issuer.id);
    };

    $scope.selectedIdentificationType = function(identification_type) {
    	$scope.identification_type = identification_type;
    }

    function getBin() {
		return $scope.cardNumber.toString().replace(/[ .-]/g, '').slice(0, 6);
	};
})
.controller('PaymentCtrl', function($scope, $state, $stateParams, $ionicHistory, $http, $ionicLoading) {
	$ionicHistory.clearHistory();

	$ionicLoading.show({
      template: 'Cargando...',
      noBackdrop: true
    });

	// WARNING: THIS IS A MOCK 
	var YOUR_BASE_URL = 'https://www.mercadopago.com';
	var YOUR_PAYMENT_URI = '/checkout/examples/doPayment';
	
	var merchant_payment = {
		payment_method_id: $stateParams.payment_method_id, 
		card_issuer_id: parseInt($stateParams.issuer_id), 
		installments: parseInt($stateParams.installments),
		card_token: $stateParams.token,
		merchant_access_token: 'mla-cards-data',
		item: {
			id: "id1",
			quantity: 1,
			unit_price: 100
		}
	};

	$scope.close = function() {
		$state.go('card_form');
	}
	
	$http({
		url: YOUR_BASE_URL + YOUR_PAYMENT_URI,
		method: 'POST',
		data: merchant_payment,
		headers: {
		     'Content-Type': 'application/json'
		}
	}).then(function(response) {
			$ionicLoading.hide();
			if (response["data"].status == "approved") {
				$scope.title = "Felicitaciones!";
				$scope.message = "Tu pago se procesó correctamente.";
				$scope.payment_status = "approved";
				$scope.icon = "ion-ios-checkmark-outline";
				$scope.background_color = "#33cd5f";
			} else {
				$scope.title = "Ups!";
				$scope.payment_status = "rejected";
				$scope.icon = "ion-ios-close-outline";
				$scope.background_color = "#ef473a";
				$scope.message = "No se pudo procesar tu pago";	
			}
		}, function(data) {
			$ionicLoading.hide();
			$scope.title = "Ups!";
			$scope.payment_status = "rejected";
			$scope.icon = "ion-ios-close-outline";
			$scope.background_color = "#ef473a";
			$scope.message = "No se pudo procesar tu pago";	
		}
	);		
})
;