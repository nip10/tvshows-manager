import request from 'supertest';
import pug from 'pug';
import path from 'path';
import app from '../app';

describe('route: index', () => {
    describe('GET /', () => {
        it('should return status code 200', () => {
            return request(app).get('/').expect(200);
        });
        it('should render the "index" view', () => {
            const html = pug.renderFile(path.join(__dirname, '../views/index.pug'), { title: 'Tv-shows Manager' });
            request(app).get('/')
                .end((err, res) => {
                    expect(res.text).toBe(html);
                });
        });
    });
});
