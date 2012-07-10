// mine



_.mixin({
  spawn: function(arr, value) {
    if (value == null) {
      value = true;
    }
    var o = {};
    for(var n = 0; n < arr.length; n++) {
      var val = _.isFunction(value) ? value.call(arr[n]) : value;

      o[arr[n]] = val;
    }    
    return o;
  }
});

// suspect this is not worth keeping
function kv (k, v) { // (1, 2) -> { 1: 2 }
  var obj = {};  obj[k] = v;
  return obj;
}

function a2o (a) {  // [ 'a', 'b', 3 ] -> { 'a': true, 'b': true, 3: true }
  var o = {};
  for(var n = 0; n < a.length; n++) {
    o[a[n]] = true;
  }
  return o;
}

if (! window.log) {
  window.log = function(t) {
    if (console) console.log(t);
  };
}



// quick maths + util stuff

function int(f) {
  return Math.floor( f );
}

function mod(a,b) {
	return a - (a % b);
}

function clamp(n, min, max) { // not used
	return Math.min(Math.max(n, min), max);
}

function of() { // return first valid value
	for(var i=0; i<arguments.length; i++) {
		if (typeof arguments[i] != "undefined" || arguments[i] != null) {
			return arguments[i];
		}
	}
}

function add2(a, b) {
  var arr = [];
  for (var i = 0; i < b.length; i++) {
    arr[i] = a[i] + b[i];
  }
  return arr;
}



// TODO spline based, work for <0 and 1>, cache?
// var skew = Skewer({ 0.1:0.01, 0.9:0.99 });
// skew( 0.4 )
function Skewer ( pts ) {
  pts[0] = 0;
  pts[1] = 1;
  var getNearest = function(n) {
    var known_xs = _(pts).keys().sort().map(function(k){ return k - 0 }); // keys -> incrementing numbers
    
    for (var i = 0; i + 1 < known_xs.length; i++) { // find the points n is between
      if (n > known_xs[i] && n < known_xs[i+1]) {
        return [ known_xs[i], known_xs[i+1] ];
      }
    } 
    // TODO deal with number outside 0-1
  }
  
  var sk = function(x) {
    if (typeof pts[x] != "undefined" && pts[x] != null) { 
      return pts[x];
    }
    
    var nr = getNearest(x),
        x1 = nr[0],  y1 = pts[x1],
        x2 = nr[1],  y2 = pts[x2];
        xd = x2 - x1,
        yd = y2 - y1;

    return (((x - x1) / xd) * yd) + y1;
  };
  sk.test = function() { 
    for(var i = 0; i <= 1; i += 0.05) {
      console.log( sprintf( "%0.2f: %s", i, new Array( Math.round( 100 * sk(i) ) ).join('-') ) );
    }
  };
  return sk;
}

function encode64(input) {
  var output = "", i = 0, l = input.length,
  key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", 
  chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  while (i < l) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);
    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;
    if (isNaN(chr2)) enc3 = enc4 = 64;
    else if (isNaN(chr3)) enc4 = 64;
    output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
  }
  return output;
}




// From: http://asserttrue.blogspot.de/2011/12/perlin-noise-in-javascript_31.html

// This is a port of Ken Perlin's Java code. The
// original Java code is at http://cs.nyu.edu/%7Eperlin/noise/.
// Note that in this version, a number from 0 to 1 is returned.
PerlinNoise = new function() {

this.noise = function(x, y, z) {

   var p = new Array(512)
   var permutation = [ 151,160,137,91,90,15,
   131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
   190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
   88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
   77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
   102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
   135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
   5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
   223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
   129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
   251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
   49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
   138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
   ];
   for (var i=0; i < 256 ; i++) 
 p[256+i] = p[i] = permutation[i]; 

      var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
          Y = Math.floor(y) & 255,                  // CONTAINS POINT.
          Z = Math.floor(z) & 255;
      x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
      y -= Math.floor(y);                                // OF POINT IN CUBE.
      z -= Math.floor(z);
      var    u = fade(x),                                // COMPUTE FADE CURVES
             v = fade(y),                                // FOR EACH OF X,Y,Z.
             w = fade(z);
      var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,      // HASH COORDINATES OF
          B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;      // THE 8 CUBE CORNERS,

      return scale(lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
                                     grad(p[BA  ], x-1, y  , z   )), // BLENDED
                             lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
                                     grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
                     lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
                                     grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
                             lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                     grad(p[BB+1], x-1, y-1, z-1 )))));
   }
   function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
   function lerp( t, a, b) { return a + t * (b - a); }
   function grad(hash, x, y, z) {
      var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
      var u = h<8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
             v = h<4 ? y : h==12||h==14 ? x : z;
      return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
   } 
   function scale(n) { return (1 + n)/2; }
}

