sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"jquery.sap.global",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/suite/ui/microchart/RadialMicroChart"
], function(Controller, jQuery, MessageToast, MessageBox, Dialog, RadialMicroChart) {
	"use strict";

	return Controller.extend("dlw.hackaton_rgpd.controller.Main", {
		onInit: function () {
			sap.ui.getCore().attachValidationError(function (evt) {
				var control = evt.getParameter("element");
				if (control && control.setValueState) {
					control.setValueState("Error");
				}
			});
			
			sap.ui.getCore().attachValidationSuccess(function (evt) {
				var control = evt.getParameter("element");
				if (control && control.setValueState) {
					control.setValueState("None");
				}
			});
			
	        this.getView().byId("fileUploader").addStyleClass("fileUploaderStyle1");
        },
		
		handleTypeMissmatch: function(oEvent) {
			var fileType = oEvent.getSource().getFileType();
			
			jQuery.each(fileType, function(key, value) {
				fileType[key] = "*." +  value;
			});
			
			var supportedFileTypes = fileType.join(", ");
			MessageToast.show("The file type *." + oEvent.getParameter("fileType") + " is not supported. Choose one of the following types: " + supportedFileTypes);
		},
		
		displayErrorBox: function(message) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			
			sap.m.MessageBox.error(
				message,
				{
					styleClass: bCompact? "sapUiSizeCompact" : "",
					actions: sap.m.MessageBox.Action.CLOSE
				}
			);
		},

		handleValueChange: function(oEvent) {
			var oBusyIndicator = new sap.m.BusyDialog();
			oBusyIndicator.open();

			var oView = this.getView();
			var settings = oView.getModel("settings");
			var urls = settings.getProperty("/urls");

			var reader = new FileReader();
			reader.onloadend = function() {
				var model = oView.getModel().getData();
				model.image = reader.result;
				oView.getModel().refresh();
				oView.byId("fileUploader").addStyleClass("fileUploaderStyle2");
				oView.byId("uploadBox").setJustifyContent(null);
				oView.byId("flexBoxHint").setVisible(false);
				oView.byId("uploadBox").addStyleClass("workListBox2");
				oView.byId("vBoxImage").setVisible(true);
			};
			
			this.setupModel(oView);
			var table = oView.byId("table");
			table.destroyColumns();
			
			if(oEvent.getParameters().files[0] !== undefined) {
				reader.readAsDataURL(oEvent.getParameters().files[0]);
	
				var cells = new Array(urls.length);
				for (var i = 0; i < urls.length; i++) {
					table.addColumn(new sap.m.Column({
	
						header: new sap.m.FlexBox({
							alignItems: "Center",
							justifyContent: "Center",
							items: [
								new sap.m.VBox({
									items: [
										new sap.m.Label({
											textAlign: "Center",
											width: "100%",
											text: urls[i].name
										}),
										new sap.m.FlexBox({
											alignItems: "Center",
											justifyContent: "Center",
											items: [
												new sap.m.Button({
													textAlign: "Center",
													id: "json" + i,
													text: "View JSON",
													press: [this.viewJSON, this]
												})
											]
										})
									]
								})
							]
						})
	
					}));
					cells[i] = new sap.m.HBox({
					items: [
						new sap.m.VBox({
							width: "50%",
							items: [new sap.m.Label({
								text: "{label/" + i + "}",
								design: "Bold"
							})]
						}),

						new sap.m.VBox({
							width: "30%",
							items: [new RadialMicroChart({
								size: "L",
								percentage: "{score/" + i + "}"
							})]
						})
					]
				});
				
				this.generateRequest(i, urls[i], oView, oBusyIndicator);
				
				}
				table.bindItems("/results", new sap.m.ColumnListItem({
					cells: cells
				}));
				table.setVisible(true);
			
			} else {
				oBusyIndicator.close();
				table.setVisible(false);
				oView.byId("fileUploader").removeStyleClass("fileUploaderStyle2");
				oView.byId("uploadBox").setJustifyContent("Center");
				oView.byId("flexBoxHint").setVisible(true);
				oView.byId("flexBoxHint").addStyleClass("hintFlexBox");
				oView.byId("uploadBox").removeStyleClass("workListBox2");
				oView.byId("vBoxImage").setVisible(false);
			}
		},

		generateRequest: function(i, service, oView, oBusyIndicator) {
			var that = this;
			var data = new FormData();
			data.append("files", oView.byId("fileUploader").oFileUpload.files[0]);
			$.ajax({
				"async": true,
				"url": service.url,
				"method": "POST",
				// "headers": service.headers,
				"processData": false,
				"contentType": false,
				"mimeType": "multipart/form-data",
				"data": data
			}).done(function (response) {
				try {
					var response = $.parseJSON(response);
					var model = oView.getModel().getData();
					model["json" + i] = JSON.stringify(response, null, "\t");
					for (var j = 0; j < model.results.length; j++) {
						if (response.predictions[0].results[j].score > 0.01) {
							model.results[j].score[i] = Math.round(response.predictions[0].results[j].score * 1000) / 10;
						} else {
							model.results[j].score[i] = Math.round(response.predictions[0].results[j].score * 100000) / 1000;
						}

						var l = response.predictions[0].results[j].label;
						model.results[j].label[i] = ((l[0] + "").toUpperCase()) + l.substring(1, l.length);
					}
					oView.getModel().refresh();
					oBusyIndicator.close();
				} catch (err) {
					oBusyIndicator.close();
					that.displayErrorBox("Caught error: " + err.message);
				}
			}).fail(function (jqXHR, textStatus) {
				var response = $.parseJSON(jqXHR.responseText);
				oBusyIndicator.close();
				that.displayErrorBox("Caught error: " + jqXHR.statusText + "\n\n Info: " + response.error.message);
			});
		},

		draggableDialog: null,

		viewJSON : function(oEvent) {
			var id = oEvent.getSource().getId();
			this.draggableDialog = new Dialog({
				title: 'JSON Preview',
				ontentWidth: "90vw",
				draggable: true,
				resizable: true,
				content: new sap.ui.core.HTML({
					content: "<html><body><pre><code>{/" + id + "}</code></pre></body></html>"
				}),
				beginButton: new sap.m.Button({
					text: 'Close',
					press: function() {
						this.draggableDialog.close();
					}.bind(this)
				})
			});

			//to get access to the global model
			this.getView().addDependent(this.draggableDialog);

			this.draggableDialog.open();
		},

		setupModel: function(oView) {
			var m = {};
			m.results = [];
			for (var i = 0; i < 5; i++) {
				m.results[i] = {};
				m.results[i].score = [""];
				m.results[i].label = [""];
			}

			oView.setModel(new sap.ui.model.json.JSONModel(m));
		}
	});
});