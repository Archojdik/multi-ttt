const port = 80;
const http = require('http');
const fs = require('fs');
const url = require('url');
const MongoClient = require('mongodb').MongoClient;
const ws = require('ws');
const wsServer = new ws.Server({ port: 9000 });

const jwt = require('jsonwebtoken');
const jwtSecret = 'MyR34l1y5upe9s3CRETs1g9na2TAT-1kan57341fromME';

const express = require('express');
//const { decode } = require('punycode');
const app = express();

const dbConnectionUrl = "mongodb://127.0.0.1:27017"
const mongoClient = new MongoClient(dbConnectionUrl);

let filesToLoad = [];
let loadedFiles = {};

//==============================================
// Запускаем сервер, внутри обрабатываем запросы
//==============================================
app.get('/GetMe', async (req, res) => {
    let tokenRes = await verifyJWT(req.get("Cookie"));

    if (tokenRes.errorcode == 0) {
        let account = await findUserDocument(tokenRes.decodedToken.data.login);
        res.send(account.score + " " + account.name);
    } else {
        res.statusCode = 418; // Я чайник.
    }
});
app.get('/ClientID', async (req, res) => {
    let query = req.url.slice(req.url.indexOf('?'))
    let params = new URLSearchParams(query);

    let tokenRes = await verifyJWT(req.get("Cookie"));

    if (params.has('id') && tokenRes.errorcode == 0) {
        let account = await findUserDocument(tokenRes.decodedToken.data.login);

        setClientId(params.get("id"), account);

        res.send("Successful.");
    } else {
        res.statusCode = 418; // Я чайник.
    }
});
app.get('/room/*', async (req, res) => {
    let query = req.url.slice(req.url.indexOf('?'))
    let params = new URLSearchParams(query);

    // Логика считывания информации с куки-токена
    if (req.get("Cookie") != undefined) {
        let opObj = await verifyJWT(req.get("Cookie"));
        if (opObj.errorcode == 0) {
            // Получаем данные пользователя
        } else {
            // Куки неправильные, редирект на страницу входа
            res.redirect("/auth/index.html");
            return;
        }
    } else {
        // Куки нет, редирект на страницу входа
        res.redirect("/auth/index.html");
        return;
    }

    // Обрабатываем запросы на комнаты (создание и подключение)
    switch (params.get("room")) {
        case "create":
            console.log("Creating room...");
            break;
        case "public":
            console.log("Entering public room...");
            break;
        case "invited":
            console.log("Invited into room...");
            break;
    }

    standartRequestHandling(req, res);
});
app.get('/game/*', async (req, res) => {
    let query = req.url.slice(req.url.indexOf('?'))
    let params = new URLSearchParams(query);

    if (params.get("mode") == "online") {
        // Логика считывания информации с куки-токена
        if (req.get("Cookie") != undefined) {
            let opObj = await verifyJWT(req.get("Cookie"));
            if (opObj.errorcode == 0) {
                // Получаем данные пользователя
            } else {
                // Куки неправильные, редирект на страницу входа
                res.redirect("/auth/index.html");
                return;
            }
        } else {
            // Куки нет, редирект на страницу входа
            res.redirect("/auth/index.html");
            return;
        }
    }

    // Потом надо создать веб-сокет

    standartRequestHandling(req, res);
});
app.get('/auth/*', async (req, res) => {
    // Здесь, если пользователь уже вошёл, можно перекинуть его на страницу с комнатами
    if (req.get("Cookie") != undefined) {
        let opObj = await verifyJWT(req.get("Cookie"));
        if (opObj.errorcode == 0) {
            // Получаем данные пользователя
            // Редирект на страницу с комнатами
            res.redirect("/room/index.html");
            return;
        }
    }

    let query = req.url.slice(req.url.indexOf('?'))
    let params = new URLSearchParams(query);
    let token;

    if (params.has('signup_login')) {
        // Регаемся
        if (params.get("password1") === params.get("password2") &&
            params.get("password1") !== undefined) {
            try {
                token = await signUp(params.get("signup_login"), params.get("password1"), params.get("name"));
            } catch {
                // Выводим ошибку,
                // пользователь уже 'есть'.
                let redQuery = "index.html?message=User+already+exists.";
                res.redirect(redQuery);
                return;
            }
        } else {
            // Выводим ошибку,
            // не совпадают пароли.
            let redQuery = "index.html?message=Passwords+do+not+match.";
            res.redirect(redQuery);
            return;
        }
    }
    if (params.has('signin_login')) {
        // Входим
        try {
            token = await signIn(params.get("signin_login"), params.get("password"));
        } catch {
            // Выводим ошибку,
            // неправильный логин или пароль.
            let redQuery = "index.html?message=Incorrect+login+or+password.";
            res.redirect(redQuery);
            return;
        }
    }

    // @TODO: Может быть, потом: сделать хранилище активных сессий
    if (token != undefined) {
        res.setHeader("Set-Cookie", token + "; path=/; Max-Age=86400; HttpOnly; SameSite=Strict");
        res.redirect("/room/index.html");
        return;
    }

    standartRequestHandling(req, res);
});
app.post('*', (req, res) => {
    standartRequestHandling(req, res);
});
app.get('*', (req, res) => {
    standartRequestHandling(req, res);
});
app.listen(port, () => {
    console.log('Server successfully launched.');
});
initializeDB();

