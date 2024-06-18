pragma solidity 0.5.16;

contract Election {
    //objet candidat
   struct Candidate{
        uint id;
        string  name;
        uint voteCount;
   }
   event votedEvent (
        uint indexed _candidateId
    );
    // recuperer le candidats
    mapping(uint =>Candidate) public candidates;
    //le nombre total de candidat
    uint public candidatesCount;

    constructor() public {
    }
    function addCandidate(string memory _name) public{
    candidatesCount++;
    candidates[candidatesCount] = Candidate(candidatesCount,_name,0);
    }
    mapping(address => bool) public voters;
//    function vote (uint _candidateId) public {
//         // require that they haven't voted before
//         require(!voters[msg.sender]);

//         // require a valid candidate
//         require(_candidateId > 0 && _candidateId <= candidatesCount);

//         // record that voter has voted
//         voters[msg.sender] = true;

//         // update candidate vote Count
//         candidates[_candidateId].voteCount ++;
//     }
function vote (uint _candidateId) public {
    // require that they haven't voted before
    require(!voters[msg.sender], "You have already voted.");

    // require a valid candidate
    require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate.");

    // record that voter has voted
    voters[msg.sender] = true;

    // update candidate vote Count
    candidates[_candidateId].voteCount ++;

    emit votedEvent(_candidateId);
}

}
