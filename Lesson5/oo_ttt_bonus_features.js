let readline = require("readline-sync");

class Square {
  static UNUSED_SQUARE = " ";
  static HUMAN_MARKER = "X";
  static COMPUTER_MARKER = "O";

  constructor(marker = Square.UNUSED_SQUARE) {
    this.marker = marker;
  }

  toString() {
    return this.marker;
  }

  getMarker() {
    return this.marker;
  }

  setMarker(marker) {
    this.marker = marker;
  }

  isUnused() {
    return this.marker === Square.UNUSED_SQUARE;
  }
}

class Board {
  constructor() {
    this.reset();
  }

  reset() {
    this.squares = {};
    for (let counter = 1; counter <= 9; ++counter) {
      this.squares[counter] = new Square();
    }
  }

  display() {
    console.log("");
    console.log("     |     |");
    console.log(`  ${this.squares["1"]}  |  ${this.squares["2"]}  |  ${this.squares["3"]}`);
    console.log("     |     |");
    console.log("-----+-----+-----");
    console.log("     |     |");
    console.log(`  ${this.squares["4"]}  |  ${this.squares["5"]}  |  ${this.squares["6"]}`);
    console.log("     |     |");
    console.log("-----+-----+-----");
    console.log("     |     |");
    console.log(`  ${this.squares["7"]}  |  ${this.squares["8"]}  |  ${this.squares["9"]}`);
    console.log("     |     |");
    console.log("");
  }

  displayWithClear() {
    console.clear();
    console.log('');
    console.log('');
    this.display();
  }

  markSquareAt(key, marker) {
    this.squares[key].setMarker(marker);
  }

  unusedSquares() {
    let keys = Object.keys(this.squares);
    return keys.filter(key => this.squares[key].isUnused());
  }

  isUnusedSquare(key) {
    return this.squares[key].isUnused();
  }

  isFull() {
    return this.unusedSquares().length === 0;
  }

  countMarkersFor(player, keys) {
    let markers = keys.filter(key => {
      return this.squares[key].getMarker() === player.getMarker();
    });

    return markers.length;
  }
}

class Player {
  constructor(marker) {
    this.marker = marker;
    this.score = 0;
  }

  getMarker() {
    return this.marker;
  }

  incrementScore() {
    this.score += 1;
  }

  getScore() {
    return this.score;
  }
}

class Human extends Player {
  constructor() {
    super(Square.HUMAN_MARKER);
  }
}

class Computer extends Player {
  constructor() {
    super(Square.COMPUTER_MARKER);
  }
}

class TTTGame {
  constructor() {
    this.board = new Board();
    this.human = new Human();
    this.computer = new Computer();
  }

  static CENTER_SQUARE = '5';
  static MATCH_GOAL = 3;
  static FULL_ROW = 3;
  static TWO_OF_THREE = 2;

  static POSSIBLE_WINNING_ROWS = [
    [ "1", "2", "3" ],            // top row of board
    [ "4", "5", "6" ],            // center row of board
    [ "7", "8", "9" ],            // bottom row of board
    [ "1", "4", "7" ],            // left column of board
    [ "2", "5", "8" ],            // middle column of board
    [ "3", "6", "9" ],            // right column of board
    [ "1", "5", "9" ],            // diagonal: top-left to bottom-right
    [ "3", "5", "7" ],            // diagonal: bottom-left to top-right
  ]

  static joinOr(array, delimiter = ', ', word = 'or') {
    let result = '';
    let lastChoice = array.length - 1;

    if (array.length < 2) {
      result += array.join();
    } else if (array.length === 2) {
      result += array[0] + ' ' + word + ' ' + array[1];
    } else {
      for (let idx = 0; idx < lastChoice; idx += 1) {
        result += array[idx] + delimiter;
      }
    }

    if (array.length > 2) {
      result += word + ' ' + array[lastChoice];
    }

    return result;
  }

  play() {
    this.displayWelcomeMessage();
    this.playMatch();
    this.displayGoodbyeMessage();
  }

  playOneGame() {
    this.board.reset();
    this.board.display();

    while (true) {
      this.humanMoves();
      if (this.gameOver()) break;

      this.computerMoves();
      if (this.gameOver()) break;

      this.board.displayWithClear();
    }

    this.board.displayWithClear();
    this.displayGameResults();
  }

