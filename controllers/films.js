const pool = require('../db');

const parseId = (url) => {
    return parseInt(url.split('/')[2], 10);
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
    const { title, year, genres } = JSON.parse(body);
    if (!title || !year || !genres) {
        throw { statusCode: 400, message: 'Неверный формат запроса' };
    }
    return { title, year, genres };
};

const insertFilmInDatabase = async (title, year) => {
    try{
        const result = await pool.query(
            'INSERT INTO films (title, year) VALUES ($1, $2) RETURNING *',
            [title, year]
        );
        return result.rows[0];
    } catch(err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const getAllFilmsInDatabase = async () => {
    try {
        const result = await pool.query('SELECT * FROM films');
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const getFilmByIdInDatabase = async (id) => {
    try {
        const result = await pool.query('SELECT * FROM films WHERE id = $1', [id]);
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const updateFilmInDatabase = async (client, title, year, id) => {
    try {
        const result = await client.query(
            'UPDATE films SET title = $1, year = $2 WHERE id = $3 RETURNING *',
            [title, year, id]
        );
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
}

const deleteFilmInDatabase = async (id) => {
    try {
        const result = await pool.query('DELETE FROM films WHERE id=$1 RETURNING *', [id]);
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const createFilm = async (req, res) => {
    let filmId;
    try {
        const body = await getRequestBody(req);
        const { title, year, genres } = parseRequest(body);
        const result = await insertFilmInDatabase(title, year, genres);
        filmId = result.id;
        const genreValues = genres.map(genreId => `(${filmId}, ${genreId})`).join(',');
        await pool.query(
            `INSERT INTO films_genres (film_id, genre_id) VALUES ${genreValues}`
        );
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    } catch (err) {
        if (filmId) {
            await pool.query('DELETE FROM films WHERE id = $1', [filmId]);
        }
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const getAllFilms = async (req, res) => {
    try {
        const result = await getAllFilmsInDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const getFilmById = async (req, res) => {
    try {
        const id = parseId(req.url);
        const result = await getFilmByIdInDatabase(id);
        if (result.rowCount > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Фильм не найден' }));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const updateFilm = async (req, res) => {
    let client;
    let released = false;
    try {
        const id = parseId(req.url);
        const body = await getRequestBody(req);
        
        const { title, year, genres } = parseRequest(body);
        
        client = await pool.connect();
        await client.query('BEGIN');
        
        const filmResult = await updateFilmInDatabase( client, title, year, id);
        
        if (filmResult.rowCount === 0) {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Фильм не найден' }));
        }
        const film = filmResult.rows[0];
        
        await client.query('DELETE FROM films_genres WHERE film_id = $1', [id]);
        if (genres && genres.length > 0) {
            const genreValues = genres.map(genreId => `(${id}, ${genreId})`).join(',');
            try{
                await client.query(
                    `INSERT INTO films_genres (film_id, genre_id) VALUES ${genreValues}`
                );
            } catch(err) {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Жанр не найден' }));
            }
        }
        
        await client.query('COMMIT');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(film));
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
            client.release();
            released = true;
        }
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    } finally {
        if (client && !released) {
            client.release();
        }
    }
};

const deleteFilm = async (req, res) => {
    try {
        const id = parseId(req.url);
        try{
            await pool.query('DELETE FROM films_genres WHERE film_id = $1', [id]);
        } catch (err) {
            res.writeHead(400);
            res.end(JSON.stringify({ message: 'Не удалось выполнить запрос к базе данных' }));
        }
        const result = await deleteFilmInDatabase(id);
        if (result.rowCount > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Фильм не найден' }));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

module.exports = {
    getAllFilms,
    getFilmById,
    createFilm,
    updateFilm,
    deleteFilm,
};