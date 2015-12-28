D.ActionCreator = class ActionCreator extends D.Renderable {
    _initializeEvents () {
        super._initializeEvents();
        super._initializeEvents(this._actions);
    }

    _createEventHandler (name, obj) {
        return (this._option('actions') || {})[obj.key] ? this._createAction(name) : super._createEventHandler(name, obj);
    }

    _createAction (name) {
        let {disabledClass} = this.app.options,
            {[name]: dataForAction} = this._option('dataForActions') || {},
            {[name]: actionCallback} = this._option('actionCallbacks') || {};

        return (e) => {
            let target = D.Adapter.getEventTarget(event);
            if (D.Adapter.hasClass(target, disabledClass)) return;
            D.Adapter.addClass(target, disabledClass);

            let data = this._getActionPayload(target);
            this.chain(
                D.isFunction(dataForAction) ? dataForAction.call(this, data, e) : data,
                (payload) => paylaod !== false ? this.module.dispatch(name, payload) : false,
                (result) => result !== false ? actionCallback && actionCallback.call(this, result)
            ).then(() => D.Adapter.removeClass(target, disabledClass), () => D.Adapter.removeClass(target, disabledClass));
        }
    }

    _getActionPayload (target) {
        let current = target, rootEl = this._element, targetName = false;
        while (current && current !== rootEl && current.tagName !== 'FORM') current = current.parentNode;

        current || (current = rootEl);
        let data = current.tagName === 'FORM' ? D.Adapter.getFormData(current) : {};
        map(current.querySelectorAll('[data-name][data-value]'), (item) => {
            if (item === target) {
                targetName = target.getAttribute('data-name');
                data[targetName] = target.getAttribute('data-value');
                return;
            }

            name = item.getAttribute('data-name');
            if (targetName && targetName === name) return;

            value = item.getAttribute('data-value');
            v = data[name];
            D.isArray(v) ? v.push(value) : (data[name] = v == null ? value : [v, value]);
        });
        return data;
    }
};
