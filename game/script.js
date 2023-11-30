let easyBtn
let normalBtn
let hardBtn

let gameScreen
let gameField
let winLinesCanvas
let turnIndicator
let invitationCode

let roomParameter;
let isPrivateRoom;
let roomInvitationCode;

let gamemodeNum = 0
let difficultyNum = 0
let isPlayerFirst = true
let isPlayerTurn = true
let gameOver

let xImageUrls = []
let oImageUrls = []
let line3x3imgs = []
let line4x4imgs = []

let fieldArray = [[], [], [], [], [], [], [], [], []] // Для сложности HARD
let mainFieldArray = []

// Пусть при нажатии кнопки "Очистить поле" вызывается функция выбранной сложности
// let resetDifficulty
let checkFieldFun
let putCharacterFun

//======================================
// Ответственная за настройку игры часть
//======================================
window.onload = function () {
    easyBtn = document.getElementById("easyBtn")
    normalBtn = document.getElementById("normalBtn")
    hardBtn = document.getElementById("hardBtn")
    invitationCode = document.getElementById("invitationCode");

    let urlParams = new URLSearchParams(window.location.search);
    let mode = urlParams.get('mode');
    roomParameter = urlParams.get("room");
    isPrivateRoom = urlParams.get("is_private") == "on";
    roomInvitationCode = urlParams.get("invite_code");

    let modeName;
    switch (mode) {
        case "onscreen":
            gamemodeNum = 0
            modeName = "Игра на одном экране"
            break;
        case "bot":
            gamemodeNum = 1
            modeName = "Игра с компьютером"
            break;
        case "online":
            gamemodeNum = 2
            modeName = "Мультиплеер"
            isPlayerTurn = false;

            connectSocket();
            break;
        default:
            gamemodeNum = 0
            modeName = "Игра на одном экране"
            break;
    }
    document.getElementById("modeIndicator").innerText = modeName;

    loadImages()
}

function loadImages() {
    xImageUrls[0] = "url(../assets/x_0.png)"
    xImageUrls[1] = "url(../assets/x_1.png)"
    oImageUrls[0] = "url(../assets/o_0.png)"
    oImageUrls[1] = "url(../assets/o_1.png)"

    line3x3imgs[0] = loadImage("../assets/lineH.png")
    line3x3imgs[1] = loadImage("../assets/lineV.png")
    line3x3imgs[2] = loadImage("../assets/lineD1.png")
    line3x3imgs[3] = loadImage("../assets/lineD2.png")
}
function loadImage(source) {
    let image = new Image()
    image.src = source
    return image
}

function onSetEasyModePressed() {
    if (gamemodeNum == 2) {
        if (hasOpponent)
            socket.send("Diff easy");
    }
    else
        setEasyMode();
}
function onSetNormalModePressed() {
    if (gamemodeNum == 2) {
        if (hasOpponent)
            socket.send("Diff normal");
    }
    else
        setNormalMode();
}
function onSetHardModePressed() {
    if (gamemodeNum == 2) {
        if (hasOpponent)
            socket.send("Diff hard");
    }
    else
        setHardMode();
}
function setNoGameMode() {
    easyBtn.classList.remove("difficultyHidden")
    normalBtn.classList.remove("difficultyHidden")
    hardBtn.classList.remove("difficultyHidden")

    // Удаляем поле
    clearField();
}
function setEasyMode() {
    easyBtn.classList.remove("difficultyHidden")
    normalBtn.classList.add("difficultyHidden")
    hardBtn.classList.add("difficultyHidden")

    loadGameField_easy()
    checkFieldFun = checkFieldState_easy
    putCharacterFun = putCharacter_easy
    difficultyNum = 0

    mainFieldArray = []
    gameOver = false
    isPlayerFirst = true
}
function setNormalMode() {
    easyBtn.classList.add("difficultyHidden")
    normalBtn.classList.remove("difficultyHidden")
    hardBtn.classList.add("difficultyHidden")

    loadGameField_normal()
    checkFieldFun = checkFieldState_normal
    putCharacterFun = putCharacter_easy
    difficultyNum = 1

    mainFieldArray = []
    gameOver = false
    isPlayerFirst = true
}
function setHardMode() {
    easyBtn.classList.add("difficultyHidden")
    normalBtn.classList.add("difficultyHidden")
    hardBtn.classList.remove("difficultyHidden")

    loadGameField_hard()
    putCharacterFun = putCharacter_hard
    difficultyNum = 2

    fieldArray = [[], [], [], [], [], [], [], [], []]
    mainFieldArray = []
    gameOver = false
    isPlayerFirst = true
}
function clearField() {
    gameScreen = document.getElementById("mainGameScreen")
    while (gameScreen.children.length > 0)
        gameScreen.removeChild(gameScreen.firstElementChild)

    winLinesCanvas = document.createElement("canvas")
    winLinesCanvas.className = "winLinesCanvas"
    winLinesCanvas.width = 512
    winLinesCanvas.height = 512
    gameScreen.appendChild(winLinesCanvas)

    gameField = document.createElement("div")
    gameField.className = "gameField"
    gameScreen.appendChild(gameField)
}
function getRandomCharacter(isX) {
    if (isX) {
        let randomIndex = randomInt(0, xImageUrls.length - 1)
        return xImageUrls[randomIndex]
    }
    else {
        let randomIndex = randomInt(0, oImageUrls.length - 1)
        return oImageUrls[randomIndex]
    }
}
function registerClicked() {
    alert("Регистрация аккаунта и мультиплеер будут доступны на релизе.")
}
function loginClicked() {
    alert("Управление аккаунтом и мультиплеер будут доступны на релизе.")
}
function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min)
}
//--------------------------------------

