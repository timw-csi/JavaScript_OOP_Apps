//Going to use JavaScript PseudoClassical approach for this exercise.

const readline = require("readline-sync");

function Deck() {
  this.initialize();
}

Deck.SUITS = ['H', 'S', 'D', 'C'];
Deck.CARDS = ['2', '3', '4', '5','6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

Deck.prototype.initialize = function() {
  this.cards = [];

  for (let suit = 0; suit < Deck.SUITS.length; ++suit) {
    let SUITS = Deck.SUITS;
    for (let card = 0; card < Deck.CARDS.length; ++card) {
      let CARDS = Deck.CARDS;
      this.cards.push([CARDS[card], SUITS[suit]]);
    }
  }

  this.shuffle(this.cards);
};

Deck.prototype.shuffle = function(deck) {
  let lastCard = deck.length - 1;

  for (let index = lastCard; index > 0; --index) {
    let otherIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[otherIndex]] = [deck[otherIndex], deck[index]];
  }
};

Deck.prototype.deal = function(competitor, amount) {
  for (let count = 0; count < amount; ++count) {
    let card = this.cards.shift();

    competitor.hand.push(card);
  }
};

function Participant(name) {
  this.name = name;
  this.reset();
}

Participant.BUST_LIMIT = 21;
Participant.FACE_CARD_VALUE = 10;
Participant.LOW_ACE_VALUE = 1;
Participant.HIGH_ACE_VALUE = 11;
Participant.ACE_DIFFERENTIAL = 10;
Participant.INITIAL_HAND_SIZE = 2;

Participant.prototype.reset = function() {
  this.score = 0;
  this.hand = [];
};

Participant.prototype.computeScore = function() {
  let values = this.hand.map(card => card[0]);

  let sum = 0;

  values.forEach(value => {
    if (value === 'A') {
      sum += Participant.HIGH_ACE_VALUE;
    } else if (['J', 'Q', 'K'].includes(value)) {
      sum += Participant.FACE_CARD_VALUE;
    } else sum += Number(value);
  });

  //correct for Aces
  values.filter(value => value === 'A').forEach(_ => {
    if (sum > Participant.BUST_LIMIT) sum -= Participant.ACE_DIFFERENTIAL;
  });

  this.score = sum;
};

Participant.prototype.lastCard = function() {
  let lastCard = this.hand[this.hand.length - 1];

  return lastCard.join('');
};

Participant.prototype.formatCards = function() {
  let cardArray = this.hand.map(elm => elm[0] + elm[1]);

  if (cardArray.length === Participant.INITIAL_HAND_SIZE) {
    return cardArray.join(' and ');
  } else return cardArray.slice(0, -1).join(', ') + ', and ' + this.lastCard();
};

Participant.prototype.getScore = function() {
  return this.score;
};

Participant.prototype.displayHandAndScore = function() {
  console.log('');
  console.log(`${this.getName()}'s hand is ${this.formatCards()} for a total of ${this.getScore()}.`);
};

Participant.prototype.displayDealtCard = function() {
  console.log('');
  console.log(`${this.getName()} is dealt a ${this.lastCard()}.`);
};

Participant.prototype.isBusted = function() {
  return this.score > Participant.BUST_LIMIT;
};

Participant.prototype.hasBestScore = function() {
  return this.score === Participant.BUST_LIMIT;
};

Participant.prototype.getName = function() {
  return this.name;
};

function Player() {
  Participant.call(this, 'Player');
  this.money = Player.INITIAL_MONEY_AMOUNT;
}

Player.INITIAL_MONEY_AMOUNT = 5;
Player.BROKE = 0;
Player.RICH = 10;

Player.prototype = Object.create(Participant.prototype);
Player.prototype.constructor = Player;

Player.prototype.getMoney = function() {
  return this.money;
};

Player.prototype.incrementMoney = function(outcome) {
  if (outcome === 'won') this.money += 1;
  else if (outcome === 'lost') this.money -= 1;
};

Player.prototype.displayMoney = function() {
  console.log(`Player's chip count: ${this.getMoney()}`);
  console.log(``);
};