window.perlin = PerlinNoise.noise;





//  (0.1, 10, 110) 			 ->  20
//  (.1, 5, 10) 				 ->   5.5
//  (.1, 10, 5) 				 ->   9.5
//  (20, 10, 110, 0, 20) -> 110
function coax(val, min, max, d, e) {
  var in_min  = (typeof d == "undefined" || d == null) ? 0 : d, // assume input range is:
			in_max  = (typeof e == "undefined" || e == null) ? 1 : e, // 0.0 - 1.0
			in_diff = in_max - in_min,
			diff    = max    - min,
			ratio   = diff / in_diff,
			result  = val * ratio;

	return min + result;
}

function shorten(f) {
  if (typeof f == 'string') {
    return f
  }
  return Math.round(f * 10000) / 10000
}




function dump (obj) {
  console.log( JSON.stringify(obj, null, 2) )
}

function setStatus (s) { // TODO use a notification thingy
  window.status = s;
}

function ajax_dump (method, url, data) {
  $.ajax( url, { type: method, data: data, 
    complete: function(a, result) {
      console.log( a.responseText );
    }
  })
  return 'wait for it...'
}

// adapted www.jameswiseman.com/blog/2010/08/24/manually-traverse-a-dom-tree-using-jquery/

function html2less($item, pass) {  
  var tmp = {};
  
  $item = $item ? $item : $('body');
  pass = pass ? pass : { max: 50, count: 0, less: "" };

  $item.each(function(n, v) {
    var tagName   = this.tagName.toLowerCase(),
        className = this.className ? '.' + this.className : '',
        selector  = tagName + className,
        indented = Array(pass.count * 2).join(" ");

    if (tmp[selector]) {
      return;
    } else {
      tmp[selector] = true;
    }
    
    pass.count++;
    if (pass.count > pass.max) {  
      pass.max = pass.count;  
    }

    pass.less += indented + selector + " {\n";
    html2less( $(this).children(), pass );
    pass.less += indented + "}\n";
  });  
  pass.count--;  
  return pass.less;  
}  
  






$.ajaxSetup({
  // 'data': {}, // ??
  // 'dataType'   : FORMAT,  // auto parse data coming back as JSON
  'beforeSend' : function(xhr) { 
    // xhr.setRequestHeader( "Accept", 'application/json' );
  },
  dataFilter: function(data, type) { // deal with rails sending back " " and a 200 - which triggers .error in $.ajax
    if (type == "json" && data == ' ') { return '{}'; } else { return data; }
  }
});



// onScreen jQuery plugin v0.2.1
// (c) 2011 Ben Pickles
//
// http://benpickles.github.com/onScreen
//
// Released under MIT license.
;(function($) {
  $.expr[":"].onScreen = function(elem) {
    var $window = $(window)
    var viewport_top = $window.scrollTop()
    var viewport_height = $window.height()
    var viewport_bottom = viewport_top + viewport_height
    var $elem = $(elem)
    var top = $elem.offset().top
    var height = $elem.height()
    var bottom = top + height

    return (top >= viewport_top && top < viewport_bottom) ||
           (bottom > viewport_top && bottom <= viewport_bottom) ||
           (height > viewport_height && top <= viewport_top && bottom >= viewport_bottom)
  }
})(jQuery);


// requestAnimationFrame() shim by Paul Irish
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function() {
	return  window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
})();



/*!
 * jQuery imagesLoaded plugin v1.0.4
 * http://github.com/desandro/imagesloaded
 *
 * MIT License. by Paul Irish et al.
 */

(function($, undefined) {

  // $('#my-container').imagesLoaded(myFunction)
  // or
  // $('img').imagesLoaded(myFunction)

  // execute a callback when all images have loaded.
  // needed because .load() doesn't work on cached images

  // callback function gets image collection as argument
  //  `this` is the container

  $.fn.imagesLoaded = function( callback ) {
    var $this = this,
        $images = $this.find('img').add( $this.filter('img') ),
        len = $images.length,
        blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

    function triggerCallback() {
      callback.call( $this, $images );
    }

    function imgLoaded( event ) {
      if ( --len <= 0 && event.target.src !== blank ){
        setTimeout( triggerCallback );
        $images.unbind( 'load error', imgLoaded );
      }
    }

    if ( !len ) {
      triggerCallback();
    }

    $images.bind( 'load error',  imgLoaded ).each( function() {
      // cached images don't fire load sometimes, so we reset src.
      if (this.complete || this.complete === undefined){
        var src = this.src;
        // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
        // data uri bypasses webkit log warning (thx doug jones)
        this.src = blank;
        this.src = src;
      }
    });

    return $this;
  };
})(jQuery);



