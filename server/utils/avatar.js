import randomstring from 'randomstring';
import jdenticon from 'jdenticon';
import fs from 'fs';

module.exports = () => {
    const hash = randomstring.generate({ charset: 'hex' });
    const png = jdenticon.toPng(hash, 200);
    fs.writeFileSync(`../../dist/img/avatar/${hash}.png`, png);
    return hash;
};
