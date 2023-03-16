const pool = require('../db');

const parseId = (url) => {
    return parseInt(url.split('/')[2], 10);
};

const parseFilmGenreIds = (url) => {
    const old_film_id = parseInt(url.split('/')[2], 10);
    const old_genre_id = parseInt(url.split('/')[4], 10);
    return { old_film_id, old_genre_id };
};

const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', (err) => {
            reject({ statusCode: 400, message: 'Не удалось прочитать тело запроса' });
        });
    });
};

const parseRequest = (body) => {
    const { film_id, genre_id } = JSON.parse(body);
    if (!film_id || !genre_id) {
        throw { statusCode: 400, message: 'Неверный формат запроса' };
    }
    return { film_id, genre_id };
};

const createFilmGenreInDatabase = async (filmId, genreId) => {
    try{
        const result = await pool.query(
            'INSERT INTO films_genres (film_id, genre_id) VALUES ($1, $2) RETURNING *',
            [filmId, genreId]
        );
        return result;
    } catch(err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const getAllFilmsGenreInDatabase = async () => {
    try {
        const result = await pool.query('SELECT * FROM films_genres');
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const updateFilmGenreInDatabase = async (film_id, genre_id, old_film_id, old_genre_id) => {
    try {
        const result = await pool.query(
            'UPDATE films_genres SET film_id = $1, genre_id = $2 WHERE film_id = $3 AND genre_id = $4 RETURNING *',
            [film_id, genre_id, old_film_id, old_genre_id]
        );
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const getFilmGenresInDatabase = async (id) => {
    try{
        const result = await pool.query(
            'SELECT g.id, g.name FROM genres g JOIN films_genres fg ON g.id = fg.genre_id WHERE fg.film_id = $1',
            [id]
        );
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const getFilmsByGenreInDatabase = async (id) => {
    try{
        const result = await pool.query(
            'SELECT f.* FROM films f JOIN films_genres fg ON f.id = fg.film_id WHERE fg.genre_id = $1',
            [id]
        );
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const deleteFilmGenreInDatabase = async (old_film_id, old_genre_id) => {
    try{
        const result = await pool.query(
            'DELETE FROM films_genres WHERE film_id=$1 AND genre_id=$2 RETURNING *',
            [old_film_id, old_genre_id]
        );
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const createFilmGenre = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const { film_id, genre_id } = parseRequest(body);
        const result = await createFilmGenreInDatabase(film_id, genre_id);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const getAllFilmsGenres = async (req, res) => {
    try {
        const result = await getAllFilmsGenreInDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const getFilmGenres = async (req, res) => {
    const id = parseId(req.url);
    try {
        const result = await getFilmGenresInDatabase(id);
        if (result.rowCount === 0) {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Жанры не найдены' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};
  
const getFilmsByGenre = async (req, res) => {
    const id = parseId(req.url);
    try {
        const result = await getFilmsByGenreInDatabase(id);
        if (result.rowCount === 0) {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Фильмы не найдены' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const updateFilmGenre = async (req, res) => {
    try {
        const { old_film_id, old_genre_id } = parseFilmGenreIds(req.url);
        const body = await getRequestBody(req);
        const { film_id, genre_id } = parseRequest(body);
        const result = await updateFilmGenreInDatabase(film_id, genre_id, old_film_id, old_genre_id);
        if (result.rowCount > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Запись не найдена' }));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const deleteFilmGenre = async (req, res) => {
    try {
        const { old_film_id, old_genre_id } = parseFilmGenreIds(req.url);
        const result = await deleteFilmGenreInDatabase(old_film_id, old_genre_id);
        if (result.rowCount > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Запись не найдена' }));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

module.exports = {
    createFilmGenre,
    getAllFilmsGenres,
    getFilmGenres,
    getFilmsByGenre,
    updateFilmGenre,
    deleteFilmGenre
};