//======================
// Обработка цикла ходов
//======================
function playerTurnCycle() {
    isPlayerFirst = !isPlayerFirst
    isPlayerTurn = false;
    switch (gamemodeNum) {
        case 0:
            isPlayerTurn = true
            break;
        case 1:
            makeBotTurn()
            isPlayerFirst = !isPlayerFirst
            isPlayerTurn = true
            break;
        // Обработка онлайн-ходов сделана ниже, в сокетах
    }
}
function makeBotTurn() {
    let fakeField = {}
    let freeFieldsArray = []

    switch (difficultyNum) {
        case 0:
            for (let i = 0; i < 9; i++) {
                if ((mainFieldArray[i] ?? 0) == 0)
                    freeFieldsArray.push(i)
            }
            break;
        case 1:
            for (let i = 0; i < 15; i++) {
                if ((mainFieldArray[i] ?? 0) == 0)
                    freeFieldsArray.push(i)
            }
            break;
        case 2:
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if ((fieldArray[i][j] ?? 0) == 0)
                        freeFieldsArray.push(i + "" + j)
                }
            }
            break;
    }

    if (freeFieldsArray.length > 0) {
        fakeField.id = freeFieldsArray[randomInt(0, freeFieldsArray.length - 1)]
        putCharacterFun(fakeField, false)
    }
}
//----------------------

//===================
// Лёгкий режим (3x3)
//===================
function loadGameField_easy() {
    clearField()
    gameField.classList.add("field_3x3")

    for (let i = 0; i < 9; i++) {
        let clickField = document.createElement("button")
        clickField.id = i.toString()
        clickField.className = "clickField"

        clickField.onclick = function () {
            putCharacter_easy(this, true)
        }

        gameField.appendChild(clickField)
    }
}
function putCharacter_easy(clickedField, isPlayerClicked) {
    if (isPlayerTurn == isPlayerClicked && !gameOver) {
        let i = clickedField.id
        if (isPlayerClicked && gamemodeNum == 2)
            socket.send("Turn " + i);

        if ((mainFieldArray[i] ?? 0) == 0) {
            if (isPlayerFirst) {
                mainFieldArray[i] = 1
                gameField.children[i].style.backgroundImage = getRandomCharacter(true)
            } else {
                mainFieldArray[i] = 2
                gameField.children[i].style.backgroundImage = getRandomCharacter(false)
            }

            let state = checkFieldFun(mainFieldArray)
            if (state.won != 0) {
                gameOver = true
                drawLineImage(winLinesCanvas, line3x3imgs[state.lineType], 3, state.lineXCell, state.lineYCell)
                return
            }
            if (isPlayerClicked)
                playerTurnCycle();
        }
    }
}

