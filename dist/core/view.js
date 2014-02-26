// Generated by CoffeeScript 1.7.1
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define(['jquery', 'underscore', './base', './config'], function($, _, Base, config) {
    var View;
    return View = (function(_super) {
      __extends(View, _super);

      View.ComponentManager = {
        handlers: {},
        register: function(name, creator, destructor, initializer) {
          if (destructor == null) {
            destructor = (function() {});
          }
          if (initializer == null) {
            initializer = (function() {});
          }
          return this.handlers[name] = {
            creator: creator,
            destructor: destructor,
            initializer: initializer,
            initialized: false
          };
        },
        create: function(view, options) {
          var dom, handler, id, name, obj, opt, selector;
          if (options == null) {
            options = {};
          }
          id = options.id, name = options.name, selector = options.selector;
          opt = options.options;
          if (!name) {
            return view.logger.error("Component name can not be null");
          }
          if (!id) {
            view.logger.warn("Component ID is null");
          }
          dom = selector ? view.$$(selector) : id ? view.$(id) : view.getEl();
          handler = this.handlers[name] || {
            creator: function(view, el, options) {
              if (!el[name]) {
                view.logger.error("No component handler for name: " + name);
              }
              return el[name](options);
            },
            destructor: function(view, component, info) {
              return component[name]('destroy');
            },
            initialized: true
          };
          obj = !handler.initialized && handler.initializer ? handler.initializer() : null;
          handler.initialized = true;
          return view.chain("Create component " + name, obj, handler.creator(view, dom, opt), function(comp) {
            return {
              id: id,
              component: comp,
              info: {
                destructor: handler.destructor,
                options: opt
              }
            };
          });
        },
        destroy: function(view, component, info) {
          return typeof info.destructor === "function" ? info.destructor(view, component, info.options) : void 0;
        }
      };

      function View(name, module, loader, options) {
        this.name = name;
        this.module = module;
        this.loader = loader;
        this.options = options != null ? options : {};
        this.id = _.uniqueId('v');
        this.app = this.module.app;
        this.eventHandlers = {};
        View.__super__.constructor.apply(this, arguments);
      }

      View.prototype.initialize = function() {
        if (this.options.extend) {
          this.extend(this.options.extend);
        }
        return this.loadDeferred = this.chain("Initialize view " + this.name, [this.loadTemplate(), this.loadHandlers(), this.bindData()]);
      };

      View.prototype.loadTemplate = function() {
        var template;
        if (this.module.separatedTemplate !== true) {
          return this.chain(this.module.loadDeferred, (function(_this) {
            return function() {
              return _this.template = _this.module.template;
            };
          })(this));
        } else {
          template = this.getOptionResult(this.options, 'template') || this.name;
          return this.chain(this.app.getLoader(template).loadSeparatedTemplate(this, template), (function(_this) {
            return function(t) {
              return _this.template = t;
            };
          })(this));
        }
      };

      View.prototype.loadHandlers = function() {
        var handlers;
        handlers = this.getOptionResult(this.options, 'handlers') || this.name;
        return this.chain(this.app.getLoader(handlers).loadHandlers(this, handlers), (function(_this) {
          return function(handlers) {
            return _.extend(_this.eventHandlers, handlers);
          };
        })(this));
      };

      View.prototype.bindData = function() {
        return this.module.loadDeferred.done((function(_this) {
          return function() {
            var bind, key, value, _results;
            bind = _this.getOptionResult(_this.options, 'bind') || {};
            _this.data = {};
            _this.listeners = {};
            _results = [];
            for (key in bind) {
              value = bind[key];
              _results.push((function(key, value) {
                var binding, bindings, _i, _len, _results1;
                _this.data[key] = _this.module.data[key];
                if (!_this.data[key]) {
                  throw new Error("Model or Collection: " + key + " doesn't exists");
                }
                if (!value) {
                  return;
                }
                bindings = value.replace(/\s+/g, '').split(',');
                _results1 = [];
                for (_i = 0, _len = bindings.length; _i < _len; _i++) {
                  binding = bindings[_i];
                  _results1.push((function(binding) {
                    var listener, method, name, _base, _ref;
                    _ref = binding.split('#'), name = _ref[0], method = _ref[1];
                    if (!(name && method)) {
                      throw new Error("Data bindings only can be defined as eventName#methodName");
                    }
                    listener = {
                      name: name,
                      fn: function() {
                        var args, _ref1;
                        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                        if (_.isFunction(_this[method])) {
                          return _this[method].apply(_this, args);
                        }
                        return (_ref1 = _this.eventHandlers[method]) != null ? _ref1.apply(_this, args) : void 0;
                        return _this.logger.error("Can not find view method or event handler with name:" + method);
                      }
                    };
                    (_base = _this.listeners)[key] || (_base[key] = []);
                    _this.listeners[key].push(listener);
                    return _this.data[key].on(listener.name, listener.fn);
                  })(binding));
                }
                return _results1;
              })(key, value));
            }
            return _results;
          };
        })(this));
      };

      View.prototype.unbindData = function() {
        var key, listener, value, _i, _len, _ref, _ref1;
        _ref = this.data || {};
        for (key in _ref) {
          value = _ref[key];
          _ref1 = this.listeners[key] || [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            listener = _ref1[_i];
            value.off(listener.name, listener.fn);
          }
        }
        delete this.data;
        return delete this.listeners;
      };

      View.prototype.wrapDomId = function(id) {
        return "" + this.id + "-" + id;
      };

      View.prototype.setRegion = function(region) {
        var events, handler, id, key, name, selector, value, _ref, _results;
        this.region = region;
        events = this.getOptionResult(this.options, 'events') || {};
        _results = [];
        for (key in events) {
          value = events[key];
          if (!_.isString(value)) {
            this.logger.error('The value of events can only be a string');
          }
          _ref = key.replace(/^\s+/g, '').replace(/\s+$/, '').split(/\s+/), name = _ref[0], id = _ref[1];
          if (id) {
            if (id.charAt(id.length - 1) === '*') {
              id = id.substring(0, id.length - 1);
              id = this.wrapDomId(id);
              selector = "[id^=" + id + "]";
            } else {
              id = this.wrapDomId(id);
              selector = "#" + id;
            }
          }
          handler = this.createHandler(name, id, selector, value);
          _results.push(this.region.delegateEvent(this, name, selector, handler));
        }
        return _results;
      };

      View.prototype.createHandler = function(name, id, selector, value) {
        var me;
        me = this;
        return function() {
          var args, deferred, el, i;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          el = $(this);
          if (el.hasClass('disabled')) {
            return;
          }
          if (selector.charAt(0) !== '#') {
            i = el.attr('id');
            args.unshift(i.substring(id.length));
          }
          if (el.data('after-click') === 'defer') {
            deferred = me.createDeferred();
            el.addClass('disabled');
            deferred.always(function() {
              return el.removeClass('disabled');
            });
          }
          return me.loadDeferred.done(function() {
            var arr, method;
            method = me.eventHandlers[value];
            if (!method) {
              return me.logger.error("No handler defined with name: " + value);
            }
            arr = deferred ? [deferred].concat(args) : args;
            return method.apply(me, arr);
          });
        };
      };

      View.prototype.getEl = function() {
        if (this.region) {
          return this.region.getEl(this);
        } else {
          return null;
        }
      };

      View.prototype.$ = function(id) {
        if (!this.region) {
          return this.logger.error("Region is null");
        }
        return this.region.$$('#' + this.wrapDomId(id));
      };

      View.prototype.$$ = function(selector) {
        if (!this.region) {
          return this.logger.error("Region is null");
        }
        return this.getEl().find(selector);
      };

      View.prototype.close = function() {
        this.region.undelegateEvents(this);
        this.unbindData();
        return this.destroyComponents();
      };

      View.prototype.render = function() {
        if (!this.region) {
          this.logger.error('No region to render in');
        }
        return this.chain("render view " + this.name, this.loadDeferred, function() {
          var _ref;
          return (_ref = this.options.beforeRender) != null ? _ref.apply(this) : void 0;
        }, this.beforeRender, this.serializeData, this.options.adjustData || function(data) {
          return data;
        }, this.executeTemplate, this.processIdReplacement, function() {
          return this.renderComponent();
        }, this.exportRegions, this.afterRender, function() {
          var _ref;
          return (_ref = this.options.afterRender) != null ? _ref.apply(this) : void 0;
        });
      };

      View.prototype.beforeRender = function() {
        return this.destroyComponents();
      };

      View.prototype.destroyComponents = function() {
        var components, key, value;
        components = this.components || {};
        for (key in components) {
          value = components[key];
          View.ComponentManager.destroy(this, value, this.componentInfos[key]);
        }
        this.components = {};
        this.componentInfos = {};
        return this.componentIndex = 0;
      };

      View.prototype.serializeData = function() {
        var data, key, value, _ref;
        data = {};
        _ref = this.data;
        for (key in _ref) {
          value = _ref[key];
          data[key] = value.toJSON();
        }
        data.Global = this.app.global;
        data.View = this;
        return data;
      };

      View.prototype.executeTemplate = function(data, ignore, deferred) {
        var html;
        data.global = this.app.global;
        html = this.template(data);
        return this.getEl().html(html);
      };

      View.prototype.processIdReplacement = function() {
        var attr, used, _i, _len, _ref, _results;
        used = {};
        this.$$('[id]').each((function(_this) {
          return function(i, el) {
            var id;
            el = $(el);
            id = el.attr('id');
            if (used[id]) {
              return _this.logger.error("The id:" + id + " is used more than once.");
            }
            used[id] = true;
            return el.attr('id', _this.wrapDomId(id));
          };
        })(this));
        _ref = config.attributesReferToId || [];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attr = _ref[_i];
          _results.push(this.$$("[" + attr + "]").each((function(_this) {
            return function(i, el) {
              var value, withHash;
              el = $(el);
              value = el.attr(attr);
              withHash = value.charAt(0) === '#';
              if (withHash) {
                return el.attr(attr, '#' + _this.wrapDomId(value.substring(1)));
              } else {
                return el.attr(attr, _this.wrapDomId(value));
              }
            };
          })(this)));
        }
        return _results;
      };

      View.prototype.renderComponent = function() {
        var component, components, promises;
        components = this.getOptionResult(this.options, 'components') || [];
        promises = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = components.length; _i < _len; _i++) {
            component = components[_i];
            component = this.getOptionResult(component);
            if (component) {
              _results.push(View.ComponentManager.create(this, component));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }).call(this);
        return this.chain(promises, (function(_this) {
          return function(comps) {
            var comp, id, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = comps.length; _i < _len; _i++) {
              comp = comps[_i];
              if (!(comp)) {
                continue;
              }
              id = comp.id || _this.componentIndex++;
              _this.components[id] = comp.component;
              _results.push(_this.componentInfos[id] = comp.info);
            }
            return _results;
          };
        })(this));
      };

      View.prototype.exportRegions = function() {
        return this.$$('[data-region]').each((function(_this) {
          return function(i, el) {
            var id;
            el = $(el);
            id = el.data('region');
            return _this.module.addRegion(id, el);
          };
        })(this));
      };

      View.prototype.afterRender = function() {};

      return View;

    })(Base);
  });

}).call(this);
