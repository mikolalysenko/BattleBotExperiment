"use strict";
var Box2D = require('./box2d.js')
  , EventEmitter = require('events').EventEmitter
  , Creature = require('./creature.js');
  
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
  , b2DebugDraw     = Box2D.Dynamics.b2DebugDraw
  , b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;


function Game() {
  this.world = new b2World(new b2Vec(0, 10), false);
  this.draw_scale = 30.0;
  
  //Create arena boundaries
  var fixDef = new b2FixtureDef;
  fixDef.density      = 1.0;
  fixDef.friction     = 0.5;
  fixDef.restitution  = 0.2;
  fixDef.shape        = new b2PolygonShape;
  
  var bodyDef = new b2BodyDef;
  bodyDef.type = b2Body.b2_staticBody;
  
  //Create floors
  fixDef.shape.SetAsBox(20, 2);  
  bodyDef.position.Set(10, 400 / 30 + 1.8);
  this.world.CreateBody(bodyDef).CreateFixture(fixDef);
  
  bodyDef.position.Set(10, -1.8);
  this.world.CreateBody(bodyDef).CreateFixture(fixDef);
  
  //Create walls
  fixDef.shape.SetAsBox(2, 14);
  bodyDef.position.Set(-1.8, 13);
  this.world.CreateBody(bodyDef).CreateFixture(fixDef);
  
  bodyDef.position.Set(21.8, 13);
  this.world.CreateBody(bodyDef).CreateFixture(fixDef);
  
  this.creatures = {};
  
  this.world.SetContactFilter = {
      RayCollide: function() { return true; }
    , ShouldCollide: function(f0, f1) {
      var b0 = f0.GetBody()
        , b1 = f1.GetBody()
        , u0 = b0.GetUserData()
        , u1 = b1.GetUserData();
      
      if('creature' in u0 && 'creature' in u1) {
        return u0.creature !== u1.creature;
      }
      return true;
    }
  };
}

Game.prototype.serialize = function() {
  var result = {};
  
  for(var id in this.creatures) {
    var C = this.creatures[id]
      , bodies = [];
    
    for(var i=0; i<C.bodies.length; ++i) {
      var B = C.bodies[i].GetBody()
        , pos = B.GetPosition()
        , angle = B.GetAngle()
        , lin_vel = B.GetLinearVelocity()
        , ang_vel = B.GetAngularVelocity();
      bodies.push([ 
          Math.round(pos.x * 65536.0)
        , Math.round(pos.y  * 65536.0)
        , Math.round(angle  * 65536.0)
        , Math.round(lin_vel.x  * 65536.0)
        , Math.round(lin_vel.y * 65536.0)
        , Math.round(ang_vel * 65536.0) ]);
    }
    
    result[id] = {
      bodies: bodies
    };
  }
  
  return JSON.stringify(result);
}

Game.prototype.deserialize = function(state) {
  var obj = JSON.parse(state);
  for(var id in obj) {
    var C1 = obj[id]
      , C0 = this.creatures[id];
    for(var i=0; i<C1.bodies.length; ++i) {
      var B0 = C0[i].GetBody()
        , B1 = C1.bodies[i];
      B.SetPositionAndAngle(new b2Vec(B1[0]/65536.0, B1[1]/65536.0), B1[2]/65536.0);
      B.SetLinearVelocity(new b2Vec(B1[3]/65536.0, B1[4]/65536.0));
      B.SetAngularVelocity(B1[5]/65536.0);
    }
  }
}

Game.prototype.step = function() {
  this.world.Step(
      1.0 / 60.0   //frame-rate
    , 10           //velocity iterations
    , 10           //position iterations
  );
}

Game.prototype.setCanvas = function(canvas_id, scale) {
  var canvas      = document.getElementById(canvas_id)
    , context     = canvas.getContext("2d")
    , debugDraw   = new b2DebugDraw();
    
  this.draw_scale = scale;
  debugDraw.SetSprite(context);
  debugDraw.SetDrawScale(scale);
  debugDraw.SetFillAlpha(0.3);
  debugDraw.SetLineThickness(1.0);
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
  this.world.SetDebugDraw(debugDraw);
}

