// Generated by CoffeeScript 1.12.4
(function() {
  var reqConfig;

  reqConfig = {
    baseUrl: '.',
    paths: {
      jquery: 'lib/jquery-2.1.4.min',
      jqueryui: 'lib/jquery-ui.min-1.11.4',
      acorn: 'lib/acorn-3.2.0',
      acorn_loose: 'lib/acorn_loose-3.2.0',
      acorn_walk: 'lib/acorn_walk-3.2.0',
      immutable: 'lib/immutable-3.8.1.min',
      handlebars: 'lib/handlebars-v4.0.5',
      sockjs: 'lib/sockjs-1.0.0.min'
    }
  };

  define(['./base', './org', './docOrg'], function(Base, Org, DocOrg) {
    var Fragment, Headline, blockSource, exports, getCodeItems, headlineRE, orgDoc, parseOrgMode;
    parseOrgMode = Org.parseOrgMode, Fragment = Org.Fragment, Headline = Org.Headline, headlineRE = Org.headlineRE;
    orgDoc = DocOrg.orgDoc, getCodeItems = DocOrg.getCodeItems, blockSource = DocOrg.blockSource;
    exports = {
      Org: Org,
      DocOrg: DocOrg
    };
    atomView.setTools(exports);
    return exports;
  });

}).call(this);

//# sourceMappingURL=atom-tools.js.map
