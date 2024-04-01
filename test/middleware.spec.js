const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const sandbox = require('sinon').createSandbox();
const jwt = require('jsonwebtoken');
const {ERR_CODES} = require('../helpers/constants');
const {USER_STATUS} = require('../db/models/user/model');

chai.should();

chai.use(chaiHttp);

describe('middleware test using /hire', () => {
    const userData = {
        id : "abc123",
        email : "email@email.com",
        password : "Password@123",
        username : "username",
        isRecruiter : true,
        userStatus : USER_STATUS.VERIFIED,
        loginTime : Date.now()
    }

    let token;

    describe('invalid auth header', () => {

        beforeEach(() => {
            token = jwt.sign(userData, process.env.SECRET_KEY, {expiresIn : Number(process.env.JWT_TIMEOUT)});
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return 401 status without auth header', (done) => {
            chai.request(app)
                .get('/hire/getFreelancers')
                .end((err, res) => {
                    res.should.have.status(401);
                    res.text.should.be.eq(ERR_CODES[502]);
                    done();
                });
        });

        it('should return 401 without bearer prefix', (done) => {
            chai.request(app)
                .get('/hire/getFreelancers')
                .set('Authorization', token)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.text.should.be.eq(ERR_CODES[502]);
                    done();
                });
        });
    });

    describe('invalid token content', () => {
        before(() => {
            token = jwt.sign({
                ...userData,
                id : undefined
            }, process.env.SECRET_KEY, {expiresIn : Number(process.env.JWT_TIMEOUT)});
            sandbox.stub(jwt, 'verify').returns({});
        });

        after(() => {
            sandbox.restore();
        });

        it('should return 401 status with invalid token', (done) => {
            chai.request(app)
                .get('/hire/getFreelancers')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.text.should.be.equal("Invalid Token");
                    done();
                });
        });
    });

    describe('invalid token', () => {
        before(() => {
            token = jwt.sign(userData, process.env.SECRET_KEY, {expiresIn : Number(process.env.JWT_TIMEOUT)});
            sandbox.stub(jwt, 'verify').throws(new Error('Invalid token'));
        });

        after(() => {
            sandbox.restore();
        });

        it('should return 401 status with invalid token', (done) => {
            chai.request(app)
                .get('/hire/getFreelancers')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.text.should.be.equal(ERR_CODES[502]);
                    done();
                });
        });
    });

    describe('valid token and blocked user', () => {
        before(() => {
            token = jwt.sign({
                ...userData,
                userStatus : USER_STATUS.BLOCKED
            }, process.env.SECRET_KEY, {expiresIn : Number(process.env.JWT_TIMEOUT)});
        });

        after(() => {
            sandbox.restore();
        });
        it('should return 401 status with blocked user', (done) => {
            chai.request(app)
                .get('/hire/getFreelancers')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.text.should.be.equal(ERR_CODES[415]);
                    done();
                });
        });
    });

    describe('valid token and unverified user', () => {
        before(() => {
            token = jwt.sign({
                ...userData,
                userStatus : USER_STATUS.UNVERIFIED
            }, process.env.SECRET_KEY, {expiresIn : Number(process.env.JWT_TIMEOUT)});
        });

        after(() => {
            sandbox.restore();
        });
        it('should return 401 status with unverified user', (done) => {
            chai.request(app)
                .get('/hire/getFreelancers')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.text.should.be.equal(ERR_CODES[414]);
                    done();
                });
        });
    });

    describe('valid token and unknown userStatus', () => {
        before(() => {
            token = jwt.sign({
                ...userData,
                userStatus : "invalid"
            }, process.env.SECRET_KEY, {expiresIn : Number(process.env.JWT_TIMEOUT)});
        });

        after(() => {
            sandbox.restore();
        });
        it('should return 401 status for unknown userStatus', (done) => {
            chai.request(app)
                .get('/hire/getFreelancers')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.text.should.be.equal(ERR_CODES[415]);
                    done();
                });
        });
    });
})
