(function () {
  var underscore_script = document.createElement('script');
  underscore_script.src = 'http://underscorejs.org/underscore-min.js';
  document.body.appendChild(underscore_script);
  var backbone_script = document.createElement('script');
  backbone_script.src = ('http://backbonejs.org/backbone-min.js');
  document.body.appendChild(backbone_script);
  var auto_script = document.createElement('script');
  auto_script.src = 'https://raw.githubusercontent.com/lmgjerstad/cookieclicker/gh-pages/auto.js';
  document.body.appendChild(auto_script);
}());
