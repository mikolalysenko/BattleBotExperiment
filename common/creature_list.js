"use strict";
var misc = require('./misc.js');

exports.createCreatureList = function(element_id) {

  var container = document.getElementById(element_id)
    , alive = true
    , select_element = null;
  container.innerHTML = "Downloading creatures...";

  var result = {
      update: function() {  
        misc.http_request("/creatures/list", {}, function(err, result) {
        if(!alive) {
          return;
        }
        if(err) {
          throw new Error(err);
        }
        
        container.innerHTML = "";        
        var creatures = JSON.parse(result);
        select_element = document.createElement("select");
        select_element.multiple = true;
        for(var i=0; i<creatures.length; ++i) {
          select_element.add(new Option(creatures[i].name, creatures[i]._id));
        }
        container.appendChild(select_element);
      });
    }
    , getSelectedCreature: function() {
      if(!select_element || !alive) {
        return null;
      }
    }
    , destroy: function() {
      alive = false;
    }
  };

  result.update();
  return result;
}