Game.prototype.draw = function() {
  this.world.DrawDebugData();
}

//Reset game state
Game.prototype.reset = function() {
  for(var id in this.creatures) {
    this.removeCreature(id);
  }
}

Game.prototype.addCreature = function(creature, flip, t, name, color) {
  if(name in this.creatures) {
    this.removeCreature(name);
  }

  var bodies = []
    , joints = [];
  
  //create some objects
  var bodyDef   = new b2BodyDef
    , fixDef    = new b2FixtureDef;    
   bodyDef.type = b2Body.b2_dynamicBody;
   
  for(var i=0; i<creature.bodies.length; ++i) {
    //Add body to world
    var B = creature.bodies[i];
    bodyDef.position.x = t.x + (flip ? -B.x : B.x);
    bodyDef.position.y = t.y + B.y;
    bodyDef.angle      = flip ? -B.r : B.r;
    
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(B.w, B.h);
    
    var body      = this.world.CreateBody(bodyDef)
      , fixture   = body.CreateFixture(fixDef);
    
    //Store references in body
    body.SetUserData({
        index:    i
      , creature: name
      , color:    color
    });
    
    //Store
    bodies.push(fixture);
  }
  
  
  var jointDef = new b2RevoluteJointDef;
  jointDef.collideConnected = false;
  
  for(var i=0; i<creature.joints.length; ++i) {
    //Add joint to world
    var J = creature.joints[i];
    jointDef.bodyA = bodies[J.a].GetBody();
    jointDef.bodyB = bodies[J.b].GetBody();
    jointDef.maxMotorTorque = J.p;

    var fix_p = new b2Vec(
        t.x + (flip ? -J.x : J.x)
      , t.y + J.y);
    
    jointDef.localAnchorA = jointDef.bodyA.GetLocalPoint(fix_p);
    jointDef.localAnchorB = jointDef.bodyB.GetLocalPoint(fix_p);
    
    var joint = world.CreateJoint(jointDef);
    joint.SetUserData({
        index:    i
      , creature: name
      , power:    J.p
    });
    
    joints.push(J);
  }

  this.creatures[name] = {
      bodies: bodies
    , joints: joints
  };

  return this.creatures[name];
}

Game.prototype.removeCreature = function(name) {
  if(!(name in this.creatures)) {
    return;
  }

  var C = this.creatures[name];
  for(var i=0; i<C.joints.length; ++i) {
    this.world.DestroyJoint(C.joints[i]);
  }
  for(var i=0; i<C.bodies.length; ++i) {
    this.world.DestroyBody(C.bodies[i]);
  }
  delete this.creatures[name];
}


//Selects a body or joint
Game.prototype.queryBox = function(x0, y0, x1, y1) {
  var result = [];
  
  var aabb = new b2AABB();
  aabb.lowerBound.Set(x0, y0);
  aabb.upperBound.Set(x1, y1);
  
  this.world.QueryAABB(function(fixture) {
    var B = fixture.GetBody();
    if(B.GetType() !== b2Body.b2_staticBody) {
      var ud = B.GetUserData();
      result.push({
          type: "body"
        , index: ud.index
        , creature: ud.creature
      });
    }
  }, aabb);
  
  var cur = this.world.GetJointList();
  while(cur) {
    var anchor = cur.GetAnchorA();
    if(   x0 <= anchor.x && anchor.x <= x1
      &&  y0 <= anchor.y && anchor.y <= y1 ) {
        var ud = cur.GetUserData();
        result.push({
            type: "joint"
          , index: ud.index
          , creature: ud.creature
        });
    }
    cur = cur.GetNext();
  }
  
  return result;
}

Game.prototype.getBody = function(idx, creature) {
  var C = this.creatures[creature];
  if(!C) {
    return null;
  }
  return C.bodies[idx];
}

Game.prototype.getJoint = function(idx, creature) {
  var C = this.creatures[creature];
  if(!C) {
    return null;
  }
  return C.joints[idx];
}

exports.Game = Game;

