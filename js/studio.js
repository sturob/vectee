// loads of globals that really need to be sorted out
window.SAFE_MODE  = (window.location.hash == '#safe');
window.unfocused  = false; // really?
window.paused     = SAFE_MODE;
window.gifMode    = false;
window.previous   = {};
window.ev         = new tickEvent();

window.changed = function() {
	window.previous = {};
};

window.drawPost = false;

window.onblur  = function() { unfocused = true; };
window.onfocus = function() { unfocused = false; };

// overridden per design
window.v          = { inputs: {} };
window.onFrame    = function() {}; 
window.J          = {};

window.editors = {
      'initial': { f: function() {} }, // called on init
      'paperjs': { f: function() {} }, // called as onFrame
      'instant': { f: function() {} }, // called instantly
      'unpause': { f: function() {} }, // called when unpause
      'canvas':  { f: function() {} }  // called when the canvas is at rest
    };

window.canvas = new Canvas;

paper.install( window );

// -------------------------------------------
//  design = (concept > versions > creations)
// -------------------------------------------

var CONCEPTS = [  // concepts to display in studio
  'alphatest', 'dotboom', 'mushroom', 'valentines', 'triangles', 'maps', 'joy', 
  'fibonacci', 'discs', 'blocks', 'dreamsquare', 'lines', 'breton'
];



//  the current messy setup:
//    - state is maintained in localStorage
//    - directly for functions
//    - thru Snorkle for parameters

var CurrentVersion = {
  //  functions:  {},  //  parameters: {},  // id: '',
  // number: 0,
  iteration: 0,
  
  // methods
  setID: function(id) {
    CurrentVersion.id = id;
    localStorage.setItem( 'tudio::current_design', CurrentVersion.id );
    // + do whatever else needs doing...
  },
  saveVersion: function() { // TODO: save thumbnail as well
    CurrentVersion.iteration++;
    var data = CurrentVersion.asJSON();

    var post_url = 'http://localhost:6969/vectee/' + CurrentVersion.id + '/',
        post_string = JSON.stringify( data );
    
    $.ajax({
      type: 'POST',  url: post_url + CurrentVersion.iteration + '.json',
      data: post_string,  dataType: 'json'
    });

    $.ajax({
      type: 'POST',  url: post_url + 'latest.json',
      data: post_string,  dataType: 'json'
    });

  }, // to disk via node.js
  asJSON: function() {
    var the_dump = {
      functions: {}, parameters: {}, iteration: CurrentVersion.iteration
    };

    _( localStorage.getItem(CurrentVersion.id).split(',') ).each( function(it, n) {
      the_dump.parameters[it] = JSON.parse( localStorage.getItem(CurrentVersion.id + '-' + it) );
    });
    
    _(editors).each( function(it, editor) {
      the_dump.functions[editor] = localStorage.getItem( CurrentVersion.id + "_" + editor );
    });
    return the_dump;
    
  }, // dump
  asSVG: function() {
    return paper.View.prototype.toSVG();
  },
  asPNG: function() {
    var img     = canvas.el.toDataURL("image/png");
    meh.innerHTML = '<img src="'+img+'">';
  }
};

  
window.Design = {
  load: function(id) {
    paused = true;
    
    async.parallel({
      concept: function(done) {
        $.getJSON('/data/' + id + '/concept.json', function(data) {
          done(null, data)
        }).error(function(){ 
          done('bad JSON in concept.json') 
        });
      },
      version: function(done) {
        $.getJSON('/data/' + id + '/latest.json', function(data) {
          done(null, data)
        }).error(function(){ 
          done('bad JSON in latest.json') 
        });
      }
    }, function(err, design) { // we have loaded the design, unless...
      if (err) {
        console.log(err);
        return;
      }

      CurrentVersion.iteration = design.version.iteration || 0;
      
      J = new Snorkle({}, { design: id, change: _.throttle(changed, 100) });

      if (J.isEmpty()) { // no parameters locally, load from latest version
        console.log('loading parameters from version....');
        _(design.version.parameters).each(function(p) {
          delete( p.value ); // TODO remove
          var param = ParamsList.create( p );
          GlobalSnorkle.addParam( param );
        });
      }
    
      canvas.addElement();
      paper.setup( canvas.el ); // Create
      Design.initAnimation(); // already once()d
      changed();
      window.ev = new tickEvent();
      
      CurrentVersion.setID( id );
      
      console.log('loading design: ' + id);
      $('#design_picker option#' + id).attr({ selected: true }); // make sure
      
      // load code
      _(editors).each(function(editor, key) {
        var session = editor.ace.getSession();
        var saved_f = localStorage.getItem( CurrentVersion.id + '_' + key ) || 
                      design.version.functions[key] || '';
        session.setValue( saved_f );
      });
      
      var tab_id = localStorage.getItem('tab');
      $(".tabs a[href=#" + tab_id + "]").click();
    
      if (! SAFE_MODE) Design.init( design.concept.defaultBackground );
      paused = false;
    });
    
  },
  init: function(bg) {
    v = { inputs: J.reals };
    editors.initial.f.call(v); // call with this set to p
    
    setBG( bg ); // here? really?
    
    window.onFrame = function(event) { // replace with your own
      try {
        editors.paperjs.f.call(v, event, 0); // call with this set to p
      } catch(e) {
        editors.paperjs.error = e;
        inform_of_error(e);
      }
    }
  },
  initAnimation: _.once(function() {
    // animation loop stuff
    var update_fps = _.throttle( function() { 
      frame_count.innerHTML = ev.count; 
      fps.innerHTML = shorten(1 / ev.delta);
    }, 1000);
    
    (function animloop() {
      requestAnimFrame( animloop );
      if (paused || unfocused || gifMode) {
        fps.innerHTML = '0';
        return false;
      }
      ev.update();      // update the event var
      update_fps();     // show frames per second
      J.updateReals();  //

      if (! _.isEqual( previous, v.inputs )) {
        previous = _.clone( v.inputs );
        J.recalculate();
      } else {
        //return false; // && function has not changed  
      }
      
      window.onFrame( ev );
      paper.view.draw();
      drawPost = true; // for postCanvas... can't just run it here cos of timing issues :/
    })();
  
    setInterval(function(){ // TODO fix this getting carried away + running multiple times
      if (paused || unfocused) return;
    	if (drawPost) editors.canvas.f.call(v);
      drawPost = false;
    }, 200);
  })
}; 


