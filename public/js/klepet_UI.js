function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;

  var youtubeVideo = sporocilo.indexOf('https://www.youtube.com/watch?v=') > -1;
  if (jeSmesko || youtubeVideo) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />').replace('jpg\' /&gt;', 'jpg\' />').replace('gif\' /&gt;', 'gif\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else{
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
  
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  var sporociloSmeski = dodajSmeske(sporocilo);
  var slikeZaPripet = povezaveVSporocilu(sporocilo);
  var videoTabela = linkiIzSporocila(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));

      slikeNaZaslon(slikeZaPripet);
      videiVChat(videoTabela);

    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporociloSmeski);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporociloSmeski));
    slikeNaZaslon(slikeZaPripet);
    videiVChat(videoTabela);
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    slikeNaZaslon(povezaveVSporocilu(sporocilo.besedilo));
    videiVChat(linkiIzSporocila(sporocilo.besedilo));
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img class=\"smesko\" src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
function povezaveVSporocilu(sporocilo) {
  var povezave = sporocilo.match(/(https:\/\/|http:\/\/)\S+(.gif|.png|.jpg)/gi);
  var seznamPovezav = [];
  var j = 0;
  for(var i in povezave) {
    seznamPovezav[j] = povezave[i];
    j++;
  }
  return seznamPovezav;
}

function slikeNaZaslon(slike) {
  for(i in slike) {
    if(!(slike[i].indexOf("http://sandbox.lavbic.net/teaching/OIS/gradivo/") > -1)) { //ce ni smesko
      $('#sporocila').append(pretvoriSlike(povezaveVSporocilu(slike[i])));
    }
  }
}

function pretvoriSlike(povezava) {
  return $('<a href="'+povezava+'"><img style="width:200px; margin-left:20px;" src="'+povezava+'" /></a>');
}

function videiVOkvir(video) { //vrne "okvirjen video"
  return '<iframe style="width:200px; height:150px; margin-left:20px" src="https://www.youtube.com/embed/'+video+'" allowfullscreen></iframe>';
}

function linkiIzSporocila(sporocilo) { //vrne tabelo youtube linkov v sporocilu
  var table = sporocilo.match(/(?:(?:http|https):\/\/www\.youtube\.com\/watch\?v=)(.{11})/gi);
  for(var i in table) {
    table[i] = table[i].replace(/(?:(?:http|https):\/\/www\.youtube\.com\/watch\?v=)(.{11})/gi, '$1');
  }
  return table;
}

function videiVChat(table) {
  for(var i in table) {
    $('#sporocila').append(videiVOkvir(table[i]));
  }
}
