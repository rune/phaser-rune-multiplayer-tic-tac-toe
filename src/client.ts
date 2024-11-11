import "./styles.css";

import Phaser from "phaser";
import selectSoundAudio from "./assets/select.wav";
import xAssetUrl from "./assets/x.svg";
import oAssetUrl from "./assets/o.svg";

// for a more complete physics based example check out
// the Rune Phaser Tech Demo https://developers.rune.ai/blog/phaser/

// simple example for Phaser and Rune combined
class TicTacToe extends Phaser.Scene {
  boardPosition = { x: window.innerWidth / 20, y: window.innerHeight / 20 };
  cellSize: number = window.innerWidth * 0.3;
  addedPlayers: boolean = false;
  playerId1: string = "";
  playerId2: string = "";
  localPlayerId: string = "";
  cellImages: Phaser.GameObjects.Image[] = [];
  ourTurn: boolean = false;

  player1Group?: Phaser.GameObjects.Group;
  player2Group?: Phaser.GameObjects.Group;
  lastMovePlayerId: string = "";
  tapToPlayMessage?: Phaser.GameObjects.Text;

  preload() {
    this.load.image("x", xAssetUrl);
    this.load.image("o", oAssetUrl);
    this.load.audio("select", selectSoundAudio);
  }

  create() {
    // create the board lines
    for (let i = 0; i < 2; i++) {
      const verticalLine = this.add.line(
        this.boardPosition.x + this.cellSize + i * this.cellSize,
        this.boardPosition.y,
        0,
        0,
        0,
        this.cellSize * 3,
        0xe6e6e6,
        0.5,
      );
      verticalLine.setLineWidth(3);
      verticalLine.setOrigin(0, 0);
      const horizontalLine = this.add.line(
        this.boardPosition.x,
        this.boardPosition.y + this.cellSize + i * this.cellSize,
        0,
        0,
        this.cellSize * 3,
        0,
        0xe6e6e6,
        0.5,
      );
      horizontalLine.setLineWidth(3);
      horizontalLine.setOrigin(0, 0);
    }

    this.tapToPlayMessage = this.add.text(
      window.innerWidth / 2,
      this.boardPosition.y + this.cellSize * 1.5,
      "Tap To Play",
      {
        fontFamily: "Arial",
        fontSize: 30,
        align: "center",
        wordWrap: { width: this.cellSize, useAdvancedWrap: true },
      },
    );
    this.tapToPlayMessage?.setOrigin(0.5, 0.5);
    this.tapToPlayMessage.setVisible(false);
    this.tweens.add({
      targets: [this.tapToPlayMessage],
      ease: "Linear",
      scaleX: 0.5,
      scaleY: 0.5,
      repeat: -1,
      duration: 500,
      yoyo: true,
    });

    if (this.input.mouse) {
      // when the user presses down on a cell we'll send the logic a
      // request to claim the cell
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (this.ourTurn) {
          const cellX = Math.floor(
            (pointer.x - this.boardPosition.x) / this.cellSize,
          );
          const cellY = Math.floor(
            (pointer.y - this.boardPosition.y) / this.cellSize,
          );

          Rune.actions.claimCell(cellX + cellY * 3);
        }
      });
    }

    Rune.initClient({
      onChange: ({ game, yourPlayerId, action, allPlayerIds, event }) => {
        console.log(action, event)
        const { cells, lastMovePlayerId } = game;

        // we're starting a new game so reset everything in the UI
        // other than the board lines
        if (event && event.name === "stateSync" && event.isNewGame) {
          this.addedPlayers = false;
          this.cellImages.forEach((img) => img.destroy());
          this.player1Group?.clear(true, true);
          this.player2Group?.clear(true, true);
          this.cellImages = [];
        }

        // work out whose turn it is - either not the last player
        // or player 0
        this.lastMovePlayerId = lastMovePlayerId ?? allPlayerIds[1];

        this.ourTurn = false;
        if (
          yourPlayerId &&
          yourPlayerId !== (lastMovePlayerId ?? allPlayerIds[1])
        ) {
          this.ourTurn = true;
        }

        // if we haven't set up the UI for the players then create
        // images for the players and their associated pieces
        if (!this.addedPlayers) {
          this.addedPlayers = true;

          this.playerId1 = allPlayerIds[0];
          this.playerId2 = allPlayerIds[1];
          this.localPlayerId = yourPlayerId ?? "";

          this.load.once("complete", this.addPlayerImages, this);
          this.load.image(
            "player1",
            Rune.getPlayerInfo(this.playerId1).avatarUrl,
          );
          this.load.image(
            "player2",
            Rune.getPlayerInfo(this.playerId2).avatarUrl,
          );
          this.load.start();
        }

        this.updatePlayerStatus();

        // for any cell that has been set make sure we have an image
        // for the move on the board
        for (let i = 0; i < 9; i++) {
          if (cells[i] && !this.cellImages[i]) {
            const x = i % 3;
            const y = Math.floor(i / 3);

            const placed = this.add.image(
              this.boardPosition.x + x * this.cellSize + this.cellSize / 2,
              this.boardPosition.y + y * this.cellSize + this.cellSize / 2,
              cells[i] === this.playerId1 ? "x" : "o",
            );
            placed.setScale((this.cellSize * 0.8) / placed.width);
            this.cellImages[i] = placed;
            // play a sound effect each time a cell is placed
            this.sound.play("select");
          }
        }

        // only show the tap to play message if its our turn and
        // and no pieces have been played
        if (this.tapToPlayMessage) {
          this.tapToPlayMessage.setVisible(
            this.cellImages.length === 0 && this.ourTurn,
          );
        }
      },
    });
  }

  updatePlayerStatus(): void {
    // highlight whose turn it is
    if (this.player1Group && this.player2Group) {
      (this.lastMovePlayerId === this.playerId1
        ? this.player1Group
        : this.player2Group
      ).setAlpha(0.5);
      (this.lastMovePlayerId === this.playerId2
        ? this.player1Group
        : this.player2Group
      ).setAlpha(1);
    }
  }

  addPlayerImages(): void {
    // set up the player names, avatars and piece markers
    // at the bottom of the screen
    const xMarker = this.add.image(
      window.innerWidth * 0.25,
      window.innerHeight * 0.7,
      "x",
    );
    xMarker.setScale(window.innerWidth / 7 / xMarker.width);
    const oMarker = this.add.image(
      window.innerWidth * 0.75,
      window.innerHeight * 0.7,
      "o",
    );
    oMarker.setScale(window.innerWidth / 7 / oMarker.width);

    const player1Marker = this.add.image(
      window.innerWidth * 0.25,
      window.innerHeight * 0.8,
      "player1",
    );
    player1Marker.setScale(window.innerWidth / 5 / player1Marker.width);
    const player1Text = this.add.text(
      window.innerWidth * 0.25,
      window.innerHeight * 0.88,
      Rune.getPlayerInfo(this.playerId1).displayName,
      { fontFamily: "Arial", fontSize: 14 },
    );
    player1Text.setOrigin(0.5, 0);
    const player2Marker = this.add.image(
      window.innerWidth * 0.75,
      window.innerHeight * 0.8,
      "player2",
    );
    player2Marker.setScale(window.innerWidth / 5 / player2Marker.width);
    const player2Text = this.add.text(
      window.innerWidth * 0.75,
      window.innerHeight * 0.88,
      Rune.getPlayerInfo(this.playerId2).displayName,
      { fontFamily: "Arial", fontSize: 14 },
    );
    player2Text.setOrigin(0.5, 0);

    let youText: Phaser.GameObjects.Text | undefined = undefined;

    if (this.localPlayerId !== "") {
      youText = this.add.text(
        window.innerWidth *
          (this.localPlayerId === this.playerId1 ? 0.25 : 0.75),
        window.innerHeight * 0.91,
        "(You)",
        { fontFamily: "Arial", fontSize: 14 },
      );
      youText.setOrigin(0.5, 0);
    }

    this.player1Group = this.add.group([xMarker, player1Marker, player1Text]);
    this.player2Group = this.add.group([oMarker, player2Marker, player2Text]);

    if (youText) {
      (this.localPlayerId === this.playerId1
        ? this.player1Group
        : this.player2Group
      ).add(youText);
    }

    this.updatePlayerStatus();
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#333",
  scene: TicTacToe,
};

new Phaser.Game(config);
