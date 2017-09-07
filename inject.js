

window.addEventListener('message', (event) => {
    if (event.data && typeof event.data == 'object' && event.data.type) {
        let data = event.data;
        switch (data.type) {
            case 'OpenDialogVK':
                OpenDialogVK();
                OpenDialogVK.openning = true;
                OpenDialogVK.htmlElementLinks.innerText = 'Получаем ссылки...';
                break;
            case 'updateProcess':
                OpenDialogVK.htmlElementLinks.innerText = 'Получаем ссылки: '+data.data +' шт';
                break;
            case 'doneGetLink':
                OpenDialogVK.htmlElementLinks.innerText = 'Всего : '+data.data +' шт';
                OpenDialogVK.toggleState(data.type, data.data);
                break;
            case'photoLoad':
                OpenDialogVK.htmlElementPhotoLoad.innerText = 'Загружаем: '+data.data + ' шт';
                OpenDialogVK.toggleState(data.type, data.data);
                break;
            case 'noLink':
                OpenDialogVK.htmlElementError.innerText = 'нет фотографий либо привышено количество запросов';
                break;
            case 'errorApi':
                let params = {body:'Произошла ошибка «' + data.error.error_msg + ' при обращении к API ВКонтакте. Сообщите разработчику.'}
                OpenDialogVK.htmlElementError.innerText = params.body;
                break;
        }
    }
});


function OpenDialogVK(element) {
    var params = {maxArchiveCount: 0, maxArchiveMegabytes: 0, minRange: 0, maxRange: 0};

    var html = '<div class="links"></div><div class="slider"></div><div class="photo-load"></div><div class="error-load"></div>' +
        '<div id="save_images">\n' +
        '   <div class="button_gray"><button class="button_disabled js-zip-images"  disabled>Сохранить изображения</button></div><br>\n' +
        '   <div class="group-range">\n' +
        '       <span>Загружать:</span>\n'+
        '       <div class="button-range">\n'+
            '       <div class="button_gray">С: <input data-name="minRange" class="min-range"type="number" min="0" value="0"></input></div>\n' +
            '       <div class="button_gray">По: <input data-name="maxRange" class="max-range" type="number" min="0" ></input></div>\n' +
        '   </div>\n' +
        '   </div>\n' +
        '   </div>\n' +
        '<div class="group-range" style="\n' +
        '        margin-left: 53%;\n' +
        '        padding-top: 10px;\n' +
        '"><span class="toggle-bg">\n' +
        '    <input type="radio" name="toggle" value="count">\n' +
        '    <input type="radio" name="toggle" value="bytes">\n' +
        '    <span class="switch"></span>\n' +
        '    <span class="label-top">шт</span>\n' +
        '    <span class="label-bottom">мб</span>\n' +
        '</span><span style="margin-left: -10px;">В одном архиве не более:</span><input class="max-archive" type="number" min="0"></input></div>\n';
   // OpenDialogVK.htmlElement=document.createElement('div');
    var Box = new MessageBox({title: 'Индикатор', onHide: function () {
        Box = null;
        OpenDialogVK.openning = false;
        window.postMessage({type:'closeDialog'},'*');
    }});
    var progress = new CircularProgress({
        radius: 70,
        strokeStyle: 'black',
        lineCap: 'round',
        lineWidth: 4
    });

    Box.removeButtons();
    Box.addButton('Остановить загрузку', function () {
        Box.hide();
        Box = null;
        OpenDialogVK.openning = false;
        window.postMessage({type:'closeDialog'},'*');
    }, 'no', true);

    Box.content(html).show();
    let toggleBg =  geByClass1('toggle-bg', Box.bodyNode);
    let maxRangeArchive = geByClass1('max-archive', Box.bodyNode);
    let saveButton = geByClass1('js-zip-images', Box.bodyNode );
    let minRange = geByClass1('min-range', Box.bodyNode );
    let maxRange = geByClass1('max-range', Box.bodyNode );

    //Box.bodyNode.firstChild.appendChild(OpenDialogVK.htmlElement);
    OpenDialogVK.htmlElementLinks =  geByClass1('links', Box.bodyNode);
    OpenDialogVK.htmlElementPhotoLoad =  geByClass1('photo-load', Box.bodyNode);
    OpenDialogVK.htmlElementError=  geByClass1('error-load', Box.bodyNode);
    Box.bodyNode.firstChild.appendChild(progress.el);

    //progress.update(0);

    saveButton.onclick = function (event) {
        let count ;
        count = (count = toggleBg.querySelector('[name=toggle]:checked')) == null || count.value !== 'bytes';
        window.postMessage({
            type: 'zipImages', data: {
                start: +minRange.value || 0,
                stop: +maxRange.value > params.maxRange ? params.maxRange : +maxRange.value,
                archive: !count ? +maxRangeArchive.value  : params.maxRange > +maxRangeArchive.value  ?  +maxRangeArchive.value : params.maxRange,
                count: count
            }
        }, '*');
    };

    Box.bodyNode.onkeypress = function (event) {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (!(event.which === 8 || event.which === 44 || event.which === 46 || (event.which > 47 && event.which < 58))) return false;

    };

    let blur = function (event) {
        if (event.target && event.target.tagName === 'INPUT') {
            let target = event.target;
            if (+target.value < +target.min || (+target.value > +target.max && +target.max)) {
                target.classList.add('error-number');
                saveButton.classList.add('button_disabled');
            } else {
                target.classList.remove('error-number');
            }
            if (!Box.bodyNode.querySelector('.error-number')) {
                saveButton.classList.remove('button_disabled');
            }
        }
    };
    Box.bodyNode.addEventListener('focusout', blur);

    toggleBg.onchange  = function(event){
        let input;
        switch ((input = toggleBg.querySelector('[name=toggle]:checked')) && input.value){
            case 'bytes':
                params.maxArchiveCount = maxRangeArchive.value;
                maxRangeArchive.value = params.maxArchiveMegabytes;
                maxRangeArchive.removeAttribute('max');
                break;
            case 'count':
            default:
                params.maxArchiveMegabytes = maxRangeArchive.value ;
                maxRangeArchive.value = params.maxArchiveCount;
                maxRangeArchive.setAttribute('max',params.maxRange);
                break;
        }
        blur({target:maxRangeArchive});
    };

    OpenDialogVK.toggleState = function (state, range) {
        switch (state){
            case 'doneGetLink':
                saveButton.disabled = false;
                saveButton.classList.remove('button_disabled');
                maxRange.setAttribute('max', range);
                maxRange.value = range;
                maxRangeArchive.setAttribute('max', range);
                maxRangeArchive.value = range;
                params.maxRange = +range;
                break;
            case 'photoLoad':
                progress.update(range * 100 / params.maxRange);
            break;
        }
    };
}

