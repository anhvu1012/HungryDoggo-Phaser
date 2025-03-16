const canvasSize = {
  width: 500,
  height: 500
}

// DOM 
const gameStartButton = document.getElementById('startGame');
const gameStartDiv = document.getElementById('startGameDiv');
const gameEndDiv = document.getElementById('endGameDiv');
const endGameStatus = document.getElementById('endGameStatus');
const endScore = document.getElementById('endGameScore');

class GameScene extends Phaser.Scene{
  constructor(){
    super('scene-game');

    // Hund
    this.player;
    this.playerSpeed = 240;
    this.cursors;
    this.direction = 1; // Richtung rechts
    this.isHurt = false;

    // Lebenssystem
    this.lifeFull = 5;
    this.remainingLife = 5;
    this.hearts = [];
    
    // Futter
    this.drumstick;
    this.chocolate;
    this.isChocolateFalling = false;

    // unsichtbare Collider-Box
    this.groundYPos;
    this.groundHeight;
    this.ground;
    
    // Musik, Sound
    this.crunch;
    this.bg_music;
    
    // Timer
    this.timeEvent;
    this.remainingTime;
    this.textTime;
    
    // Punktzahl
    this.points = 0;
    this.scoreText;
  }

  preload(){
    this.load.image('bg', 'assets/bg.png');
    this.load.image('drumstick', 'assets/chicken_drumstick.png');
    this.load.image('chocolate', 'assets/icecream.png');
  
    this.load.spritesheet('dog', 'assets/Dog/dog_sprite_sheet.png', {
      frameWidth: 48, 
      frameHeight: 48
    });

    this.load.image('heart_full', 'assets/heart_full.png');
    this.load.image('heart_empty', 'assets/heart_empty.png');
  
    this.load.audio('crunch', 'assets/sound/crunch.mp3');
    this.load.audio('bg_music', 'assets/sound/bg_music(edit).mp3');
  }

  create(){
    // Spiel beim Start pausieren
    this.scene.pause('scene-game');
  
    // Musik hinzufügen
    this.crunch = this.sound.add('crunch');
    this.bg_music = this.sound.add('bg_music');
    this.bg_music.setLoop(true);
    this.bg_music.setVolume(0.1);
    // Musik abspielen
    this.bg_music.play();
  
    this.add.image(0, 0, 'bg').setOrigin(0, 0).setDisplaySize(500, 500);

    // Lebenssystem
    for (let i = 0; i < this.lifeFull; i++){
      this.add.image(10 + i*25, 40, 'heart_empty').setOrigin(0, 0).setDisplaySize(25, 25);
    }

    for (let i = 0; i < this.remainingLife; i++){
      const heart = this.add.image(10 + i*25, 40, 'heart_full').setOrigin(0, 0).setDisplaySize(25, 25);
      this.hearts.push(heart);
    }
  
    // Hund
    this.player = this.physics.add.sprite(210, 342, 'dog').setOrigin(0, 0);
    this.player.setDisplaySize(80, 80).refreshBody();
    // Collider-Größe festlegen
    this.player.setSize(23, 33).setOffset(12, 15);
    this.player.setCollideWorldBounds(true);
    // Dies sollte dynamisch sein, jedoch nicht von der Schwerkraft beeinflusst werden.
    this.player.setImmovable(true);
    this.player.body.allowGravity = false;
  
    // Animationen für den Hund
    this.anims.create({
      key: 'idle_right',
      frames: this.anims.generateFrameNumbers('dog', {start: 0, end: 3}),
      frameRate: 5,
      repeat: -1
    });
  
    this.anims.create({
      key: 'idle_left',
      frames: this.anims.generateFrameNumbers('dog', {start: 6, end: 9}),
      frameRate: 5,
      repeat: -1
    });
  
    this.anims.create({
      key: 'walk_right',
      frames: this.anims.generateFrameNumbers('dog', {start: 12, end: 17}),
      frameRate: 12,
      repeat: -1
    });
  
    this.anims.create({
      key: 'walk_left',
      frames: this.anims.generateFrameNumbers('dog', {start: 18, end: 23}),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'hurt',
      frames: this.anims.generateFrameNumbers('dog', {start: 29, end: 31}),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: 'death',
      frames: this.anims.generateFrameNumbers('dog', {start: 24, end: 27}),
      frameRate: 4,
      repeat: 0
    });
  
    // Hähnchenkeule Eigenschaften
    this.drumstick = this.physics.add.image(0, 0, 'drumstick');
    this.drumstick.setDisplaySize(30, 30);
    this.drumstick.setGravityY(981);
    this.drumstick.setBounce(0.3);
    this.drumstick.setCollideWorldBounds(true);
    this.drumstick.bounceCount = 0;

    // Schokolade Eigenschaften
    this.chocolate = this.physics.add.image(0, 0, 'chocolate');
    this.chocolate.setDisplaySize(30, 30);
    this.chocolate.setBounce(0.3);
    this.chocolate.setCollideWorldBounds(true);
    this.chocolate.bounceCount = 0;
    this.chocolate.setVisible(false);
  
    // unsichtbarer Box-Collider, auf den Drumstick fallen kann
    this.groundYPos = this.player.y + this.player.displayHeight;
    this.groundHeight = 50;
    this.ground = this.add.zone(0, this.groundYPos, canvasSize.width, this.groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground);
    this.ground.body.setImmovable(true);
    this.ground.body.setAllowGravity(false);

    // Kollision zwischen Hähnchenkeule und Boden
    this.physics.add.collider(this.drumstick, this.ground, this.onBounceDrumstick, null, this);
    //Kollision zwischen Schokolade und Boden
    this.physics.add.collider(this.chocolate, this.ground, this.onBounceChocolate, null, this);
  
    // Kollision mit dem Hund
    this.physics.add.overlap(this.drumstick, this.player, this.collectDrumstick, null, this);
    this.physics.add.overlap(this.chocolate, this.player, this.collectChocolate, null, this);
  
    // Eingaben
    this.cursors = this.input.keyboard.createCursorKeys();
  
    // Countdown 30s
    this.timeEvent = this.time.delayedCall(30000, this.gameOver, [], this);
  
    // Text anzeigen
    this.textTime = this.add.text(275, 10, 'Remaining Time: 00', {
      font: '700 25px Fredoka',
      fill: 'white'
    });
  
    this.scoreText = this.add.text(10, 10, 'Score: 0', {
      font: '700 25px Fredoka',
      fill: 'white'
    });
  }

