function preload() {
}

function create() {
    const road = this.add.graphics();

    // Draw the road
    road.lineStyle(4, 0x000000);

    road.lineBetween(250, 0, 250, 600);
    road.lineBetween(350, 0, 350, 600);
    road.lineBetween(450, 0, 450, 600);
    road.lineBetween(550, 0, 550, 600);

    // Create scrolling road text
    this.roadTexts = [];
    const textXPositions = [300, 400, 500];

    for (let lane = 0; lane < textXPositions.length; lane++) {
        for (let i = 0; i < 4; i++) {
            const text = this.add.text(textXPositions[lane], i * 200 - 100, 'ROAD', {
                fontSize: '28px',
                color: '#000000',
                fontStyle: 'bold'
            });

            text.setOrigin(0.5);
            this.roadTexts.push(text);
        }
    }

    // Create the player
    this.lanePositions = [300, 400, 500];
    this.playerLane = 1;

    this.player = this.add.circle(400, 480, 20, 0xffd700);

    // Set up ramming
    this.ramUntil = 0;
    this.ramDirection = 0;

    // Set up score
    this.score = 0;

    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
        fontSize: '26px',
        color: '#000000',
        fontStyle: 'bold'
    });

    // Create score HUD notification
    this.scoreHudChangeText = this.add.text(this.scoreText.x + this.scoreText.width + 12, 20, '', {
        fontSize: '24px',
        color: '#239b56',
        fontStyle: 'bold'
    });
    

    // Set up speed
    this.speed = 50;
    this.maxSpeed = 100;

    // Set up natural acceleration
    this.nextSpeedIncreaseTime = this.time.now + 10000;

    this.speedText = this.add.text(20, 60, 'SPEED: 50/100', {
        fontSize: '26px',
        color: '#000000',
        fontStyle: 'bold'
    });

    // Create score notification
    this.scoreChangeText = this.add.text(400, 250, '', {
        fontSize: '32px',
        color: '#239b56',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Create speed notification
    this.speedChangeText = this.add.text(this.speedText.x + this.speedText.width + 12, 60, '', {
        fontSize: '24px',
        color: '#3498db',
        fontStyle: 'bold'
    });

    // Show temporary notifications
    this.showChange = (label, message, color) => {
        label.setText(message);
        label.setColor(color);

        label.noticeId = (label.noticeId || 0) + 1;
        const noticeId = label.noticeId;

        this.time.delayedCall(1000, () => {
            if (label.noticeId === noticeId) {
                label.setText('');
            }
        });
    };

    // Create NPC list
    this.npcs = [];

    // Calculate random spawn delay
    const getSpawnDelay = () => {
        const randomDelay = Phaser.Math.Between(1200, 2200);
        const speedFactor = 50 / Math.max(10, this.speed);

        // Base Spawn rate
        const baseDelay = randomDelay * speedFactor;
        const baseSpawnRate = 1000 / baseDelay;

        // Increase spawn rate by points
        const scoreTier = Math.floor((this.score ?? 0) / 10);
        const bonusSpawnRate = scoreTier * 0.12;

        // Calculate final spawn delay
        const finalSpawnRate = baseSpawnRate + bonusSpawnRate;
        return 1000 / finalSpawnRate;
    };

    // Spawn NPCs
    const spawnNPC = () => {
        // Stop spawning after game over
        if (this.gameOver) return;

        const npcLane = Phaser.Math.Between(0, 2);

        const npc = this.add.triangle(this.lanePositions[npcLane], -40, 20, 0, 0, 40, 40, 40, 0x3498db);

        // Set random NPC speed
        npc.relativeSpeed = Phaser.Math.Between(60, 140);

        this.npcs.push(npc);

        // Schedule the next NPC
        this.time.delayedCall(getSpawnDelay(), spawnNPC);
    };

    // Start NPC spawning
    this.time.delayedCall(getSpawnDelay(), spawnNPC);

    // Set up keyboard controls
    this.moveKeys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    // Set up game over
    this.gameOver = false;

    this.endGame = () => {
        if (this.gameOver) return;

        this.gameOver = true;

        // Dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(100);

        // Game over title
        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '52px',
            color: '#ff5555',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        // Show final score
        this.add.text(400, 285, 'FINAL SCORE: ' + this.score, {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        // Create restart button
        const restartButton = this.add.rectangle(400, 380, 220, 60, 0xffd700).setDepth(101);

        this.add.text(400, 380, 'RESTART', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(102);

        // Restart the game
        restartButton.setInteractive({ useHandCursor: true });
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}

function update(time, delta) {
    // Stop updating after game over
    if (this.gameOver) return;

    // Scroll the road text
    const roadSpeed = this.speed * 4 + Math.max(0, this.speed - 50) * 8;

    for (const text of this.roadTexts) {
        text.y += roadSpeed * (delta / 1000);

        if (text.y > 700) {
            text.y -= 800;
        }
    }

    // Check movement input
    const moveLeft = Phaser.Input.Keyboard.JustDown(this.moveKeys.left) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.left);
    
    const moveRight = Phaser.Input.Keyboard.JustDown(this.moveKeys.right) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.right);
    
    // Switch lanes and active ramming
    if (moveLeft && this.playerLane > 0) {
        this.playerLane--;
        this.ramDirection = -1;
        this.ramUntil = time + 150;
    } else if (moveRight && this.playerLane < 2) {
        this.playerLane++;
        this.ramDirection = 1;
        this.ramUntil = time + 150;
    }

    // Update player position
    this.player.x = this.lanePositions[this.playerLane];

    // Update NPCs
    for (let i = this.npcs.length - 1; i >= 0; i--) {
        const npc = this.npcs[i];

        // Move NPC with independent speed
        const npcSpeed = npc.relativeSpeed;

        npc.y += (roadSpeed + npcSpeed) * (delta / 1000);

        // Check collision with player
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);

        if (distance < 35) {
            this.npcs.splice(i, 1);

            if (time < this.ramUntil) {
                // Add score
                const previousScore = this.score;

                this.score += 5;
                this.scoreText.setText('SCORE: ' + this.score);

                // Show score change
                this.showChange(this.scoreChangeText, '+5', '#239b56');

                // Show score HUD change
                this.scoreHudChangeText.x = this.scoreText.x + this.scoreText.width + 12;
                this.showChange(this.scoreHudChangeText, '+5', '#239b56');

                // Increase speed by points
                const previousTier = Math.floor(previousScore / 10);
                const currentTier = Math.floor(this.score / 10);

                if (currentTier > previousTier) {
                    // Reward speed
                    const oldSpeed = this.speed;
                    this.speed = Math.min(this.maxSpeed, this.speed + (currentTier - previousTier));

                    this.speedText.setText('SPEED: ' + this.speed + '/' + this.maxSpeed);

                    // Show speed gain
                    const gainedChange = this.speed - oldSpeed;

                    if (gainedChange > 0) {
                        this.showChange(this.speedChangeText, '+' + gainedChange, '#3498db');
                    }
                }

                // Ram the NPC off screen
                this.tweens.add({
                    targets: npc,
                    x: npc.x + this.ramDirection * 600,
                    angle: this.ramDirection * 540,
                    duration: 400,
                    ease: 'Cubic.easeOut',
                    onComplete: () => npc.destroy()
                });

                console.log("NPC rammed! Score: " + this.score);
            } else {
                // Normal collision
                npc.destroy();

                // Reduce speed
                const oldSpeed = this.speed;
                
                this.speed = Math.max(0, this.speed -10);
                this.speedText.setText('SPEED: ' + this.speed + '/' + this.maxSpeed);

                // Show speed loss
                this.showChange(this.speedChangeText, '-' + (oldSpeed - this.speed), '#e74c3c');

                // Reset natural acceleration timer
                this.nextSpeedIncreaseTime = time + 10000;

                console.log("Player hit! Speed: " + this.speed);

                // Check game over
                if (this.speed <= 0) {
                    this.endGame();
                    return;
                }
            }
        }

        // Remove NPC outside the screen
        if (npc.y > 640) {
            npc.destroy();
            this.npcs.splice(i, 1);
        }
    }

    // Natural acceleration
    if (this.speed > 0 && this.speed < this.maxSpeed && time >= this.nextSpeedIncreaseTime) {
        this.speed = Math.min(this.maxSpeed, this.speed + 1);
        this.speedText.setText('SPEED: ' + this.speed + '/' + this.maxSpeed);

        // Show natural speed gain
        this.showChange(this.speedChangeText, '+1', "#3498db");

        this.nextSpeedIncreaseTime += 5000;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);
