class Layout extends D.View
    initialize: ->
        @isLayout = true
        @loadedPromise = @loadTemplate()
        @bindActions = ->

D.Module = class Module extends D.Base
    @Layout = Layout
    constructor: (@name, @app, @loader, options = {}) ->
        @separatedTemplate = options.separatedTemplate is true
        @regions = {}
        super 'M', options
        @app.modules[@id] = @
        @actions = @getOptionValue('actions') or {}
        @app.delegateEvent @

    initialize: ->
        @extend @options.extend if @options.extend
        @loadedPromise = @Promise.chain [@loadTemplate(), @loadItems()]

        @initLayout()
        @initStore()
        @actionContext = D.extend
            store: @store
        , D.Request

    initLayout: ->
        layout = @getOptionValue('layout') or {}
        @layout = new Layout('layout', @, @loader, layout)

    initStore: ->
        @store = {}
        @autoLoadBeforeRender = []
        @autoLoadAfterRender = []
        doItem = (name, value) =>
            value = value.call @ if D.isFunction value
            value or= {}
            if value and value.autoLoad
                (if value.autoLoad is true then @autoLoadBeforeRender else @autoLoadAfterRender).push name
            @store[name] = D.Model.create value.type, @app, @, value

        doItem key, value for key, value of @getOptionValue('store') or {}

    loadTemplate: ->
        return if @separatedTemplate
        @Promise.chain @loader.loadTemplate(@), (template) -> @template = template

    loadItems: ->
        @items = {}
        @inRegionItems = {}

        doItem = (name, options) =>
            options = options.call @ if D.isFunction options
            options = region: options if D.isString options
            method = if options.isModule then 'loadModule' else 'loadView'
            @app.getLoader(name)[method](name, @, options).then (obj) =>
                obj.moduleOptions = options
                @items[name] = obj
                @inRegionItems[name] = obj if options.region

        @Promise.chain (doItem key, value for key, value of @getOptionValue('items') or {})

    setRegion: (@region) ->
        @Promise.chain(
            -> @layout.setRegion @region
            -> @layout.render()
            @initRegions
        )

    close: ->
        @Promise.chain(
            -> @options.beforeClose?.call @
            @beforeClose
            -> @layout.close()
            @closeRegions
            @afterClose
            -> @options.afterClose?.call @
            -> delete @app.modules[@id]
            @
        )

    render: (options = {}) ->
        @error 'No region' unless @region
        @renderOptions = options

        @Promise.chain(
            @loadedPromise
            -> @options.beforeRender?.call @
            @beforeRender
            @fetchDataBeforeRender
            @renderItems
            @afterRender
            -> @options.afterRender?.call @
            @fetchDataAfterRender
            @
        )

    closeRegions: ->
        regions = @regions
        delete @regions
        (value.close() for key, value of regions or {})

    initRegions: ->
        @closeRegions() if @regions
        @regions = {}
        for item in @layout.$$('[data-region]')
            id = item.getAttribute 'data-region'
            type = item.getAttribute 'region-type'
            @regions[id] = D.Region.create type, @app, @, item, id

    renderItems: ->
        promises = for key, value of @inRegionItems
            @error "Region:#{key} is not defined" unless @regions[key]
            @regions[key].show value
        @Promise.chain promises

    fetchDataBeforeRender: ->
        @Promise.chain (D.Request.get @store[name] for name in @autoLoadBeforeRender)

    fetchDataAfterRender: ->
        @Promise.chain (D.Request.get @store[name] for name in @autoLoadAfterRender)

    dispatch: (action) ->
        @error "No action handler for #{action.name}" unless D.isFunction @actions[action.name]
        @Promise.chain -> @actions[action.name].call @actionContext, action.payload

    beforeRender: ->
    afterRender: ->
    beforeClose: ->
    afterClose: ->