function standartRequestHandling(req, res) {
    let reqUrl = req.url;
    let params = new URLSearchParams(req.url);
    if (reqUrl == "/")
        reqUrl = "menu/index.html";
    if (reqUrl[0] == '/')
        reqUrl = req.url.slice(1);
    reqUrl = url.parse(reqUrl).pathname;

    // Выдача файла
    if (loadedFiles[reqUrl] == undefined) {
        res.statusCode = 404;
    } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", loadedFiles[reqUrl].mimeType);
        res.write(loadedFiles[reqUrl].content);
    }

    res.end();
    //console.log(req.method + " " + reqUrl + " CookieHeader=" + req.get("Cookie"));
}
async function verifyJWT(cookieJWT) {
    try {
        let decoded = jwt.verify(cookieJWT, jwtSecret);

        // Проверяем на существование пользователя
        if (await findUserDocument(decoded.data.login) == undefined) {
            return { errorcode: 2 }
        }
        return { errorcode: 0, decodedToken: decoded }
    } catch {
        // Выдаёт JsonWebTokenError, если не удалось расшифровать
        return { errorcode: 1 }
    }
}
//----------------------------------------------

//===========================
// Обработчики игровых комнат
//===========================
let rooms = [];

function createRoom(wsClient, isPrivate) {
    // Придумываем уникальный код комнате
    let randomRoomCode;
    let isUniqueCode = true;
    do {
        isUniqueCode = true;
        randomRoomCode = Math.round(Math.random() * 65535); // Чисто символическое число

        rooms.forEach(element => {
            if (element.invitationCode == randomRoomCode) {
                isUniqueCode = false;
                return;
            }
        });
    } while (!isUniqueCode);

    let room = new Room(wsClient, isPrivate, randomRoomCode);

    // Уведомляем создателя о созданной комнате
    wsClient.gameRoom = room;
    wsClient.send("Room " + randomRoomCode);

    // Добавляем комнату в стек комнат
    rooms.push(room);
}
function enterPrivateRoom(wsClient, invitationCode) {
    // Ищем запрошенную комнату
    let foundRoom = false;
    rooms.forEach(element => {
        if (element.invitationCode == invitationCode) {
            foundRoom = true;
            if (element.player == null) {
                element.player = wsClient;
                wsClient.gameRoom = element;
                // Сообщаем всем-всем о пришедшем игроке
                element.creator.send("Enter " + element.player.account.score + " " + element.player.account.name);
                element.player.send("Enter " + element.creator.account.score + " " + element.creator.account.name);
                return;
            } else
                wsClient.send("Err Комната заполнена.");
        }
    });
    if (!foundRoom)
        wsClient.send("Err Комната не найдена.")
}
function enterRandomPublicRoom(wsClient) {
    // Ищем любую пустую публичную комнату
    let foundRoom = false;
    rooms.forEach(element => {
        if (element.isPrivate == false && element.player == null) {
            foundRoom = true;
            element.player = wsClient;
            wsClient.gameRoom = element;
            // Сообщаем всем-всем о пришедшем игроке
            element.creator.send("Enter " + element.player.account.score + " " + element.player.account.name);
            element.player.send("Enter " + element.creator.account.score + " " + element.creator.account.name);
            return;
        }
    });
    if (!foundRoom)
        wsClient.send("Err Свободная комната не найдена.");
}
function deleteRoom(room) {
    for (let i = 0; i < rooms.length; i++) {
        let element = rooms[i];

        if (element == room) {
            element.dispose();
            console.log("Комната " + element.invitationCode + " удалена.");
            rooms.splice(i, 1);
            break;
        }
    }
}
class Room {
    creator;
    player;
    isPrivate;
    invitationCode;

