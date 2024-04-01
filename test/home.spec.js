const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;
const sandbox = require('sinon').createSandbox();
const Job = require('../db/models/job/model');
const Profile = require('../db/models/freelancer/model');
const { ERR_CODES } = require('../helpers/constants');
const jwt = require('jsonwebtoken');
const {USER_STATUS} = require('../db/models/user/model')

chai.use(chaiHttp);
chai.should();

describe('/home', () => {
    const userData = {
        id : "abc123",
        email : "email@email.com",
        password : "Password@123",
        username : "username",
        isRecruiter : true,
        userStatus : USER_STATUS.VERIFIED,
        loginTime : Date.now()
    }

    beforeEach(() => {
        sandbox.stub(jwt, 'verify').returns(userData);
    })

    afterEach(() => {
        sandbox.restore();
    });

    describe('GET /myjobs', () => {

        describe('database error', () => {
            before(() => {
                sandbox.stub(Job, 'find').rejects({});
            });
            
            after(() => {
                sandbox.restore();
            });

            it('should return 500 if database error occurs', (done) => {
                chai.request(app)
                    .get('/home/myjobs')
                    .set('Authorization', 'Bearer token')
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.equal(ERR_CODES[502]);
                        done();
                    });
            });
        });

        describe('no database error', () => {
            before(() => {
                sandbox.stub(Job, 'find').resolves([]);
            });

            after(() => {
                sandbox.restore();
            });

            it('should return 200 ', (done) => {
                chai.request(app)
                    .get('/home/myjobs')
                    .set('Authorization', 'Bearer token')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.equal(0);
                        done();
                    });
            });
        });
    });

    describe('GET /similarProfiles/:jobId', () => {
        describe('invalid job id', () => {
            it('should return 400 if job id is not provided', (done) => {
                chai.request(app)
                    .get('/home/similarProfiles/')
                    .set('Authorization', 'Bearer token')
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.equal("Invalid Job Id");
                        done();
                    });
            });
        });

        describe('job not found', () => {
            before(() => {
                sandbox.stub(Job, 'findOne').resolves(null);
            });

            after(() => {
                sandbox.restore();
            });

            it('should return 404 if job not found', (done) => {
                chai.request(app)
                    .get('/home/similarProfiles/abc123')
                    .set('Authorization', 'Bearer token')
                    .end((err, res) => {
                        res.should.have.status(404);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.equal("Job Not Found");
                        done();
                    });
            });
        });

        describe('database error', () => {
            before(() => {
                sandbox.stub(Job, 'findOne').resolves({});
                sandbox.stub(Profile, 'find').rejects({});
            });

            after(() => {
                sandbox.restore();
            });

            it('should return 500 if database error occurs', (done) => {
                chai.request(app)
                    .get('/home/similarProfiles/abc123')
                    .set('Authorization', 'Bearer token')
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.equal(ERR_CODES[502]);
                        done();
                    });
            });
        });

        describe('no database error', () => {
            before(() => {
                sandbox.stub(Job, 'findOne').resolves({
                    jobDescription : "description",
                    jobTitle : "title",
                    jobSkills : ["skill1", "skill2"]
                });
                sandbox.stub(Profile, 'find').resolves([{
                    userBio : "bio",
                    userAbout : "about",
                    userSkills : ["skill1", "skill2"]
                }]);
            });

            after(() => {
                sandbox.restore();
            });

            it('should return 200', (done) => {
                chai.request(app)
                    .get('/home/similarProfiles/abc123')
                    .set('Authorization', 'Bearer token')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.equal(1);
                        done();
                    });
            });
        });

        describe('no database error', () => {
            before(() => {
                sandbox.stub(Job, 'findOne').resolves({
                    jobDescription : "description",
                    jobTitle : "title",
                    jobSkills : ["skill1", "skill2"]
                });
                sandbox.stub(Profile, 'find').resolves([]);
            });

            after(() => {
                sandbox.restore();
            });

            it('should return 200', (done) => {
                chai.request(app)
                    .get('/home/similarProfiles/abc123')
                    .set('Authorization', 'Bearer token')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.equal(0);
                        done();
                    });
            });
        });
    });
});