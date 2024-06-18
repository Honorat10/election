var host = window.location.hostname; // Obtient l'adresse IP ou le nom d'hôte

App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // Si une instance web3 est déjà fournie par MetaMask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Spécifiez l'instance par défaut si aucune instance web3 n'est fournie
      var providerUrl = 'http://' + '192.168.43.208' + ':7545'; // Utilisez l'adresse IP de la machine hôte
      App.web3Provider = new Web3.providers.HttpProvider(providerUrl);
      web3 = new Web3(App.web3Provider);
    }
    
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("./Election.json", function(election) {
      // Instanciez un nouveau contrat Truffle à partir de l'artéfact
      App.contracts.Election = TruffleContract(election);
      // Connectez le fournisseur pour interagir avec le contrat
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();
      return App.render();
    });
  },

  listenForEvents: function() { 
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Rechargez lorsque un nouveau vote est enregistré
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Chargez les données de compte
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    if (window.ethereum) {
      if (window.ethereum._metamask) {
        if (window.ethereum._metamask.isUnlocked()) {
          window.ethereum.request({ method: 'eth_requestAccounts' }).then(function(accounts) {
            App.account = accounts[0];
            $("#accountAddress").html("Your Account: " + accounts[0]);
          }).catch(function(err) {
            console.error(err);
          });
        } else {
          console.error("MetaMask is locked. Please unlock MetaMask to proceed.");
        }
      } else {
        console.error("MetaMask extension not detected.");
      }
    } else {
      console.error("MetaMask is not installed.");
    }

    // Chargez les données du contrat
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();
      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Affichez le résultat du candidat
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
          candidatesResults.append(candidateTemplate);

          // Ajoutez les candidats au menu déroulant
          var candidateOption = '<option value="' + id + '">' + name + '</option>';
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Ne permettez pas à un utilisateur de voter à nouveau
      if (hasVoted) {
        $('form').hide();
      }
      
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Attendez la mise à jour des votes
      $("#content").hide();
      $("#loader").show();
      return App.render();

    }).catch(function(err) {
      console.error(err);
    });
  },

  create: function() {
    var name = $('#candidatesName').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addCandidate(name, { from: App.account });
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
