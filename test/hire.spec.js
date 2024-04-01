const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const mongoose = require('mongoose');
const sandbox = require('sinon').createSandbox();
const { USER_STATUS } = require('../db/models/user/model');
const jwt = require('jsonwebtoken');
const {Invitation} = require('../db/models/invitation/model')
const nodemailer = require('nodemailer');
const { ERR_CODES } = require('../helpers/constants');

chai.use(chaiHttp);
chai.should();

describe('/hire', () => {
    const userData = {
        id : "abc123",
        email : "email@email.com",
        password : "Password@123",
        username : "username",
        isRecruiter : true,
        userStatus : USER_STATUS.VERIFIED,
        loginTime : Date.now()
    }
    const token = jwt.sign(userData, process.env.SECRET_KEY, {expiresIn : Number(process.env.JWT_TIMEOUT)});

    describe('/getFreelancers', () => { 
        describe('no database error', () => {
            before(async() => {
                sandbox.stub(mongoose.Model, 'find').resolves([userData]);
            })
        
            after(() => {
                sandbox.restore();
            })
        
            it('should return freelancers with 200 status', (done) => {
                chai.request(app)
                    .get('/hire/getFreelancers')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        done();
                    });
            });
        })

        describe('database error', () => {
            before(async() => {
                sandbox.stub(mongoose.Model, 'find').rejects();
            })
        
            after(() => {
                sandbox.restore();
            })
        
            it('should return freelancers with 500 status', (done) => {
                chai.request(app)
                    .get('/hire/getFreelancers')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.eq(ERR_CODES[502]);
                        done();
                    });
            });
        })
    });
    
    describe('/invite', () => {
        const invitationData = {
            companyName : "companyName",
            jobTitle : "jobTitle",
            jobScope : "Small",
            jobType : "Full Time",
            jobMode : "Work from Office",
            jobSalary : "100",
            jobDescription : "jobDescription",
            salaryType : "Hourly rate (/hr)",
            inviteeEmail : "example@example.com",
            inviteeUsername : "inviteeUsername",
        }

        before(async() => {
            sandbox.stub(Invitation.prototype, 'save').resolves({});
            sandbox.stub(nodemailer, 'createTransport').returns({
                sendMail : sandbox.stub().resolves({})
            })
        })

        it('should return 200', (done) => {
            chai.request(app)
                .post('/hire/invite')
                .set('Authorization', `Bearer ${token}`)
                .send({invitation : invitationData , inviteeId : "abc123"})
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should return 400 for missing request body', (done) => {
            chai.request(app)
                .post('/hire/invite')
                .set('Authorization', `Bearer ${token}`)
                .send({inviteeId : "abc123"})
                .end((err, res) => {
                    res.should.have.status(400);
                    res.error.text.should.be.a('string');
                    res.error.text.should.be.eq("Bad Request");
                    done();
                });
        });

        it('should return 400 for invalid invitation', (done) => {
            chai.request(app)
                .post('/hire/invite')
                .set('Authorization', `Bearer ${token}`)
                .send({inviteeId : "abc123" , invitation : {}})
                .end((err, res) => {
                    res.should.have.status(400);
                    res.error.text.should.be.a('string');
                    done();
                });
        });

        describe('database error', () => {
            before(async() => {
                sandbox.restore();
                sandbox.stub(Invitation.prototype, 'save').rejects();
                sandbox.stub(nodemailer, 'createTransport').returns({
                    sendMail : sandbox.stub().resolves({})
                })
            })

            after(() => {
                sandbox.restore();
            });
        
            it('should return 500', (done) => {
                chai.request(app)
                    .post('/hire/invite')
                    .set('Authorization', `Bearer ${token}`)
                    .send({invitation : invitationData , inviteeId : "abc123"})
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.eq(ERR_CODES[502]);
                        done();
                    });
            });
        });

        describe('server error', () => {
            before(async() => {
                sandbox.restore();
                sandbox.stub(Invitation.prototype, 'save').resolves();
                sandbox.stub(nodemailer, 'createTransport').returns({
                    sendMail : sandbox.stub().rejects()
                })
            })

            after(() => {
                sandbox.restore();
            });
        
            it('should return 500', (done) => {
                chai.request(app)
                    .post('/hire/invite')
                    .set('Authorization', `Bearer ${token}`)
                    .send({invitation : invitationData , inviteeId : "abc123"})
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.eq(ERR_CODES[501]);
                        done();
                    });
            });
        });

    });

    describe('/getInvitations' , () => {

        describe('no database error', () => {

            beforeEach(() => {
                sandbox.stub(Invitation, 'find').resolves([userData]);
            });

            afterEach(() => {
                sandbox.restore();
            });

            it('should return 200', (done) => {
                chai.request(app)
                    .get('/hire/getInvitations')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        done();
                    });
            });

        });
        
        describe('with database error', () => {

            beforeEach(() => {
                sandbox.stub(Invitation, 'find').rejects([]);
            });

            afterEach(() => {
                sandbox.restore();
            });

            it('should return 500', () => {
                chai.request(app)
                    .get('/hire/getInvitations')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.eq(ERR_CODES[502]);
                    });
            });

        });
    });

    describe('/deleteInvitation/:invitationId?', () => {
        describe('without query params', () => {
            it('should return 400', (done) => {
                chai.request(app)
                    .delete('/hire/deleteInvitation')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err , res) => {
                        res.should.have.status(400);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.eq("Bad Request");
                        done();
                    })
            })
        })

        describe('with query params', () => {
            before(() => {
                sandbox.stub(mongoose.Model, 'deleteOne').resolves({});
            })

            after(() => {
                sandbox.restore();
            })

            it('should return 200', (done) => {
                chai.request(app)
                    .delete('/hire/deleteInvitation/abc123')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err , res) => {
                        res.should.have.status(200);
                        res.text.should.be.a('string');
                        res.text.should.be.eq("Invitation Deleted Successfully");
                        done();
                    })
            })
        })

        describe('with database error', () => {
            before(() => {
                sandbox.stub(mongoose.Model, 'deleteOne').rejects({});
            })

            after(() => {
                sandbox.restore();
            })

            it('should return 500', (done) => {
                chai.request(app)
                    .delete('/hire/deleteInvitation/abc123')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err , res) => {
                        res.should.have.status(500);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.eq(ERR_CODES[502]);
                        done();
                    })
            })
        })
    });

    describe('/inviteToChat', () => {
        describe('without body params', () => {
            it('should return 400', (done) => {
                chai.request(app)
                    .post('/hire/inviteToChat')
                    .set('Authorization', `Bearer ${token}`)
                    .end((err , res) => {
                        res.should.have.status(400);
                        res.error.text.should.be.a('string');
                        res.error.text.should.be.eq("Bad Request");
                        done();
                    })
            })
        });

        describe('with body params', () => {
            const dest = {
                inviteeEmail : "inviteeEmail",
                inviteeUsername : "inviteeUsername"
            }

            describe('with error in invite to invitee', () => {
                before(() => {
                    sandbox.stub(nodemailer, 'createTransport').returns({
                        sendMail : sandbox.stub().rejects({})
                    })
                })

                after(() => {
                    sandbox.restore();
                })

                it('should return 500', (done) => {
                    chai.request(app)
                        .post('/hire/inviteToChat')
                        .set('Authorization', `Bearer ${token}`)
                        .send({dest})
                        .end((err , res) => {
                            res.should.have.status(500);
                            res.error.text.should.be.a('string');
                            res.error.text.should.be.eq(`Error sending chat invite to ${dest.inviteeUsername}`);
                            done();
                        })
                })
            });

            describe('with error in invite to inviter', () => {
                before(() => {
                    sandbox.stub(nodemailer, 'createTransport').returns({
                        sendMail : sandbox.stub().callsFake((mailOptions) => {
                            if(mailOptions.to === userData.email){
                                return Promise.reject({});
                            }
                            return Promise.resolve({});
                        })
                    })
                })

                after(() => {
                    sandbox.restore();
                })

                it('should return 500', (done) => {
                    chai.request(app)
                        .post('/hire/inviteToChat')
                        .set('Authorization', `Bearer ${token}`)
                        .send({dest})
                        .end((err , res) => {
                            res.should.have.status(500);
                            res.error.text.should.be.a('string');
                            res.error.text.should.be.eq(`Error sending chat invite to ${userData.username}`);
                            done();
                        })
                })
            });

            describe("without error", () => {
                before(() => {
                    sandbox.stub(nodemailer, 'createTransport').returns({
                        sendMail : sandbox.stub().resolves({})
                    })
                })

                after(() => {
                    sandbox.restore();
                })

                it('should return 200', (done) => {
                    chai.request(app)
                        .post('/hire/inviteToChat')
                        .set('Authorization', `Bearer ${token}`)
                        .send({dest})
                        .end((err , res) => {
                            res.should.have.status(200);
                            res.text.should.be.a('string');
                            res.text.should.be.eq("Chat Invite Sent Successfully");
                            done();
                        })
                })
            });

        });
    });
});