var w = window.innerWidth,
  h = window.innerHeight;

var game = new Phaser.Game(w, h, Phaser.CANVAS, 'game', {
  preload: preload,
  create: create,
  update: update,
  render: render
}, true);

function preload() {
  var bmd = game.add.bitmapData(64, 64);
  bmd.ctx.fillStyle = '#ff0000';
  bmd.ctx.arc(32, 32, 32, 0, Math.PI * 2);
  bmd.ctx.fill();
  game.cache.addBitmapData('bad', bmd);

  game.load.image('foe1', 'img/foes/1.png');
  game.load.image('foe2', 'img/foes/2.png');
  game.load.image('foe3', 'img/foes/3.png');
  game.load.image('foe4', 'img/foes/4.png');
  game.load.image('foe5', 'img/foes/5.png');
  game.load.image('foe6', 'img/foes/6.png');
  game.load.image('foe7', 'img/foes/7.png');
  game.load.image('foe8', 'img/foes/8.png');
  game.load.image('foe9', 'img/foes/9.png');
  game.load.image('foe10', 'img/foes/10.png');
  game.load.image('heart', 'img/heart.png');
}

var good_objects,
  bad_objects,
  slashes,
  line,
  scoreLabel,
  score = 0,
  points = [];

var fireRate = 1000;
var nextFire = 0;


function create() {

  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.gravity.y = -150;

  slashes = game.add.graphics(0, 0);
  good_objects = createGoodGroup(128, 128);
  bad_objects = createBadGroup(64, 64);

  console.log(good_objects);

  scoreLabel = game.add.text(10, 10, 'Tip: Get the Foebias!');
  scoreLabel.fill = 'white';

  emitter = game.add.emitter(0, 0, 300);
  emitter.makeParticles('parts');
  emitter.gravity = 300;
  emitter.setYSpeed(-400, 400);

  throwObject();
}

function createGoodGroup(width, height) {
  var group = game.add.group();
  group.enableBody = true;
  group.physicsBodyType = Phaser.Physics.ARCADE;
  for (var i = 1; i < 11; i++) {
    group.createMultiple(1, 'foe' + i);
  }
  group.setAll('checkWorldBounds', true);
  group.setAll('outOfBoundsKill', true);
  group.setAll('width', width);
  group.setAll('height', height);
  return group;
}

function createBadGroup(width, height) {
  var group = game.add.group();
  group.enableBody = true;
  group.physicsBodyType = Phaser.Physics.ARCADE;
  group.createMultiple(10, 'heart');
  group.setAll('checkWorldBounds', true);
  group.setAll('outOfBoundsKill', true);
  group.setAll('width', width);
  group.setAll('height', height);
  return group;
}

function throwObject() {
  if (game.time.now > nextFire && good_objects.countDead() > 0 && bad_objects.countDead() > 0) {
    nextFire = game.time.now + fireRate;
    throwGoodObject();
    if (Math.random()>.5) {
    	throwBadObject();
    }
  }
}

function throwGoodObject() {
  var obj = good_objects.getRandom();
  obj.reset(game.world.centerX + ((Math.random() * 2) - 1) * (game.world.centerX / 2), 0);
  obj.anchor.setTo(0.5, 0.5);
  //obj.body.angularAcceleration = 100;
  game.physics.arcade.moveToXY(obj, game.world.centerX, game.world.centerY, 530);
}

function throwBadObject() {
  var obj = bad_objects.getFirstDead();
  obj.reset(game.world.centerX + ((Math.random() * 2) - 1) * (game.world.centerX / 2), 0);
  obj.anchor.setTo(0.5, 0.5);
  //obj.body.angularAcceleration = 100;
  game.physics.arcade.moveToXY(obj, game.world.centerX, game.world.centerY, 530);
}

function update() {
  throwObject();

  points.push({
    x: game.input.x,
    y: game.input.y
  });
  points = points.splice(points.length - 10, points.length);
  //game.add.sprite(game.input.x, game.input.y, 'hit');

  if (points.length < 1 || points[0].x == 0) {
    return;
  }

  slashes.clear();
  slashes.beginFill(0xFFFFFF);
  slashes.alpha = .5;
  slashes.moveTo(points[0].x, points[0].y);
  for (var i = 1; i < points.length; i++) {
    slashes.lineTo(points[i].x, points[i].y);
  }
  slashes.endFill();

  for (var i = 1; i < points.length; i++) {
    line = new Phaser.Line(points[i].x, points[i].y, points[i - 1].x, points[i - 1].y);
    game.debug.geom(line);

    good_objects.forEachExists(checkIntersects);
    bad_objects.forEachExists(checkIntersects);
  }
}

var contactPoint = new Phaser.Point(0, 0);

function checkIntersects(fruit, callback) {
  var l1 = new Phaser.Line(fruit.x - fruit.width, fruit.y - fruit.height, fruit.x, fruit.y);
  var l2 = new Phaser.Line(fruit.x - fruit.width, fruit.y, fruit.x, fruit.y - fruit.height);
  l2.angle = 90;

  if (Phaser.Line.intersects(line, l1, true) ||
    Phaser.Line.intersects(line, l2, true)) {
    contactPoint.x = game.input.x;
    contactPoint.y = game.input.y;
    var distance = Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y));
    if (Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y)) > 300) {
      return;
    }

    if (fruit.parent == good_objects) {
      killFruit(fruit);
    } else {
      resetScore();
    }
  }

}

function resetScore() {
  var highscore = Math.max(score, localStorage.getItem("highscore"));
  localStorage.setItem("highscore", highscore);

  good_objects.forEachExists(killFruit);
  bad_objects.forEachExists(killFruit);

  score = 0;
  scoreLabel.text = 'Game Over!\nHigh Score: ' + highscore;
  // Retrieve
}

function render() {}

function killFruit(fruit) {

  emitter.x = fruit.x;
  emitter.y = fruit.y;
  emitter.start(true, 2000, null, 4);
  fruit.kill();
  points = [];
  score++;
  scoreLabel.text = 'Score: ' + score;
}
