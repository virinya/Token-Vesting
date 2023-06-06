# Name 
Token Vesting 
# Token-Vesting description
- This contract was designed to distribute token to all shareholders monthy. 
- The claim limit each month will be calculated according to the distributionPercent that would be input when the contract is deployed.
- The assignment stated that information of shareholders will be recorded one by one, 
therefore,  I assume that each shareholders would not get the same amount of token and the token will be distributed equally in percent, not in amount.
- Given in the assignment that shareholers can withdraw "up to" XXX amount of token each month,
thus, if shareholders do not claim the maximam amount of token, the remaining token could be claimed next month.

# install
npm i 

# compile
npx hardhat compile  

# run test script
npx hardhat test test/TokenVesting.ts    

