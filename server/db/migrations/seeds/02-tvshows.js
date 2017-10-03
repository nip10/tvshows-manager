exports.seed = function (knex, Promise) {
  return knex('tvshows').del()
    .then(() =>
       knex('tvshows').insert({
         name: 'The Blacklist',
         description: 'Raymond "Red" Reddington, one of the FBIs most wanted fugitives, surrenders in person at FBI Headquarters in Washington, D.C. He claims that he and the FBI have the same interests: bringing down dangerous criminals and terrorists. In the last two decades, he has made a list of criminals and terrorists that matter the most but the FBI cannot find because it does not know they exist. Reddington calls this "The Blacklist". Reddington will co-operate, but insists that he will speak only to Elizabeth Keen, a rookie FBI profiler.',
         status: 'running',
         imdb: 'tt2741602',
         premiered: 'Sep 2013',
       }))
       .then(() => knex('tvshows').insert({
         name: 'Silicon Valley',
         description: 'In the high-tech gold rush of modern Silicon Valley, the people most qualified to succeed are the least capable of handling success. A comedy partially inspired by Mike Judge s own experiences as a Silicon Valley engineer in the late 1980s.',
         status: 'running',
         imdb: 'tt2575988',
         premiered: 'Apr 2014',
       }))
       .then(() => knex('tvshows').insert({
         name: 'Better Call Saul',
         description: 'We meet him when the man who will become Saul Goodman is known as Jimmy McGill, a small-time lawyer searching for his destiny and, more immediately, hustling to make ends meet. Working alongside, and, often, against Jimmy, is "fixer" Mike Erhmantraut. The series tracks Jimmys transformation into the man who puts "criminal" in "criminal lawyer".',
         status: 'running',
         imdb: 'tt3032476',
         premiered: 'Feb 2015',
       }));
};