// 0 - нет победителя
// 1 - крестики
// 2 - нолики
function checkFieldState_easy(smallFieldArray) {
    // Проверяем горизонтальные линии
    let winner = 0
    for (let i = 0; i < 9; i += 3) {
        if (smallFieldArray[i] == smallFieldArray[i + 1] && smallFieldArray[i] == smallFieldArray[i + 2]) {
            winner = smallFieldArray[i] ?? winner

            // Для линий
            if (winner != 0) {
                return { won: winner, lineType: 0, lineXCell: 0, lineYCell: (i / 3) - 1 }
            }
        }
    }
    // Проверяем вертикальные линии
    for (let x = 0; x < 3; x++) {
        if (smallFieldArray[x] == smallFieldArray[x + 3] && smallFieldArray[x] == smallFieldArray[x + 6]) {
            winner = smallFieldArray[x] ?? winner

            // Для линий
            if (winner != 0) {
                return { won: winner, lineType: 1, lineXCell: x - 1, lineYCell: 0 }
            }
        }
    }
    // Проверяем диагонали
    if (smallFieldArray[0] == smallFieldArray[4] && smallFieldArray[0] == smallFieldArray[8]) {
        winner = smallFieldArray[4] ?? winner

        // Для линий
        if (winner != 0) {
            return { won: winner, lineType: 2, lineXCell: 0, lineYCell: 0 }
        }
    }
    if (smallFieldArray[2] == smallFieldArray[4] && smallFieldArray[2] == smallFieldArray[6]) {
        winner = smallFieldArray[4] ?? winner

        // Для линий
        if (winner != 0) {
            return { won: winner, lineType: 3, lineXCell: 0, lineYCell: 0 }
        }
    }
    return { won: winner }
}
//-------------------

//=======================
// Нормальный режим (4x4)
//=======================
function loadGameField_normal() {
    clearField()
    gameField.classList.add("field_4x4")

    // Пробуем расширить поле 3x3 до 4x4
    gameField.style.setProperty("grid-template-columns", "1fr 1fr 1fr 1fr")
    gameField.style.setProperty("grid-template-rows", "1fr 1fr 1fr 1fr")

    for (let i = 0; i < 16; i++) {
        let clickField = document.createElement("button")
        clickField.id = i.toString()
        clickField.className = "clickField"

        clickField.onclick = function () {
            putCharacter_easy(this, true) // Нет необходимости дублировать код
        }

        gameField.appendChild(clickField)
    }
}
function checkFieldState_normal(smallFieldArray) {
    // Проверяем горизонтальные линии
    let winner = 0
    for (let i = 0; i < 16; i += 4) {
        if (smallFieldArray[i] == smallFieldArray[i + 1] &&
            smallFieldArray[i] == smallFieldArray[i + 2] &&
            smallFieldArray[i] == smallFieldArray[i + 3]) {
            winner = smallFieldArray[i] ?? winner
            if (winner != 0) {
                gameOver = true
                //drawLineImage(winLinesCanvas, )
                return { won: 0 }
            }
        }
    }
    // Проверяем вертикальные линии
    for (let x = 0; x < 4; x++) {
        if (smallFieldArray[x] == smallFieldArray[x + 4] &&
            smallFieldArray[x] == smallFieldArray[x + 8] &&
            smallFieldArray[x] == smallFieldArray[x + 12]) {
            winner = smallFieldArray[x] ?? winner
            if (winner != 0) {
                gameOver = true
                //drawLineImage(winLinesCanvas, )
                return { won: 0 }
            }
        }
    }
    // Проверяем диагонали
    if (smallFieldArray[0] == smallFieldArray[5] && smallFieldArray[0] == smallFieldArray[10] && smallFieldArray[0] == smallFieldArray[15]) {
        winner = smallFieldArray[0] ?? winner
        if (winner != 0) {
            gameOver = true
            //drawLineImage(winLinesCanvas, )
            return { won: 0 }
        }
    }
    if (smallFieldArray[3] == smallFieldArray[6] && smallFieldArray[3] == smallFieldArray[9] && smallFieldArray[3] == smallFieldArray[12]) {
        winner = smallFieldArray[3] ?? winner
        if (winner != 0) {
            gameOver = true
            //drawLineImage(winLinesCanvas, )
            return { won: 0 }
        }
    }
    return { won: 0 }
}
//-----------------------

