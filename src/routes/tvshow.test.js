import request from 'supertest';
import app from '../app';

describe('route: tvshows', () => {
    describe('GET /search/:name', () => {
        it('should return 200, json, an array of tvshows with id and seriesName', () => {
            const tvshow = encodeURIComponent('the blacklist');
            return request(app)
                .get(`/tvshows/search/${tvshow}`)
                .expect('Content-Type', /json/)
                .expect(200, [
                    {
                        id: ,
                        seriesName: 'The Blacklist',
                    },
                    {
                        id: ,
                        seriesName: 'The Blacklist: Redemption',
                    },
            ]);
        });
    });
});
