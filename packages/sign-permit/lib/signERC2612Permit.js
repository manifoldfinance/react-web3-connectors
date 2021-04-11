const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

async function signERC2612Permit(web3, token, owner, spender, value, deadline, nonce) {
  const message = {
    owner,
    spender,
    value,
    nonce: nonce || (await web3.contract('pair', token).methods.nonces(owner).call()),
    deadline: deadline || MAX_INT,
  };

  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name: await web3.contract('erc20', token).methods.name().call(),
      version: '1',
      chainId: 1,
      verifyingContract: token,
    },
    message: message,
  };

  return new Promise((resolutionFunc, rejectionFunc) => {
    web3.currentProvider.sendAsync(
      { method: 'eth_signTypedData_v4', params: [owner, JSON.stringify(typedData)], from: owner },
      function (error, result) {
        if (!error) {
          const signature = result.result.substring(2);
          const r = '0x' + signature.substring(0, 64);
          const s = '0x' + signature.substring(64, 128);
          const v = parseInt(signature.substring(128, 130), 16);
          resolutionFunc({ r, s, v, deadline: message.deadline });
        }
      },
    );
  });
}