//=======================
// Сложный режим (9* 3x3)
//=======================
function loadGameField_hard() {
    clearField()
    gameField.classList.add("field_3x3")

    for (let i = 0; i < 9; i++) {
        let additionalScreen = document.createElement("div")
        let additionalField = document.createElement("div")
        additionalScreen.className = "gameScreen"
        additionalField.className = "gameField"
        additionalField.classList.add("field_3x3")

        for (let j = 0; j < 9; j++) {
            let clickField = document.createElement("button")
            clickField.id = i.toString() + j.toString()
            clickField.className = "clickField"
            clickField.onclick = function () {
                putCharacter_hard(this, true)
            }

            additionalField.appendChild(clickField)
        }

        additionalScreen.appendChild(additionalField)
        gameField.appendChild(additionalScreen)
    }
}
function putCharacter_hard(clickedField, isPlayerClicked) {
    if (isPlayerTurn == isPlayerClicked && !gameOver) {
        let fieldNum = clickedField.id[0]
        let squareNum = clickedField.id[1]
        if (isPlayerClicked && gamemodeNum == 2)
            socket.send("Turn " + clickedField.id);

        if ((mainFieldArray[fieldNum] ?? 0) == 0) {
            // Ставим знак игрока в клетку
            if ((fieldArray[fieldNum][squareNum] ?? 0) == 0) {
                let fieldElement = gameField.children[fieldNum]
                let squareElement = fieldElement.children[0].children[squareNum]

                if (isPlayerFirst) {
                    fieldArray[fieldNum][squareNum] = 1
                } else {
                    fieldArray[fieldNum][squareNum] = 2
                }
                squareElement.style.backgroundImage = getRandomCharacter(isPlayerFirst)

                // Проверяем только затронутое поле
                let state = checkFieldState_easy(fieldArray[fieldNum])
                mainFieldArray[fieldNum] = state.won
                if (state.won != 0) {
                    fieldElement.style.backgroundImage = getRandomCharacter(state.won == 1)

                    // Проверяем главное 3x3 поле
                    state = checkFieldState_easy(mainFieldArray)
                    if (state.won != 0) {
                        gameOver = true
                        drawLineImage(winLinesCanvas, line3x3imgs[state.lineType], 3, state.lineXCell, state.lineYCell)
                    }
                }
                if (isPlayerClicked)
                    playerTurnCycle();
            }
        }
    }
}
//-----------------------

//============================
// Рисуем линии для победителя
//============================
function drawLineImage(canvas, image, cellsInRow, xCellOffset, yCellOffset) {
    let cellWidth = canvas.width / cellsInRow
    let cellHeight = canvas.height / cellsInRow
    let x = cellWidth * xCellOffset
    let y = cellHeight * yCellOffset

    let ctx = canvas.getContext("2d")
    ctx.drawImage(image, x, y, canvas.width, canvas.height)
}
//----------------------------

//===========================
// Надстройка для онлайн игры
//===========================
let socket;
let opponentName;
let opponentScore;
let hasOpponent = false;
let whoseTurnResponsed = false;
//let isMyTurn = false;
function connectSocket() {
    socket = new WebSocket("ws://" + location.hostname + ":9000/");

    socket.onopen = (event) => {
        console.log("Socket opened!");
    }
    socket.onmessage = async (event) => {
        let msg = event.data;
        let fun = msg.split(' ')[0];
        let arg = msg.slice(msg.indexOf(" ") + 1);

        switch (fun) {
            case "ClientID":
                await fetch("/ClientID?id=" + arg);
                enterRoom();
                break;
            case "Room":
                invitationCode.innerText = "Код приглашения: " + arg;
                invitationCode.hidden = false;
                break;
            case "Err":
                alert(arg);
                break;
            case "Exit":
                alert(opponentName + " вышел из комнаты.");
                hasOpponent = false;
                setNoGameMode();
                break;
            case "Enter":
                let score = arg.split(' ')[0];
                let name = arg.slice(arg.indexOf(" ") + 1);
                alert("Wild " + name + " appeared!\nРейтинг: " + score);

                opponentName = name;
                opponentScore = score;
                hasOpponent = true;

                // Определяем, кто ходит
                requestWhoseTurn();

                // Дополнить интерфейсом на самой страничке
                break;
            case "Diff":
                // Получаем официальное разрешение сменить уровень сложности.
                // Улучшить код здесь.
                switch (arg) {
                    case "easy":
                        setEasyMode();
                        break;
                    case "normal":
                        setNormalMode();
                        break;
                    case "hard":
                        setHardMode();
                        break;
                }
                break;
            case "WhoTurn":
                isPlayerTurn = (arg.toLowerCase() == "true");
                isPlayerFirst = isPlayerTurn;
                whoseTurnResponsed = true;
                break;
            case "Turn":
                // Получаем ход оппонента
                // Ходим
                let aDud = { id:arg };
                putCharacterFun(aDud, false);
                
                // Переключаем ход
                isPlayerFirst = !isPlayerFirst
                isPlayerTurn = true
                break;
        }

        console.log("[Socket message] " + event.data);
    }
    socket.onclose = (event) => {
        console.log("Socket closed!");
    }
    socket.onerror = (event) => {
        console.error(event);
    }
}
function enterRoom() {
    switch (roomParameter) {
        case "create":
            socket.send("Room " + isPrivateRoom);
            break;
        case "public":
            socket.send("Enter");
            break;
        case "invited":
            socket.send("Enter " + roomInvitationCode);
            break;
    }
}
function requestWhoseTurn() {
    whoseTurnResponsed = false;
    socket.send("WhoTurn");
}
//---------------------------