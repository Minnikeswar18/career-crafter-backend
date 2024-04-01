const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
// const rewire = require('rewire');

const sandbox = require('sinon').createSandbox();

const {USER_STATUS} = require('../db/models/user/model');
const {ERR_CODES} = require('../helpers/constants');

const app = require('../app');

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
                // const comparePasswordStub = sandbox.stub().resolves(true);
                // passwords.__set__('comparePassword' , comparePasswordStub);
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
        
    })

    // describe('/register' , () => {
    //     const credentials = {
    //         email : userData.email,
    //         password : userData.password,
    //         username : userData.username,
    //         isRecruiter : userData.isRecruiter,
    //         confirmPassword : userData.password
    //     }

    //     afterEach(() => {
    //         sandbox.restore();
    //     });

    //     describe('registering with correct credentials' , () => {

    //         before(() => {
    //             sandbox.stub(mongoose.Model , 'findOne').resolves(null);
    //         })

    //         it("should return 200 with complete credentials" , (done) => {
    //             chai.request(app)
    //                 .post('/auth/register')
    //                 .send(credentials)
    //                 .end((err , res) => {
    //                     res.should.have.status(200);
    //                     expect(res.error).to.be.false;
    //                     expect(res.body.message).to.equal("Registration Successful");
    //                     done();
    //                 })
    //         })

    //     })
    // })       

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

        // describe('verify with invalid token' , () => {

        //     before(() => {
        //         sandbox.stub(jwt , 'verify').returns(new Error());
        //     })

        //     after(() => {
        //         sandbox.restore();
        //     })
        //     it("should return 400" , (done) => {
        //         chai.request(app)
        //         .post('/auth/verifyjwt')
        //         .send({
        //             jwt : "invalidToken"
        //         })
        //         .end((err , res) => {
        //             res.should.have.status(400);
        //             expect(res.error).instanceOf(Object);
        //             expect(res.error.text).to.equal('Invalid Token');
        //             done();
        //         })
        //     })
        // });

    });

    describe('/changepassword' , () => {
        const otp = getRandomString() + userData.username;
        beforeEach(async() => {
            sandbox.stub(mongoose.Model , 'findOne').resolves({
                ...userData,
                password : await passwords.hashPassword(userData.password),
                save : sandbox.stub().resolves(),
                otp : otp
            });
        })

        afterEach(() => {
            sandbox.restore();
        })

        describe('change password with correct credentials' , () => {

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
    })
    
})
