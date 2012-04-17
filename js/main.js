window.ev = new tickEvent(); // meh

var hack,
    slider = 0, // hack
    old_coax      = coax;
    raw_params    = {},
    coaxed_params = {},
    v = coaxed_params,
    refresh   = false, // whether or not something has changed + thus we should run onFrame
    animating = false; // we're animating so don't reset refresh to false 

window.adjust = function() {}; // placeholder
window.canvas = new Canvas;
  
var changed = function() {
  refresh = true;
}

$(function() {

  // raw_params 
  
  canvas.addElement();
  paper.install( window );
  paper.setup( canvas.el ); // Create an empty project and a view for the canvas
  
  window.alt_design = window.location.hash.substr(1);

  var d = alt_design || 'blocks';

  async.parallel({
    concept: function(done) {
      $.getJSON('/data/' + d + '/concept.json', function(data) {
        done(null, data)
      }).error(function(){ 
        done('bad JSON in concept.json') 
      });
    },
    version: function(done) {
      $.getJSON('/data/' + d + '/latest.json', function(data) {
        done(null, data)
      }).error(function(){ 
        done('bad JSON in latest.json') 
      });
    }
  }, function(err, design) { // we should have loaded the design
    if (err) {
      alert(err);
      return;
    }
    window.design = design;
    load_design( design );
  });
  
  
  (function animloop() {
    requestAnimFrame( animloop );
    ev.update();      // update the event var
    window.onFrame && window.onFrame( ev );
  })();
});


// this is nasty yeah
coax = function(n, min, max, a, b) {
  return old_coax(hack, min, max, a, b);
};


var Randomise = {
  one: function() {
    animating = true;
    refresh   = true;
    var change = 0.33,
        keys   = _(design.version.parameters).keys(),
        key    = keys[ Math.floor( keys.length * Math.random() ) ];
        old_value = raw_params[key],
        new_value = Math.random();
        
    if (Math.abs(new_value - old_value) < change) {
      if (new_value > old_value) {
        new_value = Math.min(1, new_value + change)
      } else {
        new_value = Math.max(0, new_value - change)
      }
    }

    console.log(old_value + "->" + new_value);

    $(raw_params).stop().animate( kv(key, new_value), function() {
      animating = false;
    });
  },
  all: function() {
    animating = true;
    var stop = _.after( _(design.version.parameters).keys().length, function () { animating = false; });
  
    for (p in design.version.parameters) {
      $(raw_params).animate( kv(p, Math.random()), stop );
    }
  }
}


function load_design(design) {
  var version = design.version;
  var frame_f = new Function('ev', 'n', 'with (v) { ' + version.functions.paperjs + '\n } ');
  
  window.ev = new tickEvent();
  window.gui.destroy();
  window.gui = new dat.GUI();

  document.title = window.alt_design + " (v" + version.iteration + ") -- vectee";

  for (p in version.parameters) {
    raw_params[p] = 0.5; // crappy defaults, but need raw initial value
    // add slider
    gui.add( raw_params, p, 0, 1 ).step( 0.001 ).listen().onChange( function(value) {
      refresh = true;
    });
    
    version.parameters[p].f = new Function( "with (this) {\nreturn " + version.parameters[p].formula + "\n}" );
  }

  apply_para_functions( raw_params );
  Randomise.all();
  
  function apply_para_functions(inputs) {
    for (p in version.parameters) {
      hack = inputs[p]; // bleugh
      coaxed_params[p] = version.parameters[p].f.call( inputs );
    }
  }

  window.onFrame = function(event) {
    if (refresh) {
      apply_para_functions( raw_params );
      frame_f.call(coaxed_params, event, 0); // call with this set to p
      paper.view.draw();
      if (! animating) refresh = false;
    }
  };
}
