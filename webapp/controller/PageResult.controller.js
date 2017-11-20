sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel"
], function(BaseController, MessageBox, Utilities, History, JSONModel) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.sixtDataImport.controller.PageResult", {
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

		},
		onInit: function() {

			this.mBindingOptions = {};
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("PageResult").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			
			// set explored app's demo model on this sample
			//var oModel = new JSONModel("/webapp/resources/tankstellenImport.json");
			var oModel = sap.ui.getCore().getModel("globalModel");
			var oTable = this.getView().byId("ResultTable");
			oTable.setModel(oModel);

		}
	});
}, /* bExport= */ true);