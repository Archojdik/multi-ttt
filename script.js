let easyBtn
let normalBtn
let hardBtn

let gameScreen
let gameField

let isPlayerFirst = true
let isPlayerTurn = true
let gameOver

let xImageUrl
let oImageUrl

let fieldArray = [[], [], [], [], [], [], [], [], []]
// Используй этот массив для хранения полей любого режима
let mainFieldArray = []

// Пусть при нажатии кнопки "Очистить поле" вызывается функция выбранной сложности
// let resetDifficulty

//======================================
// Ответственная за настройку игры часть
//======================================
window.onload = function () {
    easyBtn = document.getElementById("easyBtn")
    normalBtn = document.getElementById("normalBtn")
    hardBtn = document.getElementById("hardBtn")

    loadImages()
}

function loadImages() {
    xImageUrl = "url(x.png)"
    oImageUrl = "url(o.png)"
}

function setEasyMode() {
    easyBtn.classList.remove("difficultyHidden")
    normalBtn.classList.add("difficultyHidden")
    hardBtn.classList.add("difficultyHidden")

    loadGameField_easy()

    mainFieldArray = []
    gameOver = false
    isPlayerFirst = true
}
function setNormalMode() {
    easyBtn.classList.add("difficultyHidden")
    normalBtn.classList.remove("difficultyHidden")
    hardBtn.classList.add("difficultyHidden")

    loadGameField_normal()

    mainFieldArray = []
    gameOver = false
    isPlayerFirst = true
}
function setHardMode() {
    easyBtn.classList.add("difficultyHidden")
    normalBtn.classList.add("difficultyHidden")
    hardBtn.classList.remove("difficultyHidden")

    loadGameField_hard()

    fieldArray = [[], [], [], [], [], [], [], [], []]
    mainFieldArray = []
    gameOver = false
    isPlayerFirst = true
}
function registerClicked() {
    alert("Регистрация аккаунта и мультиплеер будут доступны на релизе.")
}
function loginClicked() {
    alert("Управление аккаунтом и мультиплеер будут доступны на релизе.")
}
//--------------------------------------

//===================
// Лёгкий режим (3x3)
//===================
function loadGameField_easy() {
    gameScreen = document.getElementById("mainGameScreen")
    gameScreen.removeChild(gameScreen.firstElementChild)
    gameField = document.createElement("div")
    gameField.className = "gameField"
    gameScreen.appendChild(gameField)

    for (let i = 0; i < 9; i++) {
        let clickField = document.createElement("button")
        clickField.id = i.toString()
        clickField.className = "clickField"

        clickField.onclick = function () {
            putCharacter_easy(this)
        }

        gameField.appendChild(clickField)
    }
}
function putCharacter_easy(clickedField) {
    if(isPlayerTurn && !gameOver) {
        let i = clickedField.id

        if((mainFieldArray[i] ?? 0) == 0) {
            if(isPlayerFirst) {
                mainFieldArray[i] = 1
                gameField.children[i].style.backgroundImage = xImageUrl
            } else {
                mainFieldArray[i] = 2
                gameField.children[i].style.backgroundImage = oImageUrl
            }
            // В случае игры онлайн менять ещё и isPlayerTurn
            isPlayerFirst = !isPlayerFirst
        }

        let state = checkFieldState_easy(mainFieldArray)
        if (state == 1) {
            gameOver = true
            alert("Крестики - победители по жизни!")
        }
        if (state == 2) {
            gameOver = true
            alert("Нолики - победители по жизни!")
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
        }
    }
    // Проверяем вертикальные линии
    for (let x = 0; x < 3; x++) {
        if (smallFieldArray[x] == smallFieldArray[x + 3] && smallFieldArray[x] == smallFieldArray[x + 6]) {
            winner = smallFieldArray[x] ?? winner
        }
    }
    // Проверяем диагонали
    if ((smallFieldArray[0] == smallFieldArray[4] && smallFieldArray[0] == smallFieldArray[8]) ||
        (smallFieldArray[2] == smallFieldArray[4] && smallFieldArray[2] == smallFieldArray[6])) {
        winner = smallFieldArray[4] ?? winner
    }
    return winner
}
//-------------------

//=======================
// Нормальный режим (4x4)
//=======================
function loadGameField_normal() {
    gameScreen = document.getElementById("mainGameScreen")
    gameScreen.removeChild(gameScreen.firstElementChild)
    gameField = document.createElement("div")
    gameField.className = "gameField"
    gameScreen.appendChild(gameField)

    // Пробуем расширить поле 3x3 до 4x4
    gameField.style.setProperty("grid-template-columns", "1fr 1fr 1fr 1fr")
    gameField.style.setProperty("grid-template-rows", "1fr 1fr 1fr 1fr")

    for (let i = 0; i < 16; i++) {
        let clickField = document.createElement("button")
        clickField.id = i.toString()
        clickField.className = "clickField"

        clickField.onclick = function () {
            putCharacter_normal(this)
        }

        gameField.appendChild(clickField)
    }
}
function putCharacter_normal() {

}
function checkFieldState_normal() {

}
//-----------------------

//=======================
// Сложный режим (9* 3x3)
//=======================
function loadGameField_hard() {
    gameScreen = document.getElementById("mainGameScreen")
    gameScreen.removeChild(gameScreen.firstElementChild)
    gameField = document.createElement("div")
    gameField.className = "gameField"
    gameScreen.appendChild(gameField)

    for (let i = 0; i < 9; i++) {
        let additionalScreen = document.createElement("div")
        let additionalField = document.createElement("div")
        additionalScreen.className = "gameScreen"
        additionalField.className = "gameField"

        for (let j = 0; j < 9; j++) {
            let clickField = document.createElement("button")
            clickField.id = i.toString() + j.toString()
            clickField.className = "clickField"
            clickField.onclick = function () {
                putCharacter_hard(this)
            }

            additionalField.appendChild(clickField)
        }

        additionalScreen.appendChild(additionalField)
        gameField.appendChild(additionalScreen)
    }
}
function putCharacter_hard(clickedField) {
    if (isPlayerTurn && !gameOver) {
        let fieldNum = clickedField.id[0]
        let squareNum = clickedField.id[1]

        if ((mainFieldArray[fieldNum] ?? 0) == 0) {
            // Ставим знак игрока в клетку
            if ((fieldArray[fieldNum][squareNum] ?? 0) == 0) {
                if (isPlayerFirst) {
                    clickedField.style.backgroundImage = xImageUrl
                    fieldArray[fieldNum][squareNum] = 1
                } else {
                    clickedField.style.backgroundImage = oImageUrl
                    fieldArray[fieldNum][squareNum] = 2
                }
                // В случае игры онлайн менять ещё и isPlayerTurn
                isPlayerFirst = !isPlayerFirst
            }

            // Проверяем только затронутое поле
            let state = checkFieldState_easy(fieldArray[fieldNum])
            mainFieldArray[fieldNum] = state
            if (state != 0) {
                if (state == 1) {
                    gameField.children[fieldNum].style.backgroundImage = xImageUrl
                    alert("В поле " + fieldNum + " победили крестики.")
                }
                if (state == 2) {
                    gameField.children[fieldNum].style.backgroundImage = oImageUrl
                    alert("В поле " + fieldNum + " победили нолики.")
                }

                // Проверяем главное 3x3 поле
                state = checkFieldState_easy(mainFieldArray)
                if (state == 1) {
                    gameOver = true
                    alert("Крестики - победители по жизни!")
                }
                if (state == 2) {
                    gameOver = true
                    alert("Нолики - победители по жизни!")
                }
            }
        }
    }
}
//-----------------------