// http://plugins.jquery.com/files/lazyEach.js.txt

(function($){
	$.lazyEach = function(ar, fn, opts){
		opts = $.extend({}, $.lazyEach.defaults, opts);
		fn.iterateStep = 0;
		var timer,
			goAhead = true,
			abort 	= function(){
				goAhead = false;
				clearTimeout(timer);
				opts.abort(ar, fn.iterateStep);
			}
		;
		if(ar && ar.length){
			function step(){
				if(goAhead){
					var stepEnd = fn.iterateStep + opts.partSize,
						stepArray = (ar.slice) ? 
						ar.slice(fn.iterateStep, stepEnd) : 
						Array.prototype.slice.call(ar, fn.iterateStep, stepEnd);
					$.each(stepArray, fn);
					if(ar.length <= stepEnd) {
						opts.complete(ar);
					} else {
						fn.iterateStep = fn.iterateStep + opts.partSize;
						timer = setTimeout(step, opts.breathTime);
					}
				}
				
			}
			step();
			return abort;
		}
		$.each.apply(this, arguments);
		opts.complete(ar);
		return abort;
	};
	
	$.lazyEach.defaults = {
		partSize: 10,
		breathTime: 100,
		complete: function(){},
		abort: function(){}
	};
	
})(jQuery);




/*
	Author: Troy Mcilvena (http://troymcilvena.com)
	Twitter: @mcilvena
	Date: 10 November 2010
	Version: 1.2
	
	Revision History:
		1.0 (23/08/2010)	- Initial release.
		1.1 (27/08/2010)	- Made plugin chainable
		1.2 (10/11/2010)	- Fixed broken retina_part setting. Wrapped in self executing function (closure)
*/

(function( $ ){
	$.fn.retina = function(retina_part) {
		// Set default retina file part to '-2x'
		// Eg. some_image.jpg will become some_image-2x.jpg
		var settings = {'retina_part': '-2x'};
		if(retina_part) jQuery.extend(settings, { 'retina_part': retina_part });

		if(window.devicePixelRatio >= 2) {
			this.each(function(index, element) {
				if(!$(element).attr('src')) return;

				var new_image_src = $(element).attr('src').replace(/(.+)(\.\w{3,4})$/, "$1"+ settings['retina_part'] +"$2");
				$.ajax({url: new_image_src, type: "HEAD", success: function() {
					$(element).attr('src', new_image_src);
				}});
			});
		}
		return this;
	}
})( jQuery );


// from stackoverflow

function pretty_date(date_str){
  var time = ('' + date_str).replace(/-/g,"/").replace(/[TZ]/g," ");
  var seconds = (new Date - new Date(time)) / 1000;
  var token = 'ago', list_choice = 1;
  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = 'from now';
    list_choice = 2;
  }
  var i = 0, format;
  while (format = time_formats[i++]) if (seconds < format[0]) {
    if (typeof format[2] == 'string')
      return format[list_choice];
    else
      return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
  }
  return time;
};
var time_formats = [
  [60, 'just now', 1], // 60
  [120, '1 minute ago', '1 minute from now'], // 60*2
  [3600, 'minutes', 60], // 60*60, 60
  [7200, '1 hour ago', '1 hour from now'], // 60*60*2
  [86400, 'hours', 3600], // 60*60*24, 60*60
  [172800, 'yesterday', 'tomorrow'], // 60*60*24*2
  [604800, 'days', 86400], // 60*60*24*7, 60*60*24
  [1209600, 'last week', 'next week'], // 60*60*24*7*4*2
  [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
  [4838400, 'last month', 'next month'], // 60*60*24*7*4*2
  [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
  [58060800, 'last year', 'next year'], // 60*60*24*7*4*12*2
  [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
  [5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
  [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
];

if ( typeof jQuery != "undefined" ) {
  jQuery.fn.pretty_date = function(){
  	return this.each(function(){
  		var date = pretty_date(this.title);
  		if ( date )
  			jQuery(this).text( date );
  	});
  };
}


/**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};