    //#isCreatorTurn = true;
    #isCreatorFirst = true;

    constructor(creator, isPrivate, invitationCode) {
        this.creator = creator;
        this.player = null;
        this.isPrivate = isPrivate;
        this.invitationCode = invitationCode;
    }
    setDifficulty(difficultyName) {
        // Улучшить код здесь
        if (difficultyName == "easy" || difficultyName == "normal" || difficultyName == "hard") {
            // Уведомляем обоих игроков (потому что без разрешения сервера даже у создателя ничего не сменится)
            this.creator.send("Diff " + difficultyName);
            this.player.send("Diff " + difficultyName);
        }
    }
    dispose() {
        this.creator = null;
        this.player = null;
    }
    getIsMyTurn(wsClient) {
        //return (wsClient == this.creator) == this.#isCreatorTurn;
        return (wsClient == this.creator) == this.#isCreatorFirst;
    }
}
//---------------------------


//==============================
// Обработчики WebSocket сервера
//==============================
let unidentifiedClients = [];

wsServer.on('connection', (wsClient) => {
    // Отправляем что-то для гостеприимства
    wsClient.send("Давай сыграем в игру.");

    wsClient.on('message', (message) => {
        //console.log("[Сообщение] " + message);
        let msg = message.toString();
        let fun = msg.split(' ')[0];
        let arg;
        if (msg.indexOf(" ") == -1)
            arg = null;
        else
            arg = msg.slice(msg.indexOf(" ") + 1);

        switch (fun) {
            case "Room":
                // Если клиент уже в комнате, лучше выдать ошибку
                if (wsClient.gameRoom == undefined)
                    createRoom(wsClient, arg.toLowerCase() == "true");
                else
                    wsClient.send("Err Пользователь уже находится в комнате.");
                break;
            case "Enter":
                // Если клиент уже в комнате, лучше выдать ошибку
                if (wsClient.gameRoom == undefined) {
                    if (arg == null)
                        enterRandomPublicRoom(wsClient);
                    else
                        enterPrivateRoom(wsClient, arg);
                }
                else
                    wsClient.send("Err Пользователь уже находится в комнате.");
                break;
            case "Diff":
                // Сложность может менять только создатель комнаты
                if (wsClient.gameRoom.creator == wsClient) {
                    wsClient.gameRoom.setDifficulty(arg);
                }
                break;
            case "WhoTurn":
                wsClient.send("WhoTurn " + wsClient.gameRoom.getIsMyTurn(wsClient));
                break;
            case "Turn":
                // Получаем ход игрока и передаём его оппоненту
                if (wsClient.gameRoom.creator == wsClient) {
                    // Если сообщение отправил создатель
                    if (wsClient.gameRoom.player != null)
                        wsClient.gameRoom.player.send(msg);
                } else {
                    // Если сообщение отправил игрок
                    if (wsClient.gameRoom.creator != null)
                        wsClient.gameRoom.creator.send(msg);
                }
                break;
        }
    });
    wsClient.on('close', () => {
        // Вероятный источник утечки памяти
        if (wsClient.gameRoom != null) {
            // Если клиент создал комнату: уведомить другого игрока, удалить комнату
            if (wsClient.gameRoom.creator == wsClient) {
                if (wsClient.gameRoom.player != null) {
                    wsClient.gameRoom.player.send("Exit");
                    wsClient.gameRoom.player.send("Err Без своего создателя комната будет уничтожена. Покиньте помещение.");
                    wsClient.gameRoom.player.gameRoom = null;
                }

                deleteRoom(wsClient.gameRoom);
                wsClient.gameRoom = null;
            } else {
                if (wsClient.gameRoom.creator != null) {
                    wsClient.gameRoom.creator.send("Exit");
                }

                wsClient.gameRoom.player = null;
                wsClient.gameRoom = null;
            }
        }

        console.log("Отключился от сокета: " + wsClient.account.name);
    });

    // Спрашиваем ID
    askClientID(wsClient);
});