  playMatch() {
    console.log(`First player to win ${TTTGame.MATCH_GOAL} games wins the match.`);

    while (true) {
      this.playOneGame();
      this.tallyMatchScore();
      this.displayMatchScore();

      if (this.someoneWonMatch()) break;
      if (!this.playAgain()) break;
      console.log(`Let's play again!`);
    }

    this.declareMatchWinner();
  }

  displayWelcomeMessage() {
    console.clear();
    console.log(`Welcome to Tic Tac Toe!`);
    console.log('');
  }

  displayGoodbyeMessage() {
    console.log(`Thanks for playing Tic Tac Toe! Goodbye!`);
  }

  humanMoves() {
    let choice;

    while (true) {
      let validChoices = this.board.unusedSquares();
      const prompt = `Choose a square (${TTTGame.joinOr(validChoices)}): `;
      choice = readline.question(prompt);

      if (validChoices.includes(choice)) break;

      console.log("Sorry, that's not a valid selection");
      console.log('');
    }

    this.board.markSquareAt(choice, this.human.getMarker());
  }

  computerMoves() {
    let choice = this.offensiveComputerMove();
    if (!choice) {
      choice = this.defensiveComputerMove();
    }

    if (!choice) {
      choice = this.pickCenterSquare();
    }

    if (!choice) {
      choice = this.pickRandomSquare();
    }

    this.board.markSquareAt(choice, this.computer.getMarker());
  }

  offensiveComputerMove() {
    return this.findCriticalSquare(this.computer);
  }

  defensiveComputerMove() {
    return this.findCriticalSquare(this.human);
  }

  pickCenterSquare() {
    return this.board.isUnusedSquare(TTTGame.CENTER_SQUARE) ?
      TTTGame.CENTER_SQUARE : null;
  }

  pickRandomSquare() {
    let validChoices = this.board.unusedSquares();
    let choice;

    do {
      choice = Math.floor((9 * Math.random()) + 1).toString();
    } while (!validChoices.includes(choice));

    return choice;
  }

  findCriticalSquare(player) {
    for (let index = 0; index < TTTGame.POSSIBLE_WINNING_ROWS.length; ++index) {
      let row = TTTGame.POSSIBLE_WINNING_ROWS[index];
      let key = this.criticalSquare(player, row);
      if (key) return key;
    }

    return null;
  }

  criticalSquare(player, row) {
    if (this.board.countMarkersFor(player, row) === TTTGame.TWO_OF_THREE) {
      let index = row.findIndex(key => this.board.isUnusedSquare(key));
      if (index >= 0) return row[index];
    }

    return null;
  }

  displayGameResults() {
    if (this.isGameWinner(this.human)) {
      console.log("You won! Congratulations!");
    } else if (this.isGameWinner(this.computer)) {
      console.log("I won! I won! Take that, human!");
    } else {
      console.log("A tie game. How boring.");
    }
  }

  isGameWinner(player) {
    return TTTGame.POSSIBLE_WINNING_ROWS.some(row => {
      return this.board.countMarkersFor(player, row) === TTTGame.FULL_ROW;
    });
  }

  gameOver() {
    return this.board.isFull() || this.someoneWonGame();
  }


  someoneWonGame() {
    return this.isGameWinner(this.human) || this.isGameWinner(this.computer);
  }

  someoneWonMatch() {
    return this.isMatchWinner(this.human) || this.isMatchWinner(this.computer);
  }

  isMatchWinner(player) {
    return player.getScore() === TTTGame.MATCH_GOAL;
  }

  tallyMatchScore() {
    if (this.isGameWinner(this.human)) {
      this.human.incrementScore();
    }

    if (this.isGameWinner(this.computer)) {
      this.computer.incrementScore();
    }
  }

  displayMatchScore() {
    console.log(`*** SCORE FOR BEST-OF-5-GAME MATCH ***`);
    console.log(`Human: ${this.human.getScore()}   Computer: ${this.computer.getScore()}`);
  }

  declareMatchWinner() {
    if (this.isMatchWinner(this.human)) {
      console.log(`Human is champion in best-of-5-game match.`);
    }

    if (this.isMatchWinner(this.computer)) {
      console.log(`Computer is champion in best-of-5-game match.`);
    }
  }

  playAgain() {
    let result = readline.question(`Play again? ('y' or 'n'): `).toLowerCase();
    while (!this.validAnswer(result)) {
      result = readline.question(`Please enter (y)es or (n)o: `).toLowerCase();
    }

    return result[0] === 'y';
  }

  validAnswer(response) {
    return ['y', 'n', 'yes', 'no'].includes(response);
  }
}

let game = new TTTGame();
game.play();