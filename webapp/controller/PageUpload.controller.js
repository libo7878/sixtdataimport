sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.sixtDataImport.controller.PageUpload", {
		handleRouteMatched: function(oEvent) {
			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;
				var oPath;
				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}
			}

			this.aRadioButtonGroupIds = ["sap_m_Page_0-content-sap_m_RadioButtonGroup-1510665685280"];
			this.handleRadioButtonGroupsSelectedIndex();
		},
		
		handleRadioButtonGroupsSelectedIndex: function() {
			// Needed for RadioButtonGroups that have selectedIndex AND buttons bound
			var that = this;
			this.aRadioButtonGroupIds.forEach(function(sRadioButtonGroupId) {
				var oRadioButtonGroup = that.byId(sRadioButtonGroupId);
				var oButtonsBinding = oRadioButtonGroup ? oRadioButtonGroup.getBinding("buttons") : undefined;
				if (oButtonsBinding) {
					var oSelectedIndexBinding = oRadioButtonGroup.getBinding("selectedIndex");
					if (oSelectedIndexBinding) {
						oButtonsBinding.attachEventOnce("change", function() {
							oSelectedIndexBinding.refresh(true);
						});
					}
				}
			});
		},
		
		_setFileType: function(oEvent) {
			var fileType = oEvent.getSource().getId().split('--').pop();
			this.fileType = fileType;
		},

		_onStartAnalyze: function(oEvent) {
			this.method = "analyze";
			this._startUpload(oEvent);
		},
			
		_onStartImport: function(oEvent) {
			this.method = "import";
			this._startUpload(oEvent);
		},
			
		_startUpload: function(oEvent) {
			var fileUploader = this.getView().byId("fileUploader");
			fileUploader.setUploadUrl("/hana/com/sixtleasing/fleetintelligence/logic/importer.xsjs?method=" + this.method + "&type=" + this.fileType);
			fileUploader.upload();
		},

		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}
		},
		
		_handleUploadComplete: function(oEvent) {
			var sResponse = oEvent.getParameter("response").replace(/<(?:.|\n)*?>/gm, '');
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setJSON(sResponse);
			var data = oModel.getData();
			var feedback = oModel.getData().feedback;
			
			var newFeedback = [];
			for (var i = 0; i < feedback.length; i++) {
				var item = {};
				for (var j = 0; j < feedback[i].length; j++) {
					item['Property'+j] = feedback[i][j];
				}
				newFeedback.push(item);
			}
			
			oModel.getData().feedback = newFeedback;
			
			sap.ui.getCore().setModel(oModel, "globalModel");
			
			var oBindingContext = oEvent.getSource().getBindingContext();
			
			return new Promise(function(fnResolve) {
				this.doNavigate("PageResult", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

			
		},
		
		convertTextToIndexFormatter: function(sTextValue) {
			var oRadioButtonGroup = this.byId("sap_m_Page_0-content-sap_m_RadioButtonGroup-1510665685280");
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function(
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function(oButton) {
					return oButton.getText() === sTextValue;
				});
			}
		},
		
		_onRadioButtonGroupSelect: function() {
		},
		
		onInit: function() {
			this.mBindingOptions = {};
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("PageUpload").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			
			this.fileType = "fuel";
			this.method = "analyze";
		}

	});
}, /* bExport= */ true);