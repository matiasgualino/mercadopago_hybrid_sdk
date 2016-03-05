// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('mercadopago', ['ionic','mercadopago.controllers', 'mercadopago.services'])
.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		if(window.StatusBar) {
			StatusBar.styleDefault();
		}
	});
})
.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/vip')
		
	var vip = {
		name: 'vip',
		url: '/vip',
		templateUrl: 'vip.html',
		controller: 'ProductCtrl'
	};

	var payment_methods = {
		name: 'payment_methods',
		url: '/:product_id/:payment_method_id',
		templateUrl: 'payment_methods.html',
		controller: 'PaymentMethodsCtrl'
	};
	
	var card_issuers = {
		name: 'card_issuers',
		url: '/:product_id/:payment_method_id/:issuer_id',
		templateUrl: 'card_issuers.html',
		controller: 'CardIssuersCtrl'
	};

	var installments = {
		name: 'installments',
		url: '/:product_id/:payment_method_id/:issuer_id/:installments',
		templateUrl: 'installments.html',
		controller: 'InstallmentsCtrl'
	};
	
	var card_form = {
		name: 'card_form',
		url: '/:product_id/:payment_method_id/:issuer_id/:installments/:token',
		templateUrl: 'card_form.html',
		controller: 'CardFormCtrl'
	};

	var payment_result = {
		name: 'payment_result',
		url: '/:product_id/:payment_method_id/:issuer_id/:installments/:token/payment_result',
		templateUrl: 'payment_result.html',
		controller: 'PaymentCtrl'
	};
	
	var payment_result_off = {
		name: 'payment_result_off',
		url: '/:product_id/:payment_method_id/payment_result_off',
		templateUrl: 'payment_result.html',
		controller: 'PaymentCtrl'
	};

	$stateProvider
		.state(vip)
		.state(payment_methods)
		.state(card_issuers)
		.state(installments)
		.state(card_form)
		.state(payment_result)
		.state(payment_result_off)

});

