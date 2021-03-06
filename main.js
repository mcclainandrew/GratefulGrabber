var xhr = {};

var fa = document.createElement('style');
fa.type = 'text/css';
fa.textContent = '@font-face { font-family: FontAwesome; src: url("'
    + chrome.extension.getURL('lib/fa/fonts/fontawesome-webfont.woff')
    + '"); }';
document.head.appendChild(fa);

function resetMessage() {
  $("#result")
    .removeClass()
    .text("");
}

function Message(text) {
  resetMessage();
  $("#result")
    .addClass("alert alert-success")
    .text(text);
}

function Loading(text) {
  $("#result")
    .addClass("alert alert-warning")
    .text(text);
}

function Error(text) {
  resetMessage();
  $("#result")
    .addClass("alert alert-danger")
    .text(text);
}

var songs = [],
  object = [];

var list = $('#wrap').find('.container:last').find('script:last').html(),
    myList = list.match(/\{\"title\"(.*?\}\]\})/g);
_.each(myList, function(details) {
  details = JSON.parse(details);
  var url = "https://www.archive.org" + details.sources[0].file,
      trackLink = "<a href=\"" + url + "\" class=\"downloadfile\"  download>" + details.title + "</a>";
  object.push(details);
  songs.push(trackLink);
});

var req = new XMLHttpRequest();
var img = chrome.extension.getURL('icons/gdpainting.png');
req.open("GET", chrome.extension.getURL('box.html'), true);
req.onreadystatechange = function() {
  if (req.readyState == 4 && req.status == 200) {
    var individualSong;
    _.each(myList, function(track) {
      track = JSON.parse(track);
    });
    var template = Mustache.to_html(req.responseText, {
      songs: songs,
      img: img
    });
    $('#theatre-ia-wrap').after(template);
  }
};
req.send(null);

function deferredAddZip(url, filename, zip) {
  var deferred = $.Deferred();
  JSZipUtils.getBinaryContent(url,
    function startDownload(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        zip.file(filename, data, {
          binary: true
        });
        deferred.resolve(data);
      }
    }, doProgress);
  return deferred;
}

$('body').on('click', '#downloadAll', function() {
  resetMessage();


  $('#circle').circleProgress({
    value: .01,
    size: 200,
    animation: {
      duration: 400,
      easing: "circleProgressEasing"
    },
    fill: {
      gradient: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"]
    }
  });

  var zip = new JSZip(),
      deferreds = [],
      showName = $(".key-val-big:contains('Published')").find('a:first').text();

  _.each(object, function(data) {
    var url = "https://www.archive.org" + data.sources[0].file;
    var title = data.title;
    deferreds.push(deferredAddZip(url, title + ".mp3", zip));
  });

  $.when.apply($, deferreds).done(function() {
    var blob = zip.generate({
      type: "blob"
    });

    saveAs(blob, showName + ".zip");
    Message("Your download has finished!");
  }).fail(function(err) {
    Error(err);
  });
});

function doProgress(oEvent) {
  if (oEvent.lengthComputable) {
    var percentComplete = oEvent.loaded / oEvent.total;
    updatePercent(oEvent.target.responseURL, percentComplete);
    var percent = getTotalPercent() / object.length;
    $('#circle').circleProgress('value', percent);
    $('#circle').on('circle-animation-progress', function(event, progress) {
      Loading('Downloading the show now. Hang tight for a sec. ' + (parseInt(percent * 100) + '%'));
    });
  }
}

function updatePercent(url, percent) {
  xhr[url] = percent;
}

function getPercents() {
  return xhr;
}

function getTotalPercent() {
  var array = _.map(getPercents(), function(value, index) {
    return value;
  });
  var sum = _.reduce(array, function(a, b) {
    return a + b;
  }, 0);
  return sum;
}
