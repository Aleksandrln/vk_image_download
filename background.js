chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
   if (request.method == 'getOptions') {
    sendResponse(opts);
  }else if (request.method == 'updateOptions'){
      saveOptions(request.update);
    }
});


chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  if (request.method == 'getNote') {
    var note = false;
    try {
      note = JSON.parse(localStorage['note' + request.user_id] || 'false') || false;
    } catch (e) {}

    sendResponse(note);
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.tabs.create({ url: 'options.html' });
});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    if(changeInfo.url != null) {

        chrome.tabs.sendRequest(tabId, {msg: changeInfo, type:'update'});
    }
});