// serious stuff
$(function() {

  // generate a function to deal with changes to code for :key
  function code_change_for(key) { 
    var changer = function(ev) {
      var ed = editors[key],
          f_text = ed.ace.getSession().getValue(),
          error_last_time = !! ed.error;
      ed.error = false;    
      
      if (SAFE_MODE) {// save change but don't run
        console.log('safe mode');
        localStorage.setItem( CurrentVersion.id + "_" + key, f_text );
        return;
      }
      
      try {
  			ed.f = new Function('ev', 'n', 'with (v.inputs) { ' + f_text + '\n } ');
      } catch (e) {
  			ed.error = e;
        inform_of_error( e );
      }

  		if (! ed.error) {
        if (error_last_time) inform_of_error(false);
        changed();
        if (key == 'instant') {
          ed.f()
        }
  		}
      localStorage.setItem( CurrentVersion.id + "_" + key, f_text ); // save
    };
    
    if (key == 'paperjs' || key == 'instant') {
      changer = _.debounce( changer, 500 )
    }

    return changer;
  }
  
  // setup code editors
  var JavaScriptMode = require("ace/mode/javascript").Mode;
  _(editors).each(function(editor, key) {
    editor.error = false;
    editor.ace = ace.edit( key + "_editor" );
    var session = editor.ace.getSession();
    
    // settings    
    editor.ace.setShowPrintMargin( false );
    editor.ace.setTheme( "ace/theme/twilight" );
    editor.ace.setFontSize( 12 );
    session.setTabSize( 2 );
    session.setUseSoftTabs( true );
    session.setMode( new JavaScriptMode() );
    session.setValue( '' );
    
    // bindings
    console.log('loading code for ' + key);
    editor.onChange = code_change_for( key );
    session.on('change', editor.onChange);
  });

  Design.load( localStorage.getItem( 'tudio::current_design') || 'dotboom' );
});



// ==================
//    UI
// ==================


