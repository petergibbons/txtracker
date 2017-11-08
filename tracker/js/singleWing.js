  var map;
  var query;
  var queryTask;
  var featureLayer;
  var theSearchArea = "";
  var theSearchValue = "";
  var tiled;
  var imagery;
  var streets;
  var grayCanvas;
  var search;
  var urlQuery;
  var summaryTableArray;
  var citySearchLyr;
  var countySearchLyr;
  var districtSearchLyr;
  var senateSearchLyr;
  var houseSearchLyr;
  var mpoSearchLyr;
  var projectsUrl;
  var spatialQueryIDs;
  var definitionExpression = "";
  var popup;
  var selectIndex = 0;
  var totalFeaturesSelected = 0;


  $(document).ready(function() {
    $('.close-info, .btn-close').on('click',function() {
        $('#selectionResultsContainer').fadeOut();
    });
    $('#search_input').addClass('form-control');
  });



  function init() {
    adjustApp();
    resolveURL();
    addMap();
    addDatePicker();
  }

  function adjustApp() {

    var w = window.innerWidth;
    var h = window.innerHeight;
    var contentsWidth = Math.round(w*.25);
    var contentsHeight = Math.round(h*.35);

    document.getElementById("viewDiv").style.height = (h-0) + "px";
    document.getElementById("main").style.height = (h-0) + "px";

    document.getElementById("filterOptions").style.height = (h-0) + "px";

    document.getElementById("selectionResultsContainer").style.right = "0px";
    document.getElementById("selectionResultsContainer").style.top = "0px";
    document.getElementById("selectionResultsContainer").style.width = "400px";
    document.getElementById("selectionResultsContainer").style.height = (h-0) + "px";

    var filterOptionsWidth = getComputedStyle(document.getElementById("filterOptions")).width;

    //document.getElementById("mapOptions").style.width = (contentsWidth-10) + "px";
    //document.getElementById("mapOptions").style.left = filterOptionsWidth;
    
    if( w <= 1000 ){
      document.getElementById("mapOptions").style.top = (h-240) + "px";
    }else {
      document.getElementById("mapOptions").style.top = (h-150) + "px";
    }
    document.getElementById("mapOptions").style.width = "400px";

  }

  function addDatePicker() {
    // https://bootstrap-datepicker.readthedocs.io/en/latest/index.html

    // add datepicker 
    $('.search-from-year').datepicker({
      format: "yyyy",
      autoclose: true,
      minViewMode: "years",
      startDate: "-2y",
      endDate: "+43y"
    }).on('changeDate', function(selected){
      startDate = $(".search-from-year").val();
      $('.search-to-year').datepicker('setStartDate', startDate);
    });

    $('.search-to-year').datepicker({
      format: "yyyy",
      autoclose: true,
      minViewMode: "years",
      startDate: "-2y",
      endDate: "+43y"
    });
  }

  function addMap() {
      require(
        [
        "esri/map",
        "esri/layers/ArcGISTiledMapServiceLayer",
        "esri/layers/FeatureLayer",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/layers/LabelLayer",
        "esri/symbols/Font",
        "esri/symbols/CartographicLineSymbol",
        "esri/renderers/SimpleRenderer",
        "esri/dijit/Search",
        "esri/tasks/StatisticDefinition",
        "dojo/_base/connect",
        "dojo/domReady!"
        ],

        function(Map,ArcGISTiledMapServiceLayer,FeatureLayer,Query,QueryTask,LabelLayer,Font,CartographicLineSymbol,SimpleRenderer,Search,StatisticDefinition,connect) {
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

          var infoTemplate = new esri.InfoTemplate("Project:","");
          // map.infoWindow.resize(400, 400);
          map.infoWindow.set("popupWindow", false);
          popup = map.infoWindow;

          addSearchLayers();

          //Adding the layer
          featureLayer = new FeatureLayer("http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0",
          {id:"Projects",visible: true, outFields: theOutFields, infoTemplate: infoTemplate});
          map.addLayer(featureLayer);

          //Project Tracker Service
          queryTask = new QueryTask("http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0");
          query = new Query();
          query.returnGeometry = false;
          query.outFields = ["*"];

    		  map.on("load", function() {
      			findProjects();
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
    //resultText +="<hr />"
    //resultText += "<br><b>Project Summary</b> - Updated Jan. 1, 2017<br>Summary information is from the TxDOT Desgin and Construction Information System (DCIS)<br>";
    resultText += "<table class='resultsTable table'>";
      resultText += "<tr><th>Project Name</th><td>" + featureAttributes.HIGHWAY_NUMBER + "</td></tr>";
      resultText += "<tr><th>County Name</th><td>" + featureAttributes.COUNTY_NAME + "</td></tr>";
      resultText += "<tr><th>Description</th><td>" + featureAttributes.LAYMAN_DESCRIPTION1 + "</td></tr>";
      resultText += "<tr><th>From Limit</th><td>" + featureAttributes.LIMITS_FROM + "</td></tr>";
      resultText += "<tr><th>To Limit</th><td>" + featureAttributes.LIMITS_TO + "</td></tr>";
      resultText += "<tr><th>Est. Construction Cost</th><td>$" + addCommas(Math.round(featureAttributes.EST_CONST_COST)) + "</td></tr>";
      resultText += "<tr><th>Project Status</th><td>" + featureAttributes.PRJ_STATUS + "</td></tr>";

      resultText += "<tr><th>Length</th><td>" + addCommas(Math.round(featureAttributes.PROJ_LENGTH*100)/100) + " miles</td></tr>";
    resultText += "</table>";

    resultText += "<br>"
    resultText +="<hr />"

    resultText += "<b>Contact Information</b> - Updated Jan. 1, 2017<br>Contact information is from the TxDOT SiteManager System<br>";
    resultText += "<table class='resultsTable table'>";
      resultText += "<tr><th>TxDOT Contact</th><td>Joe Smith</td></tr>";
      resultText += "<tr><th>TxDOT Phone</th><td>512-867-5309</td></tr>";
      resultText += "<tr><th>Vendor Contact</th><td>Company X</td></tr>";
      resultText += "<tr><th>Vendor Phone</th><td>512-867-5309</td></tr>";
    resultText += "</table>";


    document.getElementById("selectionResults").innerHTML = resultText;
    document.getElementById("selectionResultsContainer").style.display = "block";
  }

  function nextSelected() {
    selectIndex+=1;

    if (selectIndex > (popup.features.length-1)) {
      selectIndex = (popup.features.length-1);
    }

    popup.selectNext();
    updateNav();
  }

  function previousSelected() {
    selectIndex-=1;

    if (selectIndex < 0) {
      selectIndex = 0;
    }

    popup.selectPrevious();
    updateNav();
  }

  function closeInfo() {
	  document.getElementById("selectionResults").innerHTML = "<button type='button' class='close close-info' aria-label='Close'><span aria-hidden='true'>&times;</span></button><br>Click a project on the map for more information.<br>";
	  selectIndex = 0;
	  popup.clearFeatures();
    updateNav();
  }

  function addImagery() {
      tiled.hide();
      streets.hide();
      grayCanvas.hide();
      imagery.show();
      document.getElementById("txdotMap").style.backgroundColor="#CA7C29";
      document.getElementById("streets").style.backgroundColor="#CA7C29";
      document.getElementById("imagery").style.backgroundColor="#915A24";
  }

  function addTxDOT() {
      imagery.hide();
      streets.hide();
      grayCanvas.show();
      tiled.show();
      document.getElementById("txdotMap").style.backgroundColor="#915A24";
      document.getElementById("streets").style.backgroundColor="#CA7C29";
      document.getElementById("imagery").style.backgroundColor="#CA7C29";
  }

  function addStreets() {
    imagery.hide();
    tiled.hide();
    grayCanvas.hide();
    streets.show();
    document.getElementById("txdotMap").style.backgroundColor="#CA7C29";
    document.getElementById("streets").style.backgroundColor="#915A24";
    document.getElementById("imagery").style.backgroundColor="#CA7C29";
  }

  function openGoogleMaps() {
    var ctr = map.extent.getCenter();
    var lat = ctr.getLatitude();
    var lon = ctr.getLongitude();
    var level = map.getLevel();
    window.open("https://www.google.com/maps/@"+lat+","+lon+","+level+"z");
  }

  function resolveURL() {
    var docURL = document.URL;
    var theURLlen = docURL.length;
    var typeBegin = docURL.indexOf("?");
    var typeEnd = docURL.indexOf("=");
    if (typeBegin<1) {
      urlQuery = "";
      return;
    }
    else {
      var queryArea = docURL.substring(typeBegin+1,typeEnd);
      var areaName = docURL.substring(typeEnd+1,theURLlen).split(",");

      for (var i = 0; i < areaName.length; i++) {
        areaName[i] = areaName[i].replace("_", " ");
      }

      for (var i = 0; i < areaName.length; i++) {
        areaName[i] = "'" + areaName[i] + "'";
      }

      if (queryArea=="DISTRICT_NAME"||queryArea=="COUNTY_NAME"||queryArea=="HIGHWAY_NUMBER"||queryArea=="CONTROL_SECT_JOB"||queryArea=="CONTROL_SECTION") {
        urlQuery = queryArea + " IN (" + areaName.toString() + ")";
      }
      else {
        urlQuery = "";
      }
    }
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
  	  var statusText = "'Construction Scheduled','Finalizing for Construction','Under Development','Long Term Planning'";
  	  var groupingType = "";
  	  var projectGrouping = [];
  	  definitionExpression = "";

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

	function executeDefinitionPolygon() {
  	  featureLayer.setDefinitionExpression(definitionExpression);
    	query.where = definitionExpression;
    	featureLayer.show();
      queryTask.execute(query, getProjects);
	}

	function zoomToSenateDistrict(distNBR) {
	  senateSearchLyr.setAutoGeneralize(false);
		senateSearchLyr.redraw();
		var theSenateQuery = new esri.tasks.Query();
		theSenateQuery.where = "DIST_NBR=" + distNBR;
		senateSearchLyr.selectFeatures(theSenateQuery,esri.layers.FeatureLayer.SELECTION_NEW,function(feature){
			if (feature[0].geometry) {
				var theExtent = feature[0].geometry.getExtent();
				map.setExtent(theExtent);
				spatialQueryAttributes(feature[0].geometry);
			}
		});

		senateSearchLyr.redraw();
		senateSearchLyr.setAutoGeneralize(true);
	}

	function zoomToHouseDistrict(distNBR) {
	  houseSearchLyr.setAutoGeneralize(false);
		houseSearchLyr.redraw();
		var theHouseQuery = new esri.tasks.Query();
		theHouseQuery.where = "DIST_NBR=" + distNBR;
		houseSearchLyr.selectFeatures(theHouseQuery,esri.layers.FeatureLayer.SELECTION_NEW,function(feature){
			if (feature[0].geometry) {
				var theExtent = feature[0].geometry.getExtent();
				map.setExtent(theExtent);
				spatialQueryAttributes(feature[0].geometry);
			}
		});

		houseSearchLyr.redraw();
		houseSearchLyr.setAutoGeneralize(true);
	}

	function zoomToMPO(mpoNM) {
	  mpoSearchLyr.setAutoGeneralize(false);
		mpoSearchLyr.redraw();
		var theMPOQuery = new esri.tasks.Query();
		theMPOQuery.where = "MPO_NM='" + mpoNM + "'";
		mpoSearchLyr.selectFeatures(theMPOQuery,esri.layers.FeatureLayer.SELECTION_NEW,function(feature){
			if (feature[0].geometry) {
				var theExtent = feature[0].geometry.getExtent();
				map.setExtent(theExtent);
				spatialQueryAttributes(feature[0].geometry);
			}
		});

		mpoSearchLyr.redraw();
		mpoSearchLyr.setAutoGeneralize(true);
	}

	function zoomToCity(cityNM) {
	  citySearchLyr.setAutoGeneralize(false);
		citySearchLyr.redraw();
		var theCityQuery = new esri.tasks.Query();
		theCityQuery.where = "CITY_NM='" + cityNM + "'";
		citySearchLyr.selectFeatures(theCityQuery,esri.layers.FeatureLayer.SELECTION_NEW,function(feature){
			if (feature[0].geometry) {
				var theExtent = feature[0].geometry.getExtent();
				map.setExtent(theExtent);
				spatialQueryAttributes(feature[0].geometry);
			}
		});

		citySearchLyr.redraw();
		citySearchLyr.setAutoGeneralize(true);
	}

	function spatialQueryAttributes(theGeom) {
  	featureLayer.setDefinitionExpression("OBJECTID>0");
  	featureLayer.hide();


		var query2 = new esri.tasks.Query();
		query2.geometry = theGeom;
		query2.returnGeometry = false;
		query2.outFields = ["*"];
		featureLayer.queryIds(query2, function (objectIds) {
			if (objectIds.length>0) {
			  spatialQueryIDs = objectIds.toString();
        definitionExpression += " AND OBJECTID IN (" + spatialQueryIDs + ")";
        executeDefinitionPolygon();
			}
		});
	}

	function getProjects(results) {
	    summaryTableArray = [
	      ["Construction Scheduled",0,0,0],
	      ["Finalizing for Construction",0,0,0],
	      ["Under Development",0,0,0],
	      ["Long Term Planning",0,0,0],
	      ["Abilene",0,0,0],
        ["Amarillo",0,0,0],
        ["Atlanta",0,0,0],
        ["Austin",0,0,0],
        ["Beaumont",0,0,0],
        ["Brownwood",0,0,0],
        ["Bryan",0,0,0],
        ["Childress",0,0,0],
        ["Corpus Christi",0,0,0],
        ["Dallas",0,0,0],
        ["El Paso",0,0,0],
        ["Fort Worth",0,0,0],
        ["Houston",0,0,0],
        ["Laredo",0,0,0],
        ["Lubbock",0,0,0],
        ["Lufkin",0,0,0],
        ["Odessa",0,0,0],
        ["Paris",0,0,0],
        ["Pharr",0,0,0],
        ["San Angelo",0,0,0],
        ["San Antonio",0,0,0],
        ["Tyler",0,0,0],
        ["Waco",0,0,0],
        ["Wichita Falls",0,0,0],
        ["Yoakum",0,0,0],
        ["2014",0,0,0],
        ["2015",0,0,0],
        ["2016",0,0,0],
        ["2017",0,0,0],
        ["2018",0,0,0],
        ["2019",0,0,0],
        ["2020",0,0,0],
        ["2021",0,0,0],
        ["2022",0,0,0],
        ["2023",0,0,0],
        ["2024",0,0,0],
        ["2025",0,0,0],
        ["2026",0,0,0],
        ["2027",0,0,0],
        ["2028",0,0,0],
        ["1",0,0,0],
        ["2M",0,0,0],
        ["2U",0,0,0],
        ["3",0,0,0],
        ["4",0,0,0],
        ["5",0,0,0],
        ["6",0,0,0],
        ["7",0,0,0],
        ["8",0,0,0],
        ["9",0,0,0],
        ["10",0,0,0],
        ["11",0,0,0],
        ["12",0,0,0],
        ["DA",0,0,0],
        ["PA",0,0,0]
	    ];

      var resultItems = [];
      var resultCount = results.features.length;

      for (var i = 0; i < resultCount; i++) {
        var featureAttributes = results.features[i].attributes;

        //Populating by Status, District, and Year
        for (var y=0; y < summaryTableArray.length; y++) {
          if (featureAttributes.PRJ_STATUS==summaryTableArray[y][0]) {
            summaryTableArray[y][1] += 1;
            summaryTableArray[y][2] += featureAttributes.EST_CONST_COST;
            summaryTableArray[y][3] += featureAttributes.PROJ_LENGTH;
          }
          if (featureAttributes.DISTRICT_NAME==summaryTableArray[y][0]) {
            summaryTableArray[y][1] += 1;
            summaryTableArray[y][2] += featureAttributes.EST_CONST_COST;
            summaryTableArray[y][3] += featureAttributes.PROJ_LENGTH;
          }
          if (featureAttributes.NBR_LET_YEAR==summaryTableArray[y][0]) {
            summaryTableArray[y][1] += 1;
            summaryTableArray[y][2] += featureAttributes.EST_CONST_COST;
            summaryTableArray[y][3] += featureAttributes.PROJ_LENGTH;
          }
          if (featureAttributes.TPP_CATEGORY_P2==summaryTableArray[y][0]) {
            summaryTableArray[y][1] += 1;
            summaryTableArray[y][2] += featureAttributes.EST_CONST_COST;
            summaryTableArray[y][3] += featureAttributes.PROJ_LENGTH;
          }
        }
      }
      getSystemStats();
	}

  function getSystemStats() {
	    var prjCount = 0;
	    var prjLength = 0;
	    var prjCost = 0;
  	  var statusTable;
  	 var summaryByType = "status";

	    //Status -----
	    if (summaryByType=="status") {
	      var statusLabel="";

        statusTable = "<div class='summaryTableWrapper'><h3>SUMMARY BY PHASE:</h3><table class='summaryTable table'> \
    	  <tr> \
      	  <th>Phase</th> \
      	  <th>Projects</th> \
      	  <th>Est. Cost</th> \
    	  </tr>";

    	  for (var i=0;i<summaryTableArray.length;i++) {
    	    if (i<4) {
    	      if (i==0) {
    	        statusLabel="Construction underway or begins soon";
    	      }
    	      if (i==1) {
    	        statusLabel="Construction begins within 4 years";
    	      }
    	      if (i==2) {
    	        statusLabel="Construction begins in 4 to 10 years";
    	      }
    	      if (i==3) {
    	        statusLabel="Corridor Studies, construction in 10+ years";
    	      }

    	      statusTable += "<tr> \
         	  <td class='summaryTableLeft'>" + statusLabel + "</td> \
         	  <td class='summaryTableRight'>" + addCommas(summaryTableArray[i][1]) + "</td> \
         	  <td class='summaryTableRight'>$" + addCommas(Math.round(summaryTableArray[i][2])) + "</td> \
      	    </tr>";

      	    prjCount += summaryTableArray[i][1];
      	    prjCost += summaryTableArray[i][2];
    	    }
    	  }
	    }

	  //Totals -----
	  statusTable += "<tr> \
      <td class='summaryTableLeft'>Totals</td> \
      <td class='summaryTableRight'>" + addCommas(prjCount) + "</td> \
    	<td class='summaryTableRight'>$" + addCommas(Math.round(prjCost)) + "</td> \
    	</tr> \
    </table></div>";

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
	  document.getElementById("selectionCount").innerHTML = "";
	 // map.centerAndZoom([-99.5, 31.5],6);
	  hideFeatureLayers();
	  findProjects();
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
	}

	function hideFeatureLayers() {
	   districtSearchLyr.hide();
	   countySearchLyr.hide();
	   citySearchLyr.hide();
	   mpoSearchLyr.hide();
	   senateSearchLyr.hide();
	   houseSearchLyr.hide();
	}

	function addCommas(nStr) {
	  nStr += '';
	  x = nStr.split('.');
	  x1 = x[0];
	  x2 = x.length > 1 ? '.' + x[1] : '';
	  var rgx = /(\d+)(\d{3})/;
	  while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	  }
	  return x1 + x2;
	}

  function toggleDIV(theDIV) {
    var x = document.getElementById(theDIV);
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
  }
