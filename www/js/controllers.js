angular.module('mercadopago.controllers', [])
.controller('PaymentMethodsCtrl', function($scope, mercadoPagoService) {
/*			mercadoPagoService.getPaymentMethods().then(function(response) {
				$scope.paymentMethods = response["data"];
			});*/
			
			mercadoPagoService.getIssuers("visa").then(function(response) {
														$scope.paymentMethods = response["data"];
														});

			$scope.selectedPaymentMethod = function(pm) {
			alert(pm.payment_type_id);
			};
});

angular.module('mercadopago.services', [])
.factory('mercadoPagoService', function ($http) {
		 var public_key = "TEST-d941de2c-22bd-4e9e-a06c-48a404b66080";
		 return {
			getPaymentMethods: function() {
			return $http.get("https://api.mercadopago.com/v1/payment_methods?public_key=" + public_key);
			},
			getIssuers: function(payment_method_id) {
			return $http.get("https://api.mercadopago.com/v1/payment_methods/card_issuers?public_key=" + public_key + "&payment_method_id=" + payment_method_id);
			}
		 }
		 })