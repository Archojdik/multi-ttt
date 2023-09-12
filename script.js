let easyBtn
let normalBtn
let hardBtn

let gameScreen
let gameField

let isPlayerFirst = true
let isPlayerTurn = true

let xImageUrl
let oImageUrl

let fieldArray = [[], [], [], [], [], [], [], [], []]
let mainFieldArray = []

let loadFieldFun
let putCharacterFun
let checkStateFun

//======================================
// Ответственная за настройку игры часть
//======================================
window.onload = function () {
    easyBtn = document.getElementById("easyBtn")
    normalBtn = document.getElementById("normalBtn")
    hardBtn = document.getElementById("hardBtn")

    loadImages()
    //loadGameField() // Перенести в выбор режима
}

function loadImages() {
    xImageUrl = "url(x.png)"
    oImageUrl = "url(o.png)"
}

function setEasyMode() {
    easyBtn.classList.remove("difficultyHidden")
    normalBtn.classList.add("difficultyHidden")
    hardBtn.classList.add("difficultyHidden")


}
function setNormalMode() {
    alert("Обычный режим будет доступен на релизе.")
    return

    easyBtn.classList.add("difficultyHidden")
    normalBtn.classList.remove("difficultyHidden")
    hardBtn.classList.add("difficultyHidden")
}
function setHardMode() {
    alert("Сложный режим будет доступен на релизе.")
    return

    easyBtn.classList.add("difficultyHidden")
    normalBtn.classList.add("difficultyHidden")
    hardBtn.classList.remove("difficultyHidden")
}
function registerClicked() {
    alert("Регистрация аккаунта и мультиплеер будут доступны на релизе.")
}
function loginClicked() {
    alert("Управление аккаунтом и мультиплеер будут доступны на релизе.")
}

//===================
// Лёгкий режим (3x3)
//===================
function loadGameField_easy() {

}
function putCharacter_easy() {

}

// 0 - нет победителя
// 1 - крестики
// 2 - нолики
function checkFieldState_easy(smallFieldArray) {
    // Ахтунг! Некрасивый код
    let winner
    // Проверяем горизонтальные линии
    for (let i = 0; i < 9; i += 3) {
        if (smallFieldArray[i] == smallFieldArray[i + 1] && smallFieldArray[i] == smallFieldArray[i + 2]) {
            winner = smallFieldArray[i]
        }
    }
    // Проверяем вертикальные линии
    for (let x = 0; x < 3; x++) {
        if (smallFieldArray[x] == smallFieldArray[x + 3] && smallFieldArray[x] == smallFieldArray[x + 6]) {
            winner = smallFieldArray[x]
        }
    }
    // Проверяем диагонали
    if ((smallFieldArray[0] == smallFieldArray[4] && smallFieldArray[0] == smallFieldArray[8]) ||
        (smallFieldArray[2] == smallFieldArray[4] && smallFieldArray[2] == smallFieldArray[6])) {
        winner = smallFieldArray[4]
    }

    return winner
}
//-------------------

//=======================
// Нормальный режим (4x4)
//=======================
function loadGameField_normal() {

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
            clickField.id = i.toString() + j.toString() // Для позиционирования
            clickField.className = "clickField"
            clickField.onclick = function () {
                putCharacter(this)
            }

            additionalField.appendChild(clickField)
        }

        additionalScreen.appendChild(additionalField)
        gameField.appendChild(additionalScreen)
    }
}
function putCharacter_hard(clickedField) {
    if (isPlayerTurn) {
        if (mainFieldArray[clickedField.id[0]] == undefined) {
            if (fieldArray[clickedField.id[0]][clickedField.id[1]] == undefined) {
                // Заменить if на хранение параметров игрока
                if (isPlayerFirst) {
                    clickedField.style.backgroundImage = xImageUrl
                    fieldArray[clickedField.id[0]][clickedField.id[1]] = 1
                } else {
                    clickedField.style.backgroundImage = oImageUrl
                    fieldArray[clickedField.id[0]][clickedField.id[1]] = 2
                }
                // В случае игры с ботом менять ещё и isPlayerTurn
                isPlayerFirst = !isPlayerFirst
            }
        }
    }

    // Проверка состояния поля
    checkFieldState_hard()
}
function checkFieldState_hard() {
    for (let i = 0; i < 9; i++) {
        if (mainFieldArray[i] == undefined) {
            let state = checkFieldState_easy(fieldArray[i])
            mainFieldArray[i] = state
            // Здесь можно будет рисовать большие кресты и ноли
            if (state == 1) {
                alert("В поле " + i + " победили крестики.")
            }
            if (state == 2) {
                alert("В поле " + i + " победили нолики.")
            }
        }
    }

    // А сюда вписать проверку главного 3x3 поля
}
//-----------------------