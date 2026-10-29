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

    // Create NPC list
    this.npcs = [];

    // Spawn NPCs automatically
    this.time.addEvent({
        delay: 2000,
        callback: () => {
            const npcLane = Phaser.Math.Between(0, 2);

            const npc = this.add.triangle(
                this.lanePositions[npcLane], -40, 20, 0, 0, 40, 40, 40, 0x3498db
            );

            this.npcs.push(npc);
        },
        loop: true
    });

    // Set up keyboard controls
    this.moveKeys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.cursors = this.input.keyboard.createCursorKeys();
}

function update(time, delta) {
    // Scroll the road text
    const roadSpeed = 200;

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

        // Move the NPC
        npc.y += 200 * (delta / 1000);

        // Check collision with player
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);

        if (distance < 35) {
            this.npcs.splice(i, 1);

            if (time < this.ramUntil) {
                // Ram the NPC off screen
                this.tweens.add({
                    targets: npc,
                    x: npc.x + this.ramDirection * 600,
                    angle: this.ramDirection * 540,
                    duration: 400,
                    ease: 'Cubic.easeOut',
                    onComplete: () => npc.destroy()
                });

                console.log("NPC rammed!");
            } else {
                // Normal collision
                npc.destroy();
                console.log("Player hit!");
            }
        }

        // Remove NPC outside the screen
        if (npc.y > 640) {
            npc.destroy();
            this.npcs.splice(i, 1);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);
