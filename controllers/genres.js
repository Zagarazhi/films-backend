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
    const { name } = JSON.parse(body);
    if (!name) {
        throw { statusCode: 400, message: 'Неверный формат запроса' };
    }
    return name;
};

const createGenreInDatabase = async (name) => {
    try {
        const result = await pool.query('INSERT INTO genres (name) VALUES ($1) RETURNING *', [name]);
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const getAllGenresInDatabase = async () => {
    try {
        const result = await pool.query('SELECT * FROM genres');
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const getGenreByIdInDatabase = async (id) => {
    try {
        const result = await pool.query('SELECT * FROM genres WHERE id = $1', [id]);
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const updateGenreInDatabase = async (name, id) => {
    try {
        const result = await pool.query('UPDATE genres SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
}

const getAllFilmsByGenreInDatabase = async (id) => {
    try {
        const result = await pool.query('SELECT * FROM films_genres WHERE genre_id = $1', [id]);
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const deleteGenreInDatabase = async (id) => {
    try {
        const result = await pool.query('DELETE FROM genres WHERE id = $1 RETURNING *', [id]);
        return result;
    } catch (err) {
        throw { statusCode: 400, message: 'Не удалось выполнить запрос к базе данных' };
    }
};

const createGenre = async (req, res) => {
    try {
        const body = await getRequestBody(req);
        const name = parseRequest(body);
        const result = await createGenreInDatabase(name);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const getAllGenres = async (req, res) => {
    try {
        const result = await getAllGenresInDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const getGenreById = async (req, res) => {
    try {
        const id = parseId(req.url);
        const result = await getGenreByIdInDatabase(id);
        if (result.rowCount > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Жанр не найден' }));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const updateGenre = async (req, res) => {
    try {
        const id = parseId(req.url);
        const body = await getRequestBody(req);
        const name = parseRequest(body);
        const result = await updateGenreInDatabase(name, id);
        if (result.rowCount > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Жанр не найден' }));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

const deleteGenre = async (req, res) => {
    try {
        const id = parseId(req.url);
        const films = await getAllFilmsByGenreInDatabase(id);
        if (films.rowCount > 0) {
            res.writeHead(409);
            res.end(JSON.stringify({ message: 'Нельзя удалить жанр, пока на него ссылается хотя бы один фильм' }));
        }
        const result = await deleteGenreInDatabase(id);
        if (result.rowCount > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.rows[0]));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Жанр не найден' }));
        }
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Ошибка сервера';
        res.writeHead(statusCode);
        res.end(JSON.stringify({ message }));
    }
};

module.exports = {
    getAllGenres,
    getGenreById,
    createGenre,
    updateGenre,
    deleteGenre,
};