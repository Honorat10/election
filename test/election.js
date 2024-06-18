var Election = artifacts.require("./Election.sol");

contract("Election", function(accounts){
    it("initializes with two candidates", function() {
        return Election.deployed().then(function(instance) {
          return instance.candidatesCount();
        }).then(function(count) {
          assert.equal(count, 2);
        });
      });


      it("it initializes the candidates with the correct values", function() {
        return Election.deployed().then(function(instance) {
          electionInstance = instance;
          return electionInstance.candidates(1);
        }).then(function(candidate) {
          assert.equal(candidate[0], 1, "contains the correct id");
          assert.equal(candidate[1], "Honorat", "contains the correct name");
          assert.equal(candidate[2], 0, "contains the correct votes count");
          return electionInstance.candidates(2);
        }).then(function(candidate) {
          assert.equal(candidate[0], 2, "contains the correct id");
          assert.equal(candidate[1], "Irené", "contains the correct name");
          assert.equal(candidate[2], 0, "contains the correct votes count");
        });
      });
      it("allows a voter to cast a vote", function() {
        return Election.deployed().then(function(instance) {
          electionInstance = instance;
          candidateId = 1;
          return electionInstance.vote(candidateId, { from: accounts[0] });
        }).then(function(receipt) {
          assert.equal(receipt.logs.length, 1, "an event was triggered");
          assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
          assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
          return electionInstance.voters(accounts[0]);
        }).then(function(voted) {
          assert(voted, "the voter was marked as voted");
          return electionInstance.candidates(candidateId);
        }).then(function(candidate) {
          var voteCount = candidate[2];
          assert.equal(voteCount, 1, "increments the candidate's vote count");
        })
      });
      it("throws an exception for invalid candidates", function() {
        return Election.deployed().then(function(instance) {
          electionInstance = instance;
          return electionInstance.vote(99, { from: accounts[1] })
        }).then(assert.fail).catch(function(error) {
          assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
          return electionInstance.candidates(1);
        }).then(function(candidate1) {
          var voteCount = candidate1[2];
          assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
          return electionInstance.candidates(2);
        }).then(function(candidate2) {
          var voteCount = candidate2[2];
          assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
        });
      });
      it("throws an exception for double voting", async function() {
        const instance = await Election.deployed();
        const candidateId = 2;
      
        // Première tentative de vote
        await instance.vote(candidateId, { from: accounts[1] });
      
        try {
          // Deuxième tentative de vote avec le même compte
          await instance.vote(candidateId, { from: accounts[1] });
          // Si le deuxième vote réussit sans erreur, le test échoue
          assert.fail("Expected an exception");
        } catch (error) {
          // Vérifie que l'erreur contient bien "revert"
          assert(error.message.includes("revert"), "error message must contain revert");
        }
      
        // Vérifie que les votes sont corrects après la tentative de double vote
        const candidate1 = await instance.candidates(1);
        assert.equal(candidate1[2].toNumber(), 1, "candidate 1 did not receive any votes");
      
        const candidate2 = await instance.candidates(2);
        assert.equal(candidate2[2].toNumber(), 1, "candidate 2 did not receive any votes");
      });
    
       
     
});

