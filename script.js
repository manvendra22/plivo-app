let selected = []
let incomingData = [];
let outgoingData = [];
let sendCheckValue = false;
let receiveCheckValue = false;


(function readDataOnLoad() {
  readIncomingTextFile()
  readOutcomingTextFile()
})()

function readIncomingTextFile() {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", "./data/plivo_incoming.csv", true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var csvData = new Array()
        var allText = rawFile.responseText;
        var jsonObject = allText.split(/\r?\n|\r/)
        for (var i = 0; i < jsonObject.length; i++) {
          csvData.push(jsonObject[i].split(','));
        }
        incomingData = csvData
      }
    }
  }
  rawFile.send(null);
};

function readOutcomingTextFile() {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", "./data/plivo_outgoing.csv", true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var csvData = new Array()
        var allText = rawFile.responseText;
        var jsonObject = allText.split(/\r?\n|\r/)
        for (var i = 0; i < jsonObject.length; i++) {
          csvData.push(jsonObject[i].split(','));
        }
        outgoingData = csvData
      }
    }
  }
  rawFile.send(null);
};

let map = AmCharts.makeChart("mapdiv", {
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
  },
  areasSettings: {
    autoZoom: false,
    color: "#E8EAF1",
    colorSolid: "#2BB031",
    selectable: true,
    selectedColor: "#2BB031",
    outlineColor: "#ffffff",
    rollOverColor: "#BFE7C1",
    rollOverOutlineColor: "#BFE7C1"
  },
  zoomControl: {
    zoomControlEnabled: false,
    homeButtonEnabled: false
  },
  zoomOnDoubleClick: false,
  dragMap: false,
  listeners: [{
    event: "clickMapObject",
    method: function (e) {

      // Ignore any click not on area
      if (e.mapObject.objectType !== "MapArea")
        return;

      let area = e.mapObject;

      if (area.showAsSelected) {
        area.showAsSelected = false;
        deleteTag(area.id)
      } else {
        area.showAsSelected = true;
        addInList(area.title, area.id)
      }

      e.chart.returnInitialColor(area);
    }
  }]
});

function addInList(title, id) {
  selected.push({
    id,
    title
  })
  let element = document.createElement('span')
  element.innerHTML = title
  element.id = id
  element.classList.add('tag')
  element.onclick = handleEvent;

  document.getElementById("selected").appendChild(element)

  checkAndUpdateCTA()
  getEstimate()
}

function handleEvent(event) {
  deleteTag(event.target.id)
}

function deleteTag(id) {
  let element = document.getElementById(id);
  element.parentNode.removeChild(element);

  selected = selected.filter(value => value.id != element.id)

  for (let i = 0; i < map.dataProvider.areas.length; i++) {
    if (map.dataProvider.areas[i].showAsSelected && map.dataProvider.areas[i].id == element.id) {
      map.dataProvider.areas[i].showAsSelected = false
    }
  }

  map.validateData()

  checkAndUpdateCTA()
  getEstimate()
}

let flag = true;

function getEstimate(volume = 1) {

  let incomingTotal = 0
  let outgoingTotal = 0

  selected.forEach(value => {
    if (receiveCheckValue) {
      let iData = incomingData.filter(data => data.indexOf(value.title) !== -1)
      let count = 0;

      let iTotal = iData.reduce((total, current) => {
        if (Number(current[9])) {
          count++
          total = Number(current[9]) + total
        }
        return total
      }, 0)

      if (count) {
        iTotal = iTotal / count
        incomingTotal += iTotal
      }
    }
    if (sendCheckValue) {
      let oData = outgoingData.filter(data => data.indexOf(value.title) !== -1)
      let count = 0;

      let oTotal = oData.reduce((total, current) => {
        if (Number(current[6])) {
          count++
          total = Number(current[6]) + total
        }
        return total
      }, 0)

      if (count) {
        oTotal = oTotal / count
        outgoingTotal += oTotal
      }
    }
  })

  incomingTotal *= volume
  outgoingTotal *= volume

  document.getElementById("send-value").innerHTML = `$ ${outgoingTotal.toFixed(4)}`
  document.getElementById("receive-value").innerHTML = `$ ${incomingTotal.toFixed(4)}`

  if (selected.length && (sendCheckValue || receiveCheckValue)) {
    flag && $('#cost-container').collapse()
    flag = true
  }
}

var slider = new Slider('#message-count', {
  formatter: function (value) {
    getEstimate(value)

    if (value >= 2000) {
      handleContactSales()
    } else {
      handleViewPricing()
    }
    return 'Current value: ' + value;
  }
});

function setDummyData() {
  let sliderCTA = document.getElementById("slider-cta")

  sliderCTA.innerHTML = '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span> <span>Loading...</span>'

  let url = 'https://person.clearbit.com/v2/combined/find?email=nixon@plivo.com'
  let username = 'sk_826457d604bc69ecddc77cec1613afa7'
  let password = ''

  let header = new Headers()

  let encoded = window.btoa(`${username}:${password}`)
  let auth = `Basic ${encoded}`

  header.append('Authorization', auth)

  fetch(url, {
    method: 'GET',
    headers: header,
    credentials: 'same-origin'
  })
    .then(response => response.json())
    .then(response => {
      let formElement = document.getElementById("contact-form")

      let person = response.person

      formElement.elements["first_name"].value = person.name.givenName
      formElement.elements["last_name"].value = person.name.familyName
      formElement.elements["work_email"].value = person.email
      // formElement.elements["phone"].value = Number(person.phone)

      sliderCTA.innerHTML = 'Contact Sales'
      $('#form-container').collapse()
    })
}

function handleContactSales() {
  let sliderCTA = document.getElementById("slider-cta")

  sliderCTA.innerHTML = 'Contact Sales'
  sliderCTA.onclick = setDummyData
}

function handleViewPricing() {
  let sliderCTA = document.getElementById("slider-cta")

  sliderCTA.innerHTML = 'View Pricing'
  sliderCTA.onclick = function (e) {
    window.open('https://www.plivo.com/sms/pricing/us/', '_blank');
  }
}

function checkAndUpdateCTA() {
  let estimateCTA = document.getElementById('estimate-cta')

  if (selected.length && (sendCheckValue || receiveCheckValue)) {
    estimateCTA.disabled = false
  } else {
    estimateCTA.disabled = true
  }
}

let receiveCheck = document.getElementById('receiveCheck')
let sendCheck = document.getElementById('sendCheck')

receiveCheck.onclick = function () {
  receiveCheckValue = receiveCheck.checked
  checkAndUpdateCTA()
}

sendCheck.onclick = function () {
  sendCheckValue = sendCheck.checked
  checkAndUpdateCTA()
}

let formElem = document.getElementById("contact-form")

formElem.onsubmit = async (e) => {
  e.preventDefault();

  let response = await fetch('https://hooks.zapier.com/hooks/catch/6257988/o6qgzyj/', {
    method: 'POST',
    body: new FormData(formElem)
  });

  let result = await response.json();

  alert(result.status);
};