exports.seed = function (knex, Promise) {
  return knex('tvshows').del()
    .then(() =>
      knex('tvshows').insert({
         name: 'Silicon Valley',
         description: 'In the high-tech gold rush of modern Silicon Valley, the people most qualified to succeed are the least capable of handling success. A comedy partially inspired by Mike Judge s own experiences as a Silicon Valley engineer in the late 1980s.',
         status: 'Running',
         imdb: 'tt2575988',
         thetvdb: 277165,
         genre: ['comedy'],
         premiered: 'Apr 2014',
         network: 'HBO',
         airdate: 'Sunday at 22:00',
         tvrating: '14',
         images: ['/foo.jpg'],
       }))
       .then(() => knex('tvshows').insert({
         name: 'Better Call Saul',
         description: 'We meet him when the man who will become Saul Goodman is known as Jimmy McGill, a small-time lawyer searching for his destiny and, more immediately, hustling to make ends meet. Working alongside, and, often, against Jimmy, is "fixer" Mike Erhmantraut. The series tracks Jimmys transformation into the man who puts "criminal" in "criminal lawyer".',
         status: 'Running',
         imdb: 'tt3032476',
         thetvdb: 273181,
         genre: ['crime', 'drama'],
         premiered: 'Feb 2015',
         network: 'AMC',
         airdate: 'Minday at 22:00',
         tvrating: '16',
         images: ['/bar.jpg'],
       }));
};
