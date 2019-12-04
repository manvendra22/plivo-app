
    var map = AmCharts.makeChart("mapdiv", {
      type: "map",
      theme: "dark",
      projection: "mercator",
      panEventsEnabled: true,
      backgroundColor: "#ffffff",
      backgroundAlpha: 1,
      zoomControl: {
        zoomControlEnabled: false
      },
      dataProvider: {
        map: "worldHigh",
        getAreasFromMap: true,
        areas: []
      },
      areasSettings: {
        autoZoom: false,
        color: "#E8EAF1",
        colorSolid: "#2BB031",
        selectedColor: "#2BB031",
        outlineColor: "#ffffff",
        rollOverColor: "#BFE7C1",
        rollOverOutlineColor: "#000000"
      }
    });