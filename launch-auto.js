(function () {
  var srcs = [
    'https://code.jquery.com/jquery-3.1.0.min.js',
    'http://underscorejs.org/underscore-min.js',
    'http://backbonejs.org/backbone-min.js',
    'https://raw.githubusercontent.com/lmgjerstad/cookieclicker/ui/auto.js',
  ];
  var loadJS = function () {
    var src = srcs.shift();
    if (src) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = loadJS;
      document.body.appendChild(script);
    }
  }
  loadJS();
}());
