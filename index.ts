const send = require('process')
const TelegramBot = require('node-telegram-bot-api');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Подключаемся к базе данных
const client = new Client({
  user: 'dinaratest',
  host: 'localhost',
  database: 'dinaratest',
  password: 'dinaratest',
  port: '5432',
});

client.connect()
  .then(() => console.log('PostgreSQL Connected'))
  .catch(error => console.error('PostgreSQL Connection Error:', error));
  
// Создаем таблицу для хранения ответов пользователей
client.query(`
  CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    question_number INT,
    answer TEXT
  )
`).then(() => console.log('Table "answers" created'))
  .catch(error => console.error('Error creating table "answers":', error));

// Создаем экземпляр бота
const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(token, { polling: true });

// Обрабатываем сообщения
function sendMessage(chatId: number, text: string) {
  bot.sendMessage(chatId, text);
}

// Обработчик команды старт
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await sendMessage(chatId, 'Привет! Давай начнем тестирование. Ответьте на вопросы, выбирая вариант ответа.');
  await sendMessage(chatId, 'Ответы записываются автоматически. По окончанию теста будет выдан результат.');
  await sendMessage(chatId, 'Для начала теста введите /test');
});

// Обработчик команды тест
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  sendMessage(chatId, 'Начинаем тестирование! Ответьте на первый вопрос:');
  sendQuestion(chatId, 0);
});

// Отправка вопроса с вариантами ответов
function sendQuestion(chatId, questionNumber) {
  const questionText = getQuestionText(questionNumber);
  const answerOptions = getAnswerOptions(questionNumber);
  const options = {
    reply_markup: {
      inline_keyboard: answerOptions.map((row, index) => row.map((option, i) => ({ text: option, callback_data: `${questionNumber}:${index * row.length + i}` }))),
      resize_keyboard: true,
    },
  };
  bot.sendMessage(chatId, questionText, options);
}

// Получаем текст вопроса по его номеру
function getQuestionText(questionNumber: number): string {
  return `${questionNumber + 1}. ${questions[questionNumber].text}`;
}

// Получение вариантов ответа по номеру вопроса
function getAnswerOptions(questionNumber: number): string[][] {
  return questions[questionNumber].options;
}

// Обработка ответа пользователя
bot.on('callback_query', async (query) => {
  const userId = query.from.id.toString();
  const [questionNumber, answerIndex] = query.data.split(':').map(Number);
  const chatId = query.message.chat.id;

  try {
    await client.query('INSERT INTO answers (user_id, question_number, answer) VALUES ($1, $2, $3)', [userId, questionNumber, answerIndex]);
    sendMessage(chatId, 'Ответ записан. Следующий вопрос:');
    currentQuestion++;
    if (currentQuestion < questions.length) {
      sendQuestion(chatId, currentQuestion);
    } else {
      sendResult(chatId, userId);
    }
  } catch (error) {
    console.error('Error inserting answer into database:', error);
    sendMessage(chatId, 'Произошла ошибка. Попробуйте еще раз.');
  }
});


// Подсчет правильных и неправильных ответов
async function calculateResult(userId: string): Promise<{ correct: number; incorrect: number }> {
  const correctAnswers: number[] = [];
  const incorrectAnswers: number[] = [];
  try {
    const { rows } = await client.query('SELECT question_number, answer FROM answers WHERE user_id = $1', [userId]);
    rows.forEach(row => {
      const questionNumber = row.question_number;
      const userAnswer = parseInt(row.answer);
      const correctAnswer = questions[questionNumber].correctAnswer;
      if (userAnswer === correctAnswer) {
        correctAnswers.push(questionNumber);
      } else {
        incorrectAnswers.push(questionNumber);
      }
    });
    return { correct: correctAnswers.length, incorrect: incorrectAnswers.length };
  } catch (error) {
    console.error('Error calculating result:', error);
    return { correct: 0, incorrect: 0 };
  }
}

// Отправка результата пользователю
async function sendResult(chatId: number, userId: string) {
  const { correct, incorrect } = await calculateResult(userId);
  const totalQuestions = questions.length;
  const message = `Тестирование завершено!\nПравильных ответов: ${correct}\nНеправильных ответов: ${incorrect}\nВсего вопросов: ${totalQuestions}`;
  sendMessage(chatId, message);
}

let currentQuestion = 0;

const questions = [
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