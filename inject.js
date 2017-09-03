

window.addEventListener('message', (event) => {
    if (event.data && typeof event.data == 'object' && event.data.type) {
        let data = event.data;
        switch (data.type) {
            case 'OpenDialogVK':
                OpenDialogVK();
                OpenDialogVK.openning = true;
                break;
            case 'updateProcess':
                OpenDialogVK.htmlElementLinks.innerText = 'Получаем ссылки: '+data.data +' шт';
                break;
            case'photoLoad':
                OpenDialogVK.htmlElementPhotoLoad.innerText = 'Загружаем: '+data.data + ' шт';
                break;
            case 'noLink':
                OpenDialogVK.htmlElementError.innerText = 'нет фотографий либо привышено количество запросов';
                break;
            case 'errorApi':
                let params = {body:'Произошла ошибка «' + data.error.error_msg + ' при обращении к API ВКонтакте. Сообщите разработчику.'}
                OpenDialogVK.htmlElementError.innerText = params.body;

               /* let notification =  new Notification('Ошибка ' + data.error.error_code + ' при выполнении запроса «' + data.method + '»',
                    params);

                notification.onclick = function () {
                    notification.close();
                };
                notification.show();
                setTimeout(function() {
                    notification.cancel();
                }, 5000);*/
        }
    }
});


function OpenDialogVK(element) {
    var html = '<div class="links"></div><div class="photo-load"></div><div class="error-load"></div>';
   // OpenDialogVK.htmlElement=document.createElement('div');
    var Box = new MessageBox({title: 'Индикатор', onHide: function () {
        Box = null;
        OpenDialogVK.openning = false;
        window.postMessage({type:'closeDialog'},'*');
    }});
    /*var progress = new CircularProgress({
        radius: 70,
        strokeStyle: 'black',
        lineCap: 'round',
        lineWidth: 4
    });*/

    Box.removeButtons();
    Box.addButton('Остановить загрузку', function () {
        Box.hide();
        Box = null;
        OpenDialogVK.openning = false;
        window.postMessage({type:'closeDialog'},'*');
    }, 'no', true);

    Box.content(html).show();
    //Box.bodyNode.firstChild.appendChild(OpenDialogVK.htmlElement);
    OpenDialogVK.htmlElementLinks =  geByClass1('links', Box.bodyNode);
    OpenDialogVK.htmlElementPhotoLoad =  geByClass1('photo-load', Box.bodyNode);
    OpenDialogVK.htmlElementError=  geByClass1('error-load', Box.bodyNode);
   // Box.bodyNode.firstChild.appendChild(progress.el);

    //progress.update(0);
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