function askClientID(wsClient) {
    let randomClientID;
    let isUniqueId = true;
    do {
        isUniqueId = true;
        randomClientID = Math.round(Math.random() * 65535); // Чисто символическое число

        unidentifiedClients.forEach(element => {
            if (element.clientID == randomClientID) {
                isUniqueId = false;
                return;
            }
        });
    } while (!isUniqueId);

    unidentifiedClients.push({ clientID: randomClientID, clientObject: wsClient });
    wsClient.send("ClientID " + randomClientID); // Даём запрос ClientID
}
function setClientId(clientID, accountObject) {
    for (let i = 0; i < unidentifiedClients.length; i++) {
        let element = unidentifiedClients[i];

        if (clientID == element.clientID) {
            element.clientObject.account = accountObject;
            console.log("Подключён к сокету: " + accountObject.name);
            // Удаляем объект из списка неидентифицированных клиентов
            unidentifiedClients.splice(i, 1);
            break;
        }
    }
}
//------------------------------


//========================================================
// Загружаем файлы сайта по инструкции в files_to_load.txt
//========================================================
fs.readFile("files_to_load.txt", (err, file) => {
    if (err)
        throw err
    filesToLoad = file.toString().split('\n')

    for (let i = 0; i + 1 < filesToLoad.length; i += 3) {
        let mime = filesToLoad[i].replace('\r', '')
        let path = filesToLoad[i + 1].replace('\r', '')
        loadFile(mime, path)
    }
});

function loadFile(contentType, path) {
    fs.readFile(path, (err, file) => {
        if (err)
            throw err
        loadedFiles[path] = { mimeType: contentType, content: file }
    })
}
//--------------------------------------------------------

//=======================
// Управляем базой данных
//=======================
const dbName = "multi_TIC-TAC-TOE";
const usersCollectionName = "Users";
let db;
let usersCollection;

async function initializeDB() {
    await mongoClient.connect().then(async mongoClient => {
        db = mongoClient.db(dbName);
        usersCollection = db.collection(usersCollectionName);

        console.log("Connected to DB '" + db.databaseName + "'.");
    });
}

async function addUserDocument(userLogin, password, userName) {
    await usersCollection.insertOne({ login: userLogin, password: password, name: userName, score: 0});
}
async function findUserDocument(userLogin) {
    let findingResults = await usersCollection.findOne({ login: userLogin });
    return findingResults;
}
//-----------------------

//===========================================
// Пытаемся сделать аутентификацию по примеру
//===========================================
async function signUp(login, password, name) {
    if (await findUserDocument(login) != null)
        throw new Error("User already exists.");
    await addUserDocument(login, password, name);

    // Сразу же входим в систему, возвращаем токен
    return await signIn(login, password);
}
async function signIn(login, password) {
    let account = await findUserDocument(login);
    if (account == null)
        throw new Error("Incorrect login or password.");
    if (account.password == password) {
        // Если вход был успешен, возвращаем токен
        console.log("[SIGNED IN]: " + account.login + "; " + account.name + ".");
        return generateToken(account, '24h');
    } else {
        throw new Error("Incorrect login or password.");
    }
}
function generateToken(user, expiration) {
    //expiration должен быть строкой '**h', где * - цифры
    let data = {
        login: user.login,
        name: user.name
    };

    return jwt.sign({ data, }, jwtSecret, { expiresIn: expiration });
}
//-------------------------------------------