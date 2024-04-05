const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const rewire = require('rewire')
const jwt = rewire('jsonwebtoken');
const nodemailer = require('nodemailer');
const sandbox = require('sinon').createSandbox();

const {USER_STATUS} = require('../db/models/user/model');
const {ERR_CODES} = require('../helpers/constants');

const {app} = require('../app');

const passwords = require('../helpers/password');
const {getRandomString} = require('../helpers/email');

const expect = chai.expect;
chai.should();

chai.use(chaiHttp);

describe('Authentication routes /auth' , () => {
    const userData = {
        email : "email@email.com",
        password : "Password@123",
        username : "username",
        isRecruiter : true,
        userStatus : USER_STATUS.VERIFIED
    }
    
    describe('/login' , () => {
        
        afterEach(() => {
            sandbox.restore();
        });

        describe('login with correct credentials' , () => {
            
            beforeEach(async() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    password : await passwords.hashPassword(userData.password)
                });
            })


            it("should return 200 with complete credentials" , (done) => {
                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email,
                        password : userData.password
                    })
                    .end((err , res) => {
                        // expect(comparePasswordStub.callCount).to.equal(1);
                        res.should.have.status(200);
                        expect(res.error).to.be.false;
                        expect(res.body.message).to.equal("Login Successful");
                        expect(res.body).to.have.property('token');
                        done();
                    })
            })

            it("should return 400 without password" , (done) => {
                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal('"password" is required');
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })

            it("should return 400 without email" , (done) => {
                chai.request(app)
                    .post('/auth/login')
                    .send({
                        password : userData.password
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal('"email" is required');
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })
        });

        describe('login with incorrect credentials' , () => {
            
            before(async() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    password : await passwords.hashPassword(userData.password)
                });
            })

            it("should return 400 with incorrect password" , (done) => {
                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email,
                        password : "Incorrect@123"
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[413]);
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })

        });

        describe('login with an unexisting account' , () => {
            
            before(async() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves();
            })

            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email,
                        password : userData.password
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[413]);
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })

        });

        describe('login with credentials of Blocked users' , () => {

            before(async() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    password : await passwords.hashPassword(userData.password),
                    userStatus : USER_STATUS.BLOCKED
                });
            })
            
            it("should return 400" , (done) => {

                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email,
                        password : userData.password
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[415]);
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })

        });

        describe('login with credentials of Unverified users' , () => {

            before(async() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    password : await passwords.hashPassword(userData.password),
                    userStatus : USER_STATUS.UNVERIFIED
                });
            })
            
            it("should return 400" , (done) => {

                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email,
                        password : userData.password
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[414]);
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })

        });

        describe('login with credentials of Non recruiters' , () => {

            before(async() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    password : await passwords.hashPassword(userData.password),
                    isRecruiter : false
                });
            })
            
            it("should return 400" , (done) => {

                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email,
                        password : userData.password
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[415]);
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })

        });

        describe('database error' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').rejects();
            })

            after(() => {
                sandbox.restore();
            });

            it("should return 500" , (done) => {
                chai.request(app)
                    .post('/auth/login')
                    .send({
                        email : userData.email,
                        password : userData.password
                    })
                    .end((err , res) => {
                        res.should.have.status(500);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        expect(res.error.text).to.equal(ERR_CODES[502]);
                        expect(res.body).not.to.have.property('token');
                        done();
                    })
            })
        });

        // describe('jwt error' , () => {
        //     before(async() => {
        //         sandbox.stub(jwt , 'sign').callsFake(() => {
        //             throw new Error();
        //         });
        //         sandbox.stub(mongoose.Model , 'findOne').resolves({
        //             ...userData,
        //             password : await passwords.hashPassword(userData.password)
        //         });
        //     })

        //     after(() => {
        //         sandbox.restore();
        //     });

        //     it("should return 500" , (done) => {
        //         chai.request(app)
        //             .post('/auth/login')
        //             .send({
        //                 email : userData.email,
        //                 password : userData.password
        //             })
        //             .end((err , res) => {
        //                 console.log(res);
        //                 res.should.have.status(500);
        //                 expect(res.error).instanceOf(Object);
        //                 expect(res.error.text).to.be.a('string');
        //                 expect(res.error.text).to.equal(ERR_CODES[501]);
        //                 expect(res.body).not.to.have.property('token');
        //                 done();
        //             })
        //     })
        // });
        
    })

    describe('/register' , () => {
        const credentials = {
            email : userData.email,
            password : userData.password,
            username : userData.username,
            isRecruiter : userData.isRecruiter,
            confirmPassword : userData.password
        }

        afterEach(() => {
            sandbox.restore();
        });

        describe('registering with correct credentials' , () => {

            beforeEach(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves(null);
                sandbox.stub(mongoose.Model.prototype , 'save').resolves();
                sandbox.stub(nodemailer , 'createTransport').returns({
                    sendMail : sandbox.stub().resolves()
                });
            })

            it("should return 200 with complete credentials" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials
                    })
                    .end((err , res) => {
                        res.should.have.status(200);
                        expect(res.error).to.be.false;
                        expect(res.text).to.equal("Registration Successful and email sent successfully to " + credentials.email);
                        done();
                    })
            })

            it("should return 400 with incomplete credentials" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials,
                        confirmPassword : null
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        done();
                    })
            })

            it("should return 400 with different passwords" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials,
                        confirmPassword : "Incorrect@123"
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        done();
                    })
            })

        })

        describe('registering with existing user credentials' , () => {
            beforeEach(() => {
                sandbox.stub(mongoose.Model , 'findOne').callsFake((query) => {
                    if(query.email === 'existing@email.com' || query.username === 'existingUsername'){
                        return Promise.resolve({
                            ...userData
                        })
                    }
                    if(query.username === 'databaseError'){
                        return Promise.reject(null);
                    }
                    return Promise.resolve(null);
                })
                sandbox.stub(mongoose.Model.prototype , 'save').resolves();
                sandbox.stub(nodemailer , 'createTransport').returns({
                    sendMail : sandbox.stub().resolves()
                });
            })

            it("should return 400 with existing email" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials,
                        email : 'existing@email.com'
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        expect(res.error.text).to.equal(ERR_CODES[411]);
                        done();
                    })
                    
            });

            it("should return 400 with existing username" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials,
                        username : 'existingUsername'
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        expect(res.error.text).to.equal(ERR_CODES[410]);
                        done();
                    })
                    
            });

            it("should return 502 with database error" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials,
                        username : 'databaseError'
                    })
                    .end((err , res) => {
                        res.should.have.status(502);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        expect(res.error.text).to.equal(ERR_CODES[502]);
                        done();
                    })
            })
        });

        describe('registering with email error' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves(null);
                sandbox.stub(mongoose.Model.prototype , 'save').resolves();
                sandbox.stub(nodemailer , 'createTransport').returns({
                    sendMail : sandbox.stub().rejects()
                });
            })

            it("should return 502 with email error" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials
                    })
                    .end((err , res) => {
                        res.should.have.status(502);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        expect(res.error.text).to.equal(ERR_CODES[502]);
                        done();
                    })
            })
        });

        describe('registering with database error' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves();
                sandbox.stub(nodemailer , 'createTransport').returns({
                    sendMail : sandbox.stub().resolves()
                });
                sandbox.stub(mongoose.Model.prototype , 'save').rejects();
            })

            it("should return 502 with database error" , (done) => {
                chai.request(app)
                    .post('/auth/register')
                    .send({
                        ...credentials
                    })
                    .end((err , res) => {
                        res.should.have.status(500);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        expect(res.error.text).to.equal(ERR_CODES[502]);
                        done();
                    })
            })
        })
    })       

    describe('/verify/:otp' , () => {
        
        afterEach(() => {
            sandbox.restore();
        });
                
        describe('verify without otp' , () => {
            it("should return 400" , (done) => {
                chai.request(app)
                .get('/auth/verify/')
                .end((err , res) => {
                    res.should.have.status(400);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal('OTP not found');
                    done();
                })
            })
        });
        
        describe('verify with invalid otp' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves();
            })
            it("should return 400" , (done) => {
                chai.request(app)
                .get('/auth/verify/' + 'abc')
                .end((err , res) => {
                    res.should.have.status(400);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal('"otp" length must be at least 20 characters long');
                    done();
                })
            })
        });

        describe('verify with incorrect otp' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves();
            })
            it("should return 400" , (done) => {
                const otp = getRandomString();
                chai.request(app)
                .get('/auth/verify/' + otp)
                .end((err , res) => {
                    res.should.have.status(400);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal(ERR_CODES[412]);
                    done();
                })
            })
        });
        
        describe('verify with valid otp' , () => {
            const otp = getRandomString() + userData.username;
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    otp : otp,
                    save : sandbox.stub().resolves()
                });
            })

            it("should return 200" , (done) => {
                chai.request(app)
                .get('/auth/verify/' + otp)
                .end((err , res) => {
                    res.should.have.status(200);
                    expect(res.error).to.be.false;
                    expect(res.text).to.equal("Email Verified Successfully");
                    done();
                })
            })
        });

        describe('verify with database error' , () => {
            const otp = getRandomString() + userData.username;
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    otp : otp,
                    userStatus : USER_STATUS.UNVERIFIED,
                    save : sandbox.stub().rejects()
                });
            })

            it("should return 502" , (done) => {
                chai.request(app)
                .get('/auth/verify/' + otp)
                .end((err , res) => {
                    res.should.have.status(500);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal(ERR_CODES[502]);
                    done();
                })
            })
        })
    });

    describe('/verifyjwt', () => {

        afterEach(() => {
            sandbox.restore();
        });

        describe('verify without token' , () => {
            it("should return 400" , (done) => {
                chai.request(app)
                .post('/auth/verifyjwt')
                .end((err , res) => {
                    res.should.have.status(400);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal('Token not found');
                    done();
                })
            })
        });

        describe('verify with invalid token' , () => {

            before(() => {
                sandbox.stub(jwt , 'verify').returns(new Error());
            })

            after(() => {
                sandbox.restore();
            })
            it("should return 400" , (done) => {
                chai.request(app)
                .post('/auth/verifyjwt')
                .send({
                    jwt : "invalidToken"
                })
                .end((err , res) => {
                    res.should.have.status(400);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal('Invalid Token');
                    done();
                })
            })
        });

        describe('verify with token of unverified user' , () => {
            const unverifiedToken = jwt.sign({
                userStatus : USER_STATUS.UNVERIFIED
            } , process.env.SECRET_KEY);    
            

            after(() => {
                sandbox.restore();
            })
            it("should return 400" , (done) => {
                chai.request(app)
                .post('/auth/verifyjwt')
                .send({
                    jwt : unverifiedToken
                })
                .end((err , res) => {
                    res.should.have.status(400);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal(ERR_CODES[414]);
                    done();
                })
            })
        });

        describe('verify with token of blocked user' , () => {

            const blockedToken = jwt.sign({
                userStatus : USER_STATUS.BLOCKED
            } , process.env.SECRET_KEY);

            it("should return 400" , (done) => {
                chai.request(app)
                .post('/auth/verifyjwt')
                .send({
                    jwt : blockedToken
                })
                .end((err , res) => {
                    res.should.have.status(400);
                    expect(res.error).instanceOf(Object);
                    expect(res.error.text).to.equal(ERR_CODES[415]);
                    done();
                })
            })
        });

        describe('verify with token of valid user' , () => {

            const blockedToken = jwt.sign({
                userStatus : USER_STATUS.VERIFIED
            } , process.env.SECRET_KEY);

            it("should return 200" , (done) => {
                chai.request(app)
                .post('/auth/verifyjwt')
                .send({
                    jwt : blockedToken
                })
                .end((err , res) => {
                    res.should.have.status(200);
                    expect(res.error).to.be.false;
                    expect(res.body).to.have.property('userStatus');
                    done();
                })
            })
        });

    });
    
    describe('/resetpassword' , () => {
        afterEach(() => {
            sandbox.restore();
        })
        describe('wthout email' , () => {
            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/resetpassword')
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal('Email not found');
                        done();
                    })
            })
        });

        describe('database error', () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').rejects();
            })


            it("should return 500" , (done) => {
                chai.request(app)
                    .post('/auth/resetpassword')
                    .send({
                        email : userData.email
                    })
                    .end((err , res) => {
                        res.should.have.status(500);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[502]);
                        done();
                    })
            })
        })

        describe('no user found', () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves(null);
            })

            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/resetpassword')
                    .send({
                        email : userData.email
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal("User not found");
                        done();
                    })
            })
        })

        describe('blocked user' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    userStatus : USER_STATUS.BLOCKED
                });
            })

            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/resetpassword')
                    .send({
                        email : userData.email
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[415]);
                        done();
                    })
            })
        })

        describe('unverified user' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    userStatus : USER_STATUS.UNVERIFIED
                });
            })

            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/resetpassword')
                    .send({
                        email : userData.email
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[414]);
                        done();
                    })
            })
        })

        describe('with correct email' , () => {
            const otp = getRandomString() + userData.username;
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    userStatus : USER_STATUS.VERIFIED,
                    otp : otp,
                    save : sandbox.stub().resolves()
                });
                sandbox.stub(nodemailer , 'createTransport').returns({
                    sendMail : sandbox.stub().resolves()
                });
            })

            it("should return 200" , (done) => {
                chai.request(app)
                    .post('/auth/resetpassword')
                    .send({
                        email : userData.email
                    })
                    .end((err , res) => {
                        res.should.have.status(200);
                        expect(res.error).to.be.false;
                        expect(res.text).to.equal("Email to reset password sent successfully to " + userData.email);
                        done();
                    })
            })
        })

        describe('with email error' , () => {
            const otp = getRandomString() + userData.username;
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    userStatus : USER_STATUS.VERIFIED,
                    otp : otp,
                    save : sandbox.stub().resolves()
                });
                sandbox.stub(nodemailer , 'createTransport').returns({
                    sendMail : sandbox.stub().rejects()
                });
            })

            it("should return 502" , (done) => {
                chai.request(app)
                    .post('/auth/resetpassword')
                    .send({
                        email : userData.email
                    })
                    .end((err , res) => {
                        res.should.have.status(502);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[502]);
                        done();
                    })
            })
        })
    });

    describe('/changepassword' , () => {
        const otp = getRandomString() + userData.username;
        
        afterEach(() => {
            sandbox.restore();
        })
        
        describe('with correct credentials' , () => {

            beforeEach(async() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    password : await passwords.hashPassword(userData.password),
                    save : sandbox.stub().resolves(),
                    otp : otp
                });
            })

            it("should return 200 with complete credentials" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        confirmPassword : userData.password,
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(200);
                        expect(res.error).to.be.false;
                        expect(res.text).to.equal("Password Changed Successfully");
                        done();
                    })
            })

            it("should return 400 with incomplete request body" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal("Invalid Request");
                        done();
                    })
            })

            it("should return 400 with incorrect otp" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        confirmPassword : userData.password,
                        otp : getRandomString() + userData.username
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[412]);
                        done();
                    })
            })
        });

        describe('with incorrect credentials' , () => {
            it("should return 400 with different passwords" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        confirmPassword : "Incorrect@123",
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[409]);
                        done();
                    })
            });

            it("should return 400 with invalid password" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : "invalidPassword",
                        confirmPassword : "invalidPassword",
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.be.a('string');
                        done();
                    })
            });
        })

        describe('with database error' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').rejects();
            })

            it("should return 502" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        confirmPassword : userData.password,
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(502);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[502]);
                        done();
                    })
            })
        });

        describe('with no user found' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves(null);
            })

            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        confirmPassword : userData.password,
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal("User not found");
                        done();
                    })
            })
        });

        describe('with unverified user' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    userStatus : USER_STATUS.UNVERIFIED
                });
            })

            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        confirmPassword : userData.password,
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[414]);
                        done();
                    })
            })
        });

        describe('with blocked user' , () => {
            before(() => {
                sandbox.stub(mongoose.Model , 'findOne').resolves({
                    ...userData,
                    userStatus : USER_STATUS.BLOCKED
                });
            })

            it("should return 400" , (done) => {
                chai.request(app)
                    .post('/auth/changepassword')
                    .send({
                        email : userData.email,
                        password : userData.password,
                        confirmPassword : userData.password,
                        otp : otp
                    })
                    .end((err , res) => {
                        res.should.have.status(400);
                        expect(res.error).instanceOf(Object);
                        expect(res.error.text).to.equal(ERR_CODES[415]);
                        done();
                    })
            })
        });

    });
    
})
