const BG_COLOR = '#231f20';
const SNAKE_COLOR = '#c2c2c2';
const FOOD_COLOR = '#e66916';

socket = io('localhost:3000', { transports : ['websocket'] });

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownGame', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('gameScreen');
const initialScreeen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');

// Lancer nouvelle partie
newGameBtn.addEventListener('click', () => {
	socket.emit('newGame');
	init();
});

// Rejoindre partie
joinGameBtn.addEventListener('click', () => {
	const code = gameCodeInput.value;
	socket.emit('joinGame', code);
	init();
});

let canvas, ctx, playerNumber, gameActive = false;

// Initialise le canvas de base
function init() {
	initialScreeen.style.display = "none";
	gameScreen.style.display = "block";

	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');

	canvas.width = canvas.height = 600;

	ctx.fillStyle = BG_COLOR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	document.addEventListener('keydown', e => {
		socket.emit('keydown', e.key);
	});

	gameActive = true;
}

// Affiche la partie
const paintGame = state => {
	console.log("FROM PAINTGAME");
	ctx.fillStyle = BG_COLOR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const food = state.food;
	const gridSize = state.gridSize;
	const size = canvas.width / gridSize;

	ctx.fillStyle = FOOD_COLOR;
	ctx.fillRect(food.x * size, food.y * size, size, size);

	paintPlayer(state.players[0], size, SNAKE_COLOR);
	paintPlayer(state.players[1], size, 'red');
}

// Affiche le joueur
const paintPlayer = (playerState, size, color) => {
	console.log("FROM PAINTPLAYER");
	const snake = playerState.snake;

	ctx.fillStyle = color;
	for (let cell of snake) {
		ctx.fillRect(cell.x * size, cell.y * size, size, size);
	}
};



// Handling functions

function handleInit(number) {
	playerNumber = number;
}

function handleGameState(gameState) {
	if (!gameActive) return;

	gameState = JSON.parse(gameState);
	requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
	if (!gameActive) return;

	data = JSON.parse(data);

	gameActive = false;

	if (data.winner === playerNumber) alert('Gagné !')
	else alert('Perdu !');
}

function handleGameCode(gameCode) {
	gameCodeDisplay.innerText = gameCode;
}

function handleUnknownGame() {
	reset();
	alert("Code de partie incorrect");
}

function handleTooManyPlayers() {
	reset();
	alert("La partie est déjà en cours");
}

function reset() {
	playerNumber = null;
	gameCodeInput.value = "";
	gameCodeDisplay.innerText = "";
	initialScreeen.style.display = "block";
	gameScreen.style.display = "none";
}