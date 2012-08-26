var misc = require('./misc.js')
  , error_handler
  , Game = require('./game.js').Game
  , Creature = require('./creature.js').Creature
  , tick_interval
  , animate = require('./animation.js')
  , simulation = new Game()
  , creature = new Creature()
  , mouse = {x: 0, y:0, down:false }
  , box_start = { x:0, y:0 };

var b2AABB          = Box2D.Collision.b2AABB
  , b2Vec           = Box2D.Common.Math.b2Vec2
  , b2Mat           = Box2D.Common.Math.b2Mat22
  , b2BodyDef       = Box2D.Dynamics.b2BodyDef
  , b2Body          = Box2D.Dynamics.b2Body
  , b2FixtureDef    = Box2D.Dynamics.b2FixtureDef
  , b2Fixture       = Box2D.Dynamics.b2Fixture
  , b2World         = Box2D.Dynamics.b2World
  , b2MassData      = Box2D.Collision.Shapes.b2MassData
  , b2PolygonShape  = Box2D.Collision.Shapes.b2PolygonShape
  , b2CircleShape   = Box2D.Collision.Shapes.b2CircleShape
  , b2DebugDraw     = Box2D.Dynamics.b2DebugDraw;

function currentTool() {  
  return document.getElementById("editTool").value;
}

function tickEditPage() {
  var paused = document.getElementById("editPaused").checked;
  if(!paused) {
    simulation.step();
  }
}

//When we toggle, reset simulation
function toggleSimulation() {
  resetSimulation();
}

function drawEditPage() {
  simulation.draw();
}

function saveEdits() {
  //TODO: Save edits to server
}


function resetSimulation() {
  simulation.reset();
  simulation.addCreature(creature, false, new b2Vec(0,0), "EditCreature", [0.8, 0.8, 0.8]);
}

//Update page
function refresh() {
  resetSimulation();
}


function getBodyAtMouse() {
  mousePVec = new b2Vec2(mouseX, mouseY);
  var aabb = new b2AABB();
  aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
  aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
  
  // Query the world for overlapping shapes.

  selectedBody = null;
  world.QueryAABB(getBodyCB, aabb);
  return selectedBody;
}

function editMouseDown() {
  var tool = currentTool();
  
  if(tool === "box") {
  
    //Create a box
  
  } else if(tool === "move") {
  
    //Move body on top
  
  } else if(tool === "joint") {
  
    //Create a joint between two bodies
  }
}

function editMouseUp() {
  var tool = currentTool();

  if(tool === "box") {
  } else if(tool === "move") {
  } else if(tool === "joint") {
  }
}


//Start page
exports.startPage = function() {
  error_handler = require('./error_handler.js').createErrorHandler('editErrors');
  
  var edit_page = document.getElementById("editPage");  
  edit_page.style.display = "block";
  
  document.getElementById("editBack").onclick = function() {
    require('./entry.js').setPage(require('./lobby_page.js'));
  };
  
  document.getElementById("editSave").onclick = saveEdits();

  var paused = document.getElementById("editPaused");
  paused.checked = true;
  paused.onchange = toggleSimulation;
  
  simulation.setCanvas("editCanvas", 30.0);
  
  var canvas = document.getElementById("editCanvas");
  
  canvas.onmousedown = function(ev) {
    if(!paused) {
      return;
    }
    if(!mouse.down) {
      mouse.down = true;
      editMouseDown();
    }
  }; 
  canvas.onmouseup = function(ev) {
    if(!paused) {
      return;
    }
    if(mouse.down) {
      mouse.down = false;
      editMouseUp();
    }
  };
  canvas.onmousemove = function(ev) {
    var pos = misc.getElementPosition(canvas);
    mouse.x = (ev.clientX - pos.x) / simulation.draw_scale;
    mouse.y = (ev.clientY - pos.y) / simulation.draw_scale;
    
    //Don't let mouse drag outside region
    if(mouse.down && (
        mouse.x < 0 
     || mouse.y < 0 
     || mouse.x > canvas.width / simulation.draw_scale
     || mouse.y > canvas.height / simulation.draw_scale ) {
     
      mouse.down = false;
      editMouseUp();
    }
  };
  
  refresh();

  tick_interval = setInterval(tickEditPage, 20);
  animate.onframe = drawEditPage;
}

exports.stopPage = function() {
  clearInterval(tick_interval);
  animate.onframe = null;
  document.getElementById("editPage").display = "none";
  error_handler.destroy();
}