angular.module('mercadopago.controllers', [])
.controller('ProductCtrl', function($scope, $state, $stateParams, $ionicHistory, ProductService) {
	$ionicHistory.clearHistory();

	$scope.product = ProductService.getProduct('id1');
	$scope.startCheckout = function(prod) {
		$state.go('payment_methods',
			{
				"product_id": prod.id
			});
	};
})
.controller('PaymentMethodsCtrl', function($scope, $state, $stateParams, $ionicLoading, MercadoPagoService) {
	$ionicLoading.show({
      template: 'Cargando...',
      noBackdrop: true
    });

    MercadoPagoService.getPaymentMethods().then(function(response) {
		$scope.paymentMethods = response["data"];
		$ionicLoading.hide();
	});

	$scope.selectedPaymentMethod = function(pm) {
		var state = 'payment_result_off';
		if (pm.payment_type_id == "credit_card" || 
			pm.payment_type_id == "debit_card" || 
			pm.payment_type_id == "prepaid_card") {
			state = 'card_issuers';	
		}
		$state.go(state,
			{
				"product_id": $stateParams.product_id,
				"payment_method_id": pm.id
			});
	};
})
.controller('CardIssuersCtrl', function($scope, $state, $stateParams, $ionicLoading, MercadoPagoService) {
	$ionicLoading.show({
      template: 'Cargando...',
      noBackdrop: true
    });

    MercadoPagoService.getIssuers($stateParams.payment_method_id).then(function(response) {
		$scope.cardIssuers = response["data"];
		$ionicLoading.hide();
	});
			
	$scope.selectedCardIssuer = function(issuer) {
		$state.go('installments', 
			{
				"product_id": $stateParams.product_id,
				"payment_method_id": $stateParams.payment_method_id, 
				"issuer_id": issuer.id
			});
	};
})
.controller('InstallmentsCtrl', function($scope, $state, $stateParams, $ionicLoading, MercadoPagoService, ProductService) {
	$ionicLoading.show({
      template: 'Cargando...',
      noBackdrop: true
    });
			
	var product = ProductService.getProduct('id1');

    MercadoPagoService.getInstallments($stateParams.payment_method_id, $stateParams.issuer_id, product.price)
		.then(function(response) {
			var pcs = response["data"][0]["payer_costs"];
			if (pcs.length > 1) {
				$scope.installments = pcs;	
				$ionicLoading.hide();
			} else {
				$ionicLoading.hide();
				$state.go('card_form', 
				{
					"product_id": $stateParams.product_id,
					"payment_method_id": $stateParams.payment_method_id, 
					"issuer_id": $stateParams.issuer_id, 
					"installments": 1
				});
			}
		}
	);
			
	$scope.selectedInstallment = function(installment) {
		$state.go('card_form', 
			{
				"product_id": $stateParams.product_id,
				"payment_method_id": $stateParams.payment_method_id, 
				"issuer_id": $stateParams.issuer_id, 
				"installments": installment.installments
			});
	};
})
.controller('CardFormCtrl', function($scope, $state, $stateParams, $ionicLoading, MercadoPagoService) {
	$ionicLoading.show({
      template: 'Cargando...',
      noBackdrop: true
    });

    MercadoPagoService.getIdentificationTypes().then(function(response) {
		$scope.identification_types = response["data"];
		$ionicLoading.hide();
	});

	$scope.card_token = {};

	$scope.createToken = function() {
		$ionicLoading.show({
	      template: 'Cargando...',
	      noBackdrop: true
	    });
		MercadoPagoService.createToken(this.card_token).then(function(response) {
			$ionicLoading.hide();
			$state.go('payment_result', 
			{
				"product_id": $stateParams.product_id,
				"payment_method_id": $stateParams.payment_method_id, 
				"issuer_id": $stateParams.issuer_id, 
				"installments": $stateParams.installments,
				"token": response["data"].id
			});
		}, function(response) {
			alert(JSON.stringify(response));
		});
	};
})
.controller('PaymentCtrl', function($scope, $state, $stateParams, $ionicHistory, $ionicLoading, MercadoPagoService, ProductService) {
	$ionicHistory.clearHistory();

	$ionicLoading.show({
      template: 'Cargando...',
      noBackdrop: true
    });

	// WARNING: THIS IS A MOCK 
	var YOUR_BASE_URL = 'https://www.mercadopago.com';
	var YOUR_PAYMENT_URI = '/checkout/examples/doPayment';
	
	var product = ProductService.getProduct('id1');
			
	var merchant_payment = {
		payment_method_id: $stateParams.payment_method_id, 
		card_issuer_id: parseInt($stateParams.issuer_id), 
		installments: parseInt($stateParams.installments),
		card_token: $stateParams.token,
		merchant_access_token: 'mla-cards-data',
		item: {
			id: product.id,
			quantity: 1,
			unit_price: product.price
		}
	};

	$scope.close = function() {
		$state.go('vip');
	}
			
	MercadoPagoService.createPayment(YOUR_BASE_URL, YOUR_PAYMENT_URI, merchant_payment)
		.then(function(response) {
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

angular.module('mercadopago.services', [])
.factory('MercadoPagoService', function ($http) {
	var public_key = "444a9ef5-8a6b-429f-abdf-587639155d88";
	var base_url = "https://api.mercadopago.com";

	function get_url(uri, params) {
		var parameters = "?public_key=" + public_key;
		if (typeof params != "undefined") {
			parameters = parameters + "&" + params;
		}
		return base_url + uri + parameters;
	}

	function get(uri, params) {
		return $http.get(get_url(uri, params));
	}

	function post(uri, params, body) {
		return $http.post(get_url(uri, params), body);
	}

	return {
		getPaymentMethods: function() {
			return get("/v1/payment_methods");
		},
		getIssuers: function(payment_method_id) {
			return get("/v1/payment_methods/card_issuers", 
				"payment_method_id=" + payment_method_id);
		},
		getInstallments: function(payment_method_id, issuer_id, amount) {
			return get("/v1/payment_methods/installments", 
						"payment_method_id=" + payment_method_id + 
						"&amount=" + amount + 
						"&issuer.id=" + issuer_id);
		},
		getIdentificationTypes: function() {
			return get("/v1/identification_types");
		},
		getPromos: function() {
			return get("/v1/payment_methods/deals");
		},
		createToken: function(card_token) {
			return post("/v1/card_tokens", undefined, card_token);
		},
		createPayment: function(base_url, uri, merchant_payment) {
			return $http({
			            url: base_url + uri,
			            method: 'POST',
			            data: merchant_payment,
			            headers: {
			                 'Content-Type': 'application/json'
			            }
			          });
		}
	}
})
.factory('ProductService', function () {
		 return {
			 getProduct: function(id) {
			 return { id: 'id1', name: 'Funda Flip Cover Samsung Galaxy S4 Mini', image_url:'http://mla-s1-p.mlstatic.com/funda-flip-cover-samsung-galaxy-s4-mini-original-film-7290-MLA5178884614_102013-O.jpg', price: 100 }
			 }
		 }
});