// Set environment variable 
process.env.OPENSHIFT_DATA_DIR = '/tmp/log';

var request = require('supertest'), 
should = require('should'),
app = require('../index.js'),
nodeo = require('nodeo'),
utils = nodeo.utils,
one_chromosome = { "string": "101101101101",
		   "fitness": 0 },
great_chromosome = { "string": "whatever",
		     "fitness": 60 };

describe( "Empty cache", function() {
    it('Should be really empty', function( done ) {
	request(app)
	    .get('/random')
	    .expect(404)
	    .end( function( error, resultado ) {
		resultado.body.should.have.property('No chromosomes');
	    });
	done();
    });
});

describe( "Loads configuration correctly", function() {
    it('Should set repo correctly', function( done ) {
	app.config.should.have.property('repository', "https://github.com/JJ/splash-volunteer");
	done();
    });
    it('Should have loaded config info correctly', function( done ) {
	app.config['vars'].should.have.property('traps',50);
	done();
    });
});

describe( "Loads termination correctly", function() {
    it('Should terminate when needed', function( done ) {
	app.is_solution(great_chromosome.string,null).should.not.be.ok;
	app.is_solution(great_chromosome.string,great_chromosome.fitness).should.be.ok;
	done();
    });
});

describe( "Puts and returns chromosome", function() {
    var chromosomes = new Array;

    it('should generate random chromosomes', function(done) {
	for ( var i = 0; i < app.config.vars.cache_size; i++ ) {
	    chromosomes.push( utils.random( 16 ) );
	}
	chromosomes.length.should.be.equal( app.config.vars.cache_size );
	done();
    });

    it('should put chromosomes and return correct type', function (done) {
	var chromosome = utils.random(16);
	request(app)
	    .put('/one/'+chromosome+"/"+utils.max_ones(chromosome))
	    .expect('Content-Type', /json/)
	    .expect(200)	
	    .end( function ( error, resultado ) {
		    if ( error ) {
			return done( error );
		    }
		    resultado.body.should.have.property('length');
	    });

	// Already one in cache
	chromosomes.forEach( function( chromosome ) {
	    request(app)
		.put('/one/'+chromosome+"/"+utils.max_ones(chromosome))
		.expect(200)
		.end( function ( error, resultado ) {
		    if ( error ) {
			return done( error );
		    }
		    resultado.body.should.have.property('length');
		    resultado.body.should.have.property('chromosome');
		    resultado.body.should.have.property('updated');
		});
	});
	done();
    });

    it('should return random chromosome', function (done) {
    	request(app)
    	    .get('/random')
    	    .expect('Content-Type', /json/)
    	    .expect(200)
    	    .end( function ( error, resultado ) {
    		if ( error ) {
    		    return done( error );
    		}
    		resultado.body.should.have.property('chromosome');
    		done();
    	    });
    });
    
    it('should return all chromosomes', function (done) {
	request(app)
	    .get('/chromosomes')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.be.instanceof(Object);
		done();
	    });
    });
    it('should return IPs', function (done) {
	request(app)
	    .get('/IPs')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.be.instanceof(Object);
		done();
	    });
    });
    
    it('should return sequence number', function (done) {
	request(app)
	    .get('/seq_number')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.have.property("number",0);
		done();
	    });
    });
    
});

describe( "Test IP cache", function() {
    it('Should update only if not repeated', function (done) {
	var chromosome = utils.random( 16 ),
	fitness = utils.max_ones( chromosome );
	request(app)
	    .put('/one/'+chromosome+"/"+fitness)
	    .expect('Content-Type', /json/)
	    .end(function (err, result) {
		result.body.should.have.property('updated',true);
	    });
	request(app)
	    .put('/one/'+chromosome+"/"+fitness)
	    .expect('Content-Type', /json/)
	    .end(function (err, result) {
		result.body.should.have.property('updated',false);
	    });
	done();

    });
});

describe( "Stress-tests cache", function() {
    it('Should include many requests correctly', function (done) {
	for ( var i = 0; i < 200; i ++ ) {
	    var chromosome = utils.random( 16 ),
	    fitness = utils.max_ones( chromosome );
	    request(app)
		.put('/one/'+chromosome+"/"+fitness)
		.expect('Content-Type', /json/)
	    .end(function (err, result) {
		result.body.should.have.property('length');
	    });
	}
	done();

    });

    it('should return all chromosomes', function (done) {
	request(app)
	    .get('/chromosomes')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.be.instanceof(Object);
		Object.keys(resultado.body).length.should.be.above( app.config.vars.cache_size -1 );
		done();
	    });
    });

    
});
    
describe( "Check restart", function() {
    it('Should find the winner', function (done) {
	var fitness = app.config.vars.traps*4;
	var chromosome="1".repeat(fitness);
	request(app)
	    .put('/one/'+chromosome+"/"+fitness).expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, result ) {
		result.body.should.have.property('length',0);
		done();
	    });
    });
});
