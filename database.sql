-- Создание таблицы жанров
CREATE TABLE genres ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(255) NOT NULL 
);

-- Создание таблицы фильмов
CREATE TABLE films (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL
);

-- Таблица многие ко многим для фильмов и жанров
CREATE TABLE films_genres ( 
    film_id INTEGER, 
    genre_id INTEGER, 
    FOREIGN KEY (film_id) REFERENCES films(id), 
    FOREIGN KEY (genre_id) REFERENCES genres(id), 
    PRIMARY KEY (film_id, genre_id) 
);