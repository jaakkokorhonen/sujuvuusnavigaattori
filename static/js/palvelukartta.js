(function() {
  var Service, ServiceList, ServiceListView, root_list, show_categories, srv_list, srv_list_view,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Service = (function(superClass) {
    extend(Service, superClass);

    function Service() {
      return Service.__super__.constructor.apply(this, arguments);
    }

    Service.prototype.initialize = function() {
      return this.ls_key = "pk_service_" + this.id;
    };

    Service.prototype.load_from_cache = function() {
      var attrs;
      attrs = localStorage[this.ls_key];
      if (!attrs) {
        return false;
      }
      return JSON.parse(attrs);
    };

    Service.prototype.get_children = function() {
      var child, child_list, i, id, len, ref;
      child_list = [];
      ref = this.get('child_ids');
      for (i = 0, len = ref.length; i < len; i++) {
        id = ref[i];
        child = this.collection.get(id);
        child_list.push(child);
      }
      return child_list;
    };

    Service.prototype.save = function() {
      var attrs, str;
      if (!localStorage) {
        return;
      }
      attrs = this.toJSON();
      str = JSON.stringify(attrs);
      return localStorage[this.ls_key] = str;
    };

    return Service;

  })(Backbone.Model);

  ServiceList = (function(superClass) {
    extend(ServiceList, superClass);

    function ServiceList() {
      return ServiceList.__super__.constructor.apply(this, arguments);
    }

    ServiceList.prototype.model = Service;

    ServiceList.prototype.url = citynavi.config.hel_servicemap_service_url;

    ServiceList.prototype.initialize = function() {
      return this.on("reset", this.handle_reset);
    };

    ServiceList.prototype.handle_reset = function() {
      this.find_parents();
      return this.root_list = srv_list.filter(function(srv) {
        return !srv.get('parent');
      });
    };

    ServiceList.prototype.find_parents = function() {
      return this.forEach((function(_this) {
        return function(srv) {
          var child, child_id, i, len, ref, results;
          if (!srv.get('child_ids')) {
            return;
          }
          ref = srv.get('child_ids');
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            child_id = ref[i];
            child = _this.get(child_id);
            if (!child) {

            } else {
              results.push(child.set('parent', srv.id));
            }
          }
          return results;
        };
      })(this));
    };

    ServiceList.prototype.save_to_cache = function() {
      var root_ids;
      root_ids = this.root_list.map(function(srv) {
        return srv.id;
      });
      if (localStorage) {
        localStorage["pk_service_root"] = JSON.stringify(root_ids);
      }
      return this.forEach(function(srv) {
        return srv.save();
      });
    };

    ServiceList.prototype.load_from_cache = function() {
      var i, id, len, root_ids, srv, srv_attrs, srv_list, srv_root;
      console.log("load cache");
      if (!localStorage) {
        return false;
      }
      srv_root = localStorage["pk_service_root"];
      if (!srv_root) {
        return false;
      }
      root_ids = JSON.parse(srv_root);
      srv_list = [];
      for (i = 0, len = root_ids.length; i < len; i++) {
        id = root_ids[i];
        srv = new Service({
          id: id
        });
        srv_attrs = srv.load_from_cache();
        if (!srv_attrs) {
          return false;
        }
        srv_list.push(srv_attrs);
      }
      this.reset(srv_list);
      return true;
    };

    ServiceList.prototype.sync = function(method, collections, options) {
      options.dataType = 'jsonp';
      return ServiceList.__super__.sync.apply(this, arguments);
    };

    return ServiceList;

  })(Backbone.Collection);

  ServiceListView = (function(superClass) {
    extend(ServiceListView, superClass);

    function ServiceListView() {
      return ServiceListView.__super__.constructor.apply(this, arguments);
    }

    ServiceListView.prototype.tagName = 'ul';

    ServiceListView.prototype.attributes = {
      'data-role': 'listview'
    };

    ServiceListView.prototype.initialize = function(opts) {
      this.parent_id = opts.parent_id;
      return this.listenTo(this.collection, "reset", this.render);
    };

    ServiceListView.prototype.render = function() {
      var content, page, srv_list;
      console.log("serviceview render");
      if (!this.parent_id) {
        srv_list = this.collection.filter(function(srv) {
          if (!srv.parent) {
            return true;
          }
        });
      } else {
        srv_list = this.collection.filter(function(srv) {
          if (srv.parent === this.parent_id) {
            return true;
          }
        });
      }
      this.$el.empty();
      srv_list.forEach((function(_this) {
        return function(srv) {
          var srv_el, srv_id, srv_name;
          srv_name = srv.get('name_en');
          srv_id = srv.get('id');
          srv_el = $("<li><a href='#map-page?service=" + srv_id + "'>" + srv_name + "</a></li>");
          return _this.$el.append(srv_el);
        };
      })(this));
      page = $("#find-nearest");
      content = page.children(":jqmData(role=content)");
      content.empty();
      content.append(this.$el);
      page.page();
      this.$el.listview();
      return $.mobile.changePage(page);
    };

    return ServiceListView;

  })(Backbone.View);

  root_list = null;

  srv_list = new ServiceList;

  srv_list_view = new ServiceListView({
    collection: srv_list
  });

  show_categories = function(options) {
    if (!srv_list.load_from_cache()) {
      return srv_list.fetch({
        success: function() {
          return srv_list.save_to_cache();
        }
      });
    }
  };

  $(document).bind("pagebeforechange", function(e, data) {
    var u;
    if (typeof data.toPage !== "string") {
      return;
    }
    u = $.mobile.path.parseUrl(data.toPage);
    if (u.hash === '#find-nearest') {
      e.preventDefault();
      return show_categories();
    }
  });

}).call(this);

//# sourceMappingURL=palvelukartta.js.map
