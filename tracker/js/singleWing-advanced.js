 // overrides for advanced version.
 // common code utilized by lite and 
 // advanced contained in singleWing.js
 
  var TxDOTVectorTileLayer;
  var senateDisplayLyr;
  var houseDisplayLyr;
  var mpoDisplayLyr;
  var aadtDisplayLyr;
  var cogDisplayLyr;
  var infoTemplate;

 
  function addMap() {
      require(
        [
        "esri/map",
        "esri/layers/ArcGISTiledMapServiceLayer",
        "esri/layers/FeatureLayer",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/layers/LabelClass",
        "esri/symbols/CartographicLineSymbol",
        "esri/renderers/SimpleRenderer",
        "esri/dijit/Search",
        "esri/tasks/StatisticDefinition",
        "dojo/_base/connect",
        "esri/symbols/TextSymbol",
        "esri/symbols/Font",
        "esri/layers/VectorTileLayer",
        "dojo/domReady!"
        ],

        function(Map,ArcGISTiledMapServiceLayer,FeatureLayer,Query,QueryTask,LabelClass,CartographicLineSymbol,SimpleRenderer,Search,StatisticDefinition,connect,TextSymbol,Font,VectorTileLayer) {
          map = new Map("viewDiv",{
            // center: [-99.5, 31.5],
            zoom: 6,
            showLabels : true,
            minZoom:6,
            maxZoom:16
          });

          search = new Search({
            map: map,
            enableInfoWindow: false,
            enableButtonMode: false,
            enableSourcesMenu: false,
            autoNavigate: false,
            enableHighlight: false,
            showInfoWindowOnSelect: false,
          }, "search");

          var sources = [];

          sources.push({
            featureLayer: new FeatureLayer("http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/PT_Search/FeatureServer/0"),
            searchFields: ["Search_Text"],
            displayField: "Search_Description",
            suggestionTemplate: "${Search_Text}-${Search_Description}",
            placeholder: "All Projects",
            exactMatch: false,
            outFields: ["*"],
            maxResults: 40,
            maxSuggestions: 40,
            enableSuggestions: true,
            minCharacters: 1
          });

          search.value = "All Projects";
          search.set("sources", sources);
          search.startup();

          search.on("clear-search", function(e) {
            search.value = "All Projects";
          });

          imagery = new ArcGISTiledMapServiceLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
          map.addLayer(imagery);
          imagery.hide();

          streets = new esri.layers.ArcGISTiledMapServiceLayer("https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer");
          map.addLayer(streets);
          streets.hide();

          grayCanvas = new esri.layers.ArcGISTiledMapServiceLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer");
          map.addLayer(grayCanvas);

          tiled = new ArcGISTiledMapServiceLayer("http://tiles.arcgis.com/tiles/KTcxiTD9dsQw4r7Z/arcgis/rest/services/SPM_Basemap_01302017/MapServer"); //new version
          // tiled = new VectorTileLayer("http://tiles.arcgis.com/tiles/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Vector_Tile_Test_04202017/VectorTileServer"); //TxDOT Vector Tile Basemap
          map.addLayer(tiled);

  	      var theOutFields = [
        	'CONTROL_SECT_JOB',
        	'DISTRICT_NAME',
        	'COUNTY_NAME',
        	'HIGHWAY_NUMBER',
        	'PROJ_LENGTH',
        	'PROJ_CLASS',
        	'EST_CONST_COST',
        	'TYPE_OF_WORK',
        	'LIMITS_FROM',
        	'LIMITS_TO',
        	'LAYMAN_DESCRIPTION1',
        	'PRJ_STATUS',
        	'PRJ_TIER',
        	'UTP_TOTAL_SCORE',
        	'UTP_STRATEGIC_SCORE',
        	'NBR_LET_YEAR',
        	'CONTROL_SECTION',
        	'UTP_STR_GOAL_TOP100',
        	'UTP_STR_GOAL_ENERGY_SECTOR',
        	'UTP_STR_GOAL_TRUNK_FREIGHT',
        	'TPP_CATEGORY_P2'
        	];

          infoTemplate = new esri.InfoTemplate("Project:","");
          // map.infoWindow.resize(400, 400);
          map.infoWindow.set("popupWindow", false);
          popup = map.infoWindow;

          addSearchLayers();

          //Adding the layer
          featureLayer = new FeatureLayer("http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0",
          {id:"Projects",visible: true, outFields: theOutFields, infoTemplate: infoTemplate});
          map.addLayer(featureLayer);

          addTrafficLayer();

          //Project Tracker Service
          queryTask = new QueryTask("http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0");
          query = new Query();
          query.returnGeometry = false;
          query.outFields = ["*"];

    		  map.on("load", function() {
      			findProjects();
      			scaleDependentQueries();
    		  });

    		  map.on("zoom-end", function() {
    		    scaleDependentQueries();
    		  });

    		  connect.connect(popup, "onSelectionChange", function() {
            displayPopupContent();
          });

    		  connect.connect(popup, "onSetFeatures", function() {
            updateNav();
          });
        }
      );
    }

	function scaleDependentQueries() {
	  aadtDisplayLyr.setDefinitionExpression("zLevel<" + (map.getZoom() + 1));
	}

  function updateNav() {
    if (popup.features) {
      totalFeaturesSelected = popup.features.length;
      document.getElementById("selectionCount").innerHTML = (selectIndex+1) + " of " + totalFeaturesSelected + " ";
      document.getElementById("selectionResultsControl").style.display = "block";
    }
    else {
      document.getElementById("selectionCount").innerHTML = "";
      document.getElementById("selectionResultsControl").style.display = "none";
    }
  }

  function displayPopupContent() {
    if (popup.features) {

    }
    else {
      closeInfo();
      return;
    }

    var featureAttributes = popup.features[selectIndex].attributes;
    var resultText = "";

    resultText += "<br><b>Project Summary</b> - Updated Jan. 1, 2017<br>Summary information is from the TxDOT Desgin and Construction Information System (DCIS)<br>";
    resultText += "<table class='resultsTable table'>";
    resultText += "<tr><th>Project ID</th><td>" + featureAttributes.CONTROL_SECT_JOB + "</td></tr>";
    resultText += "<tr><th>Highway Number</th><td>" + featureAttributes.HIGHWAY_NUMBER + "</td></tr>";
    resultText += "<tr><th>District Name</th><td>" + featureAttributes.DISTRICT_NAME + "</td></tr>";
    resultText += "<tr><th>County Name</th><td>" + featureAttributes.COUNTY_NAME + "</td></tr>";
    resultText += "<tr><th>Classification</th><td>" + featureAttributes.PROJ_CLASS + "</td></tr>";
    resultText += "<tr><th>Description</th><td>" + featureAttributes.LAYMAN_DESCRIPTION1 + "</td></tr>";
    resultText += "<tr><th>From Limit</th><td>" + featureAttributes.LIMITS_FROM + "</td></tr>";
    resultText += "<tr><th>To Limit</th><td>" + featureAttributes.LIMITS_TO + "</td></tr>";
    resultText += "<tr><th>Length</th><td>" + addCommas(Math.round(featureAttributes.PROJ_LENGTH*100)/100) + " miles</td></tr>";
    resultText += "<tr><th>Est. Construction Cost</th><td>$" + addCommas(Math.round(featureAttributes.EST_CONST_COST)) + "</td></tr>";
    resultText += "<tr><th>Project Status</th><td>" + featureAttributes.PRJ_STATUS + "</td></tr>";
    resultText += "</table>";

    resultText += "<br>"

    resultText += "<b>Contact Information</b> - Updated Jan. 1, 2017<br>Contact information is from the TxDOT SiteManager System<br>";
    resultText += "<table class='resultsTable table'>";
    resultText += "<tr><th>TxDOT Contact</th><td>Joe Smith</td></tr>";
    resultText += "<tr><th>TxDOT Phone</th><td>512-867-5309</td></tr>";
    resultText += "<tr><th>Vendor Contact</th><td>Company X</td></tr>";
    resultText += "<tr><th>Vendor Phone</th><td>512-867-5309</td></tr>";
    resultText += "</table>";

    resultText += "<br>";

    resultText += "<b>Project Milestones</b> - Updated Jan. 1, 2017<br>Project Milestones are from the TxDOT P6 System<br>";
    resultText += "<table class='resultsTable table'>";

    resultText += "<tr><th>Project ID</th><td colspan='2'>" + featureAttributes.CONTROL_SECT_JOB + "</td></tr>";
    resultText += "<tr><th>District Name</th><td colspan='2'>" + featureAttributes.DISTRICT_NAME + "</td></tr>";
    resultText += "<tr><th>Classification</th><td colspan='2'>" + featureAttributes.PROJ_CLASS + "</td></tr>";

    resultText += "<tr><td></td><td>Target Date</td><td>Actual Date</td></tr>";
    resultText += "<tr><th>Start Design</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "<tr><th>Design 30% Complete</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "<tr><th>Design 60% Complete</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "<tr><th>Design 100% Complete</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "<tr><th>Receive Environmental Clearance</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "<tr><th>Utility Coordination</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "<tr><th>Right of Way Coordination</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "<tr><th>Project Ready to Bid</th><td>01/01/2016</td><td>01/01/2016</td></tr>";
    resultText += "</table>";

    document.getElementById("selectionResults").innerHTML = resultText;
    document.getElementById("selectionResultsContainer").style.display = "block";

  }
  function unsetActiveMapLayerButton() {
    document.getElementById("aadtLayer").style.backgroundColor = "#CA7C29";
    document.getElementById("stateSenateLayer").style.backgroundColor = "#CA7C29";
    document.getElementById("stateSenateLayer").style.backgroundColor = "#CA7C29";
    document.getElementById("stateHouseLayer").style.backgroundColor = "#CA7C29";
    document.getElementById("mpoLayer").style.backgroundColor = "#CA7C29";
    document.getElementById("cogLayer").style.backgroundColor = "#CA7C29";
  }

  function addAADT() {
    scaleDependentQueries();
    hideDisplayLayers();
    aadtDisplayLyr.show();
    unsetActiveMapLayerButton();
    document.getElementById("aadtLayer").style.backgroundColor = "rgb(145, 90, 36)";
  }

  function addStateSenate() {
    hideDisplayLayers();
    senateDisplayLyr.show();
    unsetActiveMapLayerButton();
    document.getElementById("stateSenateLayer").style.backgroundColor = "rgb(145, 90, 36)";
  }

  function addStateHouse() {
    hideDisplayLayers();
    houseDisplayLyr.show();
    unsetActiveMapLayerButton();
    document.getElementById("stateHouseLayer").style.backgroundColor = "rgb(145, 90, 36)";
  }

  function addMPO() {
    hideDisplayLayers();
    mpoDisplayLyr.show();
    unsetActiveMapLayerButton();
    document.getElementById("mpoLayer").style.backgroundColor = "rgb(145, 90, 36)";
  }

  function addCOG() {
    hideDisplayLayers();
    cogDisplayLyr.show();
    unsetActiveMapLayerButton();
    document.getElementById("cogLayer").style.backgroundColor = "rgb(145, 90, 36)";
  }

  function hideDisplayLayers() {
    aadtDisplayLyr.hide();
    mpoDisplayLyr.hide();
    houseDisplayLyr.hide();
    senateDisplayLyr.hide();
    cogDisplayLyr.hide();
    unsetActiveMapLayerButton();
  }

	function findProjects() {
	  hideFeatureLayers();
    closeInfo();

	  if (urlQuery) {
  	  featureLayer.setDefinitionExpression(urlQuery);
  	  query.where = urlQuery;

      featureLayer.queryExtent(urlQuery, function(results) {
        map.setExtent(results.extent.expand(1.25));
      });

      queryTask.execute(query, getProjects);
      return;
	  }

	    var theDash = search.value.lastIndexOf("-");
	    var theInputLength = search.value.length;

	    theSearchArea = search.value.substring(theDash+1, theInputLength);
	    theSearchValue = search.value.substring(0,theDash);

  	  if (search.value=="All Projects") {
  	    theSearchArea="Select_Area";
  	  }

  	  var statusArray = [];
  	  var statusText = "";
  	  var groupingType = "";
  	  var projectGrouping = [];
  	  definitionExpression = "";

  	  if (document.getElementById("chkCS").checked) {
  	    statusArray.push("'Construction Scheduled'");
  	  }
  	  if (document.getElementById("chkFC").checked) {
  	    statusArray.push("'Finalizing for Construction'");
  	  }
  	  if (document.getElementById("chkUD").checked) {
  	    statusArray.push("'Under Development'");
  	  }
  	  if (document.getElementById("chkLTP").checked) {
  	    statusArray.push("'Long Term Planning'");
  	  }

  	  if (statusArray.length > 0) {
  	    statusText =  statusArray.toString();
  	  }
  	  else {
  	    alert("Please select at least 1 Project Phase to continue.");
  	    return;
  	  }

  	  if (theSearchArea=="Select_Area"||theSearchArea=="City"||theSearchArea=="MPO"||theSearchArea=="State Senate District"||theSearchArea=="State House District") {
  	    definitionExpression = "PRJ_STATUS IN (" + statusText + ")";
  	  }
  	  if (theSearchArea=="County") {
  	    definitionExpression = "COUNTY_NAME = '" + theSearchValue + "' AND PRJ_STATUS IN (" + statusText + ")";
  	  }
  	  if (theSearchArea=="TxDOT District") {
  	    definitionExpression = "DISTRICT_NAME = '" + theSearchValue + "' AND PRJ_STATUS IN (" + statusText + ")";
  	  }
  	  if (theSearchArea=="Highway") {
  	    definitionExpression = "HIGHWAY_NUMBER = '" + theSearchValue + "' AND PRJ_STATUS IN (" + statusText + ")";
  	  }
  	  if (theSearchArea=="Project ID") {
  	    definitionExpression = "CONTROL_SECT_JOB = '" + theSearchValue + "' AND PRJ_STATUS IN (" + statusText + ")";
  	  }
  	  if (theSearchArea=="Control Section") {
  	    definitionExpression = "CONTROL_SECTION = '" + theSearchValue + "' AND PRJ_STATUS IN (" + statusText + ")";
  	  }

  	  if (document.getElementById("chkBridge").checked) {
  	    projectGrouping.push("'BR'");
  	    projectGrouping.push("'BWN'");
  	  }
  	  if (document.getElementById("chkCapacity").checked) {
	      projectGrouping.push("'WF'");
	      projectGrouping.push("'WNF'");
	      projectGrouping.push("'NLF'");
	      projectGrouping.push("'NNF'");
	      projectGrouping.push("'UPG'");
	      projectGrouping.push("'SP2'");
  	  }
  	  if (document.getElementById("chkMaintenance").checked) {
	      projectGrouping.push("'OV'");
	      projectGrouping.push("'RER'");
	      projectGrouping.push("'RES'");
	      projectGrouping.push("'SC'");
	      projectGrouping.push("'SFT'");
  	  }
  	  if (document.getElementById("chkSafety").checked) {
	      projectGrouping.push("'HES'");
	      projectGrouping.push("'TS'");
	      projectGrouping.push("'INC'");
  	  }
  	  if (document.getElementById("chkMiscellaneous").checked) {
	      projectGrouping.push("'MSC'");
	      projectGrouping.push("'PE'");
  	  }

  	  //Adding project groupings to definition query
  	  if (projectGrouping.length>0) {
        definitionExpression += " AND PROJ_CLASS IN (" + projectGrouping.toString() + ")";
  	  }

  	  //Adding Systems to definition query
  	  if (document.getElementById("chkTop100").checked) {
        definitionExpression += " AND UTP_STR_GOAL_TOP100 > 0";
  	  }
  	  if (document.getElementById("chkEnergySector").checked) {
        definitionExpression += " AND UTP_STR_GOAL_ENERGY_SECTOR > 0";
  	  }
  	  if (document.getElementById("chkFreight").checked) {
        definitionExpression += " AND UTP_STR_GOAL_TRUNK_FREIGHT > 0";
  	  }
  	  if (document.getElementById("chkUTP").checked) {
        definitionExpression += " AND PRJ_TIER IN ('1','2','3')";
  	  }

  	  if (document.getElementById("inputYearToValue").value < document.getElementById("inputYearFromValue").value) {
  	    alert("Please check the Year Filter (the To year must be greater than or equal to the From year).");
  	    return;
  	  }

  	  if (document.getElementById("inputYearFromValue").value) {
  	    definitionExpression += " AND NBR_LET_YEAR >= '" + document.getElementById("inputYearFromValue").value + "'";
  	  }

  	  if (document.getElementById("inputYearToValue").value) {
  	    definitionExpression += " AND NBR_LET_YEAR <= '" + document.getElementById("inputYearToValue").value + "'";
  	  }

  	  //Spatial searches for highlighting polygons and searches for City, MPO, Legislative boundaries
  	  if (theSearchArea=="TxDOT District") {
  	    districtSearchLyr.show();
  	    districtSearchLyr.setDefinitionExpression("DIST_NM='" + theSearchValue + "'" );
  	  }
  	  if (theSearchArea=="County") {
  	    countySearchLyr.show();
  	    countySearchLyr.setDefinitionExpression("CNTY_NM='" + theSearchValue + "'" );
  	  }
  	  if (theSearchArea=="City") {
  	    citySearchLyr.show();
  	    citySearchLyr.setDefinitionExpression("CITY_NM='" + theSearchValue + "'" );
  	    zoomToCity(theSearchValue);
  	    return;
  	  }
  	  if (theSearchArea=="MPO") {
  	    mpoSearchLyr.show();
  	    mpoSearchLyr.setDefinitionExpression("MPO_NM='" + theSearchValue + "'" );
  	    zoomToMPO(theSearchValue);
  	    return;
  	  }
  	  if (theSearchArea=="State House District") {
  	    houseSearchLyr.show();
  	    houseSearchLyr.setDefinitionExpression("DIST_NBR=" + theSearchValue);
  	    zoomToHouseDistrict(theSearchValue);
  	    return;
  	  }
  	  if (theSearchArea=="State Senate District") {
  	    senateSearchLyr.show();
  	    senateSearchLyr.setDefinitionExpression("DIST_NBR=" + theSearchValue);
  	    zoomToSenateDistrict(theSearchValue);
  	    return;
  	  }

  	  featureLayer.setDefinitionExpression(definitionExpression);
    	query.where = definitionExpression;

      featureLayer.queryExtent(definitionExpression, function(results) {
        map.setExtent(results.extent.expand(1.25));
      });

      queryTask.execute(query, getProjects);
	}


  function getSystemStats() {
	    var prjCount = 0;
	    var prjLength = 0;
	    var prjCost = 0;
  	  var statusTable;
  	  var summaryByType = document.getElementById("selSummarizeBy").value;

  	  //District -----
  	  if (summaryByType=="district") {
        statusTable = "<table class='summaryTable table'> \
    	  <tr> \
      	  <th>District</th> \
      	  <th>Projects</th> \
      	  <th>Miles</th> \
      	  <th>Est. Cost</th> \
    	  </tr>";

    	  for (var i=0;i<summaryTableArray.length;i++) {
    	    if (i>3&&i<29) {
    	      statusTable += "<tr> \
         	  <td class='summaryTableLeft'>" + summaryTableArray[i][0] + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(summaryTableArray[i][1]) + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(Math.round(summaryTableArray[i][3])) + "</td> \
         	  <td class='summaryTableRight'>$" + addCommas(Math.round(summaryTableArray[i][2])) + "</td> \
      	    </tr>";

      	    prjCount += summaryTableArray[i][1];
      	    prjLength += summaryTableArray[i][3];
      	    prjCost += summaryTableArray[i][2];
    	    }
    	  }
	    }

	    //Status -----
	    if (summaryByType=="status") {
	      var statusLabel="";

        statusTable = "<table class='summaryTable table'> \
    	  <tr> \
      	  <th>Phase</th> \
      	  <th>Projects</th> \
      	  <th>Miles</th> \
      	  <th>Est. Cost</th> \
    	  </tr>";

    	  for (var i=0;i<summaryTableArray.length;i++) {
    	    if (i<4) {
    	      if (i==0) {
    	        statusLabel="Under construction or begins soon";
    	      }
    	      if (i==1) {
    	        statusLabel="Construction within 4 years";
    	      }
    	      if (i==2) {
    	        statusLabel="Construction in 4 to 10 years";
    	      }
    	      if (i==3) {
    	        statusLabel="Corridor Studies, 10+ years out";
    	      }

    	      statusTable += "<tr> \
         	  <td class='summaryTableLeft'>" + statusLabel + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(summaryTableArray[i][1]) + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(Math.round(summaryTableArray[i][3])) + "</td> \
         	  <td class='summaryTableRight'>$" + addCommas(Math.round(summaryTableArray[i][2])) + "</td> \
      	    </tr>";

      	    prjCount += summaryTableArray[i][1];
      	    prjLength += summaryTableArray[i][3];
      	    prjCost += summaryTableArray[i][2];
    	    }
    	  }
	    }

	    //Year -----
	    if (summaryByType=="year") {
        statusTable = "<table class='summaryTable table'> \
    	  <tr> \
      	  <th>Year</th> \
      	  <th>Projects</th> \
      	  <th>Miles</th> \
      	  <th>Est. Cost</th> \
    	  </tr>";

    	  for (var i=0;i<summaryTableArray.length;i++) {
    	    if (i>28&&i<44) {
    	      statusTable += "<tr> \
         	  <td class='summaryTableLeft'>" + summaryTableArray[i][0] + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(summaryTableArray[i][1]) + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(Math.round(summaryTableArray[i][3])) + "</td> \
         	  <td class='summaryTableRight'>$" + addCommas(Math.round(summaryTableArray[i][2])) + "</td> \
      	    </tr>";

      	    prjCount += summaryTableArray[i][1];
      	    prjLength += summaryTableArray[i][3];
      	    prjCost += summaryTableArray[i][2];
    	    }
    	  }
	    }

	    //Category -----
	    if (summaryByType=="category") {
        statusTable = "<table class='summaryTable table'> \
    	  <tr> \
      	  <th>Category</th> \
      	  <th>Projects</th> \
      	  <th>Miles</th> \
      	  <th>Est. Cost</th> \
    	  </tr>";

    	  for (var i=0;i<summaryTableArray.length;i++) {
    	    if (i>43) {
    	      statusTable += "<tr> \
         	  <td class='summaryTableLeft'>" + summaryTableArray[i][0] + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(summaryTableArray[i][1]) + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(Math.round(summaryTableArray[i][3])) + "</td> \
         	  <td class='summaryTableRight'>$" + addCommas(Math.round(summaryTableArray[i][2])) + "</td> \
      	    </tr>";

      	    prjCount += summaryTableArray[i][1];
      	    prjLength += summaryTableArray[i][3];
      	    prjCost += summaryTableArray[i][2];
    	    }
    	  }
	    }

	  //Totals -----
	  statusTable += "<tr> \
      <td class='summaryTableLeft'>Totals</td> \
      <td class='summaryTableRight'>" + addCommas(prjCount) + "</td> \
    	<td class='summaryTableRight'>" + addCommas(Math.round(prjLength)) + "</td> \
    	<td class='summaryTableRight'>$" + addCommas(Math.round(prjCost)) + "</td> \
    	</tr> \
    </table>";

	  document.getElementById("projectStatusNotice").innerHTML = statusTable;
	}

	function resetPage() {
	  addTxDOT();
	  closeInfo();
	  search.clear();
	  urlQuery = "";
	  search.value = "All Projects";
	  document.getElementById("inputYearFromValue").value = 2015;
	  document.getElementById("inputYearToValue").value = 2040;
	  document.getElementById("chkBridge").checked = false;
	  document.getElementById("chkCapacity").checked = false;
	  document.getElementById("chkEnergySector").checked = false;
	  document.getElementById("chkFreight").checked = false;
	  document.getElementById("chkMaintenance").checked = false;
	  document.getElementById("chkMiscellaneous").checked = false;
	  document.getElementById("chkSafety").checked = false;
	  document.getElementById("chkTop100").checked = false;
	  document.getElementById("chkUTP").checked = false;
	  document.getElementById("chkCS").checked = true;
	  document.getElementById("chkFC").checked = true;
	  document.getElementById("chkUD").checked = true;
	  document.getElementById("chkLTP").checked = true;
    // aadtDisplayLyr.hide();
    // mpoDisplayLyr.hide();
    // houseDisplayLyr.hide();
    // senateDisplayLyr.hide();
    // cogDisplayLyr.hide();
	  document.getElementById("selectionCount").innerHTML = "";
	 // map.centerAndZoom([-99.5, 31.5],6);
	  hideFeatureLayers();
	  hideDisplayLayers();
	  findProjects();
	}

	function addTrafficLayer() {
		projectsUrl = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0";
		aadtDisplayLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"AADT",visible: false,outFields:["F2015_TRAF"]});

    //Labeling for AADT
    var labelSymbolAADT = new esri.symbol.TextSymbol();
    labelSymbolAADT.font.setSize("8pt");
    labelSymbolAADT.font.setWeight(esri.symbol.Font.WEIGHT_BOLD);
    labelSymbolAADT.font.setFamily("arial");
    labelSymbolAADT.setHaloSize(2);
    labelSymbolAADT.setColor(new esri.Color([255, 0, 0]));
    labelSymbolAADT.setHaloColor(new esri.Color([255, 255, 255]));

    var jsonTraffic = {
      "labelExpressionInfo": {"value": "{F2015_TRAF}"},
      "labelPlacement":"always-horizontal"
    };

    var labelClass = new esri.layers.LabelClass(jsonTraffic);
    labelClass.symbol = labelSymbolAADT;
    aadtDisplayLyr.setLabelingInfo([ labelClass ]);

    map.addLayer(aadtDisplayLyr);
	}

	function addSearchLayers() {
    //Line style for County, District, MPO, Legislative Boundaries
  	var theSymbol = new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, new esri.Color("#D2B48C"), 6, esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER, 4);
  	var theRenderer = new esri.renderer.SimpleRenderer(theSymbol);

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_City_Boundaries/FeatureServer/0";
		citySearchLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"City_Search",visible: false,outFields:["CITY_NM"]});
		citySearchLyr.setRenderer(theRenderer);

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_Metropolitan_Planning_Organizations/FeatureServer/0";
		mpoSearchLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"MPO_Search",visible: false,outFields:["MPO_NM"]});
		mpoSearchLyr.setRenderer(theRenderer);

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_County_Boundaries/FeatureServer/0";
		countySearchLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"County_Search",visible: false,outFields:["CNTY_NM","CNTY_NBR"]});
		countySearchLyr.setRenderer(theRenderer);

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Districts/FeatureServer/0";
		districtSearchLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"District_Search",visible: false,outFields:["DIST_NM","DIST_NBR"]});
		districtSearchLyr.setRenderer(theRenderer);

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_State_Senate_Districts/FeatureServer/0";
		senateSearchLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"Senate_Districts",visible: false,outFields:["DIST_NBR"]});
		senateSearchLyr.setRenderer(theRenderer);

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_State_House_Districts/FeatureServer/0";
		houseSearchLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"House_Districts",visible: false,outFields:["DIST_NBR"]});
		houseSearchLyr.setRenderer(theRenderer);

		map.addLayer(citySearchLyr);
		map.addLayer(mpoSearchLyr);
		map.addLayer(countySearchLyr);
		map.addLayer(districtSearchLyr);
		map.addLayer(senateSearchLyr);
		map.addLayer(houseSearchLyr);

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_State_Senate_Districts/FeatureServer/0";
		senateDisplayLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"Senate",visible: false,outFields:["DIST_NBR"]});

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_State_House_Districts/FeatureServer/0";
		houseDisplayLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"House",visible: false,outFields:["DIST_NBR"]});

		projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_Metropolitan_Planning_Organizations/FeatureServer/0";
		mpoDisplayLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"MPO",visible: false,outFields:["MPO_NM"]});

		projectsUrl = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_Councils_of_Governments/FeatureServer/0";
		cogDisplayLyr = new esri.layers.FeatureLayer(projectsUrl, {id:"COG",visible: false,outFields:["COG_NM"]});

    //Generic labeling for all layers
    var labelSymbol = new esri.symbol.TextSymbol();
    labelSymbol.font.setSize("12pt");
    labelSymbol.font.setFamily("arial");
    labelSymbol.setHaloSize(2);
    labelSymbol.setColor(new esri.Color([0, 0, 0]));
    labelSymbol.setHaloColor(new esri.Color([255, 255, 255]));

    //JSON Options by Layer
    var jsonMPO = {
      "labelExpressionInfo": {"value": "{MPO_NM}"},
      "labelPlacement":"always-horizontal"
    };

    var jsonCOG = {
      "labelExpressionInfo": {"value": "{COG_NM}"},
      "labelPlacement":"always-horizontal"
    };

    var jsonSenate = {
      "labelExpressionInfo": {"value": "{DIST_NBR}"},
      "labelPlacement":"always-horizontal"
    };

    var jsonHouse = {
      "labelExpressionInfo": {"value": "{DIST_NBR}"},
      "labelPlacement":"always-horizontal"
    };

    //LabelClasses for polygons
    var labelClass = new esri.layers.LabelClass(jsonMPO);
    labelClass.symbol = labelSymbol;
    mpoDisplayLyr.setLabelingInfo([ labelClass ]);

    var labelClass = new esri.layers.LabelClass(jsonCOG);
    labelClass.symbol = labelSymbol;
    cogDisplayLyr.setLabelingInfo([ labelClass ]);

    var labelClass = new esri.layers.LabelClass(jsonSenate);
    labelClass.symbol = labelSymbol;
    senateDisplayLyr.setLabelingInfo([ labelClass ]);

    var labelClass = new esri.layers.LabelClass(jsonHouse);
    labelClass.symbol = labelSymbol;
    houseDisplayLyr.setLabelingInfo([ labelClass ]);

		map.addLayer(senateDisplayLyr);
		map.addLayer(houseDisplayLyr);
		map.addLayer(mpoDisplayLyr);
		map.addLayer(cogDisplayLyr);

	 // map.reorderLayer(aadtDisplayLyr,10);
	}