var CircularProgress = (function () {

    // List of 2D context properties
    var ctxProperties = ['fillStyle', 'font', 'globalAlpha', 'globalCompositeOperation',
        'lineCap', 'lineDashOffset', 'lineJoin', 'lineWidth',
        'miterLimit', 'shadowBlur', 'shadowColor', 'shadowOffsetX',
        'shadowOffsetY', 'strokeStyle', 'textAlign', 'textBaseLine'];

    // Autoscale function from https://github.com/component/autoscale-canvas
    var autoscale = function (canvas) {
        var ctx = canvas.getContext('2d'),
            ratio = window.devicePixelRatio || 1;

        if (1 !== ratio) {
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
            canvas.width *= ratio;
            canvas.height *= ratio;
            ctx.scale(ratio, ratio);
        }

        return canvas;
    };

    // Utility function to extend a 2D context with some options
    var extendCtx = function (ctx, options) {
        for (var i in options) {
            if (ctxProperties.indexOf(i) === -1) continue;

            ctx[i] = options[i];
        }
    };

    // Main CircularProgress object exposes on global context
    var CircularProgress = function (options) {
        var ctx, i, property;

        options = options || {};
        this.el = document.createElement('canvas');

        this.options = options;

        options.text = options.text || {};
        options.text.value = options.text.value || null;

        ctx = this.el.getContext('2d');

        for (i in ctxProperties) {
            property = ctxProperties[i];
            options[property] = typeof options[property] !== 'undefined' ? options[property] : ctx[property];
        }

        if (options.radius) this.radius(options.radius);
    };

    // Update with a new `percent` value and redraw the canvas
    CircularProgress.prototype.update = function (value) {
        this._percent = value;
        this.draw();
        return this;
    };

    // Specify a new `radius` for the circle
    CircularProgress.prototype.radius = function (value) {
        var size = value * 2;
        this.el.width = size;
        this.el.height = size;
        autoscale(this.el);
        return this;
    };

    // Draw the canvas
    CircularProgress.prototype.draw = function () {
        var tw, text, fontSize,
            options = this.options,
            ctx = this.el.getContext('2d'),
            percent = Math.min(this._percent, 100),
            ratio = window.devicePixelRatio || 1,
            angle = Math.PI * 2 * percent / 100,
            size = this.el.width / ratio,
            half = size / 2,
            x = half,
            y = half;

        ctx.clearRect(0, 0, size, size);

        // Initial circle
        if (options.initial) {
            extendCtx(ctx, options);
            extendCtx(ctx, options.initial);

            ctx.beginPath();
            ctx.arc(x, y, half - ctx.lineWidth, 0, 2 * Math.PI, false);
            ctx.stroke();
        }

        // Progress circle
        extendCtx(ctx, options);

        ctx.beginPath();
        ctx.arc(x, y, half - ctx.lineWidth, 0, angle, false);
        ctx.stroke();

        // Text
        if (options.text) {
            extendCtx(ctx, options);
            extendCtx(ctx, options.text);
        }

        text = options.text.value === null ? (percent | 0) + '%' : options.text.value;
        tw = ctx.measureText(text).width;
        fontSize = ctx.font.match(/(\d+)px/);
        fontSize = fontSize ? fontSize[1] : 0;

        ctx.fillText(text, x - tw / 2 + 1, y + fontSize / 2 - 1);

        return CircularProgress;
    };
    return CircularProgress;
})();
