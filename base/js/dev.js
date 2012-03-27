var CONFIG = {};
less.watchMode = false;
CONFIG.imageRefresh = false,
CONFIG.transitions = false;

// setInterval(function() { if (less.watchMode) less.refresh() }, 1000); // why, i do not know

window.onkeyup = function(e) {
  if (e.keyCode == 0) { // §
    less.watchMode = ! less.watchMode;
    if (less.watchMode) less.watch();
    window.status = 'less refresh = ' + less.watchMode;
  }
  if (e.keyCode == 58) {
    IMG_REFRESH = ! IMG_REFRESH;
    console.log('image refresh = ' + IMG_REFRESH);
  }

  if (e.keyCode == 51) {
    CONFIG.transitions = ! CONFIG.transitions;
    $('body').toggleClass('no_transitions', CONFIG.transitions)
    window.status = 'css transitions = ' + CONFIG.transitions;
  }
};


// $.imagine = function() {
//   $('img').each(function(i, el){
//     el.src =  el.src.split('?')[0] + '?' + new Date().getTime(); 
//   });
// 
//   $('*').each(function(i, el){
//     var f = $(el).css('background-image');
//     var res = /\((.*\/)(.*)\)/.exec( f );
//     if (res && res[1]) {
//       var new_img = 'url(' + res[1] + res[2].split('?')[0] + "?" + new Date().getTime() + ')'; 
//       $(el).css({ width: '', backgroundImage: new_img });
//     }
//   });
// };


// setInterval(function() {
//   if (IMG_REFRESH) {
//     $.imagine();                  
//   }
// }, 5000);
// 
// var CODE_REFRESH = false;
// 
// setInterval(function() {
//   if (CODE_REFRESH) {
//     $.get('/javascripts/refresh.js', function(response) {
//       eval(response);
//     });
//   }
// }, 2000);
// 
// $(window).focus(function() {
//   less.refresh();
  // if (IMG_REFRESH) {
  //   $.imagine();
  // }
//   $.get('/javascripts/refresh.js', function(response) {
//     eval(response);
//   })
// });






function ls (obj, depth, original) { // 
  if (! depth) { 
    depth    = 0;
    original = obj;
  }
  
  var indent = Array(depth * 4).join(" "),
      props  = Object.getOwnPropertyNames( obj ),
      parent = Object.getPrototypeOf( obj ),
      text   = '';
  
  props = _(props).sort().map(function(p) {
    try {
      if (_.isFunction( obj[p] )) { 
        var str = (obj[p] + "").split('\n')[0];
        if (str) {
          str = str.replace(/\ /g, ''); // no fucking spaces
          var match = str.match( /^function\((.*?)\)/ );
          p += match ? '(' + match[1] + ')' : '(?)';
        }
      }
      if (_.isElement(  obj[p] )) { p += "$" }
      if (_.isArray(    obj[p] )) { p += "[" + obj[p].length + "]" }
      if (_.isString(   obj[p] )) { p += '="' + obj[p] + '"' }
      if (_.isBoolean(  obj[p] )) { p += '=' + obj[p] }
      if (_.isNumber(   obj[p] )) { p += '=' + obj[p] }
    } catch (err) {
      p = p + "*";
      // console.log(err)
    }
    return p;
  });
      
  text = "\n" + indent + props.join('  ') + "\n";

  return (parent ? text + ls(parent, ++depth, original) : text);
}


// http://patik.com/blog/complete-cross-browser-console-log/

// Tell IE9 to use its built-in console
if (Function.prototype.bind && console && typeof console.log == "object") {
	["log","info","warn","error","assert","dir","clear","profile","profileEnd"]
		.forEach(function (method) {
			console[method] = this.call(console[method], console);
		}, Function.prototype.bind);
}

// log() -- The complete, cross-browser (we don't judge!) console.log wrapper for his or her logging pleasure
if (!window.log) {
	window.log = function () {
    log.history = log.history || [];  // store logs to an array for reference
    log.history.push(arguments);
		// Modern browsers
		if (typeof console != 'undefined' && typeof console.log == 'function') {
			
			// Opera 11
			if (window.opera) {
				var i = 0;
				while (i < arguments.length) {
					console.log("Item " + (i+1) + ": " + arguments[i]);
					i++;
				}
			}
			
			// All other modern browsers
			else if ((Array.prototype.slice.call(arguments)).length == 1 && typeof Array.prototype.slice.call(arguments)[0] == 'string') {
				console.log( (Array.prototype.slice.call(arguments)).toString() );
			}
			else {
				console.log( Array.prototype.slice.call(arguments) );
			}
			
		}
		
		// IE8
		else if (!Function.prototype.bind && typeof console != 'undefined' && typeof console.log == 'object') {
			Function.prototype.call.call(console.log, console, Array.prototype.slice.call(arguments));
		}
		
		// IE7 and lower, and other old browsers
		else {
			// Inject Firebug lite
			if (!document.getElementById('firebug-lite')) {
				// Include the script
				var script = document.createElement('script');
				script.type = "text/javascript";
				script.id = 'firebug-lite';
				// If you run the script locally, point to /path/to/firebug-lite/build/firebug-lite.js
				script.src = 'https://getfirebug.com/firebug-lite.js';
				// If you want to expand the console window by default, uncomment this line
				//document.getElementsByTagName('HTML')[0].setAttribute('debug','true');
				document.getElementsByTagName('HEAD')[0].appendChild(script);
				setTimeout(function () { log( Array.prototype.slice.call(arguments) ); }, 2000);
			}
			else {
				// FBL was included but it hasn't finished loading yet, so try again momentarily
				setTimeout(function () { log( Array.prototype.slice.call(arguments) ); }, 500);
			}
		}
	}
}