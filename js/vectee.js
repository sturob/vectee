// Canvas
var Canvas = Backbone.Model.extend({
  width: 620, height: 870,
  initialize: function() {
    this.set({
      width:  this.width,
      height: this.height,
      ratio:  this.height / this.width
    });
  },
  addElement: function() {
    $('#canvas').html('');
    var $el = $('<canvas keepalive="true"></canvas>');
    $el.appendTo('#canvas');
    this.el = $el[0];
    this.resize();
    return this.el;
  },
  resize: function(new_size, callback) {
    if (new_size && new_size.width) {
      new_size.height = new_size.width * this.get('ratio');
    } else if (new_size && new_size.height) {
      new_size.width = new_size.height / this.get('ratio');
    } else { //
      new_size = { width: this.get('width'), height: this.get('height') };
    }
    this.set( new_size );
    
    this.el.width  = new_size.width;
    this.el.height = new_size.height;
    
    var r = this.get('width') / this.width;

    window.adjust = function(pre) {
      return (_.isArray( pre )) ? new Point([ pre[0] * r, pre[1] * r ]) : pre * r;
    }
    
    callback && callback();
  }
});




// passed into the tick
function tickEvent() {
  this.count = 0;  // number of times the frame event was fired
  this.time  = 0;  // total amount of time passed since the first frame event in secs
  this.delta = 0;  // time passed in seconds since the last frame event
  this.first = 0;  // Date.now()/1000 of first call
  this.last  = 0;  // Date.now()/1000 of the previous call
  this.update = function() {
    var now = Date.now() / 1000;
    if (! this.first) {
      this.first = now;
    }
    this.count++;
    this.delta = now - this.last;
    this.time  = now - this.first;
    this.last  = now;
  }
}