Player.prototype.isBroke = function() {
  return this.money === Player.BROKE;
};

Player.prototype.isRich = function() {
  return this.money === Player.RICH;
};

Player.prototype.hitOrStay = function() {
  let validChoices = ['h', 's', 'hit', 'stay'];
  console.log('');
  let answer = readline.question(`(H)it or (s)tay? : `).toLowerCase();

  while (!validChoices.includes(answer)) {
    answer = readline.question(`Please enter (h)it or (s)tay: `).toLowerCase();
  }

  return answer[0] === 'h';
};

function Dealer() {
  Participant.call(this, 'Dealer');
}

Dealer.prototype = Object.create(Participant.prototype);
Dealer.prototype.constructor = Dealer;

Dealer.HIT_LIMIT = 17;

Dealer.prototype.hitLimit = function() {
  return this.score >= Dealer.HIT_LIMIT;
};

Dealer.prototype.formatInitialHand = function() {
  return this.hand.map((elm, index) => {
    if (index < 1) {
      return elm[0] + elm[1];
    } else return '?';
  }).join(' and ');
};

Dealer.prototype.displayInitialHand = function() {
  console.log('');
  console.log(`Dealer's hand is ${this.formatInitialHand()}`);
};

Dealer.prototype.initialDealMessage = function() {
  console.log(`*********`);
  console.log('');
  console.log(`(Dealer flicks cards across table)`);
};

function TwentyOneGame() {
  this.deck = new Deck();
  this.player = new Player();
  this.dealer = new Dealer();
}

TwentyOneGame.INITIAL_CARD_AMOUNT = 2;
TwentyOneGame.HIT_CARD_AMOUNT = 1;
TwentyOneGame.WELCOME_PAD_SPACE = 20;


TwentyOneGame.prototype.start = function() {
  this.roundOfGames();
};

TwentyOneGame.prototype.roundOfGames = function() {
  this.displayWelcomeMessage();

  while (true) {
    console.clear();
    this.oneGame();

    if (this.isBrokeOrRich()) {
      this.brokeOrRichMessage();
      break;
    }

    if (this.playAgain()) {
      this.deck.initialize();
      this.player.reset();
      this.dealer.reset();
      continue;
    } else break;
  }
  this.displayGoodbyeMessage();
};

TwentyOneGame.prototype.oneGame = function() {
  this.dealCards();
  this.playerTurn();
  this.postPlayerTurn();
  if (!this.player.isBusted()) {
    this.dealerTurn();
    this.postDealerTurn();
    if (!this.dealer.isBusted()) {
      this.finalHandAndScore();
      this.displayResult();
    }
  }

  this.tabulateMoney();
};

TwentyOneGame.prototype.dealCards = function() {
  this.deck.deal(this.player, TwentyOneGame.INITIAL_CARD_AMOUNT);
  this.deck.deal(this.dealer, TwentyOneGame.INITIAL_CARD_AMOUNT);
};

TwentyOneGame.prototype.playerTurn = function() {
  this.player.displayMoney();
  this.dealer.initialDealMessage();

  while (true) {
    this.player.computeScore();
    this.playerTurnMessages();
    if (this.player.isBusted() || this.player.hasBestScore()) break;

    if (this.player.hitOrStay()) {
      this.deck.deal(this.player, TwentyOneGame.HIT_CARD_AMOUNT);
      console.clear();
      this.player.displayDealtCard();
      continue;
    } else break;
  }
};

TwentyOneGame.prototype.postPlayerTurn = function() {
  if (this.player.isBusted()) {
    this.divider();
    console.log(`You busted. Better luck next time.`);
  } else if (this.player.hasBestScore()) {
    this.divider();
    console.log(`*** 21! ***`);
  } else {
    this.divider();
    console.log(`Player chooses to stay.`);
  }
};

TwentyOneGame.prototype.playerTurnMessages = function() {
  this.dealer.displayInitialHand();
  this.player.displayHandAndScore();
};

