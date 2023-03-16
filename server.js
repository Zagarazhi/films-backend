const http = require('http');
const { getAllGenres, getGenreById, createGenre, updateGenre, deleteGenre } = require('./controllers/genres');
const { getAllFilms, getFilmById, createFilm, updateFilm, deleteFilm } = require('./controllers/films');
const { createFilmGenre, getAllFilmsGenres, getFilmGenres, getFilmsByGenre, updateFilmGenre, deleteFilmGenre } = require('./controllers/films_genres');
const pool = require('./db');

const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    if (url.match(/^\/genres\/?$/)) {
        switch (method) {
            case 'GET':
                await getAllGenres(req, res);
                break;
            case 'POST':
                await createGenre(req, res);
                break;
            default:
            res.statusCode = 405; // Метод недоступен
            res.end();
        }
    } else if (url.match(/^\/genres\/\d+\/?$/)) {
        switch (method) {
            case 'GET':
                await getGenreById(req, res);
                break;
            case 'PUT':
                await updateGenre(req, res);
                break;
            case 'DELETE':
                await deleteGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    }

    else if (url.match(/^\/films\/?$/)) {
        switch (method) {
            case 'GET':
                await getAllFilms(req, res);
                break;
            case 'POST':
                await createFilm(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    } else if (url.match(/^\/films\/\d+\/?$/)) {
            switch (method) {
                case 'GET':
                    await getFilmById(req, res);
                    break;
                case 'PUT':
                    await updateFilm(req, res);
                    break;
                case 'DELETE':
                    await deleteFilm(req, res);
                    break;
                default:
                    res.statusCode = 405; // Метод недоступен
                    res.end();
        }
    }
    
    else if (url.match(/^\/films\/genres\/?$/)) {
        switch (method) {
            case 'GET':
                await getAllFilmsGenres(req, res);
                break;
            case 'POST':
                await createFilmGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    } else if (url.match(/^\/films\/\d+\/genres\/?$/)) {
        switch (method) {
            case 'GET':
                await getFilmGenres(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    } else if (url.match(/^\/genres\/\d+\/films\/?$/)) {
        switch (method) {
            case 'GET':
                await getFilmsByGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    } else if (url.match(/^\/films\/\d+\/genres\/\d+\/?$/)) {
        switch (method) {
            case 'PUT':
                await updateFilmGenre(req, res);
                break;
            case 'DELETE':
                await deleteFilmGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    }
  
    // 404 Не найдено
    else {
        res.statusCode = 404;
        res.end();
    }
});
  

/*
const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    if (url.match(/^\/genres\/?$/)) {
        switch (method) {
            case 'GET':
                await getAllGenres(req, res);
                break;
            case 'POST':
                await createGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    } else if (url.match(/^\/genres\/\d+\/?$/)) {
        switch (method) {
            case 'GET':
                await getGenreById(req, res);
                break;
            case 'PUT':
                await updateGenre(req, res);
                break;
            case 'DELETE':
                await deleteGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    }

    else if (url.match(/^\/films\/?$/)) {
        switch (method) {
            case 'GET':
                await getAllFilms(req, res);
                break;
            case 'POST':
                await createFilm(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    } else if (url.match(/^\/films\/\d+\/?$/)) {
        switch (method) {
            case 'GET':
                await getFilmById(req, res);
                break;
            case 'PUT':
                await updateFilm(req, res);
                break;
            case 'DELETE':
                await deleteFilm(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    }

    else if (url.match(/^\/films\/\d+\/genres\/?$/)) {
        switch (method) {
            case 'GET':
                await getAllFilmGenres(req, res);
                break;
            case 'POST':
                await createFilmGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    } else if (url.match(/^\/films\/\d+\/genres\/\d+\/?$/)) {
        switch (method) {
            case 'GET':
                await getFilmGenreById(req, res);
                break;
            case 'PUT':
                await updateFilmGenre(req, res);
                break;
            case 'DELETE':
                await deleteFilmGenre(req, res);
                break;
            default:
                res.statusCode = 405; // Метод недоступен
                res.end();
        }
    }

    // 404 Не найдено
    else {
        res.statusCode = 404;
        res.end();
    }
});
*/
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

pool.connect((err, client) => {
    if (err) {
        console.error('Не удалось подключиться к базе данных', err);
        process.exit(1);
    }
    console.log('Успешное подключение к базе данных');

    server.listen(PORT, () => {
        console.log(`Сервер запущен на http://${HOST}:${PORT}`);
    });
});
