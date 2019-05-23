sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createParameterModel: function() {
			var oModel = new JSONModel();
	        oModel.setData({ 
	        	"authKey": "",
				"clientId": "",
				"clientSecret": "",
				"saveCookies": false
	        });
	        oModel.setDefaultBindingMode("TwoWay");
	        return oModel;
		},
		
		createResultModel: function() {
			var oModel = new JSONModel();
			oModel.setData({
				"res": "error"
			});
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		}
	};
});