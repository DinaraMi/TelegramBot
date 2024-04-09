var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var send = require('process');
var TelegramBot = require('node-telegram-bot-api');
var Client = require('pg').Client;
var dotenv = require('dotenv');
dotenv.config();
// Подключаемся к базе данных
var client = new Client({
    user: 'dinaratest',
    host: 'localhost',
    database: 'dinaratest',
    password: 'dinaratest',
    port: '5432',
});
client.connect()
    .then(function () { return console.log('PostgreSQL Connected'); })
    .catch(function (error) { return console.error('PostgreSQL Connection Error:', error); });
// Создаем таблицу для хранения ответов пользователей
client.query("\n  CREATE TABLE IF NOT EXISTS answers (\n    id SERIAL PRIMARY KEY,\n    user_id VARCHAR(255),\n    question_number INT,\n    answer TEXT\n  )\n").then(function () { return console.log('Table "answers" created'); })
    .catch(function (error) { return console.error('Error creating table "answers":', error); });
// Создаем экземпляр бота
var token = process.env.TELEGRAM_BOT_TOKEN || '';
var bot = new TelegramBot(token, { polling: true });
// Обрабатываем сообщения
function sendMessage(chatId, text) {
    bot.sendMessage(chatId, text);
}
// Обработчик команды старт
bot.onText(/\/start/, function (msg) { return __awaiter(_this, void 0, void 0, function () {
    var chatId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = msg.chat.id;
                return [4 /*yield*/, sendMessage(chatId, 'Привет! Давай начнем тестирование. Ответьте на вопросы, выбирая вариант ответа.')];
            case 1:
                _a.sent();
                return [4 /*yield*/, sendMessage(chatId, 'Ответы записываются автоматически. По окончанию теста будет выдан результат.')];
            case 2:
                _a.sent();
                return [4 /*yield*/, sendMessage(chatId, 'Для начала теста введите /test')];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Обработчик команды тест
bot.onText(/\/test/, function (msg) {
    var chatId = msg.chat.id;
    sendMessage(chatId, 'Начинаем тестирование! Ответьте на первый вопрос:');
    sendQuestion(chatId, 0);
});
function getMaxAnswerLength(answerOptions) {
    var maxLength = 0;
    answerOptions.forEach(function (row) {
        row.forEach(function (option) {
            if (option.length > maxLength) {
                maxLength = option.length;
            }
        });
    });
    return maxLength;
}
function sendQuestion(chatId, questionNumber) {
    var questionText = getQuestionText(questionNumber);
    var answerOptions = getAnswerOptions(questionNumber);
    var maxAnswerLength = getMaxAnswerLength(answerOptions);
    // Формируем кнопки ответов с учетом ширины
    var keyboard = {
        inline_keyboard: answerOptions.map(function (row) {
            return row.map(function (option) { return ({
                text: option,
                // Изменяем формат callback_data, чтобы он содержал только индекс выбранного ответа
                callback_data: "".concat(questionNumber, ":").concat(row.indexOf(option))
            }); });
        })
    };
    // Опции для отправки сообщения
    var options = {
        reply_markup: keyboard
    };
    // Отправляем сообщение с вопросом и кнопками
    bot.sendMessage(chatId, questionText, options);
}
// Получаем текст вопроса по его номеру
function getQuestionText(questionNumber) {
    return "".concat(questionNumber + 1, ". ").concat(questions[questionNumber].text);
}
// Получение вариантов ответа по номеру вопроса
function getAnswerOptions(questionNumber) {
    return questions[questionNumber].options;
}
// Обработка ответа пользователя
bot.on('callback_query', function (query) { return __awaiter(_this, void 0, void 0, function () {
    var userId, _a, questionNumber, answerIndex, chatId, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = query.from.id.toString();
                _a = query.data.split(':').map(Number), questionNumber = _a[0], answerIndex = _a[1];
                chatId = query.message.chat.id;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, client.query('INSERT INTO answers (user_id, question_number, answer) VALUES ($1, $2, $3)', [userId, questionNumber, answerIndex])];
            case 2:
                _b.sent();
                sendMessage(chatId, 'Ответ записан. Следующий вопрос:');
                currentQuestion++;
                if (currentQuestion < questions.length) {
                    sendQuestion(chatId, currentQuestion);
                }
                else {
                    sendResult(chatId, userId);
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('Error inserting answer into database:', error_1);
                sendMessage(chatId, 'Произошла ошибка. Попробуйте еще раз.');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Подсчет правильных и неправильных ответов
function calculateResult(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var correctAnswers, incorrectAnswers, rows, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    correctAnswers = [];
                    incorrectAnswers = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.query('SELECT question_number, answer FROM answers WHERE user_id = $1', [userId])];
                case 2:
                    rows = (_a.sent()).rows;
                    rows.forEach(function (row) {
                        var questionNumber = row.question_number;
                        var userAnswer = parseInt(row.answer);
                        var correctAnswer = questions[questionNumber].correctAnswer;
                        if (userAnswer === correctAnswer) {
                            correctAnswers.push(questionNumber);
                        }
                        else {
                            incorrectAnswers.push(questionNumber);
                        }
                    });
                    return [2 /*return*/, { correct: correctAnswers.length, incorrect: incorrectAnswers.length }];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error calculating result:', error_2);
                    return [2 /*return*/, { correct: 0, incorrect: 0 }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Отправка результата пользователю
function sendResult(chatId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, correct, incorrect, totalQuestions, message;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, calculateResult(userId)];
                case 1:
                    _a = _b.sent(), correct = _a.correct, incorrect = _a.incorrect;
                    totalQuestions = questions.length;
                    message = "\u0422\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E!\n\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0445 \u043E\u0442\u0432\u0435\u0442\u043E\u0432: ".concat(correct, "\n\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0445 \u043E\u0442\u0432\u0435\u0442\u043E\u0432: ").concat(incorrect, "\n\u0412\u0441\u0435\u0433\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432: ").concat(totalQuestions);
                    sendMessage(chatId, message);
                    return [2 /*return*/];
            }
        });
    });
}
var currentQuestion = 0;
var questions = [
    {
        text: 'Что такое TypeScript?',
        options: [['Препроцессор CSS', 'Компилируемый язык программирования', 'База данных']],
        correctAnswer: 1,
    },
    {
        text: 'Какой символ используется для однострочного комментария в JavaScript?',
        options: [['//', '--', '/* */']],
        correctAnswer: 0,
    },
    {
        text: 'Какой метод используется для добавления элемента в конец массива в JavaScript?',
        options: [['push()', 'add()', 'append()']],
        correctAnswer: 0,
    },
    {
        text: 'Какой метод вызывается при создании объекта в JavaScript?',
        options: [['create()', 'new()', 'init()']],
        correctAnswer: 1,
    },
    {
        text: 'Какой тип данных используется для хранения чисел с плавающей точкой в JavaScript?',
        options: [['number', 'float', 'double']],
        correctAnswer: 0,
    },
    {
        text: 'Какая функция используется для преобразования строки в число в JavaScript?',
        options: [['parseInt()', 'toNumber()', 'convertToNumber()']],
        correctAnswer: 0,
    },
    {
        text: 'Что делает оператор === в JavaScript?',
        options: [['Проверяет равенство без приведения типов', 'Проверяет равенство с приведением типов', 'Присваивает значение переменной']],
        correctAnswer: 0,
    },
    {
        text: 'Что вернет функция typeof null в JavaScript?',
        options: [['null', 'object', 'undefined']],
        correctAnswer: 1,
    },
    {
        text: 'Какой метод используется для удаления последнего элемента из массива в JavaScript?',
        options: [['pop()', 'removeLast()', 'delete()']],
        correctAnswer: 0,
    },
    {
        text: 'Какой метод используется для объединения двух или более массивов в JavaScript?',
        options: [['join()', 'merge()', 'concat()']],
        correctAnswer: 2,
    },
    {
        text: 'Какая функция используется для вывода информации в консоль в JavaScript?',
        options: [['console.log()', 'print()', 'log()']],
        correctAnswer: 0,
    },
    {
        text: 'Какой оператор используется для объявления условного оператора в JavaScript?',
        options: [['if', 'then', 'case']],
        correctAnswer: 0,
    },
    {
        text: 'Какая функция используется для округления числа в JavaScript?',
        options: [['round()', 'ceil()', 'floor()']],
        correctAnswer: 0,
    },
    {
        text: 'Какая функция используется для получения длины строки в JavaScript?',
        options: [['length()', 'size()', 'length']],
        correctAnswer: 0,
    },
    {
        text: 'Какой символ используется для обращения к элементам массива по индексу в JavaScript?',
        options: [['()', '{}', '[]']],
        correctAnswer: 2,
    },
    {
        text: 'Что такое DOM в контексте веб-разработки?',
        options: [['Язык разметки', 'Протокол передачи данных', 'Объектная модель документа']],
        correctAnswer: 2,
    },
];
