chrome.extension.onRequest.addListener((req) => {
    addElementInList();
});

window.addEventListener('load', () => {
    addElementInList();
});

function addElementInList(){
    addElementInList.timer && (addElementInList.timer = clearTimeout(addElementInList.timer));

let addElement = function(){
    let menu = qu('._im_dialog_action_wrapper .ui_actions_menu');
    if (!menu){
        /*    setTimeout(function () {
                addElementInList();
            },300);*/
        return;
    }
    if (geByClass1('_-get-load', menu)) return ;

    let elem = document.createElement('div');
    elem.className = 'ui_actions_menu_sep';
    menu.appendChild(elem);

    elem = document.createElement('a');
    elem.className = 'ui_actions_menu_item _im_action im-action vk_acts_item_icon _-get-load';
    elem.innerText = 'Сохранить фото';
    elem.setAttribute('tabindex', "0");
    elem.setAttribute('role', "link");

    elem.onclick = function (event) {
        let idDialog = +window.location.search.match(/.+sel=c*(\d+).*/)[1];
        if ((''+idDialog).length < 4) idDialog +=2000000000;
        window.postMessage({type:'OpenDialogVK'}, "*");
        loadImages(idDialog)
    };
    menu.appendChild(elem);
};

addElementInList.timer = setTimeout(addElement, 500);

}

function loadImages(id) {
    let links =[];
    let close = false;
    let parameter = {peer_id:id, media_type:'photo', start_from:0, count:200};
    //let getPhoto = () => api('messages.getHistoryAttachments',parameter , makePhoto);
    let getPhoto = () => {
        api('execute', {
            v: 5.58, code: 'var count = 20, i = 0; var result = null; var items = []; \n' +
            'var param =' + JSON.stringify(parameter) + ';\n' +
            'while (i < count) {\n' +
            '        i = i + 1;\n' +
            '        result = API.messages.getHistoryAttachments(param);\n' +
            '        items.push(result);\n' +
            '        if (result.next_from) {\n' +
            '            param.start_from = result.next_from;\n' +
            '        } else {\n' +
            '            i = count;\n' +
            '        }\n' +
            '    }\n' +
            '    return items;'
        }, (result) => {
            makePhoto({
                items: result.reduce((arr, items) => {
                    if (items.next_from) parameter.start_from = items.next_from;
                    return Array.prototype.concat(arr, items.items);
                }, []), next_from: parameter.start_from
            });
            return true;
        })
    };

    loadImages.listender && (loadImages.listender = window.removeEventListener('message', loadImages.listender));

    window.addEventListener('message', loadImages.listender = function (event) {
        if (event.data && typeof event.data == 'object' && event.data.type) {
            let data = event.data;
            switch (data.type) {
                case 'closeDialog':
                close = true;
                break;
                case 'zipImages':
                    downAndZipImages(event.data.data);
                    break;
            }
        }
    });


    let downAndZipImages  = (data) => {
        let zip = new JSZip();
        data = data || {start:0, stop: links.length, archive:0 , count: true};
        let len = data.start ;

        downloadFile(links[len].href, onDownloadComplete);


        function downloadFile(url, onSuccess) {
            var xhr = new XMLHttpRequest();
            xhr.onprogress = calculateAndUpdateProgress;
            xhr.open('GET', url, true);
            xhr.responseType = "blob";
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (onSuccess) onSuccess(xhr.response);
                }
            };
            xhr.send();
        }

        function onDownloadComplete(blobData){
                    if (len < data.stop) {
                        let elem = links[len];
                        window.postMessage({type:'photoLoad', data: len}, "*");
                            // add downloaded file to zip:
                            var fileName = elem.date + ' ' +elem.href.substr(elem.href.lastIndexOf('/')+1);
                            zip.file(fileName, blobData);
                            let partsInfo = dataStop(data, len, blobData);
                            if (len < data.stop -1 && !close && !partsInfo.endParts){
                                len++;
                                downloadFile(links[len].href, onDownloadComplete);
                            } else {
                                // all files have been downloaded, create the zip
                                zip.generateAsync({type:"blob"})
                                    .then(function (content){
                                        var zipName = "example.zip";
                                        var a = document.createElement('a');
                                        a.href =  URL.createObjectURL(content);
                                        a.download = zipName;
                                        a.click();
                                        URL.revokeObjectURL(a.href);
                                    });

                                if (partsInfo.partition && !close) {
                                    zip = new JSZip();
                                    len++;
                                    downloadFile(links[len].href, onDownloadComplete);
                                }
                                // then trigger the download link:
                            }
                    }
                }

    function calculateAndUpdateProgress(evt) {
        if (evt.lengthComputable) {
             //console.log(len +' '+ evt.lengthComputable);
        }
    }

        function dataStop(data, len, blob) {
            let result = {partition: false, endParts: false};
            if (data.count && data.archive < data.stop) { // делим по количеству
                let count = parseInt(data.stop/data.archive);
                for (let i=1; i <= count; i++){
                    if (i*data.archive == len) {
                        result.endParts = true;
                        break;
                    }
                }
                result.partition = len < data.stop-1;
            } else if (!data.count && data.archive > 0) {
                dataStop.blobSize = dataStop.blobSize || 0;
                dataStop.blobSize += blob.size;
                if (data.archive *1024*1024 <=  dataStop.blobSize){
                    result.endParts = true;
                    dataStop.blobSize = 0;
                }
                result.partition = len < data.stop-1;
            }
            return result;
        }
    };

    let makePhoto = (response) =>{
        parameter.start_from = response.next_from;
        response.items.forEach((element)=>{
            let maxSize = 0;
            Object.keys(element.photo).forEach((key)=>{
                let data = key.split('_');
                if (data[0] == 'photo' && +data[1] > maxSize){
                    maxSize = + data[1];
                }
            });
            links.push({msId:element.photo.id, date:element.photo.date, href:element.photo['photo_' + maxSize]});
        });

        window.postMessage({type:'updateProcess', data: links.length}, "*");
        if (response.items.length && !close) {
            setTimeout(getPhoto, 200);
        }else{
            if (links.length) window.postMessage({type:'doneGetLink', data: links.length}, "*"); //downAndZipImage();
            else window.postMessage({type:'noLink'}, "*");
        }
        return true;
    };

    getPhoto();
}

chrome.extension.sendRequest({ method: 'getOptions'}, function (opts) {
    saveOptions(opts);
});
var PageId = Math.random()*2500;

injectScript(['inject.js']);

injectStyle(['style.css']);
