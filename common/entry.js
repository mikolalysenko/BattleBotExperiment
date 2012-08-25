var misc = require('./misc.js')
  , current_page = {
      name:       "Default"
    , startPage:  function() {}
    , stopPage:   function() {}
  };

var pages = {
    "Lobby":  require('./lobby_page.js')
  , "Edit":   require('./edit_page.js')
  , "Room":   require('./room_page.js')
  , "Battle": require('./battle_page.js')  
};

exports.setPage = function(next_page) {
  current_page.stopPage();
  current_page = next_page;
  current_page.startPage();
}


misc.http_request("/account/status", {}, function(err, data) {
  if(err) {
    window.location = "/index.html";
    return;
  }
  
  //Handle window load state
  var obj = JSON.parse(data)
    , state = obj.state;
    
  console.log("initail status = ", obj);
  if(document.readyState === "complete") {
    exports.setPage(pages[state]);
  } else {
    document.onload = function() {
      exports.setPage(pages[state]);
    }
  }
});