TwentyOneGame.prototype.dealerTurn = function() {
  this.transitionToDealerTurnMessage();
  console.clear();
  while (true) {
    this.dealer.computeScore();
    this.dealer.displayHandAndScore();

    if (this.dealer.hitLimit() || this.dealer.isBusted() ||
      this.dealer.hasBestScore()) {
      break;
    }

    this.deck.deal(this.dealer, TwentyOneGame.HIT_CARD_AMOUNT);
    this.dealer.displayDealtCard();
  }
};

TwentyOneGame.prototype.postDealerTurn = function() {
  if (this.dealer.isBusted()) {
    this.divider();
    console.log(`Dealer busted, player wins!`);
  } else {
    this.divider();
    console.log(`Dealer stays at ${this.dealer.getScore()}.`);
  }
};

TwentyOneGame.prototype.transitionToDealerTurnMessage = function() {
  console.log(`Dealer's turn...`);
  console.log('');
  console.log('');
  readline.question(`(press enter key to continue)`);
};

TwentyOneGame.prototype.determineResult = function() {
  if (this.player.isBusted()) return 'Dealer';
  else if (this.dealer.isBusted()) return 'Player';
  else if (this.player.getScore() > this.dealer.getScore()) {
    return 'Player';
  } else if ((this.dealer.getScore() > this.player.getScore())) {
    return 'Dealer';
  } else return 'Push';
};

TwentyOneGame.prototype.displayResult = function() {
  this.divider();

  if (this.determineResult() === 'Player') {
    console.log(`Player wins!`);
  } else if (this.determineResult() === 'Dealer') {
    console.log('Dealer wins!');
  } else console.log(`Push. Bets are returned.`);
};

TwentyOneGame.prototype.finalHandAndScore = function() {
  this.player.displayHandAndScore();
  this.dealer.displayHandAndScore();
};

TwentyOneGame.prototype.tabulateMoney = function() {
  if (this.determineResult() === 'Player') {
    this.player.incrementMoney('won');
  } else if (this.determineResult() === 'Dealer') {
    this.player.incrementMoney('lost');
  }
};

TwentyOneGame.prototype.isBrokeOrRich = function() {
  return this.player.isBroke() || this.player.isRich();
};

TwentyOneGame.prototype.brokeOrRichMessage = function() {
  if (this.player.isBroke()) {
    console.log(`Your money has run out.`);
  } else {
    console.log(`You've done well...too well. Come back when we have more money.`);
  }
};

TwentyOneGame.prototype.playAgain = function() {
  let validChoices = ['y', 'n', 'yes', 'no'];
  let answer = readline.question(`Would you like to play again? `).toLowerCase();

  while (!validChoices.includes(answer)) {
    answer = readline.question(`Please enter (y)es or (n)o: `).toLowerCase();
  }

  return answer[0] === 'y';
};

TwentyOneGame.prototype.displayWelcomeMessage = function() {
  console.clear();
  this.formatWelcomeMessage('HELLO AND WELCOME TO TWENTY ONE!');
  console.log('');
  console.log(` The goal is to reach ${Participant.BUST_LIMIT} without going over.\n Number cards are worth their number, face cards are worth ${Participant.FACE_CARD_VALUE},\nand Aces are worth ${Participant.LOW_ACE_VALUE} or ${Participant.HIGH_ACE_VALUE}, depending on which keeps you under ${Participant.BUST_LIMIT}.`);
  console.log(` You start with ${Player.INITIAL_MONEY_AMOUNT} dollars in chips, and gain or lose one chip for winning\nor losing, respectively.\n Game ends when your chip count reaches ${Player.BROKE} or ${Player.RICH}. Good luck!`);
  console.log('');
  console.log('');
  readline.question(`Press enter key to begin game.`);
};

TwentyOneGame.prototype.formatWelcomeMessage = function(greeting) {
  console.log(greeting.padStart(greeting.length + TwentyOneGame.WELCOME_PAD_SPACE, ' '));
};

TwentyOneGame.prototype.displayGoodbyeMessage = function() {
  console.log('');
  console.log(`Thanks for playing!`);
  console.log('');
};

TwentyOneGame.prototype.divider = function() {
  console.log('');
  console.log('**********');
  console.log('');
};

let game = new TwentyOneGame();
game.start();