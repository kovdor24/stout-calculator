const REGION_DESC = { 130: "Мороз до -35°C", 120: "Мороз до -30°C", 100: "Мороз до -25°C", 60: "Мороз до -15°C" };
const CITIES_DB = [
    // Россия
    { name: "Москва", country: "RU", temp: -25 },
    { name: "Санкт-Петербург", country: "RU", temp: -24 },
    { name: "Новосибирск", country: "RU", temp: -39 },
    { name: "Екатеринбург", country: "RU", temp: -32 },
    { name: "Нижний Новгород", country: "RU", temp: -29 },
    { name: "Казань", country: "RU", temp: -31 },
    { name: "Челябинск", country: "RU", temp: -31 },
    { name: "Самара", country: "RU", temp: -29 },
    { name: "Омск", country: "RU", temp: -37 },
    { name: "Ростов-на-Дону", country: "RU", temp: -19 },
    { name: "Уфа", country: "RU", temp: -32 },
    { name: "Красноярск", country: "RU", temp: -40 },
    { name: "Пермь", country: "RU", temp: -33 },
    { name: "Воронеж", country: "RU", temp: -25 },
    { name: "Волгоград", country: "RU", temp: -22 },
    { name: "Краснодар", country: "RU", temp: -15 },
    { name: "Сочи", country: "RU", temp: -2 },
    { name: "Якутск", country: "RU", temp: -54 },
    { name: "Сургут", country: "RU", temp: -43 },
    { name: "Владивосток", country: "RU", temp: -22 },
    { name: "Иркутск", country: "RU", temp: -36 },
    { name: "Хабаровск", country: "RU", temp: -29 },
    { name: "Тюмень", country: "RU", temp: -35 },
    { name: "Барнаул", country: "RU", temp: -37 },
    { name: "Махачкала", country: "RU", temp: -9 },
    { name: "Мурманск", country: "RU", temp: -27 },
    { name: "Архангельск", country: "RU", temp: -31 },
    { name: "Вологда", country: "RU", temp: -29 },
    { name: "Череповец", country: "RU", temp: -29 },
    { name: "Петрозаводск", country: "RU", temp: -26 },
    { name: "Сыктывкар", country: "RU", temp: -34 },
    { name: "Великий Новгород", country: "RU", temp: -24 },
    { name: "Псков", country: "RU", temp: -24 },
    { name: "Калининград", country: "RU", temp: -16 },
    { name: "Ярославль", country: "RU", temp: -29 },
    { name: "Кострома", country: "RU", temp: -29 },
    { name: "Иваново", country: "RU", temp: -28 },
    { name: "Владимир", country: "RU", temp: -27 },
    { name: "Рязань", country: "RU", temp: -26 },
    { name: "Тула", country: "RU", temp: -25 },
    { name: "Калуга", country: "RU", temp: -25 },
    { name: "Тверь", country: "RU", temp: -26 },
    { name: "Смоленск", country: "RU", temp: -23 },
    { name: "Брянск", country: "RU", temp: -24 },
    { name: "Орел", country: "RU", temp: -24 },
    { name: "Курск", country: "RU", temp: -24 },
    { name: "Белгород", country: "RU", temp: -22 },
    { name: "Липецк", country: "RU", temp: -25 },
    { name: "Тамбов", country: "RU", temp: -26 },
    { name: "Пенза", country: "RU", temp: -27 },
    { name: "Саранск", country: "RU", temp: -28 },
    { name: "Чебоксары", country: "RU", temp: -29 },
    { name: "Йошкар-Ола", country: "RU", temp: -31 },
    { name: "Киров", country: "RU", temp: -31 },
    { name: "Ижевск", country: "RU", temp: -30 },
    { name: "Оренбург", country: "RU", temp: -31 },
    { name: "Саратов", country: "RU", temp: -25 },
    { name: "Ульяновск", country: "RU", temp: -29 },
    { name: "Тольятти", country: "RU", temp: -28 },
    { name: "Курган", country: "RU", temp: -34 },
    { name: "Томск", country: "RU", temp: -40 },
    { name: "Кемерово", country: "RU", temp: -39 },
    { name: "Новокузнецк", country: "RU", temp: -38 },
    { name: "Улан-Удэ", country: "RU", temp: -37 },
    { name: "Чита", country: "RU", temp: -38 },
    { name: "Благовещенск", country: "RU", temp: -32 },
    { name: "Магадан", country: "RU", temp: -25 },
    { name: "Петропавловск-Камчатский", country: "RU", temp: -15 },
    { name: "Южно-Сахалинск", country: "RU", temp: -22 },
    { name: "Нижневартовск", country: "RU", temp: -43 },
    { name: "Ханты-Мансийск", country: "RU", temp: -39 },
    { name: "Новый Уренгой", country: "RU", temp: -47 },
    { name: "Салехард", country: "RU", temp: -43 },
    { name: "Норильск", country: "RU", temp: -48 },
    { name: "Астрахань", country: "RU", temp: -19 },
    { name: "Элиста", country: "RU", temp: -20 },
    { name: "Ставрополь", country: "RU", temp: -17 },
    { name: "Пятигорск", country: "RU", temp: -16 },
    { name: "Нальчик", country: "RU", temp: -15 },
    { name: "Владикавказ", country: "RU", temp: -15 },
    { name: "Грозный", country: "RU", temp: -15 },
    { name: "Севастополь", country: "RU", temp: -10 },
    { name: "Симферополь", country: "RU", temp: -14 },
    { name: "Керчь", country: "RU", temp: -13 },
    { name: "Анапа", country: "RU", temp: -11 },
    { name: "Новороссийск", country: "RU", temp: -10 },
    { name: "Геленджик", country: "RU", temp: -8 },
    { name: "Таганрог", country: "RU", temp: -18 },
    { name: "Шахты", country: "RU", temp: -19 },
    { name: "Балашиха", country: "RU", temp: -25 },
    { name: "Подольск", country: "RU", temp: -25 },
    { name: "Химки", country: "RU", temp: -25 },
    { name: "Мытищи", country: "RU", temp: -25 },
    { name: "Люберцы", country: "RU", temp: -25 },
    { name: "Королев", country: "RU", temp: -25 },
    { name: "Красногорск", country: "RU", temp: -25 },
    { name: "Одинцово", country: "RU", temp: -25 },
    { name: "Домодедово", country: "RU", temp: -25 },
    { name: "Щелково", country: "RU", temp: -25 },
    { name: "Серпухов", country: "RU", temp: -25 },
    { name: "Коломна", country: "RU", temp: -25 },
    { name: "Орехово-Зуево", country: "RU", temp: -25 },
    { name: "Раменское", country: "RU", temp: -25 },
    { name: "Pushkino", country: "RU", temp: -25 },
    { name: "Сергиев Посад", country: "RU", temp: -25 },
    { name: "Ногинск", country: "RU", temp: -25 },
    { name: "Долгопрудный", country: "RU", temp: -25 },
    { name: "Реутов", country: "RU", temp: -25 },
    { name: "Магнитогорск", country: "RU", temp: -31 },
    { name: "Нижний Тагил", country: "RU", temp: -32 },
    { name: "Каменск-Уральский", country: "RU", temp: -32 },
    { name: "Златоуст", country: "RU", temp: -31 },
    { name: "Миасс", country: "RU", temp: -31 },
    { name: "Копейск", country: "RU", temp: -31 },
    { name: "Новочебоксарск", country: "RU", temp: -29 },
    { name: "Абакан", country: "RU", temp: -37 },
    { name: "Кызыл", country: "RU", temp: -44 },
    { name: "Горно-Алтайск", country: "RU", temp: -37 },
    { name: "Черкесск", country: "RU", temp: -16 },
    { name: "Майкоп", country: "RU", temp: -16 },
    { name: "Назрань", country: "RU", temp: -16 },
    { name: "Магас", country: "RU", temp: -16 },
    { name: "Нарьян-Мар", country: "RU", temp: -39 },
    { name: "Анадырь", country: "RU", temp: -40 },
    { name: "Биробиджан", country: "RU", temp: -30 },
    { name: "Армавир", country: "RU", temp: -16 },
    { name: "Рыбинск", country: "RU", temp: -29 },
    { name: "Дзержинск", country: "RU", temp: -29 },
    { name: "Орск", country: "RU", temp: -31 },
    { name: "Бийск", country: "RU", temp: -37 },
    { name: "Прокопьевск", country: "RU", temp: -39 },
    { name: "Братск", country: "RU", temp: -37 },
    { name: "Ангарск", country: "RU", temp: -36 },
    { name: "Энгельс", country: "RU", temp: -25 },
    { name: "Балаково", country: "RU", temp: -26 },
    { name: "Волжский", country: "RU", temp: -22 },
    { name: "Старый Оскол", country: "RU", temp: -22 },
    { name: "Сызрань", country: "RU", temp: -29 },
    { name: "Волгодонск", country: "RU", temp: -19 },
    { name: "Новочеркасск", country: "RU", temp: -19 },
    { name: "Находка", country: "RU", temp: -22 },
    { name: "Уссурийск", country: "RU", temp: -23 },
    { name: "Хасавюрт", country: "RU", temp: -9 },
    { name: "Дербент", country: "RU", temp: -8 },
    { name: "Каспийск", country: "RU", temp: -9 },
    { name: "Кисловодск", country: "RU", temp: -16 },
    { name: "Ессентуки", country: "RU", temp: -16 },
    { name: "Невинномысск", country: "RU", temp: -17 },
    { name: "Нефтеюганск", country: "RU", temp: -39 },
    { name: "Нефтекамск", country: "RU", temp: -32 },
    { name: "Октябрьский", country: "RU", temp: -32 },
    { name: "Салават", country: "RU", temp: -32 },
    { name: "Димитровград", country: "RU", temp: -29 },
    { name: "Ковров", country: "RU", temp: -27 },
    { name: "Муром", country: "RU", temp: -27 },
    { name: "Арзамас", country: "RU", temp: -29 },
    { name: "Обнинск", country: "RU", temp: -25 },
    { name: "Ноябрьск", country: "RU", temp: -45 },
    { name: "Ачинск", country: "RU", temp: -40 },
    { name: "Елец", country: "RU", temp: -25 },
    { name: "Железногорск", country: "RU", temp: -24 },
    { name: "Великие Луки", country: "RU", temp: -24 },
    { name: "Северодвинск", country: "RU", temp: -31 },
    { name: "Березники", country: "RU", temp: -33 },
    { name: "Альметьевск", country: "RU", temp: -31 },
    { name: "Нижнекамск", country: "RU", temp: -31 },
    { name: "Набережные Челны", country: "RU", temp: -31 },
    { name: "Зеленодольск", country: "RU", temp: -31 },
    { name: "Стерлитамак", country: "RU", temp: -32 },
    { name: "Гатчина", country: "RU", temp: -24 },
    { name: "Батайск", country: "RU", temp: -19 },
    { name: "Новошахтинск", country: "RU", temp: -19 },
    { name: "Камышин", country: "RU", temp: -22 },
    { name: "Новокуйбышевск", country: "RU", temp: -29 },
    { name: "Бердск", country: "RU", temp: -39 },
    { name: "Северск", country: "RU", temp: -40 },
    { name: "Рубцовск", country: "RU", temp: -37 },
    { name: "Комсомольск-на-Амуре", country: "RU", temp: -31 },
    { name: "Артем", country: "RU", temp: -22 },
    { name: "Евпатория", country: "RU", temp: -14 },
    { name: "Новомосковск", country: "RU", temp: -25 },
    { name: "Электросталь", country: "RU", temp: -25 },
    { name: "Жуковский", country: "RU", temp: -25 },
    { name: "Первоуральск", country: "RU", temp: -32 },
    { name: "Воскресенск", country: "RU", temp: -25 },
    { name: "Запорожье", country: "RU", temp: -20 },
    { name: "Мариуполь", country: "RU", temp: -19 },
    { name: "Херсон", country: "RU", temp: -16 },
    { name: "Донецк", country: "RU", temp: -21 },
    { name: "Луганск", country: "RU", temp: -22 },
    { name: "Макеевка", country: "RU", temp: -21 },
    { name: "Горловка", country: "RU", temp: -21 },
    { name: "Краматорск", country: "RU", temp: -21 },
    { name: "Мелитополь", country: "RU", temp: -20 },
    { name: "Славянск", country: "RU", temp: -21 },
    { name: "Бердянск", country: "RU", temp: -19 },
    { name: "Северодонецк", country: "RU", temp: -22 },
    // Подмосковье и города 10k-20k+
    { name: "Дубна", country: "RU", temp: -25 },
    { name: "Лыткарино", country: "RU", temp: -25 },
    { name: "Лобня", country: "RU", temp: -25 },
    { name: "Клин", country: "RU", temp: -25 },
    { name: "Ивантеевка", country: "RU", temp: -25 },
    { name: "Фрязино", country: "RU", temp: -25 },
    { name: "Видное", country: "RU", temp: -25 },
    { name: "Дмитров", country: "RU", temp: -25 },
    { name: "Павловский Посад", country: "RU", temp: -25 },
    { name: "Егорьевск", country: "RU", temp: -25 },
    { name: "Ступино", country: "RU", temp: -25 },
    { name: "Чехов", country: "RU", temp: -25 },
    { name: "Наро-Фоминск", country: "RU", temp: -25 },
    { name: "Солнечногорск", country: "RU", temp: -25 },
    { name: "Истра", country: "RU", temp: -25 },
    { name: "Шатура", country: "RU", temp: -25 },
    { name: "Можайск", country: "RU", temp: -25 },
    { name: "Ликино-Дулево", country: "RU", temp: -25 },
    { name: "Луховицы", country: "RU", temp: -25 },
    { name: "Кашира", country: "RU", temp: -25 },
    { name: "Волоколамск", country: "RU", temp: -25 },
    { name: "Протвино", country: "RU", temp: -25 },
    { name: "Пущино", country: "RU", temp: -25 },
    { name: "Бронницы", country: "RU", temp: -25 },
    { name: "Звенигород", country: "RU", temp: -25 },
    { name: "Черноголовка", country: "RU", temp: -25 },
    { name: "Зарайск", country: "RU", temp: -25 },
    { name: "Краснозаводск", country: "RU", temp: -25 },
    { name: "Куровское", country: "RU", temp: -25 },
    { name: "Хотьково", country: "RU", temp: -25 },
    { name: "Талдом", country: "RU", temp: -25 },
    { name: "Рошаль", country: "RU", temp: -25 },
    { name: "Руза", country: "RU", temp: -25 },
    { name: "Верея", country: "RU", temp: -25 },
    // Ленинградская область 10k-20k+
    { name: "Выборг", country: "RU", temp: -24 },
    { name: "Сосновый Бор", country: "RU", temp: -24 },
    { name: "Всеволожск", country: "RU", temp: -24 },
    { name: "Тихвин", country: "RU", temp: -25 },
    { name: "Кириши", country: "RU", temp: -25 },
    { name: "Кингисепп", country: "RU", temp: -23 },
    { name: "Волхов", country: "RU", temp: -25 },
    { name: "Сертолово", country: "RU", temp: -24 },
    { name: "Тосно", country: "RU", temp: -24 },
    { name: "Луга", country: "RU", temp: -25 },
    { name: "Сланцы", country: "RU", temp: -24 },
    { name: "Кировск (Лен. обл.)", country: "RU", temp: -24 },
    { name: "Отрадное", country: "RU", temp: -24 },
    { name: "Пикалево", country: "RU", temp: -26 },
    { name: "Подпорожье", country: "RU", temp: -27 },
    { name: "Лодейное Поле", country: "RU", temp: -26 },
    { name: "Никольское", country: "RU", temp: -24 },
    { name: "Коммунар", country: "RU", temp: -24 },
    { name: "Приозерск", country: "RU", temp: -25 },
    { name: "Бокситогорск", country: "RU", temp: -26 },
    { name: "Сясьстрой", country: "RU", temp: -25 },
    { name: "Волосово", country: "RU", temp: -24 },
    { name: "Ивангород", country: "RU", temp: -23 },
    { name: "Шлиссельбург", country: "RU", temp: -24 },
    // Другие регионы РФ 10k-20k+
    { name: "Ейск", country: "RU", temp: -16 },
    { name: "Кропоткин", country: "RU", temp: -16 },
    { name: "Славянск-на-Кубани", country: "RU", temp: -16 },
    { name: "Туапсе", country: "RU", temp: -12 },
    { name: "Тихорецк", country: "RU", temp: -16 },
    { name: "Крымск", country: "RU", temp: -16 },
    { name: "Лабинск", country: "RU", temp: -16 },
    { name: "Усть-Лабинск", country: "RU", temp: -16 },
    { name: "Курганинск", country: "RU", temp: -16 },
    { name: "Белореченск", country: "RU", temp: -16 },
    { name: "Тимашевск", country: "RU", temp: -16 },
    { name: "Горячий Ключ", country: "RU", temp: -14 },
    { name: "Темрюк", country: "RU", temp: -13 },
    { name: "Новокубанск", country: "RU", temp: -16 },
    { name: "Кореновск", country: "RU", temp: -16 },
    { name: "Апшеронск", country: "RU", temp: -15 },
    { name: "Гулькевичи", country: "RU", temp: -16 },
    { name: "Абинск", country: "RU", temp: -15 },
    { name: "Азов", country: "RU", temp: -19 },
    { name: "Каменск-Шахтинский", country: "RU", temp: -20 },
    { name: "Красный Сулин", country: "RU", temp: -20 },
    { name: "Гуково", country: "RU", temp: -20 },
    { name: "Сальск", country: "RU", temp: -20 },
    { name: "Донецк (Ростов. обл.)", country: "RU", temp: -20 },
    { name: "Аксай", country: "RU", temp: -19 },
    { name: "Белая Калитва", country: "RU", temp: -20 },
    { name: "Миллерово", country: "RU", temp: -22 },
    { name: "Морозовск", country: "RU", temp: -22 },
    { name: "Зерноград", country: "RU", temp: -19 },
    { name: "Семикаракорск", country: "RU", temp: -19 },
    { name: "Щекино", country: "RU", temp: -25 },
    { name: "Алексин", country: "RU", temp: -25 },
    { name: "Узловая", country: "RU", temp: -25 },
    { name: "Ефремов", country: "RU", temp: -26 },
    { name: "Донской", country: "RU", temp: -25 },
    { name: "Кимры", country: "RU", temp: -27 },
    { name: "Ржев", country: "RU", temp: -26 },
    { name: "Вышний Волочек", country: "RU", temp: -27 },
    { name: "Торжок", country: "RU", temp: -26 },
    { name: "Конаково", country: "RU", temp: -27 },
    { name: "Удомля", country: "RU", temp: -28 },
    { name: "Бежецк", country: "RU", temp: -28 },
    { name: "Бологое", country: "RU", temp: -27 },
    { name: "Вязьма", country: "RU", temp: -24 },
    { name: "Рославль", country: "RU", temp: -23 },
    { name: "Ярцево", country: "RU", temp: -24 },
    { name: "Сафоново", country: "RU", temp: -24 },
    { name: "Гагарин", country: "RU", temp: -25 },
    { name: "Десногорск", country: "RU", temp: -23 },
    { name: "Мичуринск", country: "RU", temp: -26 },
    { name: "Рассказово", country: "RU", temp: -26 },
    { name: "Моршанск", country: "RU", temp: -26 },
    { name: "Котовск", country: "RU", temp: -26 },
    { name: "Уварово", country: "RU", temp: -26 },
    { name: "Кинешма", country: "RU", temp: -28 },
    { name: "Шуя", country: "RU", temp: -28 },
    { name: "Вичуга", country: "RU", temp: -28 },
    { name: "Фурманов", country: "RU", temp: -28 },
    { name: "Тейково", country: "RU", temp: -28 },
    { name: "Кохма", country: "RU", temp: -28 },
    { name: "Бор", country: "RU", temp: -29 },
    { name: "Кстово", country: "RU", temp: -29 },
    { name: "Павлово", country: "RU", temp: -29 },
    { name: "Выкса", country: "RU", temp: -29 },
    { name: "Балахна", country: "RU", temp: -29 },
    { name: "Вязники", country: "RU", temp: -27 },
    { name: "Гусь-Хрустальный", country: "RU", temp: -27 },
    { name: "Александров", country: "RU", temp: -27 },
    { name: "Кольчугино", country: "RU", temp: -27 },
    { name: "Собинка", country: "RU", temp: -27 },
    { name: "Киржач", country: "RU", temp: -27 },
    { name: "Радужный", country: "RU", temp: -27 },
    { name: "Ливны", country: "RU", temp: -25 },
    { name: "Мценск", country: "RU", temp: -25 },
    { name: "Курчатов", country: "RU", temp: -24 },
    { name: "Клинцы", country: "RU", temp: -23 },
    { name: "Новозыбков", country: "RU", temp: -23 },
    { name: "Дятьково", country: "RU", temp: -24 },
    { name: "Унеча", country: "RU", temp: -24 },
    { name: "Борисоглебск", country: "RU", temp: -25 },
    { name: "Лиски", country: "RU", temp: -25 },
    { name: "Россошь", country: "RU", temp: -24 },
    { name: "Острогожск", country: "RU", temp: -25 },
    { name: "Нововоронеж", country: "RU", temp: -25 },
    { name: "Бутурлиновка", country: "RU", temp: -25 },
    { name: "Павловск", country: "RU", temp: -24 },
    { name: "Михайловка", country: "RU", temp: -22 },
    { name: "Урюпинск", country: "RU", temp: -23 },
    { name: "Фролово", country: "RU", temp: -22 },
    { name: "Каменка", country: "RU", temp: -27 },
    { name: "Кузнецк", country: "RU", temp: -28 },
    { name: "Заречный (Пенз. обл.)", country: "RU", temp: -27 },
    { name: "Белебей", country: "RU", temp: -32 },
    { name: "Белорецк", country: "RU", temp: -34 },
    { name: "Ишимбай", country: "RU", temp: -32 },
    { name: "Кумертау", country: "RU", temp: -32 },
    { name: "Мелеуз", country: "RU", temp: -32 },
    { name: "Сибай", country: "RU", temp: -32 },
    { name: "Туймазы", country: "RU", temp: -32 },
    { name: "Дюртюли", country: "RU", temp: -32 },
    { name: "Благовещенск (Башк.)", country: "RU", temp: -32 },
    { name: "Янаул", country: "RU", temp: -33 },
    { name: "Учалы", country: "RU", temp: -33 },
    { name: "Бугульма", country: "RU", temp: -31 },
    { name: "Елабуга", country: "RU", temp: -31 },
    { name: "Лениногорск", country: "RU", temp: -31 },
    { name: "Чистополь", country: "RU", temp: -31 },
    { name: "Заинск", country: "RU", temp: -31 },
    { name: "Азнакаево", country: "RU", temp: -31 },
    { name: "Нурлат", country: "RU", temp: -31 },
    { name: "Бавлы", country: "RU", temp: -31 },
    { name: "Сарапул", country: "RU", temp: -30 },
    { name: "Глазов", country: "RU", temp: -31 },
    { name: "Воткинск", country: "RU", temp: -30 },
    { name: "Можга", country: "RU", temp: -30 },
    { name: "Бузулук", country: "RU", temp: -31 },
    { name: "Новотроицк", country: "RU", temp: -31 },
    { name: "Бугуруслан", country: "RU", temp: -31 },
    { name: "Медногорск", country: "RU", temp: -31 },
    { name: "Гай", country: "RU", temp: -31 },
    { name: "Соль-Илецк", country: "RU", temp: -31 },
    { name: "Чапаевск", country: "RU", temp: -29 },
    { name: "Жигулевск", country: "RU", temp: -29 },
    { name: "Кинель", country: "RU", temp: -29 },
    { name: "Отрадный", country: "RU", temp: -29 },
    { name: "Тобольск", country: "RU", temp: -38 },
    { name: "Ишим", country: "RU", temp: -36 },
    { name: "Ялуторовск", country: "RU", temp: -35 },
    { name: "Заводоуковск", country: "RU", temp: -35 },
    { name: "Шадринск", country: "RU", temp: -34 },
    { name: "Снежинск", country: "RU", temp: -31 },
    { name: "Озерск", country: "RU", temp: -31 },
    { name: "Троицк (Челяб. обл.)", country: "RU", temp: -31 },
    { name: "Чебаркуль", country: "RU", temp: -31 },
    { name: "Южноуральск", country: "RU", temp: -31 },
    { name: "Сатка", country: "RU", temp: -32 },
    { name: "Коркино", country: "RU", temp: -31 },
    { name: "Трехгорный", country: "RU", temp: -32 },
    { name: "Аша", country: "RU", temp: -32 },
    { name: "Усть-Катав", country: "RU", temp: -32 },
    { name: "Кыштым", country: "RU", temp: -31 },
    { name: "Нязепетровск", country: "RU", temp: -33 },
    { name: "Лысьва", country: "RU", temp: -33 },
    { name: "Чайковский", country: "RU", temp: -33 },
    { name: "Соликамск", country: "RU", temp: -34 },
    { name: "Кунгур", country: "RU", temp: -33 },
    { name: "Чусовой", country: "RU", temp: -34 },
    { name: "Чернушка", country: "RU", temp: -33 },
    { name: "Добрянка", country: "RU", temp: -33 },
    { name: "Кизель", country: "RU", temp: -34 },
    { name: "Котлас", country: "RU", temp: -32 },
    { name: "Новодвинск", country: "RU", temp: -31 },
    { name: "Коряжма", country: "RU", temp: -32 },
    { name: "Онега", country: "RU", temp: -30 },
    { name: "Мирный (Арханг.)", country: "RU", temp: -31 },
    { name: "Великий Устюг", country: "RU", temp: -31 },
    { name: "Сокол", country: "RU", temp: -30 },
    { name: "Боровичи", country: "RU", temp: -25 },
    { name: "Старая Русса", country: "RU", temp: -24 },
    { name: "Кандалакша", country: "RU", temp: -28 },
    { name: "Апатиты", country: "RU", temp: -28 },
    { name: "Североморск", country: "RU", temp: -26 },
    { name: "Мончегорск", country: "RU", temp: -28 },
    { name: "Оленегорск", country: "RU", temp: -28 },
    { name: "Ковдор", country: "RU", temp: -29 },
    { name: "Полярный", country: "RU", temp: -26 },
    { name: "Заполярный", country: "RU", temp: -29 },
    { name: "Ухта", country: "RU", temp: -36 },
    { name: "Воркута", country: "RU", temp: -39 },
    { name: "Печора", country: "RU", temp: -37 },
    { name: "Усинск", country: "RU", temp: -38 },
    { name: "Инта", country: "RU", temp: -39 },
    { name: "Сосногорск", country: "RU", temp: -36 },
    { name: "Новоалтайск", country: "RU", temp: -37 },
    { name: "Заринск", country: "RU", temp: -38 },
    { name: "Камень-на-Оби", country: "RU", temp: -38 },
    { name: "Славгород", country: "RU", temp: -37 },
    { name: "Искитим", country: "RU", temp: -39 },
    { name: "Куйбышев", country: "RU", temp: -40 },
    { name: "Барабинск", country: "RU", temp: -40 },
    { name: "Карасук", country: "RU", temp: -39 },
    { name: "Татарск", country: "RU", temp: -40 },
    { name: "Тогучин", country: "RU", temp: -39 },
    { name: "Стрежевой", country: "RU", temp: -43 },
    { name: "Асино", country: "RU", temp: -41 },
    { name: "Колпашево", country: "RU", temp: -42 },
    { name: "Белово", country: "RU", temp: -39 },
    { name: "Киселевск", country: "RU", temp: -39 },
    { name: "Междуреченск", country: "RU", temp: -38 },
    { name: "Ленинск-Кузнецкий", country: "RU", temp: -39 },
    { name: "Юрга", country: "RU", temp: -39 },
    { name: "Анжеро-Судженск", country: "RU", temp: -39 },
    { name: "Мыски", country: "RU", temp: -38 },
    { name: "Мариинск", country: "RU", temp: -40 },
    { name: "Таштагол", country: "RU", temp: -38 },
    { name: "Калтан", country: "RU", temp: -39 },
    { name: "Черногорск", country: "RU", temp: -37 },
    { name: "Саяногорск", country: "RU", temp: -37 },
    { name: "Усть-Илимск", country: "RU", temp: -40 },
    { name: "Усолье-Сибирское", country: "RU", temp: -37 },
    { name: "Черемхово", country: "RU", temp: -37 },
    { name: "Тулун", country: "RU", temp: -39 },
    { name: "Шелехов", country: "RU", temp: -36 },
    { name: "Усть-Кут", country: "RU", temp: -42 },
    { name: "Саянск", country: "RU", temp: -38 },
    { name: "Зима", country: "RU", temp: -38 },
    { name: "Железногорск-Илимский", country: "RU", temp: -41 },
    { name: "Нижнеудинск", country: "RU", temp: -37 },
    { name: "Бодайбо", country: "RU", temp: -45 },
    { name: "Гусиноозерск", country: "RU", temp: -37 },
    { name: "Северобайкальск", country: "RU", temp: -38 },
    { name: "Кяхта", country: "RU", temp: -37 },
    { name: "Краснокаменск", country: "RU", temp: -38 },
    { name: "Борзя", country: "RU", temp: -39 },
    { name: "Свободный", country: "RU", temp: -35 },
    { name: "Белогорск", country: "RU", temp: -33 },
    { name: "Тында", country: "RU", temp: -43 },
    { name: "Зея", country: "RU", temp: -39 },
    { name: "Амурск", country: "RU", temp: -31 },
    { name: "Советская Гавань", country: "RU", temp: -27 },
    { name: "Николаевск-на-Амуре", country: "RU", temp: -33 },
    { name: "Бикин", country: "RU", temp: -30 },
    { name: "Вяземский", country: "RU", temp: -30 },
    { name: "Арсеньев", country: "RU", temp: -26 },
    { name: "Спасск-Дальний", country: "RU", temp: -24 },
    { name: "Партизанск", country: "RU", temp: -22 },
    { name: "Лесозаводск", country: "RU", temp: -26 },
    { name: "Дальнегорск", country: "RU", temp: -22 },
    { name: "Большой Камень", country: "RU", temp: -21 },
    { name: "Дальнереченск", country: "RU", temp: -26 },
    { name: "Фокино", country: "RU", temp: -21 },
    { name: "Нерюнгри", country: "RU", temp: -48 },
    { name: "Алдан", country: "RU", temp: -44 },
    { name: "Мирный (Якутия)", country: "RU", temp: -49 },
    { name: "Ленск", country: "RU", temp: -46 },
    { name: "Корсаков", country: "RU", temp: -20 },
    { name: "Холмск", country: "RU", temp: -18 },
    { name: "Оха", country: "RU", temp: -28 },
    { name: "Невельск", country: "RU", temp: -18 },
    { name: "Поронайск", country: "RU", temp: -25 },
    { name: "Елизово", country: "RU", temp: -16 },
    { name: "Георгиевск", country: "RU", temp: -17 },
    { name: "Буденновск", country: "RU", temp: -17 },
    { name: "Михайловск", country: "RU", temp: -17 },
    { name: "Изобильный", country: "RU", temp: -17 },
    { name: "Светлоград", country: "RU", temp: -17 },
    { name: "Зеленокумск", country: "RU", temp: -17 },
    { name: "Благодарный", country: "RU", temp: -17 },
    { name: "Новоалександровск", country: "RU", temp: -17 },
    { name: "Полярные Зори", country: "RU", temp: -28 },
    { name: "Заозерск", country: "RU", temp: -26 },
    { name: "Гаджиево", country: "RU", temp: -26 },
    { name: "Кола", country: "RU", temp: -26 },
    { name: "Костомукша", country: "RU", temp: -28 },
    { name: "Кемь", country: "RU", temp: -26 },
    { name: "Медвежьегорск", country: "RU", temp: -27 },
    { name: "Сортавала", country: "RU", temp: -24 },
    { name: "Пудож", country: "RU", temp: -28 },
    { name: "Олонец", country: "RU", temp: -25 },
    { name: "Няндома", country: "RU", temp: -32 },
    { name: "Шенкурск", country: "RU", temp: -31 },
    { name: "Сольвычегодск", country: "RU", temp: -32 },
    { name: "Пинега", country: "RU", temp: -33 },
    { name: "Мезень", country: "RU", temp: -33 },
    { name: "Тотьма", country: "RU", temp: -31 },
    { name: "Устюжна", country: "RU", temp: -29 },
    { name: "Вытегра", country: "RU", temp: -30 },
    { name: "Белозерск", country: "RU", temp: -29 },
    { name: "Кириллов", country: "RU", temp: -29 },
    { name: "Бабаево", country: "RU", temp: -29 },
    { name: "Харовск", country: "RU", temp: -30 },
    { name: "Грязовец", country: "RU", temp: -29 },
    { name: "Валдай", country: "RU", temp: -26 },
    { name: "Печоры", country: "RU", temp: -24 },
    { name: "Порхов", country: "RU", temp: -24 },
    { name: "Остров", country: "RU", temp: -24 },
    { name: "Невель", country: "RU", temp: -24 },
    { name: "Опочка", country: "RU", temp: -24 },
    { name: "Новоржев", country: "RU", temp: -24 },
    { name: "Себеж", country: "RU", temp: -24 },
    { name: "Таруса", country: "RU", temp: -25 },
    { name: "Малоярославец", country: "RU", temp: -25 },
    { name: "Балабаново", country: "RU", temp: -25 },
    { name: "Козельск", country: "RU", temp: -25 },
    { name: "Сухиничи", country: "RU", temp: -25 },
    { name: "Кондрово", country: "RU", temp: -25 },
    { name: "Жиздра", country: "RU", temp: -25 },
    { name: "Мещовск", country: "RU", temp: -25 },
    { name: "Юрьев-Польский", country: "RU", temp: -27 },
    { name: "Петушки", country: "RU", temp: -27 },
    { name: "Покров", country: "RU", temp: -27 },
    { name: "Карабаново", country: "RU", temp: -27 },
    { name: "Лакинск", country: "RU", temp: -27 },
    { name: "Струнино", country: "RU", temp: -27 },
    { name: "Гороховец", country: "RU", temp: -27 },
    { name: "Камешково", country: "RU", temp: -27 },
    { name: "Меленки", country: "RU", temp: -27 },
    { name: "Суздаль", country: "RU", temp: -27 },
    { name: "Южа", country: "RU", temp: -28 },
    { name: "Пучеж", country: "RU", temp: -28 },
    { name: "Наволоки", country: "RU", temp: -28 },
    { name: "Заволжск", country: "RU", temp: -28 },
    { name: "Комсомольск", country: "RU", temp: -28 },
    { name: "Гаврилов Посад", country: "RU", temp: -28 },
    { name: "Плес", country: "RU", temp: -28 },
    { name: "Нерехта", country: "RU", temp: -29 },
    { name: "Буй", country: "RU", temp: -30 },
    { name: "Мантурово", country: "RU", temp: -30 },
    { name: "Ветлуга", country: "RU", temp: -29 },
    { name: "Урень", country: "RU", temp: -29 },
    { name: "Семенов", country: "RU", temp: -29 },
    { name: "Лысково", country: "RU", temp: -29 },
    { name: "Сергач", country: "RU", temp: -29 },
    { name: "Шахунья", country: "RU", temp: -30 },
    { name: "Чкаловск", country: "RU", temp: -29 },
    { name: "Богородск", country: "RU", temp: -29 },
    { name: "Городец", country: "RU", temp: -29 },
    { name: "Навашино", country: "RU", temp: -29 },
    { name: "Кулебаки", country: "RU", temp: -29 },
    { name: "Лукоянов", country: "RU", temp: -29 },
    { name: "Первомайск", country: "RU", temp: -29 },
    { name: "Ряжск", country: "RU", temp: -26 },
    { name: "Новомичуринск", country: "RU", temp: -26 },
    { name: "Спас-Клепики", country: "RU", temp: -26 },
    { name: "Шацк", country: "RU", temp: -26 },
    { name: "Суворов", country: "RU", temp: -25 },
    { name: "Ясногорск", country: "RU", temp: -25 },
    { name: "Плавск", country: "RU", temp: -25 },
    { name: "Белев", country: "RU", temp: -25 },
    { name: "Венев", country: "RU", temp: -25 },
    { name: "Калязин", country: "RU", temp: -27 },
    { name: "Кашин", country: "RU", temp: -27 },
    { name: "Осташков", country: "RU", temp: -26 },
    { name: "Нелидово", country: "RU", temp: -25 },
    { name: "Западная Двина", country: "RU", temp: -25 },
    { name: "Торопец", country: "RU", temp: -25 },
    { name: "Красный Холм", country: "RU", temp: -28 },
    { name: "Ельня", country: "RU", temp: -24 },
    { name: "Дорогобуж", country: "RU", temp: -24 },
    { name: "Рудня", country: "RU", temp: -23 },
    { name: "Карачев", country: "RU", temp: -24 },
    { name: "Жуковка", country: "RU", temp: -24 },
    { name: "Почеп", country: "RU", temp: -24 },
    { name: "Трубчевск", country: "RU", temp: -24 },
    { name: "Стародуб", country: "RU", temp: -24 },
    { name: "Сельцо", country: "RU", temp: -24 },
    { name: "Фокино (Брян. обл.)", country: "RU", temp: -24 },
    { name: "Дмитровск", country: "RU", temp: -24 },
    { name: "Болхов", country: "RU", temp: -24 },
    { name: "Новосиль", country: "RU", temp: -24 },
    { name: "Малоархангельск", country: "RU", temp: -24 },
    { name: "Фатеж", country: "RU", temp: -24 },
    { name: "Рыльск", country: "RU", temp: -24 },
    { name: "Льгов", country: "RU", temp: -24 },
    { name: "Дмитриев", country: "RU", temp: -24 },
    { name: "Обоянь", country: "RU", temp: -24 },
    { name: "Щигры", country: "RU", temp: -24 },
    { name: "Суджа", country: "RU", temp: -24 },
    { name: "Строитель", country: "RU", temp: -22 },
    { name: "Валуйки", country: "RU", temp: -22 },
    { name: "Alekseevka", country: "RU", temp: -22 },
    { name: "Новый Oskol", country: "RU", temp: -22 },
    { name: "Бирюч", country: "RU", temp: -22 },
    { name: "Короча", country: "RU", temp: -22 },
    { name: "Грайворон", country: "RU", temp: -22 },
    { name: "Данков", country: "RU", temp: -25 },
    { name: "Лебедянь", country: "RU", temp: -25 },
    { name: "Усмань", country: "RU", temp: -25 },
    { name: "Задонск", country: "RU", temp: -25 },
    { name: "Чаплыгин", country: "RU", temp: -25 },
    { name: "Кирсанов", country: "RU", temp: -26 },
    { name: "Жердевка", country: "RU", temp: -26 },
    { name: "Ртищево", country: "RU", temp: -25 },
    { name: "Пугачев", country: "RU", temp: -26 },
    { name: "Петровск", country: "RU", temp: -25 },
    { name: "Аткарск", country: "RU", temp: -25 },
    { name: "Красноармейск (Сарат. обл.)", country: "RU", temp: -25 },
    { name: "Маркс", country: "RU", temp: -25 },
    { name: "Хвалынск", country: "RU", temp: -26 },
    { name: "Аркадак", country: "RU", temp: -25 },
    { name: "Шиханы", country: "RU", temp: -25 },
    { name: "Калининск", country: "RU", temp: -25 },
    { name: "Новоузенск", country: "RU", temp: -25 },
    { name: "Сердобск", country: "RU", temp: -27 },
    { name: "Нижний Ломов", country: "RU", temp: -27 },
    { name: "Никольск (Penz. obl.)", country: "RU", temp: -27 },
    { name: "Спасск (Пенз. обл.)", country: "RU", temp: -27 },
    { name: "Белинский", country: "RU", temp: -27 },
    { name: "Ковылкино", country: "RU", temp: -28 },
    { name: "Ардатов", country: "RU", temp: -28 },
    { name: "Инсар", country: "RU", temp: -28 },
    { name: "Темников", country: "RU", temp: -28 },
    { name: "Алатырь", country: "RU", temp: -29 },
    { name: "Шумерля", country: "RU", temp: -29 },
    { name: "Ядрин", country: "RU", temp: -29 },
    { name: "Цивильск", country: "RU", temp: -29 },
    { name: "Козловка", country: "RU", temp: -29 },
    { name: "Мариинский Посад", country: "RU", temp: -29 },
    { name: "Волжск", country: "RU", temp: -31 },
    { name: "Козьмодемьянск", country: "RU", temp: -31 },
    { name: "Звенигово", country: "RU", temp: -31 },
    { name: "Котельнич", country: "RU", temp: -31 },
    { name: "Яранск", country: "RU", temp: -31 },
    { name: "Нолинск", country: "RU", temp: -31 },
    { name: "Уржум", country: "RU", temp: -31 },
    { name: "Советск (Киров. обл.)", country: "RU", temp: -31 },
    { name: "Слободской", country: "RU", temp: -31 },
    { name: "Вятские Поляны", country: "RU", temp: -30 },
    { name: "Луза", country: "RU", temp: -32 },
    { name: "Зуевка", country: "RU", temp: -31 },
    { name: "Омутнинск", country: "RU", temp: -32 },
    { name: "Белая Холуница", country: "RU", temp: -31 },
    { name: "Камбарка", country: "RU", temp: -30 },
    { name: "Ува", country: "RU", temp: -30 },
    { name: "Балезино", country: "RU", temp: -30 },
    { name: "Игра", country: "RU", temp: -30 },
    { name: "Ясный", country: "RU", temp: -31 },
    { name: "Кувандык", country: "RU", temp: -31 },
    { name: "Абдулино", country: "RU", temp: -31 },
    { name: "Сорочинск", country: "RU", temp: -31 },
    { name: "Нефтегорск", country: "RU", temp: -29 },
    { name: "Похвистнево", country: "RU", temp: -29 },
    { name: "Октябрьск", country: "RU", temp: -29 },
    { name: "Сенгилей", country: "RU", temp: -29 },
    { name: "Барыш", country: "RU", temp: -29 },
    { name: "Инза", country: "RU", temp: -29 },
    { name: "Новоульяновск", country: "RU", temp: -29 },
    { name: "Мулловка", country: "RU", temp: -29 },
    { name: "Чердаклы", country: "RU", temp: -29 },

    // Казахстан
    { name: "Астана", country: "KZ", temp: -35 },
    { name: "Алматы", country: "KZ", temp: -19 },
    { name: "Шымкент", country: "KZ", temp: -11 },
    { name: "Караганда", country: "KZ", temp: -32 },
    { name: "Актобе", country: "KZ", temp: -29 },
    { name: "Тараз", country: "KZ", temp: -16 },
    { name: "Павлодар", country: "KZ", temp: -36 },
    { name: "Усть-Каменогорск", country: "KZ", temp: -37 },
    { name: "Семей", country: "KZ", temp: -37 },
    { name: "Атырау", country: "KZ", temp: -22 },
    { name: "Актау", country: "KZ", temp: -10 },
    { name: "Уральск", country: "KZ", temp: -30 },
    { name: "Костанай", country: "KZ", temp: -33 },
    { name: "Петропавловск", country: "KZ", temp: -35 },
    { name: "Кызылорда", country: "KZ", temp: -24 },
    { name: "Кокшетау", country: "KZ", temp: -34 },
    { name: "Taldykorgan", country: "KZ", temp: -22 },
    { name: "Туркестан", country: "KZ", temp: -15 },
    { name: "Жезказган", country: "KZ", temp: -30 },
    { name: "Темиртау", country: "KZ", temp: -32 },
    { name: "Конаев", country: "KZ", temp: -19 },
    { name: "Экибастуз", country: "KZ", temp: -36 },
    { name: "Рудный", country: "KZ", temp: -33 },
    { name: "Жанаозен", country: "KZ", temp: -10 },
    { name: "Кентау", country: "KZ", temp: -15 },
    { name: "Балхаш", country: "KZ", temp: -28 },
    { name: "Сатпаев", country: "KZ", temp: -30 },
    { name: "Степногорск", country: "KZ", temp: -34 },
    { name: "Риддер", country: "KZ", temp: -36 },
    { name: "Сарань", country: "KZ", temp: -32 },
    { name: "Жаркент", country: "KZ", temp: -20 },
    { name: "Аральск", country: "KZ", temp: -24 },
    { name: "Шу", country: "KZ", temp: -20 },
    { name: "Лисаковск", country: "KZ", temp: -32 },
    { name: "Аксу", country: "KZ", temp: -36 },
    { name: "Алтай (Зыряновск)", country: "KZ", temp: -38 },
    { name: "Аксай", country: "KZ", temp: -30 },
    { name: "Кандыагаш", country: "KZ", temp: -29 },
    { name: "Хромтау", country: "KZ", temp: -29 },
    { name: "Шалкар", country: "KZ", temp: -27 },
    { name: "Эмба", country: "KZ", temp: -27 },
    { name: "Алга", country: "KZ", temp: -29 },
    { name: "Мартук", country: "KZ", temp: -29 },
    { name: "Аягоз", country: "KZ", temp: -37 },
    { name: "Шемонаиха", country: "KZ", temp: -37 },
    { name: "Зайсан", country: "KZ", temp: -35 },
    { name: "Серебрянск", country: "KZ", temp: -37 },
    { name: "Шар", country: "KZ", temp: -37 },
    { name: "Курчатов (Каз.)", country: "KZ", temp: -37 },
    { name: "Атбасар", country: "KZ", temp: -36 },
    { name: "Макинск", country: "KZ", temp: -35 },
    { name: "Акколь", country: "KZ", temp: -35 },
    { name: "Есиль", country: "KZ", temp: -36 },
    { name: "Ерейментау", country: "KZ", temp: -36 },
    { name: "Щучинск", country: "KZ", temp: -35 },
    { name: "Державинск", country: "KZ", temp: -36 },
    { name: "Аркалык", country: "KZ", temp: -33 },
    { name: "Житикара", country: "KZ", temp: -33 },
    { name: "Тобол (пгт)", country: "KZ", temp: -33 },
    { name: "Арыс", country: "KZ", temp: -13 },
    { name: "Ленгер", country: "KZ", temp: -15 },
    { name: "Шардара", country: "KZ", temp: -12 },
    { name: "Сарыагаш", country: "KZ", temp: -12 },
    { name: "Жетысай", country: "KZ", temp: -11 },
    { name: "Жанатас", country: "KZ", temp: -18 },
    { name: "Каратау", country: "KZ", temp: -18 },
    { name: "Талгар", country: "KZ", temp: -19 },
    { name: "Есик", country: "KZ", temp: -19 },
    { name: "Каскелен", country: "KZ", temp: -19 },
    { name: "Текели", country: "KZ", temp: -22 },
    { name: "Сарканд", country: "KZ", temp: -24 },
    { name: "Ушарал", country: "KZ", temp: -26 },
    { name: "Абай", country: "KZ", temp: -32 },
    { name: "Шахтинск", country: "KZ", temp: -32 },
    { name: "Каражал", country: "KZ", temp: -31 },
    { name: "Приозерск (Каз.)", country: "KZ", temp: -27 },
    { name: "Тайынша", country: "KZ", temp: -35 },
    { name: "Булаево", country: "KZ", temp: -35 },
    { name: "Сергеевка", country: "KZ", temp: -35 },
    { name: "Мамлютка", country: "KZ", temp: -35 },
    { name: "Форт-Шевченко", country: "KZ", temp: -10 },

    // Беларусь
    { name: "Минск", country: "BY", temp: -22 },
    { name: "Гомель", country: "BY", temp: -23 },
    { name: "Могилев", country: "BY", temp: -23 },
    { name: "Витебск", country: "BY", temp: -25 },
    { name: "Гродно", country: "BY", temp: -20 },
    { name: "Брест", country: "BY", temp: -19 },
    { name: "Бобруйск", country: "BY", temp: -23 },
    { name: "Барановичи", country: "BY", temp: -21 },
    { name: "Пинск", country: "BY", temp: -20 },
    { name: "Орша", country: "BY", temp: -24 },
    { name: "Борисов", country: "BY", temp: -22 },
    { name: "Лида", country: "BY", temp: -20 },
    { name: "Мозырь", country: "BY", temp: -22 },
    { name: "Солигорск", country: "BY", temp: -22 },
    { name: "Новополоцк", country: "BY", temp: -25 },
    { name: "Полоцк", country: "BY", temp: -25 },
    { name: "Светлогорск", country: "BY", temp: -22 },
    { name: "Жлобин", country: "BY", temp: -23 },
    { name: "Речица", country: "BY", temp: -23 },
    { name: "Слуцк", country: "BY", temp: -22 },
    { name: "Жодино", country: "BY", temp: -22 },
    { name: "Кобрин", country: "BY", temp: -20 },
    { name: "Волковыск", country: "BY", temp: -20 },
    { name: "Сморгонь", country: "BY", temp: -23 },
    { name: "Новогрудок", country: "BY", temp: -22 },
    { name: "Дзержинск (Бел.)", country: "BY", temp: -22 },
    { name: "Калинковичи", country: "BY", temp: -22 },
    { name: "Рогачев", country: "BY", temp: -23 },
    { name: "Поставы", country: "BY", temp: -24 },
    { name: "Глубокое", country: "BY", temp: -24 },
    { name: "Лепель", country: "BY", temp: -24 },
    { name: "Новолукомль", country: "BY", temp: -24 },
    { name: "Городок", country: "BY", temp: -25 },
    { name: "Барань", country: "BY", temp: -24 },
    { name: "Толочин", country: "BY", temp: -24 },
    { name: "Браслав", country: "BY", temp: -24 },
    { name: "Шклов", country: "BY", temp: -23 },
    { name: "Быхов", country: "BY", temp: -23 },
    { name: "Горки", country: "BY", temp: -24 },
    { name: "Костюковичи", country: "BY", temp: -23 },
    { name: "Климовичи", country: "BY", temp: -23 },
    { name: "Мстиславль", country: "BY", temp: -24 },
    { name: "Чаусы", country: "BY", temp: -23 },
    { name: "Чериков", country: "BY", temp: -23 },
    { name: "Осиповичи", country: "BY", temp: -23 },
    { name: "Кличев", country: "BY", temp: -23 },
    { name: "Добруш", country: "BY", temp: -23 },
    { name: "Петриков", country: "BY", temp: -22 },
    { name: "Хойники", country: "BY", temp: -23 },
    { name: "Житковичи", country: "BY", temp: -22 },
    { name: "Ельск", country: "BY", temp: -22 },
    { name: "Буда-Кошелево", country: "BY", temp: -23 },
    { name: "Чечерск", country: "BY", temp: -23 },
    { name: "Вилейка", country: "BY", temp: -22 },
    { name: "Молодечно", country: "BY", temp: -22 },
    { name: "Марьина Горка", country: "BY", temp: -22 },
    { name: "Столбцы", country: "BY", temp: -22 },
    { name: "Nesvizh", country: "BY", temp: -22 },
    { name: "Клецк", country: "BY", temp: -22 },
    { name: "Копыль", country: "BY", temp: -22 },
    { name: "Воложин", country: "BY", temp: -22 },
    { name: "Любань", country: "BY", temp: -22 },
    { name: "Смолевичи", country: "BY", temp: -22 },
    { name: "Фаниполь", country: "BY", temp: -22 },
    { name: "Логойск", country: "BY", temp: -22 },
    { name: "Березно", country: "BY", temp: -22 },
    { name: "Узда", country: "BY", temp: -22 },
    { name: "Заславль", country: "BY", temp: -22 },
    { name: "Слоним", country: "BY", temp: -21 },
    { name: "Ошмяны", country: "BY", temp: -22 },
    { name: "Мосты", country: "BY", temp: -20 },
    { name: "Щучин", country: "BY", temp: -20 },
    { name: "Скидель", country: "BY", temp: -20 },
    { name: "Островец", country: "BY", temp: -22 },
    { name: "Дятлово", country: "BY", temp: -21 },
    { name: "Ивацевичи", country: "BY", temp: -20 },
    { name: "Пружаны", country: "BY", temp: -19 },
    { name: "Ляховичи", country: "BY", temp: -21 },
    { name: "Ганцевичи", country: "BY", temp: -21 },
    { name: "Микашевичи", country: "BY", temp: -20 },
    { name: "Жабинка", country: "BY", temp: -19 },
    { name: "Береза", country: "BY", temp: -20 },
    { name: "Лунинец", country: "BY", temp: -20 },
    { name: "Столин", country: "BY", temp: -20 },
    { name: "Дрогичин", country: "BY", temp: -19 },
    { name: "Иваново (Бел.)", country: "BY", temp: -19 },
    { name: "Каменец", country: "BY", temp: -19 },
    { name: "Малорита", country: "BY", temp: -19 },

    // Украина
    { name: "Киев", country: "UA", temp: -20 },
    { name: "Харьков", country: "UA", temp: -22 },
    { name: "Одесса", country: "UA", temp: -14 },
    { name: "Днепр", country: "UA", temp: -20 },
    { name: "Львов", country: "UA", temp: -19 },
    { name: "Кривой Рог", country: "UA", temp: -20 },
    { name: "Николаев", country: "UA", temp: -17 },
    { name: "Винница", country: "UA", temp: -19 },
    { name: "Полтава", country: "UA", temp: -21 },
    { name: "Чернигов", country: "UA", temp: -21 },
    { name: "Черкассы", country: "UA", temp: -20 },
    { name: "Житомир", country: "UA", temp: -19 },
    { name: "Сумы", country: "UA", temp: -22 },
    { name: "Хмельницкий", country: "UA", temp: -19 },
    { name: "Ровно", country: "UA", temp: -19 },
    { name: "Ивано-Франковск", country: "UA", temp: -19 },
    { name: "Тернополь", country: "UA", temp: -19 },
    { name: "Луцк", country: "UA", temp: -19 },
    { name: "Ужгород", country: "UA", temp: -16 },
    { name: "Черновцы", country: "UA", temp: -18 },
    { name: "Кропивницкий", country: "UA", temp: -20 },
    { name: "Каменское", country: "UA", temp: -20 },
    { name: "Кременчуг", country: "UA", temp: -21 },
    { name: "Белая Церковь", country: "UA", temp: -20 },
    { name: "Никополь", country: "UA", temp: -20 },
    { name: "Павлоград", country: "UA", temp: -20 },
    { name: "Умань", country: "UA", temp: -20 },
    { name: "Мукачево", country: "UA", temp: -17 },
    { name: "Бердичев", country: "UA", temp: -20 },
    { name: "Дрогобыч", country: "UA", temp: -19 },
    { name: "Нежин", country: "UA", temp: -21 },
    { name: "Конотоп", country: "UA", temp: -22 },
    { name: "Калуш", country: "UA", temp: -19 },
    { name: "Смела", country: "UA", temp: -20 }
];

/**
 * Тарифы на природный газ для населения, ₽/м³ — для прогноза стоимости
 * отопления газовым котлом (app.calcGasHeatingCost).
 *
 * Единого тарифа по стране не существует: цену устанавливает каждый субъект
 * РФ, и внутри субъекта она ещё делится по категориям — плита, колонка,
 * отопление. Нам нужна категория ОТОПЛЕНИЯ, и она во всех проверенных
 * регионах самая дешёвая из трёх (Рязань: плита 10.1, отопление 8.61;
 * Подмосковье: плита 9.71, отопление 8.51; Ростов: 9.30 и 9.10). Поэтому там,
 * где источник даёт вилку по категориям, берём её нижнюю границу.
 *
 * Значения — после индексации с 1 января 2026 года (+1.7 % из-за НДС 22 %).
 * Следующая индексация 1 октября 2026, оптовые цены ФАС проиндексирует на
 * 9.6 % — после неё таблицу надо обновить.
 *
 * ВНИМАНИЕ: покрыты не все 85 субъектов, а только те, по которым нашёлся
 * источник с датой. Для остальных городов подставляется GAS_TARIFF_RU_DEFAULT,
 * и подсказка честно пишет, что это средняя цифра, а не тариф города.
 * Придумывать цены по остальным регионам нельзя: монтажник назовёт заказчику
 * неверную стоимость эксплуатации.
 */
const GAS_TARIFF_RU = {
    // Ключ — субъект в написании CITY_GEO.region из cities_geo.js: по нему
    // город и находит свой тариф.
    //
    // Здесь остались ТОЛЬКО те регионы, которые не читает AutoGasTariff.py:
    // у Краснодарского края таблица разбита по муниципалитетам, а страниц
    // Татарстана и Севастополя в источнике нет вовсе. Всё остальное берётся
    // из gas_tariffs.js — держать одну и ту же цифру в двух местах нельзя,
    // они разъедутся при первом же обновлении тарифов.
    //
    // Значения — после индексации с 1 января 2026 года, категория
    // «отопление». Севастополю проставлена цена Крыма.
    "Краснодарский край": 8.00,
    "Татарстан": 8.55,
    "Севастополь": 7.07
};
// Медиана по найденным регионам. Ставится городам, регион которых в таблице не
// описан, и помечается в подсказке как ориентир.
const GAS_TARIFF_RU_DEFAULT = 8.5;
const WALL_MATERIALS_DB = [
    { id: "brick_clay", name: "Кирпич полнотелый (глиняный)", lambda: 0.70 },
    { id: "brick_hollow", name: "Кирпич пустотелый", lambda: 0.44 },
    { id: "gas_d400", name: "Газобетон D400", lambda: 0.117 },
    { id: "gas_d500", name: "Газобетон D500", lambda: 0.141 },
    { id: "gas_d600", name: "Газобетон D600", lambda: 0.163 },
    { id: "ceramic_block", name: "Керамический блок (Теплая керамика)", lambda: 0.16 },
    { id: "wood_pine", name: "Брус деревянный (сосна/ель)", lambda: 0.15 },
    { id: "concrete", name: "Железобетон / Монолит", lambda: 2.04 },
    { id: "polystyrene", name: "Пенополистирол (Пенопласт)", lambda: 0.041 },
    { id: "minwool", name: "Минеральная вата (базальт)", lambda: 0.042 },
    { id: "xps", name: "Экструдированный пенополистирол (XPS)", lambda: 0.032 },
    { id: "plaster_cement", name: "Штукатурка цементная", lambda: 0.93 },
    { id: "plaster_gypsum", name: "Гипсокартон / Гипсовая штук.", lambda: 0.21 }
];
const WALL_DESC = { 0.8: "⬜ Тёплый (Газобетон)", 1.0: "🧱 Стандарт (Кирпич)", 1.3: "🪵 Холодный (Дерево)" };

// === БАЗЫ МАТЕРИАЛОВ ДЛЯ РАСЧЁТА ТЕПЛОПОТЕРЬ ===
// Кровля / чердачное перекрытие (R, м²·°C/Вт по СП 50.13330)
const ROOF_MATERIALS_DB = [
    { id: "roof_mw400", name: "Мин. вата 400 мм (кровля)", shortName: "Мин.вата 400мм", R: 10.53 },
    { id: "roof_mw350", name: "Мин. вата 350 мм (кровля)", shortName: "Мин.вата 350мм", R: 9.21 },
    { id: "roof_mw300", name: "Мин. вата 300 мм (кровля)", shortName: "Мин.вата 300мм", R: 7.89 },
    { id: "roof_mw250", name: "Мин. вата 250 мм (кровля)", shortName: "Мин.вата 250мм", R: 6.58 },
    { id: "roof_mw200", name: "Мин. вата 200 мм (кровля)", shortName: "Мин.вата 200мм", R: 5.26 },
    { id: "roof_mw150", name: "Мин. вата 150 мм (кровля)", shortName: "Мин.вата 150мм", R: 3.95 },
    { id: "roof_mw100", name: "Мин. вата 100 мм (кровля)", shortName: "Мин.вата 100мм", R: 2.63 },
    { id: "roof_xps300", name: "XPS (Пеноплекс) 300 мм", shortName: "XPS 300мм", R: 9.38 },
    { id: "roof_xps250", name: "XPS (Пеноплекс) 250 мм", shortName: "XPS 250мм", R: 7.81 },
    { id: "roof_xps200", name: "XPS (Пеноплекс) 200 мм", shortName: "XPS 200мм", R: 6.25 },
    { id: "roof_xps150", name: "XPS (Пеноплекс) 150 мм", shortName: "XPS 150мм", R: 4.69 },
    { id: "roof_xps100", name: "XPS (Пеноплекс) 100 мм", shortName: "XPS 100мм", R: 3.13 },
    { id: "roof_wood_ins", name: "Деревянное перекрытие утеплённое", shortName: "Дерев. утепл.", R: 4.00 },
    { id: "roof_concrete", name: "Ж/б перекрытие без утепления", shortName: "Ж/б плита", R: 0.50 }
];

// Пол / перекрытие над холодным подвалом (R, м²·°C/Вт)
const FLOOR_MATERIALS_DB = [
    { id: "floor_ground_ins", name: "Пол по грунту утеплённый (XPS 100мм)", shortName: "Грунт XPS 100мм", R: 2.80 },
    { id: "floor_ground_ins50", name: "Пол по грунту утеплённый (XPS 50мм)", shortName: "Грунт XPS 50мм", R: 1.90 },
    { id: "floor_lags_ins", name: "Пол на лагах, мин. вата 150 мм", shortName: "Лаги МВ 150мм", R: 3.20 },
    { id: "floor_basement_ins", name: "Пол над холодным подвалом (утеплённый)", shortName: "Подвал утепл.", R: 2.50 },
    { id: "floor_basement_bare", name: "Пол над холодным подвалом (без утепления)", shortName: "Подвал", R: 0.80 },
    { id: "floor_heated", name: "Пол над отапливаемым помещением", shortName: "Над теплым", R: 0.00 }
];

// Остекление / окна (R, м²·°C/Вт)
const GLAZING_DB = [
    { id: "glz_2cam", name: "Двухкамерный стеклопакет", shortName: "2-кам. СП", R: 0.51 },
    { id: "glz_3cam", name: "Трёхкамерный стеклопакет (i-стекло)", shortName: "3-кам. СП", R: 0.80 },
    { id: "glz_1cam", name: "Однокамерный стеклопакет", shortName: "1-кам. СП", R: 0.38 },
    { id: "glz_single", name: "Одинарное стекло", shortName: "Одинарное", R: 0.17 }
];

const STANDARD_THICKNESSES = {
    brick_clay: [65, 120, 250, 380, 510, 640],
    brick_hollow: [65, 120, 250, 380, 510, 640],
    gas_d400: [100, 150, 200, 250, 300, 350, 375, 400, 500],
    gas_d500: [100, 150, 200, 250, 300, 350, 375, 400, 500],
    gas_d600: [100, 150, 200, 250, 300, 350, 375, 400, 500],
    ceramic_block: [80, 120, 250, 380, 440, 510],
    wood_pine: [100, 150, 180, 200, 220, 240],
    concrete: [100, 120, 140, 160, 180, 200, 250, 300],
    polystyrene: [20, 30, 40, 50, 80, 100, 120, 150],
    minwool: [30, 50, 100, 150, 200, 250, 300, 350, 400],
    xps: [20, 30, 40, 50, 80, 100, 120, 150, 200, 250, 300],
    plaster_cement: [5, 10, 15, 20, 25, 30, 35, 40],
    plaster_gypsum: [5, 10, 12, 15, 20, 25, 30]
};

const getImg = (item) => {
    if (!item || !item.name) return '';

    // ОБНОВЛЕННАЯ ПРОВЕРКА АВТОРИЗАЦИИ: иконки видны всем залогиненным (TG, Google, Email)
    const isAuthenticated = typeof app !== 'undefined' && app.state && (app.state.tgUser || app.state.user || app.state.currentUser);
    if (!isAuthenticated) {
        return '';
    }

    // Если бренд пустой или состоит из пробела (своё оборудование)
    if (item.brand === "" || item.brand === " ") {
        return `<div style="width:24px; height:24px; background:transparent; display:inline-flex; margin-right:8px; flex-shrink:0;"></div>`;
    }

    let imgSrc = `img/${item.id}.jpg`;
    return `<img src="${imgSrc}" class="prod-thumb" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.visibility='hidden';">`;
};
const workPrices = {
    boiler_gas: 20000,
    boiler_el: 18000,
    boiler_tank: 9000,
    pump_group: 6500,
    manifold: 6000,
    tee_branch: 2500,
    ufh_pipe: 450,
    ufh_insulation: 390,
    rad_point: 6500,
    water_point: 3700,
    sewer_point: 3500,
    toilet_install: 8000
};

// Полный список монтажных работ, которые app.render() добавляет в смету (addToWorks(name, qty,
// price, unit, group)). Используется вкладкой «Прайс-лист монтаж» личного кабинета — название
// работы (name) служит ключом персональной цены монтажника (app.installerSettings.workPrices),
// тем же ключом, что и state.customWorks (переопределение цены в рамках одной сметы).
// Важно: названия здесь должны дословно совпадать со строками в addToWorks() в app.js.
const WORK_PRICE_CATALOG = [
    // 1.1 Монтаж котла и бойлера
    { name: "Mонтаж электрического котла", unit: "шт", price: 18000, group: "1.1 Монтаж котла и бойлера" },
    { name: "Монтаж газового котла", unit: "шт", price: 20000, group: "1.1 Монтаж котла и бойлера" },
    { name: "Монтаж коаксиального дымохода", unit: "шт", price: 10000, group: "1.1 Монтаж котла и бойлера" },
    { name: "Монтаж отверстия под дымоход", unit: "шт", price: 6000, group: "1.1 Монтаж котла и бойлера" },
    { name: "Монтаж стабилизатора напряжения", unit: "шт", price: 1500, group: "1.1 Монтаж котла и бойлера" },
    { name: "Монтаж комплекта 3-х ходового клапана Fugas", unit: "компл", price: 4500, group: "1.1 Монтаж котла и бойлера" },
    { name: "Монтаж водонагревателя / бойлера", unit: "шт", price: 9000, group: "1.1 Монтаж котла и бойлера" },
    { name: "Подключение бойлера косвенного нагрева (монтаж гидравлики)", unit: "компл", price: 12000, group: "1.1 Монтаж котла и бойлера" },
    { name: "Установка расширительного бака водоснабжения", unit: "шт", price: 4500, group: "1.1 Монтаж котла и бойлера" },
    { name: "Монтаж запорной арматуры и американок бойлера", unit: "шт", price: 950, group: "1.1 Монтаж котла и бойлера" },

    // 1.2 Монтаж обвязки котельной
    { name: "Монтаж гидравлической стрелки", unit: "шт", price: 6500, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж распределительного коллектора котельной", unit: "шт", price: 5500, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж гидравлики ГВС (подпитка СО + подключение ГВС)", unit: "компл", price: 9000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж системы рециркуляции", unit: "компл", price: 8000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж коллектора и гидрострелки", unit: "шт", price: 12000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж насосной группы", unit: "шт", price: 6500, group: "1.2 Монтаж обвязки котельной" },
    { name: "Сборка и установка узла подмеса", unit: "шт", price: 6000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Установка насоса", unit: "шт", price: 3000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж ГИДРАВЛИКИ: от котла до коллектора т.пола", unit: "компл", price: 15000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж ГИДРАВЛИКИ: от котла - магистральные трубопроводы радиаторов", unit: "компл", price: 9000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж ГИДРАВЛИКИ: расширительные баки, предохранительные клапаны", unit: "компл", price: 9000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Опрессовка котельной", unit: "компл", price: 5000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Пусконаладка котельной", unit: "компл", price: 12000, group: "1.2 Монтаж обвязки котельной" },
    { name: "Монтаж электрики котельной", unit: "компл", price: 12000, group: "1.2 Монтаж обвязки котельной" },

    // 1.3 Монтаж радиаторного отопления
    { name: "Монтаж радиатора отопления", unit: "точка", price: workPrices.rad_point, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж внутрипольного конвектора", unit: "шт", price: 8500, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж водяного полотенцесушителя с обвязкой", unit: "шт", price: 4500, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж электрического полотенцесушителя (навеска и подключение)", unit: "шт", price: 3000, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж коллектора радиаторов", unit: "шт", price: workPrices.manifold, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж тройниковой разводки радиаторов", unit: "точка", price: workPrices.tee_branch, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж механической термоголовки", unit: "шт", price: 350, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж узла нижнего подключения радиатора", unit: "шт", price: 800, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж Г-образной трубки подключения радиатора", unit: "шт", price: 900, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж комплекта фиксаторов поворота \"башмак\"", unit: "шт", price: 600, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж настенного регулятора Vartronic", unit: "шт", price: 3500, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Установка коллектора для радиаторов", unit: "пара", price: 6000, group: "1.3 Монтаж радиаторного отопления" },
    { name: "Монтаж и обвязка распределительных шкафов", unit: "шт", price: 4000, group: "1.3 Монтаж радиаторного отопления" },

    // 1.4 Монтаж водяного тёплого пола
    { name: "Монтаж труб водяного тёплого пола", unit: "м²", price: 750, group: "1.4 Монтаж водяного теплого пола" },
    { name: "Монтаж утеплителя для укладки ТП", unit: "м²", price: 350, group: "1.4 Монтаж водяного теплого пола" },
    { name: "Прокладка транзитной трассы до коллекторов ТП", unit: "м.п.", price: 450, group: "1.4 Монтаж водяного теплого пола" },
    { name: "Установка и подключение коллектора теплого пола", unit: "пара", price: 6500, group: "1.4 Монтаж водяного теплого пола" },
    { name: "Опрессовка систем водяного тёплого пола", unit: "компл", price: 5000, group: "1.4 Монтаж водяного теплого пола" },

    // 1.5 Автоматика котельной
    // Работы по контроллеру отопления. Идут поверх «Монтажа электрики
    // котельной» и «Пусконаладки котельной»: те покрывают обычную котельную
    // (расключить насосы, датчик бойлера, комнатный термостат), а настройка
    // контуров, кривых ПЗА, каскада и регистрации в сервисе — отдельный труд.
    { name: "Монтаж контроллера отопления", unit: "шт", price: 6000, group: "1.5 Автоматика котельной" },
    { name: "Подключение котла к контроллеру по цифровой шине", unit: "шт", price: 3500, group: "1.5 Автоматика котельной" },
    { name: "Подключение датчиков температуры контроллера", unit: "компл", price: 5000, group: "1.5 Автоматика котельной" },
    { name: "Подключение исполнительных устройств контура (насос, сервопривод)", unit: "контур", price: 2500, group: "1.5 Автоматика котельной" },
    { name: "Монтаж блока расширения и линии RS-485", unit: "шт", price: 4000, group: "1.5 Автоматика котельной" },
    { name: "Монтаж комнатного датчика / термостата контроллера", unit: "шт", price: 3500, group: "1.5 Автоматика котельной" },
    { name: "Монтаж радиомодуля", unit: "шт", price: 2500, group: "1.5 Автоматика котельной" },
    { name: "Монтаж выносной панели управления", unit: "шт", price: 3500, group: "1.5 Автоматика котельной" },
    { name: "Монтаж датчика протечки", unit: "шт", price: 1200, group: "1.5 Автоматика котельной" },
    { name: "Монтаж крана защиты от протечки с электроприводом", unit: "шт", price: 4500, group: "1.5 Автоматика котельной" },
    { name: "Монтаж соленоидного клапана защиты от протечки", unit: "шт", price: 3000, group: "1.5 Автоматика котельной" },
    { name: "Монтаж датчика давления", unit: "шт", price: 2000, group: "1.5 Автоматика котельной" },
    { name: "Монтаж узла автоматической подпитки", unit: "компл", price: 4500, group: "1.5 Автоматика котельной" },
    { name: "Монтаж узла ручной подпитки", unit: "компл", price: 2500, group: "1.5 Автоматика котельной" },
    { name: "Пусконаладка автоматики отопления (контуры, ПЗА, каскад, сервис)", unit: "компл", price: 9000, group: "1.5 Автоматика котельной" },
    // Базовый уровень (Thermatic 1002): встроенное реле одно, и всё, что сверх
    // него, вешается отдельным модулем. Пусконаладка дешевле — контуров и
    // каскада с ротацией по нескольким узлам здесь нет, настраивается котёл,
    // бойлер и погодная кривая.
    { name: "Монтаж дополнительного релейного модуля", unit: "шт", price: 2000, group: "1.5 Автоматика котельной" },
    { name: "Монтаж разветвителя контактных датчиков", unit: "шт", price: 1500, group: "1.5 Автоматика котельной" },
    { name: "Пусконаладка автоматики отопления (котёл, ГВС, ПЗА)", unit: "компл", price: 5000, group: "1.5 Автоматика котельной" },

    // 1.4 Автоматика для теплого пола
    { name: "Монтаж коммутационного блока", unit: "шт", price: 5000, group: "1.4 Автоматика для теплого пола" },
    { name: "Монтаж сервоприводов", unit: "шт", price: 1000, group: "1.4 Автоматика для теплого пола" },
    { name: "Монтаж умной термоголовки Zigbee", unit: "шт", price: 1000, group: "1.4 Автоматика для теплого пола" },
    { name: "Монтаж и настройка беспроводного шлюза Zigbee", unit: "шт", price: 2500, group: "1.4 Автоматика для теплого пола" },
    { name: "Монтаж термостатов", unit: "шт", price: 4500, group: "1.4 Автоматика для теплого пола" },
    { name: "Монтаж закладной для датчика пола", unit: "шт", price: 1000, group: "1.4 Автоматика для теплого пола" },
    { name: "Прокладка провода на термостаты", unit: "м.п.", price: 100, group: "1.4 Автоматика для теплого пола" },

    // 2.1 Внешнее водоснабжение
    { name: "Подключение ХВС к бойлеру косвенного нагрева ГВС", unit: "компл", price: 5000, group: "2.1 Внешнее водоснабжение" },
    { name: "Монтаж скважинного насоса (опуск, оголовок, автоматика)", unit: "компл", price: 15000, group: "2.1 Внешнее водоснабжение" },
    { name: "Прокладка трубы ПНД в траншее", unit: "м.п.", price: 400, group: "2.1 Внешнее водоснабжение" },
    { name: "Ввод воды в дом (греющий кабель, теплоизоляция)", unit: "компл", price: 5000, group: "2.1 Внешнее водоснабжение" },

    // 2.2 Монтаж узла ввода ХВС
    { name: "Монтаж гидравлики ХВС (узел ввода, фильтры, байпас)", unit: "компл", price: 20000, group: "2.2 Монтаж узла ввода ХВС" },
    { name: "Монтаж системы фильтрации Big Blue (колбы + картриджи)", unit: "компл", price: 3500, group: "2.2 Монтаж узла ввода ХВС" },
    { name: "Монтаж незамерзающего уличного крана", unit: "шт", price: 5000, group: "2.2 Монтаж узла ввода ХВС" },

    // 2.3 Внутреннее водоснабжение
    { name: "Точка присоединения ХВС (монтаж трубопроводов, водорозетки)", unit: "точка", price: 3700, group: "2.3 Внутреннее водоснабжение" },
    { name: "Точка присоединения ГВС (монтаж трубопроводов, водорозетки)", unit: "точка", price: 4500, group: "2.3 Внутреннее водоснабжение" },
    { name: "Точка присоединения рециркуляции ГВС", unit: "точка", price: 3700, group: "2.3 Внутреннее водоснабжение" },
    { name: "Установка и подключение коллектора системы водоснабжения", unit: "шт", price: 4500, group: "2.3 Внутреннее водоснабжение" },
    { name: "Монтаж циркуляционного насоса рециркуляции ГВС", unit: "шт", price: 4500, group: "2.3 Внутреннее водоснабжение" },

    // 3.1 Внутренняя канализация
    { name: "Монтаж труб канализации (без метража)", unit: "точка", price: 3500, group: "3.1 Внутренняя канализация" },
    { name: "Монтаж инсталляции унитаза", unit: "шт", price: 8000, group: "3.1 Внутренняя канализация" }
];

const catalog = {
    dhw_pump: [
        { id: "RCP-0005-152080", name: "Насос ГВС COMFORT с таймером (80 мм)", price: 12018, brand: "ROMMER", desc: "Насос рециркуляции с таймером.", rommer: { id: "RCP-0005-150480", name: "Насос ГВС COMFORT, корпус латунь (80 мм)", price: 6060, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "RCP-0005-151780", name: "Насос ГВС COMFORT (80 мм)", price: 10926, brand: "ROMMER", desc: "Насос рециркуляции базовый.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCP-0005-150480", name: "Насос ГВС COMFORT, корпус латунь (80 мм)", price: 6009, brand: "ROMMER", desc: "Бюджетный насос, корпус латунь.", availability: "in_stock", price_date: "2026-08-10" }
    ],
    dhw_fittings: [
        { id: "SFT-0041-000001", name: "Американка 1\" ВР/НР (Змеевик бойлера)", price: 1016, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVB-0002-200025", name: "Кран шаровой 1\" ВР/ВР (Змеевик бойлера)", price: 1657, rommer: { id: "RBV-0003-2110225", name: "Кран шаровой ВР/ВР бабочка 1\"", price: 905, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0041-000034", name: "Американка 3/4\" ВР/НР (ГВС/Рецирк)", price: 597, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVB-0002-200020", name: "Кран шаровой 3/4\" ВР/ВР (Бабочка)", price: 1052, rommer: { id: "RBV-0003-2110220", name: "Кран шаровой ВР/ВР бабочка 3/4\"", price: 464, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RVS-0003-006015", name: "Клапан предохранительный 6 бар", price: 471, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0031-000034", name: "Крестовина 3/4\" ВР", price: 1151, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVC-0012-000020", name: "Клапан обратный пружинный 3/4\"", price: 1128, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVB-0006-200020", name: "Кран шаровой 3/4\" НР/НР (Вход ХВС)", price: 1256, rommer: { id: "RBV-0007-2410220", name: "Кран шаровой 3/4\" НР/НР", price: 523, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RBV-0007-2410220", name: "Кран шаровой 3/4\" НР/НР", price: 549, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVC-0012-000020", name: "Обратный клапан 3/4\" (Для рециркуляции)", price: 1128, availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Латунные шаровые краны STOUT с ROMMER-аналогами — ходовой ряд 1/2…2".
    // В смете их пишут по условному проходу («кран 15») или по исполнению
    // («кран с американкой 3/4», «кран шар 3/4 ВВ»), поэтому в каталоге лежат
    // все исполнения одного размера: по ним же собирается таблица замены.
    // 3/4" и 1" ВР/ВР (Бабочка) не дублируются — они есть в dhw_fittings.
    // Прайс 07.2026.
    // Старая линейка «STOUT Шаровые краны» (SVB-XXXX-0000NN) снята с поставки
    // счётом 166275 от 18.08.2026 — вся, целиком. Взамен стоит линейка
    // «STOUT Шаровые краны ГОСТ» (SVB-XXXX-2000NN): то же соединение и та же
    // ручка, дороже на ~7 %. Стандартнопроходные (SVB-0011…0014) преемника не
    // получили — под них подставлены полнопроходные ГОСТ того же исполнения
    // (0012→0002, 0014→0004). Старые артикулы в подбор не возвращать.
    ball_valves: [
        // ВР/ВР — «ВВ» в рукописной смете
        { id: "SVB-0002-200015", name: "Кран шаровой 1/2\" ВР/ВР (Бабочка)", price: 725, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0003-0110215", name: "Кран шаровой ВР/ВР бабочка 1/2\"", price: 281.55, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0001-200032", name: "Кран шаровой 1 1/4\" ВР/ВР (Рычаг)", price: 2673, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0003-0110232", name: "Кран шаровой ВР/ВР бабочка 1 1/4\"", price: 1362.31, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0001-200040", name: "Кран шаровой 1 1/2\" ВР/ВР (Рычаг)", price: 3972, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVB-0001-200050", name: "Кран шаровой 2\" ВР/ВР (Рычаг)", price: 6264, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },

        // ВР/НР — «ВН»
        { id: "SVB-0004-200015", name: "Кран шаровой 1/2\" ВР/НР (Бабочка)", price: 789, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0004-0210215", name: "Кран шаровой ВР/НР бабочка 1/2\"", price: 295.53, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0004-200020", name: "Кран шаровой 3/4\" ВР/НР (Бабочка)", price: 1167, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0004-0210220", name: "Кран шаровой ВР/НР бабочка 3/4\"", price: 472.77, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0004-200025", name: "Кран шаровой 1\" ВР/НР (Бабочка)", price: 1784, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0004-0210225", name: "Кран шаровой ВР/НР бабочка 1\"", price: 934.97, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },

        // НР/НР
        { id: "SVB-0006-200015", name: "Кран шаровой 1/2\" НР/НР (Бабочка)", price: 902, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0007-0410215", name: "Кран шаровой НР/НР бабочка 1/2\"", price: 311.51, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0006-200025", name: "Кран шаровой 1\" НР/НР (Бабочка)", price: 1628, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0007-0410225", name: "Кран шаровой НР/НР бабочка 1\"", price: 984.12, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },

        // С американкой — прямой и угловой
        { id: "SVB-0007-200015", name: "Кран шаровой с американкой 1/2\" ВР/НР (Бабочка)", price: 1028, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0005-0510215", name: "Кран шаровой с американкой ВР/НР 1/2\"", price: 397.37, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0007-200020", name: "Кран шаровой с американкой 3/4\" ВР/НР (Бабочка)", price: 1556, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0005-0510220", name: "Кран шаровой с американкой ВР/НР 3/4\"", price: 640.13, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0007-200025", name: "Кран шаровой с американкой 1\" ВР/НР (Бабочка)", price: 2423, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0005-0510225", name: "Кран шаровой с американкой ВР/НР 1\"", price: 1371.43, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0008-200015", name: "Кран шаровой с американкой угловой 1/2\" ВР/НР", price: 1316, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0006-0610215", name: "Кран шаровой угловой с американкой ВР/НР 1/2\"", price: 423.33, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0008-200020", name: "Кран шаровой с американкой угловой 3/4\" ВР/НР", price: 2021, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0006-0610220", name: "Кран шаровой угловой с американкой ВР/НР 3/4\"", price: 709.16, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0008-200025", name: "Кран шаровой с американкой угловой 1\" ВР/НР", price: 3159, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0006-0610225", name: "Кран шаровой угловой с американкой ВР/НР 1\"", price: 1611.32, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } }
    ],
    boilers_gas: [
        { id: "GE0Q6QE0CRU", name: "Котёл газовый, одноконтурный (18 кВт)", article: "GE0Q6QE0CRU", price: 62324, power: 18, circuits: 1, type: "gas", brand: "Haier", availability: "in_stock", price_date: "2026-06-06" },
        { id: "GE0Q6RE0CRU", name: "Котёл газовый, одноконтурный (24 кВт)", article: "GE0Q6RE0CRU", price: 63464, power: 24, circuits: 1, type: "gas", brand: "Haier", availability: "in_stock", price_date: "2026-06-06" },
        { id: "GE0Q6NE0CRU", name: "Котёл газовый, двухконтурный (18 кВт)", article: "GE0Q6NE0CRU", price: 63464, power: 18, circuits: 2, type: "gas", brand: "Haier", availability: "in_stock", price_date: "2026-06-06" },
        { id: "GE0Q6PE0CRU", name: "Котёл газовый, двухконтурный (24 кВт)", article: "GE0Q6PE0CRU", price: 64553, power: 24, circuits: 2, type: "gas", brand: "Haier", availability: "in_stock", price_date: "2026-06-06" }
    ],
    boilers_baxi: [
        // ECO Nova
        { id: "100023936", name: "ECO Nova 10F", price: 77330, power: 10, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "100023937", name: "ECO Nova 14F", price: 77805, power: 14, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "100023938", name: "ECO Nova 18F", price: 59140, power: 18, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "100023939", name: "ECO Nova 24F", price: 59920, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "100023940", name: "ECO Nova 31F", price: 82220, power: 31, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "100023941", name: "ECO Nova 1.24F", price: 59640, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "100023942", name: "ECO Nova 1.31F", price: 81010, power: 31, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // ECO4S
        { id: "7659666", name: "ECO4S 1.24 F", price: 67400, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "7659668", name: "ECO4S 10 F", price: 68470, power: 10, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "7659669", name: "ECO4S 18 F", price: 71320, power: 18, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "7659670", name: "ECO4S 24 F", price: 73820, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "7659762", name: "ECO4S 24", price: 68760, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // ECO Life
        { id: "7860077", name: "ECO Life 1.14F", price: 62130, power: 14, circuits: 1, type: "gas", brand: "BAXI", availability: "on_order", price_date: "2026-07-13" },
        { id: "7814104", name: "ECO Life 24F", price: 62840, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "7813724", name: "ECO Life 31F", price: 86360, power: 31, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "7814105", name: "ECO Life 1.24F", price: 62630, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "7814108", name: "ECO Life 1.31F", price: 85070, power: 31, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // LUNA 3
        { id: "CSE45224366", name: "LUNA 3 240 i", price: 93120, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45624366", name: "LUNA 3 240 Fi", price: 106450, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45628366", name: "LUNA 3 280 Fi", price: 114930, power: 28, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45631366", name: "LUNA 3 310 Fi", price: 117560, power: 31, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45531366", name: "LUNA 3 1.310 Fi", price: 103100, power: 31, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // ECO Four
        { id: "CSE46114354", name: "ECO Four 1.14", price: 62490, power: 14, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE46514354", name: "ECO Four 1.14 F", price: 74390, power: 14, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE46124354", name: "ECO Four 1.24", price: 70470, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE46524354", name: "ECO Four 1.24 F", price: 78590, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE46224354", name: "ECO Four 24", price: 81150, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE46624354", name: "ECO Four 24 F", price: 90490, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // LUNA 3 Comfort
        { id: "CSE45224358", name: "LUNA 3 Comfort 240 i", price: 96190, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45624358", name: "LUNA 3 Comfort 240 Fi", price: 113220, power: 24, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45124358", name: "LUNA 3 Comfort 1.240 i", price: 91060, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45524358", name: "LUNA 3 Comfort 1.240 Fi", price: 101960, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45631358", name: "LUNA 3 Comfort 310 Fi", price: 122550, power: 31, circuits: 2, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSE45531358", name: "LUNA 3 Comfort 1.310 Fi", price: 110370, power: 31, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // NUVOLA 3 Comfort
        { id: "CSB45424358", name: "NUVOLA 3 Comfort 240 i", price: 165370, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSB45428358", name: "NUVOLA 3 Comfort 280 i", price: 173920, power: 28, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSB45724358", name: "NUVOLA 3 Comfort 240 Fi", price: 180760, power: 24, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSB45728358", name: "NUVOLA 3 Comfort 280 Fi", price: 186250, power: 28, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "CSB45732358", name: "NUVOLA 3 Comfort 320 Fi", price: 204560, power: 32, circuits: 1, type: "gas", brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // NUVOLA Duo-tec+ (конденсационный, встроенный бойлер)
        { id: "7219553", name: "NUVOLA Duo-tec+ 16", price: 201920, power: 16, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "on_order", price_date: "2026-07-13" },
        { id: "7219554", name: "NUVOLA Duo-tec+ 24", price: 208050, power: 24, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "on_order", price_date: "2026-07-13" },
        { id: "7219555", name: "NUVOLA Duo-tec+ 33", price: 293645, power: 33, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        // LUNA Platinum+ (конденсационный)
        { id: "7219688", name: "LUNA Platinum+ 1.12 GA", price: 172425, power: 12, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "7219689", name: "LUNA Platinum+ 1.18 GA", price: 181450, power: 18, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "7219690", name: "LUNA Platinum+ 1.24 GA", price: 186010, power: 24, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "7219691", name: "LUNA Platinum+ 1.32 GA", price: 200925, power: 32, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "7219692", name: "LUNA Platinum+ 24 GA", price: 199215, power: 24, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "7219693", name: "LUNA Platinum+ 33 GA", price: 207195, power: 33, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        // LUNA Duo-tec E (конденсационный)
        { id: "A7720022", name: "LUNA Duo-tec E 1.12", price: 116990, power: 12, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "A7720023", name: "LUNA Duo-tec E 1.24", price: 116990, power: 24, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "A7720024", name: "LUNA Duo-tec E 1.28", price: 126970, power: 28, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "A7720025", name: "LUNA Duo-tec E 24", price: 125260, power: 24, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "on_order", price_date: "2026-07-13" },
        { id: "A7720026", name: "LUNA Duo-tec E 28", price: 116990, power: 28, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "A7720027", name: "LUNA Duo-tec E 33", price: 116990, power: 33, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "A7720028", name: "LUNA Duo-tec E 40", price: 151190, power: 40, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // LUNA Duo-tec MP (конденсационный)
        { id: "7106815", name: "LUNA Duo-tec MP 1.35", price: 229920, power: 35, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // Duo-tec Compact (конденсационный)
        { id: "A7722037", name: "Duo-tec Compact 1.24", price: 97400, power: 24, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "A7722038", name: "Duo-tec Compact 24", price: 105170, power: 24, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        { id: "A7722039", name: "Duo-tec Compact 28", price: 97400, power: 28, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-07-13" },
        // LUNA AIR / IN Plus (конденсационный, уличный/внутренний)
        { id: "A7810404", name: "LUNA AIR 24", price: 191330, power: 24, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "A7810405", name: "LUNA AIR 28", price: 194655, power: 28, circuits: 2, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" },
        { id: "A7810446", name: "LUNA IN PLUS 1.24", price: 202920, power: 24, circuits: 1, type: "gas", cond: true, brand: "BAXI", availability: "in_stock", price_date: "2026-06-30" }
    ],
    // PLUS СНЯТ С ПРОИЗВОДСТВА. Из подбора и из таблицы замен убран — см. app.init()
    // (alts гасятся) и render() (серия читается как STATUS). Массив оставлен НАМЕРЕННО:
    // распознавание перебирает весь каталог, и по нему разбираются старые сметы и
    // накладные, где PLUS ещё встречается. Обратно в подбор не возвращать.
    boilers_plus: [
        { id: "SEB-2201-000005", name: "Котёл электрический PLUS (5 кВт)", power: 5, price: 59236, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-2201-000007", name: "Котёл электрический PLUS (7 кВт)", power: 7, price: 60121, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-2201-000009", name: "Котёл электрический PLUS (9 кВт)", power: 9, price: 61715, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-2201-000012", name: "Котёл электрический PLUS (12 кВт)", power: 12, price: 62657, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "on_order", price_date: "2026-08-10" },
        { id: "SEB-2201-000014", name: "Котёл электрический PLUS (14 кВт)", power: 14, price: 65191, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-2201-000018", name: "Котёл электрический PLUS (18 кВт)", power: 18, price: 69393, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "on_order", price_date: "2026-08-10" },
        { id: "SEB-2201-000021", name: "Котёл электрический PLUS (21 кВт)", power: 21, price: 71130, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-2201-000024", name: "Котёл электрический PLUS (24 кВт)", power: 24, price: 72724, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-2201-000027", name: "Котёл электрический PLUS (27 кВт)", power: 27, price: 74462, type: "el", exp: 12, vol: 10, desc: "PLUS: Бак 12л, надежная автоматика.", availability: "on_order", price_date: "2026-08-10" }
    ],
    boilers_status: [
        { id: "SEB-3101-000005", name: "Котёл электрический STATUS (5 кВт)", power: 5, price: 66207, type: "el", exp: 10, vol: 6, desc: "STATUS: Premium. Бак 10л, сенсорный дисплей.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000007", name: "Котёл электрический STATUS (7 кВт)", power: 7, price: 67505, type: "el", exp: 10, vol: 6, desc: "STATUS: Premium. Бак 10л, сенсорный дисплей.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000009", name: "Котёл электрический STATUS (9 кВт)", power: 9, price: 69453, type: "el", exp: 10, vol: 6, desc: "STATUS: Premium. Бак 10л, сенсорный дисплей.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000012", name: "Котёл электрический STATUS (12 кВт)", power: 12, price: 70102, type: "el", exp: 10, vol: 6, desc: "STATUS: Premium. Бак 10л, сенсорный дисплей.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000014", name: "Котёл электрический STATUS (14 кВт)", power: 14, price: 72698, type: "el", exp: 10, vol: 6, desc: "STATUS: Premium. Бак 10л, сенсорный дисплей.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000018", name: "Котёл электрический STATUS (18 кВт)", power: 18, price: 77242, type: "el", exp: 10, vol: 6, desc: "STATUS: Premium. Бак 10л, сенсорный дисплей.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000021", name: "Котёл электрический STATUS (21 кВт)", power: 21, price: 77891, type: "el", exp: 10, vol: 6, desc: "STATUS: Premium. Бак 10л, сенсорный дисплей.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000024", name: "Котёл электрический STATUS (24 кВт)", power: 24, price: 78540, type: "el", exp: 0, vol: 11, desc: "STATUS: Premium. Внимание: НЕТ встроенного бака!", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-3101-000027", name: "Котёл электрический STATUS (27 кВт)", power: 27, price: 82435, type: "el", exp: 0, vol: 11, desc: "STATUS: Premium. Внимание: НЕТ встроенного бака!", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // POLIS — бюджетная линейка электрокотлов (новинка 2026). В отличие от PLUS и STATUS
    // это «голый» котёл: НЕТ ни встроенного циркуляционного насоса, ни расширительного бака
    // (exp: 0 → бак подбирается общим расчётом объёма системы, насос добавляется вместе
    // с группой быстрого монтажа в разделе 2.2, см. render()). Встроены только группа
    // безопасности (предохранительный клапан 3 бар, автовоздухоотводчик), манометр и реле
    // давления. Патрубки универсальные 1" НР / 3/4" ВР — подключается к ГБМ STOUT.
    // 6 и 9 кВт работают от 220 В и от 380 В, 12 и 15 кВт — только 380 В.
    //
    // noBus — цифровой шины у POLIS нет: контроллер отопления ведёт такой котёл
    // только релейно, по перемычке комнатного термостата, и плата цифровых шин
    // ему не нужна (в отличие от PLUS и STATUS, которые работают по OpenTherm).
    boilers_polis: [
        { id: "SEB-5101-000006", name: "Котёл электрический POLIS (6 кВт)", power: 6, price: 26877, type: "el", exp: 0, vol: 5, noPump: true, noBus: true, volt: "220/380", desc: "POLIS: бюджетный. Без насоса и бака — монтируется на ГБМ.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-5101-000009", name: "Котёл электрический POLIS (9 кВт)", power: 9, price: 27522, type: "el", exp: 0, vol: 5, noPump: true, noBus: true, volt: "220/380", desc: "POLIS: бюджетный. Без насоса и бака — монтируется на ГБМ.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-5101-000012", name: "Котёл электрический POLIS (12 кВт)", power: 12, price: 39027, type: "el", exp: 0, vol: 5, noPump: true, noBus: true, volt: "380", desc: "POLIS: бюджетный. Без насоса и бака — монтируется на ГБМ. Только 380 В.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SEB-5101-000015", name: "Котёл электрический POLIS (15 кВт)", power: 15, price: 39580, type: "el", exp: 0, vol: 5, noPump: true, noBus: true, volt: "380", desc: "POLIS: бюджетный. Без насоса и бака — монтируется на ГБМ. Только 380 В.", availability: "in_stock", price_date: "2026-08-10" }
    ],
    chimneys: [
        { id: "SCA-6010-210850", name: "Дымоход коаксиальный 60/100", price: 6298, brand: "STOUT", chimType: "trad", rommer: { id: "RCA-6010-251220", name: "Дымоход коаксиальный 60/100", price: 3622, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCA-6100-251000", name: "Дымоход коаксиальный 60/100, INOX Line, АНТИЛЕД УНИВЕРСАЛЬНЫЙ, L1000мм (раб. дл. 700мм)", price: 2493, brand: "ROMMER", chimType: "trad", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCA-6100-251220", name: "Дымоход коаксиальный 60/100, INOX Line, АНТИЛЕД УНИВЕРСАЛЬНЫЙ, L1250мм (раб. дл. 950мм)", price: 2934, brand: "ROMMER", chimType: "trad", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCA-6010-750900", name: "Дымоход коаксиальный 60/100, СТАНДАРТ УНИВЕРСАЛЬНЫЙ, L900мм, однонаправл.", price: 2779, brand: "ROMMER", chimType: "trad", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCA-6010-751000", name: "Дымоход коаксиальный 60/100, АНТИЛЕД УНИВЕРСАЛЬНЫЙ, L1000мм, однонаправл.", price: 2771, brand: "ROMMER", chimType: "trad", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCA-6010-751220", name: "Дымоход коаксиальный 60/100, АНТИЛЕД УНИВЕРСАЛЬНЫЙ, L1220мм, однонаправл.", price: 3261, brand: "ROMMER", chimType: "trad", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCA-8610-210090", name: "Дымоход коаксиальный 60/100, Комплект универсальный для конденсационных котлов Viessmann, Vaillant, Wolf, Ariston, Baxi, Fondital, Ferroli, Navien", price: 4533, brand: "ROMMER", chimType: "cond", availability: "in_stock", price_date: "2026-08-10" }
    ],
    stabs: [
        { id: "SST-0001-000250", name: "Стабилизатор ST 250", price: 4972, type: "gas", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SST-0001-000600", name: "Стабилизатор ST 600", price: 6896, type: "el", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SST-0001-000900", name: "Стабилизатор ST 900", price: 7432, type: "el", availability: "in_stock", price_date: "2026-08-10" }
    ],
    valves: [
        // STOUT SFB-0001-000001 (комплект Fugas) снят с производства — заменён на комплект BAXI.
        { id: "BX4991100069", name: "Комплект 3-х ход. клапана", price: 7630, brand: "BAXI", availability: "in_stock", price_date: "2026-08-13" }
    ],
    tanks_optibase: [
        { id: "SWH-3110-000100", name: "Бойлер напольный 100л", ports: { cold: '3/4"', dhw: '3/4"', coil: '1"', recirc: '3/4"' }, vol: 100, price: 57183, rommer: { id: "RWH-2110-000150", name: "Бойлер напольный GT 150 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 60353, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-2110-000150", name: "Бойлер напольный OptiBase 150л", ports: { cold: '1"', dhw: '3/4"', coil: '1"', recirc: '1"' }, vol: 150, price: 55566, rommer: { id: "RWH-2110-000150", name: "Бойлер напольный GT 150 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 60353, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-2110-000200", name: "Бойлер напольный OptiBase 200л", ports: { cold: '1"', dhw: '3/4"', coil: '1"', recirc: '1"' }, vol: 200, price: 62111, rommer: { id: "RWH-2110-000200", name: "Бойлер напольный GT 200 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 67462, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-2110-000300", name: "Бойлер напольный OptiBase 300л", ports: { cold: '1"', dhw: '1"', coil: '1"', recirc: '1"' }, vol: 300, price: 95889, rommer: { id: "RWH-2110-000300", name: "Бойлер напольный GT 300 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 104150, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-2110-000500", name: "Бойлер напольный OptiBase 500л", ports: { cold: '1"', dhw: '1"', coil: '1"', recirc: '1"' }, vol: 500, price: 155530, rommer: { id: "RWH-2110-000500", name: "Бойлер напольный GT 500 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 149437, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" }
    ],
    tanks_standard: [
        { id: "SWH-3110-000100", name: "Бойлер напольный 100л", ports: { cold: '3/4"', dhw: '3/4"', coil: '1"', recirc: '3/4"' }, vol: 100, price: 57183, rommer: { id: "RWH-2110-000150", name: "Бойлер напольный GT 150 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 60353, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-3110-000150", name: "Бойлер напольный 150л", ports: { cold: '3/4"', dhw: '3/4"', coil: '1"', recirc: '3/4"' }, vol: 150, price: 64166, rommer: { id: "RWH-2110-000150", name: "Бойлер напольный GT 150 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 60353, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-3110-000200", name: "Бойлер напольный 200л", ports: { cold: '3/4"', dhw: '3/4"', coil: '1"', recirc: '3/4"' }, vol: 200, price: 66812, rommer: { id: "RWH-2110-000200", name: "Бойлер напольный GT 200 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 67462, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-1110-000300", name: "Бойлер напольный 300л", ports: { cold: '3/4"', dhw: '3/4"', coil: '1"', recirc: '3/4"' }, vol: 300, price: 114954, rommer: { id: "RWH-2110-000300", name: "Бойлер напольный GT 300 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 104150, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SWH-1110-000500", name: "Бойлер напольный 500л", ports: { cold: '1"', dhw: '1"', coil: '1"', recirc: '1"' }, vol: 500, price: 237980, rommer: { id: "RWH-2110-000500", name: "Бойлер напольный GT 500 л", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 149437, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" }
    ],
    tanks_stainless: [
        { id: "SWH-4110-050100", name: "Бойлер напольный 100л (нержавейка) DUPLEX", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, vol: 100, price: 82831, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SWH-4110-050150", name: "Бойлер напольный 150л (нержавейка) DUPLEX", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, vol: 150, price: 92815, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RWH-2110-000150", name: "Бойлер косвенного нагрева напольный GT 150 л, 35 кВт, без возм. уст. ТЭН", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 60353, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SWH-4110-050200", name: "Бойлер напольный 200л (нержавейка) DUPLEX", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, vol: 200, price: 104861, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RWH-2110-000200", name: "Бойлер косвенного нагрева напольный GT 200 л, 38 кВт, без возм. уст. ТЭН", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 67462, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SWH-4110-050300", name: "Бойлер напольный 300л (нержавейка) DUPLEX", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, vol: 300, price: 134984, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RWH-2110-000300", name: "Бойлер косвенного нагрева напольный GT 300 л, 49 кВт, без возм. уст. ТЭН", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 104150, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SWH-4110-050500", name: "Бойлер напольный 500л (нержавейка) DUPLEX", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, vol: 500, price: 213015, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RWH-2110-000500", name: "Бойлер косвенного нагрева напольный GT 500 л, 60 кВт, без возм. уст. ТЭН", ports: { cold: '3/4"', dhw: '3/4"', coil: '3/4"', recirc: '3/4"', safety: '1/2"' }, price: 149437, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
    ],
    exp_dhw: [
        { id: "STW-0015-000012", name: "Расширительный бак для ГВС 12л", vol: 12, color: "white", conn: "3/4", price: 2882, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0015-000018", name: "Расширительный бак для ГВС 18л", vol: 18, color: "white", conn: "3/4", price: 3316, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0015-000024", name: "Расширительный бак для ГВС 24л", vol: 24, color: "white", conn: "3/4", price: 3614, availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Пул таблицы замены бака ГВС (app.expTankPool('dhw') = exp_dhw + этот массив).
    // Здесь только те артикулы, которых нет в exp_dhw, чтобы автоподбор бака (он идёт
    // строго по exp_dhw) не поехал от добавления новых типоразмеров.
    // Белый ряд — баки для ГВС (STW-0015), синий — гидроаккумуляторы водоснабжения
    // (STW-0001). Резьба: 8 и 12 л — 3/4", синие 20 и 24 л — 1".
    exp_dhw_alts: [
        { id: "STW-0015-000008", name: "Расширительный бак для ГВС 8л", vol: 8, color: "white", conn: "3/4", price: 2654, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0001-000008", name: "Расширительный бак гидроаккумулятор 8 л (синий)", vol: 8, color: "blue", conn: "3/4", price: 2527, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0001-000012", name: "Расширительный бак гидроаккумулятор 12 л (синий)", vol: 12, color: "blue", conn: "3/4", price: 2744, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0001-000020", name: "Расширительный бак гидроаккумулятор 20 л (синий)", vol: 20, color: "blue", conn: "1", price: 3158, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0001-100020", name: "Расширительный бак гидроаккумулятор 20 л горизонтальный (синий)", vol: 20, color: "blue", conn: "1", price: 3576, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0001-000024", name: "Расширительный бак гидроаккумулятор 24 л (синий)", vol: 24, color: "blue", conn: "1", price: 3442, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    exp_heating: [
        { id: "STH-0004-000018", name: "Расширительный бак для отопления 18л", vol: 18, color: "red", conn: "3/4", price: 2897, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0006-000024", name: "Расширительный бак для отопления 24л", vol: 24, color: "red", conn: "1", price: 3050, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0006-000050", name: "Расширительный бак для отопления 50л", vol: 50, color: "red", conn: "1", price: 6764, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0006-000080", name: "Расширительный бак для отопления 80л", vol: 80, color: "red", conn: "1", price: 10836, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0006-000100", name: "Расширительный бак для отопления 100л", vol: 100, color: "red", conn: "1", price: 12642, availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Пул таблицы замены бака отопления (app.expTankPool('heat') = exp_heating + этот
    // массив). Красный ряд STOUT целиком: до 18 л — с диафрагмой (STH-0004), 35 л —
    // STH-0005, от 24 л — со сменной мембраной (STH-0006). Резьба: до 18 л — 3/4",
    // дальше 1". Баки от 500 л не берём: там уже 1 1/2" и другая обвязка.
    exp_heating_alts: [
        { id: "STH-0004-000005", name: "Расширительный бак для отопления 5л", vol: 5, color: "red", conn: "3/4", price: 2400, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0004-000008", name: "Расширительный бак для отопления 8л", vol: 8, color: "red", conn: "3/4", price: 2424, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0004-000012", name: "Расширительный бак для отопления 12л", vol: 12, color: "red", conn: "3/4", price: 2505, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0005-000035", name: "Расширительный бак для отопления 35л", vol: 35, color: "red", conn: "1", price: 6253, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0006-000150", name: "Расширительный бак для отопления 150л", vol: 150, color: "red", conn: "1", price: 20626, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0006-000200", name: "Расширительный бак для отопления 200л", vol: 200, color: "red", conn: "1", price: 27280, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STH-0006-000300", name: "Расширительный бак для отопления 300л", vol: 300, color: "red", conn: "1", price: 35486, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    tank_mount: { id: "SAC-0030-000825", name: "Крепление для бака", price: 1266, availability: "in_stock", price_date: "2026-08-10" },
    tank_kit: { id: "SVS-0008-012020", name: "Комплект подключения мембранного бака", price: 1990, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RVS-0008-002020", name: "Комплект подключения мембранного бака", price: 1436, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
    rads: [
        { id: "SRB-0320-050004", name: "Радиатор Space 4 секций", sec: 4, price: 6457, power50: 117, rommer: { id: "RAL-0210-050004", name: "Радиатор Optima 4 секций", price: 2743, brand: "ROMMER", power50: 117, availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SRB-0320-050005", name: "Радиатор Space 5 секций", sec: 5, price: 7528, power50: 117, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SRB-0320-050006", name: "Радиатор Space 6 секций", sec: 6, price: 8599, power50: 117, rommer: { id: "RAL-0210-050006", name: "Радиатор Optima 6 секций", price: 4115, brand: "ROMMER", power50: 117, availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SRB-0320-050007", name: "Радиатор Space 7 секций", sec: 7, price: 9670, power50: 117, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SRB-0320-050008", name: "Радиатор Space 8 секций", sec: 8, price: 10741, power50: 117, rommer: { id: "RAL-0210-050008", name: "Радиатор Optima 8 секций", price: 5488, brand: "ROMMER", power50: 117, availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SRB-0320-050009", name: "Радиатор Space 9 секций", sec: 9, price: 11812, power50: 117, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SRB-0320-050010", name: "Радиатор Space 10 секций", sec: 10, price: 12883, power50: 117, rommer: { id: "RAL-0210-050010", name: "Радиатор Optima 10 секций", price: 6860, brand: "ROMMER", power50: 117, availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SRB-0320-050011", name: "Радиатор Space 11 секций", sec: 11, price: 13954, power50: 117, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SRB-0320-050012", name: "Радиатор Space 12 секций", sec: 12, price: 15025, power50: 117, rommer: { id: "RAL-0210-050012", name: "Радиатор Optima 12 секций", price: 8231, brand: "ROMMER", power50: 117, availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SRB-0320-050013", name: "Радиатор Space 13 секций", sec: 13, price: 16096, power50: 117, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SRB-0320-050014", name: "Радиатор Space 14 секций", sec: 14, price: 17167, power50: 117, availability: "in_stock", price_date: "2026-08-10" }
    ],
    rad_kits: [
        { id: "SFT-0049-000002", name: "Ниппель", price: 157, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0049-000001", name: "Переходник под плоское уплотнение", price: 114, availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Внутрипольные конвекторы STOUT — только СКЛАДСКАЯ ПРОГРАММА (лист "STOUT Конвекторы
    // внутрипольные", прайс 07.2026): SCQ — высота 75мм/ширина 240мм; SCN — высота 80мм
    // (ширина 190/240/300мм) и высота 110мм (ширина 240мм). Остальные высоты (110/150/200мм
    // у SCQ, 150/200мм у SCN) и ширина 380мм — под заказ, в каталог не включены.
    // power70 — «Теплоотдача, Вт» из прайса (условия 95/85, 20°C, вентилятор 100% —
    // фактически то же ΔT=70°C, что и у радиаторов); power50 = power70×(50/70)^1.3,
    // как у всех остальных приборов отопления в каталоге (см. getPowerAtDt50 в app.js).
    convectors_scq: [
        { id: "SCQ-1100-0724080", name: "Конвектор SCQ (с вентилятором) 800мм", len: 0.8, height: 75, width: 240, power70: 1038, power50: 670, price: 48256, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724100", name: "Конвектор SCQ (с вентилятором) 1000мм", len: 1, height: 75, width: 240, power70: 1491, power50: 963, price: 54363, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724125", name: "Конвектор SCQ (с вентилятором) 1250мм", len: 1.25, height: 75, width: 240, power70: 2068, power50: 1335, price: 62012, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724150", name: "Конвектор SCQ (с вентилятором) 1500мм", len: 1.5, height: 75, width: 240, power70: 2650, power50: 1711, price: 69651, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724175", name: "Конвектор SCQ (с вентилятором) 1750мм", len: 1.75, height: 75, width: 240, power70: 3234, power50: 2088, price: 77290, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724200", name: "Конвектор SCQ (с вентилятором) 2000мм", len: 2, height: 75, width: 240, power70: 3813, power50: 2462, price: 84929, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724225", name: "Конвектор SCQ (с вентилятором) 2250мм", len: 2.25, height: 75, width: 240, power70: 4385, power50: 2831, price: 92569, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724250", name: "Конвектор SCQ (с вентилятором) 2500мм", len: 2.5, height: 75, width: 240, power70: 4942, power50: 3191, price: 100208, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724275", name: "Конвектор SCQ (с вентилятором) 2750мм", len: 2.75, height: 75, width: 240, power70: 5482, power50: 3540, price: 107847, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCQ-1100-0724300", name: "Конвектор SCQ (с вентилятором) 3000мм", len: 3, height: 75, width: 240, power70: 5999, power50: 3874, price: 139295, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" }
    ],
    convectors_scn: [
        // Высота 80мм, ширина 190мм (SCN-1100-0819***)
        { id: "SCN-1100-0819080", name: "Конвектор SCN (без вентилятора) 80×190, 800мм", len: 0.8, height: 80, width: 190, power70: 220, power50: 142, price: 19596, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819100", name: "Конвектор SCN (без вентилятора) 80×190, 1000мм", len: 1, height: 80, width: 190, power70: 313, power50: 202, price: 23060, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819120", name: "Конвектор SCN (без вентилятора) 80×190, 1200мм", len: 1.2, height: 80, width: 190, power70: 406, power50: 262, price: 26516, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819140", name: "Конвектор SCN (без вентилятора) 80×190, 1400мм", len: 1.4, height: 80, width: 190, power70: 499, power50: 322, price: 29982, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819160", name: "Конвектор SCN (без вентилятора) 80×190, 1600мм", len: 1.6, height: 80, width: 190, power70: 591, power50: 382, price: 33447, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819180", name: "Конвектор SCN (без вентилятора) 80×190, 1800мм", len: 1.8, height: 80, width: 190, power70: 684, power50: 442, price: 36903, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819200", name: "Конвектор SCN (без вентилятора) 80×190, 2000мм", len: 2, height: 80, width: 190, power70: 777, power50: 502, price: 40368, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819220", name: "Конвектор SCN (без вентилятора) 80×190, 2200мм", len: 2.2, height: 80, width: 190, power70: 870, power50: 562, price: 43833, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819240", name: "Конвектор SCN (без вентилятора) 80×190, 2400мм", len: 2.4, height: 80, width: 190, power70: 963, power50: 622, price: 47289, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819260", name: "Конвектор SCN (без вентилятора) 80×190, 2600мм", len: 2.6, height: 80, width: 190, power70: 1056, power50: 682, price: 50755, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCN-1100-0819280", name: "Конвектор SCN (без вентилятора) 80×190, 2800мм", len: 2.8, height: 80, width: 190, power70: 1149, power50: 742, price: 54219, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0819300", name: "Конвектор SCN (без вентилятора) 80×190, 3000мм", len: 3, height: 80, width: 190, power70: 1242, power50: 802, price: 57679, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        // Высота 80мм, ширина 240мм (SCN-1100-0824***) — базовая складская линейка (по умолчанию в автоподборе)
        { id: "SCN-1100-0824080", name: "Конвектор SCN (без вентилятора) 800мм", len: 0.8, height: 80, width: 240, power70: 277, power50: 179, price: 22276, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824100", name: "Конвектор SCN (без вентилятора) 1000мм", len: 1, height: 80, width: 240, power70: 382, power50: 247, price: 26459, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824120", name: "Конвектор SCN (без вентилятора) 1200мм", len: 1.2, height: 80, width: 240, power70: 487, power50: 314, price: 30643, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824140", name: "Конвектор SCN (без вентилятора) 1400мм", len: 1.4, height: 80, width: 240, power70: 591, power50: 382, price: 34826, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824160", name: "Конвектор SCN (без вентилятора) 1600мм", len: 1.6, height: 80, width: 240, power70: 696, power50: 449, price: 39009, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824180", name: "Конвектор SCN (без вентилятора) 1800мм", len: 1.8, height: 80, width: 240, power70: 801, power50: 517, price: 43193, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824200", name: "Конвектор SCN (без вентилятора) 2000мм", len: 2, height: 80, width: 240, power70: 905, power50: 584, price: 47375, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824220", name: "Конвектор SCN (без вентилятора) 2200мм", len: 2.2, height: 80, width: 240, power70: 1010, power50: 652, price: 51559, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824240", name: "Конвектор SCN (без вентилятора) 2400мм", len: 2.4, height: 80, width: 240, power70: 1115, power50: 720, price: 55742, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824260", name: "Конвектор SCN (без вентилятора) 2600мм", len: 2.6, height: 80, width: 240, power70: 1219, power50: 787, price: 59926, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824280", name: "Конвектор SCN (без вентилятора) 2800мм", len: 2.8, height: 80, width: 240, power70: 1324, power50: 855, price: 64109, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0824300", name: "Конвектор SCN (без вентилятора) 3000мм", len: 3, height: 80, width: 240, power70: 1429, power50: 923, price: 68292, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        // Высота 80мм, ширина 300мм (SCN-1100-0830***). ВНИМАНИЕ: цена 2400мм (82526₽) в
        // прайс-листе 07.2026 нарушает монотонный рост цены с длиной (2200мм=68541₽,
        // 2600мм=80007₽) — похоже на опечатку у поставщика, перенесена как есть из прайса,
        // не исправлена вручную. Проверить у поставщика при следующем обновлении цен.
        { id: "SCN-1100-0830080", name: "Конвектор SCN (без вентилятора) 80×300, 800мм", len: 0.8, height: 80, width: 300, power70: 355, power50: 229, price: 25569, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830100", name: "Конвектор SCN (без вентилятора) 80×300, 1000мм", len: 1, height: 80, width: 300, power70: 493, power50: 318, price: 30728, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830120", name: "Конвектор SCN (без вентилятора) 80×300, 1200мм", len: 1.2, height: 80, width: 300, power70: 630, power50: 407, price: 35887, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830140", name: "Конвектор SCN (без вентилятора) 80×300, 1400мм", len: 1.4, height: 80, width: 300, power70: 768, power50: 496, price: 41047, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830160", name: "Конвектор SCN (без вентилятора) 80×300, 1600мм", len: 1.6, height: 80, width: 300, power70: 906, power50: 585, price: 46207, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830180", name: "Конвектор SCN (без вентилятора) 80×300, 1800мм", len: 1.8, height: 80, width: 300, power70: 1043, power50: 673, price: 51367, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830200", name: "Конвектор SCN (без вентилятора) 80×300, 2000мм", len: 2, height: 80, width: 300, power70: 1181, power50: 763, price: 56527, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830220", name: "Конвектор SCN (без вентилятора) 80×300, 2200мм", len: 2.2, height: 80, width: 300, power70: 1319, power50: 852, price: 61687, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-0830240", name: "Конвектор SCN (без вентилятора) 80×300, 2400мм", len: 2.4, height: 80, width: 300, power70: 1456, power50: 940, price: 74274, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCN-1100-0830260", name: "Конвектор SCN (без вентилятора) 80×300, 2600мм", len: 2.6, height: 80, width: 300, power70: 1594, power50: 1029, price: 72006, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCN-1100-0830280", name: "Конвектор SCN (без вентилятора) 80×300, 2800мм", len: 2.8, height: 80, width: 300, power70: 1732, power50: 1118, price: 77165, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCN-1100-0830300", name: "Конвектор SCN (без вентилятора) 80×300, 3000мм", len: 3, height: 80, width: 300, power70: 1869, power50: 1207, price: 82326, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        // Высота 110мм, ширина 240мм (SCN-1100-1124***)
        { id: "SCN-1100-1124080", name: "Конвектор SCN (без вентилятора) 110×240, 800мм", len: 0.8, height: 110, width: 240, power70: 277, power50: 179, price: 22945, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124100", name: "Конвектор SCN (без вентилятора) 110×240, 1000мм", len: 1, height: 110, width: 240, power70: 455, power50: 294, price: 27253, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124120", name: "Конвектор SCN (без вентилятора) 110×240, 1200мм", len: 1.2, height: 110, width: 240, power70: 587, power50: 379, price: 31562, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124140", name: "Конвектор SCN (без вентилятора) 110×240, 1400мм", len: 1.4, height: 110, width: 240, power70: 718, power50: 464, price: 35869, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124160", name: "Конвектор SCN (без вентилятора) 110×240, 1600мм", len: 1.6, height: 110, width: 240, power70: 849, power50: 548, price: 40177, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124180", name: "Конвектор SCN (без вентилятора) 110×240, 1800мм", len: 1.8, height: 110, width: 240, power70: 981, power50: 633, price: 44485, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124200", name: "Конвектор SCN (без вентилятора) 110×240, 2000мм", len: 2, height: 110, width: 240, power70: 1112, power50: 718, price: 48797, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124220", name: "Конвектор SCN (без вентилятора) 110×240, 2200мм", len: 2.2, height: 110, width: 240, power70: 1244, power50: 803, price: 53109, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124240", name: "Конвектор SCN (без вентилятора) 110×240, 2400мм", len: 2.4, height: 110, width: 240, power70: 1375, power50: 888, price: 57417, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCN-1100-1124260", name: "Конвектор SCN (без вентилятора) 110×240, 2600мм", len: 2.6, height: 110, width: 240, power70: 1506, power50: 972, price: 61725, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCN-1100-1124280", name: "Конвектор SCN (без вентилятора) 110×240, 2800мм", len: 2.8, height: 110, width: 240, power70: 1638, power50: 1058, price: 66033, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCN-1100-1124300", name: "Конвектор SCN (без вентилятора) 110×240, 3000мм", len: 3, height: 110, width: 240, power70: 1769, power50: 1142, price: 70341, brand: "STOUT", unit: "шт", availability: "on_order", price_date: "2026-08-10" }
    ],
    conv_valves: [
        { id: "SVT-0001-000015", name: "Клапан термостатический, прямой 1/2\"", price: 1180, brand: "STOUT", unit: "шт", rommer: { id: "RVT-0001-100015", name: "Клапан термостатический прямой 1/2\"", price: 862, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SVL-1176-000015", name: "Клапан запорно-балансировочный прямой 1/2\"", price: 656, brand: "STOUT", unit: "шт", rommer: { id: "RVL-0001-100015", name: "Клапан запорно-балансировочный прямой/угловой 1/2\"", price: 465, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        // По прайсу и паспорту STOUT это ОСЕВОЙ клапан, а не угловой: угловой у
        // STOUT идёт под артикулом SVT-0002-000015 (см. radValves ниже). Здесь
        // раньше стояло «угловой» — название не совпадало с тем, что монтажник
        // получал по артикулу. У ROMMER аналога осевого нет, поэтому в пару
        // остаётся его угловой RVT-0002: это замена по назначению, не по типу
        // присоединения, и о ней сказано в самом названии аналога.
        { id: "SVT-0005-000015", name: "Клапан термостатический, осевой 1/2\"", price: 1614, brand: "STOUT", unit: "шт", rommer: { id: "RVT-0002-100015", name: "Клапан термостатический угловой 1/2\"", price: 855, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SVL-1156-000015", name: "Клапан запорно-балансировочный угловой 1/2\"", price: 597, brand: "STOUT", unit: "шт", rommer: { id: "RVL-0002-100015", name: "Клапан запорно-балансировочный прямой/угловой 1/2\"", price: 430, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" }
    ],
    conv_parts: [
        { id: "SFA-0020-000016", name: "Монтажная гильза 16", price: 109, brand: "STOUT", unit: "шт", rommer: { id: "RFA-0020-000016", name: "Монтажная гильза 16", price: 70, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "RFA-0020-000016", name: "Монтажная гильза 16", price: 77, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0001-001612", name: "Переходник 16xR 1/2\" НР", price: 289, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "703102", name: "Настенный регулятор Vartronic, цвет белый", price: 10942, brand: "Varmann", unit: "шт", availability: "in_stock", price_date: "2026-07-13" }
    ],
    rad_tube_set: [
        { id: "SFA-0025-001650", name: "Трубка Г-образная 16/500 мм (для радиат.)", price: 2863, brand: "STOUT", rommer: { id: "RFA-0025-001650", name: "Трубка Г-образная для подключения радиатора 16/500", price: 1091, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0000-162025", name: "Фиксирующая скоба для трубок", price: 449, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0020-000016", name: "Гильза монтажная 16 (аксиальная)", price: 109, brand: "STOUT", rommer: { id: "RFA-0020-000016", name: "Монтажная гильза 16", price: 70, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SFC-0027-001520", name: "Фитинг компрессионный 15x3/4\" (для трубки)", price: 566, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Фиксаторы поворота типа «башмак» — альтернатива Г-образным трубкам при подключении
    // к нижним выводам радиатора. Держат ту же трубу 16, что идёт по полу, поэтому ни
    // гильзы, ни компрессионного фитинга под отдельную трубку им не требуется.
    // В пакете — комплект на ОДИН радиатор (по 2 шт. каждой детали, на подачу и обратку).
    rad_shoe_set: [
        { id: "SFA-0038-100016", name: "Комплект фиксаторов поворота \"башмак\" 16 мм (базовый)", price: 201, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0038-300016", name: "Комплект фиксаторов поворота \"башмак\" 16 мм (без подпятника)", price: 189, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0038-200016", name: "Комплект защитных кожухов 1/2 на трубу 16 мм (белые)", price: 178, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    protective_sleeves: [
        { id: "SFA-0035-200016", name: "Защитная втулка красная (для трубы 16 мм)", price: 56, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0035-100016", name: "Защитная втулка синяя (для трубы 16 мм)", price: 56, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Чёрное исполнение той же втулки — альтернатива цветной паре в таблице замены.
    // Цвет у втулки только маркировочный (красная — подача, синяя — обратка), поэтому
    // чёрная одинаково закрывает оба вывода. Размер 20 и универсальная 16-20 нужны там,
    // где из пола выходит труба 20: цветных втулок под неё в линейке нет.
    protective_sleeves_black: [
        { id: "SFA-0035-300016", name: "Защитная втулка чёрная (для трубы 16 мм)", price: 56, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0035-300020", name: "Защитная втулка чёрная (для трубы 20 мм)", price: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0035-381620", name: "Защитная втулка чёрная (для трубы 16-20 мм)", price: 35, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    label_kits: [
        { id: "SFA-0038-100000", name: "Комплект маркировочных наклеек \"ОТОПЛЕНИЕ\"", price: 872, brand: "STOUT", availability: "in_stock", price_date: "2026-08-15" },
        { id: "SFA-0038-200000", name: "Комплект маркировочных наклеек \"ТЕПЛЫЙ ПОЛ\"", price: 872, brand: "STOUT", availability: "in_stock", price_date: "2026-08-15" }
    ],
    heads: [
        { id: "SHT-0001-003015", name: "Головка термостатическая (Газо-жидкостная)", price: 1316, type: "gas", desc: "Стандартное решение. Быстрая реакция.", rommer: { id: "RHT-0001-103015", name: "Головка термостатическая жидкостная", price: 618, brand: "ROMMER", type: "liquid", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SHT-0002-003015", name: "Головка термостатическая (Жидкостная)", price: 1334, type: "liquid", desc: "Классическая надежная модель.", rommer: { id: "RHT-0001-103015", name: "Головка термостатическая жидкостная", price: 618, brand: "ROMMER", type: "liquid", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "STE-2070-703011", name: "Умная термостатическая головка Zigbee", price: 3300, type: "smart", desc: "Управление со смартфона. Требует шлюз.", availability: "in_stock", price_date: "2026-08-10" }
    ],
    smart_hub: { id: "STE-2071-804010", name: "Беспроводной шлюз Zigbee", price: 4896, availability: "in_stock", price_date: "2026-08-10" },
    ufh_mech: [
        { id: "STE-2001-130210", name: "Термостат универсальный, белый", price: 2142.00, desc: "Механический термостат (Белый).", ctrlType: "mech", wifi: false, color: "white", current: 3, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2001-130220", name: "Термостат универсальный, черный", price: 2249, desc: "Механический термостат (Черный).", ctrlType: "mech", wifi: false, color: "black", current: 3, availability: "in_stock", price_date: "2026-08-10" }
    ],
    ufh_electro: [
        { id: "STE-2002-331212", name: "Терморегулятор универсальный, белый", price: 11603, desc: "Электронный термостат с дисплеем (Белый).", ctrlType: "touch", wifi: true, color: "white", current: 3, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2002-331222", name: "Терморегулятор универсальный, черный", price: 12067, desc: "Электронный термостат с дисплеем (Черный).", ctrlType: "touch", wifi: true, color: "black", current: 3, availability: "in_stock", price_date: "2026-08-10" }
    ],
    thermostats_stout: [
        { id: "STE-2001-110710", name: "Термостат тёплого пола 16А, белый", price: 2356, brand: "STOUT", unit: "шт", ctrlType: "mech", wifi: false, color: "white", current: 16, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2001-110720", name: "Термостат тёплого пола 16А, чёрный", price: 2468, brand: "STOUT", unit: "шт", ctrlType: "mech", wifi: false, color: "black", current: 16, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2002-311722", name: "Термостат, сенсорный экран, чёрный", price: 12531, brand: "STOUT", unit: "шт", ctrlType: "touch", wifi: true, color: "black", current: 16, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2002-311712", name: "Термостат, сенсорный экран, белый", price: 12067, brand: "STOUT", unit: "шт", ctrlType: "touch", wifi: true, color: "white", current: 16, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3001-130210", name: "Термостат тёплого пола 3А, белый", price: 1010, brand: "STOUT", unit: "шт", ctrlType: "mech", wifi: false, color: "white", current: 3, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3001-110710", name: "Термостат тёплого пола 16А, белый", price: 1112, brand: "STOUT", unit: "шт", ctrlType: "mech", wifi: false, color: "white", current: 16, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3002-331212", name: "Термостат, белый", price: 4998.00, brand: "STOUT", unit: "шт", ctrlType: "electronic", wifi: true, color: "white", current: 3, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3002-311712", name: "Термостат, белый", price: 5202.00, brand: "STOUT", unit: "шт", ctrlType: "electronic", wifi: true, color: "white", current: 16, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3002-331222", name: "Термостат, чёрный", price: 5202.00, brand: "STOUT", unit: "шт", ctrlType: "electronic", wifi: true, color: "black", current: 3, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3002-311722", name: "Термостат, чёрный", price: 5406.00, brand: "STOUT", unit: "шт", ctrlType: "electronic", wifi: true, color: "black", current: 16, availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3003-231232", name: "Термостат, с кнопками, серый", price: 5253.00, brand: "STOUT", unit: "шт", ctrlType: "electronic", wifi: true, color: "gray", current: 3, availability: "on_order", price_date: "2026-08-10" },
        { id: "STE-3003-211732", name: "Термостат, с кнопками, серый", price: 5457.00, brand: "STOUT", unit: "шт", ctrlType: "electronic", wifi: true, color: "gray", current: 16, availability: "in_stock", price_date: "2026-08-10" }
    ],
    actuators: { id: "STE-0010-230001", name: "Сервопривод компактный 230В (NC)", price: 2458, type: "nc", voltage: 230, rommer: { id: "RTE-0010-230001", name: "Сервопривод термоэлектрический (NC) 230В", price: 760, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
    actuators_rommer: [
        { id: "RTE-0010-024001", name: "Сервопривод компактный НЗ, 24В", price: 911, brand: "ROMMER", unit: "шт", type: "nc", voltage: 24, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RTE-0010-024002", name: "Сервопривод компактный НО, 24В", price: 911, brand: "ROMMER", unit: "шт", type: "no", voltage: 24, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RTE-0010-230001", name: "Сервопривод компактный НЗ, 230В", price: 718, brand: "ROMMER", unit: "шт", type: "nc", voltage: 230, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RTE-0010-230002", name: "Сервопривод компактный НО, 230В", price: 718, brand: "ROMMER", unit: "шт", type: "no", voltage: 230, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RTE-0020-024001", name: "Сервопривод с поворотным фиксатором штока НЗ, 24В", price: 1101, brand: "ROMMER", unit: "шт", type: "nc", voltage: 24, availability: "in_stock", price_date: "2026-08-10" },
        { id: "RTE-0020-230001", name: "Сервопривод с поворотным фиксатором штока НЗ, 230В", price: 1057, brand: "ROMMER", unit: "шт", type: "nc", voltage: 230, availability: "in_stock", price_date: "2026-08-10" }
    ],
    wiring_center: { id: "STE-3050-650522", name: "Проводной контроллер", price: 7446, availability: "in_stock", price_date: "2026-08-10" },
    // Кабель к автоматике тёплого пола. В прайсе STOUT его нет — это
    // электромонтажный материал, цены ориентировочные и подлежат уточнению
    // у поставщика. Отдельная позиция на каждое назначение: одна и та же
    // марка идёт и на термостаты, и на питание, а в смете это разные строки.
    // Кабель к автоматике котельной — те же оговорки, что и у ufh_cables.
    auto_cables: [
        { id: "CBL-VVG-3X15-AUTO", name: "Кабель ВВГнг(А)-LS 3×1,5 — питание контроллера и силовые линии", price: 62, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-MKESH-2X05-NTC", name: "Кабель МКЭШ 2×0,5 экран. — датчики температуры контроллера", price: 75, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-UTP-BUS", name: "Кабель UTP cat.5 — цифровая шина котла, RS-485 и интернет", price: 38, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-UTP-AIR", name: "Кабель UTP cat.5 — линии комнатных приборов RS-485", price: 38, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-MKESH-2X05-AIR", name: "Кабель МКЭШ 2×0,5 экран. — линии комнатных термостатов (сухой контакт)", price: 75, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-VVG-4X15-LEAK", name: "Кабель ВВГнг(А)-LS 4×1,5 — привод крана защиты от протечки", price: 96, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-MKESH-2X05-LEAK", name: "Кабель МКЭШ 2×0,5 экран. — датчики протечки", price: 75, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        // Силовой ввод электрокотла. Сечение — из паспорта STOUT STATUS (Таб.1, п. 17):
        // 4 мм² до 12 кВт, 6 мм² на 14–21 кВт, 10 мм² на 24–27 кВт. Паспорт пишет «4×S»
        // (три фазы и рабочий ноль), но защитный PE идёт на отдельный болт заземления —
        // поэтому кабель пятижильный.
        { id: "CBL-VVG-5X4-BOILER", name: "Кабель ВВГнг(А)-LS 5×4 — силовой ввод электрокотла", price: 300, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-14" },
        { id: "CBL-VVG-5X6-BOILER", name: "Кабель ВВГнг(А)-LS 5×6 — силовой ввод электрокотла", price: 440, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-14" },
        { id: "CBL-VVG-5X10-BOILER", name: "Кабель ВВГнг(А)-LS 5×10 — силовой ввод электрокотла", price: 750, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-14" },
        // Однофазный ввод: паспортная таблица сечений дана для трёх фаз, а на одной
        // тот же котёл берёт втрое больший ток. Сечения — из паспорта STOUT POLIS
        // (Таб.2, там однофазное подключение расписано отдельной строкой): до 6 кВт
        // 10 мм², дальше 16 мм². Паспорт пишет «2×S» — фазу и ноль; PE идёт третьей
        // жилой, потому что заземление у котла обязательное.
        { id: "CBL-VVG-3X10-BOILER", name: "Кабель ВВГнг(А)-LS 3×10 — силовой ввод электрокотла (220 В)", price: 460, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-14" },
        { id: "CBL-VVG-3X16-BOILER", name: "Кабель ВВГнг(А)-LS 3×16 — силовой ввод электрокотла (220 В)", price: 780, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-14" }
    ],
    ufh_cables: [
        { id: "CBL-VVG-3X15-TS", name: "Кабель ВВГнг(А)-LS 3×1,5 — линии термостатов", price: 62, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-VVG-2X15-SV", name: "Кабель ВВГнг(А)-LS 2×1,5 — линии сервоприводов", price: 45, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-VVG-3X15-PW", name: "Кабель ВВГнг(А)-LS 3×1,5 — питание планки и насоса", price: 62, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" },
        { id: "CBL-MKESH-2X05", name: "Кабель МКЭШ 2×0,5 экран. — сухой контакт на контроллер", price: 75, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-09" }
    ],
    h_valves: [
        { id: "SVH-0004-000020", name: "Узел нижн. подкл. (Угловой)", price: 1161, type: "angled", desc: "Трубы выходят из стены.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVH-0002-000020", name: "Узел нижн. подкл. (Прямой)", price: 1141, type: "straight", desc: "Трубы выходят из пола.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVH-0001-000020", name: "Узел нижн. подкл. однотрубный (Прямой)", price: 2028, type: "straight", desc: "Для однотрубной системы.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVH-0003-000020", name: "Узел нижн. подкл. однотрубный (Угловой)", price: 1896, type: "angled", desc: "Для однотрубной системы.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVH-0005-000020", name: "Узел нижн. подкл. раздельный (Прямой)", price: 767, type: "straight", desc: "Раздельный монтаж.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVH-0006-000020", name: "Узел нижн. подкл. раздельный (Угловой)", price: 747, type: "angled", desc: "Раздельный монтаж.", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Радиаторный коллектор — серия SMS-0912 «с запорными клапанами, полностью укомплектован»:
    // подающая гребёнка с запорными клапанами, обратная с отсечными клапанами под
    // электротермоприводы, кронштейны, перекрывающие шаровые краны и фитинги уже в комплекте.
    // Голая гребёнка SMS-0922 из подбора убрана — её приходилось дособирать вручную.
    //
    // inSize / outSize / connType — присоединительные размеры, та же тройка полей, что у
    // водяных коллекторов. По ним узел обвязки (app.render, «Узел обвязки коллектора
    // радиаторного отопления») собирает переход с торца гребёнки на резьбу крана и решает,
    // чем луч садится на выход. Раньше «дюйм на торце, евроконус 3/4 на выходе» было
    // зашито в самом узле: вся текущая линейка такая, но гребёнка с другим торцом молча
    // получила бы чужой ниппель. Новую серию без этих полей узел обвязкой не комплектует.
    // connType: 'ek' — выход под евроконус, 'compression' — под обжим.
    manifolds_rad: [
        { id: "SMS-0912-000002", loops: 2, inSize: "1", outSize: "3/4", connType: "ek", price: 18513, name: "Коллектор радиаторный в сборе 2 вых.", rommer: { id: "RMS-3210-000002", name: "Коллектор радиаторный в сборе 1\"x2 вых.", price: 9358, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000003", loops: 3, inSize: "1", outSize: "3/4", connType: "ek", price: 19707, name: "Коллектор радиаторный в сборе 3 вых.", rommer: { id: "RMS-3210-000003", name: "Коллектор радиаторный в сборе 1\"x3 вых.", price: 10789, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000004", loops: 4, inSize: "1", outSize: "3/4", connType: "ek", price: 21976, name: "Коллектор радиаторный в сборе 4 вых.", rommer: { id: "RMS-3210-000004", name: "Коллектор радиаторный в сборе 1\"x4 вых.", price: 12226, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000005", loops: 5, inSize: "1", outSize: "3/4", connType: "ek", price: 23649, name: "Коллектор радиаторный в сборе 5 вых.", rommer: { id: "RMS-3210-000005", name: "Коллектор радиаторный в сборе 1\"x5 вых.", price: 13657, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000006", loops: 6, inSize: "1", outSize: "3/4", connType: "ek", price: 26394, name: "Коллектор радиаторный в сборе 6 вых.", rommer: { id: "RMS-3210-000006", name: "Коллектор радиаторный в сборе 1\"x6 вых.", price: 15089, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000007", loops: 7, inSize: "1", outSize: "3/4", connType: "ek", price: 29740, name: "Коллектор радиаторный в сборе 7 вых.", rommer: { id: "RMS-3210-000007", name: "Коллектор радиаторный в сборе 1\"x7 вых.", price: 16547, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000008", loops: 8, inSize: "1", outSize: "3/4", connType: "ek", price: 33443, name: "Коллектор радиаторный в сборе 8 вых.", rommer: { id: "RMS-3210-000008", name: "Коллектор радиаторный в сборе 1\"x8 вых.", price: 17878, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000009", loops: 9, inSize: "1", outSize: "3/4", connType: "ek", price: 36069, name: "Коллектор радиаторный в сборе 9 вых.", rommer: { id: "RMS-3210-000009", name: "Коллектор радиаторный в сборе 1\"x9 вых.", price: 19241, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000010", loops: 10, inSize: "1", outSize: "3/4", connType: "ek", price: 38100, name: "Коллектор радиаторный в сборе 10 вых.", rommer: { id: "RMS-3210-000010", name: "Коллектор радиаторный в сборе 1\"x10 вых.", price: 20572, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000011", loops: 11, inSize: "1", outSize: "3/4", connType: "ek", price: 40130, name: "Коллектор радиаторный в сборе 11 вых.", rommer: { id: "RMS-3210-000011", name: "Коллектор радиаторный в сборе 1\"x11 вых.", price: 21965, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000012", loops: 12, inSize: "1", outSize: "3/4", connType: "ek", price: 44193, name: "Коллектор радиаторный в сборе 12 вых.", rommer: { id: "RMS-3210-000012", name: "Коллектор радиаторный в сборе 1\"x12 вых.", price: 23296, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0912-000013", loops: 13, inSize: "1", outSize: "3/4", connType: "ek", price: 47058, name: "Коллектор радиаторный в сборе 13 вых.", availability: "in_stock", price_date: "2026-08-10" }
    ],
    manifolds_chrome_blocks: [
        { id: "SMB-6850-013402", name: "Коллекторный блок 1\" x 2 вых", loops: 2, inSize: "1", outSize: "3/4", connType: "ek", price: 2983, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000002", name: "Коллектор с расходомерами полностью укомплектован 2 вых.", price: 9707, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SMB-6850-013403", name: "Коллекторный блок 1\" x 3 вых", loops: 3, inSize: "1", outSize: "3/4", connType: "ek", price: 4169, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1001-030001", name: "Комплект прямых шаровых кранов с термометрами 1”", price: 6212, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SMB-6850-013404", name: "Коллекторный блок 1\" x 4 вых", loops: 4, inSize: "1", outSize: "3/4", connType: "ek", price: 5511, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1001-030001", name: "Комплект прямых шаровых кранов с термометрами 1”", price: 6212, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
    ],
    manifold_brackets: { id: "SMB-0002-000002", name: "Кронштейны для коллекторов (пара)", price: 797, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    // === КОЛЛЕКТОРНЫЕ ШКАФЫ ===
    // outs — паспортное число выходов, inner — ВНУТРЕННЯЯ ширина корпуса (мм).
    // Подбираем по inner, а не по outs: сноска в паспорте STOUT SCC (ред. 2026) гласит,
    // что outs указано для коллектора БЕЗ запорной и сливной гарнитуры. Комплектный блок
    // на 10 выходов длиной 712 мм в ШРН-3 (внутри 670 мм) не входит — см. app.pickCabinet().
    cabinets_shrn: [
        { id: "SCC-0001-000013", name: "Шкаф распределительный наружный ШРН-0 (1–3 вых.)", sizeName: "ШРН-0", outs: [1, 3], inner: 330, innerH: 560, innerD: 120, price: 3234, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0001-000013", name: "Шкаф распределительный наружный ШРН-0 (1–3 вых.)", price: 3084, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-1 (4–5 вых.)", sizeName: "ШРН-1", outs: [4, 5], inner: 420, innerH: 560, innerD: 120, price: 3684, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0001-000045", name: "Шкаф распределительный наружный ШРН-1 (4–5 вых.)", price: 3513, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0001-000067", name: "Шкаф распределительный наружный ШРН-2 (6–7 вых.)", sizeName: "ШРН-2", outs: [6, 7], inner: 520, innerH: 560, innerD: 120, price: 3939, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0001-000067", name: "Шкаф распределительный наружный ШРН-2 (6–7 вых.)", price: 3757, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0001-000810", name: "Шкаф распределительный наружный ШРН-3 (8–10 вых.)", sizeName: "ШРН-3", outs: [8, 10], inner: 670, innerH: 560, innerD: 120, price: 4605, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0001-000810", name: "Шкаф распределительный наружный ШРН-3 (8–10 вых.)", price: 4391, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0001-001112", name: "Шкаф распределительный наружный ШРН-4 (11–12 вых.)", sizeName: "ШРН-4", outs: [11, 12], inner: 820, innerH: 560, innerD: 120, price: 5885, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0001-001112", name: "Шкаф распределительный наружный ШРН-4 (11–12 вых.)", price: 5612, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0001-001316", name: "Шкаф распределительный наружный ШРН-5 (13–16 вых.)", sizeName: "ШРН-5", outs: [13, 16], inner: 970, innerH: 560, innerD: 120, price: 6921, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0001-001316", name: "Шкаф распределительный наружный ШРН-5 (13–16 вых.)", price: 6600, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0001-001718", name: "Шкаф распределительный наружный ШРН-6 (17–18 вых.)", sizeName: "ШРН-6", outs: [17, 18], inner: 1120, innerH: 560, innerD: 120, price: 7716, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0001-001718", name: "Шкаф распределительный наружный ШРН-6 (17–18 вых.)", price: 7358, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0001-001920", name: "Шкаф распределительный наружный ШРН-7 (19–20 вых.)", sizeName: "ШРН-7", outs: [19, 20], inner: 1270, innerH: 560, innerD: 120, price: 9152, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    cabinets_shrv: [
        { id: "SCC-0002-000013", name: "Шкаф распределительный встроенный ШРВ-0 (1–3 вых.)", sizeName: "ШРВ-0", outs: [1, 3], inner: 354, innerH: 490, innerD: 121, price: 3922, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0002-000013", name: "Шкаф распределительный встроенный ШРВ-0 (1–3 вых.)", price: 3740, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0002-000045", name: "Шкаф распределительный встроенный ШРВ-1 (4–5 вых.)", sizeName: "ШРВ-1", outs: [4, 5], inner: 444, innerH: 490, innerD: 121, price: 4223, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0002-000045", name: "Шкаф распределительный встроенный ШРВ-1 (4–5 вых.)", price: 4027, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0002-000067", name: "Шкаф распределительный встроенный ШРВ-2 (6–7 вых.)", sizeName: "ШРВ-2", outs: [6, 7], inner: 544, innerH: 490, innerD: 121, price: 4479, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0002-000067", name: "Шкаф распределительный встроенный ШРВ-2 (6–7 вых.)", price: 4271, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0002-000810", name: "Шкаф распределительный встроенный ШРВ-3 (8–10 вых.)", sizeName: "ШРВ-3", outs: [8, 10], inner: 694, innerH: 490, innerD: 121, price: 5125, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0002-000810", name: "Шкаф распределительный встроенный ШРВ-3 (8–10 вых.)", price: 4888, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0002-001112", name: "Шкаф распределительный встроенный ШРВ-4 (11–12 вых.)", sizeName: "ШРВ-4", outs: [11, 12], inner: 844, innerH: 490, innerD: 121, price: 6477, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0002-001112", name: "Шкаф распределительный встроенный ШРВ-4 (11–12 вых.)", price: 6176, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0002-001316", name: "Шкаф распределительный встроенный ШРВ-5 (13–16 вых.)", sizeName: "ШРВ-5", outs: [13, 16], inner: 994, innerH: 490, innerD: 121, price: 7596, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0002-001316", name: "Шкаф распределительный встроенный ШРВ-5 (13–16 вых.)", price: 7244, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0002-001718", name: "Шкаф распределительный встроенный ШРВ-6 (17–18 вых.)", sizeName: "ШРВ-6", outs: [17, 18], inner: 1144, innerH: 490, innerD: 121, price: 8310, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RCM-0002-001718", name: "Шкаф распределительный встроенный ШРВ-6 (17–18 вых.)", price: 7925, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" } },
        { id: "SCC-0002-001920", name: "Шкаф распределительный встроенный ШРВ-7 (19–20 вых.)", sizeName: "ШРВ-7", outs: [19, 20], inner: 1294, innerH: 490, innerD: 121, price: 10050, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Углублённый (180 мм) — единственная серия, куда по глубине входит насосно-смесительный
    // узел. Встроенного углублённого у STOUT нет: у ШРВ раздвигается глубина УСТАНОВКИ
    // в стене (125→195), а внутренняя глубина корпуса остаётся 121 мм.
    // ВАЖНО: у SCC-1003 нет боковой перфорации — только нижнее подключение труб.
    cabinets_shrn180: [
        { id: "SCC-1003-000013", imgId: "SCC-1003-000810", name: "Шкаф распределительный наружный углублённый ШРН-180-0 (1–3 вых.)", sizeName: "ШРН-180-0", outs: [1, 3], inner: 328, innerH: 560, innerD: 178, price: 8756, brand: "STOUT", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCC-1003-000045", imgId: "SCC-1003-000810", name: "Шкаф распределительный наружный углублённый ШРН-180-1 (4–5 вых.)", sizeName: "ШРН-180-1", outs: [4, 5], inner: 418, innerH: 560, innerD: 178, price: 9349, brand: "STOUT", availability: "on_order", price_date: "2026-08-10" },
        { id: "SCC-1003-000067", name: "Шкаф распределительный наружный углублённый ШРН-180-2 (6–7 вых.)", sizeName: "ШРН-180-2", outs: [6, 7], inner: 518, innerH: 560, innerD: 178, price: 10207, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCC-1003-000810", name: "Шкаф распределительный наружный углублённый ШРН-180-3 (8–10 вых.)", sizeName: "ШРН-180-3", outs: [8, 10], inner: 668, innerH: 560, innerD: 178, price: 12040, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCC-1003-001112", name: "Шкаф распределительный наружный углублённый ШРН-180-4 (11–12 вых.)", sizeName: "ШРН-180-4", outs: [11, 12], inner: 818, innerH: 560, innerD: 178, price: 14317, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCC-1003-001316", name: "Шкаф распределительный наружный углублённый ШРН-180-5 (13–16 вых.)", sizeName: "ШРН-180-5", outs: [13, 16], inner: 968, innerH: 560, innerD: 178, price: 16229, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCC-1003-001718", name: "Шкаф распределительный наружный углублённый ШРН-180-6 (17–18 вых.)", sizeName: "ШРН-180-6", outs: [17, 18], inner: 1118, innerH: 560, innerD: 178, price: 17416, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCC-1003-001920", name: "Шкаф распределительный наружный углублённый ШРН-180-7 (19–20 вых.)", sizeName: "ШРН-180-7", outs: [19, 20], inner: 1268, innerH: 560, innerD: 178, price: 19219, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Эконом-серия наружных шкафов. Паспорта с внутренними размерами у неё нет,
    // поэтому inner — оценка «наружная ширина минус 34 мм» (разница корпуса и просвета
    // у SCC-0001 постоянна и равна 34–35 мм). Диапазоны выходов свои, не как у SCC-0001.
    cabinets_shrn_eco: [
        { id: "SSC-0004-000045", imgId: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-1 эконом (1–3 вых.)", sizeName: "ШРН-1 эконом", outs: [1, 3], inner: 416, innerApprox: true, innerH: 560, innerD: 118, price: 2872, brand: "STOUT", availability: "in_stock", price_date: "2026-07-29" },
        { id: "SSC-0004-000067", imgId: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-2 эконом (4–6 вых.)", sizeName: "ШРН-2 эконом", outs: [4, 6], inner: 516, innerApprox: true, innerH: 560, innerD: 118, price: 3094, brand: "STOUT", availability: "in_stock", price_date: "2026-07-29" },
        { id: "SSC-0004-000810", imgId: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-3 эконом (7–9 вых.)", sizeName: "ШРН-3 эконом", outs: [7, 9], inner: 663, innerApprox: true, innerH: 560, innerD: 118, price: 3637, brand: "STOUT", availability: "in_stock", price_date: "2026-07-29" },
        { id: "SSC-0004-001112", imgId: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-4 эконом (10–12 вых.)", sizeName: "ШРН-4 эконом", outs: [10, 12], inner: 814, innerApprox: true, innerH: 560, innerD: 118, price: 4634, brand: "STOUT", availability: "in_stock", price_date: "2026-07-29" },
        { id: "SSC-0004-001316", imgId: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-5 эконом (13–15 вых.)", sizeName: "ШРН-5 эконом", outs: [13, 15], inner: 964, innerApprox: true, innerH: 560, innerD: 118, price: 5296, brand: "STOUT", availability: "in_stock", price_date: "2026-07-29" },
        { id: "SSC-0004-001718", imgId: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-6 эконом (16–18 вых.)", sizeName: "ШРН-6 эконом", outs: [16, 18], inner: 1113, innerApprox: true, innerH: 560, innerD: 118, price: 6020, brand: "STOUT", availability: "in_stock", price_date: "2026-07-29" },
        { id: "SSC-0004-001920", imgId: "SCC-0001-000045", name: "Шкаф распределительный наружный ШРН-7 эконом (19–20 вых.)", sizeName: "ШРН-7 эконом", outs: [19, 20], inner: 1266, innerApprox: true, innerH: 560, innerD: 118, price: 7888, brand: "STOUT", availability: "in_stock", price_date: "2026-07-29" }
    ],
    pipes: [
        { id: "SPX-0002-101620", name: "Труба 16x2.0 (100 м)", len: 100, price: 152, rommer: { id: "RPX-0002-101620", name: "Труба PEX-a 16x2.0 (100 м)", price: 80, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPX-0002-501620", name: "Труба 16x2.0 (500 м)", len: 500, price: 152, rommer: { id: "RPX-0002-501620", name: "Труба PEX-a 16x2.0 (500 м)", price: 80, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" }
    ],
    metal_plastic_pipes: [
        { id: "SPM-0001-101620", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 16x2.0 (100 м)", len: 100, price: 143, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPM-0001-201620", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 16x2.0 (200 м)", len: 200, price: 143, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPM-0001-102020", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 20x2.0 (100 м)", len: 100, price: 242, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPM-0001-052630", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 26x3.0 (50 м)", len: 50, price: 439, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPM-0001-053230", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 32x3.0 (50 м)", len: 50, price: 644, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    stable_pipes: [
        { id: "SPS-0002-001626", name: "Труба стабильная PE-Xa/Al/PE-RT 16.2х2.6 (100 м)", len: 100, price: 266, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RPS-0001-001626", name: "Труба стабильная PE-Xa/Al/PE-RT 16.2х2.6 (100 м)", len: 100, price: 207.00, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-30" } },
        { id: "SPS-0002-002029", name: "Труба стабильная PE-Xa/Al/PE-RT II 20х2.9 (100 м)",   len: 100, price: 379, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RPS-0001-002029", name: "Труба стабильная PE-Xa/Al/PE-RT II 20х2.9 (100 м)",   len: 100, price: 293.00, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-30" } },
        { id: "SPS-0002-002537", name: "Труба стабильная PE-Xa/Al/PE-RT II 25х3.7 (50 м)",    len: 50,  price: 534, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RPS-0001-002537", name: "Труба стабильная PE-Xa/Al/PE-RT II 25х3.7 (50 м)",    len: 50,  price: 413.00, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-30" } },
        { id: "SPS-0002-003247", name: "Труба стабильная PE-Xa/Al/PE-RT II 32х4.7 (50 м)",    len: 50,  price: 1008, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RPS-0001-003247", name: "Труба стабильная PE-Xa/Al/PE-RT II 32х4.7 (50 м)",    len: 50,  price: 780.00, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-30" } },
    ],
    insulated_pipes_mp_red: [
        { id: "SPI-0001-101620", name: "Труба металлопластиковая в теплоизоляции (красная) 16x2.0 (100 м)", len: 100, price: 199, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPI-0001-102020", name: "Труба металлопластиковая в теплоизоляции (красная) 20x2.0 (100 м)", len: 100, price: 314, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPI-0001-052630", name: "Труба металлопластиковая в теплоизоляции (красная) 26x3.0 (50 м)", len: 50, price: 531, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPI-0001-053230", name: "Труба металлопластиковая в теплоизоляции (красная) 32x3.0 (50 м)", len: 50, price: 749, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    insulated_pipes_mp_blue: [
        { id: "SPI-0002-101620", name: "Труба металлопластиковая в теплоизоляции (синяя) 16x2.0 (100 м)", len: 100, price: 199, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPI-0002-102020", name: "Труба металлопластиковая в теплоизоляции (синяя) 20x2.0 (100 м)", len: 100, price: 314, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPI-0002-052630", name: "Труба металлопластиковая в теплоизоляции (синяя) 26x3.0 (50 м)", len: 50, price: 531, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPI-0002-053230", name: "Труба металлопластиковая в теплоизоляции (синяя) 32x3.0 (50 м)", len: 50, price: 749, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    insulated_pipes: [
        { id: "SPI-0003-001622", name: "Труба 16x2.2 в теплоизоляции (красная)", len: 100, price: 220, rommer: [{ id: "RPX-0001-001622", name: "Труба PEX-a 16x2.2 (серая)", price: 86, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, { id: "EFXT018062SUPRK-400", name: "Теплоизоляция 18/6 (Красная)", price: 28, brand: "Energoflex" }], availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPI-0004-001622", name: "Труба 16x2.2 в теплоизоляции (синяя)", len: 100, price: 220, rommer: [{ id: "RPX-0001-001622", name: "Труба PEX-a 16x2.2 (серая)", price: 86, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, { id: "EFXT018062SUPRS-400", name: "Теплоизоляция 18/6 (Синяя)", price: 28, brand: "Energoflex" }], availability: "in_stock", price_date: "2026-06-27" }
    ],
    rad_pipes_grey: [
        { id: "SPX-0001-001622", name: "Труба PEX-a/EVOH серая 16x2.2 (100м)", len: 100, price: 175, rommer: { id: "RPX-0001-001622", name: "Труба PEX-a 16x2.2", price: 86, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SPX-0001-241622", name: "Труба PEX-a/EVOH серая 16x2.2 (240м)", len: 240, price: 175, rommer: { id: "RPX-0001-241622", name: "Труба PEX-a 16x2.2", price: 86, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SPX-0001-501622", name: "Труба PEX-a/EVOH серая 16x2.2 (500м)", len: 500, price: 175, rommer: { id: "RPX-0001-501622", name: "Труба PEX-a 16x2.2", price: 86, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SPX-0001-002028", name: "Труба PEX-a/EVOH серая 20x2.8 (100м)", len: 100, price: 262, rommer: { id: "RPX-0001-002028", name: "Труба PEX-a 20x2.8", price: 130, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SPX-0001-002535", name: "Труба PEX-a/EVOH серая 25x3.5 (50м)", len: 50, price: 407, rommer: { id: "RPX-0001-002535", name: "Труба PEX-a 25x3.5", price: 210, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SPX-0001-003244", name: "Труба PEX-a/EVOH серая 32x4.4 (50м)", len: 50, price: 661, rommer: { id: "RPX-0001-003244", name: "Труба PEX-a 32x4.4", price: 357, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" }
    ],
    axial_fittings_pex: [
        // Латунные аксиальные фитинги STOUT для труб PE-Xa (серая) — тройниковая/шлейфовая разводка
        // Монтажная гильза
        { id: "SFA-0020-000016", name: "Монтажная гильза 16 (аксиальная)", price: 109, brand: "STOUT", rommer: { id: "RFA-0020-000016", name: "Монтажная гильза 16х2.0-2.6", price: 73, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0020-000020", name: "Монтажная гильза 20 (аксиальная)", price: 112, brand: "STOUT", rommer: { id: "RFA-0020-000020", name: "Монтажная гильза 20х2.8", price: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0020-000025", name: "Монтажная гильза 25 (аксиальная)", price: 175, brand: "STOUT", rommer: { id: "RFA-0020-000025", name: "Монтажная гильза 25х3.5", price: 127, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0020-000032", name: "Монтажная гильза 32 (аксиальная)", price: 362, brand: "STOUT", rommer: { id: "RFA-0020-000032", name: "Монтажная гильза 32х4,4", price: 273, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Муфта соединительная равнопроходная
        { id: "SFA-0003-000016", name: "Муфта соединительная равнопроходная 16", price: 240, brand: "STOUT", rommer: { id: "RFA-0003-000016", name: "Муфта соединительная равнопроходная 16", price: 118, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0003-000020", name: "Муфта соединительная равнопроходная 20", price: 355, brand: "STOUT", rommer: { id: "RFA-0003-000020", name: "Муфта соединительная равнопроходная 20", price: 173, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0003-000025", name: "Муфта соединительная равнопроходная 25", price: 566, brand: "STOUT", rommer: { id: "RFA-0003-000025", name: "Муфта соединительная равнопроходная 25", price: 305, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0003-000032", name: "Муфта соединительная равнопроходная 32", price: 1046, brand: "STOUT", rommer: { id: "RFA-0003-000032", name: "Муфта соединительная равнопроходная 32", price: 529, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Муфта соединительная переходная
        { id: "SFA-0004-002016", name: "Муфта соединительная переходная 20x16", price: 301, brand: "STOUT", rommer: { id: "RFA-0004-002016", name: "Муфта соединительная переходная 20x16", price: 149, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0004-002516", name: "Муфта соединительная переходная 25x16", price: 452, brand: "STOUT", rommer: { id: "RFA-0004-002516", name: "Муфта соединительная переходная 25x16", price: 213, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0004-002520", name: "Муфта соединительная переходная 25x20", price: 479, brand: "STOUT", rommer: { id: "RFA-0004-002520", name: "Муфта соединительная переходная 25x20", price: 245, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0004-003225", name: "Муфта соединительная переходная 32x25", price: 912, brand: "STOUT", rommer: { id: "RFA-0004-003225", name: "Муфта соединительная переходная 32x25", price: 416, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Тройник равнопроходный
        { id: "SFA-0013-000016", name: "Тройник равнопроходный 16", price: 541, brand: "STOUT", rommer: { id: "RFA-0013-000016", name: "Тройник равнопроходной 16", price: 242, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0013-000020", name: "Тройник равнопроходный 20", price: 717, brand: "STOUT", rommer: { id: "RFA-0013-000020", name: "Тройник равнопроходной 20", price: 378, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0013-000025", name: "Тройник равнопроходный 25", price: 1138, brand: "STOUT", rommer: { id: "RFA-0013-000025", name: "Тройник равнопроходной 25", price: 604, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0013-000032", name: "Тройник равнопроходный 32", price: 2044, brand: "STOUT", rommer: { id: "RFA-0013-000032", name: "Тройник равнопроходной 32", price: 1091, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Тройник переходной (для понижения диаметра магистрали по остаточной мощности)
        { id: "SFA-0014-162016", name: "Тройник переходной 16x20x16", price: 601, brand: "STOUT", rommer: { id: "RFA-0014-162016", name: "Тройник переходной 16x20x16", price: 313, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-201616", name: "Тройник переходной 20x16x16", price: 659, brand: "STOUT", rommer: { id: "RFA-0014-201616", name: "Тройник переходной 20x16x16", price: 298, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-201620", name: "Тройник переходной 20x16x20", price: 643, brand: "STOUT", rommer: { id: "RFA-0014-201620", name: "Тройник переходной 20x16x20", price: 331, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-202016", name: "Тройник переходной 20x20x16", price: 745, brand: "STOUT", rommer: { id: "RFA-0014-202016", name: "Тройник переходной 20x20x16", price: 338, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-202520", name: "Тройник переходной 20x25x20", price: 896, brand: "STOUT", rommer: { id: "RFA-0014-202520", name: "Тройник переходной 20х25х20", price: 446, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-251616", name: "Тройник переходной 25x16x16", price: 825, brand: "STOUT", rommer: { id: "RFA-0014-251616", name: "Тройник переходной 25х16х16", price: 362, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-251620", name: "Тройник переходной 25x16x20", price: 832, brand: "STOUT", rommer: { id: "RFA-0014-251620", name: "Тройник переходной 25x16x20", price: 396, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-251625", name: "Тройник переходной 25x16x25", price: 1136, brand: "STOUT", rommer: { id: "RFA-0014-251625", name: "Тройник переходной 25x16x25", price: 467, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-252016", name: "Тройник переходной 25x20x16", price: 1189, brand: "STOUT", rommer: { id: "RFA-0014-252016", name: "Тройник переходной 25x20x16", price: 404, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-252020", name: "Тройник переходной 25x20x20", price: 912, brand: "STOUT", rommer: { id: "RFA-0014-252020", name: "Тройник переходной 25x20x20", price: 442, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-252025", name: "Тройник переходной 25x20x25", price: 1046, brand: "STOUT", rommer: { id: "RFA-0014-252025", name: "Тройник переходной 25x20x25", price: 507, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-252516", name: "Тройник переходной 25x25x16", price: 1211, brand: "STOUT", rommer: { id: "RFA-0014-252516", name: "Тройник переходной 25x25x16", price: 469, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-252520", name: "Тройник переходной 25x25x20", price: 1087, brand: "STOUT", rommer: { id: "RFA-0014-252520", name: "Тройник переходной 25x25x20", price: 511, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-253225", name: "Тройник переходной 25x32x25", price: 1645, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0014-322025", name: "Тройник переходной 32x20x25", price: 1720, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0014-321632", name: "Тройник переходной 32x16x32", price: 1646, brand: "STOUT", rommer: { id: "RFA-0014-321632", name: "Тройник переходной 32x16x32", price: 769, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-322032", name: "Тройник переходной 32x20x32", price: 1656, brand: "STOUT", rommer: { id: "RFA-0014-322032", name: "Тройник переходной 32x20x32", price: 789, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-322525", name: "Тройник переходной 32x25x25", price: 1795, brand: "STOUT", rommer: { id: "RFA-0014-322525", name: "Тройник переходной 32x25x25", price: 735, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0014-322532", name: "Тройник переходной 32x25x32", price: 1818, brand: "STOUT", rommer: { id: "RFA-0014-322532", name: "Тройник переходной 32х25х32", price: 889, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Тройник-переходник с внутренней резьбой (врезка под запорный/термостатический клапан)
        { id: "SFA-0028-001612", name: "Тройник-переходник с внутренней резьбой 16xRp1/2\"", price: 636, brand: "STOUT", rommer: { id: "RFA-0028-001612", name: "Тройник с внутренней резьбой 16x1/2\"x16", price: 295, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0028-002012", name: "Тройник-переходник с внутренней резьбой 20xRp1/2\"", price: 803, brand: "STOUT", rommer: { id: "RFA-0028-002012", name: "Тройник с внутренней резьбой 20x1/2\"x20", price: 355, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0028-002034", name: "Тройник-переходник с внутренней резьбой 20xRp3/4\"", price: 945, brand: "STOUT", rommer: { id: "RFA-0028-002034", name: "Тройник с внутренней резьбой 20х3/4\"х20", price: 509, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0028-002534", name: "Тройник-переходник с внутренней резьбой 25xRp3/4\"", price: 1126, brand: "STOUT", rommer: { id: "RFA-0028-002534", name: "Тройник с внутренней резьбой 25х3/4\"х25", price: 584, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0028-003210", name: "Тройник-переходник с внутренней резьбой 32xRp1\"", price: 1949, brand: "STOUT", rommer: { id: "RFA-0028-003210", name: "Тройник с внутренней резьбой 32х1\"х32", price: 1091, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Переходник с наружной резьбой (подключение начала магистрали к коллектору/котлу)
        { id: "SFA-0001-001612", name: "Переходник с наружной резьбой 16xR1/2\"", price: 289, brand: "STOUT", rommer: { id: "RFA-0001-001612", name: "Переходник с наружной резьбой 16x1/2\"", price: 151, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-002012", name: "Переходник с наружной резьбой 20xR1/2\"", price: 349, brand: "STOUT", rommer: { id: "RFA-0001-002012", name: "Переходник с наружной резьбой 20x1/2\"", price: 175, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-001634", name: "Переходник с наружной резьбой 16xR3/4\"", price: 403, brand: "STOUT", rommer: { id: "RFA-0001-001634", name: "Переходник с наружной резьбой 16x3/4\"", price: 204, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-002034", name: "Переходник с наружной резьбой 20xR3/4\"", price: 522, brand: "STOUT", rommer: { id: "RFA-0001-002034", name: "Переходник с наружной резьбой 20x3/4\"", price: 224, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-002512", name: "Переходник с наружной резьбой 25xR1/2\"", price: 541, brand: "STOUT", rommer: { id: "RFA-0001-002512", name: "Переходник с наружной резьбой 25x1/2\"", price: 253, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-002534", name: "Переходник с наружной резьбой 25xR3/4\"", price: 577, brand: "STOUT", rommer: { id: "RFA-0001-002534", name: "Переходник с наружной резьбой 25x3/4\"", price: 309, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-002510", name: "Переходник с наружной резьбой 25xR1\"", price: 882, brand: "STOUT", rommer: { id: "RFA-0001-002510", name: "Переходник с наружной резьбой 25x1\"", price: 386, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-003234", name: "Переходник с наружной резьбой 32xR3/4\"", price: 1010, brand: "STOUT", rommer: { id: "RFA-0001-003234", name: "Переходник с наружной резьбой 32x3/4\"", price: 398, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0001-003210", name: "Переходник с наружной резьбой 32xR1\"", price: 1020, brand: "STOUT", rommer: { id: "RFA-0001-003210", name: "Переходник с наружной резьбой 32x1\"", price: 502, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Переходник с внутренней резьбой
        { id: "SFA-0002-001612", name: "Переходник с внутренней резьбой 16xRp1/2\"", price: 353, brand: "STOUT", rommer: { id: "RFA-0002-001612", name: "Переходник с внутренней резьбой 16x1/2\"", price: 164, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0002-001634", name: "Переходник с внутренней резьбой 16xRp3/4\"", price: 534, brand: "STOUT", rommer: { id: "RFA-0002-001634", name: "Переходник с внутренней резьбой 16x3/4\"", price: 236, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0002-002012", name: "Переходник с внутренней резьбой 20xRp1/2\"", price: 383, brand: "STOUT", rommer: { id: "RFA-0002-002012", name: "Переходник с внутренней резьбой 20x1/2\"", price: 202, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0002-002034", name: "Переходник с внутренней резьбой 20xRp3/4\"", price: 577, brand: "STOUT", rommer: { id: "RFA-0002-002034", name: "Переходник с внутренней резьбой 20x3/4\"", price: 256, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0002-002534", name: "Переходник с внутренней резьбой 25xRp3/4\"", price: 652, brand: "STOUT", rommer: { id: "RFA-0002-002534", name: "Переходник с внутренней резьбой 25x3/4\"", price: 315, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0002-003210", name: "Переходник с внутренней резьбой 32xRp1\"", price: 1122, brand: "STOUT", rommer: { id: "RFA-0002-003210", name: "Переходник с внутренней резьбой 32x1\"", price: 538, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Угольник 90°
        { id: "SFA-0007-000016", name: "Угольник 90° 16", price: 430, brand: "STOUT", rommer: { id: "RFA-0007-000016", name: "Угольник 16", price: 178, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0007-000020", name: "Угольник 90° 20", price: 583, brand: "STOUT", rommer: { id: "RFA-0007-000020", name: "Угольник 20", price: 275, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0007-000025", name: "Угольник 90° 25", price: 991, brand: "STOUT", rommer: { id: "RFA-0007-000025", name: "Угольник 25", price: 436, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0007-000032", name: "Угольник 90° 32", price: 1897, brand: "STOUT", rommer: { id: "RFA-0007-000032", name: "Угольник 32", price: 800, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        // Угольник 45°
        { id: "SFA-0031-000032", name: "Угольник 45° 32", price: 2281, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        // Заглушка (конец магистрали)
        { id: "SFA-0030-000016", name: "Заглушка 16", price: 171, brand: "STOUT", rommer: { id: "RFA-0030-000016", name: "Заглушка 16", price: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0030-000020", name: "Заглушка 20", price: 224, brand: "STOUT", rommer: { id: "RFA-0030-000020", name: "Заглушка 20", price: 127, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
        { id: "SFA-0030-000025", name: "Заглушка 25", price: 346, brand: "STOUT", rommer: { id: "RFA-0030-000025", name: "Заглушка 25", price: 218, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" }
    ],
    insulation: [
        { id: "RIC-0002-180602", name: "Трубка ПРОТЕКТ ПРО 18/6, 2м (красная)", dn: 18, thick: 6, len: 2, pack: 184, price: 27, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RIC-0001-180602", name: "Трубка ПРОТЕКТ ПРО 18/6, 2м (синяя)",  dn: 18, thick: 6, len: 2, pack: 184, price: 27, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    manifolds: [
        { id: "SMS-0917-000002", loops: 2, price: 8479, rommer: { id: "RMS-1200-000002", name: "Коллектор с расходомерами 1\"x2 вых.", price: 4586, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SMS-0917-000003", loops: 3, price: 10717, rommer: { id: "RMS-1200-000003", name: "Коллектор с расходомерами 1\"x3 вых.", price: 5819, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000004", loops: 4, price: 12973, rommer: { id: "RMS-1200-000004", name: "Коллектор с расходомерами 1\"x4 вых.", price: 6956, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000005", loops: 5, price: 15532, rommer: { id: "RMS-1200-000005", name: "Коллектор с расходомерами 1\"x5 вых.", price: 7978, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000006", loops: 6, price: 17796, rommer: { id: "RMS-1200-000006", name: "Коллектор с расходомерами 1\"x6 вых.", price: 9088, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000007", loops: 7, price: 20830, rommer: { id: "RMS-1200-000007", name: "Коллектор с расходомерами 1\"x7 вых.", price: 10412, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000008", loops: 8, price: 23477, rommer: { id: "RMS-1200-000008", name: "Коллектор с расходомерами 1\"x8 вых.", price: 11599, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000009", loops: 9, price: 25873, rommer: { id: "RMS-1200-000009", name: "Коллектор с расходомерами 1\"x9 вых.", price: 13010, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000010", loops: 10, price: 28480, rommer: { id: "RMS-1200-000010", name: "Коллектор с расходомерами 1\"x10 вых.", price: 16206, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000011", loops: 11, price: 30864, rommer: { id: "RMS-1200-000011", name: "Коллектор с расходомерами 1\"x11 вых.", price: 17472, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000012", loops: 12, price: 33210, rommer: { id: "RMS-1200-000012", name: "Коллектор с расходомерами 1\"x12 вых.", price: 18783, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMS-0917-000013", loops: 13, price: 36993, availability: "in_stock", price_date: "2026-08-10" }
    ],
    manifolds_full_kit: [
        { id: "SMS-0907-000002", loops: 2, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x2", price: 19827, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000002", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x2", price: 9707.02, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000003", loops: 3, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x3", price: 22342, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000003", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x3", price: 11313.16, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000004", loops: 4, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x4", price: 25257, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000004", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x4", price: 12924.25, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000005", loops: 5, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x5", price: 27587, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000005", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x5", price: 14530.38, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000006", loops: 6, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x6", price: 31389, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000006", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x6", price: 16136.51, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000007", loops: 7, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x7", price: 35337, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000007", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x7", price: 17769.08, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000008", loops: 8, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x8", price: 40045, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000008", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x8", price: 19276.07, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000009", loops: 9, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x9", price: 45022, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000009", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x9", price: 20811.98, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000010", loops: 10, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x10", price: 47775, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000010", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x10", price: 22318.14, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000011", loops: 11, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x11", price: 52693, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000011", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x11", price: 23885.44, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000012", loops: 12, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x12", price: 56674, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1210-000012", name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x12", price: 25392.43, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0907-000013", loops: 13, name: "Коллектор с расходомерами полностью укомплектован 1\"/3/4\"x13", price: 35337, availability: "in_stock", price_date: "2026-07-13" }
    ],
    manifolds_shutoff: [
        { id: "SMS-0927-000002", loops: 2, name: "Коллектор с запорными клапанами 1\"/3/4\"x2", price: 11466, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000002", name: "Коллектор с запорными клапанами 1\"/3/4\"x2", price: 5537.19, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000003", loops: 3, name: "Коллектор с запорными клапанами 1\"/3/4\"x3", price: 12899, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000003", name: "Коллектор с запорными клапанами 1\"/3/4\"x3", price: 5844.54, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000004", loops: 4, name: "Коллектор с запорными клапанами 1\"/3/4\"x4", price: 15527, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000004", name: "Коллектор с запорными клапанами 1\"/3/4\"x4", price: 6984.69, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000005", loops: 5, name: "Коллектор с запорными клапанами 1\"/3/4\"x5", price: 18633, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000005", name: "Коллектор с запорными клапанами 1\"/3/4\"x5", price: 8029.84, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000006", loops: 6, name: "Коллектор с запорными клапанами 1\"/3/4\"x6", price: 22574, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000006", name: "Коллектор с запорными клапанами 1\"/3/4\"x6", price: 9122.90, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000007", loops: 7, name: "Коллектор с запорными клапанами 1\"/3/4\"x7", price: 25919, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000007", name: "Коллектор с запорными клапанами 1\"/3/4\"x7", price: 10453.91, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000008", loops: 8, name: "Коллектор с запорными клапанами 1\"/3/4\"x8", price: 29860, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000008", name: "Коллектор с запорными клапанами 1\"/3/4\"x8", price: 11641.16, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000009", loops: 9, name: "Коллектор с запорными клапанами 1\"/3/4\"x9", price: 32009, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000009", name: "Коллектор с запорными клапанами 1\"/3/4\"x9", price: 13067.18, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000010", loops: 10, name: "Коллектор с запорными клапанами 1\"/3/4\"x10", price: 35592, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000010", name: "Коллектор с запорными клапанами 1\"/3/4\"x10", price: 16273.48, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000011", loops: 11, name: "Коллектор с запорными клапанами 1\"/3/4\"x11", price: 38340, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000011", name: "Коллектор с запорными клапанами 1\"/3/4\"x11", price: 17770.74, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } },
        { id: "SMS-0927-000012", loops: 12, name: "Коллектор с запорными клапанами 1\"/3/4\"x12", price: 42041, availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RMS-1201-000012", name: "Коллектор с запорными клапанами 1\"/3/4\"x12", price: 19051.45, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-02" } }
    ],
    manifolds_shutoff_auto: [
        { id: "RMS-1202-000002", loops: 2, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x2", price: 6035, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000003", loops: 3, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x3", price: 6370, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000004", loops: 4, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x4", price: 7613, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000005", loops: 5, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x5", price: 8752, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000006", loops: 6, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x6", price: 9943, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000007", loops: 7, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x7", price: 11394, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000008", loops: 8, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x8", price: 12688, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000009", loops: 9, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x9", price: 14243, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000010", loops: 10, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x10", price: 17738, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000011", loops: 11, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x11", price: 19370, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMS-1202-000012", loops: 12, name: "Коллектор с запорными клапанами (раздвижные кронштейны) 1\"/3/4\"x12", price: 20766, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Обвязка коллектора тёплого пола со стороны трассы — лист О-11 проекта-образца
    // 2025-148. В комплектацию гребёнки эти позиции не входят ни у одной из серий:
    // у коллектора присоединение 1", трасса приходит трубой, и между ними нужны
    // переход на резьбу крана, сами отсечные краны и поворот на гребёнку.
    // Краны продублированы из ball_valves намеренно: под трассу Ø32 металлопластика
    // переходника на 3/4" в линейке нет, и узел там собирается целиком на 1".
    ufh_node_parts: [
        { id: "SFT-0004-000134", name: "Ниппель 1\" х 3/4\" НР", price: 350, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVB-0007-200020", name: "Кран шаровой с американкой 3/4\" ВР/НР (Бабочка)", price: 1556, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0005-0510220", name: "Кран шаровой с американкой ВР/НР 3/4\"", price: 640.13, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SVB-0007-200025", name: "Кран шаровой с американкой 1\" ВР/НР (Бабочка)", price: 2423, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0005-0510225", name: "Кран шаровой с американкой ВР/НР 1\"", price: 1371.43, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-19" } },
        { id: "SFT-0014-000034", name: "Угольник 90° 3/4\" ВР", price: 462, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0014-000001", name: "Угольник 90° 1\" ВР", price: 787, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    parts: [
        { id: "SMS-1000-010001", name: "Концевой фитинг", price: 2441, rommer: { id: "RMS-1001-010001", name: "Группа концевая для коллектора Rommer", price: 1903, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SFC-0020-001622", name: "Евроконус 16x2.2", price: 381, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0029-000016", name: "Фиксатор 90", price: 127, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFC-0020-001620", name: "Евроконус 16x2.0", price: 376, rommer: { id: "RFC-1020-001620", name: "Евроконус 16x2.0", price: 193, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SFC-0020-002020", name: "Евроконус 20x2.0", price: 371, availability: "in_stock", price_date: "2026-08-10" },
        // Аксиальный вариант подключения к коллектору вместо компрессионного евроконуса:
        // надвижная гильза вместо накидной гайки с обжимным кольцом. Ставится в паре с
        // монтажной гильзой SFA-0020-000016 — она входит в комплектацию, а не опция
        // (без гильзы соединение не собирается). Отсюда noCheapen в таблице замены.
        { id: "SFA-0034-001634", name: "Переходник с накидной гайкой (евроконус) 16xG3/4\" (аксиальный)", price: 526, brand: "STOUT", rommer: { id: "RFA-0034-001634", name: "Переходник с накидной гайкой (евроконус) 16xG3/4\"", price: 250, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-09" },
        { id: "RDG-0120-100000", name: "Термостат для смесительного узла RDG-0120-005010", price: 1066, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RDG-0120-100025", name: "Сдвоенный ниппель (комплект 2 шт.)", price: 1173, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Концевая группа с РУЧНЫМ воздухоотводчиком — та же серия SMS-1000, что и parts[0],
    // но с краном Маевского вместо автоматического воздухоотводчика. Именно её рисует лист
    // «Узел обвязки коллектора радиаторного отопления»: две его подписи, «Кран маевского»
    // и «Сливной штуцер», — это один этот фитинг. Он садится на торец со стороны подводки;
    // противоположный, глухой торец закрывает заглушка plug_1.
    //
    // Отдельным ключом, а не строкой в parts: этот массив адресуется по индексам
    // (parts[0]…parts[3] разбросаны по render), и вставка внутрь сдвинула бы их все.
    //
    // Цена — из price_index (2140,47 ₽) по коэффициенту группы «STOUT Коллекторы»: он
    // выводится из уже размеченных позиций той же группы (44193/52839,47 = 0,8364).
    // availability: наличие не проверено, у AutoPrice эта позиция ещё не проходила —
    // ставим осторожное «под заказ», первый же прогон парсера перепишет фактическим.
    end_fitting_manual: { id: "SMS-1000-020001", name: "Концевой фитинг с дренажным клапаном и ручным воздухоотводчиком", price: 1790, brand: "STOUT", availability: "on_order", price_date: "2026-08-15" },
    mixing_units: [
        { id: "SDG-0120-001000", name: "Узел подмеса (7 кВт)", price: 25684, rommer: { id: "RDG-0120-008100", name: "Узел подмеса с термоголовкой (6 кВт)", price: 14227, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "RDG-0120-008000", name: "Узел подмеса с термоголовкой, перепускным клапаном и байпасом (10 кВт)", price: 25252, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RDG-0120-009000", name: "Узел подмеса с термостатической головкой (9 кВт)", price: 8390, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RDG-0120-009001", name: "Узел подмеса с термостатической головкой, без кронштейна (9 кВт)", price: 8390, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RDG-0120-005010", name: "Узел подмеса с термостатическим клапаном 20-55°C (6 кВт)", price: 11388, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    groups_dn20: [
        { id: "SDG-0001-002001", name: "Группа насосная DN20 (Прямая) - для радиаторов до 10 кВт", price: 16243, rommer: { id: "RDG-1001-002501", name: "Группа насосная DN25 (Прямая) - для радиаторов до 23 кВт", price: 9514, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SDG-0002-002001", name: "Группа насосная DN20 (Смес.) - для радиаторов до 10 кВт, для тёплого пола до 5 кВт", price: 29589, rommer: { id: "RDG-1002-002501", name: "Насосная группа DN25 (термостатический клапан) - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 11212, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SDG-0003-002001", name: "Группа насосная DN20 (под сервопривод) - для радиаторов до 10 кВт, для тёплого пола до 5 кВт", price: 16243, rommer: { id: "RDG-1003-002501", name: "Группа насосная DN25 (под сервопривод) - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 11496, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" }, availability: "in_stock", price_date: "2026-06-06" },
        { id: "SDG-0007-002001", name: "Группа насосная DN20 (3-х ход. приводной смеситель) - для радиаторов до 10 кВт, для тёплого пола до 5 кВт", price: 23382, rommer: { id: "RDG-1003-002501", name: "Группа насосная DN25 (под сервопривод) - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 11496, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-02" }
    ],
    groups_dn25: [
        { id: "SDG-0001-002501", name: "Группа насосная DN25 (Прямая) - для радиаторов до 24 кВт", price: 17535, rommer: { id: "RDG-1001-002501", name: "Группа насосная DN25 (Прямая) - для радиаторов до 23 кВт", price: 9514, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SDG-0002-002501", name: "Группа насосная DN25 (Смес.) - для радиаторов до 24 кВт, для тёплого пола до 12 кВт", price: 31942, rommer: { id: "RDG-1002-002501", name: "Насосная группа DN25 (термостатический клапан) - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 11212, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SDG-0003-002501", name: "Группа насосная DN25 (под сервопривод) - для радиаторов до 24 кВт, для тёплого пола до 12 кВт", price: 25240, rommer: { id: "RDG-1003-002501", name: "Группа насосная DN25 (под сервопривод) - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 11496, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SDG-0001-002504", name: "Группа насосная DN25 (Прямая, с насосом STOUT SPC 25/60-180) - для радиаторов до 24 кВт", price: 17535, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
        { id: "SDG-0002-002504", name: "Группа насосная DN25 (Смес., с насосом STOUT SPC 25/60-180) - для радиаторов до 24 кВт, для тёплого пола до 12 кВт", price: 31942, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
        { id: "SDG-0003-002504", name: "Группа насосная DN25 (под сервопривод, с насосом STOUT SPC 25/60-180) - для радиаторов до 24 кВт, для тёплого пола до 12 кВт", price: 25240, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
        { id: "SDG-0007-002501", name: "Группа насосная DN25 (3-х ход. приводной смеситель) - для радиаторов до 24 кВт, для тёплого пола до 12 кВт", price: 25240, rommer: { id: "RDG-1003-002501", name: "Группа насосная DN25 (под сервопривод) - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 11496, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-02" },
        { id: "SDG-0007-002504", name: "Группа насосная DN25 (3-х ход. приводной смеситель, с насосом STOUT SPC 25/60-180) - для радиаторов до 24 кВт, для тёплого пола до 12 кВт", price: 25240, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
        { id: "RDG-1002-012501", name: "Насосная группа с термостатическим смесительным клапаном (35-60°С) 1\", без насоса, левая - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 12333, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RDG-1003-012501", name: "Насосная группа с 3-ходовым приводным смесителем 1\", без насоса, левая - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 12646, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RDG-1004-002501", name: "Насосная группа с 3-ходовым приводным смесителем 1\", без насоса, универсальная в теплоизоляции - для радиаторов до 23 кВт, для тёплого пола до 9 кВт", price: 12333, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-13" }
    ],
    groups_dn32: [
        { id: "SDG-0001-003201", name: "Группа насосная DN32 (Прямая), 1 1/4\" - для радиаторов до 34 кВт (с насосом на 2-й скорости — насос в комплект не входит, подбирается отдельно)", price: 28990, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0007-003201", name: "Группа насосная DN32 (3-х ход. приводной смеситель), 1 1/4\" - для радиаторов до 34 кВт, для тёплого пола до 17 кВт (с насосом на 2-й скорости — насос в комплект не входит, подбирается отдельно)", price: 44439, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Многофункциональный узел Askon МУ-25М — присоединение насосной группы DN25 (1")
    // к коллектору котельной. В смете считается ШТУКАМИ: по 2 шт. на группу — один узел
    // на подачу, второй на обратку (см. render, «2.4. Гидравлика котельной»).
    // Цена здесь тоже за штуку: в прайсе стоит 8 588 ₽ за фасовку из двух, то есть
    // 4 294 ₽ за узел, и сумма на группу от смены единицы не изменилась.
    //
    // Позиция сторонняя, как и L-кронштейн ASKON-83115: ни у STOUT, ни у ROMMER такого
    // узла нет, поэтому поля .rommer у неё не будет и в режиме «Аналог» она не меняется.
    // Цена розничная, с карточки ТЕРЕМ: в прайсе (price_index.json) этого артикула нет,
    // так что AutoPrice её не пересчитывает — обновлять руками.
    gbm_nodes: [
        { id: "ASKON-MU-25M", article: "МУ-25М", name: "Многофункциональный узел для быстрого монтажа", price: 4294, unit: "шт", brand: "Askon", availability: "in_stock", price_date: "2026-08-17" }
    ],
    // Насосные группы с пластинчатым теплообменником: разделяют первичный контур
    // (вода котельной) и вторичный, залитый другой средой. Отсюда и применение в
    // снеготаянии — уличный контур на гликоле нельзя смешивать с домом.
    //
    // Паспорта STOUT SDG-0038-хххх01 (ред. 4 от 04.09.2025) и ROMMER RDG-1038-XX2501
    // (2025) описывают одно и то же изделие: изготовитель у обоих Barberi
    // Rubinetterie (Италия), таблицы рабочих характеристик совпадают строка в строку.
    // Поэтому расчётные поля у STOUT и ROMMER одинаковые:
    //   maxFlow — предельный расход вторичного контура, м³/ч. При нём сопротивление
    //             вторички равно 50 кПа, и растёт оно квадратично: 50×(V/maxFlow)².
    //             Это и есть главный ограничитель — не поверхность, а насос.
    //   ua      — тепловая проводимость, кВт/К, на этом же расходе (мощность в режиме
    //             80-70/70-60 делённая на LMTD = 10 К). На меньшем расходе падает
    //             примерно как (V/maxFlow)^0,77 — проверено по трём режимам паспорта.
    //   minTemp — нижний предел рабочей среды +5 °C: уличному контуру нельзя дать
    //             остыть, дежурный подогрев обязателен.
    // Строку паспорта «водный раствор гликолей (до 30 %)» не используем: по
    // концентрации это опечатка — нержавеющий паяный теплообменник и латунь работают
    // на 50–60 %, которых требует уличный контур в России. Концентрацию считает
    // app.snowGlycolPercent() по точке кристаллизации: раствор обязан пережить зиму
    // при погашенном котле и отключённом электричестве, без дежурного подогрева.
    // Группа безопасности (предохранительный клапан на 3 бар, манометр, кран
    // заполнения и слива) входит в изделие — отдельно в смету не добавлять.
    //
    // Бренд переключается штатно, полем .rommer: без «Аналога» подбор идёт на STOUT,
    // а тумблер «АНАЛОГ» в шапке раздела «4.4 Снеготаяние» (и общий переключатель
    // бренда) переводит группу на ROMMER. И тумблер, и поштучная замена в таблице
    // открыты только тарифу ПРОФИ — см. toggleSectionAnalog и selectSwapAlternative.
    // Характеристики у обоих брендов одинаковые, поэтому расчёт от смены не меняется:
    // те же maxFlow и ua продублированы в .rommer, чтобы подбор работал с любой
    // стороны, откуда бы позиция ни пришла.
    //
    // Берём только исполнения ...01 — без насоса. Паспорт STOUT описывает ещё ряд
    // ...02 с насосом Grundfos UPSO 25-65 180 в комплекте (SDG-0038-182502 и т.д.),
    // и цены на них до сих пор приходят в прайсе, но эти группы сняты с производства:
    // в подбор не ставить и в таблицу замены не добавлять.
    heat_exchanger_groups: [
        { id: "SDG-0038-182501", name: "Группа насосная с теплообменником 18 пластин", price: 57239, plates: 18, maxFlow: 1.578, ua: 1.80, minTemp: 5, brand: "STOUT", rommer: { id: "RDG-1038-182501", name: "Группа насосная с теплообменником 18 пластин", price: 26521, plates: 18, maxFlow: 1.578, ua: 1.80, minTemp: 5, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-02" },
        { id: "SDG-0038-282501", name: "Группа насосная с теплообменником 28 пластин", price: 61498, plates: 28, maxFlow: 2.15, ua: 2.45, minTemp: 5, brand: "STOUT", rommer: { id: "RDG-1038-282501", name: "Группа насосная с теплообменником 28 пластин", price: 28682, plates: 28, maxFlow: 2.15, ua: 2.45, minTemp: 5, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-02" },
        { id: "SDG-0038-342501", name: "Группа насосная с теплообменником 34 пластины", price: 65652, plates: 34, maxFlow: 2.5, ua: 2.85, minTemp: 5, brand: "STOUT", rommer: { id: "RDG-1038-342501", name: "Группа насосная с теплообменником 34 пластины", price: 30879, plates: 34, maxFlow: 2.5, ua: 2.85, minTemp: 5, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-02" }
    ],
    // ─── Снеготаяние ─────────────────────────────────────────────────────────
    // Петли уличного контура вяжутся трубой PE-Xa 20x2.8 (rad_pipes_grey), а не
    // 16-й петлевой и не металлопластиком. Причины две: 20-я труба держит петлю
    // до 100 м при шаге 250 мм, а PE-Xa переживает замерзание теплоносителя —
    // металлопластик в этом месте расслаивается по алюминию.
    //
    // Подключение к коллектору — аксиальное (надвижная гильза), а не
    // компрессионный евроконус: под улицей соединение неразборное и подтянуть
    // его будет нечем. Гильза идёт в комплектации, а не опцией — без неё
    // соединение не собирается.
    snow_axial_20: [
        { id: "SFA-0034-002034", name: "Переходник с накидной гайкой (евроконус) 20xG3/4\" (аксиальный)", price: 563, brand: "STOUT", rommer: { id: "RFA-0034-002034", name: "Переходник с накидной гайкой (евроконус) 20xG3/4\"", price: 263, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0020-000020", name: "Монтажная гильза 20х2.8 (аксиальная)", price: 95, brand: "STOUT", rommer: { id: "RFA-0020-000020", name: "Монтажная гильза 20х2.8", price: 77, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Петля тонкостенной трубой 20х2.0 садится на тот же евроконус, а гильза у неё
    // своя: гильза обжимает трубу по стенке, и на 2,0 мм она другая.
    snow_sleeve_20x20: { id: "SFA-0020-002002", name: "Монтажная гильза 20х2.0 (аксиальная)", price: 113, brand: "STOUT", rommer: { id: "RFA-0020-002002", name: "Монтажная гильза 20х2.0", price: 101, brand: "ROMMER", availability: "on_order", price_date: "2026-08-11" }, availability: "on_order", price_date: "2026-08-11" },
    // Красная PE-Xa/EVOH 20х2.0 — вторая труба уличного контура и вариант по
    // умолчанию. Внутренний диаметр 16 мм против 14,4 у серой 20х2.8: потери в
    // петле ниже примерно на треть, метр дешевле, петля выходит длиннее и узлов
    // на объект нужно меньше. Плата — теплоносителя в контуре на 15 % больше и
    // стенка тоньше. Серая 20х2.8 никуда не делась и переключается в панели.
    snow_pipes_red: [
        { id: "SPX-0002-002020", name: "Труба PEX-a/EVOH красная 20x2.0 (100м)", len: 100, price: 183, brand: "STOUT", rommer: { id: "RPX-0002-002020", name: "Труба PEX-a 20x2.0", price: 109, brand: "ROMMER", availability: "on_order", price_date: "2026-08-11" }, availability: "on_order", price_date: "2026-08-11" }
    ],
    // Датчик осадков — единственная позиция раздела, которой нет ни у STOUT, ни у
    // ROMMER: в прайсе ТЕРЕМ ничего похожего не числится, поэтому позиция идёт
    // чужим брендом — как кабель и XPS.
    //
    // Контроллеру датчик отдаётся сухим контактом на «Вход термостата»: контур
    // переходит в режим «Термостат» и греет, пока контакт разомкнут. Своего
    // блока управления у датчика нет и не нужно — реле встроено.
    //
    // Питание 10–30 В постоянного тока, а НЕ 230 В: к датчику идёт низковольтная
    // линия от блока питания на DIN-рейке (ML13968 из boiler_automation, тот же,
    // что у блока расширения EX-77). Потребление 2,5 Вт — 0,5 Вт сам датчик плюс
    // 2 Вт подогрев контактной площадки, который топит на ней снег и не даёт
    // залепить детектор.
    //
    // Интерфейс RS-485 у датчика — Modbus RTU, к шине ZONT он отношения не имеет
    // и для подключения к контроллеру не используется: только диагностика и
    // настройка с ноутбука.
    //
    // РЕЛЕ ВРЕМЕНИ ОБЯЗАТЕЛЬНО, и вот почему (техдокументация Thermatic 3001,
    // ML.TD.STOUT.3001.01):
    //   1. Логика входа обратная. П. 7.9: «Отопительный контур запрашивает тепло
    //      от котла, когда клеммы термостата разомкнуты». У датчика выход NO —
    //      в покое разомкнут, при осадках замыкается. Напрямую получилось бы
    //      наоборот: без снега грели бы, а в снегопад выключались.
    //   2. Постпрогрева у контроллера нет. П. 5 «Выбег ЦН — время выбега насоса
    //      после выключения запроса тепла в контуре. Максимальное значение =
    //      120 сек». Площадку после снегопада надо досушивать часами, а не две
    //      минуты, иначе вода замерзает коркой.
    // Реле времени с задержкой на отключение и переключающим контактом решает
    // обе задачи разом: инвертирует сигнал и держит постпрогрев 2–8 часов.
    snow_auto: [
        { id: "EH-SNOWSENSOR-RS485-R1", name: "Датчик снега и дождя EH-SnowSensor-RS485-R1", price: 6378, unit: "шт", brand: "EasyHome", minTemp: -20, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SNOW-TIMER-RELAY", name: "Реле времени с задержкой отключения (до 10 ч), переключающий контакт, DIN", price: 2500, unit: "шт", brand: "—", availability: "in_stock", price_date: "2026-08-10" },
        { id: "CBL-MKESH-2X05-SNOWPWR", name: "Кабель МКЭШ 2×0,5 экран. — питание датчика осадков 12 В", price: 75, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-10" },
        { id: "CBL-MKESH-2X05-SNOW", name: "Кабель МКЭШ 2×0,5 экран. — сигнал датчика осадков на контроллер", price: 75, unit: "м", brand: "—", availability: "in_stock", price_date: "2026-08-10" }
    ],
    hydro_separators: [
        { id: "SDG-0015-004001", name: "Гидравлическая стрелка 3 м³/ч", price: 22082, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0015-004004", name: "Гидравлическая стрелка 4 м³/ч", price: 32958, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0015-004002", name: "Гидравлическая стрелка 3 м³/ч", price: 36684, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0015-004003", name: "Гидравлическая стрелка 5 м³/ч", price: 41842, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0015-005001", name: "Гидравлическая стрелка 8 м³/ч", price: 68067, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RDG-1015-004003", name: "Гидравлическая стрелка с накидными гайками 1 1/2\", 3,0 м³/ч", price: 18394, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    collectors_dn20: [
        { id: "SDG-0016-002502", name: "Стальной распределительный коллектор DN20 (2 насосных группы)", price: 26395, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-002503", name: "Стальной распределительный коллектор DN20 (3 насосных группы)", price: 29180, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    collectors_dn25: [
        { id: "SDG-0016-004002", name: "Стальной распределительный коллектор DN25 (2 насосных группы)", price: 28495, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-004003", name: "Стальной распределительный коллектор DN25 (3 насосных группы)", price: 31501, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-004004", name: "Стальной распределительный коллектор DN25 (4 насосных группы)", price: 39918, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-004005", name: "Стальной распределительный коллектор DN25 (5 насосных групп)", price: 48695, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-004006", name: "Стальной распределительный коллектор DN25 (6 насосных групп)", price: 62139, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0017-004023", name: "Стальной распределительный коллектор DN25 (2(3) насосных группы)", price: 28982, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0017-004035", name: "Стальной распределительный коллектор DN25 (3(5) насосных группы)", price: 40118, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    collectors_dn32: [
        { id: "SDG-0016-005002", name: "Стальной распределительный коллектор DN32 (2 насосных группы)", price: 79985, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-005003", name: "Стальной распределительный коллектор DN32 (3 насосных группы)", price: 92133, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-005004", name: "Стальной распределительный коллектор DN32 (4 насосных группы)", price: 122255, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-005005", name: "Стальной распределительный коллектор DN32 (5 насосных групп)", price: 143643, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-005006", name: "Стальной распределительный коллектор DN32 (6 насосных групп)", price: 186672, brand: "STOUT", availability: "on_order", price_date: "2026-08-10" }
    ],
    hydro_dn20: [
        { id: "SDG-0018-002502", name: "Коллектор-гидрострелка DN20 (2 конт)", price: 50005, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0018-002503", name: "Коллектор-гидрострелка DN20 (3 конт)", price: 57133, availability: "in_stock", price_date: "2026-08-10" }
    ],
    hydro_dn25: [
        { id: "SDG-0018-004002", name: "Коллектор-гидрострелка DN25 (2 конт)", price: 56826, rommer: [{ id: "RDG-0017-004002", name: "Стальной распределительный коллектор 2 контура", price: 11340, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, { id: "RDG-0015-004002", name: "Гидравлическая стрелка с накидными гайками 1 1/4″", price: 7329, brand: "ROMMER", rommer: { id: "RDG-1015-004003", name: "Гидравлическая стрелка 1 1/2\", 3,0 м³/ч", price: 16722, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-06-27" }], availability: "in_stock", price_date: "2026-06-27" },
        { id: "SDG-0018-004003", name: "Коллектор-гидрострелка DN25 (3 конт)", price: 64925, rommer: [{ id: "RDG-0017-004003", name: "Стальной распределительный коллектор 3 контура", price: 14002, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, { id: "RDG-0015-004002", name: "Гидравлическая стрелка с накидными гайками 1 1/4″", price: 7329, brand: "ROMMER", rommer: { id: "RDG-1015-004003", name: "Гидравлическая стрелка 1 1/2\", 3,0 м³/ч", price: 16722, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-06-27" }], availability: "in_stock", price_date: "2026-06-27" },
        { id: "RDG-1015-004003", name: "Гидравлическая стрелка 1 1/2\", 3,0 м³/ч", price: 18394, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    pumps_dn20: [
        { id: "RCP-0002-1560130", brand: "ROMMER", name: "Насос 15/60-130", price: 3532, availability: "in_stock", price_date: "2026-08-10" }
    ],
    pumps_dn25: [
        { id: "SPC-0011-2560180", name: "Насос циркуляционный 25/60-180", price: 11669, type: "default", desc: "Базовый насос STOUT 25/60-180.", rommer: { id: "RCP-0004-2560180", name: "Насос циркуляционный PROFI 25/60-180", price: 4909, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPC-0010-2560180", name: "Насос циркуляционный 25/60-180 (Std)", price: 11669, type: "std", desc: "Классический 3-х скоростной насос.", rommer: { id: "RCP-0004-2560180", name: "Насос циркуляционный PROFI 25/60-180", price: 4909, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPC-0002-2560180", name: "Насос циркуляционный Mini 25/60-180", price: 21680, type: "mini", desc: "Энергоэффективный (частотный).", rommer: { id: "RCP-0030-2560180", name: "Насос частотный EVO 25/60-180", price: 8930, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPC-0003-2560180", name: "Насос циркуляционный Mini Pro 25/60-180", price: 30622, type: "pro", desc: "Премиум Smart (дисплей, авто-адаптация).", rommer: { id: "RCP-0030-2560180", name: "Насос частотный EVO 25/60-180", price: 8930, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" }
    ],
    // Тот же типоразмерный ряд, что pumps_dn25, но на 8 метров напора. Отдельным
    // массивом, а не строками в pumps_dn25: по этому массиву подбираются насосы
    // всей котельной поиском по `type`, и лишние строки сломали бы подбор.
    // Берётся только там, где расчёт показал, что 25/60 не проходит по напору —
    // сейчас это вторичный контур снеготаяния (SNOW_PUMPS в app.js).
    // Наличие проставлено «под заказ» осознанно: позиции внесены руками по
    // прайсу, наличие никто не подтверждал — AutoPrice уточнит его сам.
    pumps_dn25_80: [
        { id: "SPC-0011-2580180", name: "Насос циркуляционный 25/80-180", price: 18613, type: "default", desc: "Базовый насос STOUT 25/80-180.", rommer: { id: "RCP-0004-2580180", name: "Насос циркуляционный PROFI RATE 25/80-180", price: 9686, brand: "ROMMER", availability: "on_order", price_date: "2026-08-11" }, availability: "on_order", price_date: "2026-08-11" },
        { id: "SPC-0010-2580180", name: "Насос циркуляционный 25/80-180 (Std)", price: 29171, type: "std", desc: "Классический 3-х скоростной насос.", rommer: { id: "RCP-0004-2580180", name: "Насос циркуляционный PROFI RATE 25/80-180", price: 9686, brand: "ROMMER", availability: "on_order", price_date: "2026-08-11" }, availability: "on_order", price_date: "2026-08-11" },
        { id: "SPC-0002-2580180", name: "Насос циркуляционный Mini 25/80-180", price: 24524, type: "mini", desc: "Энергоэффективный (частотный).", rommer: { id: "RCP-0031-2580180", name: "Насос частотный EVO 25/80-180", price: 20670, brand: "ROMMER", availability: "on_order", price_date: "2026-08-11" }, availability: "on_order", price_date: "2026-08-11" },
        { id: "SPC-0003-2580180", name: "Насос циркуляционный Mini Pro 25/80-180", price: 34415, type: "pro", desc: "Премиум Smart (дисплей, авто-адаптация).", rommer: { id: "RCP-0031-2580180", name: "Насос частотный EVO 25/80-180", price: 20670, brand: "ROMMER", availability: "on_order", price_date: "2026-08-11" }, availability: "on_order", price_date: "2026-08-11" }
    ],
    rommer_pumps: [
        { id: "RCP-0004-2560180", name: "Насос циркуляционный PROFI 25/60-180", price: 4868, brand: "ROMMER", desc: "Бюджетный насос серии PROFI.", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCP-0004-2560130", name: "Насос циркуляционный PROFI 25/60-130", price: 5006, brand: "ROMMER", desc: "Бюджетный насос серии PROFI.", availability: "in_stock", price_date: "2026-08-10" }
    ],
    pumps_mix: [
        { id: "SPC-0011-2560130", brand: "STOUT", name: "Насос 25/60-130", price: 12666, rommer: { id: "RCP-0004-2560130", name: "Насос циркуляционный PROFI 25/60-130", price: 5048, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" }
    ],
    hydro_arrow: { id: "SDG-0015-004001", name: "Гидравлическая стрелка 3 м³/ч", price: 22082, rommer: { id: "RDG-0015-004002", name: "Гидравлическая стрелка с накидными гайками 1 1/4″", price: 7329, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
    servo_rotary_sensor: { id: "SVM-0025-230017", name: "Сервопривод с датчиком", price: 40903, rommer: { id: "RVM-0015-230017", name: "Сервопривод с датчиком", price: 15810, brand: "ROMMER" }, availability: "in_stock", price_date: "2026-08-10" },
    servo_rotary_std: { id: "SVM-0005-230001", name: "Сервопривод 230V", price: 16079, rommer: { id: "RVM-0005-230002", name: "Сервопривод 230V, 120s, 10Nm", price: 7287, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" },
    hydro_modular_dn20: [
        { id: "SDG-0016-002502", name: "Стальной распр. коллектор 2 контура DN20", price: 26395, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SDG-0016-002503", name: "Стальной распр. коллектор 3 контура DN20", price: 29180, availability: "in_stock", price_date: "2026-08-10" }
    ],
    mats: [
        { id: "SMF-0001-110802", name: "Мат с бобышками STOUT", area: 0.88, price: 1041, brand: "STOUT", rommer: { id: "RMF-0001-126047", name: "Мат с бобышками ROMMER", area: 0.72, price: 585, brand: "ROMMER", availability: "on_order", price_date: "2026-08-12" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "RMF-0001-126047", name: "Мат с бобышками ROMMER", area: 0.72, price: 585, brand: "ROMMER", availability: "on_order", price_date: "2026-08-12" }
    ],
    xps_kit: [
        { id: "418318", name: "XPS Технониколь Carbon Eco 50мм (1180х580)", area: 0.6844, price: 299, brand: "Technonicol", noCheapen: true },
        { id: "138605", name: "Дюбель тарельчатый 10х100 (Уп. 100 шт)", price: 936, brand: "Tech-Krep" },
        { id: "SMF-0005-251620", name: "Скобы якорные для такера (Кассета 25 шт)", price: 109, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "160028", name: "Лента монтажная X-Glass ТПЛ армированная 50х50м", price: 236, brand: "X-Glass" }
    ],
    // Демпферная (краевая) лента по периметру помещений тёплого пола: принимает
    // тепловое расширение стяжки и развязывает её со стенами. Нужна и под матом
    // с бобышками, и под XPS — от основания не зависит.
    // Типоразмер по пирогу пола: 150х10 — стандарт под стяжку 60–80 мм (лента
    // должна быть выше стяжки, иначе её нечем подрезать), 100х8 — для тонких и
    // полусухих стяжек. Это выбор монтажника, а не удешевление, поэтому в init
    // у пары стоит noCheapenAlts.
    damper_tape: [
        { id: "SMF-0002-151025", name: "Лента демпферная с фартуком 150х10 (25 м)", len: 25, unit: "рул.", price: 1986, brand: "STOUT", availability: "in_stock", price_date: "2026-08-15" },
        { id: "SMF-0002-100825", name: "Лента демпферная с фартуком 100х8 (25 м)", len: 25, unit: "рул.", price: 1331, brand: "STOUT", availability: "in_stock", price_date: "2026-08-15" }
    ],
    american_34: { id: "SFT-0041-000034", name: "Разъемное соед. американка ВН 3/4\"", price: 597, availability: "in_stock", price_date: "2026-08-10" },
    ball_valve_34: { id: "SVB-0004-200020", name: "Кран шаровой ВР/НР, 3/4\"", price: 1167, rommer: { id: "RBV-0004-2210220", name: "Кран шаровой ВР/НР бабочка 3/4\"", price: 497, brand: "ROMMER", availability: "on_order", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-08-10" },
    check_valve_34: { id: "SVC-0011-000020", name: "Клапан обратный пружинный 3/4\"", price: 1547, rommer: { id: "RVC-0001-000020", name: "Клапан обратный 3/4\"", price: 535, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-06" },
    rommer_check_valve_34: { id: "RVC-0001-000020", name: "Клапан обратный 3/4\"", price: 530, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    // STOUT SFW-0072-000020 снят с производства: из подбора и из списка замен убран,
    // по умолчанию ставим аналогичный ROMMER.
    filter_mag: { id: "RFW-0080-256620", name: "Фильтр-шламоотделитель магнитный 3/4\"", price: 2598, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-29" },
    filter_mag_alts: [
        { id: "RFW-0081-000820", name: "Сепаратор шлама поворотный ВР 3/4\"",      price: 6317,  brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RFW-0081-000825", name: "Сепаратор шлама поворотный ВР 1\"",         price: 6800,  brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RFW-0081-000832", name: "Сепаратор шлама поворотный ВР 1 1/4\"",     price: 7600,  brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RFW-0081-002920", name: "Сепаратор шлама с щётками поворотный ВР 3/4\"",   price: 6628,  brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RFW-0081-002925", name: "Сепаратор шлама с щётками поворотный ВР 1\"",     price: 7489,  brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10", qtyRatio: 0.5 },
        { id: "RFW-0081-002932", name: "Сепаратор шлама с щётками поворотный ВР 1 1/4\"", price: 8237,  brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10", qtyRatio: 0.5 },
    ],
    // Сепаратор воздуха на ПОДАЧЕ. Не дублирует filter_mag: тот стоит на обратке перед
    // котлом и ловит уже осевшую механику магнитом, а растворённый воздух не берёт вовсе.
    // Микропузырьки выделяются в самой горячей точке контура — сразу за котлом на подаче,
    // там растворимость газа минимальна. Поплавковый автовоздушник в этой точке бесполезен:
    // при скорости 0,6–1,2 м/с пузырёк не успевает всплыть в поплавковую камеру, его надо
    // сначала укрупнить на сетчатой насадке — этим сепаратор и отличается.
    // Позиция одна на систему, а не на котёл (как фильтр): подача к стрелке общая, и в
    // каскаде второй сепаратор ставить некуда и незачем.
    // Типоразмер подбирается НЕ по норме на трубопровод. 1,2 м/с (СП 60.13330.2020) —
    // это предел по шуму и износу, а сепарации нужна другая скорость: пузырёк должен
    // успеть всплыть на сетчатую насадку, пока проходит корпус. Рабочий предел здесь
    // 0,8 м/с, и на нём сепаратор оказывается на типоразмер БОЛЬШЕ магистрали — так его
    // и подбирают. Отсюда пороги (Δt=20 °C, G = Q/23,26; v = G/3600/S):
    //   3/4" (внутр. 20 мм)   → 0,90 м³/ч → 21 кВт
    //   1"   (внутр. 26 мм)   → 1,53 м³/ч → 36 кВт
    //   1¼"  (внутр. 32 мм)   → 2,32 м³/ч → 54 кВт
    // autoPick: false у 1¼" — переходника с пресс-соединения 22/28 на наружную резьбу
    // 1¼" в линейке нержавейки нет (максимум 28х1"), собрать присоединение нечем.
    // В подборе он поэтому не участвует и остаётся только ручной заменой: выше 36 кВт
    // берём 1" и миримся со скоростью до 1,2 м/с — это по-прежнему в норме трубопровода.
    air_separators: [
        { id: "RFW-0070-259520", name: "Сепаратор воздуха поворотный ВР 3/4\"",     price: 6479, size: "3/4\"",   maxKw: 21, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-13" },
        { id: "RFW-0070-259525", name: "Сепаратор воздуха поворотный ВР 1\"",       price: 6742, size: "1\"",     maxKw: 36, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-13" },
        { id: "RFW-0070-259532", name: "Сепаратор воздуха поворотный ВР 1 1/4\"",   price: 7048, size: "1 1/4\"", maxKw: 54, autoPick: false, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-13" }
    ],
    // Автоматический воздухоотводчик 1/2" на узел гидроразделения. Резьба НАРУЖНАЯ:
    // у коллектора со встроенным разделителем SDG-0018 патрубки G 1/2" (ВР) — паспорт
    // «Коллектор стальной распределительный», ред. 3 от 30.03.2023, п. 4.3.5/4.3.6.
    // Сам воздухоотводчик и сливной кран в комплект НЕ входят: в разделе 4.2
    // «Принадлежности» перечислены только соединительный фитинг SDG-0019-000001,
    // заглушка SDG-0019-000002 и кронштейны SDG-0019-000003.
    // У обычного коллектора SDG-0016 таких патрубков нет вовсе, и ставить его
    // вертикально паспорт (п. 5) прямо запрещает — воздух там снимать нечем и незачем,
    // поэтому комплект вешается на узел гидроразделения, а не на каждый коллектор.
    // По умолчанию STOUT, ROMMER — в .rommer, как аналог под кнопку замены.
    // Цена STOUT посчитана по коэффициенту 0,889 (как у группы «STOUT Шаровые краны»):
    // в прайсе воздухоотводчики лежат в группе «STOUT Арматура», а из неё в каталоге
    // до сих пор не было ни одной позиции, и точный коэффициент вывести не из чего.
    // Первое же обновление AutoPrice перепишет цену фактической.
    air_vent_12: {
        id: "SVS-1011-000015", name: "Воздухоотводчик автоматический 1/2\" НР (вертикальный выпуск)", price: 816, brand: "STOUT", availability: "in_stock", price_date: "2026-08-14",
        rommer: { id: "RVA-0001-000015", name: "Воздухоотводчик автоматический 1/2\" НР (вертикальный выпуск)", price: 459, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" }
    },
    // Отсекающий обратный клапан 1/2" под автоматический воздухоотводчик. Ставится между
    // ним и узлом: при снятии поплавковой головки клапан закрывается сам, и её меняют,
    // не сливая контур. В комплект поставки воздухоотводчика не входит.
    // Цена — из price_index (282,74 ₽) по тому же коэффициенту 0,889 группы «STOUT
    // Арматура», по которому посчитан воздухоотводчик выше. availability не проверено —
    // ставим «под заказ», первый прогон AutoPrice перепишет фактическим.
    air_vent_check_12: { id: "SVC-1003-000015", name: "Клапан отсекающий обратный 1/2\"", price: 251, brand: "STOUT", availability: "on_order", price_date: "2026-08-17" },
    air_vent_12_alts: [
        { id: "SVS-1013-000015", name: "Воздухоотводчик автоматический 1/2\" НР (боковой выпуск)",  price: 917, brand: "STOUT",  availability: "in_stock", price_date: "2026-08-14" },
        { id: "RVA-0003-000015", name: "Воздухоотводчик автоматический 1/2\" НР (угловое подключение)", price: 517, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" },
        { id: "RVA-0002-000015", name: "Воздухоотводчик автоматический 1/2\" НР (боковой выпуск)",       price: 450, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" }
    ],
    // Присоединение котлового контура к узлу гидроразделения. Резьба патрубков —
    // по паспортам: у коллекторов DN25 и у гидрострелки SDG-0015-004001 это
    // G 1 1/2" (НР) («Коллектор стальной распределительный», ред. 3 от 30.03.2023,
    // п. 4.3.2/4.3.6; «Гидравлический разделитель», ред. 3 от 17.05.2021, п. 4.1),
    // у коллекторов DN20 — G 1" (НР) (п. 4.3.1/4.3.5).
    // Переход двухступенчатый: прямого пресс-фитинга с 22/28 на 1 1/2" в линейке
    // нержавейки нет (максимум 28х1"), поэтому на патрубок идёт латунная муфта с
    // внутренней резьбой, а в неё — пресс-переходник с наружной резьбой 1".
    // Стыковку самой стрелки с коллектором ничем не добиваем: у стрелки сторона Т2
    // это накидная гайка G 1 1/2" (ВР), межосевое расстояние у обоих изделий 125 мм —
    // она садится прямо на нижние патрубки коллектора.
    hydro_tie_coupling_112: { id: "SFT-0005-001121", name: "Муфта переходная ВР 1 1/2\"х1\"", price: 1037, brand: "STOUT", availability: "in_stock", price_date: "2026-08-14" },
    hydro_tie_coupling_1: { id: "SFT-0005-000011", name: "Муфта ВР 1\"", price: 477, brand: "STOUT", availability: "in_stock", price_date: "2026-08-14" },
    // Контрольный термометр на третий штуцер G 1/2" гидроразделителя. Паспорт
    // «Гидравлический разделитель» (ред. 3 от 17.05.2021, п. 3.1) перечисляет три
    // штуцера — под воздухоотводчик, дренажный кран и контрольный термометр; все
    // три уходят с завода под заглушками.
    // Осевой, а не радиальный: штуцер торчит из корпуса вбок, и у осевого циферблат
    // смотрит на монтажника, а не в стену. Он же вдвое дешевле радиального.
    // Гильза 50 мм — по корпусу разделителя (Ø 180–280 мм у вертикальных исполнений).
    // Коэффициент цены 0,9002 — по манометру SIM-1010-500608, единственной позиции
    // группы «STOUT КИП», которая в каталоге уже была.
    hydro_thermometer: {
        id: "SIM-1001-635015", name: "Термометр осевой Dn63, гильза 50 мм, 1/2\" (для узла гидроразделения)", price: 690, brand: "STOUT", availability: "in_stock", price_date: "2026-08-14",
        rommer: { id: "RIM-0001-635015", name: "Термометр с погружной гильзой Dn63, 50 мм, 1/2\"", price: 536, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" }
    },
    hydro_thermometer_alts: [
        { id: "SIM-1001-637515", name: "Термометр осевой Dn63, гильза 75 мм, 1/2\"",    price: 786,  brand: "STOUT",  availability: "in_stock", price_date: "2026-08-14" },
        { id: "SIM-1002-635015", name: "Термометр радиальный Dn63, гильза 50 мм, 1/2\"", price: 1210, brand: "STOUT",  availability: "in_stock", price_date: "2026-08-14" },
        { id: "RIM-0001-637515", name: "Термометр с погружной гильзой Dn63, 75 мм, 1/2\"",         price: 611,  brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" }
    ],
    // Термостатический смесительный клапан на выходе ГВС из бойлера (антиожоговый).
    // Бак держат на 60–65 °C: при меньшей температуре в накопителе размножается
    // легионелла. На разбор такая вода не годится — при 60 °C ожог второй степени
    // наступает примерно за 5 секунд, при 65 °C быстрее. Клапан подмешивает холодную
    // из В1 и держит на выходе 45–50 °C, при этом запас бака считается по 60 °C,
    // то есть полезной горячей воды получается больше, чем при нагреве до 45 °C.
    // Диапазон регулировки 35–60 °C: у линейки 20–43 °C потолок ниже рабочей уставки.
    // Резьба наружная — клапан вкручивается прямо в шаровой кран ВР/ВР выхода Т3.
    // Типоразмер по расходу при допустимом перепаде 0,3 бар (Q = Kv·√0,3):
    //   Kv 1,6 (3/4")  → 0,88 м³/ч
    //   Kv 2,5 (1")    → 1,37 м³/ч
    //   Kv 3,5 (1 1/4") → 1,92 м³/ч
    dhw_mix_valves: [
        {
            id: "SVM-0120-166020", name: "Клапан термостатический смесительный ГВС 3/4\" НР, 35–60 °C, Kv 1,6", price: 9361, kv: 1.6, size: "3/4\"", brand: "STOUT", availability: "in_stock", price_date: "2026-08-14",
            rommer: { id: "RVM-0122-166020", name: "Клапан термостатический смесительный ГВС 3/4\" НР, 35–60 °C, Kv 1,6", price: 3493, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" }
        },
        {
            id: "SVM-0120-256025", name: "Клапан термостатический смесительный ГВС 1\" НР, 35–60 °C, Kv 2,5", price: 10114, kv: 2.5, size: "1\"", brand: "STOUT", availability: "in_stock", price_date: "2026-08-14",
            rommer: { id: "RVM-0232-256025", name: "Клапан термостатический смесительный ГВС 1\" НР, 35–60 °C, Kv 2,5", price: 3929, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" }
        },
        // 1 1/4" — только STOUT, у ROMMER этого Kv в линейке нет. Диапазон у него
        // 30–65 °C (исполнение с центральным смешиванием), уставка 45–50 °C в него входит.
        { id: "SVM-0125-356532", name: "Клапан термостатический смесительный ГВС 1 1/4\" НР, 30–65 °C, Kv 3,5", price: 14244, kv: 3.5, size: "1 1/4\"", brand: "STOUT", availability: "in_stock", price_date: "2026-08-14" }
    ],
    // Теплоизоляция трубопроводов котельной. Подбирается по ВНУТРЕННЕМУ диаметру
    // трубки — он должен совпадать с наружным диаметром трубы, иначе изоляция либо
    // не налезет, либо будет болтаться и работать вполсилы.
    //   нержавейка 22 → трубка 22/6      нержавейка 28 → трубка 28/6
    //   PP-RCT 32     → трубка 35/9      PP-RCT 40     → трубка 42/9
    // У ROMMER линейка ПРОТЕКТ ПРО заканчивается на 28/6, поэтому под PPR-диаметры
    // берётся K-FLEX ST 9 мм — там ближайшие типоразмеры 35 и 42.
    // Красная на подачу, синяя на обратку — как в разводке отопления.
    boiler_insulation: {
        22: { red: { id: "RIC-0001-220602", name: "Трубка ПРОТЕКТ ПРО 22/6, 2м (красная)", dn: 22, thick: 6, len: 2, price: 29, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" },
             blue: { id: "RIC-0002-220602", name: "Трубка ПРОТЕКТ ПРО 22/6, 2м (синяя)",   dn: 22, thick: 6, len: 2, price: 29, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" } },
        28: { red: { id: "RIC-0001-280602", name: "Трубка ПРОТЕКТ ПРО 28/6, 2м (красная)", dn: 28, thick: 6, len: 2, price: 36, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" },
             blue: { id: "RIC-0002-280602", name: "Трубка ПРОТЕКТ ПРО 28/6, 2м (синяя)",   dn: 28, thick: 6, len: 2, price: 36, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-14" } },
        // K-FLEX цветовой разбивки не имеет — одна позиция на подачу и обратку.
        // Цена за трубку 2 м, поэтому unit «шт», а не «м», как у ПРОТЕКТ ПРО.
        35: { red: { id: "R09035215508", name: "Трубка K-FLEX ST 35/9, 2м", dn: 35, thick: 9, len: 2, price: 112, unit: "шт", brand: "K-FLEX", availability: "in_stock", price_date: "2026-08-14" } },
        42: { red: { id: "R09042215508", name: "Трубка K-FLEX ST 42/9, 2м", dn: 42, thick: 9, len: 2, price: 127, unit: "шт", brand: "K-FLEX", availability: "in_stock", price_date: "2026-08-14" } }
    },
    nipple_34: { id: "SFT-0003-003434", name: "Ниппель НН 3/4\"", price: 200, availability: "in_stock", price_date: "2026-08-10" },
    // Переходные муфты (проставки) между патрубками котла 1" и группой быстрого монтажа —
    // паспорт STOUT POLIS, п. 6.2, Рис.5.
    pump_union_1: { id: "SPC-0010-000025", name: "Присоединительный комплект G 1 1/2\" x Rp 1\"", price: 555, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    coolants: [
        { id: "WARME-HYDRO-20", brand: "WARME", name: "Hydro, 20л", vol: 20, price: 1017, type: "water", availability: "in_stock", price_date: "2026-07-12" },
        { id: "WARME-ECO30-20", brand: "WARME", name: "Eco 30, 20кг", vol: 19, price: 4770, type: "eco30", availability: "in_stock", price_date: "2026-07-12" },
        { id: "WARME-PRO65-20", brand: "WARME", name: "Eco Pro 65, 20кг", vol: 18, price: 6588, type: "pro65", availability: "in_stock", price_date: "2026-07-12" }
    ],
    well_pumps: [
        { id: "RPW-0012-350215", name: "Насос скважинный 2-44, Ду 75 мм, с кабелем", q_max: 2.7, h_max: 64, price: 12890, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-350221", name: "Насос скважинный 2-63, Ду 75 мм, с кабелем", q_max: 2.7, h_max: 89, price: 16348, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-370227", name: "Насос скважинный 2-81, Ду 75 мм, с кабелем", q_max: 2.7, h_max: 115, price: 22165, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-380239", name: "Насос скважинный 2-111, Ду 75 мм, с кабелем", q_max: 2.7, h_max: 166, price: 35369, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-350321", name: "Насос скважинный 3-51, Ду 75 мм, с кабелем", q_max: 3.9, h_max: 84, price: 18549, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-350326", name: "Насос скважинный 3-63, Ду 75 мм, с кабелем", q_max: 3.9, h_max: 104, price: 21665, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-370331", name: "Насос скважинный 3-77, Ду 75 мм, с кабелем", q_max: 3.9, h_max: 124, price: 32334, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-380337", name: "Насос скважинный 3-92, Ду 75 мм, с кабелем", q_max: 3.9, h_max: 148, price: 35369, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-0012-370428", name: "Насос скважинный 4-76, Ду 75 мм, с кабелем", q_max: 5.4, h_max: 115, price: 32602, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-1012-350270",  name: "Насос скважинный RHS 2-70, кабель 50 м",  q_max: 4.5, h_max: 83,  watt: 800,  price: 36475, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-1012-360295",  name: "Насос скважинный RHS 2-95, кабель 60 м",  q_max: 4.5, h_max: 108, watt: 1100, price: 46486, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-1012-3802135", name: "Насос скважинный RHS 2-135, кабель 80 м", q_max: 4.5, h_max: 152, watt: 1500, price: 74983, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-1012-330345",  name: "Насос скважинный RHS 3-45, кабель 30 м",  q_max: 7.9, h_max: 52,  watt: 800,  price: 32256, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-1012-350365",  name: "Насос скважинный RHS 3-65, кабель 50 м",  q_max: 7.9, h_max: 77,  watt: 1100, price: 41461, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-1012-360390",  name: "Насос скважинный RHS 3-90, кабель 60 м",  q_max: 7.9, h_max: 102, watt: 1500, price: 59488, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RPW-1012-3703110", name: "Насос скважинный RHS 3-110, кабель 70 м", q_max: 7.9, h_max: 128, watt: 2200, price: 81465, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    well_parts: [
        { id: "10011032", name: "Труба ПНД 32х3.0 питьевая (кратно 5м)", price: 112.4, brand: "CYKLON", unit: "м", availability: "in_stock", price_date: "2026-06-06" },
        { id: "75618", name: "Трос 4 мм нерж.сталь (кратно 10м)", price: 70, brand: "UNIPUMP", unit: "м", availability: "in_stock", price_date: "2026-06-06" },
        { id: "39023", name: "Зажим (хомут) для троса 4-5 мм", price: 36, brand: "UNIPUMP", unit: "шт" },
        { id: "83652", name: "Оголовок скважинный 133-152/32", price: 3828, brand: "UNIPUMP", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SVC-0011-000032", name: "Клапан обратный с металлическим седлом, 1 1/4\"", price: 3518, brand: "STOUT", unit: "шт", rommer: { id: "RVC-0001-000032", name: "Клапан обратный с метал. седлом 1 1/4\"", price: 1316, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-06" },
        { id: "53003214", name: "Муфта ПНД 32х1 1/4\" НР", price: 108, brand: "Политэк", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "31852", name: "Коуш для крепления троса до 5 мм", price: 21, brand: "UNIPUMP", unit: "шт" },
        { id: "STW-0001-000024", name: "Расширительный бак гидроаккумулятор 24 л (синий)", price: 3442, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0002-000050", name: "Гидроаккумулятор STOUT 50 л (для водоснабжения)", price: 9648, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0002-000080", name: "Гидроаккумулятор STOUT 80 л (для водоснабжения)", price: 12642, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0002-000100", name: "Гидроаккумулятор STOUT 100 л (для водоснабжения)", price: 17077, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STW-0002-000150", name: "Гидроаккумулятор STOUT 150 л (для водоснабжения)", price: 21957, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0001-003232", name: "Фитинг ПНД, Муфта соединительная равнопроходная 32x32", price: 1721, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0002-000321", name: "Фитинг ПНД, Переходник с наружной резьбой 32xR 1\"", price: 1100, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0002-032114", name: "Муфта ПНД 32х1 1/4\" НР (латунь)", price: 1297, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0002-040114", name: "Фитинг ПНД, Переходник с наружной резьбой 40xR 1 1/4\"", price: 1796, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0003-000321", name: "Фитинг ПНД, Переходник с внутренней резьбой 32xRp 1\"", price: 1151, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0003-040114", name: "Фитинг ПНД, Переходник с внутренней резьбой 40xRp 1\"", price: 1872, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0004-323232", name: "Фитинг ПНД, Тройник равнопроходный 32x32x32", price: 2860, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFH-0006-003232", name: "Фитинг ПНД, Угольник 90° 32x32", price: 2201, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    well_auto: [
        { id: "SCS-0001-000070", name: "Блок управления насосом SIRIO UNIVERSAL", price: 38236, brand: "STOUT", unit: "шт", rommer: { id: "RCS-0001-000063", name: "Устройство управления насосом EPC-12 auto", price: 5880, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SCS-0001-000063", name: "Устройство управления насосом BRIO-TOP", price: 16078, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SCS-0001-000064", name: "Устройство управления насосом BRIO", price: 5141, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCS-0001-000071", name: "Устройство управления насосом EPC-17", price: 0, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-07-01" },
        { id: "RCS-0001-000052", name: "Блок насосной автоматики EPC-2", price: 2654, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCS-0001-000064", name: "Устройство управления насосом EPC-4", price: 2285, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCS-0001-000055", name: "Блок насосной автоматики EPC-5", price: 2722, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    well_relays: [
        { id: "RCS-0001-000005", name: "Реле давления KRS-5, 1/4\"", price: 605, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCS-0001-000003", name: "Реле сухого хода KRS-6, 1/4\"", price: 655, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RCS-0001-000053", name: "Реле давления для водоснабжения со встроенным манометром KRS-7", price: 1159, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_pipes: [
        { id: "SPX-0001-001622", name: "Труба PEX-a 16x2.2 (серая)", price: 175, unit: "м", rommer: { id: "RPX-0001-001622", name: "Труба PEX-a 16x2.2", price: 86, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPX-0001-002028", name: "Труба PEX-a 20x2.8 (серая)", price: 262, unit: "м", rommer: { id: "RPX-0001-002028", name: "Труба PEX-a 20x2.8", price: 130, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPX-0001-002535", name: "Труба PEX-a 25x3.5 (серая)", price: 407, unit: "м", rommer: { id: "RPX-0001-002535", name: "Труба PEX-a 25x3.5", price: 210, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SPX-0001-003244", name: "Труба PEX-a 32x4.4 (серая)", price: 661, unit: "м", rommer: { id: "RPX-0001-003244", name: "Труба PEX-a 32x4.4", price: 357, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" }
    ],
    water_pipes_mp: [
        { id: "SPM-0002-001620", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 16x2.0", price: 175, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SPM-0002-002020", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 20x2.0", price: 175, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SPM-0002-002630", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 26x3.0", price: 175, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SPM-0002-003230", name: "Труба металлопластиковая PE-Xb/Al/PE-Xb 32x3.0", price: 644, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-07-12" }
    ],
    water_insulation: [
        { id: "EFXT018092SUPRK", name: "Теплоизоляция 18/9 (Красная)", price: 34, unit: "м", brand: "Energoflex" },
        { id: "EFXT018092SUPRS", name: "Теплоизоляция 18/9 (Синяя)", price: 34, unit: "м", brand: "Energoflex" }
    ],
    insulation_pro: [
        { id: "RIC-0001-180602", name: "Трубка ПРОТЕКТ ПРО 18/6, 2м (синяя)",  dn: 18, thick: 6, len: 2, pack: 184, price: 27, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RIC-0001-220602", name: "Трубка ПРОТЕКТ ПРО 22/6, 2м (синяя)",  dn: 22, thick: 6, len: 2, pack: 160, price: 29, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RIC-0001-280602", name: "Трубка ПРОТЕКТ ПРО 28/6, 2м (синяя)",  dn: 28, thick: 6, len: 2, pack: 120, price: 36, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RIC-0002-180602", name: "Трубка ПРОТЕКТ ПРО 18/6, 2м (красная)", dn: 18, thick: 6, len: 2, pack: 184, price: 27, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RIC-0002-220602", name: "Трубка ПРОТЕКТ ПРО 22/6, 2м (красная)", dn: 22, thick: 6, len: 2, pack: 160, price: 29, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RIC-0002-280602", name: "Трубка ПРОТЕКТ ПРО 28/6, 2м (красная)", dn: 28, thick: 6, len: 2, pack: 120, price: 36, unit: "м", brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_fittings: [
        { id: "SFA-0032-001612", name: "Водорозетка 16x1/2\" (тупиковая)", price: 865, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0040-001612", name: "Угольник проточный 16x1/2\" (Бронза)", price: 2838, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0039-002012", name: "Угольник проточный 20x1/2\" (проходная)", price: 2698, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0027-252525", name: "Кронштейн монтажный (75/150)", price: 895, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0035-100012", name: "Пробка с наружней резьбой (Синяя)", price: 28, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0035-200012", name: "Пробка с наружней резьбой (Красная)", price: 28, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0031-000016", name: "Фиксатор поворота 90° (14-18 мм)", price: 36, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0031-000120", name: "Фиксатор поворота 90° (20 мм)", price: 113, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMF-0003-028032", name: "Дюбель-крюк двойной", price: 7, availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_fittings_press_mp: [
        // Латунные пресс-фитинги STOUT для труб PE-Xb/Al/PE-Xb
        // Переходник с наружной резьбой
        { id: "SFP-0001-001216", name: "Переходник с наружной резьбой 1/2\"х16", price: 312, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0001-003416", name: "Переходник с наружной резьбой 3/4\"x16", price: 623, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0001-001220", name: "Переходник с наружной резьбой 1/2\"х20", price: 417, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0001-003420", name: "Переходник с наружной резьбой 3/4\"х20", price: 559, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0001-003426", name: "Переходник с наружной резьбой 3/4\"х26", price: 705, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0001-000126", name: "Переходник с наружной резьбой 1\"х26", price: 789, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0001-000132", name: "Переходник с наружной резьбой 1\"х32", price: 1144, availability: "in_stock", price_date: "2026-08-10" },
        // Переходник с внутренней резьбой
        { id: "SFP-0002-001216", name: "Переходник с внутренней резьбой 1/2\"х16", price: 476, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0002-001220", name: "Переходник с внутренней резьбой 1/2\"х20", price: 557, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0002-003420", name: "Переходник с внутренней резьбой 3/4\"х20", price: 664, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0002-003426", name: "Переходник с внутренней резьбой 3/4\"х26", price: 742, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0002-000126", name: "Переходник с внутренней резьбой 1\"х26", price: 858, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0002-000132", name: "Переходник с внутренней резьбой 1\"х32", price: 1232, availability: "in_stock", price_date: "2026-08-10" },
        // Муфта соединительная равнопроходная
        { id: "SFP-0003-001616", name: "Муфта соединительная равнопроходная 16х16", price: 564, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0003-002020", name: "Муфта соединительная равнопроходная 20х20", price: 657, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0003-002626", name: "Муфта соединительная равнопроходная 26х26", price: 1123, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0003-003232", name: "Муфта соединительная равнопроходная 32х32", price: 1657, availability: "in_stock", price_date: "2026-08-10" },
        // Муфта соединительная переходная
        { id: "SFP-0004-002016", name: "Муфта соединительная переходная 20х16", price: 817, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0004-002620", name: "Муфта соединительная переходная 26х20", price: 1089, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0004-003226", name: "Муфта соединительная переходная 32х26", price: 1513, availability: "in_stock", price_date: "2026-08-10" },
        // Тройник переходной
        { id: "SFP-0005-162016", name: "Тройник переходной 16x20x16", price: 1168, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-201616", name: "Тройник переходной 20х16х16", price: 1083, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-201620", name: "Тройник переходной 20х16х20", price: 1124, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-202016", name: "Тройник переходной 20х20х16", price: 1130, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-202620", name: "Тройник переходной 20х26х20", price: 1600, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-261620", name: "Тройник переходной 26х16х20", price: 1573, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-261626", name: "Тройник переходной 26х16х26", price: 1573, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-262016", name: "Тройник переходной 26х20х16", price: 1588, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-262020", name: "Тройник переходной 26х20х20", price: 1588, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-262026", name: "Тройник переходной 26х20х26", price: 1573, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-262616", name: "Тройник переходной 26х26х16", price: 1600, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-262620", name: "Тройник переходной 26х26х20", price: 1585, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-263226", name: "Тройник переходной 26х32х26", price: 2603, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-322026", name: "Тройник переходной 32х20х26", price: 2625, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-322032", name: "Тройник переходной 32х20х32", price: 2748, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-322626", name: "Тройник переходной 32х26х26", price: 2748, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-322632", name: "Тройник переходной 32х26х32", price: 2748, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0005-323226", name: "Тройник переходной 32x32x26", price: 2748, availability: "in_stock", price_date: "2026-08-10" },
        // Тройник равнопроходный
        { id: "SFP-0006-161616", name: "Тройник равнопроходный 16х16х16", price: 775, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0006-202020", name: "Тройник равнопроходный 20х20х20", price: 1132, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0006-262626", name: "Тройник равнопроходный 26х26х26", price: 1639, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0006-323232", name: "Тройник равнопроходный 32х32х32", price: 2796, availability: "in_stock", price_date: "2026-08-10" },
        // Тройник-переходник с внутренней резьбой
        { id: "SFP-0007-001216", name: "Тройник-переходник с внутренней резьбой 16х1/2\"х16", price: 983, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0007-001220", name: "Тройник-переходник с внутренней резьбой 20х1/2\"х20", price: 1159, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0007-003420", name: "Тройник-переходник с внутренней резьбой 20х3/4\"х20", price: 1333, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0007-003426", name: "Тройник-переходник с внутренней резьбой 26х3/4\"х26", price: 1636, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0007-000132", name: "Тройник-переходник с внутренней резьбой 32х1\"х32", price: 2666, availability: "in_stock", price_date: "2026-08-10" },
        // Тройник-переходник с наружной резьбой
        { id: "SFP-0008-161216", name: "Тройник-переходник с наружной резьбой 16х1/2\"х16", price: 983, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0008-201220", name: "Тройник-переходник с наружной резьбой 20х1/2\"х20", price: 1159, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0008-203420", name: "Тройник-переходник с наружной резьбой 20х3/4\"х20", price: 1333, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0008-263426", name: "Тройник-переходник с наружной резьбой 26х3/4\"х26", price: 1636, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0008-320132", name: "Тройник-переходник с наружной резьбой 32х1\"х32", price: 2687, availability: "in_stock", price_date: "2026-08-10" },
        // Угольник 90°
        { id: "SFP-0009-001616", name: "Угольник 90° 16х16", price: 645, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0009-002020", name: "Угольник 90° 20х20", price: 811, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0009-002626", name: "Угольник 90° 26х26", price: 1225, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0009-003232", name: "Угольник 90° 32х32", price: 1946, availability: "in_stock", price_date: "2026-08-10" },
        // Угольник-переходник с внутренней резьбой
        { id: "SFP-0010-001216", name: "Угольник-переходник с внутренней резьбой 1/2\"х16", price: 438, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0010-001220", name: "Угольник-переходник с внутренней резьбой 1/2\"х20", price: 669, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0010-003420", name: "Угольник-переходник с внутренней резьбой 3/4\"х20", price: 1053, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0010-003426", name: "Угольник-переходник с внутренней резьбой 3/4\"х26", price: 1144, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0010-000126", name: "Угольник-переходник с внутренней резьбой 1\"х26", price: 1477, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0010-000132", name: "Угольник-переходник с внутренней резьбой 1\"х32", price: 1727, availability: "in_stock", price_date: "2026-08-10" },
        // Угольник-переходник с наружной резьбой
        { id: "SFP-0011-001216", name: "Угольник-переходник с наружной резьбой 1/2\"х16", price: 463, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0011-001220", name: "Угольник-переходник с наружной резьбой 1/2\"х20", price: 673, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0011-003420", name: "Угольник-переходник с наружной резьбой 3/4\"х20", price: 1054, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0011-003426", name: "Угольник-переходник с наружной резьбой 3/4\"х26", price: 1105, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0011-000126", name: "Угольник-переходник с наружной резьбой 1\"х26", price: 1477, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0011-000132", name: "Угольник-переходник с наружной резьбой 1\"х32", price: 1727, availability: "in_stock", price_date: "2026-08-10" },
        // Угольник настенный с креплением удлиненный
        { id: "SFP-0012-001216", name: "Угольник настенный с креплением удлиненный 1/2\"х16", price: 825, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0012-001220", name: "Угольник настенный с креплением удлиненный 1/2\"х20", price: 1001, availability: "in_stock", price_date: "2026-08-10" },
        // Угольник настенный с креплением короткий
        { id: "SFP-0018-001216", name: "Угольник настенный с креплением короткий 1/2\"х16", price: 670, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0018-001220", name: "Угольник настенный с креплением короткий 1/2\"х20", price: 833, availability: "in_stock", price_date: "2026-08-10" },
        // Настенный комплект для смесителя
        { id: "SFP-0013-001216", name: "Настенный комплект для смесителя 1/2\"x16", price: 1661, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0013-001220", name: "Настенный комплект для смесителя 1/2\"x20", price: 1748, availability: "in_stock", price_date: "2026-08-10" },
        // Вентиль с хромированной ручкой
        { id: "SFP-0014-001616", name: "Вентиль с хромированной ручкой 16х16", price: 3660, availability: "on_order", price_date: "2026-08-10" },
        { id: "SFP-0014-002020", name: "Вентиль с хромированной ручкой 20х20", price: 3727, availability: "in_stock", price_date: "2026-08-10" },
        // Переходник с накидной гайкой
        { id: "SFP-0016-001216", name: "Переходник с накидной гайкой 1/2\"x16", price: 447, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0016-001220", name: "Переходник с накидной гайкой 1/2\"x20", price: 531, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0016-003416", name: "Переходник с накидной гайкой 3/4\"x16", price: 809, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0016-003420", name: "Переходник с накидной гайкой 3/4\"x20", price: 834, availability: "in_stock", price_date: "2026-08-10" },
        // Зажимная втулка
        { id: "SFP-0019-000016", name: "Зажимная втулка 16", price: 114, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0019-000017", name: "Зажимная втулка 20", price: 154, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0019-000018", name: "Зажимная втулка 26", price: 191, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFP-0019-000019", name: "Зажимная втулка 32", price: 372, availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_manifolds_cold: [
        { id: "SMB-6851-343402", name: "Коллектор 3/4\"х3/4\"х2 вых.", loops: 2, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 1962, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-343403", name: "Коллектор 3/4\"х3/4\"х3 вых.", loops: 3, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 2735, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-343404", name: "Коллектор 3/4\"х3/4\"х4 вых.", loops: 4, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 3686, availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_manifolds_hot: [
        { id: "SMB-6851-343402", name: "Коллектор 3/4\"х3/4\"х2 вых.", loops: 2, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 1962, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-343403", name: "Коллектор 3/4\"х3/4\"х3 вых.", loops: 3, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 2735, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-343404", name: "Коллектор 3/4\"х3/4\"х4 вых.", loops: 4, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 3686, availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_manifolds_recirc: [
        { id: "SMB-6851-343402", name: "Коллектор 3/4\"х3/4\"х2 вых.", loops: 2, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 1962, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-343403", name: "Коллектор 3/4\"х3/4\"х3 вых.", loops: 3, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 2735, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-343404", name: "Коллектор 3/4\"х3/4\"х4 вых.", loops: 4, inSize: "3/4", outSize: "3/4", connType: "ek", series: "shutoff", price: 3686, availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_manifolds_stout: [
        // Хромированные регулирующие, макс. 120°C / 16 бар
        { id: "SMB-6850-341202", name: "Коллектор хромированный, регулирующий, 3/4\"х1/2\"х2 вых.", price: 2569, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 2, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-341203", name: "Коллектор хромированный, регулирующий, 3/4\"х1/2\"х3 вых.", price: 3702, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 3, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-341204", name: "Коллектор хромированный, регулирующий, 3/4\"х1/2\"х4 вых.", price: 4854, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 4, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-011202", name: "Коллектор хромированный, регулирующий, 1\"х1/2\"х2 вых.", price: 2948, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 2, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-011203", name: "Коллектор хромированный, регулирующий, 1\"х1/2\"х3 вых.", price: 4105, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 3, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-011204", name: "Коллектор хромированный, регулирующий, 1\"х1/2\"х4 вых.", price: 5454, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 4, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6849-341202", name: "Коллектор хромированный, регулирующий, 3/4\"х1/2\"х2 вых.", price: 2569, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 2, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6849-341203", name: "Коллектор хромированный, регулирующий, 3/4\"х1/2\"х3 вых.", price: 3702, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 3, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6849-341204", name: "Коллектор хромированный, регулирующий, 3/4\"х1/2\"х4 вых.", price: 4854, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 4, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6849-011202", name: "Коллектор хромированный, регулирующий, 1\"х1/2\"х2 вых.", price: 2948, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 2, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6849-011203", name: "Коллектор хромированный, регулирующий, 1\"х1/2\"х3 вых.", price: 4105, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 3, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6849-011204", name: "Коллектор хромированный, регулирующий, 1\"х1/2\"х4 вых.", price: 5453, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 4, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-343402", name: "Коллектор хромированный, регулирующий, 3/4\"х3/4\"х2 вых.", price: 2723, brand: "STOUT", inSize: "3/4", outSize: "3/4", loops: 2, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-343403", name: "Коллектор хромированный, регулирующий, 3/4\"х3/4\"х3 вых.", price: 3891, brand: "STOUT", inSize: "3/4", outSize: "3/4", loops: 3, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-343404", name: "Коллектор хромированный, регулирующий, 3/4\"х3/4\"х4 вых.", price: 4954, brand: "STOUT", inSize: "3/4", outSize: "3/4", loops: 4, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-013402", name: "Коллектор хромированный, регулирующий, 1\"х3/4\"х2 вых.", price: 2983, brand: "STOUT", inSize: "1", outSize: "3/4", loops: 2, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-013403", name: "Коллектор хромированный, регулирующий, 1\"х3/4\"х3 вых.", price: 4169, brand: "STOUT", inSize: "1", outSize: "3/4", loops: 3, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6850-013404", name: "Коллектор хромированный, регулирующий, 1\"х3/4\"х4 вых.", price: 5511, brand: "STOUT", inSize: "1", outSize: "3/4", loops: 4, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        // Никелированные распределительные, макс. 120°C / 10 бар
        { id: "SMB-6851-013402", name: "Коллектор никелированный, 1\"х3/4\"х2 вых.", price: 2043, brand: "STOUT", inSize: "1", outSize: "3/4", loops: 2, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-013403", name: "Коллектор никелированный, 1\"х3/4\"х3 вых.", price: 2962, brand: "STOUT", inSize: "1", outSize: "3/4", loops: 3, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-013404", name: "Коллектор никелированный, 1\"х3/4\"х4 вых.", price: 3995, brand: "STOUT", inSize: "1", outSize: "3/4", loops: 4, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-341202", name: "Коллектор никелированный, 3/4\"х1/2\"х2 вых.", price: 1746, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 2, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-341203", name: "Коллектор никелированный, 3/4\"х1/2\"х3 вых.", price: 2522, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 3, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-341204", name: "Коллектор никелированный, 3/4\"х1/2\"х4 вых.", price: 3502, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 4, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-011202", name: "Коллектор никелированный, 1\"х1/2\"х2 вых.", price: 1982, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 2, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-011203", name: "Коллектор никелированный, 1\"х1/2\"х3 вых.", price: 2811, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 3, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6851-011204", name: "Коллектор никелированный, 1\"х1/2\"х4 вых.", price: 3722, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 4, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6852-341202", name: "Коллектор никелированный, 3/4\"х1/2\"х2 вых.", price: 1823, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 2, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6852-341203", name: "Коллектор никелированный, 3/4\"х1/2\"х3 вых.", price: 2552, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 3, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6852-341204", name: "Коллектор никелированный, 3/4\"х1/2\"х4 вых.", price: 3532, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 4, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6852-011202", name: "Коллектор никелированный, 1\"х1/2\"х2 вых.", price: 2028, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 2, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6852-011203", name: "Коллектор никелированный, 1\"х1/2\"х3 вых.", price: 2887, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 3, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6852-011204", name: "Коллектор никелированный, 1\"х1/2\"х4 вых.", price: 3799, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 4, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        // С шаровыми кранами, макс. 95°C / 10 бар
        { id: "SMB-6200-011202", name: "Коллектор никелированный с шаровыми кранами (красные ручки), 1\"/1/2\"х2 вых.", price: 1943, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 2, connType: "ball_red", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6200-011203", name: "Коллектор никелированный с шаровыми кранами (красные ручки), 1\"/1/2\"х3 вых.", price: 2706, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 3, connType: "ball_red", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6200-341202", name: "Коллектор никелированный с шаровыми кранами (красные ручки), 3/4\"/1/2\"х2 вых.", price: 1838, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 2, connType: "ball_red", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6200-341203", name: "Коллектор никелированный с шаровыми кранами (красные ручки), 3/4\"/1/2\"х3 вых.", price: 2563, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 3, connType: "ball_red", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6200-341204", name: "Коллектор никелированный с шаровыми кранами (красные ручки), 3/4\"/1/2\"х4 вых.", price: 3475, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 4, connType: "ball_red", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6201-011202", name: "Коллектор никелированный с шаровыми кранами (синие ручки), 1\"/1/2\"х2 вых.", price: 1943, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 2, connType: "ball_blue", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6201-011203", name: "Коллектор никелированный с шаровыми кранами (синие ручки), 1\"/1/2\"х3 вых.", price: 2706, brand: "STOUT", inSize: "1", outSize: "1/2", loops: 3, connType: "ball_blue", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6201-341202", name: "Коллектор никелированный с шаровыми кранами (синие ручки), 3/4\"/1/2\"х2 вых.", price: 1838, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 2, connType: "ball_blue", series: "ball", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SMB-6201-341203", name: "Коллектор никелированный с шаровыми кранами (синие ручки), 3/4\"/1/2\"х3 вых.", price: 2563, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 3, connType: "ball_blue", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "SMB-6201-341204", name: "Коллектор никелированный с шаровыми кранами (синие ручки), 3/4\"/1/2\"х4 вых.", price: 3475, brand: "STOUT", inSize: "3/4", outSize: "1/2", loops: 4, connType: "ball_blue", series: "ball", availability: "on_order", price_date: "2026-08-10" }
    ],
    water_manifolds_rommer: [
        // Хромированные, запорно-регулирующие клапаны, отводы 90°, макс. 120°C / 16 бар
        { id: "RMB-0001-341202", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х1/2\"х2 вых.", price: 1425, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 2, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0001-341203", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х1/2\"х3 вых.", price: 2025, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 3, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0001-341204", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х1/2\"х4 вых.", price: 2702, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 4, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0002-011202", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х1/2\"х2 вых.", price: 1741, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 2, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0002-011203", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х1/2\"х3 вых.", price: 2486, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 3, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0002-011204", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х1/2\"х4 вых.", price: 3232, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 4, connType: "compression", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0003-343402", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х3/4\"х2 вых.", price: 1477, brand: "ROMMER", inSize: "3/4", outSize: "3/4", loops: 2, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0003-343403", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х3/4\"х3 вых.", price: 2108, brand: "ROMMER", inSize: "3/4", outSize: "3/4", loops: 3, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0003-343404", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х3/4\"х4 вых.", price: 2823, brand: "ROMMER", inSize: "3/4", outSize: "3/4", loops: 4, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0004-013402", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х3/4\"х2 вых.", price: 1784, brand: "ROMMER", inSize: "1", outSize: "3/4", loops: 2, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0004-013403", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х3/4\"х3 вых.", price: 2629, brand: "ROMMER", inSize: "1", outSize: "3/4", loops: 3, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0004-013404", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х3/4\"х4 вых.", price: 3440, brand: "ROMMER", inSize: "1", outSize: "3/4", loops: 4, connType: "ek", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0005-341202", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х1/2\"х2 вых.", price: 1446, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 2, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0005-341203", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х1/2\"х3 вых.", price: 2057, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 3, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0005-341204", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 3/4\"х1/2\"х4 вых.", price: 2745, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 4, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0006-011202", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х1/2\"х2 вых.", price: 1760, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 2, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0006-011203", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х1/2\"х3 вых.", price: 2519, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 3, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0006-011204", name: "Коллектор хромированный, запорно-регулирующие клапаны, отводы 90°, 1\"х1/2\"х4 вых.", price: 3288, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 4, connType: "flat", series: "adjustable", availability: "in_stock", price_date: "2026-08-10" },
        // Запорные клапаны, отводы 135°, макс. 120°C / 10 бар
        { id: "RMB-0011-341202", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х1/2\"х2 вых.", price: 987, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 2, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0011-341203", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х1/2\"х3 вых.", price: 1411, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 3, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0011-341204", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х1/2\"х4 вых.", price: 1862, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 4, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0012-011202", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х1/2\"х2 вых.", price: 1156, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 2, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0012-011203", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х1/2\"х3 вых.", price: 1560, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 3, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0012-011204", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х1/2\"х4 вых.", price: 2015, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 4, connType: "compression", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0013-343402", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х3/4\"х2 вых.", price: 1068, brand: "ROMMER", inSize: "3/4", outSize: "3/4", loops: 2, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0013-343403", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х3/4\"х3 вых.", price: 1527, brand: "ROMMER", inSize: "3/4", outSize: "3/4", loops: 3, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0013-343404", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х3/4\"х4 вых.", price: 2016, brand: "ROMMER", inSize: "3/4", outSize: "3/4", loops: 4, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0014-013402", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х3/4\"х2 вых.", price: 1251, brand: "ROMMER", inSize: "1", outSize: "3/4", loops: 2, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0014-013403", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х3/4\"х3 вых.", price: 1688, brand: "ROMMER", inSize: "1", outSize: "3/4", loops: 3, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0014-013404", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х3/4\"х4 вых.", price: 2181, brand: "ROMMER", inSize: "1", outSize: "3/4", loops: 4, connType: "ek", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0015-341202", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х1/2\"х2 вых.", price: 1008, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 2, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0015-341203", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х1/2\"х3 вых.", price: 1457, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 3, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0015-341204", name: "Коллектор с запорными клапанами, отводы 135°, 3/4\"х1/2\"х4 вых.", price: 1926, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 4, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0016-011202", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х1/2\"х2 вых.", price: 1197, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 2, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0016-011203", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х1/2\"х3 вых.", price: 1617, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 3, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RMB-0016-011204", name: "Коллектор с запорными клапанами, отводы 135°, 1\"х1/2\"х4 вых.", price: 2087, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 4, connType: "flat", series: "shutoff", availability: "in_stock", price_date: "2026-08-10" },
        // С шаровыми кранами, макс. 95°C / 10 бар
        { id: "RMB-0007CF-341202", name: "Коллектор с шаровыми кранами, 3/4\"/1/2\"х2 вых.", price: 974, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 2, connType: "compression", series: "ball", availability: "in_stock", price_date: "2026-07-13" },
        { id: "RMB-0007CF-341203", name: "Коллектор с шаровыми кранами, 3/4\"/1/2\"х3 вых.", price: 1305, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 3, connType: "compression", series: "ball", availability: "in_stock", price_date: "2026-07-13" },
        { id: "RMB-0007CF-341204", name: "Коллектор с шаровыми кранами, 3/4\"/1/2\"х4 вых.", price: 1738, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 4, connType: "compression", series: "ball", availability: "in_stock", price_date: "2026-07-13" },
        { id: "RMB-0008CF-011202", name: "Коллектор с шаровыми кранами, 1\"/1/2\"х2 вых.", price: 1165, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 2, connType: "compression", series: "ball", availability: "in_stock", price_date: "2026-07-13" },
        { id: "RMB-0008CF-011203", name: "Коллектор с шаровыми кранами, 1\"/1/2\"х3 вых.", price: 1542, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 3, connType: "compression", series: "ball", availability: "in_stock", price_date: "2026-07-13" },
        { id: "RMB-0008CF-011204", name: "Коллектор с шаровыми кранами, 1\"/1/2\"х4 вых.", price: 2023, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 4, connType: "compression", series: "ball", availability: "in_stock", price_date: "2026-07-13" },
        { id: "RMB-0007-341202", name: "Коллектор с шаровыми кранами, 3/4\"/1/2\"х2 вых.", price: 979, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 2, connType: "flat", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "RMB-0007-341203", name: "Коллектор с шаровыми кранами, 3/4\"/1/2\"х3 вых.", price: 1312, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 3, connType: "flat", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "RMB-0007-341204", name: "Коллектор с шаровыми кранами, 3/4\"/1/2\"х4 вых.", price: 1747, brand: "ROMMER", inSize: "3/4", outSize: "1/2", loops: 4, connType: "flat", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "RMB-0008-011202", name: "Коллектор с шаровыми кранами, 1\"/1/2\"х2 вых.", price: 1171, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 2, connType: "flat", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "RMB-0008-011203", name: "Коллектор с шаровыми кранами, 1\"/1/2\"х3 вых.", price: 1550, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 3, connType: "flat", series: "ball", availability: "on_order", price_date: "2026-08-10" },
        { id: "RMB-0008-011204", name: "Коллектор с шаровыми кранами, 1\"/1/2\"х4 вых.", price: 2034, brand: "ROMMER", inSize: "1", outSize: "1/2", loops: 4, connType: "flat", series: "ball", availability: "on_order", price_date: "2026-08-10" }
    ],
    water_parts: [
        { id: "SFC-0020-001622", name: "Евроконус 16x2.2 (для коллектора)", price: 381, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFC-0020-002028", name: "Евроконус 20x2.8 (для коллектора)", price: 390, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0024-000034", name: "Заглушка коллектора 3/4\" (HP)", price: 158, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0038-300000", name: "Наклейки \"ВОДОСНАБЖЕНИЕ\"", price: 872, availability: "in_stock", price_date: "2026-08-15" },
        { id: "SFA-0035-100016", name: "Защитная втулка синяя 16мм", price: 56, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0035-200016", name: "Защитная втулка красная 16мм", price: 56, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFA-0020-000016", name: "Гильза монтажная 16 (аксиальная)", price: 109, brand: "STOUT", rommer: { id: "RFA-0020-000016", name: "Монтажная гильза 16", price: 70, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-27" },
        { id: "SFC-0020-002020", name: "Евроконус 20x2.0 (для коллектора)", price: 371, availability: "in_stock", price_date: "2026-08-10" }
    ],
    // Компенсатор гидроудара: 1/2" НР, 1–10 бар рабочее, пик до 50 бар, среда до 90 °C.
    // По паспорту ставится на распределительных коллекторах ХВС/ГВС либо возле точки
    // водоразбора; монтаж только вертикально вверх или горизонтально. Торец коллектора
    // 3/4" ВР (туда же идёт заглушка SFT-0024-000034), поэтому нужна футорка 3/4"НР х 1/2"ВР.
    water_hammer_arrestors: [
        { id: "SVS-1014-000015", name: "Компенсатор гидроудара 1/2\" НР, хром", price: 2582, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RVS-1001-000015", name: "Компенсатор гидроудара мембранный 1/2\" НР, никель", price: 1484, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-07" } },
        { id: "SFT-0029-003412", name: "Футорка 3/4\" x 1/2\"", price: 156, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    water_input_node: [
        { id: "SFT-0045-000034", name: "Сгон прямой 3/4\" ВР-НР", price: 583, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "VTr.136.N.0504", name: "Тройник косой для гильзы под погружной датчик температуры 3/4'' х 1/2''", price: 561, brand: "VALTEC", availability: "in_stock", price_date: "2026-07-12" },
        { id: "CBL 10-4", name: "Греющий кабель для водопровода, 4 м", price: 7829, brand: "SelfTec DW", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SFT-0029-000134", name: "Переходник ВР-НР 1\" х 3/4\"", price: 236, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "6395", name: "Пятивыводной штуцер", price: 836, brand: "Aquario", availability: "on_order", price_date: "2026-07-12" },
        { id: "SFT-0004-000134", name: "Ниппель 1\" х 3/4\" НР", price: 350, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVB-0004-200020", name: "Кран шаровой ВН-НР 3/4\"", price: 1167, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0001-2110320", name: "Кран шаровой ВР/ВР, ручка рычаг 3/4\"", price: 477, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SFT-0002-003420", name: "Удлинитель ВН/НР 3/4\" 20 мм", price: 401, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "100035512000", name: "Система защиты от протечки воды", price: 17990, brand: "Neptun", availability: "on_order", price_date: "2026-07-12" },
        { id: "SFT-0004-003434", name: "Ниппель 3/4\" НР", price: 207, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "VT.386.N.05", name: "Фильтр универсальный 3/4''", price: 7624, brand: "VALTEC", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SVC-0011-000020", name: "Клапан обратный 3/4’’ ВР", price: 1547, brand: "STOUT", rommer: { id: "RVC-0001-000020", name: "Клапан обратный 3/4\"", price: 535, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-06-06" },
        { id: "SFT-0020-000034", name: "Тройник 3/4\" ВР", price: 504, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0029-003412", name: "Футорка 3/4\" x 1/2\"", price: 156, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0029-001214", name: "Футорка 1/2\" x 1/4\"", price: 108, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SIM-1010-500608", name: "Манометр 6 бар, 1/4''", price: 307, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    outdoor_faucet: [
        { id: "SFT-0004-003434", name: "Ниппель 3/4\" НР", price: 207, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0002-003430", name: "Удлинитель ВН/ВР 3/4\" 30 мм", price: 501, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0020-000034", name: "Тройник 3/4\" ВР", price: 504, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVB-1007-200020", name: "Кран шаровой ВН-НР 3/4\"", price: 1556, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0001-2110320", name: "Кран шаровой ВР/ВР, ручка рычаг 3/4\"", price: 477, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SFT-0045-000034", name: "Сгон прямой 3/4\" ВР-НР", price: 583, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    outdoor_faucets: [
        { id: "RVFF-0001-1520150", name: "Кран незамерзающий, длина 150 мм", price: 2123, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520200", name: "Кран незамерзающий, длина 200 мм", price: 2251, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520250", name: "Кран незамерзающий, длина 250 мм", price: 2386, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520300", name: "Кран незамерзающий, длина 300 мм", price: 2529, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520350", name: "Кран незамерзающий, длина 350 мм", price: 2680, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520400", name: "Кран незамерзающий, длина 400 мм", price: 2841, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520450", name: "Кран незамерзающий, длина 450 мм", price: 3012, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520500", name: "Кран незамерзающий, длина 500 мм", price: 3192, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" },
        { id: "RVFF-0001-1520550", name: "Кран незамерзающий, длина 550 мм", price: 3384, brand: "ROMMER", availability: "in_stock", price_date: "2026-07-12" }
    ],
    filter_big_blue: [
        { id: "75185", name: "Колба Big Blue 20'", price: 3745, brand: "UNIPUMP", availability: "in_stock", price_date: "2026-07-12" },
        { id: "ВП-20 М-20 ББ", name: "Картридж Big Blue 20", price: 770, brand: "АКВАБРАЙТ", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SVB-1007-200020", name: "Кран шаровой ВН-НР 3/4\"", price: 1556, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBV-0001-2110320", name: "Кран шаровой ВР/ВР, ручка рычаг 3/4\"", price: 477, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
        { id: "SFT-0002-003480", name: "Удлинитель ВН/ВР 3/4\" 80 мм", price: 1042, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0002-003430", name: "Удлинитель ВН/ВР 3/4\" 30 мм", price: 501, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0020-000034", name: "Тройник 3/4\" ВР", price: 504, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0004-003434", name: "Ниппель 3/4\" НР", price: 207, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0014-000034", name: "Угольник 90° 3/4\" ВР", price: 462, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0057-000034", name: "Сгон угловой с уплотнительным кольцом 3/4\"", price: 713, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SFT-0004-000134", name: "Ниппель 1\" х 3/4\" НР", price: 350, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
    ],
    plug_34: { id: "SFT-0025-000034", name: "Заглушка 3/4\" НР", price: 176, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    // Глухой торец радиаторной гребёнки (лист «Узел обвязки коллектора радиаторного
    // отопления», подпись «Заглушка 1" НР»). Соседи по серии SFT-0024/0025 уже в каталоге,
    // просто на 3/4". Цена из price_index (324,26 ₽) по коэффициенту группы «STOUT Латунные
    // резьбовые фитинги» — 0,8364; он сходится на всех уже размеченных позициях этой группы
    // (188,5→158, 418,51→350, 940,24→787). availability не проверено, ставим осторожное
    // «под заказ» — первый прогон AutoPrice перепишет фактическим.
    plug_1: { id: "SFT-0024-000001", name: "Заглушка 1\" НР", price: 271, brand: "STOUT", availability: "on_order", price_date: "2026-08-15" },
    // Свободный боковой отвод присоединительного узла МУ-25М (см. gbm_nodes): на одном
    // корпусе комплекта стоит воздухоотводчик, второй закрывается этой заглушкой.
    // Та же серия и тот же коэффициент группы, что у plug_1: 103,22 × 0,8364 = 86 ₽.
    // availability не проверено — ставим «под заказ», первый прогон AutoPrice перепишет.
    plug_12: { id: "SFT-0024-000012", name: "Заглушка 1/2\" НР", price: 86, brand: "STOUT", availability: "on_order", price_date: "2026-08-17" },
    // Инсталляция подвесного унитаза. По умолчанию в смету идёт готовый комплект
    // РЕХАУ NOVAFLOW с панелью смыва NOVA QUAD 001 (белый глянец) — комплект дешевле
    // рамы и панели по отдельности на 6%. Первая позиция списка — голая рама без
    // панели: она помечена noCheapen, потому что режим «Аналог» иначе подставил бы её
    // как самую дешёвую, а это другая комплектация, а не другой бренд. Выбор голой
    // рамы добавляет в смету вторую строку — панель смыва из flush_panels.
    installations: [
        { id: "19101011001", name: "Инсталляция NOVAFLOW для подвесного унитаза (без панели)", price: 23116, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", noCheapen: true, series: "none" },
        { id: "19101021001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA QUAD 001, белый глянец", price: 24536, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "QUAD", color: "white" },
        { id: "19101031001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA QUAD 001, хром глянец", price: 27172, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "QUAD", color: "chrome" },
        { id: "19101041001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA QUAD 001, чёрный мат", price: 26868, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "QUAD", color: "black" },
        { id: "19101051001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA ORB 001, белый глянец", price: 24536, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "white" },
        { id: "19101061001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA ORB 001, хром глянец", price: 27172, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "chrome" },
        { id: "19101071001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA ORB 001, чёрный мат", price: 26868, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "black" },
        { id: "19101081001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA ELLIPSE 001, белый глянец", price: 24536, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ELLIPSE", color: "white" },
        { id: "19101091001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA ELLIPSE 001, хром глянец", price: 27172, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ELLIPSE", color: "chrome" },
        { id: "19101101001", name: "Комплект: инсталляция NOVAFLOW + панель NOVA ELLIPSE 001, чёрный мат", price: 26868, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ELLIPSE", color: "black" },
        { id: "M571-VE-01", name: "Инсталляция с кнопкой хром глянцевая и шумоизоляцией", price: 31648, brand: "AlcaPlast", availability: "in_stock", price_date: "2026-07-12", series: "QUAD", color: "chrome" }
    ],
    // Панели смыва РЕХАУ: нужны только при выборе инсталляции без панели.
    flush_panels: [
        { id: "19102011001", name: "Панель смыва NOVA QUAD 001, белый глянец", price: 2914, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "QUAD", color: "white", panelMat: "plastic" },
        { id: "19102021001", name: "Панель смыва NOVA QUAD 001, хром глянец", price: 5819, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "QUAD", color: "chrome", panelMat: "plastic" },
        { id: "19102031001", name: "Панель смыва NOVA QUAD 001, серебро мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "silver", panelMat: "plastic" },
        { id: "19102041001", name: "Панель смыва NOVA QUAD 001, графитовый мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "graphite", panelMat: "plastic" },
        { id: "19102051001", name: "Панель смыва NOVA QUAD 001, чёрный мат", price: 5445, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "QUAD", color: "black", panelMat: "plastic" },
        { id: "19102061001", name: "Панель смыва NOVA QUAD 001, золотой мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "gold", panelMat: "plastic" },
        { id: "19102071001", name: "Панель смыва NOVA QUAD 001, розовое золото мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "rose", panelMat: "plastic" },
        { id: "19102101001", name: "Панель смыва NOVA ELLIPSE 001, белый глянец", price: 2864, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "white", panelMat: "plastic" },
        { id: "19102111001", name: "Панель смыва NOVA ELLIPSE 001, хром глянец", price: 5819, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "chrome", panelMat: "plastic" },
        { id: "19102121001", name: "Панель смыва NOVA ELLIPSE 001, серебро мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "silver", panelMat: "plastic" },
        { id: "19102131001", name: "Панель смыва NOVA ELLIPSE 001, графитовый мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "graphite", panelMat: "plastic" },
        { id: "19102141001", name: "Панель смыва NOVA ELLIPSE 001, чёрный мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "black", panelMat: "plastic" },
        { id: "19102151001", name: "Панель смыва NOVA ELLIPSE 001, золотой мат", price: 5445, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ELLIPSE", color: "gold", panelMat: "plastic" },
        { id: "19102161001", name: "Панель смыва NOVA ELLIPSE 001, розовое золото мат", price: 5445, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "rose", panelMat: "plastic" },
        { id: "19102201001", name: "Панель смыва NOVA ORB 001, белый глянец", price: 2864, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "white", panelMat: "plastic" },
        { id: "19102211001", name: "Панель смыва NOVA ORB 001, хром глянец", price: 5715, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "chrome", panelMat: "plastic" },
        { id: "19102221001", name: "Панель смыва NOVA ORB 001, серебро мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "silver", panelMat: "plastic" },
        { id: "19102231001", name: "Панель смыва NOVA ORB 001, графитовый мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "graphite", panelMat: "plastic" },
        { id: "19102241001", name: "Панель смыва NOVA ORB 001, чёрный мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "black", panelMat: "plastic" },
        { id: "19102251001", name: "Панель смыва NOVA ORB 001, золотой мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "gold", panelMat: "plastic" },
        { id: "19102261001", name: "Панель смыва NOVA ORB 001, розовое золото мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "rose", panelMat: "plastic" },
        { id: "19102301001", name: "Панель смыва NOVA LONG 001, белый глянец", price: 2864, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "white", panelMat: "plastic" },
        { id: "19102311001", name: "Панель смыва NOVA LONG 001, белый глянец, клавиши хром глянец", price: 2864, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "white", panelMat: "plastic" },
        { id: "19102321001", name: "Панель смыва NOVA LONG 001, хром глянец", price: 5715, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "chrome", panelMat: "plastic" },
        { id: "19102331001", name: "Панель смыва NOVA LONG 001, серебро мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "silver", panelMat: "plastic" },
        { id: "19102341001", name: "Панель смыва NOVA LONG 001, графитовый мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "graphite", panelMat: "plastic" },
        { id: "19102351001", name: "Панель смыва NOVA LONG 001, чёрный мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "black", panelMat: "plastic" },
        { id: "19102361001", name: "Панель смыва NOVA LONG 001, чёрный мат, контур клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "black", panelMat: "plastic" },
        { id: "19102371001", name: "Панель смыва NOVA LONG 001, золотой мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "gold", panelMat: "plastic" },
        { id: "19102381001", name: "Панель смыва NOVA LONG 001, розовое золото мат", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "rose", panelMat: "plastic" },
        { id: "19102401001", name: "Панель смыва NOVA ELLIPSE 002, белый глянец, контур клавиш хром глянец", price: 2864, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "white", panelMat: "plastic" },
        { id: "19102411001", name: "Панель смыва NOVA ELLIPSE 002, хром глянец, контур клавиш хром глянец", price: 5715, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "chrome", panelMat: "plastic" },
        { id: "19102421001", name: "Панель смыва NOVA ELLIPSE 002, серебро мат, контур клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "silver", panelMat: "plastic" },
        { id: "19102431001", name: "Панель смыва NOVA ELLIPSE 002, графитовый мат, контур клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "graphite", panelMat: "plastic" },
        { id: "19102441001", name: "Панель смыва NOVA ELLIPSE 002, чёрный мат, контур клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "black", panelMat: "plastic" },
        { id: "19102451001", name: "Панель смыва NOVA ELLIPSE 002, золотой мат, контур клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "gold", panelMat: "plastic" },
        { id: "19102461001", name: "Панель смыва NOVA ELLIPSE 002, розовое золото мат, контур клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ELLIPSE", color: "rose", panelMat: "plastic" },
        { id: "19102501001", name: "Панель смыва NOVA LONG 002, белый глянец, нижняя полоса клавиш хром глянец", price: 2864, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "white", panelMat: "plastic" },
        { id: "19102511001", name: "Панель смыва NOVA LONG 002, хром глянец, нижняя полоса клавиш хром глянец", price: 5715, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "chrome", panelMat: "plastic" },
        { id: "19102521001", name: "Панель смыва NOVA LONG 002, серебро мат, нижняя полоса клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "silver", panelMat: "plastic" },
        { id: "19102531001", name: "Панель смыва NOVA LONG 002, графитовый матовый, нижняя полоса клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "graphite", panelMat: "plastic" },
        { id: "19102541001", name: "Панель смыва NOVA LONG 002, чёрный мат, нижняя полоса клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "black", panelMat: "plastic" },
        { id: "19102551001", name: "Панель смыва NOVA LONG 002, золотой мат, нижняя полоса клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "gold", panelMat: "plastic" },
        { id: "19102561001", name: "Панель смыва NOVA LONG 002, розовое золото, нижняя полоса клавиш хром глянец", price: 5349, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "LONG", color: "rose", panelMat: "plastic" },
        { id: "19102901001", name: "Панель смыва NOVA ORB GLASS, закалённое стекло, белый, клавиши и их контур хром глянец", price: 8665, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "white", panelMat: "glass" },
        { id: "19102911001", name: "Панель смыва NOVA ORB GLASS, закалённое стекло, чёрный, клавиши и их контур хром глянец", price: 8665, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "black", panelMat: "glass" },
        { id: "19102921001", name: "Панель смыва NOVA ORB GLASS, закалённое стекло, красный, клавиши и их контур хром глянец", price: 8665, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "red", panelMat: "glass" },
        { id: "19102601001", name: "Панель смыва NOVA ORB STEEL, нержавеющая сталь, брашированная мат", price: 7227, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "steel", panelMat: "steel" },
        { id: "19102611001", name: "Панель смыва NOVA ORB STEEL, нержавеющая сталь глянец", price: 7227, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "steel", panelMat: "steel" },
        { id: "19102621001", name: "Панель смыва NOVA ORB STEEL, нержавеющая сталь, брашированный графитовый мат", price: 12167, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "graphite", panelMat: "steel" },
        { id: "19102631001", name: "Панель смыва NOVA ORB STEEL, нержавеющая сталь, чёрный мат", price: 7227, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "black", panelMat: "steel" },
        { id: "19102641001", name: "Панель смыва NOVA ORB STEEL, нержавеющая сталь, брашированное розовое золото мат", price: 12167, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "rose", panelMat: "steel" },
        { id: "19102651001", name: "Панель смыва NOVA ORB STEEL, нержавеющая сталь, брашированное циркониевое золото мат", price: 12167, brand: "REHAU", availability: "in_stock", price_date: "2026-08-10", series: "ORB", color: "gold", panelMat: "steel" },
        { id: "19102661001", name: "Панель смыва NOVA ORB STEEL, нержавеющая сталь, брашированное титановое золото мат", price: 12167, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "ORB", color: "gold", panelMat: "steel" },
        { id: "19102701001", name: "Панель смыва NOVA QUAD STEEL, нержавеющая сталь, брашированная мат", price: 7227, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "steel", panelMat: "steel" },
        { id: "19102711001", name: "Панель смыва NOVA QUAD STEEL, нержавеющая сталь глянец", price: 7227, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "steel", panelMat: "steel" },
        { id: "19102721001", name: "Панель смыва NOVA QUAD STEEL, нержавеющая сталь, брашированный графитовый мат", price: 12167, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "graphite", panelMat: "steel" },
        { id: "19102731001", name: "Панель смыва NOVA QUAD STEEL, нержавеющая сталь, чёрный мат", price: 7227, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "black", panelMat: "steel" },
        { id: "19102741001", name: "Панель смыва NOVA QUAD STEEL, нержавеющая сталь, брашированное розовое золото мат", price: 12167, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "rose", panelMat: "steel" },
        { id: "19102751001", name: "Панель смыва NOVA QUAD STEEL, нержавеющая сталь, брашированное циркониевое золото мат", price: 12167, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "gold", panelMat: "steel" },
        { id: "19102761001", name: "Панель смыва NOVA QUAD STEEL, нержавеющая сталь, брашированное титановое золото мат", price: 12167, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "QUAD", color: "gold", panelMat: "steel" },
        { id: "19102801001", name: "Панель смыва NOVA PUBLIC антивандальная, нержавеющая сталь, брашированная мат", price: 10138, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "PUBLIC", color: "steel", panelMat: "steel" },
        { id: "19102811001", name: "Панель смыва NOVA PUBLIC антивандальная, нержавеющая сталь глянец", price: 10138, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "PUBLIC", color: "steel", panelMat: "steel" },
        { id: "19102821001", name: "Панель смыва NOVA PUBLIC антивандальная, нержавеющая сталь, брашированный графитовый мат", price: 14195, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "PUBLIC", color: "graphite", panelMat: "steel" },
        { id: "19102831001", name: "Панель смыва NOVA PUBLIC антивандальная, нержавеющая сталь, чёрный мат", price: 14195, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "PUBLIC", color: "black", panelMat: "steel" },
        { id: "19102841001", name: "Панель смыва NOVA PUBLIC антивандальная, нержавеющая сталь, брашированное розовое золото мат", price: 14195, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "PUBLIC", color: "rose", panelMat: "steel" },
        { id: "19102851001", name: "Панель смыва NOVA PUBLIC антивандальная, нержавеющая сталь, брашированное циркониевое золото мат", price: 14195, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "PUBLIC", color: "gold", panelMat: "steel" },
        { id: "19102861001", name: "Панель смыва NOVA PUBLIC антивандальная, нержавеющая сталь, брашированное титановое золото мат", price: 14195, brand: "REHAU", availability: "on_order", price_date: "2026-08-10", series: "PUBLIC", color: "gold", panelMat: "steel" }
    ],
    sewer_silent: [
        { id: "SKB-0002-110100", name: "Труба канализационная бесшумная D 110 L 1000", price: 2349, brand: "STOUT", availability: "in_stock", rommer: { id: "500089", article: "500089", name: "Труба кан. ПП D 110 L 1000", price: 589, brand: "Sinikon" }, comfort: { id: "500089K", article: "500089.K", name: "Труба кан. D 110 L 1000 Comfort", price: 940, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0002-110200", name: "Труба канализационная бесшумная D 110 L 2000", price: 4334, brand: "STOUT", availability: "in_stock", rommer: { id: "500093", article: "500093", name: "Труба кан. ПП D 110 L 2000", price: 935, brand: "Sinikon" }, comfort: { id: "500093K", article: "500093.K", name: "Труба кан. D 110 L 2000 Comfort", price: 1550, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0001-058100", name: "Труба канализационная бесшумная D 058 L 1000", price: 857, brand: "STOUT", availability: "in_stock", rommer: { id: "500049", article: "500049", name: "Труба кан. ПП D 050 L 1000", price: 227, brand: "Sinikon" }, comfort: { id: "500049K", article: "500049.K", name: "Труба кан. D 050 L 1000 Comfort", price: 357, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0001-058200", name: "Труба канализационная бесшумная D 058 L 2000", price: 1781, brand: "STOUT", availability: "in_stock", rommer: { id: "500053", article: "500053", name: "Труба кан. ПП D 050 L 2000", price: 390, brand: "Sinikon" }, comfort: { id: "500053K", article: "500053.K", name: "Труба кан. D 050 L 2000 Comfort", price: 612, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0010-011045", name: "Отвод бесшумный 45° D 110", price: 1235, brand: "STOUT", availability: "in_stock", rommer: { id: "504053R", article: "504053.R", name: "Отвод 45° D 110 ПП", price: 167, brand: "Sinikon" }, comfort: { id: "504053K", article: "504053.K", name: "Отвод 45° D 110 Comfort", price: 233, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0012-011087", name: "Отвод бесшумный 87° D 110", price: 1235, brand: "STOUT", availability: "in_stock", rommer: { id: "504059R", article: "504059.R", name: "Отвод 87° D 110 ПП", price: 167, brand: "Sinikon" }, comfort: { id: "504059K", article: "504059.K", name: "Отвод 87° D 110 Comfort", price: 233, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0010-005845", name: "Отвод бесшумный 45° D 058", price: 413, brand: "STOUT", availability: "in_stock", rommer: { id: "504029R", article: "504029.R", name: "Отвод 45° D 050 ПП", price: 55, brand: "Sinikon" }, comfort: { id: "504029K", article: "504029.K", name: "Отвод 45° D 050 Comfort", price: 77, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0012-005887", name: "Отвод бесшумный 87° D 058", price: 413, brand: "STOUT", availability: "in_stock", rommer: { id: "504035R", article: "504035.R", name: "Отвод 87° D 050 ПП", price: 55, brand: "Sinikon" }, comfort: { id: "504035K", article: "504035.K", name: "Отвод 87° D 050 Comfort", price: 77, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0015-115845", name: "Тройник бесшумный 45° D 110 x 058", price: 1450, brand: "STOUT", availability: "in_stock", rommer: { id: "510031R", article: "510031.R", name: "Тройник 45° D 110 x 050 ПП", price: 223, brand: "Sinikon" }, comfort: { id: "510031K", article: "510031.K", name: "Тройник 45° D 110 x 050 Comfort", price: 313, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0015-111145", name: "Тройник бесшумный 45° D 110 x 110", price: 2134, brand: "STOUT", availability: "in_stock", rommer: { id: "508025R", article: "508025.R", name: "Тройник 45° D 110 x 110 ПП", price: 302, brand: "Sinikon" }, comfort: { id: "508025K", article: "508025.K", name: "Тройник 45° D 110 x 110 Comfort", price: 424, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0016-115887", name: "Тройник бесшумный 87° D 110 x 058", price: 1450, brand: "STOUT", availability: "in_stock", rommer: { id: "510035R", article: "510035.R", name: "Тройник 87° D 110 x 050 ПП", price: 223, brand: "Sinikon" }, comfort: { id: "510035K", article: "510035.K", name: "Тройник 87° D 110 x 050 Comfort", price: 313, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0013-011058", name: "Переход эксцентрический бесшумный D 110 х 58", price: 703, brand: "STOUT", availability: "in_stock", rommer: { id: "514009R", article: "514009.R", name: "Переход эксц. D 110 x 050 ПП", price: 130, brand: "Sinikon" }, comfort: { id: "514009R", article: "514009.R", name: "Переход эксц. D 110 x 050 ПП", price: 130, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0005-000058", name: "Заглушка D 058", price: 169, brand: "STOUT", availability: "in_stock", rommer: { id: "524003R", article: "524003.R", name: "Заглушка D 050 ПП", price: 33, brand: "Sinikon" }, comfort: { id: "524003K", article: "524003.K", name: "Заглушка D 050 Comfort", price: 46, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0005-000110", name: "Заглушка D 110", price: 390, brand: "STOUT", availability: "in_stock", rommer: { id: "524007R", article: "524007.R", name: "Заглушка D 110 ПП", price: 59, brand: "Sinikon" }, comfort: { id: "524007K", article: "524007.K", name: "Заглушка D 110 Comfort", price: 82, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0006-000058", name: "Муфта соединительная двухраструбная D 58", price: 534, brand: "STOUT", availability: "in_stock", rommer: { id: "528003R", article: "528003.R", name: "Муфта соед. D 050 ПП", price: 93, brand: "Sinikon" }, comfort: { id: "528003K", article: "528003.K", name: "Муфта соед. D 050 Comfort", price: 131, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0006-000110", name: "Муфта соединительная двухраструбная D 110", price: 1276, brand: "STOUT", availability: "in_stock", rommer: { id: "528007R", article: "528007.R", name: "Муфта соед. D 110 ПП", price: 179, brand: "Sinikon" }, comfort: { id: "528007K", article: "528007.K", name: "Муфта соед. D 110 Comfort", price: 252, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0007-000058", name: "Муфта ремонтная D 58", price: 540, brand: "STOUT", availability: "in_stock", rommer: { id: "526003R", article: "526003.R", name: "Муфта рем. D 050 ПП", price: 93, brand: "Sinikon" }, comfort: { id: "526003K", article: "526003.K", name: "Муфта рем. D 050 Comfort", price: 131, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "SKB-0007-000110", name: "Муфта ремонтная D 110", price: 1289, brand: "STOUT", availability: "in_stock", rommer: { id: "526007R", article: "526007.R", name: "Муфта рем. D 110 ПП", price: 179, brand: "Sinikon" }, comfort: { id: "526007K", article: "526007.K", name: "Муфта рем. D 110 Comfort", price: 252, brand: "Sinikon" }, price_date: "2026-06-27" },
        { id: "900003.R", article: "900003.R", name: "Смазка силиконовая", price: 313, brand: "Sinikon", availability: "in_stock", price_date: "2026-06-06" }
    ],
    ss_pipe_4m: [
        { id: "RSS-1001-000015", name: "Труба нерж. 304, штанга 4м 15х1", price: 300, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-000018", name: "Труба нерж. 304, штанга 4м 18х1", price: 409, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-000022", name: "Труба нерж. 304, штанга 4м 22х1.2", price: 553, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-000028", name: "Труба нерж. 304, штанга 4м 28х1.2", price: 715, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-000035", name: "Труба нерж. 304, штанга 4м 35х1.5", price: 1119, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-000042", name: "Труба нерж. 304, штанга 4м 42х1.5", price: 1636, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-000054", name: "Труба нерж. 304, штанга 4м 54х1.5", price: 2113, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_pipe_2m: [
        { id: "RSS-1001-200015", name: "Труба нерж. 304, штанга 2м 15х1", price: 309, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-200018", name: "Труба нерж. 304, штанга 2м 18х1", price: 421, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-200022", name: "Труба нерж. 304, штанга 2м 22х1.2", price: 570, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-200028", name: "Труба нерж. 304, штанга 2м 28х1.2", price: 736, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-200035", name: "Труба нерж. 304, штанга 2м 35х1.5", price: 1153, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-200042", name: "Труба нерж. 304, штанга 2м 42х1.5", price: 1685, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1001-200054", name: "Труба нерж. 304, штанга 2м 54х1.5", price: 2177, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_pipe_4m_ru: [
        { id: "RSS-2001-000018", name: "Труба нерж. 304, штанга 4м (Россия) 18х1", price: 322, brand: "ROMMER", unit: "шт", availability: "in_stock",
  price_date: '2026-08-10' },
        { id: "RSS-2001-000022", name: "Труба нерж. 304, штанга 4м (Россия) 22х1.2", price: 475, brand: "ROMMER", unit: "шт", availability: "in_stock",
  price_date: '2026-08-10' },
        { id: "RSS-2001-000028", name: "Труба нерж. 304, штанга 4м (Россия) 28х1.2", price: 609, brand: "ROMMER", unit: "шт", availability: "on_order",
  price_date: '2026-08-10' },
        { id: "RSS-2001-000035", name: "Труба нерж. 304, штанга 4м (Россия) 35х1.5", price: 947, brand: "ROMMER", unit: "шт", availability: "in_stock",
  price_date: '2026-08-10' }
    ],
    ss_elbow90: [
        { id: "RSS-1002-000015", name: "Угольник 90° ВПр-НПр 15", price: 171, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1002-000018", name: "Угольник 90° ВПр-НПр 18", price: 231, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1002-000022", name: "Угольник 90° ВПр-НПр 22", price: 262, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1002-000028", name: "Угольник 90° ВПр-НПр 28", price: 386, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1002-000035", name: "Угольник 90° ВПр-НПр 35", price: 596, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1002-000042", name: "Угольник 90° ВПр-НПр 42", price: 841, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1002-000054", name: "Угольник 90° ВПр-НПр 54", price: 1224, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_elbow90_ff: [
        { id: "RSS-1003-000015", name: "Угольник 90° ВПр-ВПр 15", price: 161, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1003-000018", name: "Угольник 90° ВПр-ВПр 18", price: 261, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1003-000022", name: "Угольник 90° ВПр-ВПр 22", price: 310, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1003-000028", name: "Угольник 90° ВПр-ВПр 28", price: 415, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1003-000035", name: "Угольник 90° ВПр-ВПр 35", price: 616, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1003-000042", name: "Угольник 90° ВПр-ВПр 42", price: 719, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1003-000054", name: "Угольник 90° ВПр-ВПр 54", price: 1238, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_elbow45: [
        { id: "RSS-1004-000015", name: "Угольник 45° ВПр-НПр 15", price: 159, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1004-000018", name: "Угольник 45° ВПр-НПр 18", price: 210, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1004-000022", name: "Угольник 45° ВПр-НПр 22", price: 235, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1004-000028", name: "Угольник 45° ВПр-НПр 28", price: 312, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1004-000035", name: "Угольник 45° ВПр-НПр 35", price: 519, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1004-000042", name: "Угольник 45° ВПр-НПр 42", price: 660, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1004-000054", name: "Угольник 45° ВПр-НПр 54", price: 817, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_elbow45_ff: [
        { id: "RSS-1005-000015", name: "Угольник 45° ВПр-ВПр 15", price: 161, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1005-000018", name: "Угольник 45° ВПр-ВПр 18", price: 250, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1005-000022", name: "Угольник 45° ВПр-ВПр 22", price: 259, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1005-000028", name: "Угольник 45° ВПр-ВПр 28", price: 348, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1005-000035", name: "Угольник 45° ВПр-ВПр 35", price: 524, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1005-000042", name: "Угольник 45° ВПр-ВПр 42", price: 666, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1005-000054", name: "Угольник 45° ВПр-ВПр 54", price: 1072, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_bypass_ff: [
        { id: "RSS-1006-000015", name: "Обвод ВПр-ВПр 15", price: 405, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1006-000018", name: "Обвод ВПр-ВПр 18", price: 538, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1006-000022", name: "Обвод ВПр-ВПр 22", price: 610, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1006-000028", name: "Обвод ВПр-ВПр 28", price: 846, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_bypass: [
        { id: "RSS-1007-000015", name: "Обвод ВПр-НПр 15", price: 400, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1007-000018", name: "Обвод ВПр-НПр 18", price: 560, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1007-000022", name: "Обвод ВПр-НПр 22", price: 610, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_bend90: [
        { id: "RSS-1008-001570", name: "Отвод безраструбный 90° 15х70х160", price: 269, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1008-015100", name: "Отвод безраструбный 90° 15х100х600", price: 755, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" }
    ],
    ss_elbow_fi: [
        { id: "RSS-1009-001512", name: "Угольник-переходник ВПр-ВР 15х1/2", price: 423, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1009-001812", name: "Угольник-переходник ВПр-ВР 18х1/2", price: 448, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1009-001834", name: "Угольник-переходник ВПр-ВР 18х3/4", price: 542, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1009-002212", name: "Угольник-переходник ВПр-ВР 22х1/2", price: 561, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1009-002234", name: "Угольник-переходник ВПр-ВР 22х3/4", price: 564, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1009-002834", name: "Угольник-переходник ВПр-ВР 28х3/4", price: 627, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1009-000351", name: "Угольник-переходник ВПр-ВР 35х1", price: 1083, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" }
    ],
    ss_elbow_mi: [
        { id: "RSS-1010-001512", name: "Угольник-переходник ВПр-НР 15х1/2", price: 379, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1010-001812", name: "Угольник-переходник ВПр-НР 18х1/2", price: 490, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1010-001834", name: "Угольник-переходник ВПр-НР 18х3/4", price: 542, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1010-002212", name: "Угольник-переходник ВПр-НР 22х1/2", price: 552, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1010-002234", name: "Угольник-переходник ВПр-НР 22х3/4", price: 581, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1010-002834", name: "Угольник-переходник ВПр-НР 28х3/4", price: 718, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1010-000351", name: "Угольник-переходник ВПр-НР 35х1", price: 1005, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_wall_elbow: [
        { id: "RSS-1011-001512", name: "Угольник настенный ВПр-ВР 15х1/2", price: 551, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1011-001812", name: "Угольник настенный ВПр-ВР 18х1/2", price: 680, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1011-002212", name: "Угольник настенный ВПр-ВР 22х1/2", price: 641, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1011-002234", name: "Угольник настенный ВПр-ВР 22х3/4", price: 754, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" }
    ],
    ss_wall_elbow_pass: [
        { id: "RSS-1012-001512", name: "Угольник проходной настенный ВПр-ВР 15х1/2", price: 1208, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" }
    ],
    ss_tee: [
        { id: "RSS-1013-000015", name: "Тройник равнопроходной ВПр 15", price: 278, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1013-000018", name: "Тройник равнопроходной ВПр 18", price: 373, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1013-000022", name: "Тройник равнопроходной ВПр 22", price: 386, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1013-000028", name: "Тройник равнопроходной ВПр 28", price: 452, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1013-000035", name: "Тройник равнопроходной ВПр 35", price: 734, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1013-000042", name: "Тройник равнопроходной ВПр 42", price: 834, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1013-000054", name: "Тройник равнопроходной ВПр 54", price: 1314, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_tee_red: [
        { id: "RSS-1014-181518", name: "Тройник переходной ВПр 18х15х18", price: 327, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1014-221522", name: "Тройник переходной ВПр 22х15х22", price: 350, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1014-221822", name: "Тройник переходной ВПр 22х18х22", price: 398, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1014-281528", name: "Тройник переходной ВПр 28х15х28", price: 470, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1014-282222", name: "Тройник переходной ВПр 28х22х22", price: 532, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1014-282228", name: "Тройник переходной ВПр 28х22х28", price: 437, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1014-282822", name: "Тройник переходной ВПр 28х28х22", price: 585, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1014-351535", name: "Тройник переходной ВПр 35х15х35", price: 578, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1014-352235", name: "Тройник переходной ВПр 35х22х35", price: 615, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1014-352835", name: "Тройник переходной ВПр 35х28х35", price: 615, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1014-423542", name: "Тройник переходной ВПр 42х35х42", price: 907, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1014-544254", name: "Тройник переходной ВПр 54х42х54", price: 1343, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_tee_fi: [
        { id: "RSS-1015-001512", name: "Тройник-переходник ВПр-ВР 15х1/2", price: 364, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1015-001812", name: "Тройник-переходник ВПр-ВР 18х1/2", price: 475, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-001834", name: "Тройник-переходник ВПр-ВР 18х3/4", price: 423, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1015-002212", name: "Тройник-переходник ВПр-ВР 22х1/2", price: 478, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-002234", name: "Тройник-переходник ВПр-ВР 22х3/4", price: 513, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1015-002812", name: "Тройник-переходник ВПр-ВР 28х1/2", price: 500, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-002834", name: "Тройник-переходник ВПр-ВР 28х3/4", price: 591, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-000281", name: "Тройник-переходник ВПр-ВР 28х1", price: 762, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1015-003512", name: "Тройник-переходник ВПр-ВР 35х1/2", price: 797, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-000351", name: "Тройник-переходник ВПр-ВР 35х1", price: 870, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-035114", name: "Тройник-переходник ВПр-ВР 35х11/4", price: 1192, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1015-004212", name: "Тройник-переходник ВПр-ВР 42х1/2", price: 913, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-000421", name: "Тройник-переходник ВПр-ВР 42х1", price: 1156, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1015-042114", name: "Тройник-переходник ВПр-ВР 42х11/4", price: 1534, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1015-005412", name: "Тройник-переходник ВПр-ВР 54х1/2", price: 885, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-000541", name: "Тройник-переходник ВПр-ВР 54х1", price: 1051, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1015-054114", name: "Тройник-переходник ВПр-ВР 54х11/4", price: 1471, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" }
    ],
    ss_tee_mi: [
        { id: "RSS-1016-001512", name: "Тройник-переходник ВПр-НР 15х1/2", price: 695, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1016-001812", name: "Тройник-переходник ВПр-НР 18х1/2", price: 770, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1016-001834", name: "Тройник-переходник ВПр-НР 18х3/4", price: 782, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1016-002212", name: "Тройник-переходник ВПр-НР 22х1/2", price: 788, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-002234", name: "Тройник-переходник ВПр-НР 22х3/4", price: 844, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-002812", name: "Тройник-переходник ВПр-НР 28х1/2", price: 885, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-002834", name: "Тройник-переходник ВПр-НР 28х3/4", price: 895, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-000281", name: "Тройник-переходник ВПр-НР 28х1", price: 826, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-000351", name: "Тройник-переходник ВПр-НР 35х1", price: 972, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-035114", name: "Тройник-переходник ВПр-НР 35х11/4", price: 1058, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1016-000421", name: "Тройник-переходник ВПр-НР 42х1", price: 1105, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-042114", name: "Тройник-переходник ВПр-НР 42х11/4", price: 1332, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1016-000541", name: "Тройник-переходник ВПр-НР 54х1", price: 1501, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1016-054114", name: "Тройник-переходник ВПр-НР 54х11/4", price: 1773, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_coupling: [
        { id: "RSS-1017-000015", name: "Муфта равнопроходная ВПр 15", price: 125, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1017-000018", name: "Муфта равнопроходная ВПр 18", price: 153, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1017-000022", name: "Муфта равнопроходная ВПр 22", price: 165, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1017-000028", name: "Муфта равнопроходная ВПр 28", price: 199, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1017-000035", name: "Муфта равнопроходная ВПр 35", price: 326, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1017-000042", name: "Муфта равнопроходная ВПр 42", price: 492, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1017-000054", name: "Муфта равнопроходная ВПр 54", price: 587, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_coupling_red: [
        { id: "RSS-1018-001815", name: "Муфта переходная ВПр 18х15", price: 198, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1018-002215", name: "Муфта переходная ВПр 22х15", price: 230, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1018-002218", name: "Муфта переходная ВПр 22х18", price: 240, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1018-002815", name: "Муфта переходная ВПр 28х15", price: 288, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1018-002822", name: "Муфта переходная ВПр 28х22", price: 277, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1018-003528", name: "Муфта переходная ВПр 35х28", price: 426, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1018-004235", name: "Муфта переходная ВПр 42х35", price: 553, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1018-005442", name: "Муфта переходная ВПр 54х42", price: 823, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_coupling_slide: [
        { id: "RSS-1019-000015", name: "Муфта надвижная ВПр 15", price: 203, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1019-000018", name: "Муфта надвижная ВПр 18", price: 231, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1019-000022", name: "Муфта надвижная ВПр 22", price: 294, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1019-000028", name: "Муфта надвижная ВПр 28", price: 351, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1019-000035", name: "Муфта надвижная ВПр 35", price: 480, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1019-000042", name: "Муфта надвижная ВПр 42", price: 566, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1019-000054", name: "Муфта надвижная ВПр 54", price: 855, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_coupling_mf: [
        { id: "RSS-1020-001815", name: "Муфта переходная НПр-ВПр 18х15", price: 207, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-002215", name: "Муфта переходная НПр-ВПр 22х15", price: 208, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-002218", name: "Муфта переходная НПр-ВПр 22х18", price: 220, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-002815", name: "Муфта переходная НПр-ВПр 28х15", price: 263, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-002818", name: "Муфта переходная НПр-ВПр 28х18", price: 281, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-002822", name: "Муфта переходная НПр-ВПр 28х22", price: 284, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1020-003515", name: "Муфта переходная НПр-ВПр 35х15", price: 362, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-003518", name: "Муфта переходная НПр-ВПр 35х18", price: 349, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-003522", name: "Муфта переходная НПр-ВПр 35х22", price: 337, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1020-003528", name: "Муфта переходная НПр-ВПр 35х28", price: 378, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1020-004222", name: "Муфта переходная НПр-ВПр 42х22", price: 482, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1020-004228", name: "Муфта переходная НПр-ВПр 42х28", price: 534, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1020-004235", name: "Муфта переходная НПр-ВПр 42х35", price: 550, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1020-005428", name: "Муфта переходная НПр-ВПр 54х28", price: 689, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1020-005435", name: "Муфта переходная НПр-ВПр 54х35", price: 706, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1020-005442", name: "Муфта переходная НПр-ВПр 54х42", price: 721, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_adapter_mi: [
        { id: "RSS-1021-001512", name: "Переходник ВПр-НР 15х1/2", price: 252, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-001534", name: "Переходник ВПр-НР 15х3/4", price: 358, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1021-001812", name: "Переходник ВПр-НР 18х1/2", price: 303, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-001834", name: "Переходник ВПр-НР 18х3/4", price: 353, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-002212", name: "Переходник ВПр-НР 22х1/2", price: 299, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-002234", name: "Переходник ВПр-НР 22х3/4", price: 381, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-000221", name: "Переходник ВПр-НР 22х1", price: 487, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-002834", name: "Переходник ВПр-НР 28х3/4", price: 421, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-000281", name: "Переходник ВПр-НР 28х1", price: 505, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-000351", name: "Переходник ВПр-НР 35х1", price: 790, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-035114", name: "Переходник ВПр-НР 35х11/4", price: 762, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-042112", name: "Переходник ВПр-НР 42х11/2", price: 838, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1021-000542", name: "Переходник ВПр-НР 54х2", price: 1279, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_adapter_fi: [
        { id: "RSS-1022-001512", name: "Переходник ВПр-ВР 15х1/2", price: 250, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-001812", name: "Переходник ВПр-ВР 18х1/2", price: 293, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-001834", name: "Переходник ВПр-ВР 18х3/4", price: 369, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-002212", name: "Переходник ВПр-ВР 22х1/2", price: 264, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-002234", name: "Переходник ВПр-ВР 22х3/4", price: 363, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-002834", name: "Переходник ВПр-ВР 28х3/4", price: 438, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-000281", name: "Переходник ВПр-ВР 28х1", price: 629, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-000351", name: "Переходник ВПр-ВР 35х1", price: 658, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-035114", name: "Переходник ВПр-ВР 35х11/4", price: 845, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-042112", name: "Переходник ВПр-ВР 42х11/2", price: 887, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1022-000542", name: "Переходник ВПр-ВР 54х2", price: 1332, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_insert_fi: [
        { id: "RSS-1023-001512", name: "Вставка переходная НПр-ВР 15х1/2", price: 241, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-001534", name: "Вставка переходная НПр-ВР 15х3/4", price: 356, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-001812", name: "Вставка переходная НПр-ВР 18х1/2", price: 283, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-001834", name: "Вставка переходная НПр-ВР 18х3/4", price: 365, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-000181", name: "Вставка переходная НПр-ВР 18х1", price: 568, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-002212", name: "Вставка переходная НПр-ВР 22х1/2", price: 250, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1023-002234", name: "Вставка переходная НПр-ВР 22х3/4", price: 345, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-000221", name: "Вставка переходная НПр-ВР 22х1", price: 522, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-002834", name: "Вставка переходная НПр-ВР 28х3/4", price: 454, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-000281", name: "Вставка переходная НПр-ВР 28х1", price: 601, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1023-035114", name: "Вставка переходная НПр-ВР 35х11/4", price: 757, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1023-042112", name: "Вставка переходная НПр-ВР 42х11/2", price: 1003, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1023-000542", name: "Вставка переходная НПр-ВР 54х2", price: 1457, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_insert_mi: [
        { id: "RSS-1024-001512", name: "Вставка переходная НПр-НР 15х1/2", price: 273, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1024-001534", name: "Вставка переходная НПр-НР 15х3/4", price: 356, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1024-001812", name: "Вставка переходная НПр-НР 18х1/2", price: 314, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1024-001834", name: "Вставка переходная НПр-НР 18х3/4", price: 344, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1024-000181", name: "Вставка переходная НПр-НР 18х1", price: 482, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1024-002212", name: "Вставка переходная НПр-НР 22х1/2", price: 345, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1024-002234", name: "Вставка переходная НПр-НР 22х3/4", price: 382, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1024-000221", name: "Вставка переходная НПр-НР 22х1", price: 375, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1024-002834", name: "Вставка переходная НПр-НР 28х3/4", price: 440, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1024-000281", name: "Вставка переходная НПр-НР 28х1", price: 568, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1024-035114", name: "Вставка переходная НПр-НР 35х11/4", price: 786, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1024-042112", name: "Вставка переходная НПр-НР 42х11/2", price: 1239, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1024-000542", name: "Вставка переходная НПр-НР 54х2", price: 1666, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_plug: [
        { id: "RSS-1025-000015", name: "Заглушка ВПр 15", price: 146, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1025-000018", name: "Заглушка ВПр 18", price: 188, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1025-000022", name: "Заглушка ВПр 22", price: 233, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1025-000028", name: "Заглушка ВПр 28", price: 304, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1025-000035", name: "Заглушка ВПр 35", price: 409, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1025-000042", name: "Заглушка ВПр 42", price: 606, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1025-000054", name: "Заглушка ВПр 54", price: 777, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_union_fi: [
        { id: "RSS-1026-001512", name: "Переходник с накидной гайкой ВПр-ВР 15х1/2", price: 507, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1026-001534", name: "Переходник с накидной гайкой ВПр-ВР 15х3/4", price: 532, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-001812", name: "Переходник с накидной гайкой ВПр-ВР 18х1/2", price: 545, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-001834", name: "Переходник с накидной гайкой ВПр-ВР 18х3/4", price: 504, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-002212", name: "Переходник с накидной гайкой ВПр-ВР 22х1/2", price: 474, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-002234", name: "Переходник с накидной гайкой ВПр-ВР 22х3/4", price: 504, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-002834", name: "Переходник с накидной гайкой ВПр-ВР 28х3/4", price: 603, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-000281", name: "Переходник с накидной гайкой ВПр-ВР 28х1", price: 602, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-000351", name: "Переходник с накидной гайкой ВПр-ВР 35х1", price: 906, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-035114", name: "Переходник с накидной гайкой ВПр-ВР 35х11/4", price: 1019, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1026-042112", name: "Переходник с накидной гайкой ВПр-ВР 42х11/2", price: 1487, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1026-000542", name: "Переходник с накидной гайкой ВПр-ВР 54х2", price: 2090, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_oring_epdm: [
        { id: "RSS-1027-000015", name: "Уплотнительное кольцо EPDM 15", price: 10, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1027-000018", name: "Уплотнительное кольцо EPDM 18", price: 10, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1027-000022", name: "Уплотнительное кольцо EPDM 22", price: 21, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1027-000028", name: "Уплотнительное кольцо EPDM 28", price: 23, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1027-000035", name: "Уплотнительное кольцо EPDM 35", price: 27, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1027-000042", name: "Уплотнительное кольцо EPDM 42", price: 48, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1027-000054", name: "Уплотнительное кольцо EPDM 54", price: 66, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ss_oring_fpm: [
        { id: "RSS-1028-000015", name: "Уплотнительное кольцо FPM 15", price: 19, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1028-000018", name: "Уплотнительное кольцо FPM 18", price: 21, brand: "ROMMER", unit: "шт", availability: "on_order", price_date: "2026-08-10" },
        { id: "RSS-1028-000022", name: "Уплотнительное кольцо FPM 22", price: 33, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1028-000028", name: "Уплотнительное кольцо FPM 28", price: 41, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1028-000035", name: "Уплотнительное кольцо FPM 35", price: 54, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1028-000042", name: "Уплотнительное кольцо FPM 42", price: 99, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "RSS-1028-000054", name: "Уплотнительное кольцо FPM 54", price: 126, brand: "ROMMER", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],
    ppr_ekoplastik_pipe: [
        { id: "STRS020RCT", article: "STRS020RCT", name: "Труба PP-RCT STABI PLUS 20x2,8", price: 428.6, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STRS025RCT", article: "STRS025RCT", name: "Труба PP-RCT STABI PLUS 25x3,5", price: 619.2, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STRS032RCT", article: "STRS032RCT", name: "Труба PP-RCT STABI PLUS 32x4,4", price: 941, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STRS040RCT", article: "STRS040RCT", name: "Труба PP-RCT STABI PLUS 40x5,5", price: 1345.2, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STRS050RCT", article: "STRS050RCT", name: "Труба PP-RCT STABI PLUS 50x6,9", price: 2041, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STRS063RCT", article: "STRS063RCT", name: "Труба PP-RCT STABI PLUS 63x8,6", price: 3047, brand: "Wavin", unit: "шт", availability: "in_stock" }
    ],
    ppr_ekoplastik_elbow90: [
        { id: "SKO02090RCT", article: "SKO02090RCT", name: "Угольник 90° PP-RCT 20х90°", price: 44, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO02590RCT", article: "SKO02590RCT", name: "Угольник 90° PP-RCT 25х90°", price: 57.2, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO03290RCT", article: "SKO03290RCT", name: "Угольник 90° PP-RCT 32х90°", price: 88, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO04090RCT", article: "SKO04090RCT", name: "Угольник 90° PP-RCT 40х90°", price: 194, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SKO05090RCT", article: "SKO05090RCT", name: "Угольник 90° PP-RCT 50х90°", price: 413, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SKO06390RCT", article: "SKO06390RCT", name: "Угольник 90° PP-RCT 63x90°", price: 734, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SKO12045RCT", article: "SKO12045RCT", name: "Угольник 90° PP-RCT 20x45°", price: 90.2, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO12545XRCT", article: "SKO12545XRCT", name: "Угольник 90° PP-RCT 25x45°", price: 230, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SKO120RCTX", article: "SKO120RCTX", name: "Угольник 90° PP-RCT 20x90°", price: 53.8, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO125RCTX", article: "SKO125RCTX", name: "Угольник 90° PP-RCT 25x90°", price: 79.2, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO132RCTX", article: "SKO132RCTX", name: "Угольник 90° PP-RCT 32x90°", price: 226, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" }
    ],
    ppr_ekoplastik_elbow45: [
        { id: "SKO02045RCT", article: "SKO02045RCT", name: "Угольник 45° PP-RCT 20х45°", price: 58.3, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO02545RCT", article: "SKO02545RCT", name: "Угольник 45° PP-RCT 25х45°", price: 87.9, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SKO03245RCT", article: "SKO03245RCT", name: "Угольник 45° PP-RCT 32x45°", price: 135, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SKO04045RCT", article: "SKO04045RCT", name: "Угольник 45° PP-RCT 40x45°", price: 239, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SKO05045RCT", article: "SKO05045RCT", name: "Угольник 45° PP-RCT 50x45°", price: 466, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SKO06345RCT", article: "SKO06345RCT", name: "Угольник 45° PP-RCT 63x45°", price: 858, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" }
    ],
    ppr_ekoplastik_tee: [
        { id: "STK020RCTX", article: "STK020RCTX", name: "Тройник PP-RCT 20", price: 53.8, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STK025RCTX", article: "STK025RCTX", name: "Тройник PP-RCT 25", price: 79.2, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STK032RCTX", article: "STK032RCTX", name: "Тройник PP-RCT 32", price: 129, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STK040RCTX", article: "STK040RCTX", name: "Тройник PP-RCT 40", price: 239, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STK050RCTX", article: "STK050RCTX", name: "Тройник PP-RCT 50", price: 498, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STK063RCTX", article: "STK063RCTX", name: "Тройник PP-RCT 63", price: 1012, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" }
    ],
    ppr_ekoplastik_tee_red: [
        { id: "STKR0252020RCT", article: "STKR0252020RCT", name: "Тройник переходной PP-RCT 25x20x20", price: 255, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR02520RCT", article: "STKR02520RCT", name: "Тройник переходной PP-RCT 25x20x25", price: 77, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "STKR03220RCT", article: "STKR03220RCT", name: "Тройник переходной PP-RCT 32x20x32", price: 145, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR0322025RCT", article: "STKR0322025RCT", name: "Тройник переходной PP-RCT 32x20x25", price: 450, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR0322525RCT", article: "STKR0322525RCT", name: "Тройник переходной PP-RCT 32x25x25", price: 303, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR03225RCT", article: "STKR03225RCT", name: "Тройник переходной PP-RCT 32x25x32", price: 160, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR04020RCT", article: "STKR04020RCT", name: "Тройник переходной PP-RCT 40x20x40", price: 341, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR04025RCT", article: "STKR04025RCT", name: "Тройник переходной PP-RCT 40x25x40", price: 352, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR04032RCT", article: "STKR04032RCT", name: "Тройник переходной PP-RCT 40x32x40", price: 381, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR05025RCT", article: "STKR05025RCT", name: "Тройник переходной PP-RCT 50x25x50", price: 560, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR05032RCT", article: "STKR05032RCT", name: "Тройник переходной PP-RCT 50x32x50", price: 541, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR05040RCT", article: "STKR05040RCT", name: "Тройник переходной PP-RCT 50x40x50", price: 741, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR06325RCT", article: "STKR06325RCT", name: "Тройник переходной PP-RCT 63x25x63", price: 1092, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR06332RCT", article: "STKR06332RCT", name: "Тройник переходной PP-RCT 63x32x63", price: 1119, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR06340RCT", article: "STKR06340RCT", name: "Тройник переходной PP-RCT 63x40x63", price: 1126, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKR06350RCT", article: "STKR06350RCT", name: "Тройник переходной PP-RCT 63x50x63", price: 1144, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKI02020RCT", article: "STKI02020RCT", name: "Тройник переходной PP-RCT 20х1/2\"", price: 446, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKI02520RCT", article: "STKI02520RCT", name: "Тройник переходной PP-RCT 25х1/2\"", price: 457, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKI02525RCT", article: "STKI02525RCT", name: "Тройник переходной PP-RCT 25х3/4\"", price: 680, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKI03220RCT", article: "STKI03220RCT", name: "Тройник переходной PP-RCT 32х1/2\"", price: 960, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKI03225RCT", article: "STKI03225RCT", name: "Тройник переходной PP-RCT 32х3/4\"", price: 803, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKI03232RCT", article: "STKI03232RCT", name: "Тройник переходной PP-RCT 32x1\"", price: 1442, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKE02020RCT", article: "STKE02020RCT", name: "Тройник переходной PP-RCT 20х1/2\"", price: 607, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKE02520RCT", article: "STKE02520RCT", name: "Тройник переходной PP-RCT 25х1/2\"", price: 642, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKE02525RCT", article: "STKE02525RCT", name: "Тройник переходной PP-RCT 25х3/4\"", price: 883, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKE03225RCT", article: "STKE03225RCT", name: "Тройник переходной PP-RCT 32х3/4\"", price: 883, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "STKE03232RCT", article: "STKE03232RCT", name: "Тройник переходной PP-RCT 32х1\"", price: 1437, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" }
    ],
    ppr_ekoplastik_adapter_fi: [
        { id: "SZI02020RCT", article: "SZI02020RCT", name: "Муфта комбинированная с ВР PP-RCT 20х1/2''", price: 347, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI02025RCT", article: "SZI02025RCT", name: "Муфта комбинированная с ВР PP-RCT 20х3/4''", price: 516, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI02520RCT", article: "SZI02520RCT", name: "Муфта комбинированная с ВР PP-RCT 25х1/2''", price: 383, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI02525RCT", article: "SZI02525RCT", name: "Муфта комбинированная с ВР PP-RCT 25х3/4''", price: 501, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI03225RCT", article: "SZI03225RCT", name: "Муфта комбинированная с ВР PP-RCT 32х3/4''", price: 805, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI03232OKRCT", article: "SZI03232OKRCT", name: "Муфта комбинированная с ВР PP-RCT 32х1''", price: 945, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI04040RCT", article: "SZI04040RCT", name: "Муфта комбинированная с ВР PP-RCT 40х1 1/4''", price: 2325, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI05050RCT", article: "SZI05050RCT", name: "Муфта комбинированная с ВР PP-RCT 50х1 1/2''", price: 3307, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZI06363RCT", article: "SZI06363RCT", name: "Муфта комбинированная с ВР PP-RCT 63х2''", price: 4985, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" }
    ],
    ppr_ekoplastik_adapter_mi: [
        { id: "SZE02020RCT", article: "SZE02020RCT", name: "Муфта комбинированная с НР PP-RCT 20х1/2''", price: 413, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE02025RCT", article: "SZE02025RCT", name: "Муфта комбинированная с НР PP-RCT 20х3/4''", price: 605, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE02520RCT", article: "SZE02520RCT", name: "Муфта комбинированная с НР PP-RCT 25х1/2''", price: 496, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE02525RCT", article: "SZE02525RCT", name: "Муфта комбинированная с НР PP-RCT 25х3/4''", price: 590, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE03225RCT", article: "SZE03225RCT", name: "Муфта комбинированная с НР PP-RCT 32х3/4''", price: 1077, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE03232RCT", article: "SZE03232RCT", name: "Муфта комбинированная с НР PP-RCT 32х1\"'", price: 965, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE03232OKRCT", article: "SZE03232OKRCT", name: "Муфта комбинированная с НР PP-RCT 32х1\"", price: 1151, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE04040RCT", article: "SZE04040RCT", name: "Муфта комбинированная с НР PP-RCT 40х1 1/4''", price: 2234, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE05050XX", article: "SZE05050XX", name: "Муфта комбинированная с НР PP-RCT 50x1 1/2\"", price: 3351, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZE06363RCT", article: "SZE06363RCT", name: "Муфта комбинированная с НР PP-RCT 63х2''", price: 4661, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSHI02020LFRCT", article: "SSHI02020LFRCT", name: "Муфта комбинированная с НР PP-RCT 20х1/2''", price: 1008, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSHI02525RCT", article: "SSHI02525RCT", name: "Муфта комбинированная с НР PP-RCT 25х3/4\"", price: 1680, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSHE02020LFRCT", article: "SSHE02020LFRCT", name: "Муфта комбинированная с НР PP-RCT 20х1/2''", price: 1242, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSHE02525RCT", article: "SSHE02525RCT", name: "Муфта комбинированная с НР PP-RCT 25х3/4\"", price: 2408, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSI02020RCT", article: "SSI02020RCT", name: "Муфта комбинированная с НР PP-RCT 20х1/2\"", price: 718, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSI02525RCT", article: "SSI02525RCT", name: "Муфта комбинированная с НР PP-RCT 25х3/4\"", price: 1111, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSI03232RCT", article: "SSI03232RCT", name: "Муфта комбинированная с НР PP-RCT 32х1\"", price: 1863, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSE02020RCT", article: "SSE02020RCT", name: "Муфта комбинированная с НР PP-RCT 20x1/2''", price: 1122, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSE02525RCT", article: "SSE02525RCT", name: "Муфта комбинированная с НР PP-RCT 25x3/4''", price: 1568, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SSE03232RCT", article: "SSE03232RCT", name: "Муфта комбинированная с НР PP-RCT 32x1''", price: 2542, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRS020RCTX", article: "SRS020RCTX", name: "Муфта комбинированная с НР PP-RCT 20", price: 828, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRS025RCTX", article: "SRS025RCTX", name: "Муфта комбинированная с НР PP-RCT 25", price: 1300, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRS032RCTX", article: "SRS032RCTX", name: "Муфта комбинированная с НР PP-RCT 32", price: 1667, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRS040RCTX", article: "SRS040RCTX", name: "Муфта комбинированная с НР PP-RCT 40", price: 2967, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZM02020RCT", article: "SZM02020RCT", name: "Муфта комбинированная с НР PP-RCT 20х1/2''", price: 690, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZM02025RCT", article: "SZM02025RCT", name: "Муфта комбинированная с НР PP-RCT 20х3/4''", price: 809, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZM02525RCT", article: "SZM02525RCT", name: "Муфта комбинированная с НР PP-RCT 25х3/4''", price: 1071, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZM02532RCT", article: "SZM02532RCT", name: "Муфта комбинированная с НР PP-RCT 25х1''", price: 1583, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SZM02025ERCT", article: "SZM02025ERCT", name: "Муфта комбинированная с НР PP-RCT 20х3/4''", price: 939, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SNAM02020RCT", article: "SNAM02020RCT", name: "Муфта комбинированная с НР PP-RCT 20x1/2''", price: 631, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SNAM02025RCT", article: "SNAM02025RCT", name: "Муфта комбинированная с НР PP-RCT 20x3/4\"", price: 562, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SNAM02525RCT", article: "SNAM02525RCT", name: "Муфта комбинированная с НР PP-RCT 25x3/4''", price: 631, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SNAM02532RCT", article: "SNAM02532RCT", name: "Муфта комбинированная с НР PP-RCT 25x1\"", price: 814, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SHM02025RCT", article: "SHM02025RCT", name: "Муфта комбинированная с НР PP-RCT 20x3/4''", price: 453, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SHM02532RCT", article: "SHM02532RCT", name: "Муфта комбинированная с НР PP-RCT 25х1\"", price: 645, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SHM03240XX", article: "SHM03240XX", name: "Муфта комбинированная с НР PP-RCT 32х1 1/4\"", price: 541, brand: "Wavin", unit: "шт", availability: "in_stock",
  price_date: '2026-07-12' }
    ],
    ppr_ekoplastik_coupling: [
        { id: "SNA020RCTX", article: "SNA020RCTX", name: "Муфта PP-RCT 20", price: 37.4, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SNA025RCTX", article: "SNA025RCTX", name: "Муфта PP-RCT 25", price: 53.8, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SNA032RCTX", article: "SNA032RCTX", name: "Муфта PP-RCT 32", price: 63.7, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SNA040RCTX", article: "SNA040RCTX", name: "Муфта PP-RCT 40", price: 160, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SNA050RCTX", article: "SNA050RCTX", name: "Муфта PP-RCT 50", price: 303, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SNA063RCTX", article: "SNA063RCTX", name: "Муфта PP-RCT 63", price: 479, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" }
    ],
    ppr_ekoplastik_coupling_red: [
        { id: "SRE02520RCT", article: "SRE02520RCT", name: "Муфта переходная PP-RCT 25x20", price: 55, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SRE03220RCT", article: "SRE03220RCT", name: "Муфта переходная PP-RCT 32x20", price: 108, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE03225RCT", article: "SRE03225RCT", name: "Муфта переходная PP-RCT 32x25", price: 111, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE12520RCT", article: "SRE12520RCT", name: "Муфта переходная PP-RCT 25x20", price: 53.8, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SRE13220RCT", article: "SRE13220RCT", name: "Муфта переходная PP-RCT 32x20", price: 105, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE13225RCT", article: "SRE13225RCT", name: "Муфта переходная PP-RCT 32x25", price: 83.5, brand: "Wavin", unit: "шт", availability: "in_stock" },
        { id: "SRE14020RCT", article: "SRE14020RCT", name: "Муфта переходная PP-RCT 40x20", price: 124, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE14025RCT", article: "SRE14025RCT", name: "Муфта переходная PP-RCT 40x25", price: 124, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE14032RCT", article: "SRE14032RCT", name: "Муфта переходная PP-RCT 40x32", price: 135, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE15025RCT", article: "SRE15025RCT", name: "Муфта переходная PP-RCT 50x25", price: 351, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE15032RCT", article: "SRE15032RCT", name: "Муфта переходная PP-RCT 50x32", price: 207, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE15040RCT", article: "SRE15040RCT", name: "Муфта переходная PP-RCT 50x40", price: 123, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE16325RCT", article: "SRE16325RCT", name: "Муфта переходная PP-RCT 63x25", price: 630, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE16332RCT", article: "SRE16332RCT", name: "Муфта переходная PP-RCT 63x32", price: 402, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE16340RCT", article: "SRE16340RCT", name: "Муфта переходная PP-RCT 63x40", price: 402, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-06-06" },
        { id: "SRE16350RCT", article: "SRE16350RCT", name: "Муфта переходная PP-RCT 63x50", price: 494, brand: "Wavin", unit: "шт", availability: "in_stock", price_date: "2026-07-12" }
    ],
    ppr_proaqua_pipe: [
        { id: "PA39008", article: "PA39008", price: 138.56, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R DUO SDR 6 20 мм", unit: "шт" },
        { id: "PA39010", article: "PA39010", price: 202.08, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R DUO SDR 6 25 мм", unit: "шт" },
        { id: "PA39012", article: "PA39012", price: 365.76, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R DUO SDR 6 32 мм", unit: "шт" },
        { id: "PA39014", article: "PA39014", price: 555.84, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R DUO SDR 6 40 мм", unit: "шт" },
        { id: "PA39016", article: "PA39016", price: 848.64, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R DUO SDR 6 50 мм", unit: "шт" },
        { id: "PA39018", article: "PA39018", price: 1312, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R DUO SDR 6 63 мм", unit: "шт" },
        { id: "PA39020", article: "PA39020", price: 2146.28, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R DUO SDR 6 75 мм", unit: "шт" },

        // Армирование стекловолокном (RUBIS) — та самая «труба стекло» из
        // рукописных смет. DUO выше армирована фольгой, это другая труба.
        // Цены — прайс 07.2026, за штангу 4 м.
        { id: "PA35008P", article: "PA35008P", price: 101.14, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 7,4 PN 20 20x2,8", unit: "шт", price_date: "2026-07-19" },
        { id: "PA35010P", article: "PA35010P", price: 148.84, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 7,4 PN 20 25x3,5", unit: "шт", price_date: "2026-07-19" },
        { id: "PA35012P", article: "PA35012P", price: 243.07, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 7,4 PN 20 32x4,4", unit: "шт", price_date: "2026-07-19" },
        { id: "PA35014P", article: "PA35014P", price: 377.08, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 7,4 PN 20 40x5,5", unit: "шт", price_date: "2026-07-19" },
        { id: "PA35016P", article: "PA35016P", price: 622.14, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 7,4 PN 20 50x6,9", unit: "шт", price_date: "2026-07-19" },
        { id: "PA35018P", article: "PA35018P", price: 982.14, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 7,4 PN 20 63x8,6", unit: "шт", price_date: "2026-07-19" },
        { id: "PA35020P", article: "PA35020P", price: 1335.73, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 7,4 PN 20 75x10,3", unit: "шт", price_date: "2026-07-19" },

        { id: "PA37008P", article: "PA37008P", price: 110.46, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 6 PN 25 20x3,4", unit: "шт", price_date: "2026-07-19" },
        { id: "PA37010P", article: "PA37010P", price: 167.74, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 6 PN 25 25x4,2", unit: "шт", price_date: "2026-07-19" },
        { id: "PA37012P", article: "PA37012P", price: 281.1, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 6 PN 25 32x5,4", unit: "шт", price_date: "2026-07-19" },
        { id: "PA37014P", article: "PA37014P", price: 450.89, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 6 PN 25 40x6,7", unit: "шт", price_date: "2026-07-19" },
        { id: "PA37016P", article: "PA37016P", price: 695.61, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 6 PN 25 50x8,3", unit: "шт", price_date: "2026-07-19" },
        { id: "PA37018P", article: "PA37018P", price: 1104.76, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 6 PN 25 63x10,5", unit: "шт", price_date: "2026-07-19" },
        { id: "PA37020P", article: "PA37020P", price: 1583.76, brand: "ProAqua", availability: "in_stock", name: "Труба PP-R RUBIS стекловолокно SDR 6 PN 25 75x12,5", unit: "шт", price_date: "2026-07-19" }
    ],
    ppr_proaqua_elbow90: [
        { id: "PA13008P", article: "PA13008P", price: 10.08, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 20 мм", unit: "шт" },
        { id: "PA13010P", article: "PA13010P", price: 16.11, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 25 мм", unit: "шт" },
        { id: "PA13012P", article: "PA13012P", price: 31.94, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 32 мм", unit: "шт" },
        { id: "PA13014P", article: "PA13014P", price: 59.79, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 40 мм", unit: "шт" },
        { id: "PA13016P", article: "PA13016P", price: 106.26, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 50 мм", unit: "шт" },
        { id: "PA13018P", article: "PA13018P", price: 212.65, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 63 мм", unit: "шт" },
        { id: "PA13020P", article: "PA13020P", price: 423.81, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 75 мм", unit: "шт" },
        { id: "PA13022P", article: "PA13022P", price: 665.21, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 90 мм", unit: "шт" },
        { id: "PA13024P", article: "PA13024P", price: 916.69, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° PP-R 110 мм", unit: "шт" }
    ],
    ppr_proaqua_elbow45: [
        { id: "PA13508P", article: "PA13508P", price: 8.91, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 20 мм", unit: "шт" },
        { id: "PA13510P", article: "PA13510P", price: 13.16, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 25 мм", unit: "шт" },
        { id: "PA13512P", article: "PA13512P", price: 25.72, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 32 мм", unit: "шт" },
        { id: "PA13514P", article: "PA13514P", price: 55.56, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 40 мм", unit: "шт" },
        { id: "PA13516P", article: "PA13516P", price: 93.98, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 50 мм", unit: "шт" },
        { id: "PA13518P", article: "PA13518P", price: 150.65, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 63 мм", unit: "шт" },
        { id: "PA13520P", article: "PA13520P", price: 372.46, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 75 мм", unit: "шт" },
        { id: "PA13522P", article: "PA13522P", price: 657.45, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 90 мм", unit: "шт" },
        { id: "PA13524", article: "PA13524", price: 669, brand: "ProAqua", availability: "in_stock", name: "Угольник 45° PP-R 110 мм", unit: "шт",
  price_date: '2026-07-12' }
    ],
    ppr_proaqua_tee: [
        { id: "PA14008P", article: "PA14008P", price: 13.73, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 20 мм", unit: "шт" },
        { id: "PA14010P", article: "PA14010P", price: 21.14, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 25 мм", unit: "шт" },
        { id: "PA14012P", article: "PA14012P", price: 40.89, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 32 мм", unit: "шт" },
        { id: "PA14014P", article: "PA14014P", price: 72.08, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 40 мм", unit: "шт" },
        { id: "PA14016P", article: "PA14016P", price: 130.75, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 50 мм", unit: "шт" },
        { id: "PA14018P", article: "PA14018P", price: 263.7, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 63 мм", unit: "шт" },
        { id: "PA14020P", article: "PA14020P", price: 450.98, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 75 мм", unit: "шт" },
        { id: "PA14022P", article: "PA14022P", price: 874.71, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 90 мм", unit: "шт" },
        { id: "PA14024P", article: "PA14024P", price: 1337.12, brand: "ProAqua", availability: "in_stock", name: "Тройник PP-R 110 мм", unit: "шт" }
    ],
    ppr_proaqua_tee_red: [
        { id: "PA14518P", article: "PA14518P", price: 22.8, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 20х25х20", unit: "шт" },
        { id: "PA14520P", article: "PA14520P", price: 22, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 25х20х20", unit: "шт" },
        { id: "PA14521P", article: "PA14521P", price: 22.11, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 25х20х25", unit: "шт" },
        { id: "PA14522P", article: "PA14522P", price: 27.24, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 25х25х20", unit: "шт" },
        { id: "PA14530P", article: "PA14530P", price: 34.95, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 32х20х20", unit: "шт" },
        { id: "PA14531P", article: "PA14531P", price: 47.82, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 32х20х25", unit: "шт" },
        { id: "PA14532P", article: "PA14532P", price: 34.15, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 32х20х32", unit: "шт" },
        { id: "PA14533P", article: "PA14533P", price: 36.23, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 32х25х20", unit: "шт" },
        { id: "PA14534P", article: "PA14534P", price: 37.75, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 32х25х25", unit: "шт" },
        { id: "PA14535P", article: "PA14535P", price: 34.18, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 32х25х32", unit: "шт" },
        { id: "PA14540P", article: "PA14540P", price: 64.95, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 40х20х40", unit: "шт" },
        { id: "PA14541P", article: "PA14541P", price: 64.19, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 40х25х40", unit: "шт" },
        { id: "PA14542P", article: "PA14542P", price: 69.5, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 40х32х40", unit: "шт" },
        { id: "PA14559P", article: "PA14559P", price: 94.75, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 50х20х50", unit: "шт" },
        { id: "PA14550P", article: "PA14550P", price: 114.25, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 50х25х50", unit: "шт" },
        { id: "PA14551P", article: "PA14551P", price: 126.38, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 50х32х50", unit: "шт" },
        { id: "PA14552P", article: "PA14552P", price: 166.86, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 50х40х50", unit: "шт" },
        { id: "PA14560P", article: "PA14560P", price: 196.94, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 63х20х63", unit: "шт" },
        { id: "PA14562P", article: "PA14562P", price: 202.11, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 63х25х63", unit: "шт" },
        { id: "PA14563P", article: "PA14563P", price: 206.79, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 63х32х63", unit: "шт" },
        { id: "PA14564P", article: "PA14564P", price: 244.61, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 63х40х63", unit: "шт" },
        { id: "PA14565P", article: "PA14565P", price: 337.54, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 63х50х63", unit: "шт" },
        { id: "PA14570P", article: "PA14570P", price: 349, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 75х25х75", unit: "шт",
  price_date: '2026-07-12' },
        { id: "PA14571P", article: "PA14571P", price: 353, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 75х32х75", unit: "шт",
  price_date: '2026-07-12' },
        { id: "PA14572P", article: "PA14572P", price: 550.3, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 75х40х75", unit: "шт" },
        { id: "PA14573P", article: "PA14573P", price: 514, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 75х50х75", unit: "шт",
  price_date: '2026-07-12' },
        { id: "PA14574P", article: "PA14574P", price: 561.95, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 75х63х75", unit: "шт" },
        { id: "PA14578P", article: "PA14578P", price: 604.58, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 90х40х90", unit: "шт" },
        { id: "PA14580P", article: "PA14580P", price: 982.4, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 90х50х90", unit: "шт" },
        { id: "PA14582P", article: "PA14582P", price: 1074.21, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 90х63х90", unit: "шт" },
        { id: "PA14584P", article: "PA14584P", price: 1094.91, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 90х75х90", unit: "шт" },
        { id: "PA14586", article: "PA14586", price: 1095.86, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 110х50х110", unit: "шт" },
        { id: "PA14596P", article: "PA14596P", price: 1300.7, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 110х63х110", unit: "шт" },
        { id: "PA14598P", article: "PA14598P", price: 1769.77, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 110х75х110", unit: "шт" },
        { id: "PA14600P", article: "PA14600P", price: 1846.48, brand: "ProAqua", availability: "in_stock", name: "Тройник переходной PP-R 110х90х110", unit: "шт" }
    ],
    ppr_proaqua_adapter_fi: [
        { id: "PA22008P", article: "PA22008P", price: 92.17, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 20х1/2", unit: "шт" },
        { id: "PA22010P", article: "PA22010P", price: 142.69, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 20х3/4", unit: "шт" },
        { id: "PA22012P", article: "PA22012P", price: 99.46, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 25х1/2", unit: "шт" },
        { id: "PA22014P", article: "PA22014P", price: 139.37, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 25х3/4", unit: "шт" },
        { id: "PA22013P", article: "PA22013P", price: 175, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 25х1", unit: "шт",
  price_date: '2026-07-12' },
        { id: "PA22015P", article: "PA22015P", price: 149.64, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 32х1/2", unit: "шт" },
        { id: "PA22016P", article: "PA22016P", price: 150.68, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 32х3/4", unit: "шт" },
        { id: "PA22018P", article: "PA22018P", price: 257.94, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 32х1", unit: "шт" },
        { id: "PA22020", article: "PA22020", price: 321.65, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная ВР PP-R 40х1", unit: "шт" }
    ],
    ppr_proaqua_adapter_mi: [
        { id: "PA23008P", article: "PA23008P", price: 130.76, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 20х1/2", unit: "шт" },
        { id: "PA23010P", article: "PA23010P", price: 198.98, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 20х3/4", unit: "шт" },
        { id: "PA23012P", article: "PA23012P", price: 138.21, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 25х1/2", unit: "шт" },
        { id: "PA23014P", article: "PA23014P", price: 195.98, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 25х3/4", unit: "шт" },
        { id: "PA23013P", article: "PA23013P", price: 175, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 25х1", unit: "шт",
  price_date: '2026-07-12' },
        { id: "PA23015P", article: "PA23015P", price: 181.01, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 32х1/2", unit: "шт" },
        { id: "PA23016P", article: "PA23016P", price: 200.89, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 32х3/4", unit: "шт" },
        { id: "PA23018P", article: "PA23018P", price: 357.57, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 32х1", unit: "шт" },
        { id: "PA23020", article: "PA23020", price: 434.35, brand: "ProAqua", availability: "in_stock", name: "Муфта комбинированная НР PP-R 40х1", unit: "шт" }
    ],
    ppr_proaqua_coupling: [
        { id: "PA12008P", article: "PA12008P", price: 7.38, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 20 мм", unit: "шт" },
        { id: "PA12010P", article: "PA12010P", price: 11.18, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 25 мм", unit: "шт" },
        { id: "PA12012P", article: "PA12012P", price: 20.45, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 32 мм", unit: "шт" },
        { id: "PA12014P", article: "PA12014P", price: 38.44, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 40 мм", unit: "шт" },
        { id: "PA12016P", article: "PA12016P", price: 62.17, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 50 мм", unit: "шт" },
        { id: "PA12018P", article: "PA12018P", price: 119.54, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 63 мм", unit: "шт" },
        { id: "PA12020P", article: "PA12020P", price: 226.1, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 75 мм", unit: "шт" },
        { id: "PA12022P", article: "PA12022P", price: 370.8, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 90 мм", unit: "шт" },
        { id: "PA12024P", article: "PA12024P", price: 694.01, brand: "ProAqua", availability: "in_stock", name: "Муфта соединительная PP-R 110 мм", unit: "шт" }
    ],
    ppr_proaqua_coupling_red: [
        { id: "PA12512P", article: "PA12512P", price: 9.1, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 25х20", unit: "шт" },
        { id: "PA12514P", article: "PA12514P", price: 15.02, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 32х20", unit: "шт" },
        { id: "PA12516P", article: "PA12516P", price: 16.88, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 32х25", unit: "шт" },
        { id: "PA12518P", article: "PA12518P", price: 24.61, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 40х20", unit: "шт" },
        { id: "PA12520P", article: "PA12520P", price: 25.99, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 40х25", unit: "шт" },
        { id: "PA12522P", article: "PA12522P", price: 29.36, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 40х32", unit: "шт" },
        { id: "PA12524P", article: "PA12524P", price: 40.86, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 50х20", unit: "шт" },
        { id: "PA12526P", article: "PA12526P", price: 42.82, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 50х25", unit: "шт" },
        { id: "PA12528P", article: "PA12528P", price: 46.14, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 50х32", unit: "шт" },
        { id: "PA12530P", article: "PA12530P", price: 54.35, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 50х40", unit: "шт" },
        { id: "PA12531", article: "PA12531", price: 70.82, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 63х20", unit: "шт" },
        { id: "PA12532P", article: "PA12532P", price: 69.88, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 63х25", unit: "шт" },
        { id: "PA12534P", article: "PA12534P", price: 72.49, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 63х32", unit: "шт" },
        { id: "PA12536P", article: "PA12536P", price: 76.08, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 63х40", unit: "шт" },
        { id: "PA12538P", article: "PA12538P", price: 93.1, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 63х50", unit: "шт" },
        { id: "PA12540P", article: "PA12540P", price: 168.27, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 75х50", unit: "шт" },
        { id: "PA12542P", article: "PA12542P", price: 212.16, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 75х63", unit: "шт" },
        { id: "PA12544P", article: "PA12544P", price: 260.66, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 90х63", unit: "шт" },
        { id: "PA12546P", article: "PA12546P", price: 347.22, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 90х75", unit: "шт" },
        { id: "PA12547P", article: "PA12547P", price: 175, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 110х75", unit: "шт",
  price_date: '2026-07-12' },
        { id: "PA12548P", article: "PA12548P", price: 464.42, brand: "ProAqua", availability: "in_stock", name: "Муфта переходная PP-R 110х90", unit: "шт" }
    ],
    // Позиции PRO AQUA, которых не хватало распознаванию: резьбовые углы
    // и тройники, американки, клипсы и опоры. Взяты из прайса
    // Prays_list_07.2026.xlsx, лист «Pro Aqua PPR».
    ppr_proaqua_elbow_mi: [
        { id: "PA27008P", article: "PA27008P", price: 139.98, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный НР PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA27010P", article: "PA27010P", price: 214.49, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный НР PP-R 20х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA27012P", article: "PA27012P", price: 156.33, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный НР PP-R 25х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA27014P", article: "PA27014P", price: 204.22, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный НР PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA27015", article: "PA27015", price: 204.5, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный НР PP-R 32х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA27016P", article: "PA27016P", price: 225.54, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный НР PP-R 32х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA27018P", article: "PA27018P", price: 432.16, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный НР PP-R 32х1", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_elbow_fi: [
        { id: "PA26008P", article: "PA26008P", price: 103.7, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный ВР PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA26010P", article: "PA26010P", price: 159.89, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный ВР PP-R 20х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA26012P", article: "PA26012P", price: 114.95, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный ВР PP-R 25х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA26014P", article: "PA26014P", price: 158.1, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный ВР PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA26015", article: "PA26015", price: 159.16, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный ВР PP-R 32х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA26016P", article: "PA26016P", price: 169.48, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный ВР PP-R 32х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA26018P", article: "PA26018P", price: 275.09, brand: "ProAqua", availability: "in_stock", name: "Угольник 90° комбинированный ВР PP-R 32х1", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_tee_mi: [
        { id: "PA25008P", article: "PA25008P", price: 152, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный НР PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA25010P", article: "PA25010P", price: 233.52, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный НР PP-R 20х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA25014P", article: "PA25014P", price: 226.31, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный НР PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA25012P", article: "PA25012P", price: 165.81, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный НР PP-R 25х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA25015", article: "PA25015", price: 226.86, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный НР PP-R 32х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA25016P", article: "PA25016P", price: 246.42, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный НР PP-R 32х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA25018P", article: "PA25018P", price: 390.11, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный НР PP-R 32х1", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_tee_fi: [
        { id: "PA24008P", article: "PA24008P", price: 108.93, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный ВР PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA24010P", article: "PA24010P", price: 181.11, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный ВР PP-R 20х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA24012P", article: "PA24012P", price: 120.49, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный ВР PP-R 25х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA24014P", article: "PA24014P", price: 169.59, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный ВР PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA24015", article: "PA24015", price: 168.2, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный ВР PP-R 32х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA24016P", article: "PA24016P", price: 178.79, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный ВР PP-R 32х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA24018P", article: "PA24018P", price: 289.27, brand: "ProAqua", availability: "in_stock", name: "Тройник комбинированный ВР PP-R 32х1", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_union_fi: [
        { id: "PA20008", article: "PA20008", price: 257.75, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20010", article: "PA20010", price: 274.84, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 20х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20011", article: "PA20011", price: 461.05, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 20х1", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20012", article: "PA20012", price: 391.64, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 25х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20014", article: "PA20014", price: 396.27, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20015", article: "PA20015", price: 433.31, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 25х1", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20016", article: "PA20016", price: 513.8, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 32х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20018", article: "PA20018", price: 515.91, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 32х1", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20019", article: "PA20019", price: 568.78, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 32х1.1/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20020", article: "PA20020", price: 727.55, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 40х1.1/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20021", article: "PA20021", price: 1116.03, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 40х1.1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20022", article: "PA20022", price: 1338.28, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 50х1.1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20023", article: "PA20023", price: 1637.25, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 50х2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20024", article: "PA20024", price: 2010.94, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 63х2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA20026", article: "PA20026", price: 7264.94, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) ВР PP-R 75х2.1/2", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_union_mi: [
        { id: "PA21008", article: "PA21008", price: 289.45, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21010", article: "PA21010", price: 326.26, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 20х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21011", article: "PA21011", price: 532.46, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 20х1", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21012", article: "PA21012", price: 425.13, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 25х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21014", article: "PA21014", price: 443.01, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21015", article: "PA21015", price: 519.09, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 25х1", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21016", article: "PA21016", price: 555.19, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 32х3/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21018", article: "PA21018", price: 642.4, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 32х1", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21019", article: "PA21019", price: 722.76, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 32х1.1/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21020", article: "PA21020", price: 952.73, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 40х1.1/4", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21021", article: "PA21021", price: 1518.83, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 40х1.1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21022", article: "PA21022", price: 1606.63, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 50х1.1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21023", article: "PA21023", price: 2324.54, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 50х2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21024", article: "PA21024", price: 2402.22, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 63х2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA21026", article: "PA21026", price: 7393.27, brand: "ProAqua", availability: "in_stock", name: "Муфта разъемная (американка) НР PP-R 75х2.1/2", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_clip: [
        { id: "PA18006P", article: "PA18006P", price: 4.21, brand: "ProAqua", availability: "in_stock", name: "Клипса одинарная PP-R 16", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18008P", article: "PA18008P", price: 5.22, brand: "ProAqua", availability: "in_stock", name: "Клипса одинарная PP-R 20", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18010P", article: "PA18010P", price: 6.76, brand: "ProAqua", availability: "in_stock", name: "Клипса одинарная PP-R 25", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18012P", article: "PA18012P", price: 8.17, brand: "ProAqua", availability: "in_stock", name: "Клипса одинарная PP-R 32", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18014P", article: "PA18014P", price: 14.96, brand: "ProAqua", availability: "in_stock", name: "Клипса одинарная PP-R 40", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18016P", article: "PA18016P", price: 25.44, brand: "ProAqua", availability: "in_stock", name: "Клипса одинарная PP-R 50", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18018P", article: "PA18018P", price: 32.66, brand: "ProAqua", availability: "in_stock", name: "Клипса одинарная PP-R 63", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_support: [
        { id: "PA18908", article: "PA18908", price: 7.86, brand: "ProAqua", availability: "in_stock", name: "Опора с защелкой PP-R 20", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18910", article: "PA18910", price: 10.22, brand: "ProAqua", availability: "in_stock", name: "Опора с защелкой PP-R 25", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18912", article: "PA18912", price: 13.58, brand: "ProAqua", availability: "in_stock", name: "Опора с защелкой PP-R 32", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18914", article: "PA18914", price: 14.47, brand: "ProAqua", availability: "in_stock", name: "Опора с защелкой PP-R 40", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18916", article: "PA18916", price: 18.19, brand: "ProAqua", availability: "in_stock", name: "Опора с защелкой PP-R 50", unit: "шт", price_date: "2026-07-01" },
        { id: "PA18918", article: "PA18918", price: 34.32, brand: "ProAqua", availability: "in_stock", name: "Опора с защелкой PP-R 63", unit: "шт", price_date: "2026-07-01" }
    ],

    // Полипропиленовая запорная арматура (прайс Pro Aqua PPR, 07.2026).
    // В рукописных сметах это «кран ппр»: приваривается в трубу, отдельной
    // латунной арматурой не заменяется.
    ppr_proaqua_valve: [
        { id: "PA40008", article: "PA40008", price: 373.54, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран полнопроходной Ultra PP-R 20", unit: "шт", price_date: "2026-07-01" },
        { id: "PA40010", article: "PA40010", price: 511.9, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран полнопроходной Ultra PP-R 25", unit: "шт", price_date: "2026-07-01" },
        { id: "PA40012", article: "PA40012", price: 966.07, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран полнопроходной Ultra PP-R 32", unit: "шт", price_date: "2026-07-01" },
        { id: "PA40014", article: "PA40014", price: 1254.68, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран полнопроходной Ultra PP-R 40", unit: "шт", price_date: "2026-07-01" },
        { id: "PA40016", article: "PA40016", price: 2228.27, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран полнопроходной Ultra PP-R 50", unit: "шт", price_date: "2026-07-01" },
        { id: "PA40018", article: "PA40018", price: 3405.67, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран полнопроходной Ultra PP-R 63", unit: "шт", price_date: "2026-07-01" },
        { id: "PA40020", article: "PA40020", price: 4118.77, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран полнопроходной Ultra PP-R 75", unit: "шт", price_date: "2026-07-01" }
    ],
    // Радиаторные краны с накидной гайкой — те самые «краны с американкой».
    // Прямой и угловой разнесены, потому что в смете их различают («уг»).
    ppr_proaqua_valve_rad: [
        { id: "PA41008", article: "PA41008", price: 609.6, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран для радиатора прямой PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA41010", article: "PA41010", price: 898.37, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран для радиатора прямой PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" }
    ],
    ppr_proaqua_valve_rad_angle: [
        { id: "PA42108", article: "PA42108", price: 595.27, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран для радиатора угловой PP-R 20х1/2", unit: "шт", price_date: "2026-07-01" },
        { id: "PA42110", article: "PA42110", price: 884.84, brand: "ProAqua", availability: "in_stock", name: "Шаровой кран для радиатора угловой PP-R 25х3/4", unit: "шт", price_date: "2026-07-01" }
    ],

    mounting_system: [
        { id: "ASKON-83115", name: "Кронштейн для расширительного бака L-образный", price: 420, brand: "Askon", availability: "in_stock" },
        { id: "SAC-0020-000012", name: "Хомут для труб с гайкой 1/2\" (20–24 мм)", price: 39, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000034", name: "Хомут для труб с гайкой 3/4\" (25–29 мм)", price: 48, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000001", name: "Хомут для труб с гайкой 1\" (32–37 мм)", price: 52, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000114", name: "Хомут для труб с гайкой 1 1/4\" (40–45 мм)", price: 56, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000112", name: "Хомут для труб с гайкой 1 1/2\" (47–52 мм)", price: 59, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000002", name: "Хомут для труб с гайкой 2\" (57–63 мм)", price: 61, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000212", name: "Хомут для труб с гайкой 2 1/2\" (75–80 мм)", price: 112, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000003", name: "Хомут для труб с гайкой 3\" (88–94 мм)", price: 122, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-000004", name: "Хомут для труб с гайкой 4\" (113–118 мм)", price: 143, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-010004", name: "Хомут для труб тяжелой серии с гайкой 4\" (108–116 мм)", price: 162, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-300012", name: "Хомут для труб одновинтовой с гайкой M8 1/2\" (20–23 мм)", price: 55, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-300034", name: "Хомут для труб одновинтовой с гайкой M8 3/4\" (25–28 мм)", price: 60, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-300001", name: "Хомут для труб одновинтовой с гайкой M8 1\" (31–35 мм)", price: 65, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-300114", name: "Хомут для труб одновинтовой с гайкой M8 1 1/4\" (40–45 мм)", price: 75, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-300112", name: "Хомут для труб одновинтовой с гайкой M8 1 1/2\" (48–52 мм)", price: 82, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-300002", name: "Хомут для труб одновинтовой с гайкой M8 2\" (57–60 мм)", price: 131, brand: "STOUT", availability: "in_stock",
  price_date: '2026-07-12' },
        { id: "SAC-0020-200012", name: "Хомут для труб двойной с гайкой 1/2\" (20–24 мм)", price: 140, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-200034", name: "Хомут для труб двойной с гайкой 3/4\" (25–29 мм)", price: 147, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-200038", name: "Хомут для труб двойной с гайкой 3/8\" (14–18 мм)", price: 131, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-200001", name: "Хомут для труб двойной с гайкой 1\" (32–35 мм)", price: 156, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-300014", name: "Хомут для труб одновинтовой с гайкой M8 1/4\" (12–15 мм)", price: 48, brand: "STOUT", availability: "on_order", price_date: "2026-08-10" },
        { id: "SAC-0020-300038", name: "Хомут для труб одновинтовой с гайкой M8 3/8\" (16–19 мм)", price: 50, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0021-281530", name: "Консоль монтажная перфорированная 28х15х300 мм", price: 889, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0022-283020", name: "Профиль монтажный перфорированный С-образный 28х30х2000 мм", price: 1863, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0030-000825", name: "Комплект крепления мембранных расширительных баков 8–25 л", price: 1266, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-503120", name: "Шина сантехническая (монтажный профиль) 50x3x1200 мм", price: 1254, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-503200", name: "Шина сантехническая (монтажный профиль) 50x3x2000 мм", price: 1819, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-400100", name: "Шпилька сантехническая M8x100 в комплекте с дюбелем M10x50", price: 22, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-411040", name: "Анкер забивной стальной M10х12х40 мм", price: 23, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0020-421040", name: "Анкер забивной стальной M10х12х35 мм", price: 82, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SAC-0022-600001", name: "Монтажная планка одинарная", price: 141, brand: "STOUT", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SAC-0022-600100", name: "Монтажная планка двойная 100мм", price: 910, brand: "STOUT", availability: "in_stock", price_date: "2026-07-12" },
        { id: "SAC-0022-600150", name: "Монтажная планка двойная 150мм", price: 910, brand: "STOUT", availability: "in_stock", price_date: "2026-07-12" }
    ],
    ufh_mat: [
        { id: "RMF-0001-032530", name: "Подложка для теплого пола 3 мм / 25 м × 1.2 м (30 м²)", thick: 3, len: 25, width: 1.2, pack_m2: 30, price: 2667.90, unit: "рул.", brand: "ROMMER", availability: "in_stock", price_date: "2026-06-30" }
    ],

    // Автоматика котельной: контроллер отопления и блоки расширения к нему.
    // Подбирается в app.render() по state.boilerAuto, конфигурация системы
    // выводится функцией app.getThermaticConfig().
    //
    // Thermatic 3001 — это ZONT CLIMATIC.V2 под маркой STOUT (в прайсе ТЕРЕМ
    // ML00007105 стоит ровно столько же), поэтому к нему подходят блоки
    // расширения и аксессуары ZONT. Своего артикула SMH-3001-104212 в прайсе
    // пока нет — цена живёт только здесь и автообновлением не подхватывается.
    boiler_automation: [
        { id: "SMH-3001-104212", name: "Контроллер Thermatic 3001", price: 67000, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        // Блоки расширения контуров по шине RS-485. EX-108 даёт +3 контура и
        // питается от контроллера, EX-77 даёт +2, но требует отдельный БП 12 В.
        { id: "ML00007406", name: "Блок расширения EX-108 (+3 контура отопления)", price: 27900, brand: "ZONT", unit: "шт", circuits: 3, availability: "in_stock", price_date: "2026-07-29" },
        { id: "ML00004766", name: "Блок расширения EX-77 (+2 контура отопления)", price: 16100, brand: "ZONT", unit: "шт", circuits: 2, availability: "in_stock", price_date: "2026-07-29" },
        { id: "ML13968", name: "Блок питания 12 Вт / 12–24 В на DIN-рейку", price: 2700, brand: "ZONT", unit: "шт", availability: "in_stock", price_date: "2026-07-29" },
        // Датчик давления на аналоговый вход. Автоподпиткой контроллер не
        // управляет (такой функции у него нет), но по порогам этого датчика
        // шлёт оповещение — только так и вскрывается утечка, которую
        // автоподпиточный клапан иначе доливает молча.
        { id: "ML00005517", name: "Датчик давления MLD-10.01, нерж. сталь, 0–10 бар", price: 6360, brand: "ZONT", unit: "шт", availability: "in_stock", price_date: "2026-07-29" },
        // Плата цифровой шины: одна на котёл, максимум две. Разъёмы ЦШ1 и ЦШ2
        // на плате контроллера из коробки пустые. В прайсе позиция названа
        // «для ZONT CLIMATIC» — это тот же прибор, Thermatic 3001 = Climatic.V2.
        // Поддерживаемые протоколы (OpenTherm, E-Bus, BridgeNet, Navien, BSB,
        // WOLF, Kiturami) плата определяет сама — в названии их не перечисляем,
        // они есть в подсказке к позиции.
        { id: "ML00005842", name: "Плата цифровых шин универсальная", price: 4500, brand: "ZONT", unit: "шт", availability: "in_stock", price_date: "2026-07-29" },
        // Выносная панель ручного управления, до 3 шт на контроллер.
        { id: "ML00004742", name: "Панель ручного управления МЛ-753 (RS-485)", price: 8990, brand: "ZONT", unit: "шт", availability: "in_stock", price_date: "2026-07-29" },

        // --- Базовый уровень: STOUT Thermatic 1002 (sys: 'basic') ---
        //
        // Тот же приём, что и с 3001: Thermatic 1002 — это ectoControl под
        // маркой STOUT. В прайсе ТЕРЕМ есть раздел Ectocontrol, и цены
        // комплектующих совпадают до рубля (ec01001 = 1390, ec01003 = 1590,
        // ec01042 = 3590 и так далее); сам блок там лежит как ec01v40 за
        // 18 900 ₽ — это ectoControl v4.0, у STOUT на него своя цена.
        // Артикулов SMH-… в прайсе ТЕРЕМ нет, значит AutoPrice эти цены не
        // подхватит: сверяться с разделом Ectocontrol раз в квартал руками.
        //
        // Что прибор умеет (инструкция, п. 1.3 и 4.7): два котловых контура с
        // каскадом и ротацией, два контура-потребителя (отопление и ГВС), ПЗА
        // по уличному датчику. Чего у него нет — смесительных контуров:
        // насосом и приводом смесителя он не управляет вовсе, поэтому берётся
        // на котельную без смесительных узлов (см. app.boilerAutoModel).
        { id: "SMH-1002-105210", name: "Контроллер Thermatic 1002", price: 15900, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        // Первый котёл идёт по встроенной шине (OpenTherm, eBus, Navien,
        // Rinnai, BSB — все в самом приборе), поэтому адаптер покупается
        // только на второй котёл. Это и есть главная разница с 3001, где
        // разъёмы ЦШ1 и ЦШ2 из коробки пустые и плату надо брать на каждый.
        { id: "SMH-0002-010570", name: "Адаптер цифровой шины OpenTherm, DIN, RS-485", price: 3590, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        // Датчики температуры. Проводных входов у прибора два (Т1, Т2), и один
        // датчик в гильзе уже лежит в коробке. Всё, что не влезло в два входа,
        // подключается по шине RS-485 — те же датчики, но вдвое дороже.
        { id: "SMH-0002-010030", name: "Датчик температуры проводной, в гильзе", price: 1590, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        { id: "SMH-0002-010040", name: "Датчик температуры проводной в гильзе, RS-485", price: 3390, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        { id: "SMH-0002-010010", name: "Датчик температуры воздуха проводной", price: 1390, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        // Тот же артикул есть и в air_sensors — там он комнатный датчик для
        // регулирования по воздуху, здесь уличный для ПЗА. Позиция одна и та
        // же, роли разные, и в смете это разные строки с разными подсказками.
        { id: "SMH-0002-010020", name: "Датчик температуры воздуха проводной, RS-485", price: 3190, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        // Реле у прибора одно, встроенное (250 В / 3 А, переключающая группа).
        // Оно достаётся крану защиты от протечки — четырёхполюсному приводу
        // нужен именно переключающий контакт. Всё остальное, что надо
        // включать и выключать (насос загрузки бойлера, рециркуляция,
        // релейный котёл), просит отдельного выхода.
        { id: "SMH-0002-010790", name: "Беспроводное реле 10 А, LoRa", price: 4590, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        { id: "SMH-0002-010210", name: "Блок управления двумя розетками, RS-485", price: 3290, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        // Манометр с электроконтактной приставкой — аналог датчика давления
        // ZONT у 3001, но заходит не на аналоговый вход, а в шлейф «сухих
        // контактов» Д1: он даёт не число, а «норма/тревога» (инструкция, п. 6.4).
        { id: "SMH-0002-010100", name: "Датчик давления (манометр электроконтактный), проводной", price: 3590, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        // Шлейф Д1 у контроллера один, поэтому второй и следующие контактные
        // датчики заходят через разветвитель. Безадресный дешевле, но все
        // датчики на нём неразличимы — тревога общая. Как только в шлейфе
        // разные по смыслу датчики (протечка и давление), нужен адресный:
        // иначе реакция «перекрыть воду» сработает и от падения давления.
        { id: "SMH-0002-010320", name: "Разветвитель контактных датчиков", price: 500, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        { id: "SMH-0002-010550", name: "Разветвитель контактных датчиков адресный, RS-485", price: 1990, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" }
    ],

    // Датчики воздуха для регулирования отопительного контура по температуре
    // помещения. Каждому нужна привязка к своему контуру — без неё контроллер
    // регулировать по воздуху не может, датчик работает только на мониторинг.
    // Теплоноситель ими мерить нельзя, для этого есть штатные NTC.
    //
    // link: 'wired'  — по шине RS-485, витая пара, до 200 м;
    // link: 'radio'  — 868 МГц, требует радиомодуль МЛ-590 (до 40 устройств).
    // kind: 'sensor' — только датчик; 'thermostat' — датчик со своей уставкой
    //                  и экраном в помещении.
    air_sensors: [
        { id: "ML00005143", name: "Датчик температуры комнатный МЛ-778 (RS-485)", price: 3100, brand: "ZONT", unit: "шт", kind: "sensor", link: "wired", availability: "in_stock", price_date: "2026-07-29" },
        { id: "ML00004436", name: "Радиодатчик температуры комнатный МЛ-740 (868 МГц)", price: 3450, brand: "ZONT", unit: "шт", kind: "sensor", link: "radio", availability: "in_stock", price_date: "2026-07-29" },
        { id: "ML00006088", name: "Комнатный термостат МЛ-232 (RS-485)", price: 6100, brand: "ZONT", unit: "шт", kind: "thermostat", link: "wired", availability: "in_stock", price_date: "2026-07-29" },
        { id: "ML00006557", name: "Комнатный термостат МЛ-332 (868 МГц)", price: 6900, brand: "ZONT", unit: "шт", kind: "thermostat", link: "radio", availability: "in_stock", price_date: "2026-07-29" },
        // Двухпозиционные термостаты STOUT (3 А, ON/OFF). Подключаются иначе —
        // не по шине, а сухим контактом на клеммы «Входы термостатов», которых
        // у контроллера ровно 3. Меняется и способ регулирования: контур
        // работает в режиме «Термостат», то есть греет, пока термостат
        // разомкнут, а расчётную температуру подачи контроллер уже не ведёт.
        //
        // Берём только исполнения «универсальный … ON/OFF»: у них выход
        // двухпозиционный и рассчитан на слаботочную цепь — то, что и ждут
        // «Входы термостатов» контроллера. Термостаты «тёплого пола 16 А» сюда
        // не годятся: они коммутируют нагрузку греющего кабеля, а не сухой
        // контакт, и на сигнальном входе им делать нечего.
        // STE-3001: в прайсе назван «Термостат теплого пола 3А», и по названию
        // его легко пропустить. На сайте это «Термостат универсальный 3А
        // STE-3001, ON/OFF» — вкл/выкл с гистерезисом 0,5 °C, то есть ровно то,
        // что нужно контроллеру, и самый дешёвый вариант из всех.
        { id: "STE-3001-130210", name: "Термостат комнатный STOUT STE-3001, 3 А, ON/OFF, белый", price: 1010, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "electronic", color: "white", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2001-130210", name: "Термостат комнатный STOUT 3 А, ON/OFF, механический, белый", price: 2142, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "mech", color: "white", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2001-130220", name: "Термостат комнатный STOUT 3 А, ON/OFF, механический, чёрный", price: 2249, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "mech", color: "black", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3002-331212", name: "Термостат комнатный STOUT STE-3002, 3 А, ON/OFF, электронный, белый", price: 4998, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "electronic", color: "white", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3002-331222", name: "Термостат комнатный STOUT STE-3002, 3 А, ON/OFF, электронный, чёрный", price: 5202, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "electronic", color: "black", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-3003-231232", name: "Термостат комнатный STOUT STE-3003, 3 А, ON/OFF, с кнопками, серый", price: 5253, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "electronic", color: "gray", availability: "on_order", price_date: "2026-08-10" },
        { id: "STE-2002-331212", name: "Терморегулятор комнатный STOUT 3 А, ON/OFF, сенсорный TFT, белый", price: 11603, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "touch", color: "white", availability: "in_stock", price_date: "2026-08-10" },
        { id: "STE-2002-331222", name: "Терморегулятор комнатный STOUT 3 А, ON/OFF, сенсорный TFT, чёрный", price: 12067, brand: "STOUT", unit: "шт", kind: "dry", link: "dry", ctrlType: "touch", color: "black", availability: "in_stock", price_date: "2026-08-10" },

        // Приборы для базового уровня (Thermatic 1002). Отбираются по полю sys:
        // без него позиция считается принадлежащей 3001 (см. getThermaticConfig).
        // Радиомодуль этим приборам не нужен — радиосеть LoRa у контроллера
        // встроенная, антенна идёт в комплекте.
        //
        // Сухого контакта в списке нет намеренно: клемм «Входы термостатов» у
        // 1002 нет вовсе, а единственный контактный вход Д1 занят охранным
        // шлейфом (протечка, давление). Двухпозиционным термостатом STOUT
        // этот контроллер не закрыть.
        { id: "SMH-0002-010020", name: "Датчик температуры воздуха комнатный, RS-485", price: 3190, brand: "STOUT", unit: "шт", kind: "sensor", link: "wired", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        { id: "SMH-0002-010410", name: "Датчик температуры воздуха комнатный, LoRa", price: 4590, brand: "STOUT", unit: "шт", kind: "sensor", link: "radio", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        { id: "SMH-0002-010910", name: "Термостат комнатный проводной, RS-485", price: 6990, brand: "STOUT", unit: "шт", kind: "thermostat", link: "wired", sys: "basic", availability: "in_stock", price_date: "2026-08-13" },
        { id: "SMH-0002-010800", name: "Термостат комнатный беспроводной, LoRa", price: 6990, brand: "STOUT", unit: "шт", kind: "thermostat", link: "radio", sys: "basic", availability: "in_stock", price_date: "2026-08-13" }
    ],
    radio_modules: [
        { id: "ML00004741", name: "Радиомодуль МЛ-590 (868 МГц)", price: 3720, brand: "ZONT", unit: "шт", capacity: 40, availability: "in_stock", price_date: "2026-07-29" }
    ],

    // Защита от протечки. Работает только в связке с контроллером: он
    // опрашивает датчик и командует краном — под это у него жёстко выделен
    // релейный выход 1. Обратно кран открывается только вручную из
    // приложения, автоматически — никогда.
    leak_sensors: [
        { id: "ML11025", name: "Датчик протечки воды АСТРА-361, проводной", price: 920, brand: "ZONT", unit: "шт", availability: "in_stock", price_date: "2026-07-29" },
        // Для Thermatic 1002 берём извещатель из его же линейки: шлейф у него
        // свой (вход Д1), и разветвители к нему идут из того же комплекта.
        { id: "SMH-0002-010060", name: "Датчик протечки воды проводной", price: 1490, brand: "STOUT", unit: "шт", sys: "basic", availability: "in_stock", price_date: "2026-08-13" }
    ],
    // Диаметр берётся по вводу ХВС (штатно 3/4"), остальные — для замены.
    leak_valves: [
        { id: "SVM-0072-200020", name: "Клапан шаровой 2-ходовой зональный НВ 1/2\"", price: 2805, brand: "STOUT", unit: "шт", dn: 15, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVM-0072-200025", name: "Клапан шаровой 2-ходовой зональный НВ 3/4\"", price: 3125, brand: "STOUT", unit: "шт", dn: 20, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVM-0072-200125", name: "Клапан шаровой 2-ходовой зональный НВ 1\"", price: 4655, brand: "STOUT", unit: "шт", dn: 25, availability: "on_order", price_date: "2026-08-10" },
        { id: "SVM-0072-200132", name: "Клапан шаровой 2-ходовой зональный НВ 1 1/4\"", price: 6330, brand: "STOUT", unit: "шт", dn: 32, availability: "in_stock", price_date: "2026-08-10" },
        // Соленоид — дешёвая замена связке «шаровой кран + привод»: своего
        // привода ему не нужно, отсюда разница в цене почти впятеро. Но держит
        // открытое положение только под напряжением: пропало электричество —
        // вода перекрыта. Берём только нормально закрытые (SSV-0010): у
        // нормально открытых при отключении света протечка возобновится, и для
        // защиты они не годятся.
        { id: "SSV-0010-220015", name: "Клапан соленоидный НЗ, 220 В, 1/2\"", price: 4117, brand: "STOUT", unit: "шт", dn: 15, solenoid: true, availability: "in_stock", price_date: "2026-08-10" },
        { id: "SSV-0010-220020", name: "Клапан соленоидный НЗ, 220 В, 3/4\"", price: 4833, brand: "STOUT", unit: "шт", dn: 20, solenoid: true, availability: "in_stock", price_date: "2026-08-10" }
    ],
    leak_actuators: [
        { id: "SVM-0071-230004", name: "Сервопривод для шаровых зональных клапанов, ход 90°, 40 сек., 230 В, 4 полюса", price: 12514, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],

    // Автоматическая подпитка системы отопления. Клапан механический и от
    // контроллера не зависит: сам держит заданное давление в контуре.
    feed_valves: [
        { id: "SVS-0050-526115", name: "Клапан подпиточный автоматический 1/2\" ВН/ВН, с манометром", price: 5947, brand: "STOUT", unit: "шт", rommer: { id: "RVS-0050-001515", name: "Клапан подпиточный автоматический 1/2\" ВН/НР, с манометром", price: 2318, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }, availability: "in_stock", price_date: "2026-07-29" }
    ],
    // Обвязка линии подпитки: фильтр бережёт седло клапана от окалины и песка
    // из водопровода, обратный клапан не пускает теплоноситель обратно в ХВС.
    // Диаметр 1/2" — по присоединению самого подпиточного клапана.
    feed_line_parts: [
        { id: "SFW-0011-000015", name: "Фильтр сетчатый муфтовый 1/2\"", price: 563, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SVC-0012-000015", name: "Клапан обратный пружинный с нейлоновым седлом 1/2\"", price: 813, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
    ],

    // Позиции, которых не было ни в каталоге, ни в прайсе, но которые
    // встречаются в счетах поставщиков. Нужны распознаванию, чтобы строка
    // не уходила в смету с ценой 0. В автоматическом расчёте калькулятора
    // не участвуют: app.render() их не перебирает, обращение только по id.
    extra_items: [
        // Артикул у Джилекса тот же, что у коллектора MEIBES в прайсе, поэтому
        // в каталоге он с приставкой — иначе поиск по id даст чужой товар.
        { id: "JLX-9059", article: "9059", name: "Корпус для картриджного фильтра Джилекс 1 М 20\"", price: 5550, brand: "Джилекс", unit: "шт", availability: "in_stock", price_date: "2026-07-28" },

        // Энергофлекс 18/4: в прайсе эти позиции лежат без названия — в поле
        // наименования стоит сам артикул, поэтому по названию их не найти.
        { id: "EFXT0180411SUPRK", name: "Теплоизоляция 18/4 Super Протект (Красная), бухта 11 м", price: 26.54, unit: "м", brand: "Energoflex", availability: "in_stock", price_date: "2026-07-28" },
        { id: "EFXT0180411SUPRS", name: "Теплоизоляция 18/4 Super Протект (Синяя), бухта 11 м", price: 26.54, unit: "м", brand: "Energoflex", availability: "in_stock", price_date: "2026-07-28" },

        // Гофрированная защитная труба ПНД. В прайсе название состоит из одного
        // размера («28 (трубы до 20Ø)»), слова «гофра» там нет вовсе — поэтому
        // подбор по названию её не находил. Ряд заведён целиком, чтобы другие
        // размеры не пришлось добавлять поштучно. 0002 — красная, 0001 — синяя.
        { id: "SPG-0002-502316", name: "Труба гофрированная ПНД 23 (для труб до 16 мм), красная, бухта 50 м", price: 19, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPG-0002-502820", name: "Труба гофрированная ПНД 28 (для труб до 20 мм), красная, бухта 50 м", price: 24, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPG-0002-503525", name: "Труба гофрированная ПНД 35 (для труб до 25 мм), красная, бухта 50 м", price: 35, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPG-0002-504032", name: "Труба гофрированная ПНД 40 (для труб до 32 мм), красная, бухта 30 м", price: 46, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPG-0001-502316", name: "Труба гофрированная ПНД 23 (для труб до 16 мм), синяя, бухта 50 м", price: 19, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPG-0001-502820", name: "Труба гофрированная ПНД 28 (для труб до 20 мм), синяя, бухта 50 м", price: 24, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPG-0001-503525", name: "Труба гофрированная ПНД 35 (для труб до 25 мм), синяя, бухта 50 м", price: 35, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
        { id: "SPG-0001-504032", name: "Труба гофрированная ПНД 40 (для труб до 32 мм), синяя, бухта 30 м", price: 46, unit: "м", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },

        { id: "10.В.050.R.M.B", article: "10.В.050.R.M.B", name: "Трап регулируемый боковой, решетка металлическая 100х100 (белый) D 50", price: 1576.06, unit: "шт", brand: "Sinikon", availability: "in_stock", price_date: "2026-07-28" },

        // Лента армированная: в прайсе лежит на листе «Энергофлекс», но строка
        // собирается без слова «лента», поэтому по названию не находится.
        { id: "EPRL04825ARSKRDC", name: "Лента армированная самоклеящаяся Энергофлекс ENERGOPRO 48 мм х 25 м, красная", price: 545.88, unit: "шт", brand: "Energoflex", availability: "in_stock", price_date: "2026-07-28" },
        // Гель уплотнительный: в прайс-листе его нет, цена с сайта ТЕРЕМ.
        { id: "6103", article: "6103", name: "Гель уплотнительный СантехМастерГель Синий, тюбик 60 г, блистер", price: 717, unit: "шт", brand: "СантехМастер", availability: "in_stock", price_date: "2026-07-28" }
    ]
};

const titanRads = [
    { id: "SRB-3320-050004", name: "Радиатор TITAN 4 секций", sec: 4, price: 7410, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050005", name: "Радиатор TITAN 5 секций", sec: 5, price: 8645, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050006", name: "Радиатор TITAN 6 секций", sec: 6, price: 9880, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050007", name: "Радиатор TITAN 7 секций", sec: 7, price: 11115, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050008", name: "Радиатор TITAN 8 секций", sec: 8, price: 12350, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050009", name: "Радиатор TITAN 9 секций", sec: 9, price: 13585, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050010", name: "Радиатор TITAN 10 секций", sec: 10, price: 14820, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050011", name: "Радиатор TITAN 11 секций", sec: 11, price: 16055, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050012", name: "Радиатор TITAN 12 секций", sec: 12, price: 17290, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050013", name: "Радиатор TITAN 13 секций", sec: 13, price: 18525, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' },
    { id: "SRB-3320-050014", name: "Радиатор TITAN 14 секций", sec: 14, price: 19760, brand: "STOUT", power50: 128, passportPower: 198,
  availability: 'in_stock',
  price_date: '2026-08-10' }
];

// Стальные панельные радиаторы ROMMER Россия (СПР)
// Типы 11/21/22/33 · Высоты 200-600мм · Compact (боковое) и Ventil (нижнее подключение)
const steelRads = [
    { id: "RRS-2010-113040", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 400, isPanel: true, price: 2763, brand: "ROMMER", power50: 285, passportPower: 441, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113040", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 400, isPanel: true, bottom: true, price: 4657, brand: "ROMMER", power50: 285, passportPower: 441, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113050", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 500, isPanel: true, price: 3167, brand: "ROMMER", power50: 327, passportPower: 506, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113050", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 500, isPanel: true, bottom: true, price: 5059, brand: "ROMMER", power50: 327, passportPower: 506, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113060", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 600, isPanel: true, price: 3569, brand: "ROMMER", power50: 368, passportPower: 570, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113060", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 600, isPanel: true, bottom: true, price: 5486, brand: "ROMMER", power50: 368, passportPower: 570, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113070", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 700, isPanel: true, price: 3960, brand: "ROMMER", power50: 410, passportPower: 635, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113070", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 700, isPanel: true, bottom: true, price: 5886, brand: "ROMMER", power50: 410, passportPower: 635, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113080", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 800, isPanel: true, price: 4403, brand: "ROMMER", power50: 451, passportPower: 699, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113080", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 800, isPanel: true, bottom: true, price: 6316, brand: "ROMMER", power50: 451, passportPower: 699, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113090", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 900, isPanel: true, price: 4790, brand: "ROMMER", power50: 493, passportPower: 764, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113090", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 900, isPanel: true, bottom: true, price: 6718, brand: "ROMMER", power50: 493, passportPower: 764, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113100", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1000, isPanel: true, price: 5253, brand: "ROMMER", power50: 535, passportPower: 829, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113100", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1000, isPanel: true, bottom: true, price: 7170, brand: "ROMMER", power50: 535, passportPower: 829, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113110", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1100, isPanel: true, price: 5888, brand: "ROMMER", power50: 577, passportPower: 893, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113110", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1100, isPanel: true, bottom: true, price: 7814, brand: "ROMMER", power50: 577, passportPower: 893, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113120", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1200, isPanel: true, price: 6311, brand: "ROMMER", power50: 619, passportPower: 958, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113120", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1200, isPanel: true, bottom: true, price: 8229, brand: "ROMMER", power50: 619, passportPower: 958, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113130", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1300, isPanel: true, price: 6698, brand: "ROMMER", power50: 660, passportPower: 1022, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113130", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1300, isPanel: true, bottom: true, price: 8533, brand: "ROMMER", power50: 660, passportPower: 1022, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113140", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1400, isPanel: true, price: 7133, brand: "ROMMER", power50: 702, passportPower: 1087, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113140", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1400, isPanel: true, bottom: true, price: 9057, brand: "ROMMER", power50: 702, passportPower: 1087, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113150", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1500, isPanel: true, price: 7535, brand: "ROMMER", power50: 744, passportPower: 1152, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113150", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1500, isPanel: true, bottom: true, price: 9443, brand: "ROMMER", power50: 744, passportPower: 1152, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113160", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1600, isPanel: true, price: 8055, brand: "ROMMER", power50: 785, passportPower: 1216, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113160", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1600, isPanel: true, bottom: true, price: 10023, brand: "ROMMER", power50: 785, passportPower: 1216, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113170", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1700, isPanel: true, price: 8940, brand: "ROMMER", power50: 827, passportPower: 1281, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113170", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1700, isPanel: true, bottom: true, price: 11080, brand: "ROMMER", power50: 827, passportPower: 1281, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113180", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1800, isPanel: true, price: 9376, brand: "ROMMER", power50: 868, passportPower: 1345, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113180", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1800, isPanel: true, bottom: true, price: 11851, brand: "ROMMER", power50: 868, passportPower: 1345, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113190", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 1900, isPanel: true, price: 9821, brand: "ROMMER", power50: 910, passportPower: 1410, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113190", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 1900, isPanel: true, bottom: true, price: 12296, brand: "ROMMER", power50: 910, passportPower: 1410, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113200", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2000, isPanel: true, price: 10631, brand: "ROMMER", power50: 952, passportPower: 1475, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-113200", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2000, isPanel: true, bottom: true, price: 13199, brand: "ROMMER", power50: 952, passportPower: 1475, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-113210", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2100, isPanel: true, price: 11088, brand: "ROMMER", power50: 994, passportPower: 1539, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113210", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2100, isPanel: true, bottom: true, price: 13655, brand: "ROMMER", power50: 994, passportPower: 1539, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113220", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2200, isPanel: true, price: 11547, brand: "ROMMER", power50: 1036, passportPower: 1604, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113220", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2200, isPanel: true, bottom: true, price: 14084, brand: "ROMMER", power50: 1036, passportPower: 1604, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113230", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2300, isPanel: true, price: 12040, brand: "ROMMER", power50: 1077, passportPower: 1668, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113230", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2300, isPanel: true, bottom: true, price: 14601, brand: "ROMMER", power50: 1077, passportPower: 1668, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113240", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2400, isPanel: true, price: 12533, brand: "ROMMER", power50: 1119, passportPower: 1733, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113240", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2400, isPanel: true, bottom: true, price: 15090, brand: "ROMMER", power50: 1119, passportPower: 1733, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113250", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2500, isPanel: true, price: 12990, brand: "ROMMER", power50: 1161, passportPower: 1798, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113250", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2500, isPanel: true, bottom: true, price: 15546, brand: "ROMMER", power50: 1161, passportPower: 1798, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113260", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2600, isPanel: true, price: 13824, brand: "ROMMER", power50: 1231, passportPower: 1907, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113260", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2600, isPanel: true, bottom: true, price: 16419, brand: "ROMMER", power50: 1231, passportPower: 1907, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113280", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 2800, isPanel: true, price: 14874, brand: "ROMMER", power50: 1326, passportPower: 2054, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113280", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 2800, isPanel: true, bottom: true, price: 17518, brand: "ROMMER", power50: 1326, passportPower: 2054, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-113300", name: "Стальной панельный Compact (Тип 11)", height: 300, sec: 3000, isPanel: true, price: 15706, brand: "ROMMER", power50: 1421, passportPower: 2201, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-113300", name: "Стальной панельный Ventil (Тип 11)", height: 300, sec: 3000, isPanel: true, bottom: true, price: 18332, brand: "ROMMER", power50: 1421, passportPower: 2201, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114040", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 400, isPanel: true, price: 3163, brand: "ROMMER", power50: 315, passportPower: 488, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114040", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 400, isPanel: true, bottom: true, price: 5155, brand: "ROMMER", power50: 315, passportPower: 488, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-114050", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 500, isPanel: true, price: 3621, brand: "ROMMER", power50: 394, passportPower: 610, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114050", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 500, isPanel: true, bottom: true, price: 5680, brand: "ROMMER", power50: 394, passportPower: 610, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114060", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 600, isPanel: true, price: 4083, brand: "ROMMER", power50: 473, passportPower: 732, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114060", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 600, isPanel: true, bottom: true, price: 6227, brand: "ROMMER", power50: 473, passportPower: 732, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-114070", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 700, isPanel: true, price: 4541, brand: "ROMMER", power50: 551, passportPower: 854, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114070", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 700, isPanel: true, bottom: true, price: 6674, brand: "ROMMER", power50: 551, passportPower: 854, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114080", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 800, isPanel: true, price: 5031, brand: "ROMMER", power50: 631, passportPower: 977, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114080", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 800, isPanel: true, bottom: true, price: 7197, brand: "ROMMER", power50: 631, passportPower: 977, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114090", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 900, isPanel: true, price: 5495, brand: "ROMMER", power50: 709, passportPower: 1098, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114090", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 900, isPanel: true, bottom: true, price: 7668, brand: "ROMMER", power50: 709, passportPower: 1098, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-114100", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1000, isPanel: true, price: 6013, brand: "ROMMER", power50: 788, passportPower: 1221, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114100", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1000, isPanel: true, bottom: true, price: 8191, brand: "ROMMER", power50: 788, passportPower: 1221, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-114110", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1100, isPanel: true, price: 6611, brand: "ROMMER", power50: 867, passportPower: 1342, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114110", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1100, isPanel: true, bottom: true, price: 8845, brand: "ROMMER", power50: 867, passportPower: 1342, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-114120", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1200, isPanel: true, price: 7115, brand: "ROMMER", power50: 946, passportPower: 1465, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114120", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1200, isPanel: true, bottom: true, price: 9323, brand: "ROMMER", power50: 946, passportPower: 1465, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114130", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1300, isPanel: true, price: 7519, brand: "ROMMER", power50: 1024, passportPower: 1586, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114130", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1300, isPanel: true, bottom: true, price: 9859, brand: "ROMMER", power50: 1024, passportPower: 1586, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114140", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1400, isPanel: true, price: 8022, brand: "ROMMER", power50: 1103, passportPower: 1708, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114140", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1400, isPanel: true, bottom: true, price: 10471, brand: "ROMMER", power50: 1103, passportPower: 1708, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114150", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1500, isPanel: true, price: 8493, brand: "ROMMER", power50: 1181, passportPower: 1829, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114150", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1500, isPanel: true, bottom: true, price: 10952, brand: "ROMMER", power50: 1181, passportPower: 1829, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114160", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1600, isPanel: true, price: 9107, brand: "ROMMER", power50: 1260, passportPower: 1952, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114160", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1600, isPanel: true, bottom: true, price: 11713, brand: "ROMMER", power50: 1260, passportPower: 1952, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-114170", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1700, isPanel: true, price: 10101, brand: "ROMMER", power50: 1339, passportPower: 2073, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114170", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1700, isPanel: true, bottom: true, price: 12817, brand: "ROMMER", power50: 1339, passportPower: 2073, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114180", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1800, isPanel: true, price: 10604, brand: "ROMMER", power50: 1418, passportPower: 2196, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114180", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1800, isPanel: true, bottom: true, price: 13584, brand: "ROMMER", power50: 1418, passportPower: 2196, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114190", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 1900, isPanel: true, price: 11073, brand: "ROMMER", power50: 1496, passportPower: 2316, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114190", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 1900, isPanel: true, bottom: true, price: 14011, brand: "ROMMER", power50: 1496, passportPower: 2316, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114200", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2000, isPanel: true, price: 12013, brand: "ROMMER", power50: 1576, passportPower: 2440, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-114200", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2000, isPanel: true, bottom: true, price: 14968, brand: "ROMMER", power50: 1576, passportPower: 2440, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114210", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2100, isPanel: true, price: 12528, brand: "ROMMER", power50: 1654, passportPower: 2562, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114210", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2100, isPanel: true, bottom: true, price: 15437, brand: "ROMMER", power50: 1654, passportPower: 2562, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114220", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2200, isPanel: true, price: 13045, brand: "ROMMER", power50: 1733, passportPower: 2684, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114220", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2200, isPanel: true, bottom: true, price: 15876, brand: "ROMMER", power50: 1733, passportPower: 2684, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114230", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2300, isPanel: true, price: 13594, brand: "ROMMER", power50: 1812, passportPower: 2807, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114230", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2300, isPanel: true, bottom: true, price: 16373, brand: "ROMMER", power50: 1812, passportPower: 2807, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114240", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2400, isPanel: true, price: 14178, brand: "ROMMER", power50: 1890, passportPower: 2927, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114240", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2400, isPanel: true, bottom: true, price: 16899, brand: "ROMMER", power50: 1890, passportPower: 2927, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114250", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2500, isPanel: true, price: 14809, brand: "ROMMER", power50: 1969, passportPower: 3049, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114250", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2500, isPanel: true, bottom: true, price: 17339, brand: "ROMMER", power50: 1969, passportPower: 3049, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114260", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2600, isPanel: true, price: 15603, brand: "ROMMER", power50: 2048, passportPower: 3173, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114260", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2600, isPanel: true, bottom: true, price: 18308, brand: "ROMMER", power50: 2048, passportPower: 3173, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114280", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 2800, isPanel: true, price: 16807, brand: "ROMMER", power50: 2205, passportPower: 3416, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114280", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 2800, isPanel: true, bottom: true, price: 19387, brand: "ROMMER", power50: 2205, passportPower: 3416, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-114300", name: "Стальной панельный Compact (Тип 11)", height: 400, sec: 3000, isPanel: true, price: 17759, brand: "ROMMER", power50: 2364, passportPower: 3661, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-114300", name: "Стальной панельный Ventil (Тип 11)", height: 400, sec: 3000, isPanel: true, bottom: true, price: 20319, brand: "ROMMER", power50: 2364, passportPower: 3661, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115040", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 400, isPanel: true, price: 3468, brand: "ROMMER", power50: 390, passportPower: 604, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115040", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 400, isPanel: true, bottom: true, price: 5435, brand: "ROMMER", power50: 390, passportPower: 604, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115050", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 500, isPanel: true, price: 3994, brand: "ROMMER", power50: 459, passportPower: 711, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115050", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 500, isPanel: true, bottom: true, price: 5958, brand: "ROMMER", power50: 459, passportPower: 711, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115060", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 600, isPanel: true, price: 4564, brand: "ROMMER", power50: 528, passportPower: 818, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115060", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 600, isPanel: true, bottom: true, price: 6515, brand: "ROMMER", power50: 528, passportPower: 818, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115070", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 700, isPanel: true, price: 5057, brand: "ROMMER", power50: 597, passportPower: 925, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115070", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 700, isPanel: true, bottom: true, price: 7023, brand: "ROMMER", power50: 597, passportPower: 925, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115080", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 800, isPanel: true, price: 5599, brand: "ROMMER", power50: 666, passportPower: 1032, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115080", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 800, isPanel: true, bottom: true, price: 7563, brand: "ROMMER", power50: 666, passportPower: 1032, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115090", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 900, isPanel: true, price: 6092, brand: "ROMMER", power50: 735, passportPower: 1139, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115090", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 900, isPanel: true, bottom: true, price: 8040, brand: "ROMMER", power50: 735, passportPower: 1139, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115100", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1000, isPanel: true, price: 6648, brand: "ROMMER", power50: 805, passportPower: 1246, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115100", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1000, isPanel: true, bottom: true, price: 8612, brand: "ROMMER", power50: 805, passportPower: 1246, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115110", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1100, isPanel: true, price: 7385, brand: "ROMMER", power50: 874, passportPower: 1353, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115110", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1100, isPanel: true, bottom: true, price: 9380, brand: "ROMMER", power50: 874, passportPower: 1353, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115120", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1200, isPanel: true, price: 7919, brand: "ROMMER", power50: 943, passportPower: 1460, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115120", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1200, isPanel: true, bottom: true, price: 9904, brand: "ROMMER", power50: 943, passportPower: 1460, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115130", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1300, isPanel: true, price: 8497, brand: "ROMMER", power50: 1012, passportPower: 1567, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115130", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1300, isPanel: true, bottom: true, price: 10478, brand: "ROMMER", power50: 1012, passportPower: 1567, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115140", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1400, isPanel: true, price: 9106, brand: "ROMMER", power50: 1081, passportPower: 1674, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115140", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1400, isPanel: true, bottom: true, price: 11117, brand: "ROMMER", power50: 1081, passportPower: 1674, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115150", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1500, isPanel: true, price: 9636, brand: "ROMMER", power50: 1150, passportPower: 1781, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115150", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1500, isPanel: true, bottom: true, price: 11642, brand: "ROMMER", power50: 1150, passportPower: 1781, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115160", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1600, isPanel: true, price: 10375, brand: "ROMMER", power50: 1250, passportPower: 1936, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115160", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1600, isPanel: true, bottom: true, price: 12439, brand: "ROMMER", power50: 1250, passportPower: 1936, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115170", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1700, isPanel: true, price: 11553, brand: "ROMMER", power50: 1328, passportPower: 2057, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115170", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1700, isPanel: true, bottom: true, price: 13741, brand: "ROMMER", power50: 1328, passportPower: 2057, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115180", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1800, isPanel: true, price: 12011, brand: "ROMMER", power50: 1406, passportPower: 2178, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115180", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1800, isPanel: true, bottom: true, price: 14568, brand: "ROMMER", power50: 1406, passportPower: 2178, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115190", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 1900, isPanel: true, price: 12453, brand: "ROMMER", power50: 1484, passportPower: 2299, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115190", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 1900, isPanel: true, bottom: true, price: 15025, brand: "ROMMER", power50: 1484, passportPower: 2299, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115200", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2000, isPanel: true, price: 13445, brand: "ROMMER", power50: 1563, passportPower: 2420, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115200", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2000, isPanel: true, bottom: true, price: 16075, brand: "ROMMER", power50: 1563, passportPower: 2420, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115210", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2100, isPanel: true, price: 13950, brand: "ROMMER", power50: 1641, passportPower: 2541, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115210", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2100, isPanel: true, bottom: true, price: 16545, brand: "ROMMER", power50: 1641, passportPower: 2541, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115220", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2200, isPanel: true, price: 14369, brand: "ROMMER", power50: 1719, passportPower: 2662, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-115220", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2200, isPanel: true, bottom: true, price: 17016, brand: "ROMMER", power50: 1719, passportPower: 2662, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-115230", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2300, isPanel: true, price: 14950, brand: "ROMMER", power50: 1797, passportPower: 2783, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115230", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2300, isPanel: true, bottom: true, price: 17558, brand: "ROMMER", power50: 1797, passportPower: 2783, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115240", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2400, isPanel: true, price: 15511, brand: "ROMMER", power50: 1874, passportPower: 2903, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115240", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2400, isPanel: true, bottom: true, price: 18102, brand: "ROMMER", power50: 1874, passportPower: 2903, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115250", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2500, isPanel: true, price: 16018, brand: "ROMMER", power50: 1953, passportPower: 3025, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115250", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2500, isPanel: true, bottom: true, price: 18609, brand: "ROMMER", power50: 1953, passportPower: 3025, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115260", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2600, isPanel: true, price: 16952, brand: "ROMMER", power50: 2031, passportPower: 3145, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115260", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2600, isPanel: true, bottom: true, price: 19614, brand: "ROMMER", power50: 2031, passportPower: 3145, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115280", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 2800, isPanel: true, price: 18106, brand: "ROMMER", power50: 2188, passportPower: 3388, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115280", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 2800, isPanel: true, bottom: true, price: 20769, brand: "ROMMER", power50: 2188, passportPower: 3388, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-115300", name: "Стальной панельный Compact (Тип 11)", height: 500, sec: 3000, isPanel: true, price: 19111, brand: "ROMMER", power50: 2344, passportPower: 3630, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-115300", name: "Стальной панельный Ventil (Тип 11)", height: 500, sec: 3000, isPanel: true, bottom: true, price: 21773, brand: "ROMMER", power50: 2344, passportPower: 3630, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-116040", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 400, isPanel: true, price: 11271, brand: "ROMMER", power50: 473, passportPower: 732, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116040", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 473, passportPower: 732, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116050", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 500, isPanel: true, price: 11271, brand: "ROMMER", power50: 561, passportPower: 868, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116050", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 561, passportPower: 868, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116060", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 600, isPanel: true, price: 11271, brand: "ROMMER", power50: 649, passportPower: 1005, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116060", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 649, passportPower: 1005, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116070", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 700, isPanel: true, price: 11271, brand: "ROMMER", power50: 738, passportPower: 1142, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116070", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 738, passportPower: 1142, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116080", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 800, isPanel: true, price: 11271, brand: "ROMMER", power50: 826, passportPower: 1279, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116080", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 826, passportPower: 1279, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116090", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 900, isPanel: true, price: 11271, brand: "ROMMER", power50: 914, passportPower: 1415, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116090", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 914, passportPower: 1415, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116100", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1000, isPanel: true, price: 11271, brand: "ROMMER", power50: 1002, passportPower: 1551, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116100", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1002, passportPower: 1551, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116110", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1100, isPanel: true, price: 11271, brand: "ROMMER", power50: 1091, passportPower: 1689, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116110", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1091, passportPower: 1689, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116120", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1200, isPanel: true, price: 11271, brand: "ROMMER", power50: 1178, passportPower: 1824, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116120", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1178, passportPower: 1824, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116130", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1300, isPanel: true, price: 11271, brand: "ROMMER", power50: 1278, passportPower: 1980, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116130", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1300, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1278, passportPower: 1980, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116140", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1400, isPanel: true, price: 11271, brand: "ROMMER", power50: 1377, passportPower: 2133, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116140", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1377, passportPower: 2133, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116150", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1500, isPanel: true, price: 11271, brand: "ROMMER", power50: 1475, passportPower: 2284, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116150", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1475, passportPower: 2284, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116160", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1600, isPanel: true, price: 11271, brand: "ROMMER", power50: 1574, passportPower: 2438, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116160", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1574, passportPower: 2438, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116170", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1700, isPanel: true, price: 11271, brand: "ROMMER", power50: 1673, passportPower: 2590, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116170", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1673, passportPower: 2590, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116180", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1800, isPanel: true, price: 11271, brand: "ROMMER", power50: 1771, passportPower: 2742, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116180", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1771, passportPower: 2742, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116190", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 1900, isPanel: true, price: 11271, brand: "ROMMER", power50: 1870, passportPower: 2896, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116190", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 1900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1870, passportPower: 2896, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116200", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2000, isPanel: true, price: 11271, brand: "ROMMER", power50: 1968, passportPower: 3047, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116200", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1968, passportPower: 3047, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116210", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2100, isPanel: true, price: 11271, brand: "ROMMER", power50: 2064, passportPower: 3197, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116210", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2064, passportPower: 3197, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116220", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2200, isPanel: true, price: 11271, brand: "ROMMER", power50: 2165, passportPower: 3353, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116220", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2165, passportPower: 3353, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116230", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2300, isPanel: true, price: 11271, brand: "ROMMER", power50: 2263, passportPower: 3504, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116230", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2300, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2263, passportPower: 3504, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116240", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2400, isPanel: true, price: 11271, brand: "ROMMER", power50: 2362, passportPower: 3658, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116240", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2362, passportPower: 3658, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116250", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2500, isPanel: true, price: 11271, brand: "ROMMER", power50: 2460, passportPower: 3809, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116250", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2460, passportPower: 3809, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116260", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2600, isPanel: true, price: 11271, brand: "ROMMER", power50: 2558, passportPower: 3961, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116260", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2558, passportPower: 3961, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116280", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 2800, isPanel: true, price: 11271, brand: "ROMMER", power50: 2755, passportPower: 4267, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116280", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 2800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2755, passportPower: 4267, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-116300", name: "Стальной панельный Compact (Тип 11)", height: 600, sec: 3000, isPanel: true, price: 11271, brand: "ROMMER", power50: 2951, passportPower: 4570, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-116300", name: "Стальной панельный Ventil (Тип 11)", height: 600, sec: 3000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2951, passportPower: 4570, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212060", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 600, isPanel: true, price: 11271, brand: "ROMMER", power50: 293, passportPower: 454, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212060", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 293, passportPower: 454, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212070", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 700, isPanel: true, price: 11271, brand: "ROMMER", power50: 337, passportPower: 522, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212070", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 337, passportPower: 522, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212080", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 800, isPanel: true, price: 11271, brand: "ROMMER", power50: 381, passportPower: 590, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212080", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 381, passportPower: 590, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212090", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 900, isPanel: true, price: 11271, brand: "ROMMER", power50: 426, passportPower: 659, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212090", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 426, passportPower: 659, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212100", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1000, isPanel: true, price: 22402, brand: "ROMMER", power50: 470, passportPower: 728, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212100", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 470, passportPower: 728, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212110", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1100, isPanel: true, price: 11271, brand: "ROMMER", power50: 515, passportPower: 797, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212110", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 515, passportPower: 797, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212120", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1200, isPanel: true, price: 28737, brand: "ROMMER", power50: 559, passportPower: 866, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212120", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 559, passportPower: 866, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212130", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1300, isPanel: true, price: 11271, brand: "ROMMER", power50: 603, passportPower: 934, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212130", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1300, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 603, passportPower: 934, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212140", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1400, isPanel: true, price: 11271, brand: "ROMMER", power50: 648, passportPower: 1003, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212140", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 648, passportPower: 1003, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212150", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1500, isPanel: true, price: 29296, brand: "ROMMER", power50: 692, passportPower: 1072, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212150", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 692, passportPower: 1072, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212160", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1600, isPanel: true, price: 11271, brand: "ROMMER", power50: 736, passportPower: 1140, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212160", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 736, passportPower: 1140, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212170", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1700, isPanel: true, price: 11271, brand: "ROMMER", power50: 780, passportPower: 1208, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212170", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 780, passportPower: 1208, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212180", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1800, isPanel: true, price: 11271, brand: "ROMMER", power50: 825, passportPower: 1278, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212180", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 825, passportPower: 1278, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212190", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 1900, isPanel: true, price: 11271, brand: "ROMMER", power50: 871, passportPower: 1348, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212190", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 1900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 871, passportPower: 1348, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212200", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2000, isPanel: true, price: 28737, brand: "ROMMER", power50: 915, passportPower: 1418, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212200", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 915, passportPower: 1418, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212210", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2100, isPanel: true, price: 11271, brand: "ROMMER", power50: 962, passportPower: 1490, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212210", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 962, passportPower: 1490, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212220", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2200, isPanel: true, price: 28737, brand: "ROMMER", power50: 1008, passportPower: 1561, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212220", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1008, passportPower: 1561, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212230", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2300, isPanel: true, price: 11271, brand: "ROMMER", power50: 1054, passportPower: 1632, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212230", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2300, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1054, passportPower: 1632, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212240", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2400, isPanel: true, price: 11271, brand: "ROMMER", power50: 1100, passportPower: 1703, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212240", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1100, passportPower: 1703, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212250", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2500, isPanel: true, price: 11271, brand: "ROMMER", power50: 1144, passportPower: 1772, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212250", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1144, passportPower: 1772, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212260", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2600, isPanel: true, price: 11271, brand: "ROMMER", power50: 1190, passportPower: 1843, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212260", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1190, passportPower: 1843, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212280", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 2800, isPanel: true, price: 11271, brand: "ROMMER", power50: 1283, passportPower: 1987, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212280", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 2800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1283, passportPower: 1987, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-212300", name: "Стальной панельный Compact (Тип 21)", height: 200, sec: 3000, isPanel: true, price: 11271, brand: "ROMMER", power50: 1373, passportPower: 2127, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-212300", name: "Стальной панельный Ventil (Тип 21)", height: 200, sec: 3000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1373, passportPower: 2127, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-213040", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 400, isPanel: true, price: 3895, brand: "ROMMER", power50: 354, passportPower: 549, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213040", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 400, isPanel: true, bottom: true, price: 5816, brand: "ROMMER", power50: 354, passportPower: 549, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213050", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 500, isPanel: true, price: 4393, brand: "ROMMER", power50: 418, passportPower: 648, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213050", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 500, isPanel: true, bottom: true, price: 6291, brand: "ROMMER", power50: 418, passportPower: 648, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213060", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 600, isPanel: true, price: 5026, brand: "ROMMER", power50: 482, passportPower: 747, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213060", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 600, isPanel: true, bottom: true, price: 6934, brand: "ROMMER", power50: 482, passportPower: 747, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213070", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 700, isPanel: true, price: 5507, brand: "ROMMER", power50: 546, passportPower: 846, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213070", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 700, isPanel: true, bottom: true, price: 7406, brand: "ROMMER", power50: 546, passportPower: 846, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213080", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 800, isPanel: true, price: 6118, brand: "ROMMER", power50: 610, passportPower: 945, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213080", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 800, isPanel: true, bottom: true, price: 8044, brand: "ROMMER", power50: 610, passportPower: 945, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213090", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 900, isPanel: true, price: 6675, brand: "ROMMER", power50: 673, passportPower: 1043, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213090", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 900, isPanel: true, bottom: true, price: 8632, brand: "ROMMER", power50: 673, passportPower: 1043, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213100", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1000, isPanel: true, price: 7321, brand: "ROMMER", power50: 737, passportPower: 1142, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213100", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1000, isPanel: true, bottom: true, price: 9279, brand: "ROMMER", power50: 737, passportPower: 1142, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213110", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1100, isPanel: true, price: 8126, brand: "ROMMER", power50: 801, passportPower: 1241, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213110", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1100, isPanel: true, bottom: true, price: 10150, brand: "ROMMER", power50: 801, passportPower: 1241, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213120", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1200, isPanel: true, price: 8697, brand: "ROMMER", power50: 865, passportPower: 1340, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213120", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1200, isPanel: true, bottom: true, price: 10723, brand: "ROMMER", power50: 865, passportPower: 1340, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213130", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1300, isPanel: true, price: 9317, brand: "ROMMER", power50: 929, passportPower: 1439, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213130", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1300, isPanel: true, bottom: true, price: 11297, brand: "ROMMER", power50: 929, passportPower: 1439, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213140", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1400, isPanel: true, price: 9987, brand: "ROMMER", power50: 992, passportPower: 1537, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213140", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1400, isPanel: true, bottom: true, price: 11949, brand: "ROMMER", power50: 992, passportPower: 1537, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213150", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1500, isPanel: true, price: 10530, brand: "ROMMER", power50: 1056, passportPower: 1636, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213150", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1500, isPanel: true, bottom: true, price: 12508, brand: "ROMMER", power50: 1056, passportPower: 1636, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213160", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1600, isPanel: true, price: 11321, brand: "ROMMER", power50: 1120, passportPower: 1735, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213160", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1600, isPanel: true, bottom: true, price: 13354, brand: "ROMMER", power50: 1120, passportPower: 1735, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213170", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1700, isPanel: true, price: 12780, brand: "ROMMER", power50: 1210, passportPower: 1874, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213170", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1700, isPanel: true, bottom: true, price: 14823, brand: "ROMMER", power50: 1210, passportPower: 1874, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213180", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1800, isPanel: true, price: 13435, brand: "ROMMER", power50: 1281, passportPower: 1984, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213180", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1800, isPanel: true, bottom: true, price: 15849, brand: "ROMMER", power50: 1281, passportPower: 1984, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213190", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 1900, isPanel: true, price: 14055, brand: "ROMMER", power50: 1353, passportPower: 2095, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213190", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 1900, isPanel: true, bottom: true, price: 16464, brand: "ROMMER", power50: 1353, passportPower: 2095, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213200", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2000, isPanel: true, price: 15275, brand: "ROMMER", power50: 1424, passportPower: 2205, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-213200", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2000, isPanel: true, bottom: true, price: 17695, brand: "ROMMER", power50: 1424, passportPower: 2205, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213210", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2100, isPanel: true, price: 15913, brand: "ROMMER", power50: 1495, passportPower: 2315, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213210", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2100, isPanel: true, bottom: true, price: 18398, brand: "ROMMER", power50: 1495, passportPower: 2315, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213220", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2200, isPanel: true, price: 16551, brand: "ROMMER", power50: 1566, passportPower: 2425, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213220", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2200, isPanel: true, bottom: true, price: 18940, brand: "ROMMER", power50: 1566, passportPower: 2425, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-213230", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2300, isPanel: true, price: 17331, brand: "ROMMER", power50: 1637, passportPower: 2535, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213230", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2300, isPanel: true, bottom: true, price: 19679, brand: "ROMMER", power50: 1637, passportPower: 2535, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213240", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2400, isPanel: true, price: 18075, brand: "ROMMER", power50: 1708, passportPower: 2645, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213240", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2400, isPanel: true, bottom: true, price: 20572, brand: "ROMMER", power50: 1708, passportPower: 2645, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213250", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2500, isPanel: true, price: 18748, brand: "ROMMER", power50: 1780, passportPower: 2756, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213250", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2500, isPanel: true, bottom: true, price: 21215, brand: "ROMMER", power50: 1780, passportPower: 2756, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213260", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2600, isPanel: true, price: 19966, brand: "ROMMER", power50: 1851, passportPower: 2866, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213260", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2600, isPanel: true, bottom: true, price: 22440, brand: "ROMMER", power50: 1851, passportPower: 2866, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213280", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 2800, isPanel: true, price: 21459, brand: "ROMMER", power50: 1993, passportPower: 3086, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213280", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 2800, isPanel: true, bottom: true, price: 23977, brand: "ROMMER", power50: 1993, passportPower: 3086, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-213300", name: "Стальной панельный Compact (Тип 21)", height: 300, sec: 3000, isPanel: true, price: 22880, brand: "ROMMER", power50: 2135, passportPower: 3307, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-213300", name: "Стальной панельный Ventil (Тип 21)", height: 300, sec: 3000, isPanel: true, bottom: true, price: 25333, brand: "ROMMER", power50: 2135, passportPower: 3307, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-214040", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 400, isPanel: true, price: 11271, brand: "ROMMER", power50: 392, passportPower: 607, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214040", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 392, passportPower: 607, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214050", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 500, isPanel: true, price: 11271, brand: "ROMMER", power50: 489, passportPower: 758, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214050", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 500, isPanel: true, bottom: true, price: 7021, brand: "ROMMER", power50: 489, passportPower: 758, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-214060", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 600, isPanel: true, price: 11271, brand: "ROMMER", power50: 587, passportPower: 910, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214060", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 600, isPanel: true, bottom: true, price: 7727, brand: "ROMMER", power50: 587, passportPower: 910, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-214070", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 700, isPanel: true, price: 11271, brand: "ROMMER", power50: 685, passportPower: 1061, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214070", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 700, isPanel: true, bottom: true, price: 8377, brand: "ROMMER", power50: 685, passportPower: 1061, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-214080", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 800, isPanel: true, price: 11271, brand: "ROMMER", power50: 783, passportPower: 1213, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214080", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 800, isPanel: true, bottom: true, price: 9056, brand: "ROMMER", power50: 783, passportPower: 1213, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-214090", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 900, isPanel: true, price: 11271, brand: "ROMMER", power50: 881, passportPower: 1364, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214090", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 900, isPanel: true, bottom: true, price: 9762, brand: "ROMMER", power50: 881, passportPower: 1364, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-214100", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1000, isPanel: true, price: 11271, brand: "ROMMER", power50: 979, passportPower: 1516, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214100", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1000, isPanel: true, bottom: true, price: 10518, brand: "ROMMER", power50: 979, passportPower: 1516, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-214110", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1100, isPanel: true, price: 11271, brand: "ROMMER", power50: 1077, passportPower: 1667, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214110", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1100, isPanel: true, bottom: true, price: 11379, brand: "ROMMER", power50: 1077, passportPower: 1667, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-214120", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1200, isPanel: true, price: 11271, brand: "ROMMER", power50: 1175, passportPower: 1820, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214120", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1200, isPanel: true, bottom: true, price: 12045, brand: "ROMMER", power50: 1175, passportPower: 1820, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-214130", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1300, isPanel: true, price: 11271, brand: "ROMMER", power50: 1273, passportPower: 1972, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214130", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1300, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1273, passportPower: 1972, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214140", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1400, isPanel: true, price: 11271, brand: "ROMMER", power50: 1371, passportPower: 2123, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214140", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1371, passportPower: 2123, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214150", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1500, isPanel: true, price: 11271, brand: "ROMMER", power50: 1469, passportPower: 2275, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214150", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1469, passportPower: 2275, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214160", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1600, isPanel: true, price: 11271, brand: "ROMMER", power50: 1567, passportPower: 2426, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214160", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1567, passportPower: 2426, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214170", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1700, isPanel: true, price: 11271, brand: "ROMMER", power50: 1665, passportPower: 2579, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214170", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1665, passportPower: 2579, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214180", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1800, isPanel: true, price: 11271, brand: "ROMMER", power50: 1762, passportPower: 2729, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214180", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1800, isPanel: true, bottom: true, price: 17957, brand: "ROMMER", power50: 1762, passportPower: 2729, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-214190", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 1900, isPanel: true, price: 11271, brand: "ROMMER", power50: 1861, passportPower: 2881, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214190", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 1900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1861, passportPower: 2881, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214200", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2000, isPanel: true, price: 19685, brand: "ROMMER", power50: 1958, passportPower: 3033, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-214200", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2000, isPanel: true, bottom: true, price: 20177, brand: "ROMMER", power50: 1958, passportPower: 3033, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-214210", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2100, isPanel: true, price: 11271, brand: "ROMMER", power50: 2058, passportPower: 3187, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214210", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2058, passportPower: 3187, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214220", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2200, isPanel: true, price: 11271, brand: "ROMMER", power50: 2156, passportPower: 3339, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214220", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2156, passportPower: 3339, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214230", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2300, isPanel: true, price: 11271, brand: "ROMMER", power50: 2252, passportPower: 3487, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214230", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2300, isPanel: true, bottom: true, price: 22589, brand: "ROMMER", power50: 2252, passportPower: 3487, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-214240", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2400, isPanel: true, price: 11271, brand: "ROMMER", power50: 2350, passportPower: 3639, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214240", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2350, passportPower: 3639, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214250", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2500, isPanel: true, price: 11271, brand: "ROMMER", power50: 2448, passportPower: 3791, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214250", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2448, passportPower: 3791, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214260", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2600, isPanel: true, price: 11271, brand: "ROMMER", power50: 2546, passportPower: 3942, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214260", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2546, passportPower: 3942, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214280", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 2800, isPanel: true, price: 11271, brand: "ROMMER", power50: 2743, passportPower: 4249, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214280", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 2800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2743, passportPower: 4249, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-214300", name: "Стальной панельный Compact (Тип 21)", height: 400, sec: 3000, isPanel: true, price: 11271, brand: "ROMMER", power50: 2937, passportPower: 4549, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-214300", name: "Стальной панельный Ventil (Тип 21)", height: 400, sec: 3000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2937, passportPower: 4549, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-215040", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 400, isPanel: true, price: 4667, brand: "ROMMER", power50: 500, passportPower: 775, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215040", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 400, isPanel: true, bottom: true, price: 6578, brand: "ROMMER", power50: 500, passportPower: 775, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215050", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 500, isPanel: true, price: 5314, brand: "ROMMER", power50: 601, passportPower: 930, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215050", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 500, isPanel: true, bottom: true, price: 7291, brand: "ROMMER", power50: 601, passportPower: 930, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215060", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 600, isPanel: true, price: 6138, brand: "ROMMER", power50: 701, passportPower: 1085, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215060", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 600, isPanel: true, bottom: true, price: 8034, brand: "ROMMER", power50: 701, passportPower: 1085, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215070", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 700, isPanel: true, price: 6746, brand: "ROMMER", power50: 801, passportPower: 1240, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215070", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 700, isPanel: true, bottom: true, price: 8698, brand: "ROMMER", power50: 801, passportPower: 1240, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215080", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 800, isPanel: true, price: 7473, brand: "ROMMER", power50: 901, passportPower: 1395, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215080", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 800, isPanel: true, bottom: true, price: 9441, brand: "ROMMER", power50: 901, passportPower: 1395, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215090", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 900, isPanel: true, price: 8169, brand: "ROMMER", power50: 1001, passportPower: 1551, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215090", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 900, isPanel: true, bottom: true, price: 10154, brand: "ROMMER", power50: 1001, passportPower: 1551, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215100", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1000, isPanel: true, price: 8992, brand: "ROMMER", power50: 1102, passportPower: 1706, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215100", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1000, isPanel: true, bottom: true, price: 10929, brand: "ROMMER", power50: 1102, passportPower: 1706, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215110", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1100, isPanel: true, price: 10018, brand: "ROMMER", power50: 1230, passportPower: 1905, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215110", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1100, isPanel: true, bottom: true, price: 11995, brand: "ROMMER", power50: 1230, passportPower: 1905, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215120", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1200, isPanel: true, price: 10741, brand: "ROMMER", power50: 1341, passportPower: 2077, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215120", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1200, isPanel: true, bottom: true, price: 12697, brand: "ROMMER", power50: 1341, passportPower: 2077, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215130", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1300, isPanel: true, price: 11495, brand: "ROMMER", power50: 1453, passportPower: 2251, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215130", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1300, isPanel: true, bottom: true, price: 13432, brand: "ROMMER", power50: 1453, passportPower: 2251, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215140", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1400, isPanel: true, price: 12316, brand: "ROMMER", power50: 1565, passportPower: 2424, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215140", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1400, isPanel: true, bottom: true, price: 14263, brand: "ROMMER", power50: 1565, passportPower: 2424, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215150", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1500, isPanel: true, price: 13073, brand: "ROMMER", power50: 1676, passportPower: 2596, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215150", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1500, isPanel: true, bottom: true, price: 14998, brand: "ROMMER", power50: 1676, passportPower: 2596, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215160", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1600, isPanel: true, price: 14065, brand: "ROMMER", power50: 1789, passportPower: 2770, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215160", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1600, isPanel: true, bottom: true, price: 16057, brand: "ROMMER", power50: 1789, passportPower: 2770, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215170", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1700, isPanel: true, price: 15583, brand: "ROMMER", power50: 1900, passportPower: 2943, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215170", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1700, isPanel: true, bottom: true, price: 17808, brand: "ROMMER", power50: 1900, passportPower: 2943, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-215180", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1800, isPanel: true, price: 16351, brand: "ROMMER", power50: 2012, passportPower: 3116, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215180", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1800, isPanel: true, bottom: true, price: 18965, brand: "ROMMER", power50: 2012, passportPower: 3116, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215190", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 1900, isPanel: true, price: 17118, brand: "ROMMER", power50: 2124, passportPower: 3289, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215190", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 1900, isPanel: true, bottom: true, price: 19753, brand: "ROMMER", power50: 2124, passportPower: 3289, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215200", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2000, isPanel: true, price: 18615, brand: "ROMMER", power50: 2235, passportPower: 3462, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-215200", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2000, isPanel: true, bottom: true, price: 21313, brand: "ROMMER", power50: 2235, passportPower: 3462, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215210", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2100, isPanel: true, price: 19441, brand: "ROMMER", power50: 2347, passportPower: 3635, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215210", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2100, isPanel: true, bottom: true, price: 22268, brand: "ROMMER", power50: 2347, passportPower: 3635, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-215220", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2200, isPanel: true, price: 20229, brand: "ROMMER", power50: 2459, passportPower: 3808, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215220", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2200, isPanel: true, bottom: true, price: 22953, brand: "ROMMER", power50: 2459, passportPower: 3808, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-215230", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2300, isPanel: true, price: 21162, brand: "ROMMER", power50: 2571, passportPower: 3982, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215230", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2300, isPanel: true, bottom: true, price: 23898, brand: "ROMMER", power50: 2571, passportPower: 3982, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-215240", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2400, isPanel: true, price: 22023, brand: "ROMMER", power50: 2683, passportPower: 4155, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215240", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2400, isPanel: true, bottom: true, price: 24791, brand: "ROMMER", power50: 2683, passportPower: 4155, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-215250", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2500, isPanel: true, price: 22884, brand: "ROMMER", power50: 2794, passportPower: 4327, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215250", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2500, isPanel: true, bottom: true, price: 25763, brand: "ROMMER", power50: 2794, passportPower: 4327, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-215260", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2600, isPanel: true, price: 24373, brand: "ROMMER", power50: 2906, passportPower: 4501, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215260", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2600, isPanel: true, bottom: true, price: 27152, brand: "ROMMER", power50: 2906, passportPower: 4501, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-215280", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 2800, isPanel: true, price: 26328, brand: "ROMMER", power50: 3130, passportPower: 4847, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215280", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 2800, isPanel: true, bottom: true, price: 28332, brand: "ROMMER", power50: 3130, passportPower: 4847, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-215300", name: "Стальной панельный Compact (Тип 21)", height: 500, sec: 3000, isPanel: true, price: 28025, brand: "ROMMER", power50: 3353, passportPower: 5193, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-215300", name: "Стальной панельный Ventil (Тип 21)", height: 500, sec: 3000, isPanel: true, bottom: true, price: 29296, brand: "ROMMER", power50: 3353, passportPower: 5193, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-216040", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 400, isPanel: true, price: 11271, brand: "ROMMER", power50: 574, passportPower: 888, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216040", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 574, passportPower: 888, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216050", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 500, isPanel: true, price: 11271, brand: "ROMMER", power50: 679, passportPower: 1052, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216050", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 679, passportPower: 1052, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216060", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 600, isPanel: true, price: 11271, brand: "ROMMER", power50: 788, passportPower: 1220, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216060", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 788, passportPower: 1220, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216070", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 700, isPanel: true, price: 11271, brand: "ROMMER", power50: 895, passportPower: 1386, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216070", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 895, passportPower: 1386, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216080", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 800, isPanel: true, price: 11271, brand: "ROMMER", power50: 1002, passportPower: 1551, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216080", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1002, passportPower: 1551, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216090", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 900, isPanel: true, price: 11271, brand: "ROMMER", power50: 1101, passportPower: 1705, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216090", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1101, passportPower: 1705, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216100", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1000, isPanel: true, price: 22402, brand: "ROMMER", power50: 1215, passportPower: 1882, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216100", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1215, passportPower: 1882, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216110", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1100, isPanel: true, price: 11271, brand: "ROMMER", power50: 1323, passportPower: 2049, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216110", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1323, passportPower: 2049, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216120", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1200, isPanel: true, price: 11271, brand: "ROMMER", power50: 1428, passportPower: 2212, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216120", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1428, passportPower: 2212, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216130", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1300, isPanel: true, price: 11271, brand: "ROMMER", power50: 1551, passportPower: 2401, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216130", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1300, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1551, passportPower: 2401, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216140", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1400, isPanel: true, price: 11271, brand: "ROMMER", power50: 1670, passportPower: 2586, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216140", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1670, passportPower: 2586, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216150", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1500, isPanel: true, price: 11271, brand: "ROMMER", power50: 1788, passportPower: 2770, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216150", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1788, passportPower: 2770, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216160", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1600, isPanel: true, price: 11271, brand: "ROMMER", power50: 1908, passportPower: 2956, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216160", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1908, passportPower: 2956, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216170", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1700, isPanel: true, price: 11271, brand: "ROMMER", power50: 2027, passportPower: 3140, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216170", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2027, passportPower: 3140, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216180", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1800, isPanel: true, price: 11271, brand: "ROMMER", power50: 2147, passportPower: 3326, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216180", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2147, passportPower: 3326, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216190", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 1900, isPanel: true, price: 11271, brand: "ROMMER", power50: 2266, passportPower: 3510, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216190", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 1900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2266, passportPower: 3510, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216200", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2000, isPanel: true, price: 11271, brand: "ROMMER", power50: 2386, passportPower: 3695, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216200", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2386, passportPower: 3695, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216210", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2100, isPanel: true, price: 11271, brand: "ROMMER", power50: 2501, passportPower: 3874, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216210", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2501, passportPower: 3874, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216220", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2200, isPanel: true, price: 11271, brand: "ROMMER", power50: 2624, passportPower: 4063, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216220", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2624, passportPower: 4063, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216230", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2300, isPanel: true, price: 11271, brand: "ROMMER", power50: 2744, passportPower: 4249, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216230", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2300, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2744, passportPower: 4249, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216240", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2400, isPanel: true, price: 11271, brand: "ROMMER", power50: 2863, passportPower: 4434, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216240", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2863, passportPower: 4434, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216250", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2500, isPanel: true, price: 11271, brand: "ROMMER", power50: 2982, passportPower: 4619, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216250", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2982, passportPower: 4619, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216260", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2600, isPanel: true, price: 11271, brand: "ROMMER", power50: 3102, passportPower: 4804, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-216260", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3102, passportPower: 4804, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216280", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 2800, isPanel: true, price: 12426, brand: "ROMMER", power50: 3340, passportPower: 5172, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-216280", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 2800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3340, passportPower: 5172, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-216300", name: "Стальной панельный Compact (Тип 21)", height: 600, sec: 3000, isPanel: true, price: 12426, brand: "ROMMER", power50: 3579, passportPower: 5543, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-216300", name: "Стальной панельный Ventil (Тип 21)", height: 600, sec: 3000, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3579, passportPower: 5543, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-222060", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 600, isPanel: true, price: 5445, brand: "ROMMER", power50: 412, passportPower: 638, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222060", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 600, isPanel: true, bottom: true, price: 7611, brand: "ROMMER", power50: 412, passportPower: 638, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222070", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 700, isPanel: true, price: 5891, brand: "ROMMER", power50: 474, passportPower: 734, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222070", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 700, isPanel: true, bottom: true, price: 8107, brand: "ROMMER", power50: 474, passportPower: 734, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222080", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 800, isPanel: true, price: 6436, brand: "ROMMER", power50: 536, passportPower: 830, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222080", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 800, isPanel: true, bottom: true, price: 8821, brand: "ROMMER", power50: 536, passportPower: 830, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222090", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 900, isPanel: true, price: 6930, brand: "ROMMER", power50: 599, passportPower: 927, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222090", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 900, isPanel: true, bottom: true, price: 9379, brand: "ROMMER", power50: 599, passportPower: 927, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222100", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1000, isPanel: true, price: 7502, brand: "ROMMER", power50: 661, passportPower: 1023, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222100", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1000, isPanel: true, bottom: true, price: 9993, brand: "ROMMER", power50: 661, passportPower: 1023, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222110", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1100, isPanel: true, price: 8020, brand: "ROMMER", power50: 724, passportPower: 1121, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222110", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1100, isPanel: true, bottom: true, price: 10526, brand: "ROMMER", power50: 724, passportPower: 1121, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222120", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1200, isPanel: true, price: 8514, brand: "ROMMER", power50: 786, passportPower: 1218, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222120", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1200, isPanel: true, bottom: true, price: 11082, brand: "ROMMER", power50: 786, passportPower: 1218, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222130", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1300, isPanel: true, price: 9036, brand: "ROMMER", power50: 848, passportPower: 1314, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222130", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1300, isPanel: true, bottom: true, price: 11644, brand: "ROMMER", power50: 848, passportPower: 1314, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222140", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1400, isPanel: true, price: 9630, brand: "ROMMER", power50: 911, passportPower: 1411, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222140", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1400, isPanel: true, bottom: true, price: 12056, brand: "ROMMER", power50: 911, passportPower: 1411, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222150", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1500, isPanel: true, price: 10124, brand: "ROMMER", power50: 973, passportPower: 1507, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222150", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1500, isPanel: true, bottom: true, price: 12552, brand: "ROMMER", power50: 973, passportPower: 1507, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222160", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1600, isPanel: true, price: 10801, brand: "ROMMER", power50: 1036, passportPower: 1604, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222160", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1600, isPanel: true, bottom: true, price: 13331, brand: "ROMMER", power50: 1036, passportPower: 1604, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222170", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1700, isPanel: true, price: 11433, brand: "ROMMER", power50: 1097, passportPower: 1699, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222170", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1700, isPanel: true, bottom: true, price: 13971, brand: "ROMMER", power50: 1097, passportPower: 1699, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-222180", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1800, isPanel: true, price: 11962, brand: "ROMMER", power50: 1160, passportPower: 1797, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222180", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1800, isPanel: true, bottom: true, price: 14852, brand: "ROMMER", power50: 1160, passportPower: 1797, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222190", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 1900, isPanel: true, price: 12494, brand: "ROMMER", power50: 1225, passportPower: 1897, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222190", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 1900, isPanel: true, bottom: true, price: 15411, brand: "ROMMER", power50: 1225, passportPower: 1897, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-222200", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2000, isPanel: true, price: 13501, brand: "ROMMER", power50: 1288, passportPower: 1995, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222200", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2000, isPanel: true, bottom: true, price: 16568, brand: "ROMMER", power50: 1288, passportPower: 1995, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222210", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2100, isPanel: true, price: 14049, brand: "ROMMER", power50: 1354, passportPower: 2096, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222210", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2100, isPanel: true, bottom: true, price: 17144, brand: "ROMMER", power50: 1354, passportPower: 2096, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-222220", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2200, isPanel: true, price: 14743, brand: "ROMMER", power50: 1418, passportPower: 2196, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-222220", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2200, isPanel: true, bottom: true, price: 17720, brand: "ROMMER", power50: 1418, passportPower: 2196, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222230", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2300, isPanel: true, price: 15215, brand: "ROMMER", power50: 1482, passportPower: 2296, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222230", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2300, isPanel: true, bottom: true, price: 18353, brand: "ROMMER", power50: 1482, passportPower: 2296, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-222240", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2400, isPanel: true, price: 15787, brand: "ROMMER", power50: 1547, passportPower: 2396, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222240", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2400, isPanel: true, bottom: true, price: 18983, brand: "ROMMER", power50: 1547, passportPower: 2396, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222250", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2500, isPanel: true, price: 16332, brand: "ROMMER", power50: 1609, passportPower: 2492, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222250", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2500, isPanel: true, bottom: true, price: 19559, brand: "ROMMER", power50: 1609, passportPower: 2492, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-222260", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2600, isPanel: true, price: 17351, brand: "ROMMER", power50: 1674, passportPower: 2593, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222260", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2600, isPanel: true, bottom: true, price: 20700, brand: "ROMMER", power50: 1674, passportPower: 2593, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222280", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 2800, isPanel: true, price: 18787, brand: "ROMMER", power50: 1804, passportPower: 2794, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222280", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 2800, isPanel: true, bottom: true, price: 22755, brand: "ROMMER", power50: 1804, passportPower: 2794, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-222300", name: "Стальной панельный Compact (Тип 22)", height: 200, sec: 3000, isPanel: true, price: 20273, brand: "ROMMER", power50: 1932, passportPower: 2991, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-222300", name: "Стальной панельный Ventil (Тип 22)", height: 200, sec: 3000, isPanel: true, bottom: true, price: 23237, brand: "ROMMER", power50: 1932, passportPower: 2991, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-223040", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 400, isPanel: true, price: 4787, brand: "ROMMER", power50: 426, passportPower: 660, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223040", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 400, isPanel: true, bottom: true, price: 6730, brand: "ROMMER", power50: 426, passportPower: 660, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223050", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 500, isPanel: true, price: 5291, brand: "ROMMER", power50: 515, passportPower: 798, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223050", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 500, isPanel: true, bottom: true, price: 7184, brand: "ROMMER", power50: 515, passportPower: 798, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223060", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 600, isPanel: true, price: 5846, brand: "ROMMER", power50: 594, passportPower: 920, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223060", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 600, isPanel: true, bottom: true, price: 7819, brand: "ROMMER", power50: 594, passportPower: 920, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223070", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 700, isPanel: true, price: 6346, brand: "ROMMER", power50: 678, passportPower: 1050, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223070", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 700, isPanel: true, bottom: true, price: 8284, brand: "ROMMER", power50: 678, passportPower: 1050, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223080", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 800, isPanel: true, price: 6916, brand: "ROMMER", power50: 762, passportPower: 1180, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223080", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 800, isPanel: true, bottom: true, price: 8874, brand: "ROMMER", power50: 762, passportPower: 1180, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223090", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 900, isPanel: true, price: 7445, brand: "ROMMER", power50: 847, passportPower: 1311, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223090", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 900, isPanel: true, bottom: true, price: 9411, brand: "ROMMER", power50: 847, passportPower: 1311, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223100", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1000, isPanel: true, price: 8060, brand: "ROMMER", power50: 930, passportPower: 1441, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223100", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1000, isPanel: true, bottom: true, price: 10053, brand: "ROMMER", power50: 930, passportPower: 1441, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223110", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1100, isPanel: true, price: 8950, brand: "ROMMER", power50: 1014, passportPower: 1571, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223110", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1100, isPanel: true, bottom: true, price: 10950, brand: "ROMMER", power50: 1014, passportPower: 1571, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223120", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1200, isPanel: true, price: 9508, brand: "ROMMER", power50: 1098, passportPower: 1701, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223120", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1200, isPanel: true, bottom: true, price: 11526, brand: "ROMMER", power50: 1098, passportPower: 1701, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223130", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1300, isPanel: true, price: 10083, brand: "ROMMER", power50: 1208, passportPower: 1871, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223130", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1300, isPanel: true, bottom: true, price: 12102, brand: "ROMMER", power50: 1208, passportPower: 1871, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223140", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1400, isPanel: true, price: 10739, brand: "ROMMER", power50: 1301, passportPower: 2015, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223140", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1400, isPanel: true, bottom: true, price: 12743, brand: "ROMMER", power50: 1301, passportPower: 2015, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223150", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1500, isPanel: true, price: 11296, brand: "ROMMER", power50: 1394, passportPower: 2159, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223150", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1500, isPanel: true, bottom: true, price: 13319, brand: "ROMMER", power50: 1394, passportPower: 2159, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223160", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1600, isPanel: true, price: 12069, brand: "ROMMER", power50: 1487, passportPower: 2303, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223160", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1600, isPanel: true, bottom: true, price: 14103, brand: "ROMMER", power50: 1487, passportPower: 2303, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223170", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1700, isPanel: true, price: 13352, brand: "ROMMER", power50: 1579, passportPower: 2446, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223170", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1700, isPanel: true, bottom: true, price: 15463, brand: "ROMMER", power50: 1579, passportPower: 2446, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223180", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1800, isPanel: true, price: 13965, brand: "ROMMER", power50: 1672, passportPower: 2590, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223180", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1800, isPanel: true, bottom: true, price: 16456, brand: "ROMMER", power50: 1672, passportPower: 2590, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223190", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 1900, isPanel: true, price: 14578, brand: "ROMMER", power50: 1765, passportPower: 2734, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-223190", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 1900, isPanel: true, bottom: true, price: 17177, brand: "ROMMER", power50: 1765, passportPower: 2734, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-223200", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2000, isPanel: true, price: 15803, brand: "ROMMER", power50: 1859, passportPower: 2879, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223200", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2000, isPanel: true, bottom: true, price: 18339, brand: "ROMMER", power50: 1859, passportPower: 2879, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223210", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2100, isPanel: true, price: 16400, brand: "ROMMER", power50: 1952, passportPower: 3023, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-223210", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2100, isPanel: true, bottom: true, price: 18992, brand: "ROMMER", power50: 1952, passportPower: 3023, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-223220", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2200, isPanel: true, price: 17030, brand: "ROMMER", power50: 2045, passportPower: 3167, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223220", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2200, isPanel: true, bottom: true, price: 19588, brand: "ROMMER", power50: 2045, passportPower: 3167, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223230", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2300, isPanel: true, price: 17731, brand: "ROMMER", power50: 2137, passportPower: 3310, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223230", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2300, isPanel: true, bottom: true, price: 20289, brand: "ROMMER", power50: 2137, passportPower: 3310, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-223240", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2400, isPanel: true, price: 18433, brand: "ROMMER", power50: 2230, passportPower: 3454, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223240", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2400, isPanel: true, bottom: true, price: 20990, brand: "ROMMER", power50: 2230, passportPower: 3454, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223250", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2500, isPanel: true, price: 19099, brand: "ROMMER", power50: 2323, passportPower: 3598, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-223250", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2500, isPanel: true, bottom: true, price: 21655, brand: "ROMMER", power50: 2323, passportPower: 3598, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-223260", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2600, isPanel: true, price: 20282, brand: "ROMMER", power50: 2416, passportPower: 3742, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223260", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2600, isPanel: true, bottom: true, price: 22911, brand: "ROMMER", power50: 2416, passportPower: 3742, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-223280", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 2800, isPanel: true, price: 21746, brand: "ROMMER", power50: 2602, passportPower: 4029, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223280", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 2800, isPanel: true, bottom: true, price: 24428, brand: "ROMMER", power50: 2602, passportPower: 4029, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-223300", name: "Стальной панельный Compact (Тип 22)", height: 300, sec: 3000, isPanel: true, price: 23111, brand: "ROMMER", power50: 2788, passportPower: 4317, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-223300", name: "Стальной панельный Ventil (Тип 22)", height: 300, sec: 3000, isPanel: true, bottom: true, price: 25865, brand: "ROMMER", power50: 2788, passportPower: 4317, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224040", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 400, isPanel: true, price: 5108, brand: "ROMMER", power50: 525, passportPower: 813, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224040", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 400, isPanel: true, bottom: true, price: 7279, brand: "ROMMER", power50: 525, passportPower: 813, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224050", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 500, isPanel: true, price: 5715, brand: "ROMMER", power50: 656, passportPower: 1016, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224050", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 500, isPanel: true, bottom: true, price: 7912, brand: "ROMMER", power50: 656, passportPower: 1016, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224060", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 600, isPanel: true, price: 6374, brand: "ROMMER", power50: 787, passportPower: 1220, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224060", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 600, isPanel: true, bottom: true, price: 8600, brand: "ROMMER", power50: 787, passportPower: 1220, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224070", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 700, isPanel: true, price: 7008, brand: "ROMMER", power50: 919, passportPower: 1423, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224070", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 700, isPanel: true, bottom: true, price: 9257, brand: "ROMMER", power50: 919, passportPower: 1423, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224080", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 800, isPanel: true, price: 7691, brand: "ROMMER", power50: 1050, passportPower: 1627, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224080", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 800, isPanel: true, bottom: true, price: 9971, brand: "ROMMER", power50: 1050, passportPower: 1627, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224090", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 900, isPanel: true, price: 8245, brand: "ROMMER", power50: 1182, passportPower: 1830, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224090", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 900, isPanel: true, bottom: true, price: 10577, brand: "ROMMER", power50: 1182, passportPower: 1830, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224100", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1000, isPanel: true, price: 8831, brand: "ROMMER", power50: 1313, passportPower: 2033, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224100", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1000, isPanel: true, bottom: true, price: 11262, brand: "ROMMER", power50: 1313, passportPower: 2033, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224110", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1100, isPanel: true, price: 9680, brand: "ROMMER", power50: 1444, passportPower: 2236, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224110", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1100, isPanel: true, bottom: true, price: 12172, brand: "ROMMER", power50: 1444, passportPower: 2236, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224120", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1200, isPanel: true, price: 10349, brand: "ROMMER", power50: 1575, passportPower: 2439, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224120", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1200, isPanel: true, bottom: true, price: 12846, brand: "ROMMER", power50: 1575, passportPower: 2439, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224130", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1300, isPanel: true, price: 10964, brand: "ROMMER", power50: 1707, passportPower: 2643, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224130", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1300, isPanel: true, bottom: true, price: 13521, brand: "ROMMER", power50: 1707, passportPower: 2643, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224140", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1400, isPanel: true, price: 11708, brand: "ROMMER", power50: 1838, passportPower: 2846, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224140", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1400, isPanel: true, bottom: true, price: 14275, brand: "ROMMER", power50: 1838, passportPower: 2846, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224150", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1500, isPanel: true, price: 12350, brand: "ROMMER", power50: 1971, passportPower: 3053, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224150", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1500, isPanel: true, bottom: true, price: 14973, brand: "ROMMER", power50: 1971, passportPower: 3053, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224160", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1600, isPanel: true, price: 13247, brand: "ROMMER", power50: 2100, passportPower: 3253, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224160", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1600, isPanel: true, bottom: true, price: 15924, brand: "ROMMER", power50: 2100, passportPower: 3253, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224170", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1700, isPanel: true, price: 14665, brand: "ROMMER", power50: 2232, passportPower: 3457, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224170", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1700, isPanel: true, bottom: true, price: 17626, brand: "ROMMER", power50: 2232, passportPower: 3457, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224180", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1800, isPanel: true, price: 15347, brand: "ROMMER", power50: 2363, passportPower: 3660, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224180", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1800, isPanel: true, bottom: true, price: 18666, brand: "ROMMER", power50: 2363, passportPower: 3660, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224190", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 1900, isPanel: true, price: 16035, brand: "ROMMER", power50: 2496, passportPower: 3865, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224190", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 1900, isPanel: true, bottom: true, price: 19389, brand: "ROMMER", power50: 2496, passportPower: 3865, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224200", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2000, isPanel: true, price: 17371, brand: "ROMMER", power50: 2625, passportPower: 4066, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224200", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2000, isPanel: true, bottom: true, price: 20868, brand: "ROMMER", power50: 2625, passportPower: 4066, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224210", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2100, isPanel: true, price: 18076, brand: "ROMMER", power50: 2757, passportPower: 4270, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224210", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2100, isPanel: true, bottom: true, price: 21609, brand: "ROMMER", power50: 2757, passportPower: 4270, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224220", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2200, isPanel: true, price: 18781, brand: "ROMMER", power50: 2889, passportPower: 4474, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224220", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2200, isPanel: true, bottom: true, price: 22354, brand: "ROMMER", power50: 2889, passportPower: 4474, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224230", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2300, isPanel: true, price: 19569, brand: "ROMMER", power50: 3020, passportPower: 4676, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224230", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2300, isPanel: true, bottom: true, price: 23215, brand: "ROMMER", power50: 3020, passportPower: 4676, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224240", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2400, isPanel: true, price: 20360, brand: "ROMMER", power50: 3152, passportPower: 4882, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224240", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2400, isPanel: true, bottom: true, price: 24047, brand: "ROMMER", power50: 3152, passportPower: 4882, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224250", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2500, isPanel: true, price: 21092, brand: "ROMMER", power50: 3284, passportPower: 5086, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224250", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2500, isPanel: true, bottom: true, price: 24821, brand: "ROMMER", power50: 3284, passportPower: 5086, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224260", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2600, isPanel: true, price: 22410, brand: "ROMMER", power50: 3413, passportPower: 5286, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224260", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2600, isPanel: true, bottom: true, price: 26279, brand: "ROMMER", power50: 3413, passportPower: 5286, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-224280", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 2800, isPanel: true, price: 24092, brand: "ROMMER", power50: 3677, passportPower: 5694, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-224280", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 2800, isPanel: true, bottom: true, price: 28081, brand: "ROMMER", power50: 3677, passportPower: 5694, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-224300", name: "Стальной панельный Compact (Тип 22)", height: 400, sec: 3000, isPanel: true, price: 25597, brand: "ROMMER", power50: 3938, passportPower: 6099, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-224300", name: "Стальной панельный Ventil (Тип 22)", height: 400, sec: 3000, isPanel: true, bottom: true, price: 29608, brand: "ROMMER", power50: 3938, passportPower: 6099, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-225040", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 400, isPanel: true, price: 5526, brand: "ROMMER", power50: 619, passportPower: 958, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225040", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 400, isPanel: true, bottom: true, price: 7500, brand: "ROMMER", power50: 619, passportPower: 958, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225050", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 500, isPanel: true, price: 6175, brand: "ROMMER", power50: 751, passportPower: 1163, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225050", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 500, isPanel: true, bottom: true, price: 8152, brand: "ROMMER", power50: 751, passportPower: 1163, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225060", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 600, isPanel: true, price: 6903, brand: "ROMMER", power50: 883, passportPower: 1368, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225060", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 600, isPanel: true, bottom: true, price: 8900, brand: "ROMMER", power50: 883, passportPower: 1368, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225070", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 700, isPanel: true, price: 7568, brand: "ROMMER", power50: 1016, passportPower: 1573, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225070", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 700, isPanel: true, bottom: true, price: 9566, brand: "ROMMER", power50: 1016, passportPower: 1573, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225080", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 800, isPanel: true, price: 8296, brand: "ROMMER", power50: 1148, passportPower: 1778, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225080", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 800, isPanel: true, bottom: true, price: 10236, brand: "ROMMER", power50: 1148, passportPower: 1778, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225090", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 900, isPanel: true, price: 8942, brand: "ROMMER", power50: 1316, passportPower: 2038, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225090", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 900, isPanel: true, bottom: true, price: 10894, brand: "ROMMER", power50: 1316, passportPower: 2038, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225100", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1000, isPanel: true, price: 9659, brand: "ROMMER", power50: 1463, passportPower: 2265, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225100", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1000, isPanel: true, bottom: true, price: 11681, brand: "ROMMER", power50: 1463, passportPower: 2265, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225110", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1100, isPanel: true, price: 10749, brand: "ROMMER", power50: 1608, passportPower: 2491, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225110", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1100, isPanel: true, bottom: true, price: 13398, brand: "ROMMER", power50: 1608, passportPower: 2491, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225120", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1200, isPanel: true, price: 11430, brand: "ROMMER", power50: 1755, passportPower: 2718, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225120", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1200, isPanel: true, bottom: true, price: 14141, brand: "ROMMER", power50: 1755, passportPower: 2718, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225130", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1300, isPanel: true, price: 12155, brand: "ROMMER", power50: 1901, passportPower: 2944, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225130", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1300, isPanel: true, bottom: true, price: 14848, brand: "ROMMER", power50: 1901, passportPower: 2944, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225140", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1400, isPanel: true, price: 12975, brand: "ROMMER", power50: 2048, passportPower: 3171, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225140", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1400, isPanel: true, bottom: true, price: 14923, brand: "ROMMER", power50: 2048, passportPower: 3171, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225150", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1500, isPanel: true, price: 13663, brand: "ROMMER", power50: 2193, passportPower: 3397, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225150", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1500, isPanel: true, bottom: true, price: 15676, brand: "ROMMER", power50: 2193, passportPower: 3397, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225160", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1600, isPanel: true, price: 14665, brand: "ROMMER", power50: 2340, passportPower: 3624, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225160", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1600, isPanel: true, bottom: true, price: 16719, brand: "ROMMER", power50: 2340, passportPower: 3624, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225170", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1700, isPanel: true, price: 16235, brand: "ROMMER", power50: 2486, passportPower: 3850, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225170", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1700, isPanel: true, bottom: true, price: 18480, brand: "ROMMER", power50: 2486, passportPower: 3850, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225180", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1800, isPanel: true, price: 17006, brand: "ROMMER", power50: 2632, passportPower: 4076, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225180", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1800, isPanel: true, bottom: true, price: 19600, brand: "ROMMER", power50: 2632, passportPower: 4076, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225190", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 1900, isPanel: true, price: 17760, brand: "ROMMER", power50: 2778, passportPower: 4303, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-225190", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 1900, isPanel: true, bottom: true, price: 20340, brand: "ROMMER", power50: 2778, passportPower: 4303, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225200", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2000, isPanel: true, price: 19193, brand: "ROMMER", power50: 2924, passportPower: 4529, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225200", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2000, isPanel: true, bottom: true, price: 21905, brand: "ROMMER", power50: 2924, passportPower: 4529, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225210", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2100, isPanel: true, price: 19988, brand: "ROMMER", power50: 3071, passportPower: 4756, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-225210", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2100, isPanel: true, bottom: true, price: 22702, brand: "ROMMER", power50: 3071, passportPower: 4756, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225220", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2200, isPanel: true, price: 20780, brand: "ROMMER", power50: 3217, passportPower: 4982, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225220", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2200, isPanel: true, bottom: true, price: 23460, brand: "ROMMER", power50: 3217, passportPower: 4982, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225230", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2300, isPanel: true, price: 21718, brand: "ROMMER", power50: 3363, passportPower: 5209, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-225230", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2300, isPanel: true, bottom: true, price: 24377, brand: "ROMMER", power50: 3363, passportPower: 5209, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225240", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2400, isPanel: true, price: 22567, brand: "ROMMER", power50: 3510, passportPower: 5436, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225240", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2400, isPanel: true, bottom: true, price: 25273, brand: "ROMMER", power50: 3510, passportPower: 5436, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225250", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2500, isPanel: true, price: 23340, brand: "ROMMER", power50: 3657, passportPower: 5663, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225250", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2500, isPanel: true, bottom: true, price: 26104, brand: "ROMMER", power50: 3657, passportPower: 5663, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225260", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2600, isPanel: true, price: 24847, brand: "ROMMER", power50: 3803, passportPower: 5889, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225260", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2600, isPanel: true, bottom: true, price: 27625, brand: "ROMMER", power50: 3803, passportPower: 5889, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225280", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 2800, isPanel: true, price: 26704, brand: "ROMMER", power50: 4095, passportPower: 6342, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225280", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 2800, isPanel: true, bottom: true, price: 29535, brand: "ROMMER", power50: 4095, passportPower: 6342, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-225300", name: "Стальной панельный Compact (Тип 22)", height: 500, sec: 3000, isPanel: true, price: 28359, brand: "ROMMER", power50: 4388, passportPower: 6795, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-225300", name: "Стальной панельный Ventil (Тип 22)", height: 500, sec: 3000, isPanel: true, bottom: true, price: 31099, brand: "ROMMER", power50: 4388, passportPower: 6795, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226040", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 400, isPanel: true, price: 6382, brand: "ROMMER", power50: 769, passportPower: 1191, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226040", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 400, isPanel: true, bottom: true, price: 8859, brand: "ROMMER", power50: 769, passportPower: 1191, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226050", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 500, isPanel: true, price: 7140, brand: "ROMMER", power50: 912, passportPower: 1412, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226050", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 500, isPanel: true, bottom: true, price: 9631, brand: "ROMMER", power50: 912, passportPower: 1412, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226060", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 600, isPanel: true, price: 7963, brand: "ROMMER", power50: 1056, passportPower: 1635, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226060", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 600, isPanel: true, bottom: true, price: 10468, brand: "ROMMER", power50: 1056, passportPower: 1635, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226070", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 700, isPanel: true, price: 8755, brand: "ROMMER", power50: 1200, passportPower: 1858, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226070", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 700, isPanel: true, bottom: true, price: 11269, brand: "ROMMER", power50: 1200, passportPower: 1858, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226080", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 800, isPanel: true, price: 9606, brand: "ROMMER", power50: 1343, passportPower: 2080, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226080", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 800, isPanel: true, bottom: true, price: 12250, brand: "ROMMER", power50: 1343, passportPower: 2080, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226090", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 900, isPanel: true, price: 10300, brand: "ROMMER", power50: 1476, passportPower: 2286, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226090", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1476, passportPower: 2286, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-226100", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1000, isPanel: true, price: 11156, brand: "ROMMER", power50: 1629, passportPower: 2523, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226100", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1000, isPanel: true, bottom: true, price: 13838, brand: "ROMMER", power50: 1629, passportPower: 2523, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226110", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1100, isPanel: true, price: 11914, brand: "ROMMER", power50: 1774, passportPower: 2747, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226110", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1100, isPanel: true, bottom: true, price: 14648, brand: "ROMMER", power50: 1774, passportPower: 2747, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226120", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1200, isPanel: true, price: 12737, brand: "ROMMER", power50: 1915, passportPower: 2966, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226120", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1200, isPanel: true, bottom: true, price: 15460, brand: "ROMMER", power50: 1915, passportPower: 2966, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226130", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1300, isPanel: true, price: 13495, brand: "ROMMER", power50: 2079, passportPower: 3220, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226130", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1300, isPanel: true, bottom: true, price: 16272, brand: "ROMMER", power50: 2079, passportPower: 3220, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226140", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1400, isPanel: true, price: 14410, brand: "ROMMER", power50: 2239, passportPower: 3468, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226140", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1400, isPanel: true, bottom: true, price: 17181, brand: "ROMMER", power50: 2239, passportPower: 3468, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226150", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1500, isPanel: true, price: 15201, brand: "ROMMER", power50: 2399, passportPower: 3715, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226150", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1500, isPanel: true, bottom: true, price: 18023, brand: "ROMMER", power50: 2399, passportPower: 3715, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226160", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1600, isPanel: true, price: 16304, brand: "ROMMER", power50: 2559, passportPower: 3963, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226160", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1600, isPanel: true, bottom: true, price: 19169, brand: "ROMMER", power50: 2559, passportPower: 3963, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226170", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1700, isPanel: true, price: 17522, brand: "ROMMER", power50: 2718, passportPower: 4210, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226170", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1700, isPanel: true, bottom: true, price: 20675, brand: "ROMMER", power50: 2718, passportPower: 4210, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226180", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1800, isPanel: true, price: 18337, brand: "ROMMER", power50: 2879, passportPower: 4459, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226180", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1800, isPanel: true, bottom: true, price: 21897, brand: "ROMMER", power50: 2879, passportPower: 4459, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226190", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 1900, isPanel: true, price: 19159, brand: "ROMMER", power50: 3039, passportPower: 4706, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226190", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 1900, isPanel: true, bottom: true, price: 22745, brand: "ROMMER", power50: 3039, passportPower: 4706, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226200", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2000, isPanel: true, price: 20755, brand: "ROMMER", power50: 3199, passportPower: 4954, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226200", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2000, isPanel: true, bottom: true, price: 24481, brand: "ROMMER", power50: 3199, passportPower: 4954, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-226210", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2100, isPanel: true, price: 21598, brand: "ROMMER", power50: 3355, passportPower: 5195, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226210", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2100, isPanel: true, bottom: true, price: 25350, brand: "ROMMER", power50: 3355, passportPower: 5195, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226220", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2200, isPanel: true, price: 22440, brand: "ROMMER", power50: 3519, passportPower: 5449, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226220", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2200, isPanel: true, bottom: true, price: 26227, brand: "ROMMER", power50: 3519, passportPower: 5449, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226230", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2300, isPanel: true, price: 23381, brand: "ROMMER", power50: 3679, passportPower: 5698, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226230", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2300, isPanel: true, bottom: true, price: 27236, brand: "ROMMER", power50: 3679, passportPower: 5698, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226240", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2400, isPanel: true, price: 24326, brand: "ROMMER", power50: 3839, passportPower: 5945, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226240", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2400, isPanel: true, bottom: true, price: 28212, brand: "ROMMER", power50: 3839, passportPower: 5945, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226250", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2500, isPanel: true, price: 25202, brand: "ROMMER", power50: 3999, passportPower: 6193, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-226250", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2500, isPanel: true, bottom: true, price: 29122, brand: "ROMMER", power50: 3999, passportPower: 6193, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226260", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2600, isPanel: true, price: 26777, brand: "ROMMER", power50: 4159, passportPower: 6441, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226260", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2600, isPanel: true, bottom: true, price: 30833, brand: "ROMMER", power50: 4159, passportPower: 6441, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226280", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 2800, isPanel: true, price: 28786, brand: "ROMMER", power50: 4479, passportPower: 6937, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226280", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 2800, isPanel: true, bottom: true, price: 32950, brand: "ROMMER", power50: 4479, passportPower: 6937, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-226300", name: "Стальной панельный Compact (Тип 22)", height: 600, sec: 3000, isPanel: true, price: 30585, brand: "ROMMER", power50: 4799, passportPower: 7432, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-226300", name: "Стальной панельный Ventil (Тип 22)", height: 600, sec: 3000, isPanel: true, bottom: true, price: 34741, brand: "ROMMER", power50: 4799, passportPower: 7432, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-332060", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 600, isPanel: true, price: 28924, brand: "ROMMER", power50: 581, passportPower: 900, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332060", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 600, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 581, passportPower: 900, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332070", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 700, isPanel: true, price: 28924, brand: "ROMMER", power50: 669, passportPower: 1035, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332070", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 700, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 669, passportPower: 1035, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332080", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 800, isPanel: true, price: 28924, brand: "ROMMER", power50: 756, passportPower: 1170, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332080", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 800, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 756, passportPower: 1170, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332090", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 900, isPanel: true, price: 28924, brand: "ROMMER", power50: 844, passportPower: 1307, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332090", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 900, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 844, passportPower: 1307, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332100", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1000, isPanel: true, price: 28924, brand: "ROMMER", power50: 931, passportPower: 1442, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332100", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1000, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 931, passportPower: 1442, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332110", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1100, isPanel: true, price: 28924, brand: "ROMMER", power50: 1018, passportPower: 1577, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332110", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1100, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1018, passportPower: 1577, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332120", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1200, isPanel: true, price: 11271, brand: "ROMMER", power50: 1106, passportPower: 1712, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332120", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1106, passportPower: 1712, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332130", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1300, isPanel: true, price: 11271, brand: "ROMMER", power50: 1193, passportPower: 1848, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332130", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1300, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1193, passportPower: 1848, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332140", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1400, isPanel: true, price: 11271, brand: "ROMMER", power50: 1286, passportPower: 1992, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332140", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1400, isPanel: true, bottom: true, price: 17822, brand: "ROMMER", power50: 1286, passportPower: 1992, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332150", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1500, isPanel: true, price: 28924, brand: "ROMMER", power50: 1379, passportPower: 2135, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332150", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1500, isPanel: true, bottom: true, price: 17822, brand: "ROMMER", power50: 1379, passportPower: 2135, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332160", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1600, isPanel: true, price: 11271, brand: "ROMMER", power50: 1470, passportPower: 2277, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332160", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1600, isPanel: true, bottom: true, price: 29205, brand: "ROMMER", power50: 1470, passportPower: 2277, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332170", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1700, isPanel: true, price: 11271, brand: "ROMMER", power50: 1563, passportPower: 2421, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332170", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1700, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1563, passportPower: 2421, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332180", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1800, isPanel: true, price: 28924, brand: "ROMMER", power50: 1654, passportPower: 2562, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332180", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1654, passportPower: 2562, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332190", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 1900, isPanel: true, price: 28924, brand: "ROMMER", power50: 1747, passportPower: 2706, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332190", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 1900, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1747, passportPower: 2706, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332200", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2000, isPanel: true, price: 28924, brand: "ROMMER", power50: 1838, passportPower: 2847, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332200", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2000, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1838, passportPower: 2847, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332210", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2100, isPanel: true, price: 28924, brand: "ROMMER", power50: 1930, passportPower: 2989, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332210", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2100, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1930, passportPower: 2989, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332220", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2200, isPanel: true, price: 11271, brand: "ROMMER", power50: 2022, passportPower: 3132, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332220", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2200, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2022, passportPower: 3132, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332230", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2300, isPanel: true, price: 11271, brand: "ROMMER", power50: 2113, passportPower: 3273, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332230", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2300, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2113, passportPower: 3273, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-332240", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2400, isPanel: true, price: 11271, brand: "ROMMER", power50: 2205, passportPower: 3415, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332240", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2205, passportPower: 3415, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332250", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2500, isPanel: true, price: 28924, brand: "ROMMER", power50: 2297, passportPower: 3558, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332250", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2500, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2297, passportPower: 3558, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332260", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2600, isPanel: true, price: 11271, brand: "ROMMER", power50: 2389, passportPower: 3700, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-332260", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2389, passportPower: 3700, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332280", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 2800, isPanel: true, price: 28924, brand: "ROMMER", power50: 2574, passportPower: 3986, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332280", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 2800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2574, passportPower: 3986, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-332300", name: "Стальной панельный Compact (Тип 33)", height: 200, sec: 3000, isPanel: true, price: 28924, brand: "ROMMER", power50: 2757, passportPower: 4269, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-332300", name: "Стальной панельный Ventil (Тип 33)", height: 200, sec: 3000, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2757, passportPower: 4269, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-333040", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 400, isPanel: true, price: 7412, brand: "ROMMER", power50: 570, passportPower: 883, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333040", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 400, isPanel: true, bottom: true, price: 9328, brand: "ROMMER", power50: 570, passportPower: 883, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333050", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 500, isPanel: true, price: 8181, brand: "ROMMER", power50: 688, passportPower: 1065, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333050", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 500, isPanel: true, bottom: true, price: 10114, brand: "ROMMER", power50: 688, passportPower: 1065, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333060", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 600, isPanel: true, price: 9026, brand: "ROMMER", power50: 805, passportPower: 1247, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333060", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 600, isPanel: true, bottom: true, price: 10961, brand: "ROMMER", power50: 805, passportPower: 1247, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333070", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 700, isPanel: true, price: 9811, brand: "ROMMER", power50: 923, passportPower: 1429, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333070", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 700, isPanel: true, bottom: true, price: 11748, brand: "ROMMER", power50: 923, passportPower: 1429, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333080", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 800, isPanel: true, price: 10672, brand: "ROMMER", power50: 1040, passportPower: 1611, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333080", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 800, isPanel: true, bottom: true, price: 12611, brand: "ROMMER", power50: 1040, passportPower: 1611, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333090", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 900, isPanel: true, price: 11364, brand: "ROMMER", power50: 1158, passportPower: 1793, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333090", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 900, isPanel: true, bottom: true, price: 13306, brand: "ROMMER", power50: 1158, passportPower: 1793, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333100", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1000, isPanel: true, price: 12302, brand: "ROMMER", power50: 1311, passportPower: 2031, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333100", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1000, isPanel: true, bottom: true, price: 14245, brand: "ROMMER", power50: 1311, passportPower: 2031, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333110", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1100, isPanel: true, price: 13552, brand: "ROMMER", power50: 1443, passportPower: 2235, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333110", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1100, isPanel: true, bottom: true, price: 15727, brand: "ROMMER", power50: 1443, passportPower: 2235, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333120", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1200, isPanel: true, price: 14425, brand: "ROMMER", power50: 1574, passportPower: 2438, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333120", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1200, isPanel: true, bottom: true, price: 16611, brand: "ROMMER", power50: 1574, passportPower: 2438, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333130", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1300, isPanel: true, price: 15075, brand: "ROMMER", power50: 1705, passportPower: 2641, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333130", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1300, isPanel: true, bottom: true, price: 17255, brand: "ROMMER", power50: 1705, passportPower: 2641, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333140", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1400, isPanel: true, price: 16059, brand: "ROMMER", power50: 1836, passportPower: 2844, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333140", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1400, isPanel: true, bottom: true, price: 18268, brand: "ROMMER", power50: 1836, passportPower: 2844, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333150", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1500, isPanel: true, price: 16852, brand: "ROMMER", power50: 1967, passportPower: 3047, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333150", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1500, isPanel: true, bottom: true, price: 19088, brand: "ROMMER", power50: 1967, passportPower: 3047, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333160", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1600, isPanel: true, price: 18025, brand: "ROMMER", power50: 2099, passportPower: 3250, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333160", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1600, isPanel: true, bottom: true, price: 20282, brand: "ROMMER", power50: 2099, passportPower: 3250, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333170", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1700, isPanel: true, price: 20057, brand: "ROMMER", power50: 2230, passportPower: 3454, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333170", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1700, isPanel: true, bottom: true, price: 22448, brand: "ROMMER", power50: 2230, passportPower: 3454, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333180", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1800, isPanel: true, price: 20977, brand: "ROMMER", power50: 2361, passportPower: 3657, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333180", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1800, isPanel: true, bottom: true, price: 23555, brand: "ROMMER", power50: 2361, passportPower: 3657, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333190", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 1900, isPanel: true, price: 21624, brand: "ROMMER", power50: 2492, passportPower: 3860, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333190", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 1900, isPanel: true, bottom: true, price: 24170, brand: "ROMMER", power50: 2492, passportPower: 3860, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333200", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2000, isPanel: true, price: 23369, brand: "ROMMER", power50: 2623, passportPower: 4063, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333200", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2000, isPanel: true, bottom: true, price: 26011, brand: "ROMMER", power50: 2623, passportPower: 4063, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333210", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2100, isPanel: true, price: 24350, brand: "ROMMER", power50: 2755, passportPower: 4266, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333210", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2100, isPanel: true, bottom: true, price: 27000, brand: "ROMMER", power50: 2755, passportPower: 4266, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333220", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2200, isPanel: true, price: 25225, brand: "ROMMER", power50: 2886, passportPower: 4469, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333220", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2200, isPanel: true, bottom: true, price: 27879, brand: "ROMMER", power50: 2886, passportPower: 4469, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-333230", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2300, isPanel: true, price: 26242, brand: "ROMMER", power50: 3017, passportPower: 4672, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333230", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2300, isPanel: true, bottom: true, price: 29003, brand: "ROMMER", power50: 3017, passportPower: 4672, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333240", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2400, isPanel: true, price: 27329, brand: "ROMMER", power50: 3148, passportPower: 4876, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333240", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2400, isPanel: true, bottom: true, price: 29935, brand: "ROMMER", power50: 3148, passportPower: 4876, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333250", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2500, isPanel: true, price: 28353, brand: "ROMMER", power50: 3280, passportPower: 5079, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333250", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2500, isPanel: true, bottom: true, price: 30844, brand: "ROMMER", power50: 3280, passportPower: 5079, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333260", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2600, isPanel: true, price: 30010, brand: "ROMMER", power50: 3411, passportPower: 5282, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-333260", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2600, isPanel: true, bottom: true, price: 32745, brand: "ROMMER", power50: 3411, passportPower: 5282, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333280", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 2800, isPanel: true, price: 32154, brand: "ROMMER", power50: 3673, passportPower: 5688, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333280", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 2800, isPanel: true, bottom: true, price: 35065, brand: "ROMMER", power50: 3673, passportPower: 5688, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-333300", name: "Стальной панельный Compact (Тип 33)", height: 300, sec: 3000, isPanel: true, price: 34146, brand: "ROMMER", power50: 3935, passportPower: 6094, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-333300", name: "Стальной панельный Ventil (Тип 33)", height: 300, sec: 3000, isPanel: true, bottom: true, price: 36901, brand: "ROMMER", power50: 3935, passportPower: 6094, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-334040", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 400, isPanel: true, price: 28924, brand: "ROMMER", power50: 729, passportPower: 1129, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334040", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 400, isPanel: true, bottom: true, price: 29205, brand: "ROMMER", power50: 729, passportPower: 1129, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-334050", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 500, isPanel: true, price: 28924, brand: "ROMMER", power50: 912, passportPower: 1412, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334050", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 500, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 912, passportPower: 1412, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-334060", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 600, isPanel: true, price: 11271, brand: "ROMMER", power50: 1094, passportPower: 1694, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334060", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1094, passportPower: 1694, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334070", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 700, isPanel: true, price: 28924, brand: "ROMMER", power50: 1276, passportPower: 1976, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334070", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 700, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1276, passportPower: 1976, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334080", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 800, isPanel: true, price: 28924, brand: "ROMMER", power50: 1458, passportPower: 2258, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334080", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1458, passportPower: 2258, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334090", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 900, isPanel: true, price: 28924, brand: "ROMMER", power50: 1640, passportPower: 2540, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334090", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 900, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1640, passportPower: 2540, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334100", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1000, isPanel: true, price: 37143, brand: "ROMMER", power50: 1822, passportPower: 2822, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334100", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1000, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 1822, passportPower: 2822, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334110", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1100, isPanel: true, price: 11271, brand: "ROMMER", power50: 2005, passportPower: 3105, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334110", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1100, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2005, passportPower: 3105, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334120", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1200, isPanel: true, price: 42705, brand: "ROMMER", power50: 2187, passportPower: 3387, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334120", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2187, passportPower: 3387, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334130", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1300, isPanel: true, price: 11271, brand: "ROMMER", power50: 2370, passportPower: 3670, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334130", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1300, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2370, passportPower: 3670, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-334140", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1400, isPanel: true, price: 11271, brand: "ROMMER", power50: 2552, passportPower: 3952, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334140", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1400, isPanel: true, bottom: true, price: 17822, brand: "ROMMER", power50: 2552, passportPower: 3952, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334150", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1500, isPanel: true, price: 28924, brand: "ROMMER", power50: 2735, passportPower: 4235, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334150", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1500, isPanel: true, bottom: true, price: 17822, brand: "ROMMER", power50: 2735, passportPower: 4235, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334160", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1600, isPanel: true, price: 11271, brand: "ROMMER", power50: 2916, passportPower: 4516, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334160", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2916, passportPower: 4516, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334170", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1700, isPanel: true, price: 11271, brand: "ROMMER", power50: 3099, passportPower: 4800, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334170", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3099, passportPower: 4800, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334180", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1800, isPanel: true, price: 11271, brand: "ROMMER", power50: 3281, passportPower: 5081, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334180", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3281, passportPower: 5081, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334190", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 1900, isPanel: true, price: 11271, brand: "ROMMER", power50: 3464, passportPower: 5364, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-334190", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 1900, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3464, passportPower: 5364, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334200", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2000, isPanel: true, price: 28924, brand: "ROMMER", power50: 3645, passportPower: 5645, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334200", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2000, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 3645, passportPower: 5645, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334210", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2100, isPanel: true, price: 28924, brand: "ROMMER", power50: 3828, passportPower: 5928, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334210", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2100, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3828, passportPower: 5928, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334220", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2200, isPanel: true, price: 12426, brand: "ROMMER", power50: 4009, passportPower: 6209, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334220", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 4009, passportPower: 6209, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334230", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2300, isPanel: true, price: 12426, brand: "ROMMER", power50: 4192, passportPower: 6491, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334230", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2300, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 4192, passportPower: 6491, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-334240", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2400, isPanel: true, price: 14902, brand: "ROMMER", power50: 4374, passportPower: 6775, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334240", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 4374, passportPower: 6775, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334250", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2500, isPanel: true, price: 14902, brand: "ROMMER", power50: 4556, passportPower: 7056, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334250", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2500, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 4556, passportPower: 7056, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334260", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2600, isPanel: true, price: 14902, brand: "ROMMER", power50: 4739, passportPower: 7339, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334260", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 4739, passportPower: 7339, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334280", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 2800, isPanel: true, price: 28924, brand: "ROMMER", power50: 5105, passportPower: 7905, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334280", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 2800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 5105, passportPower: 7905, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-334300", name: "Стальной панельный Compact (Тип 33)", height: 400, sec: 3000, isPanel: true, price: 28924, brand: "ROMMER", power50: 5467, passportPower: 8467, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-334300", name: "Стальной панельный Ventil (Тип 33)", height: 400, sec: 3000, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 5467, passportPower: 8467, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-335040", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 400, isPanel: true, price: 8517, brand: "ROMMER", power50: 852, passportPower: 1320, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335040", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 400, isPanel: true, bottom: true, price: 10469, brand: "ROMMER", power50: 852, passportPower: 1320, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335050", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 500, isPanel: true, price: 9561, brand: "ROMMER", power50: 1035, passportPower: 1603, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335050", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 500, isPanel: true, bottom: true, price: 11497, brand: "ROMMER", power50: 1035, passportPower: 1603, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335060", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 600, isPanel: true, price: 10669, brand: "ROMMER", power50: 1249, passportPower: 1934, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335060", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 600, isPanel: true, bottom: true, price: 12620, brand: "ROMMER", power50: 1249, passportPower: 1934, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335070", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 700, isPanel: true, price: 11714, brand: "ROMMER", power50: 1457, passportPower: 2257, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335070", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 700, isPanel: true, bottom: true, price: 13648, brand: "ROMMER", power50: 1457, passportPower: 2257, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335080", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 800, isPanel: true, price: 12855, brand: "ROMMER", power50: 1666, passportPower: 2580, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335080", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 800, isPanel: true, bottom: true, price: 14787, brand: "ROMMER", power50: 1666, passportPower: 2580, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335090", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 900, isPanel: true, price: 13835, brand: "ROMMER", power50: 1874, passportPower: 2902, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335090", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 900, isPanel: true, bottom: true, price: 15783, brand: "ROMMER", power50: 1874, passportPower: 2902, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335100", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1000, isPanel: true, price: 14943, brand: "ROMMER", power50: 2082, passportPower: 3225, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335100", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1000, isPanel: true, bottom: true, price: 16890, brand: "ROMMER", power50: 2082, passportPower: 3225, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335110", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1100, isPanel: true, price: 16663, brand: "ROMMER", power50: 2290, passportPower: 3547, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335110", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1100, isPanel: true, bottom: true, price: 18506, brand: "ROMMER", power50: 2290, passportPower: 3547, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335120", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1200, isPanel: true, price: 17752, brand: "ROMMER", power50: 2498, passportPower: 3869, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335120", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1200, isPanel: true, bottom: true, price: 19584, brand: "ROMMER", power50: 2498, passportPower: 3869, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335130", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1300, isPanel: true, price: 18842, brand: "ROMMER", power50: 2707, passportPower: 4192, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335130", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1300, isPanel: true, bottom: true, price: 20661, brand: "ROMMER", power50: 2707, passportPower: 4192, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335140", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1400, isPanel: true, price: 20128, brand: "ROMMER", power50: 2915, passportPower: 4514, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335140", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1400, isPanel: true, bottom: true, price: 21918, brand: "ROMMER", power50: 2915, passportPower: 4514, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335150", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1500, isPanel: true, price: 21184, brand: "ROMMER", power50: 3123, passportPower: 4836, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335150", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1500, isPanel: true, bottom: true, price: 23011, brand: "ROMMER", power50: 3123, passportPower: 4836, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335160", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1600, isPanel: true, price: 22743, brand: "ROMMER", power50: 3331, passportPower: 5159, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335160", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1600, isPanel: true, bottom: true, price: 24560, brand: "ROMMER", power50: 3331, passportPower: 5159, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335170", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1700, isPanel: true, price: 25064, brand: "ROMMER", power50: 3539, passportPower: 5481, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335170", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1700, isPanel: true, bottom: true, price: 27212, brand: "ROMMER", power50: 3539, passportPower: 5481, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335180", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1800, isPanel: true, price: 26256, brand: "ROMMER", power50: 3747, passportPower: 5803, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335180", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1800, isPanel: true, bottom: true, price: 28736, brand: "ROMMER", power50: 3747, passportPower: 5803, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335190", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 1900, isPanel: true, price: 27414, brand: "ROMMER", power50: 3956, passportPower: 6126, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335190", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 1900, isPanel: true, bottom: true, price: 29908, brand: "ROMMER", power50: 3956, passportPower: 6126, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335200", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2000, isPanel: true, price: 29647, brand: "ROMMER", power50: 4164, passportPower: 6448, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335200", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2000, isPanel: true, bottom: true, price: 32213, brand: "ROMMER", power50: 4164, passportPower: 6448, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335210", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2100, isPanel: true, price: 30837, brand: "ROMMER", power50: 4371, passportPower: 6770, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335210", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2100, isPanel: true, bottom: true, price: 33690, brand: "ROMMER", power50: 4371, passportPower: 6770, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335220", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2200, isPanel: true, price: 32099, brand: "ROMMER", power50: 4580, passportPower: 7093, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335220", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2200, isPanel: true, bottom: true, price: 34662, brand: "ROMMER", power50: 4580, passportPower: 7093, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335230", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2300, isPanel: true, price: 33469, brand: "ROMMER", power50: 4789, passportPower: 7416, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335230", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2300, isPanel: true, bottom: true, price: 36212, brand: "ROMMER", power50: 4789, passportPower: 7416, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335240", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2400, isPanel: true, price: 34804, brand: "ROMMER", power50: 4996, passportPower: 7738, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335240", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2400, isPanel: true, bottom: true, price: 37365, brand: "ROMMER", power50: 4996, passportPower: 7738, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2010-335250", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2500, isPanel: true, price: 36067, brand: "ROMMER", power50: 5205, passportPower: 8061, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335250", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2500, isPanel: true, bottom: true, price: 38735, brand: "ROMMER", power50: 5205, passportPower: 8061, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335260", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2600, isPanel: true, price: 38264, brand: "ROMMER", power50: 5413, passportPower: 8383, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2020-335260", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2600, isPanel: true, bottom: true, price: 40931, brand: "ROMMER", power50: 5413, passportPower: 8383, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335280", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 2800, isPanel: true, price: 41156, brand: "ROMMER", power50: 5829, passportPower: 9027, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335280", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 2800, isPanel: true, bottom: true, price: 43802, brand: "ROMMER", power50: 5829, passportPower: 9027, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-335300", name: "Стальной панельный Compact (Тип 33)", height: 500, sec: 3000, isPanel: true, price: 43677, brand: "ROMMER", power50: 6245, passportPower: 9672, availability: "in_stock", price_date: "2026-08-10" },
    { id: "RRS-2020-335300", name: "Стальной панельный Ventil (Тип 33)", height: 500, sec: 3000, isPanel: true, bottom: true, price: 46118, brand: "ROMMER", power50: 6245, passportPower: 9672, availability: "on_order", price_date: "2026-08-10" },
    { id: "RRS-2010-336040", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 400, isPanel: true, price: 11271, brand: "ROMMER", power50: 1044, passportPower: 1616, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336040", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 400, isPanel: true, bottom: true, price: 29205, brand: "ROMMER", power50: 1044, passportPower: 1616, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336050", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 500, isPanel: true, price: 11271, brand: "ROMMER", power50: 1237, passportPower: 1916, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336050", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 500, isPanel: true, bottom: true, price: 44993, brand: "ROMMER", power50: 1237, passportPower: 1916, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336060", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 600, isPanel: true, price: 11271, brand: "ROMMER", power50: 1434, passportPower: 2220, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336060", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1434, passportPower: 2220, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336070", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 700, isPanel: true, price: 11271, brand: "ROMMER", power50: 1629, passportPower: 2522, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336070", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 700, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1629, passportPower: 2522, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336080", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 800, isPanel: true, price: 42705, brand: "ROMMER", power50: 1823, passportPower: 2823, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336080", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 800, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 1823, passportPower: 2823, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336090", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 900, isPanel: true, price: 11271, brand: "ROMMER", power50: 2004, passportPower: 3103, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336090", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 900, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2004, passportPower: 3103, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336100", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1000, isPanel: true, price: 37143, brand: "ROMMER", power50: 2211, passportPower: 3425, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336100", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1000, isPanel: true, bottom: true, price: 19106, brand: "ROMMER", power50: 2211, passportPower: 3425, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336110", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1100, isPanel: true, price: 28924, brand: "ROMMER", power50: 2408, passportPower: 3729, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336110", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1100, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 2408, passportPower: 3729, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336120", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1200, isPanel: true, price: 42705, brand: "ROMMER", power50: 2600, passportPower: 4026, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336120", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1200, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 2600, passportPower: 4026, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336130", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1300, isPanel: true, price: 28924, brand: "ROMMER", power50: 2823, passportPower: 4372, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336130", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1300, isPanel: true, bottom: true, price: 29205, brand: "ROMMER", power50: 2823, passportPower: 4372, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336140", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1400, isPanel: true, price: 11271, brand: "ROMMER", power50: 3040, passportPower: 4708, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336140", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1400, isPanel: true, bottom: true, price: 17822, brand: "ROMMER", power50: 3040, passportPower: 4708, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336150", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1500, isPanel: true, price: 11271, brand: "ROMMER", power50: 3258, passportPower: 5045, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336150", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1500, isPanel: true, bottom: true, price: 17822, brand: "ROMMER", power50: 3258, passportPower: 5045, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336160", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1600, isPanel: true, price: 11271, brand: "ROMMER", power50: 3474, passportPower: 5381, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336160", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 3474, passportPower: 5381, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336170", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1700, isPanel: true, price: 11271, brand: "ROMMER", power50: 3692, passportPower: 5718, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2020-336170", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1700, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 3692, passportPower: 5718, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336180", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1800, isPanel: true, price: 12426, brand: "ROMMER", power50: 3908, passportPower: 6053, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336180", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1800, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 3908, passportPower: 6053, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336190", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 1900, isPanel: true, price: 28924, brand: "ROMMER", power50: 4127, passportPower: 6391, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336190", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 1900, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 4127, passportPower: 6391, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336200", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2000, isPanel: true, price: 28924, brand: "ROMMER", power50: 4343, passportPower: 6726, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336200", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2000, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 4343, passportPower: 6726, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336210", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2100, isPanel: true, price: 28924, brand: "ROMMER", power50: 4556, passportPower: 7056, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336210", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2100, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 4556, passportPower: 7056, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336220", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2200, isPanel: true, price: 14902, brand: "ROMMER", power50: 4778, passportPower: 7400, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336220", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2200, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 4778, passportPower: 7400, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336230", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2300, isPanel: true, price: 28924, brand: "ROMMER", power50: 4994, passportPower: 7734, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336230", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2300, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 4994, passportPower: 7734, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336240", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2400, isPanel: true, price: 16615, brand: "ROMMER", power50: 5211, passportPower: 8070, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336240", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2400, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 5211, passportPower: 8070, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336250", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2500, isPanel: true, price: 16615, brand: "ROMMER", power50: 5428, passportPower: 8407, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336250", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2500, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 5428, passportPower: 8407, availability: "on_order", price_date: "2026-07-12" },
    { id: "RRS-2010-336260", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2600, isPanel: true, price: 16615, brand: "ROMMER", power50: 5646, passportPower: 8743, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336260", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2600, isPanel: true, bottom: true, price: 19685, brand: "ROMMER", power50: 5646, passportPower: 8743, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336280", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 2800, isPanel: true, price: 28924, brand: "ROMMER", power50: 6080, passportPower: 9416, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336280", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 2800, isPanel: true, bottom: true, price: 27199, brand: "ROMMER", power50: 6080, passportPower: 9416, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2010-336300", name: "Стальной панельный Compact (Тип 33)", height: 600, sec: 3000, isPanel: true, price: 28924, brand: "ROMMER", power50: 6514, passportPower: 10088, availability: "in_stock", price_date: "2026-07-12" },
    { id: "RRS-2020-336300", name: "Стальной панельный Ventil (Тип 33)", height: 600, sec: 3000, isPanel: true, bottom: true, price: 29205, brand: "ROMMER", power50: 6514, passportPower: 10088, availability: "on_order", price_date: "2026-07-12" }
];


// =====================================================
// ДОПОЛНИТЕЛЬНЫЕ СЕРИИ РАДИАТОРОВ
// Добавлены из прайс-листа STOUT/ROMMER июнь 2026
// =====================================================

// Space (Россия, боковое, 500мм) SRB-0310-050, power50=116 Вт/сек
const spaceRuRads = [
    { id: "SRB-0310-050004", name: "Радиатор Space (Россия) 4 секций",  sec: 4,  price: 4284,  power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050004", name: "Радиатор Optima Bm 4 секций",  price: 2850, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050005", name: "Радиатор Space (Россия) 5 секций",  sec: 5,  price: 5355,  power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050006", name: "Радиатор Optima Bm 6 секций",  price: 4275, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050006", name: "Радиатор Space (Россия) 6 секций",  sec: 6,  price: 6426,  power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050006", name: "Радиатор Optima Bm 6 секций",  price: 4275, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050007", name: "Радиатор Space (Россия) 7 секций",  sec: 7,  price: 7497, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050008", name: "Радиатор Optima Bm 8 секций",  price: 5698, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050008", name: "Радиатор Space (Россия) 8 секций",  sec: 8,  price: 8568, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050008", name: "Радиатор Optima Bm 8 секций",  price: 5698, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050009", name: "Радиатор Space (Россия) 9 секций",  sec: 9,  price: 9639, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050010", name: "Радиатор Optima Bm 10 секций", price: 7125, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050010", name: "Радиатор Space (Россия) 10 секций", sec: 10, price: 10710, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050010", name: "Радиатор Optima Bm 10 секций", price: 7125, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050011", name: "Радиатор Space (Россия) 11 секций", sec: 11, price: 11781, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050012", name: "Радиатор Optima Bm 12 секций", price: 8549, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050012", name: "Радиатор Space (Россия) 12 секций", sec: 12, price: 12852, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050012", name: "Радиатор Optima Bm 12 секций", price: 8549, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050013", name: "Радиатор Space (Россия) 13 секций", sec: 13, price: 13923, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050012", name: "Радиатор Optima Bm 12 секций", price: 8549, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-050014", name: "Радиатор Space (Россия) 14 секций", sec: 14, price: 14994, power50: 116, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-0210-050012", name: "Радиатор Optima Bm 12 секций", price: 8549, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
];

// Space (Россия, боковое, 350мм) SRB-0310-035, power50=85 Вт/сек
const spaceRu350Rads = [
    { id: "SRB-0310-035004", name: "Радиатор Space 350 (Россия) 4 секций",  sec: 4,  price: 4202,  power50: 85, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035004", name: "Радиатор Profi Bm 350 4 секций",  price: 3265, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-035006", name: "Радиатор Space 350 (Россия) 6 секций",  sec: 6,  price: 6304,  power50: 85, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035006", name: "Радиатор Profi Bm 350 6 секций",  price: 4899, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-035008", name: "Радиатор Space 350 (Россия) 8 секций",  sec: 8,  price: 8405, power50: 85, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035008", name: "Радиатор Profi Bm 350 8 секций",  price: 6532, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-035010", name: "Радиатор Space 350 (Россия) 10 секций", sec: 10, price: 10506, power50: 85, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035010", name: "Радиатор Profi Bm 350 10 секций", price: 8164, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-035012", name: "Радиатор Space 350 (Россия) 12 секций", sec: 12, price: 12607, power50: 85, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035012", name: "Радиатор Profi Bm 350 12 секций", price: 9797, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-0310-035014", name: "Радиатор Space 350 (Россия) 14 секций", sec: 14, price: 14708, power50: 85, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035012", name: "Радиатор Profi Bm 350 12 секций", price: 9797, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
];

// TITAN (боковое, 500мм) SRB-3310-050, power50=126 Вт/сек
const titanSideRads = [
    { id: "SRB-3310-050004", name: "Радиатор TITAN (бок.) 4 секций",  sec: 4,  price: 4940,  power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050004", name: "Радиатор Profi Bm 4 секций",  price: 3473,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050005", name: "Радиатор TITAN (бок.) 5 секций",  sec: 5,  price: 6175,  power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050006", name: "Радиатор Profi Bm 6 секций",  price: 5211,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050006", name: "Радиатор TITAN (бок.) 6 секций",  sec: 6,  price: 7410, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050006", name: "Радиатор Profi Bm 6 секций",  price: 5211,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050007", name: "Радиатор TITAN (бок.) 7 секций",  sec: 7,  price: 8645, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050008", name: "Радиатор Profi Bm 8 секций",  price: 6947,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050008", name: "Радиатор TITAN (бок.) 8 секций",  sec: 8,  price: 9880, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050008", name: "Радиатор Profi Bm 8 секций",  price: 6947,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050009", name: "Радиатор TITAN (бок.) 9 секций",  sec: 9,  price: 11115, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050010", name: "Радиатор Profi Bm 10 секций", price: 8682,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050010", name: "Радиатор TITAN (бок.) 10 секций", sec: 10, price: 12350, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050010", name: "Радиатор Profi Bm 10 секций", price: 8682,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050011", name: "Радиатор TITAN (бок.) 11 секций", sec: 11, price: 13585, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050012", name: "Радиатор Profi Bm 12 секций", price: 10420, power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050012", name: "Радиатор TITAN (бок.) 12 секций", sec: 12, price: 14820, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050012", name: "Радиатор Profi Bm 12 секций", price: 10420, power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050013", name: "Радиатор TITAN (бок.) 13 секций", sec: 13, price: 16055, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050012", name: "Радиатор Profi Bm 12 секций", price: 10420, power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-050014", name: "Радиатор TITAN (бок.) 14 секций", sec: 14, price: 17290, power50: 126, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-050012", name: "Радиатор Profi Bm 12 секций", price: 10420, power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
];

// TITAN (боковое, 350мм) SRB-3310-035, power50=104 Вт/сек
const titanSide350Rads = [
    { id: "SRB-3310-035004", name: "Радиатор TITAN 350 (бок.) 4 секций",  sec: 4,  price: 4840,  power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035004", name: "Радиатор Profi Bm 350 4 секций",  price: 3265, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035005", name: "Радиатор TITAN 350 (бок.) 5 секций",  sec: 5,  price: 6050,  power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035006", name: "Радиатор Profi Bm 350 6 секций",  price: 4899, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035006", name: "Радиатор TITAN 350 (бок.) 6 секций",  sec: 6,  price: 7260,  power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035006", name: "Радиатор Profi Bm 350 6 секций",  price: 4899, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035007", name: "Радиатор TITAN 350 (бок.) 7 секций",  sec: 7,  price: 8470, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035008", name: "Радиатор Profi Bm 350 8 секций",  price: 6532, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035008", name: "Радиатор TITAN 350 (бок.) 8 секций",  sec: 8,  price: 9680, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035008", name: "Радиатор Profi Bm 350 8 секций",  price: 6532, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035009", name: "Радиатор TITAN 350 (бок.) 9 секций",  sec: 9,  price: 10890, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035010", name: "Радиатор Profi Bm 350 10 секций", price: 8164, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035010", name: "Радиатор TITAN 350 (бок.) 10 секций", sec: 10, price: 12100, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035010", name: "Радиатор Profi Bm 350 10 секций", price: 8164, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035011", name: "Радиатор TITAN 350 (бок.) 11 секций", sec: 11, price: 13310, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035012", name: "Радиатор Profi Bm 350 12 секций", price: 9797, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035012", name: "Радиатор TITAN 350 (бок.) 12 секций", sec: 12, price: 14520, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035012", name: "Радиатор Profi Bm 350 12 секций", price: 9797, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035013", name: "Радиатор TITAN 350 (бок.) 13 секций", sec: 13, price: 15730, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035012", name: "Радиатор Profi Bm 350 12 секций", price: 9797, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-035014", name: "Радиатор TITAN 350 (бок.) 14 секций", sec: 14, price: 16940, power50: 104, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-1210-035012", name: "Радиатор Profi Bm 350 12 секций", price: 9797, power50: 76, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
];

// TITAN (боковое, 200мм) SRB-3310-020, power50=66 Вт/сек
const titanSide200Rads = [
    { id: "SRB-3310-020004", name: "Радиатор TITAN 200 (бок.) 4 секций",  sec: 4,  price: 4760,  power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020006", name: "Радиатор Plus Bm 200 6 секций",  price: 4286, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020005", name: "Радиатор TITAN 200 (бок.) 5 секций",  sec: 5,  price: 5950,  power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020006", name: "Радиатор Plus Bm 200 6 секций",  price: 4286, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020006", name: "Радиатор TITAN 200 (бок.) 6 секций",  sec: 6,  price: 7140,  power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020006", name: "Радиатор Plus Bm 200 6 секций",  price: 4286, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020007", name: "Радиатор TITAN 200 (бок.) 7 секций",  sec: 7,  price: 8330, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020008", name: "Радиатор Plus Bm 200 8 секций",  price: 5713, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020008", name: "Радиатор TITAN 200 (бок.) 8 секций",  sec: 8,  price: 9520, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020008", name: "Радиатор Plus Bm 200 8 секций",  price: 5713, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020009", name: "Радиатор TITAN 200 (бок.) 9 секций",  sec: 9,  price: 10710, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020010", name: "Радиатор Plus Bm 200 10 секций", price: 7141, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020010", name: "Радиатор TITAN 200 (бок.) 10 секций", sec: 10, price: 11900, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020010", name: "Радиатор Plus Bm 200 10 секций", price: 7141, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020011", name: "Радиатор TITAN 200 (бок.) 11 секций", sec: 11, price: 13090, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020012", name: "Радиатор Plus Bm 200 12 секций", price: 8570, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020012", name: "Радиатор TITAN 200 (бок.) 12 секций", sec: 12, price: 14280, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020012", name: "Радиатор Plus Bm 200 12 секций", price: 8570, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020013", name: "Радиатор TITAN 200 (бок.) 13 секций", sec: 13, price: 15470, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020014", name: "Радиатор Plus Bm 200 14 секций", price: 9998, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRB-3310-020014", name: "Радиатор TITAN 200 (бок.) 14 секций", sec: 14, price: 16660, power50: 66, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RBM-3210-020014", name: "Радиатор Plus Bm 200 14 секций", price: 9998, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
];

// Алюминиевые (боковое, 500мм) SRA-2310-050, power50=107 Вт/сек
const aluminumRads = [
    { id: "SRA-2310-050004", name: "Радиатор алюм. 4 секций",  sec: 4,  price: 3560,  power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-050004", name: "Радиатор Profi 4 секций",  price: 3235, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-050006", name: "Радиатор алюм. 6 секций",  sec: 6,  price: 5340,  power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-050006", name: "Радиатор Profi 6 секций",  price: 4852, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-050008", name: "Радиатор алюм. 8 секций",  sec: 8,  price: 7120,  power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-050008", name: "Радиатор Profi 8 секций",  price: 6470, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-050010", name: "Радиатор алюм. 10 секций", sec: 10, price: 8900, power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-050010", name: "Радиатор Profi 10 секций", price: 8088, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-050012", name: "Радиатор алюм. 12 секций", sec: 12, price: 10680, power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-050012", name: "Радиатор Profi 12 секций", price: 9705, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
];

// Алюминиевые (боковое, 350мм) SRA-2310-035, power50=83 Вт/сек
const aluminum350Rads = [
    { id: "SRA-2310-035004", name: "Радиатор алюм. 350 4 секций",  sec: 4,  price: 3460,  power50: 83, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-035004", name: "Радиатор Profi 350 4 секций",  price: 3029, power50: 74, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-035006", name: "Радиатор алюм. 350 6 секций",  sec: 6,  price: 5190,  power50: 83, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-035006", name: "Радиатор Profi 350 6 секций",  price: 4544, power50: 74, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-035008", name: "Радиатор алюм. 350 8 секций",  sec: 8,  price: 6920,  power50: 83, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-035008", name: "Радиатор Profi 350 8 секций",  price: 6058, power50: 74, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-035010", name: "Радиатор алюм. 350 10 секций", sec: 10, price: 8650, power50: 83, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-035010", name: "Радиатор Profi 350 10 секций", price: 7571, power50: 74, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } },
    { id: "SRA-2310-035012", name: "Радиатор алюм. 350 12 секций", sec: 12, price: 10380, power50: 83, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", rommer: { id: "RAL-1210-035012", name: "Радиатор Profi 350 12 секций", price: 9087, power50: 74, brand: "ROMMER", availability: "in_stock", price_date: "2026-06-27" } }
];

// ROMMER Profi Al (RAL-1210-050) 500мм, power50=100 Вт/сек
const rommerProfiAlRads = [
    { id: "RAL-1210-050004", name: "Радиатор Profi 4 секций",  sec: 4,  price: 3429, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-1210-050006", name: "Радиатор Profi 6 секций",  sec: 6,  price: 5143, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-1210-050008", name: "Радиатор Profi 8 секций",  sec: 8,  price: 6858, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-1210-050010", name: "Радиатор Profi 10 секций", sec: 10, price: 8573, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-1210-050012", name: "Радиатор Profi 12 секций", sec: 12, price: 10287, power50: 100, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
];

// ROMMER Optima Bm (RBM-0210-050) 500мм, power50=82 Вт/сек
const rommerOptimaBmRads = [
    { id: "RBM-0210-050004", name: "Радиатор Optima Bm 4 секций",  sec: 4,  price: 3021, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-0210-050006", name: "Радиатор Optima Bm 6 секций",  sec: 6,  price: 4530, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-0210-050008", name: "Радиатор Optima Bm 8 секций",  sec: 8,  price: 6040, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-0210-050010", name: "Радиатор Optima Bm 10 секций", sec: 10, price: 7551, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-0210-050012", name: "Радиатор Optima Bm 12 секций", sec: 12, price: 9062, power50: 82, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
];

// ROMMER Profi Bm (RBM-1210-050) 500мм, power50=91 Вт/сек
const rommerProfiBmRads = [
    { id: "RBM-1210-050004", name: "Радиатор Profi Bm 4 секций",  sec: 4,  price: 3680,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-1210-050006", name: "Радиатор Profi Bm 6 секций",  sec: 6,  price: 5523,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-1210-050008", name: "Радиатор Profi Bm 8 секций",  sec: 8,  price: 7363,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-1210-050010", name: "Радиатор Profi Bm 10 секций", sec: 10, price: 9203,  power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-1210-050012", name: "Радиатор Profi Bm 12 секций", sec: 12, price: 11045, power50: 91, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
];

// ROMMER Plus Bm (RBM-3210-050) 500мм, power50=90 Вт/сек
const rommerPlusBmRads = [
    { id: "RBM-3210-050004", name: "Радиатор Plus Bm 4 секций",  sec: 4,  price: 3336, power50: 90, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-3210-050006", name: "Радиатор Plus Bm 6 секций",  sec: 6,  price: 5004, power50: 90, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-3210-050008", name: "Радиатор Plus Bm 8 секций",  sec: 8,  price: 6672, power50: 90, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-3210-050010", name: "Радиатор Plus Bm 10 секций", sec: 10, price: 8340, power50: 90, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-3210-050012", name: "Радиатор Plus Bm 12 секций", sec: 12, price: 10007, power50: 90, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
];

// ROMMER Plus 200 Al (500мм) RAL-3210-050, power50=117 Вт/сек
const rommerPlusAlRads = [
    { id: "RAL-3210-050004", name: "Радиатор Plus 200 4 секций",  sec: 4,  price: 2936, power50: 117, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-3210-050006", name: "Радиатор Plus 200 6 секций",  sec: 6,  price: 4405, power50: 117, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-3210-050008", name: "Радиатор Plus 200 8 секций",  sec: 8,  price: 5873, power50: 117, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-3210-050010", name: "Радиатор Plus 200 10 секций", sec: 10, price: 7342, power50: 117, brand: "ROMMER", availability: "on_order", price_date: "2026-08-10" },
    { id: "RAL-3210-050012", name: "Радиатор Plus 200 12 секций", sec: 12, price: 8811, power50: 117, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
];

// ROMMER Plus 200 Al (200мм) RAL-3210-020, power50=72 Вт/сек
const rommerPlusAl200Rads = [
    { id: "RAL-3210-020006", name: "Радиатор Plus 200 (200мм) 6 секций",  sec: 6,  price: 4211, power50: 72, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-3210-020008", name: "Радиатор Plus 200 (200мм) 8 секций",  sec: 8,  price: 5616, power50: 72, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-3210-020010", name: "Радиатор Plus 200 (200мм) 10 секций", sec: 10, price: 7020, power50: 72, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-3210-020012", name: "Радиатор Plus 200 (200мм) 12 секций", sec: 12, price: 8424, power50: 72, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RAL-3210-020014", name: "Радиатор Plus 200 (200мм) 14 секций", sec: 14, price: 9826, power50: 72, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
];

// ROMMER Plus Bm 200 (200мм) RBM-3210-020, power50=66 Вт/сек
const rommerPlusBm200Rads = [
    { id: "RBM-3210-020006", name: "Радиатор Plus Bm 200 6 секций",  sec: 6,  price: 4542, power50: 66, brand: "ROMMER", availability: "on_order", price_date: "2026-08-10" },
    { id: "RBM-3210-020008", name: "Радиатор Plus Bm 200 8 секций",  sec: 8,  price: 6056, power50: 66, brand: "ROMMER", availability: "on_order", price_date: "2026-08-10" },
    { id: "RBM-3210-020010", name: "Радиатор Plus Bm 200 10 секций", sec: 10, price: 7569, power50: 66, brand: "ROMMER", availability: "on_order", price_date: "2026-08-10" },
    { id: "RBM-3210-020012", name: "Радиатор Plus Bm 200 12 секций", sec: 12, price: 9084, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" },
    { id: "RBM-3210-020014", name: "Радиатор Plus Bm 200 14 секций", sec: 14, price: 10597, power50: 66, brand: "ROMMER", availability: "in_stock", price_date: "2026-08-10" }
];


// =====================================================
// РАДИАТОРЫ, ДИЗАЙН-СЕРИИ И АРМАТУРА — прайс-лист 07.2026
// Недостающие модели STOUT + радиаторная арматура (в т.ч. серия Design)
// =====================================================

// STOUT VEGA BM, биметалл, боковое подключение. SRB-1310-05/035/020. Прайс 07.2026.
const vegaBmRads = [
    { id: "SRB-1310-050004", name: "Радиатор VEGA BM (500мм, бок.) 4 секций", sec: 4, price: 4640, power50: 119, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-050006", name: "Радиатор VEGA BM (500мм, бок.) 6 секций", sec: 6, price: 6960, power50: 119, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-050008", name: "Радиатор VEGA BM (500мм, бок.) 8 секций", sec: 8, price: 9280, power50: 119, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-050010", name: "Радиатор VEGA BM (500мм, бок.) 10 секций", sec: 10, price: 11600, power50: 119, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-050012", name: "Радиатор VEGA BM (500мм, бок.) 12 секций", sec: 12, price: 13920, power50: 119, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-035004", name: "Радиатор VEGA BM (350мм, бок.) 4 секций", sec: 4, price: 4480, power50: 87, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-035006", name: "Радиатор VEGA BM (350мм, бок.) 6 секций", sec: 6, price: 6720, power50: 87, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-035008", name: "Радиатор VEGA BM (350мм, бок.) 8 секций", sec: 8, price: 8960, power50: 87, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-035010", name: "Радиатор VEGA BM (350мм, бок.) 10 секций", sec: 10, price: 11200, power50: 87, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-035012", name: "Радиатор VEGA BM (350мм, бок.) 12 секций", sec: 12, price: 13440, power50: 87, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-020004", name: "Радиатор VEGA BM (200мм, бок.) 4 секций", sec: 4, price: 4160, power50: 61, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-020006", name: "Радиатор VEGA BM (200мм, бок.) 6 секций", sec: 6, price: 6240, power50: 61, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-020008", name: "Радиатор VEGA BM (200мм, бок.) 8 секций", sec: 8, price: 8320, power50: 61, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-020010", name: "Радиатор VEGA BM (200мм, бок.) 10 секций", sec: 10, price: 10400, power50: 61, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-1310-020012", name: "Радиатор VEGA BM (200мм, бок.) 12 секций", sec: 12, price: 12480, power50: 61, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];

// STOUT ALPHA, биметалл, боковое подключение (не путать с алюминиевым ALPHA SRA-2310). SRB-2310-05/035. Прайс 07.2026.
const alphaBmRads = [
    { id: "SRB-2310-050004", name: "Радиатор ALPHA биметалл (500мм, бок.) 4 секций", sec: 4, price: 4000, power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-050006", name: "Радиатор ALPHA биметалл (500мм, бок.) 6 секций", sec: 6, price: 6000, power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-050008", name: "Радиатор ALPHA биметалл (500мм, бок.) 8 секций", sec: 8, price: 8000, power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-050010", name: "Радиатор ALPHA биметалл (500мм, бок.) 10 секций", sec: 10, price: 10000, power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-050012", name: "Радиатор ALPHA биметалл (500мм, бок.) 12 секций", sec: 12, price: 12000, power50: 107, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-035004", name: "Радиатор ALPHA биметалл (350мм, бок.) 4 секций", sec: 4, price: 3960, power50: 79, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-035006", name: "Радиатор ALPHA биметалл (350мм, бок.) 6 секций", sec: 6, price: 5940, power50: 79, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-035008", name: "Радиатор ALPHA биметалл (350мм, бок.) 8 секций", sec: 8, price: 7920, power50: 79, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-035010", name: "Радиатор ALPHA биметалл (350мм, бок.) 10 секций", sec: 10, price: 9900, power50: 79, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-2310-035012", name: "Радиатор ALPHA биметалл (350мм, бок.) 12 секций", sec: 12, price: 11880, power50: 79, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];

// STOUT TITAN, нижнее подключение, 350мм (компаньон titanRads-500мм). SRB-3320-035. Прайс 07.2026.
const titanBottom350Rads = [
    { id: "SRB-3320-035004", name: "Радиатор TITAN 350 (нижн.) 4 секций", sec: 4, price: 7310, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035005", name: "Радиатор TITAN 350 (нижн.) 5 секций", sec: 5, price: 8520, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035006", name: "Радиатор TITAN 350 (нижн.) 6 секций", sec: 6, price: 9730, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035007", name: "Радиатор TITAN 350 (нижн.) 7 секций", sec: 7, price: 10940, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035008", name: "Радиатор TITAN 350 (нижн.) 8 секций", sec: 8, price: 12150, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035009", name: "Радиатор TITAN 350 (нижн.) 9 секций", sec: 9, price: 13360, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035010", name: "Радиатор TITAN 350 (нижн.) 10 секций", sec: 10, price: 14570, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035011", name: "Радиатор TITAN 350 (нижн.) 11 секций", sec: 11, price: 15780, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035012", name: "Радиатор TITAN 350 (нижн.) 12 секций", sec: 12, price: 16990, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035013", name: "Радиатор TITAN 350 (нижн.) 13 секций", sec: 13, price: 18200, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRB-3320-035014", name: "Радиатор TITAN 350 (нижн.) 14 секций", sec: 14, price: 19410, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];

// STOUT TITAN, нижнее подключение, цвет графит RAL7024. SRB-3320-05/035 7024. Прайс 07.2026.
const titanGraphiteRads = [
    { id: "SRB-3320-050004-7024", name: "Радиатор TITAN Графит RAL7024 (500мм, нижн.) 4 секций", sec: 4, price: 8000, power50: 128, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-050006-7024", name: "Радиатор TITAN Графит RAL7024 (500мм, нижн.) 6 секций", sec: 6, price: 10700, power50: 128, brand: "STOUT", availability: "on_order", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-050008-7024", name: "Радиатор TITAN Графит RAL7024 (500мм, нижн.) 8 секций", sec: 8, price: 13400, power50: 128, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-050010-7024", name: "Радиатор TITAN Графит RAL7024 (500мм, нижн.) 10 секций", sec: 10, price: 16100, power50: 128, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-050012-7024", name: "Радиатор TITAN Графит RAL7024 (500мм, нижн.) 12 секций", sec: 12, price: 18800, power50: 128, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-050014-7024", name: "Радиатор TITAN Графит RAL7024 (500мм, нижн.) 14 секций", sec: 14, price: 21500, power50: 128, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-035004-7024", name: "Радиатор TITAN Графит RAL7024 (350мм, нижн.) 4 секций", sec: 4, price: 7800, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-035006-7024", name: "Радиатор TITAN Графит RAL7024 (350мм, нижн.) 6 секций", sec: 6, price: 10400, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-035008-7024", name: "Радиатор TITAN Графит RAL7024 (350мм, нижн.) 8 секций", sec: 8, price: 13000, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-035010-7024", name: "Радиатор TITAN Графит RAL7024 (350мм, нижн.) 10 секций", sec: 10, price: 15600, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-035012-7024", name: "Радиатор TITAN Графит RAL7024 (350мм, нижн.) 12 секций", sec: 12, price: 18200, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" },
    { id: "SRB-3320-035014-7024", name: "Радиатор TITAN Графит RAL7024 (350мм, нижн.) 14 секций", sec: 14, price: 20800, power50: 106, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10", color: "graphite" }
];

// STOUT VEGA 500 AL, алюминий, боковое подключение. SRA-1310-05. Прайс 07.2026.
const vega500AlRads = [
    { id: "SRA-1310-050004", name: "Радиатор VEGA 500 AL (бок.) 4 секций", sec: 4, price: 3980, power50: 121, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1310-050006", name: "Радиатор VEGA 500 AL (бок.) 6 секций", sec: 6, price: 5970, power50: 121, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1310-050008", name: "Радиатор VEGA 500 AL (бок.) 8 секций", sec: 8, price: 7960, power50: 121, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1310-050010", name: "Радиатор VEGA 500 AL (бок.) 10 секций", sec: 10, price: 9950, power50: 121, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1310-050012", name: "Радиатор VEGA 500 AL (бок.) 12 секций", sec: 12, price: 11940, power50: 121, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];

// STOUT OSCAR (Италия), дизайн-радиатор, боковое подключение, 1800/2000мм, 3 цвета. SRA-0110-*. Прайс 07.2026.
const oscarRads = [
    { id: "SRA-0110-180003", name: "Радиатор STOUT OSCAR 1800мм RAL9010 белый 3 секций", sec: 3, price: 28162, power50: 302, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-180004", name: "Радиатор STOUT OSCAR 1800мм RAL9010 белый 4 секций", sec: 4, price: 37546, power50: 302, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-180005", name: "Радиатор STOUT OSCAR 1800мм RAL9010 белый 5 секций", sec: 5, price: 46940, power50: 302, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-180006", name: "Радиатор STOUT OSCAR 1800мм RAL9010 белый 6 секций", sec: 6, price: 56324, power50: 302, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000703", name: "Радиатор STOUT OSCAR 1800мм 2748 черный 3 секций", sec: 3, price: 36618, power50: 302, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000704", name: "Радиатор STOUT OSCAR 1800мм 2748 черный 4 секций", sec: 4, price: 48817, power50: 302, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000705", name: "Радиатор STOUT OSCAR 1800мм 2748 черный 5 секций", sec: 5, price: 61027, power50: 302, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000706", name: "Радиатор STOUT OSCAR 1800мм 2748 черный 6 секций", sec: 6, price: 73226, power50: 302, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000803", name: "Радиатор STOUT OSCAR 1800мм 2676 серый 3 секций", sec: 3, price: 36618, power50: 302, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000804", name: "Радиатор STOUT OSCAR 1800мм 2676 серый 4 секций", sec: 4, price: 48817, power50: 302, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000805", name: "Радиатор STOUT OSCAR 1800мм 2676 серый 5 секций", sec: 5, price: 61027, power50: 302, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-18000806", name: "Радиатор STOUT OSCAR 1800мм 2676 серый 6 секций", sec: 6, price: 73226, power50: 302, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-200003", name: "Радиатор STOUT OSCAR 2000мм RAL9010 белый 3 секций", sec: 3, price: 31243, power50: 327, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-200004", name: "Радиатор STOUT OSCAR 2000мм RAL9010 белый 4 секций", sec: 4, price: 41657, power50: 327, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-200005", name: "Радиатор STOUT OSCAR 2000мм RAL9010 белый 5 секций", sec: 5, price: 52071, power50: 327, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-200006", name: "Радиатор STOUT OSCAR 2000мм RAL9010 белый 6 секций", sec: 6, price: 62485, power50: 327, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000703", name: "Радиатор STOUT OSCAR 2000мм 2748 черный 3 секций", sec: 3, price: 40616, power50: 327, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000704", name: "Радиатор STOUT OSCAR 2000мм 2748 черный 4 секций", sec: 4, price: 54152, power50: 327, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000705", name: "Радиатор STOUT OSCAR 2000мм 2748 черный 5 секций", sec: 5, price: 67697, power50: 327, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000706", name: "Радиатор STOUT OSCAR 2000мм 2748 черный 6 секций", sec: 6, price: 81233, power50: 327, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000803", name: "Радиатор STOUT OSCAR 2000мм 2676 серый 3 секций", sec: 3, price: 40616, power50: 327, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000804", name: "Радиатор STOUT OSCAR 2000мм 2676 серый 4 секций", sec: 4, price: 54152, power50: 327, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000805", name: "Радиатор STOUT OSCAR 2000мм 2676 серый 5 секций", sec: 5, price: 67697, power50: 327, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-0110-20000806", name: "Радиатор STOUT OSCAR 2000мм 2676 серый 6 секций", sec: 6, price: 81233, power50: 327, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];

// STOUT SEBINO (Италия), дизайн-радиатор, универсальное подключение (комплект+кронштейны в комплекте). SRA-1120-*. Прайс 07.2026.
const sebinoRads = [
    { id: "SRA-1120-180004", name: "Радиатор STOUT SEBINO 1800мм RAL9010 белый 4 секций", sec: 4, price: 55070, power50: 236, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-180006", name: "Радиатор STOUT SEBINO 1800мм RAL9010 белый 6 секций", sec: 6, price: 77479, power50: 236, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-18000704", name: "Радиатор STOUT SEBINO 1800мм 2748 черный 4 секций", sec: 4, price: 68799, power50: 236, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-18000706", name: "Радиатор STOUT SEBINO 1800мм 2748 черный 6 секций", sec: 6, price: 96808, power50: 236, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-18000804", name: "Радиатор STOUT SEBINO 1800мм 2676 серый 4 секций", sec: 4, price: 68799, power50: 236, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-18000806", name: "Радиатор STOUT SEBINO 1800мм 2676 серый 6 секций", sec: 6, price: 96808, power50: 236, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-200004", name: "Радиатор STOUT SEBINO 2000мм RAL9010 белый 4 секций", sec: 4, price: 57202, power50: 256, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-200006", name: "Радиатор STOUT SEBINO 2000мм RAL9010 белый 6 секций", sec: 6, price: 83232, power50: 256, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-20000704", name: "Радиатор STOUT SEBINO 2000мм 2748 черный 4 секций", sec: 4, price: 71482, power50: 256, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-20000706", name: "Радиатор STOUT SEBINO 2000мм 2748 черный 6 секций", sec: 6, price: 103989, power50: 256, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-20000804", name: "Радиатор STOUT SEBINO 2000мм 2676 серый 4 секций", sec: 4, price: 71482, power50: 256, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-1120-20000806", name: "Радиатор STOUT SEBINO 2000мм 2676 серый 6 секций", sec: 6, price: 103989, power50: 256, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];
// SEBINO поставляется с монтажным набором подключения в комплекте — отдельный набор
// (SKU-0211/0221/0231) в смету не добавляем (см. app.js, раздел 3.1, флаг kitIncluded).
sebinoRads.forEach(x => { x.kitIncluded = true; });

// STOUT ANTEPRIMA (Италия), дизайн-радиатор, универсальное подключение. SRA-3120-*. Прайс 07.2026.
const anteprimaRads = [
    { id: "SRA-3120-180004", name: "Радиатор STOUT ANTEPRIMA 1800мм RAL9010 белый 4 секций", sec: 4, price: 52856, power50: 204, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-180006", name: "Радиатор STOUT ANTEPRIMA 1800мм RAL9010 белый 6 секций", sec: 6, price: 79213, power50: 204, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-18000704", name: "Радиатор STOUT ANTEPRIMA 1800мм 2748 черный 4 секций", sec: 4, price: 66035, power50: 204, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-18000706", name: "Радиатор STOUT ANTEPRIMA 1800мм 2748 черный 6 секций", sec: 6, price: 99011, power50: 204, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-18000804", name: "Радиатор STOUT ANTEPRIMA 1800мм 2676 серый 4 секций", sec: 4, price: 66035, power50: 204, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-18000806", name: "Радиатор STOUT ANTEPRIMA 1800мм 2676 серый 6 секций", sec: 6, price: 99011, power50: 204, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-200004", name: "Радиатор STOUT ANTEPRIMA 2000мм RAL9010 белый 4 секций", sec: 4, price: 55784, power50: 222, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-200006", name: "Радиатор STOUT ANTEPRIMA 2000мм RAL9010 белый 6 секций", sec: 6, price: 83630, power50: 222, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-20000704", name: "Радиатор STOUT ANTEPRIMA 2000мм 2748 черный 4 секций", sec: 4, price: 69666, power50: 222, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-20000706", name: "Радиатор STOUT ANTEPRIMA 2000мм 2748 черный 6 секций", sec: 6, price: 104540, power50: 222, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-20000804", name: "Радиатор STOUT ANTEPRIMA 2000мм 2676 серый 4 секций", sec: 4, price: 69666, power50: 222, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-3120-20000806", name: "Радиатор STOUT ANTEPRIMA 2000мм 2676 серый 6 секций", sec: 6, price: 104540, power50: 222, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];

// STOUT TONALE (Италия), дизайн-радиатор, универсальное подключение. SRA-2120-*. Прайс 07.2026.
const tonaleRads = [
    { id: "SRA-2120-180004", name: "Радиатор STOUT TONALE 1800мм RAL9010 белый 4 секций", sec: 4, price: 52856, power50: 210, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-180006", name: "Радиатор STOUT TONALE 1800мм RAL9010 белый 6 секций", sec: 6, price: 79213, power50: 210, height: 1800, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-18000704", name: "Радиатор STOUT TONALE 1800мм 2748 черный 4 секций", sec: 4, price: 66035, power50: 210, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-18000706", name: "Радиатор STOUT TONALE 1800мм 2748 черный 6 секций", sec: 6, price: 99011, power50: 210, height: 1800, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-18000804", name: "Радиатор STOUT TONALE 1800мм 2676 серый 4 секций", sec: 4, price: 66035, power50: 210, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-18000806", name: "Радиатор STOUT TONALE 1800мм 2676 серый 6 секций", sec: 6, price: 99011, power50: 210, height: 1800, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-200004", name: "Радиатор STOUT TONALE 2000мм RAL9010 белый 4 секций", sec: 4, price: 55784, power50: 228, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-200006", name: "Радиатор STOUT TONALE 2000мм RAL9010 белый 6 секций", sec: 6, price: 83630, power50: 228, height: 2000, color: "white", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-20000704", name: "Радиатор STOUT TONALE 2000мм 2748 черный 4 секций", sec: 4, price: 69666, power50: 228, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-20000706", name: "Радиатор STOUT TONALE 2000мм 2748 черный 6 секций", sec: 6, price: 104540, power50: 228, height: 2000, color: "black", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-20000804", name: "Радиатор STOUT TONALE 2000мм 2676 серый 4 секций", sec: 4, price: 69666, power50: 228, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SRA-2120-20000806", name: "Радиатор STOUT TONALE 2000мм 2676 серый 6 секций", sec: 6, price: 104540, power50: 228, height: 2000, color: "gray", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" }
];

// STOUT TUBE QUADRO (Россия), трубчатый дизайн-радиатор, id синтетические (в прайсе только описательное наименование, без артикула). Прайс 07.2026.
const tubeQuadroRads = [
    { id: "QV40-1750-4-CU-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-4 CU RAL1T103S9005 (черный матовый муар), нижнее центральное", sec: 4, price: 27700, power50: 154, height: 1830, color: "black", connectionType: "bottom_center", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-4-CU-WHITE", name: "Радиатор STOUT TUBE QUADRO QV40-1750-4 CU RAL1T104S9016 (белый муар), нижнее центральное", sec: 4, price: 27700, power50: 154, height: 1830, color: "white", connectionType: "bottom_center", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-6-CU-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-6 CU RAL1T103S9005 (черный матовый муар), нижнее центральное", sec: 6, price: 37370, power50: 154, height: 1830, color: "black", connectionType: "bottom_center", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-6-CU-WHITE", name: "Радиатор STOUT TUBE QUADRO QV40-1750-6 CU RAL1T104S9016 (белый муар), нижнее центральное", sec: 6, price: 37370, power50: 154, height: 1830, color: "white", connectionType: "bottom_center", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-4-R-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-4 R RAL1T103S9005 (черный матовый муар), правостороннее нижнее", sec: 4, price: 27700, power50: 154, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-4-R-WHITE", name: "Радиатор STOUT TUBE QUADRO QV40-1750-4 R RAL1T104S9016 (белый муар), правостороннее нижнее", sec: 4, price: 27700, power50: 154, height: 1830, color: "white", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-5-R-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-5 R RAL1T103S9005 (черный матовый муар), правостороннее нижнее", sec: 5, price: 32530, power50: 154, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-5-R-WHITE", name: "Радиатор STOUT TUBE QUADRO QV40-1750-5 R RAL1T104S9016 (белый муар), правостороннее нижнее", sec: 5, price: 32530, power50: 154, height: 1830, color: "white", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-6-R-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-6 R RAL1T103S9005 (черный матовый муар), правостороннее нижнее", sec: 6, price: 37370, power50: 154, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-6-R-WHITE", name: "Радиатор STOUT TUBE QUADRO QV40-1750-6 R RAL1T104S9016 (белый муар), правостороннее нижнее", sec: 6, price: 37370, power50: 154, height: 1830, color: "white", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-8-R-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-8 R RAL1T103S9005 (черный матовый муар), правостороннее нижнее", sec: 8, price: 47030, power50: 154, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-8-R-WHITE", name: "Радиатор STOUT TUBE QUADRO QV40-1750-8 R RAL1T104S9016 (белый муар), правостороннее нижнее", sec: 8, price: 47030, power50: 154, height: 1830, color: "white", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-4-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-4 RAL1T103S9005 (черный матовый муар), боковое подключение", sec: 4, price: 27700, power50: 154, height: 1830, color: "black", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-6-BLACK", name: "Радиатор STOUT TUBE QUADRO QV40-1750-6 RAL1T103S9005 (черный матовый муар), боковое подключение", sec: 6, price: 32670, power50: 154, height: 1830, color: "black", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "QV40-1750-6-WHITE", name: "Радиатор STOUT TUBE QUADRO QV40-1750-6 RAL1T104S9016 (белый муар), боковое подключение", sec: 6, price: 37370, power50: 154, height: 1830, color: "white", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" }
];

// STOUT TUBE ROUND (Россия), трубчатый дизайн-радиатор, id синтетические. Прайс 07.2026.
const tubeRoundRads = [
    { id: "R40-1750-4-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-4, боковое подключение", sec: 4, price: 33910, power50: 115, height: 1784, color: "natural", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-4-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-4 RAL9005, боковое подключение", sec: 4, price: 27700, power50: 115, height: 1784, color: "black", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-6-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-6, боковое подключение", sec: 6, price: 37370, power50: 115, height: 1784, color: "natural", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-6-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-6 RAL9005, боковое подключение", sec: 6, price: 37370, power50: 115, height: 1784, color: "black", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-8-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-8, боковое подключение", sec: 8, price: 54480, power50: 115, height: 1784, color: "natural", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-8-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-8 RAL9005, боковое подключение", sec: 8, price: 54480, power50: 115, height: 1784, color: "black", connectionType: "side", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-4-RT-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-4 RT, правостороннее нижнее", sec: 4, price: 54480, power50: 115, height: 1830, color: "natural", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-4-RT-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-4 RT RAL9005, правостороннее нижнее", sec: 4, price: 37300, power50: 115, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-6-RT-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-6 RT, правостороннее нижнее", sec: 6, price: 54480, power50: 115, height: 1830, color: "natural", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-6-RT-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-6 RT RAL9005, правостороннее нижнее", sec: 6, price: 45890, power50: 115, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-7-RT-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-7 RT, правостороннее нижнее", sec: 7, price: 37300, power50: 115, height: 1830, color: "natural", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-7-RT-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-7 RT RAL9005, правостороннее нижнее", sec: 7, price: 50180, power50: 115, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-8-RT-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-8 RT, правостороннее нижнее", sec: 8, price: 54480, power50: 115, height: 1830, color: "natural", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-8-RT-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-8 RT RAL9005, правостороннее нижнее", sec: 8, price: 54480, power50: 115, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-9-RT-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-9 RT, правостороннее нижнее", sec: 9, price: 54480, power50: 115, height: 1830, color: "natural", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-9-RT-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-9 RT RAL9005, правостороннее нижнее", sec: 9, price: 58770, power50: 115, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-10-RT-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-10 RT, правостороннее нижнее", sec: 10, price: 54480, power50: 115, height: 1830, color: "natural", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-10-RT-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-10 RT RAL9005, правостороннее нижнее", sec: 10, price: 63070, power50: 115, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-12-RT-NAT", name: "Радиатор STOUT TUBE ROUND R40 1-1750-12 RT, правостороннее нижнее", sec: 12, price: 54480, power50: 115, height: 1830, color: "natural", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "R40-1750-12-RT-BLACK", name: "Радиатор STOUT TUBE ROUND R40 1-1750-12 RT RAL9005, правостороннее нижнее", sec: 12, price: 72600, power50: 115, height: 1830, color: "black", connectionType: "bottom_right", isDesignRad: true, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" }
];

// Радиаторная арматура (термостатическая пара) для автообвязки радиаторов с БОКОВЫМ подключением.
// Отдельный от conv_valves массив: там своя пара под конвекторы, и настоящего углового
// SVT-0002-000015 в ней нет — при угловом подключении конвектора подставляется осевой
// SVT-0005-000015. Названия здесь и там теперь совпадают с прайс-листом.
const radValves = [
    { id: "SVT-0001-000015", name: "Клапан термостатический, прямой 1/2\"", price: 1180, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVT-0002-000015", name: "Клапан термостатический, угловой 1/2\"", price: 1101, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVT-0005-000015", name: "Клапан термостатический, осевой 1/2\"", price: 1614, type: "axial", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVL-1176-000015", name: "Клапан запорно-балансировочный прямой 1/2\"", price: 656, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVL-1156-000015", name: "Клапан запорно-балансировочный угловой 1/2\"", price: 597, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
];

// Радиаторная арматура STOUT Design — хром/белый/чёрный, прямое/угловое подключение.
// Источник: sheet "Радиаторная арматура Design", прайс 07.2026.
const radValvesDesign = [
    { id: "SVTDK-0002-000015C", name: "Комплект клапанов термостатических STOUT Design хром, угловой 1/2\"", price: 6916, kind: "set", color: "chrome", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTDK-0002-000015W", name: "Комплект клапанов термостатических STOUT Design белый, угловой 1/2\"", price: 6522, kind: "set", color: "white", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTDK-0002-000015B", name: "Комплект клапанов термостатических STOUT Design черный, угловой 1/2\"", price: 8315, kind: "set", color: "black", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTDK-0001-000015C", name: "Комплект клапанов термостатических STOUT Design хром, прямой 1/2\"", price: 7265, kind: "set", color: "chrome", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTDK-0001-000015W", name: "Комплект клапанов термостатических STOUT Design белый, прямой 1/2\"", price: 6857, kind: "set", color: "white", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTDK-0001-000015B", name: "Комплект клапанов термостатических STOUT Design черный, прямой 1/2\"", price: 8651, kind: "set", color: "black", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTD-0002-000015C", name: "Клапан термостатический STOUT Design хром, угловой 1/2\"", price: 2648, kind: "valve", color: "chrome", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTD-0002-000015W", name: "Клапан термостатический STOUT Design белый, угловой 1/2\"", price: 2584, kind: "valve", color: "white", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTD-0002-000015B", name: "Клапан термостатический STOUT Design черный, угловой 1/2\"", price: 2832, kind: "valve", color: "black", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTD-0001-000015C", name: "Клапан термостатический STOUT Design хром, прямой 1/2\"", price: 2832, kind: "valve", color: "chrome", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTD-0001-000015W", name: "Клапан термостатический STOUT Design белый, прямой 1/2\"", price: 2793, kind: "valve", color: "white", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVTD-0001-000015B", name: "Клапан термостатический STOUT Design черный, прямой 1/2\"", price: 3015, kind: "valve", color: "black", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVLD-0002-000015C", name: "Клапан запорно-балансировочный STOUT Design хром, угловой 1/2\"", price: 2402, kind: "lockshield", color: "chrome", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVLD-0002-000015W", name: "Клапан запорно-балансировочный STOUT Design белый, угловой 1/2\"", price: 2390, kind: "lockshield", color: "white", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVLD-0002-000015B", name: "Клапан запорно-балансировочный STOUT Design черный, угловой 1/2\"", price: 2757, kind: "lockshield", color: "black", type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVLD-0001-000015C", name: "Клапан запорно-балансировочный STOUT Design хром, прямой 1/2\"", price: 2574, kind: "lockshield", color: "chrome", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVLD-0001-000015W", name: "Клапан запорно-балансировочный STOUT Design белый, прямой 1/2\"", price: 2550, kind: "lockshield", color: "white", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVLD-0001-000015B", name: "Клапан запорно-балансировочный STOUT Design черный, прямой 1/2\"", price: 2942, kind: "lockshield", color: "black", type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SHTD-0002-003015C", name: "Головка термостатическая STOUT Design хром, жидкостная M30x1,5", price: 2238, kind: "head", color: "chrome", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SHTD-0002-003015W", name: "Головка термостатическая STOUT Design белая, жидкостная M30x1,5", price: 1886, kind: "head", color: "white", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SHTD-0002-003015B", name: "Головка термостатическая STOUT Design черная, жидкостная M30x1,5", price: 3071, kind: "head", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" }
];

// Ручные (нетермостатические) клапаны и евроконус-варианты STOUT — для ручного добавления монтажником,
// в автообвязку не входят. Источник: sheet "STOUT Радиаторная арматура", прайс 07.2026.
const radManualValves = [
    { id: "SVRS-1172-000015", name: "Клапан ручной с неподъемным шпинделем, прямой 1/2\"", price: 783, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVRS-1172-000020", name: "Клапан ручной с неподъемным шпинделем, прямой 3/4\"", price: 1128, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVRS-1152-000015", name: "Клапан ручной с неподъемным шпинделем, угловой 1/2\"", price: 725, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVRS-1152-000020", name: "Клапан ручной с неподъемным шпинделем, угловой 3/4\"", price: 1077, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SVR-2122-000015", name: "Клапан ручной с закрытием \"металл по металлу\", прямой 1/2\"", price: 699, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVR-2122-000020", name: "Клапан ручной с закрытием \"металл по металлу\", прямой 3/4\"", price: 1005, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVR-2102-000015", name: "Клапан ручной с закрытием \"металл по металлу\", угловой 1/2\"", price: 645, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVR-2102-000020", name: "Клапан ручной с закрытием \"металл по металлу\", угловой 3/4\"", price: 962, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVR-2122-100015", name: "Клапан ручной с закрытием \"металл по металлу\" (доп. уплотнение), прямой 1/2\"", price: 808, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVR-2102-100015", name: "Клапан ручной с закрытием \"металл по металлу\" (доп. уплотнение), угловой 1/2\"", price: 680, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVL-1156-100015", name: "Клапан запорно-балансировочный (доп. уплотнение), угловой 1/2\"", price: 671, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVL-1176-100015", name: "Клапан запорно-балансировочный (доп. уплотнение), прямой 1/2\"", price: 730, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVL-1196-000015", name: "Клапан запорно-балансировочный, прямой (евроконус) 1/2\"х3/4\"ЕК", price: 713, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVL-1166-000015", name: "Клапан запорно-балансировочный, угловой (евроконус) 1/2\"х3/4\"ЕК", price: 656, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVT-0001-100015", name: "Клапан термостатический прямой (евроконус) 1/2\"х3/4\"ЕК", price: 1314, type: "straight", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVT-0002-100015", name: "Клапан термостатический угловой (евроконус) 1/2\"х3/4\"ЕК", price: 1261, type: "angled", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVT-0005-100015", name: "Клапан термостатический осевой (евроконус) 1/2\"х3/4\"ЕК", price: 1695, type: "axial", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-08-10" }
];

// Недостающие узлы нижнего подключения (однотрубный и раздельный) — добавляются к существующему
// catalog.h_valves (SVH-0002/0004 не трогаем). Источник: прайс 07.2026.
const hValvesExtra = [
    { id: "SVH-0001-000020", name: "Узел нижн. подкл. однотрубный (Прямой)", price: 2028, type: "straight", desc: "Для однотрубной системы.", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVH-0003-000020", name: "Узел нижн. подкл. однотрубный (Угловой)", price: 1896, type: "angled", desc: "Для однотрубной системы.", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVH-0005-000020", name: "Узел нижн. подкл. раздельный (Прямой)", price: 767, type: "straight", desc: "Раздельный монтаж.", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SVH-0006-000020", name: "Узел нижн. подкл. раздельный (Угловой)", price: 747, type: "angled", desc: "Раздельный монтаж.", availability: "in_stock", price_date: "2026-08-10" }
];

// Переходник под плоское уплотнение — добавляется к rad_kits (SFT-0049-000002 не трогаем).
const radKitsExtra = [
    { id: "SFT-0049-000001", name: "Переходник под плоское уплотнение", price: 114, availability: "in_stock", price_date: "2026-08-10" }
];

// Аксессуары к радиаторам STOUT — монтажные комплекты, кронштейны, ниппель/прокладка, O-ring.
// Источник: sheet "STOUT Радиаторы отопления", раздел "STOUT Комплектующие к радиаторам", прайс 07.2026.
// Цены для SKU-0310-* и SKU-0111-130401 в прайсе даны только в EUR без готовой РУБ-колонки —
// переведены по курсу ~110 ₽/EUR, выведенному из соседних позиций этого же прайса, где указаны обе цены.
const radAccessories = [
    { id: "SKU-0111-000112", name: "Универсальный монтажный комплект для подключения радиатора 1/2\" RAL9016", price: 1509, brand: "STOUT", availability: "in_stock", price_date: "2026-07-13" },
    { id: "SKU-0111-000134", name: "Универсальный монтажный комплект для подключения радиатора 3/4\" RAL9016", price: 1709, brand: "STOUT", availability: "on_order", price_date: "2026-07-13" },
    // Монтажные наборы для подключения радиатора STOUT в цвет прибора (белый RAL9016 / графит / чёрный 9011),
    // 1/2" и 3/4". Цены РРЦ. Подбираются автоматически по цвету секционного/дизайн-радиатора (см. app.js, раздел 3.1).
    { id: "SKU-0211-000112", name: "Монтажный набор для подключения радиатора 1/2\" RAL9016", price: 630, color: "white", size: "1/2", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0211-000134", name: "Монтажный набор для подключения радиатора 3/4\" RAL9016", price: 720, color: "white", size: "3/4", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0221-000112", name: "Монтажный набор для подключения радиатора 1/2\" (Графит)", price: 720, color: "graphite", size: "1/2", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0221-000134", name: "Монтажный набор для подключения радиатора 3/4\" (Графит)", price: 810, color: "graphite", size: "3/4", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0231-000112", name: "Монтажный набор для подключения радиатора 1/2\" (Чёрный 9011)", price: 720, color: "black", size: "1/2", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0231-000134", name: "Монтажный набор для подключения радиатора 3/4\" (Чёрный 9011)", price: 810, color: "black", size: "3/4", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0320-000080", name: "Комплект настенных регулируемых кронштейнов", price: 326, color: "white", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0320-000080-7024", name: "Комплект настенных регулируемых кронштейнов (Графит)", price: 541, color: "graphite", brand: "STOUT", availability: "in_stock", price_date: "2026-08-10" },
    { id: "SKU-0320-000080-9005", name: "Комплект настенных регулируемых кронштейнов (Чёрный)", price: 541, color: "black", brand: "STOUT", availability: "in_stock", price_date: "2026-07-01" },
    { id: "SKU-0310-000001", name: "Ниппель межсекционный 1\" (ALPHA, VEGA)", price: 4080, brand: "STOUT", availability: "in_stock", price_date: "2026-07-01" },
    { id: "SKU-0310-000002", name: "Прокладка межсекционная (ALPHA, VEGA)", price: 3376, brand: "STOUT", availability: "in_stock", price_date: "2026-07-01" },
    { id: "SKU-0111-130401", name: "Комплект из 4-х прокладок O-Ring 1\" для универсального монтажного комплекта (SPACE, OSCAR)", price: 9065, brand: "STOUT", availability: "on_order", price_date: "2026-07-13" }
];

// STOUT Полотенцесушители ЭЛЕКТРИЧЕСКИЕ. Лист «STOUT Полотенцесушители», прайс 07.2026.
// Подбор — «пикер» (фильтры по цвету/серии + «Аналог»), по умолчанию 1 шт. на санузел.
// Цены округлены до рубля из колонки «Цена с НДС». Поля: series (серия), color (цвет для фильтра),
// shape (round/quadro), size (В×Ш, см). Цвета: polished (Полированный), black (Чёрный матовый),
// gunmetal (Оружейная сталь), graphite (Графит), gold (Золотой хром 585).
const towelWarmersElectric = [
    { id: "SHQ-J1RR-008050", name: "Полотенцесушитель эл. JAZZ round 80×50, Полированный", price: 19931, series: "JAZZ", shape: "round", size: "80×50", color: "polished", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J2RR-008050", name: "Полотенцесушитель эл. JAZZ round 80×50, Чёрный матовый", price: 18434, series: "JAZZ", shape: "round", size: "80×50", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J1RR-F08050", name: "Полотенцесушитель эл. JAZZ round 80×50, Полированный (с полкой)", price: 22380, series: "JAZZ", shape: "round", size: "80×50", color: "polished", shelf: true, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J2RR-F08050", name: "Полотенцесушитель эл. JAZZ round 80×50, Чёрный матовый (с полкой)", price: 19258, series: "JAZZ", shape: "round", size: "80×50", color: "black", shelf: true, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-R1R0-012008", name: "Полотенцесушитель эл. ROCK round 120×08, Полированный (2 опоры)", price: 15695, series: "ROCK", shape: "round", size: "120×08", color: "polished", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-R2R0-012008", name: "Полотенцесушитель эл. ROCK round 120×08, Чёрный матовый (2 опоры)", price: 14356, series: "ROCK", shape: "round", size: "120×08", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-R2R0-012012", name: "Полотенцесушитель эл. ROCK round 120×12, Чёрный матовый (3 опоры)", price: 17871, series: "ROCK", shape: "round", size: "120×12", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-R1Q0-012008", name: "Полотенцесушитель эл. ROCK quadro 120×08, Полированный (2 опоры)", price: 18775, series: "ROCK", shape: "quadro", size: "120×08", color: "polished", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-R2Q0-012008", name: "Полотенцесушитель эл. ROCK quadro 120×08, Чёрный матовый (2 опоры)", price: 15673, series: "ROCK", shape: "quadro", size: "120×08", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-R2Q0-012012", name: "Полотенцесушитель эл. ROCK quadro 120×12, Чёрный матовый (2 опоры)", price: 19949, series: "ROCK", shape: "quadro", size: "120×12", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J1QQ-008050", name: "Полотенцесушитель эл. JAZZ quadro 80×50, Полированный", price: 23987, series: "JAZZ", shape: "quadro", size: "80×50", color: "polished", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J2QQ-008050", name: "Полотенцесушитель эл. JAZZ quadro 80×50, Чёрный матовый", price: 19123, series: "JAZZ", shape: "quadro", size: "80×50", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J1QQ-F08050", name: "Полотенцесушитель эл. JAZZ quadro 80×50, Полированный (с полкой)", price: 25274, series: "JAZZ", shape: "quadro", size: "80×50", color: "polished", shelf: true, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J2QQ-F08050", name: "Полотенцесушитель эл. JAZZ quadro 80×50, Чёрный матовый (с полкой)", price: 19926, series: "JAZZ", shape: "quadro", size: "80×50", color: "black", shelf: true, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-F1QQ-008050", name: "Полотенцесушитель эл. FORTE quadro 80×50, Полированный", price: 27232, series: "FORTE", shape: "quadro", size: "80×50", color: "polished", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-F2QQ-008050", name: "Полотенцесушитель эл. FORTE quadro 80×50, Чёрный матовый", price: 20042, series: "FORTE", shape: "quadro", size: "80×50", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-P2QR-008050", name: "Полотенцесушитель эл. PIANO quadro 80×50, Чёрный матовый", price: 19811, series: "PIANO", shape: "quadro", size: "80×50", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-P1QR-008050", name: "Полотенцесушитель эл. PIANO quadro 80×50, Полированный", price: 23679, series: "PIANO", shape: "quadro", size: "80×50", color: "polished", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-S3QQ-008050", name: "Полотенцесушитель эл. SOUL quadro 80×50, Оружейная сталь", price: 44627, series: "SOUL", shape: "quadro", size: "80×50", color: "gunmetal", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-T2QQ-008050", name: "Полотенцесушитель эл. TECHNO quadro 80×50, Чёрный матовый", price: 20590, series: "TECHNO", shape: "quadro", size: "80×50", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-G4QQ-008050", name: "Полотенцесушитель эл. GRUNGE quadro 80×50, Графит", price: 24911, series: "GRUNGE", shape: "quadro", size: "80×50", color: "graphite", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-N4QQ-007050", name: "Полотенцесушитель эл. NEOSOUL quadro 70×50, Графит", price: 23497, series: "NEOSOUL", shape: "quadro", size: "70×50", color: "graphite", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-N2QQ-007050", name: "Полотенцесушитель эл. NEOSOUL quadro 70×50, Чёрный матовый", price: 21862, series: "NEOSOUL", shape: "quadro", size: "70×50", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-N2QQ-010050", name: "Полотенцесушитель эл. NEOSOUL quadro 100×50, Чёрный матовый", price: 23126, series: "NEOSOUL", shape: "quadro", size: "100×50", color: "black", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-N4QQ-010050", name: "Полотенцесушитель эл. NEOSOUL quadro 100×50, Графит", price: 24463, series: "NEOSOUL", shape: "quadro", size: "100×50", color: "graphite", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J8RR-008050", name: "Полотенцесушитель эл. JAZZ round 80×50, Золотой хром", price: 21481, series: "JAZZ", shape: "round", size: "80×50", color: "gold", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-J8RR-F08050", name: "Полотенцесушитель эл. JAZZ round 80×50, Золотой хром (с полкой)", price: 24939, series: "JAZZ", shape: "round", size: "80×50", color: "gold", shelf: true, brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" },
    { id: "SHQ-R8R0-012008", name: "Полотенцесушитель эл. ROCK round 120×08, Золотой хром (2 опоры)", price: 19416, series: "ROCK", shape: "round", size: "120×08", color: "gold", brand: "STOUT", unit: "шт", availability: "in_stock", price_date: "2026-07-24" }
];

// Город → регион для автоподстановки в анкете (app.autofillRegionByCity).
// Ключ — название города в нижнем регистре, «ё» приведена к «е». Одноимённые города
// разных регионов (Железногорск, Светлогорск и т.п.) сюда сознательно не включены:
// подставить один из двух наугад хуже, чем оставить поле пустым — пользователь допишет сам.
const CITY_REGION_MAP = {
    // Города федерального значения
    "москва": "Москва", "зеленоград": "Москва", "санкт-петербург": "Санкт-Петербург", "севастополь": "Севастополь",
    // Административные центры субъектов РФ
    "абакан": "Республика Хакасия", "анадырь": "Чукотский автономный округ", "архангельск": "Архангельская область",
    "астрахань": "Астраханская область", "барнаул": "Алтайский край", "белгород": "Белгородская область",
    "биробиджан": "Еврейская автономная область", "благовещенск": "Амурская область", "брянск": "Брянская область",
    "великий новгород": "Новгородская область", "владивосток": "Приморский край", "владикавказ": "Республика Северная Осетия — Алания",
    "владимир": "Владимирская область", "волгоград": "Волгоградская область", "вологда": "Вологодская область",
    "воронеж": "Воронежская область", "горно-алтайск": "Республика Алтай", "грозный": "Чеченская Республика",
    "екатеринбург": "Свердловская область", "иваново": "Ивановская область", "ижевск": "Удмуртская Республика",
    "иркутск": "Иркутская область", "йошкар-ола": "Республика Марий Эл", "казань": "Республика Татарстан",
    "калининград": "Калининградская область", "калуга": "Калужская область", "кемерово": "Кемеровская область",
    "киров": "Кировская область", "кострома": "Костромская область", "краснодар": "Краснодарский край",
    "красноярск": "Красноярский край", "курган": "Курганская область", "курск": "Курская область",
    "кызыл": "Республика Тыва", "липецк": "Липецкая область", "магадан": "Магаданская область",
    "магас": "Республика Ингушетия", "майкоп": "Республика Адыгея", "махачкала": "Республика Дагестан",
    "мурманск": "Мурманская область", "нальчик": "Кабардино-Балкарская Республика", "нарьян-мар": "Ненецкий автономный округ",
    "нижний новгород": "Нижегородская область", "новосибирск": "Новосибирская область", "омск": "Омская область",
    "орел": "Орловская область", "оренбург": "Оренбургская область", "пенза": "Пензенская область",
    "пермь": "Пермский край", "петрозаводск": "Республика Карелия", "петропавловск-камчатский": "Камчатский край",
    "псков": "Псковская область", "ростов-на-дону": "Ростовская область", "рязань": "Рязанская область",
    "салехард": "Ямало-Ненецкий автономный округ", "самара": "Самарская область", "саранск": "Республика Мордовия",
    "саратов": "Саратовская область", "симферополь": "Республика Крым", "смоленск": "Смоленская область",
    "ставрополь": "Ставропольский край", "сыктывкар": "Республика Коми", "тамбов": "Тамбовская область",
    "тверь": "Тверская область", "томск": "Томская область", "тула": "Тульская область", "тюмень": "Тюменская область",
    "улан-удэ": "Республика Бурятия", "ульяновск": "Ульяновская область", "уфа": "Республика Башкортостан",
    "хабаровск": "Хабаровский край", "ханты-мансийск": "Ханты-Мансийский автономный округ — Югра",
    "чебоксары": "Чувашская Республика", "челябинск": "Челябинская область", "черкесск": "Карачаево-Черкесская Республика",
    "чита": "Забайкальский край", "элиста": "Республика Калмыкия", "южно-сахалинск": "Сахалинская область",
    "якутск": "Республика Саха (Якутия)", "ярославль": "Ярославская область",
    // Московская и Ленинградская области
    "балашиха": "Московская область", "химки": "Московская область", "подольск": "Московская область",
    "королев": "Московская область", "мытищи": "Московская область", "люберцы": "Московская область",
    "красногорск": "Московская область", "одинцово": "Московская область", "домодедово": "Московская область",
    "щелково": "Московская область", "пушкино": "Московская область", "раменское": "Московская область",
    "электросталь": "Московская область", "серпухов": "Московская область", "ногинск": "Московская область",
    "орехово-зуево": "Московская область", "сергиев посад": "Московская область", "долгопрудный": "Московская область",
    "реутов": "Московская область", "жуковский": "Московская область", "дмитров": "Московская область",
    "клин": "Московская область", "коломна": "Московская область", "видное": "Московская область",
    "лобня": "Московская область", "дубна": "Московская область", "егорьевск": "Московская область",
    "ступино": "Московская область", "чехов": "Московская область", "наро-фоминск": "Московская область",
    "воскресенск": "Московская область", "павловский посад": "Московская область", "истра": "Московская область",
    "солнечногорск": "Московская область", "зарайск": "Московская область", "фрязино": "Московская область",
    "ивантеевка": "Московская область", "лыткарино": "Московская область", "можайск": "Московская область",
    "гатчина": "Ленинградская область", "выборг": "Ленинградская область", "всеволожск": "Ленинградская область",
    "сосновый бор": "Ленинградская область", "кириши": "Ленинградская область", "тихвин": "Ленинградская область",
    "кингисепп": "Ленинградская область", "волхов": "Ленинградская область",
    // Урал и Поволжье
    "нижний тагил": "Свердловская область", "каменск-уральский": "Свердловская область", "первоуральск": "Свердловская область",
    "серов": "Свердловская область", "асбест": "Свердловская область", "верхняя пышма": "Свердловская область",
    "березовский": "Свердловская область", "ревда": "Свердловская область",
    "магнитогорск": "Челябинская область", "златоуст": "Челябинская область", "миасс": "Челябинская область",
    "копейск": "Челябинская область", "озерск": "Челябинская область",
    "набережные челны": "Республика Татарстан", "нижнекамск": "Республика Татарстан", "альметьевск": "Республика Татарстан",
    "зеленодольск": "Республика Татарстан", "елабуга": "Республика Татарстан",
    "стерлитамак": "Республика Башкортостан", "салават": "Республика Башкортостан", "нефтекамск": "Республика Башкортостан",
    "октябрьский": "Республика Башкортостан", "белорецк": "Республика Башкортостан",
    "тольятти": "Самарская область", "сызрань": "Самарская область", "новокуйбышевск": "Самарская область",
    "дзержинск": "Нижегородская область", "арзамас": "Нижегородская область", "саров": "Нижегородская область",
    "энгельс": "Саратовская область", "балаково": "Саратовская область", "балашов": "Саратовская область",
    "орск": "Оренбургская область", "новотроицк": "Оренбургская область", "бузулук": "Оренбургская область",
    "сарапул": "Удмуртская Республика", "глазов": "Удмуртская Республика", "воткинск": "Удмуртская Республика",
    "новочебоксарск": "Чувашская Республика", "волжск": "Республика Марий Эл", "рузаевка": "Республика Мордовия",
    "березники": "Пермский край", "соликамск": "Пермский край", "чайковский": "Пермский край",
    "димитровград": "Ульяновская область", "кузнецк": "Пензенская область", "кирово-чепецк": "Кировская область",
    // Юг
    "сочи": "Краснодарский край", "новороссийск": "Краснодарский край", "армавир": "Краснодарский край",
    "анапа": "Краснодарский край", "геленджик": "Краснодарский край", "ейск": "Краснодарский край",
    "туапсе": "Краснодарский край", "кропоткин": "Краснодарский край", "славянск-на-кубани": "Краснодарский край",
    "таганрог": "Ростовская область", "шахты": "Ростовская область", "новочеркасск": "Ростовская область",
    "волгодонск": "Ростовская область", "батайск": "Ростовская область", "азов": "Ростовская область",
    "волжский": "Волгоградская область", "камышин": "Волгоградская область",
    "пятигорск": "Ставропольский край", "кисловодск": "Ставропольский край", "невинномысск": "Ставропольский край",
    "ессентуки": "Ставропольский край", "минеральные воды": "Ставропольский край", "железноводск": "Ставропольский край",
    "георгиевск": "Ставропольский край", "буденновск": "Ставропольский край",
    "керчь": "Республика Крым", "евпатория": "Республика Крым", "ялта": "Республика Крым",
    "феодосия": "Республика Крым", "джанкой": "Республика Крым", "саки": "Республика Крым",
    "дербент": "Республика Дагестан", "каспийск": "Республика Дагестан", "хасавюрт": "Республика Дагестан",
    "буйнакск": "Республика Дагестан", "избербаш": "Республика Дагестан",
    "гудермес": "Чеченская Республика", "урус-мартан": "Чеченская Республика", "аргун": "Чеченская Республика",
    "назрань": "Республика Ингушетия", "малгобек": "Республика Ингушетия",
    "моздок": "Республика Северная Осетия — Алания", "беслан": "Республика Северная Осетия — Алания",
    "прохладный": "Кабардино-Балкарская Республика", "нарткала": "Кабардино-Балкарская Республика",
    "баксан": "Кабардино-Балкарская Республика", "усть-джегута": "Карачаево-Черкесская Республика",
    // Сибирь и Дальний Восток
    "норильск": "Красноярский край", "ачинск": "Красноярский край", "канск": "Красноярский край",
    "минусинск": "Красноярский край", "бердск": "Новосибирская область", "искитим": "Новосибирская область",
    "северск": "Томская область", "бийск": "Алтайский край", "рубцовск": "Алтайский край",
    "новоалтайск": "Алтайский край", "белокуриха": "Алтайский край",
    "новокузнецк": "Кемеровская область", "прокопьевск": "Кемеровская область", "междуреченск": "Кемеровская область",
    "ленинск-кузнецкий": "Кемеровская область", "белово": "Кемеровская область",
    "братск": "Иркутская область", "ангарск": "Иркутская область", "усть-илимск": "Иркутская область",
    "усолье-сибирское": "Иркутская область", "черногорск": "Республика Хакасия", "саяногорск": "Республика Хакасия",
    "северобайкальск": "Республика Бурятия", "краснокаменск": "Забайкальский край",
    "комсомольск-на-амуре": "Хабаровский край", "находка": "Приморский край", "уссурийск": "Приморский край",
    "артем": "Приморский край", "белогорск": "Амурская область", "свободный": "Амурская область",
    "холмск": "Сахалинская область", "корсаков": "Сахалинская область", "елизово": "Камчатский край",
    "нерюнгри": "Республика Саха (Якутия)", "мирный": "Республика Саха (Якутия)",
    // Тюменский север
    "тобольск": "Тюменская область", "ишим": "Тюменская область",
    "сургут": "Ханты-Мансийский автономный округ — Югра", "нижневартовск": "Ханты-Мансийский автономный округ — Югра",
    "нефтеюганск": "Ханты-Мансийский автономный округ — Югра", "когалым": "Ханты-Мансийский автономный округ — Югра",
    "мегион": "Ханты-Мансийский автономный округ — Югра", "нягань": "Ханты-Мансийский автономный округ — Югра",
    "новый уренгой": "Ямало-Ненецкий автономный округ", "ноябрьск": "Ямало-Ненецкий автономный округ",
    "надым": "Ямало-Ненецкий автономный округ", "муравленко": "Ямало-Ненецкий автономный округ",
    "губкинский": "Ямало-Ненецкий автономный округ",
    // Северо-Запад и Центр
    "северодвинск": "Архангельская область", "котлас": "Архангельская область",
    "апатиты": "Мурманская область", "североморск": "Мурманская область", "мончегорск": "Мурманская область",
    "ухта": "Республика Коми", "воркута": "Республика Коми", "печора": "Республика Коми",
    "череповец": "Вологодская область", "великий устюг": "Вологодская область", "сокол": "Вологодская область",
    "кондопога": "Республика Карелия", "сегежа": "Республика Карелия", "костомукша": "Республика Карелия",
    "советск": "Калининградская область", "черняховск": "Калининградская область", "гусев": "Калининградская область",
    "зеленоградск": "Калининградская область", "балтийск": "Калининградская область",
    "великие луки": "Псковская область", "боровичи": "Новгородская область", "старая русса": "Новгородская область",
    "ковров": "Владимирская область", "муром": "Владимирская область", "александров": "Владимирская область",
    "гусь-хрустальный": "Владимирская область",
    "рыбинск": "Ярославская область", "переславль-залесский": "Ярославская область", "тутаев": "Ярославская область",
    "ржев": "Тверская область", "вышний волочек": "Тверская область", "кимры": "Тверская область",
    "конаково": "Тверская область", "торжок": "Тверская область",
    "обнинск": "Калужская область", "людиново": "Калужская область",
    "новомосковск": "Тульская область", "алексин": "Тульская область", "щекино": "Тульская область",
    "старый оскол": "Белгородская область", "губкин": "Белгородская область",
    "россошь": "Воронежская область", "лиски": "Воронежская область", "борисоглебск": "Воронежская область",
    "елец": "Липецкая область", "клинцы": "Брянская область", "ливны": "Орловская область", "мценск": "Орловская область",
    "касимов": "Рязанская область", "скопин": "Рязанская область",
    "кинешма": "Ивановская область", "шуя": "Ивановская область",
    "вязьма": "Смоленская область", "рославль": "Смоленская область", "сафоново": "Смоленская область",
    "десногорск": "Смоленская область", "мичуринск": "Тамбовская область",
    // Казахстан
    "астана": "Астана", "алматы": "Алматы", "шымкент": "Шымкент",
    "караганда": "Карагандинская область", "темиртау": "Карагандинская область", "балхаш": "Карагандинская область",
    "актобе": "Актюбинская область", "тараз": "Жамбылская область", "павлодар": "Павлодарская область",
    "экибастуз": "Павлодарская область", "усть-каменогорск": "Восточно-Казахстанская область",
    "семей": "Область Абай", "атырау": "Атырауская область", "костанай": "Костанайская область",
    "рудный": "Костанайская область", "кызылорда": "Кызылординская область", "уральск": "Западно-Казахстанская область",
    "петропавловск": "Северо-Казахстанская область", "актау": "Мангистауская область", "жанаозен": "Мангистауская область",
    "туркестан": "Туркестанская область", "кокшетау": "Акмолинская область", "талдыкорган": "Жетысуская область",
    "жезказган": "Улытауская область",
    // Беларусь
    "минск": "Минск", "гомель": "Гомельская область", "могилев": "Могилёвская область", "витебск": "Витебская область",
    "гродно": "Гродненская область", "брест": "Брестская область", "бобруйск": "Могилёвская область",
    "барановичи": "Брестская область", "борисов": "Минская область", "пинск": "Брестская область",
    "орша": "Витебская область", "мозырь": "Гомельская область", "солигорск": "Минская область",
    "новополоцк": "Витебская область", "лида": "Гродненская область", "молодечно": "Минская область",
    "полоцк": "Витебская область", "жлобин": "Гомельская область", "речица": "Гомельская область",
    "слуцк": "Минская область", "жодино": "Минская область",
    // Украина
    "киев": "Киев", "харьков": "Харьковская область", "одесса": "Одесская область", "днепр": "Днепропетровская область",
    "донецк": "Донецкая область", "запорожье": "Запорожская область", "львов": "Львовская область",
    "кривой рог": "Днепропетровская область", "николаев": "Николаевская область", "мариуполь": "Донецкая область",
    "луганск": "Луганская область", "винница": "Винницкая область", "херсон": "Херсонская область",
    "полтава": "Полтавская область", "чернигов": "Черниговская область", "черкассы": "Черкасская область",
    "житомир": "Житомирская область", "сумы": "Сумская область", "хмельницкий": "Хмельницкая область",
    "черновцы": "Черновицкая область", "ровно": "Ровенская область", "ивано-франковск": "Ивано-Франковская область",
    "тернополь": "Тернопольская область", "луцк": "Волынская область", "ужгород": "Закарпатская область",
    "кропивницкий": "Кировоградская область"
};
