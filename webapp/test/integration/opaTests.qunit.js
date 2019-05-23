/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"dlw/hackaton_rgpd/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});