$(function() {
  
  $('.tabs a').click(function() {
    var id = $(this).attr('href').substr(1)
    $('.tabs a').removeClass('active'); $(this).addClass('active');
    $('.editor').hide();
    $('.editor#'+ id).show();
    editors[id.split('_')[0]].ace.resize();
    localStorage.setItem('tab', id);
    return false;
  });
  
  var t = _.template('<option id="<%= id %>"><%= id %></option>');
  _(CONCEPTS).each(function(id) {
    $('#design_picker').append( t({ id: id }) );
  });
  
  $('#design_picker').change(function(e) {
    Design.load( $(this).find($('option:selected'))[0].id );
  });
  
  $('#reload').click(function() {
    Design.load( CurrentVersion.id );
  })
  
  $('#save_a_version').click( CurrentVersion.saveVersion );

  function toggle_pause () {
    if (paused) editors.unpause.f();
    paused = ! paused;

    $('#pause').text( paused ? '>' : '||' );
  }
  
  $('#pause').bind('mousedown', toggle_pause);

  jwerty.key('esc', _.debounce(toggle_pause, 100));


  function find_in_code(){
    $('textarea:visible').focus();
    var tab = $('.tabs a.active').text();
    var search = prompt('Find in code:')
    editors[tab].ace.find(search);
    return false;
  }

  jwerty.key('⌘+f', find_in_code );

  
  $('#control button.zoomer').bind('click', function() {
    $('body')[0].className = this.id;

    if (this.id == 'z1') {
       canvas.resize({ height: $('img#t').height() - 220 }, changed)      
    }
    if (this.id == "z2") {       
       canvas.resize({ height: $(window).innerHeight() - 20 }, changed)
    } else if (this.id == 'z3') {
       canvas.resize({ width: 4200 }, changed);
    }
  });
  
  $('#append_png').click( function() {
    if ($('#meh:visible').length) {
      $('#meh img').remove();
      $('#meh').hide();
    } else {
      CurrentVersion.asPNG();
      $('#meh').show();
    }
  });
  
  $('#color').keyup(function() {
    setBG( $(this).val() );
  }).keyup();
  

  
  // canvas mouse events
  var $canvas = $('div#canvas');
  
  $canvas.on('mousewheel', _.throttle(function(e) {
    e = e.originalEvent;
    var zoom = e.wheelDeltaY > 0 ? 1.25 : 0.8;
    view.zoom *= zoom;
    if (view.zoom <= 1) {
      view.zoom = 1;
      view.setCenter( [ view.size.width / 2, view.size.height / 2 ] );
    } else {
      hack = 1;
      view.setCenter( ([e.x * hack,  e.y * hack]) );
    }
  }, 100) );

  $canvas.on('mousedown', function(e) {
    e = e.originalEvent;
    canvas.pos = [e.x, e.y];
    canvas.dragging = true;
  });
  
  $canvas.on('mousemove', _.throttle(function(e) {
    e = e.originalEvent;
    if (canvas.dragging) {
      view.scrollBy( new Point(canvas.pos[0] - e.x, canvas.pos[1] - e.y) );
      canvas.pos = [e.x, e.y];
    }
  }, 40) );
  
  $canvas.on('mouseup', function(e) { canvas.dragging = false });

  
  if (typeof io != "undefined") {
    var socket = io.connect('http://localhost:8339');
    socket.on('face', function (data) {
      var id = data.shift(),
          t  = data.shift(),
          face = {};

  		if (data.length) {
  	    _(data).each(function(v) {
  	      face[ v[0].replace(/\//g, '_') ] = v.splice(1);
  	    });
  		} else {
  			face[id.replace(/\//g, '_')] = t;
  		}
      J.pumpInput( face );
    });
  }

});


function inform_of_error(e) {
  if (e) {
    $('#editor .error_message').text("line " + e.line + ": " + e.message).show();
  } else {
    $('#editor .error_message').text('').hide();
  }
}


function saveGIF() {
  var encoder = new GIFEncoder();
  encoder.setDelay(300);
  encoder.setRepeat(0);
  encoder.setQuality(1);
  encoder.start();
  gifMode = true;

  (function saveFrame(n) {
    
    console.log('saved frame #' + n);

    ev.update();      // update the event var
    J.updateReals();

    if (! _.isEqual( previous, v.inputs )) {
      previous = _.clone( v.inputs );
      J.recalculate();
    } else {
      //return false; // && function has not changed  
    }
    
    window.onFrame( ev );
    paper.view.draw();
    encoder.addFrame( canvas.el.getContext('2d') );
      
    if (n--) { 
      saveFrame(n); 
    }
  })(10);
  
  encoder.finish();
  gifMode = false;

  console.log('done');

  var binary_gif = encoder.stream().getData()
  var img     = 'data:image/gif;base64,' + encode64(binary_gif); 
  meh.innerHTML = '<img src="'+img+'">';
  $('#meh').show();
}


function setBG(color) {
  // $('#t').css({ backgroundColor: color });
  // $('#canvas canvas').globalcss( 'background-color', color );
}



SVGCanvas.prototype.transform = SVGCanvas.prototype.translate;
SVGCanvas.prototype.fillText = SVGCanvas.prototype.text;

paper.View.prototype.toSVG = function() {
  var svgContext = new SVGCanvas(this.canvas.width, this.canvas.height);

  var oldCtx = this._context;

  this._context = svgContext;
  this.draw(false);

  this._context = oldCtx;

  // Optional serialization of the SVG DOM nodes
  var serializer = new XMLSerializer();
  return serializer.serializeToString(svgContext.svg.htmlElement);
};
