global.expect = require('chai').expect;
global.sinon = require('sinon');
global.chai = require('chai');

chai.should();
chai
    .use(require('sinon-chai'))
    .use(require('chai-as-promised'));