  update(){
    if (this.remainingLife===0){
      // Timer 1s
      this.player.anims.play('death', true);
      this.time.delayedCall(1000, () => {
        this.gameOver();
      });
    }

    this.hearts.forEach(heart => heart.destroy());
    for (let i = 0; i < this.remainingLife; i++){
      const heart = this.add.image(10 + i*25, 40, 'heart_full').setOrigin(0, 0).setDisplaySize(25, 25);
      this.hearts.push(heart);
    }

    // verbleibende Zeit aktualisieren
    this.remainingTime = this.timeEvent.getRemainingSeconds();
    this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`);

    if (!this.isChocolateFalling && this.remainingTime <= 15){
      this.isChocolateFalling = true;
      this.chocolate.setGravityY(981);
      this.chocolate.setVisible(true);
    }
  
    if(this.isHurt){
      return;
    }
    // Bewegungen und Animationen des Hundes kontrollieren
    if (this.cursors.left.isDown){
      this.player.setVelocityX(-this.playerSpeed);
      this.player.anims.play('walk_left', true);
      this.direction = -1;
    } else if (this.cursors.right.isDown){
      this.player.setVelocityX(this.playerSpeed);
      this.player.anims.play('walk_right', true);
      this.direction = 1;
    } else {
      this.setIdle();
    }
  }

  setIdle(){
    this.isHurt = false;
    this.player.setVelocityX(0);
    this.player.anims.play(this.direction === 1 ? 'idle_right' : 'idle_left', true);
  }

  setHurt(){
    this.isHurt = true;
    this.player.setVelocityX(0);
    this.player.anims.play('hurt', true);

    // Timer 1s
    this.time.delayedCall(1000, () => {
      this.setIdle();
    });
  }

  collectDrumstick(){
    this.crunch.play();
    this.resetDrumstick();
    this.points++;
    this.scoreText.setText(`Score: ${this.points}`);
  }

  collectChocolate(){
    this.setHurt();
    this.resetChocolate();
    this.points--;
    this.remainingLife--;
    this.scoreText.setText(`Score: ${this.points}`);
  }

  onBounceDrumstick(drumstick, ground){
    this.drumstick.bounceCount++;
    if (this.drumstick.bounceCount >= 2){
      this.resetDrumstick();
    }
  }

  onBounceChocolate(chocolate, ground){
    this.chocolate.bounceCount++;
    if (this.chocolate.bounceCount >= 2){
      this.resetChocolate();
    }
  }

  resetDrumstick(){
    this.drumstick.bounceCount = 0;
    this.drumstick.setVelocityY(0);
    this.drumstick.setY(0);
    this.drumstick.setX(this.getRandomX());
  }

  resetChocolate(){
    this.chocolate.bounceCount = 0;
    this.chocolate.setVelocityY(0);
    this.chocolate.setY(0);
    this.chocolate.setX(this.getRandomX());
  }

  getRandomX(){
    return Math.floor(Math.random() * 480);
  }

  gameOver(){
    // Spielszene zerstören
    this.sys.game.destroy(true);

    if (this.points >= 15){
      endGameStatus.style.color = '#28A745';
      endGameStatus.innerHTML = 'YOU WIN';
    } else {
      endGameStatus.style.color = '#DC3545';
      endGameStatus.innerHTML = 'YOU LOSE';
    }
  
    endScore.innerHTML = this.points;
    gameEndDiv.style.display = 'flex';
  }
}

const config = {
  type: Phaser.AUTO,
  width: canvasSize.width,
  height: canvasSize.height,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: GameScene,
};

const game = new Phaser.Game(config);

gameStartButton.addEventListener('click', () => {
  gameStartDiv.style.display = 'none';
  gameEndDiv.style.display = 'none';
  game.scene.resume('scene-game'); // Spiel wird vorher pausiert
});